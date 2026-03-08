import mongoose from 'mongoose'

const instrumentSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  segment: {
    type: String,
    enum: ['Forex', 'Crypto', 'Commodities', 'Indices'],
    required: true
  },
  baseCurrency: {
    type: String,
    required: true
  },
  quoteCurrency: {
    type: String,
    required: true
  },
  contractSize: {
    type: Number,
    default: 100000
  },
  pipSize: {
    type: Number,
    default: 0.0001
  },
  pipValue: {
    type: Number,
    default: 10
  },
  minLotSize: {
    type: Number,
    default: 0.01
  },
  maxLotSize: {
    type: Number,
    default: 100
  },
  lotStep: {
    type: Number,
    default: 0.01
  },
  tradingViewSymbol: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // LP Integration fields
  assetClass: {
    type: String,
    enum: ['FX', 'CFD', 'CRYPTO', 'COMMODITY', 'INDEX', 'STOCK'],
    default: 'CFD'
  },
  bookType: {
    type: String,
    enum: ['A_BOOK', 'B_BOOK'],
    default: 'B_BOOK'
  },
  markupBps: {
    type: Number,
    default: 0
  },
  commissionPerLot: {
    type: Number,
    default: 7
  },
  marginPercent: {
    type: Number,
    default: 1
  },
  precision: {
    type: Number,
    default: 5
  },
  source: {
    type: String,
    enum: ['MANUAL', 'CORECEN_LP', 'INFOWAY'],
    default: 'MANUAL'
  }
}, { timestamps: true })

export default mongoose.model('Instrument', instrumentSchema)
