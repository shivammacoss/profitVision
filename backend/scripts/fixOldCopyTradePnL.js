import mongoose from 'mongoose'
import dotenv from 'dotenv'
import CopyTrade from '../models/CopyTrade.js'
import Trade from '../models/Trade.js'
import TradingAccount from '../models/TradingAccount.js'
import CopyFollower from '../models/CopyFollower.js'
import Wallet from '../models/Wallet.js'
import CreditLedger from '../models/CreditLedger.js'
import CreditRefillLedger from '../models/CreditRefillLedger.js'
import MasterTrader from '../models/MasterTrader.js'

dotenv.config()

/**
 * PRODUCTION FIX: Recalculate old copy trade P&L and fix credit/wallet
 * 
 * PROBLEM: Before the fix, copy trade closures did not process credit/wallet updates.
 * Credit stayed at $1000 even after losses. Wallet was never auto-refilled.
 * 
 * THIS SCRIPT:
 * 1. Finds all closed copy trades where credit was NOT processed (refillAction is null)
 * 2. Replays each trade through the credit system in chronological order
 * 3. Deducts losses from credit, auto-refills from wallet
 * 4. Credits profits (with master share split)
 * 5. Creates ledger entries for audit trail
 * 
 * SAFE: Runs in DRY RUN mode by default. Set DRY_RUN=false to apply.
 */

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/profitvision'
const DRY_RUN = process.argv.includes('--apply') ? false : true

async function getContractSize(symbol) {
  if (symbol === 'XAUUSD') return 100
  if (symbol === 'XAGUSD') return 5000
  if (['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BCHUSD'].includes(symbol)) return 1
  return 100000
}

function calculateRawPnl(trade) {
  const contractSize = trade.contractSize || getContractSize(trade.symbol)
  if (trade.side === 'BUY') {
    return (trade.closePrice - trade.openPrice) * trade.quantity * contractSize
  } else {
    return (trade.openPrice - trade.closePrice) * trade.quantity * contractSize
  }
}

