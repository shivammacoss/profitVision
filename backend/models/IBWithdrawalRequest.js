import mongoose from 'mongoose'

const ibWithdrawalRequestSchema = new mongoose.Schema({
  ibUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  withdrawalType: {
    type: String,
    enum: ['DIRECT', 'REFERRAL'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING'
  },
  // Bank/Payment details
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'UPI', 'CRYPTO', 'OTHER'],
    default: 'BANK_TRANSFER'
  },
  paymentDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    upiId: String,
    cryptoAddress: String,
    cryptoNetwork: String
  },
  // Tracking
  requestedAt: {
    type: Date,
    default: Date.now
  },
  // For referral income - track when income was earned
  incomeEarnedDate: {
    type: Date,
    default: null
  },
  // Lock period check
  eligibleForWithdrawalAt: {
    type: Date,
    default: null
  },
  // Admin actions
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  // Completion
  completedAt: {
    type: Date,
    default: null
  },
  transactionReference: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, { timestamps: true })

// Indexes
ibWithdrawalRequestSchema.index({ ibUserId: 1, status: 1 })
ibWithdrawalRequestSchema.index({ withdrawalType: 1, status: 1 })
ibWithdrawalRequestSchema.index({ requestedAt: -1 })

// Check if withdrawal is eligible (past lock period)
ibWithdrawalRequestSchema.methods.isEligibleForWithdrawal = function() {
  if (this.withdrawalType === 'DIRECT') {
    return true // Direct income can be withdrawn immediately
  }
  if (!this.eligibleForWithdrawalAt) {
    return true
  }
  return new Date() >= this.eligibleForWithdrawalAt
}

// Static method to get pending requests for admin
ibWithdrawalRequestSchema.statics.getPendingRequests = async function(withdrawalType = null) {
  const query = { status: 'PENDING' }
  if (withdrawalType) {
    query.withdrawalType = withdrawalType
  }
  return this.find(query)
    .populate('ibUserId', 'firstName lastName email referralCode')
    .sort({ requestedAt: 1 })
}

// Static method to get user's withdrawal history
ibWithdrawalRequestSchema.statics.getUserWithdrawals = async function(ibUserId, withdrawalType = null) {
  const query = { ibUserId }
  if (withdrawalType) {
    query.withdrawalType = withdrawalType
  }
  return this.find(query).sort({ requestedAt: -1 })
}

export default mongoose.model('IBWithdrawalRequest', ibWithdrawalRequestSchema)
