import mongoose from 'mongoose'

const priceCandleSchema = new mongoose.Schema({
  symbol: { type: String, required: true, index: true },
  resolution: { type: String, required: true }, // '1','5','15','30','60','240','D','W'
  time: { type: Number, required: true }, // Unix timestamp seconds (bar open time)
  open: { type: Number, required: true },
  high: { type: Number, required: true },
  low: { type: Number, required: true },
  close: { type: Number, required: true },
  volume: { type: Number, default: 0 },
}, { timestamps: false })

priceCandleSchema.index({ symbol: 1, resolution: 1, time: 1 }, { unique: true })
priceCandleSchema.index({ symbol: 1, resolution: 1, time: -1 })

export default mongoose.model('PriceCandle', priceCandleSchema)