async function fixOldCopyTrades() {
  console.log('\n🚀 Copy Trade P&L Correction Script')
  console.log(`Mode: ${DRY_RUN ? '⚠️  DRY RUN (use --apply to save changes)' : '🔴 LIVE - Changes will be saved!'}\n`)

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to database\n')

  // Step 1: Dump ALL closed copy trades first to see their state
  const allClosed = await CopyTrade.find({ status: 'CLOSED' }).populate('followerTradeId').sort({ closedAt: 1 })
  console.log(`📊 Total closed copy trades in DB: ${allClosed.length}`)
  
  for (const ct of allClosed) {
    const trade = ct.followerTradeId
    const pnl = trade ? calculateRawPnl(trade) - (trade.swap || 0) : 'N/A'
    console.log(`   CopyTrade ${ct._id}: rawPnl=${ct.rawPnl}, creditChange=${ct.creditChange}, refillAction=${ct.refillAction}, tradePnl=${typeof pnl === 'number' ? pnl.toFixed(2) : pnl}`)
  }
  console.log('')

  // Step 2: Find ALL closed copy trades and reprocess from scratch
  // We reset credit to initialDeposit and replay all trades
  const unprocessedCopyTrades = allClosed.filter(ct => ct.followerTradeId)

  console.log(`📊 Found ${unprocessedCopyTrades.length} copy trades to reprocess\n`)

  if (unprocessedCopyTrades.length === 0) {
    console.log('✅ No copy trades found to fix!')
    process.exit(0)
  }

  // Group by follower account for sequential processing
  const byAccount = {}
  for (const ct of unprocessedCopyTrades) {
    const accId = ct.followerAccountId.toString()
    if (!byAccount[accId]) byAccount[accId] = []
    byAccount[accId].push(ct)
  }

  console.log(`📋 Accounts to fix: ${Object.keys(byAccount).length}\n`)
  console.log('='.repeat(80))

  let totalCreditChange = 0
  let totalWalletChange = 0
  let totalTradesFixed = 0

  for (const [accountId, copyTrades] of Object.entries(byAccount)) {
    const account = await TradingAccount.findById(accountId)
    if (!account) {
      console.log(`⚠️  Account ${accountId} not found, skipping`)
      continue
    }

    const follower = await CopyFollower.findOne({ followerAccountId: accountId, status: { $in: ['ACTIVE', 'PAUSED', 'STOPPED'] } })
    if (!follower) {
      console.log(`⚠️  No CopyFollower for account ${accountId}, skipping`)
      continue
    }

    const userId = follower.followerId
    const wallet = await Wallet.findOne({ userId })
    const minimumCredit = follower.initialDeposit || 1000

    console.log(`\n🔧 Account: ${account.accountId} (${accountId})`)
    console.log(`   User: ${userId}`)
    console.log(`   Current Credit: $${(account.credit || 0).toFixed(2)}`)
    console.log(`   Current Wallet: $${(wallet?.balance || 0).toFixed(2)}`)
    console.log(`   Minimum Credit: $${minimumCredit}`)
    console.log(`   Trades to process: ${copyTrades.length}`)
    console.log('')

    // IMPORTANT: Reset credit to initialDeposit and replay ALL trades from scratch
    // Current credit ($1000) is wrong because losses were never deducted
    // We start from the deposit amount and apply all P&L sequentially
    const originalCredit = follower.initialDeposit || 1000
    const originalWallet = (wallet?.balance || 0)
    
    // Add back any previous COPY_CREDIT_REFILL wallet deductions (they were based on wrong data)
    // We'll recalculate them fresh
    let runningCredit = originalCredit
    let runningWallet = originalWallet
    let accountCreditChange = 0
    let accountWalletChange = 0
    
    console.log(`   📌 Starting from: Credit=$${runningCredit.toFixed(2)}, Wallet=$${runningWallet.toFixed(2)}`)

    for (const copyTrade of copyTrades) {
      const trade = copyTrade.followerTradeId
      if (!trade || !trade.closePrice) {
        console.log(`   ⚠️  CopyTrade ${copyTrade._id}: No valid trade data, skipping`)
        continue
      }

      // Calculate correct P&L (realizedPnlForBalance = rawPnl - swap)
      const rawPnl = calculateRawPnl(trade)
      const swap = trade.swap || 0
      const correctPnl = rawPnl - swap // This is realizedPnlForBalance

      console.log(`   📌 Trade ${trade.tradeId || trade._id} (${trade.symbol} ${trade.side})`)
      console.log(`      Open: ${trade.openPrice}, Close: ${trade.closePrice}, Qty: ${trade.quantity}`)
      console.log(`      Correct P&L: $${correctPnl.toFixed(2)}`)

      if (correctPnl < 0) {
        // ========== LOSS ==========
        const lossAmount = Math.abs(correctPnl)
        const creditBefore = runningCredit
        let creditAfter = Math.max(0, creditBefore - lossAmount)
        const actualDeduction = creditBefore - creditAfter
        let walletRefillAmount = 0

        console.log(`      LOSS: -$${lossAmount.toFixed(2)} → Credit: $${creditBefore.toFixed(2)} → $${creditAfter.toFixed(2)}`)

        // Auto-refill from wallet if credit below minimum
        if (creditAfter < minimumCredit && runningWallet > 0) {
          const deficit = minimumCredit - creditAfter
          walletRefillAmount = Math.min(deficit, runningWallet)
          creditAfter += walletRefillAmount
          runningWallet -= walletRefillAmount
          console.log(`      AUTO-REFILL: $${walletRefillAmount.toFixed(2)} from wallet → Credit: $${creditAfter.toFixed(2)}, Wallet: $${runningWallet.toFixed(2)}`)
        }

        runningCredit = creditAfter
        accountCreditChange += (creditAfter - creditBefore)
        accountWalletChange -= walletRefillAmount

        if (!DRY_RUN) {
          // Update CopyTrade record only (wallet/credit set at end)
          await CopyTrade.findByIdAndUpdate(copyTrade._id, {
            $set: {
              rawPnl: correctPnl,
              followerPnl: correctPnl,
              masterPnl: 0,
              creditBefore: creditBefore,
              creditAfter: creditAfter,
              creditChange: creditAfter - creditBefore,
              walletCredited: -walletRefillAmount,
              refillAction: walletRefillAmount > 0 ? 'LOSS_WITH_WALLET_REFILL' : 'LOSS_DEDUCTED',
              deficitAfter: Math.max(0, minimumCredit - creditAfter),
              commissionApplied: true
            }
          })
        }
      } else if (correctPnl > 0) {
        // ========== PROFIT ==========
        const master = await MasterTrader.findById(copyTrade.masterId)
        const sharePercentage = master?.approvedCommissionPercentage || 50
        const masterShare = correctPnl * (sharePercentage / 100)
        const followerShare = correctPnl - masterShare

        const creditBefore = runningCredit
        let profitToCredit = 0, profitToWallet = 0
        let creditAfter = creditBefore
        let refillAction = 'PROFIT_TO_WALLET'

        if (creditBefore < minimumCredit) {
          // Refill mode - profit goes to credit first
          const deficit = minimumCredit - creditBefore
          if (followerShare >= deficit) {
            profitToCredit = deficit
            profitToWallet = followerShare - deficit
            creditAfter = minimumCredit
            refillAction = 'REFILL_COMPLETE'
          } else {
            profitToCredit = followerShare
            profitToWallet = 0
            creditAfter = creditBefore + followerShare
            refillAction = 'PROFIT_REFILL'
          }
        } else {
          profitToWallet = followerShare
        }

        runningCredit = creditAfter
        runningWallet += profitToWallet
        accountCreditChange += (creditAfter - creditBefore)
        accountWalletChange += profitToWallet

        console.log(`      PROFIT: +$${correctPnl.toFixed(2)} → Master: $${masterShare.toFixed(2)}, Follower: $${followerShare.toFixed(2)}`)
        console.log(`      Credit: $${profitToCredit.toFixed(2)}, Wallet: $${profitToWallet.toFixed(2)}`)

        if (!DRY_RUN) {
          // Update CopyTrade record only (wallet/credit set at end)
          await CopyTrade.findByIdAndUpdate(copyTrade._id, {
            $set: {
              rawPnl: correctPnl,
              followerPnl: followerShare,
              masterPnl: masterShare,
              creditBefore: creditBefore,
              creditAfter: creditAfter,
              creditChange: creditAfter - creditBefore,
              walletCredited: profitToWallet,
              refillAction: refillAction,
              profitToCredit: profitToCredit,
              profitToWallet: profitToWallet,
              deficitAfter: Math.max(0, minimumCredit - creditAfter),
              commissionApplied: true
            }
          })
        }
      }

      totalTradesFixed++
    }

    // Calculate net wallet change (runningWallet was modified during replay)
    const walletDelta = runningWallet - originalWallet
    
    totalCreditChange += (runningCredit - originalCredit)
    totalWalletChange += walletDelta

    console.log(`\n   📊 Account Summary:`)
    console.log(`      Credit: $${originalCredit.toFixed(2)} → $${runningCredit.toFixed(2)} (replayed from initial deposit)`)
    console.log(`      Wallet: $${originalWallet.toFixed(2)} → $${runningWallet.toFixed(2)} (delta: $${walletDelta.toFixed(2)})`)

    // Apply final balances
    if (!DRY_RUN) {
      // SET credit to replayed value
      await TradingAccount.findByIdAndUpdate(account._id, { $set: { credit: runningCredit } })
      
      // SET wallet to replayed value (apply delta)
      if (walletDelta !== 0) {
        await Wallet.findOneAndUpdate({ userId }, { $inc: { balance: walletDelta } })
      }
      
      await CopyFollower.findByIdAndUpdate(follower._id, {
        $set: {
          currentCredit: runningCredit,
          creditDeficit: Math.max(0, minimumCredit - runningCredit),
          isRefillMode: runningCredit < minimumCredit
        }
      })

      // Create single correction ledger entry
      await CreditLedger.create({
        userId, tradingAccountId: account._id, type: 'ADMIN_CREDIT',
        amount: runningCredit - originalCredit,
        balanceAfter: runningCredit,
        description: `[CORRECTION] P&L replay: Credit $${originalCredit} → $${runningCredit.toFixed(2)}, Wallet delta: $${walletDelta.toFixed(2)}`,
        metadata: { correctionScript: true, tradesReprocessed: copyTrades.length, originalCredit, finalCredit: runningCredit, walletDelta }
      })

      console.log(`      ✅ APPLIED`)
    } else {
      console.log(`      ⏭️  DRY RUN - not applied`)
    }
    console.log('')
  }

  // Final report
  console.log('\n' + '='.repeat(80))
  console.log('📋 FINAL REPORT')
  console.log('='.repeat(80))
  console.log(`Trades Fixed: ${totalTradesFixed}`)
  console.log(`Total Credit Change: $${totalCreditChange.toFixed(2)}`)
  console.log(`Total Wallet Change: $${totalWalletChange.toFixed(2)}`)
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No changes saved. Run with --apply to save changes:')
    console.log('   node scripts/fixOldCopyTradePnL.js --apply\n')
  } else {
    console.log('\n✅ ALL CORRECTIONS APPLIED SUCCESSFULLY!\n')
  }

  process.exit(0)
}

fixOldCopyTrades().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
