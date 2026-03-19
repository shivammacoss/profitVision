import mongoose from 'mongoose'

/**
 * ManualCryptoWallet - Admin-configured crypto wallets for manual deposits
 * Users can pay to these wallets and submit transaction hash for verification
 */
const manualCryptoWalletSchema = new mongoose.Schema({
  // Wallet details
  currency: {
    type: String,
    required: true,
    enum: ['USDT', 'BTC', 'ETH', 'BNB', 'TRX', 'LTC', 'DOGE', 'SOL']
  },
  network: {
    type: String,
    required: true,
    enum: ['TRC20', 'ERC20', 'BEP20', 'Bitcoin', 'Ethereum', 'Solana', 'Litecoin', 'Dogecoin']
  },
  address: {
    type: String,
    required: true
  },
  
  // QR Code (base64 or URL)
  qrCodeData: {
    type: String,
    default: null
  },
  
  // Display name for users
  displayName: {
    type: String,
    default: ''
  },
  
  // Fee percentage (0.5% = 0.5)
  feePercentage: {
    type: Number,
    default: 0.5
  },
  
  // Minimum deposit amount
  minDeposit: {
    type: Number,
    default: 10
  },
  
  // Maximum deposit amount
  maxDeposit: {
    type: Number,
    default: 50000
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Instructions for users
  instructions: {
    type: String,
    default: 'Send the exact amount shown to the wallet address. After sending, submit your transaction hash for verification.'
  },
  
  // Admin who created/updated
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})

// Index for quick lookups
manualCryptoWalletSchema.index({ currency: 1, network: 1, isActive: 1 })

// Get all active wallets
manualCryptoWalletSchema.statics.getActiveWallets = async function() {
  return this.find({ isActive: true }).sort({ currency: 1, network: 1 })
}

// Calculate fee and total amount
manualCryptoWalletSchema.methods.calculateTotal = function(depositAmount) {
  const fee = depositAmount * (this.feePercentage / 100)
  const total = depositAmount + fee
  return {
    depositAmount,
    feePercentage: this.feePercentage,
    feeAmount: parseFloat(fee.toFixed(2)),
    totalToPay: parseFloat(total.toFixed(2))
  }
}

export default mongoose.model('ManualCryptoWallet', manualCryptoWalletSchema)
