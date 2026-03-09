import mongoose from 'mongoose'

const ibWalletSchema = new mongoose.Schema({
  ibUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Combined balance (legacy - for backward compatibility)
  balance: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  pendingWithdrawal: {
    type: Number,
    default: 0
  },
  
  // ==================== Separate Income Tracking ====================
  // Direct Joining Income (from signups)
  directIncomeBalance: {
    type: Number,
    default: 0
  },
  directIncomeTotalEarned: {
    type: Number,
    default: 0
  },
  directIncomeWithdrawn: {
    type: Number,
    default: 0
  },
  directIncomePendingWithdrawal: {
    type: Number,
    default: 0
  },
  
  // Referral Income (from trades)
  referralIncomeBalance: {
    type: Number,
    default: 0
  },
  referralIncomeTotalEarned: {
    type: Number,
    default: 0
  },
  referralIncomeWithdrawn: {
    type: Number,
    default: 0
  },
  referralIncomePendingWithdrawal: {
    type: Number,
    default: 0
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Credit commission to wallet (legacy - updates combined balance)
ibWalletSchema.methods.creditCommission = async function(amount) {
  this.balance += amount
  this.totalEarned += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Credit Direct Joining Income (from signups)
ibWalletSchema.methods.creditDirectIncome = async function(amount) {
  this.directIncomeBalance += amount
  this.directIncomeTotalEarned += amount
  // Also update combined balance for backward compatibility
  this.balance += amount
  this.totalEarned += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Credit Referral Income (from trades)
ibWalletSchema.methods.creditReferralIncome = async function(amount) {
  this.referralIncomeBalance += amount
  this.referralIncomeTotalEarned += amount
  // Also update combined balance for backward compatibility
  this.balance += amount
  this.totalEarned += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Request withdrawal (legacy)
ibWalletSchema.methods.requestWithdrawal = async function(amount) {
  if (amount > this.balance) {
    throw new Error('Insufficient balance')
  }
  this.balance -= amount
  this.pendingWithdrawal += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Request Direct Income Withdrawal
ibWalletSchema.methods.requestDirectIncomeWithdrawal = async function(amount) {
  if (amount > this.directIncomeBalance) {
    throw new Error('Insufficient direct income balance')
  }
  this.directIncomeBalance -= amount
  this.directIncomePendingWithdrawal += amount
  this.balance -= amount
  this.pendingWithdrawal += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Request Referral Income Withdrawal
ibWalletSchema.methods.requestReferralIncomeWithdrawal = async function(amount) {
  if (amount > this.referralIncomeBalance) {
    throw new Error('Insufficient referral income balance')
  }
  this.referralIncomeBalance -= amount
  this.referralIncomePendingWithdrawal += amount
  this.balance -= amount
  this.pendingWithdrawal += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Complete Direct Income Withdrawal
ibWalletSchema.methods.completeDirectIncomeWithdrawal = async function(amount) {
  this.directIncomePendingWithdrawal -= amount
  this.directIncomeWithdrawn += amount
  this.pendingWithdrawal -= amount
  this.totalWithdrawn += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Complete Referral Income Withdrawal
ibWalletSchema.methods.completeReferralIncomeWithdrawal = async function(amount) {
  this.referralIncomePendingWithdrawal -= amount
  this.referralIncomeWithdrawn += amount
  this.pendingWithdrawal -= amount
  this.totalWithdrawn += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Cancel Direct Income Withdrawal
ibWalletSchema.methods.cancelDirectIncomeWithdrawal = async function(amount) {
  this.directIncomePendingWithdrawal -= amount
  this.directIncomeBalance += amount
  this.pendingWithdrawal -= amount
  this.balance += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Cancel Referral Income Withdrawal
ibWalletSchema.methods.cancelReferralIncomeWithdrawal = async function(amount) {
  this.referralIncomePendingWithdrawal -= amount
  this.referralIncomeBalance += amount
  this.pendingWithdrawal -= amount
  this.balance += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Complete withdrawal
ibWalletSchema.methods.completeWithdrawal = async function(amount) {
  this.pendingWithdrawal -= amount
  this.totalWithdrawn += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Cancel withdrawal (refund)
ibWalletSchema.methods.cancelWithdrawal = async function(amount) {
  this.pendingWithdrawal -= amount
  this.balance += amount
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Reverse commission (admin action)
ibWalletSchema.methods.reverseCommission = async function(amount) {
  this.balance -= amount
  this.totalEarned -= amount
  if (this.balance < 0) this.balance = 0
  if (this.totalEarned < 0) this.totalEarned = 0
  this.lastUpdated = new Date()
  await this.save()
  return this
}

// Get or create wallet for IB user
ibWalletSchema.statics.getOrCreateWallet = async function(ibUserId) {
  let wallet = await this.findOne({ ibUserId })
  if (!wallet) {
    wallet = await this.create({ ibUserId })
  }
  return wallet
}

// Note: ibUserId already has unique: true which creates an index

export default mongoose.model('IBWallet', ibWalletSchema)
