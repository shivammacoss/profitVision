/**
 * TradingView UDF-compatible chart history endpoint
 * GET /api/charts/history?symbol=XAUUSD&resolution=5&from=1700000000&to=1700086400
 */

import express from 'express'
import PriceCandle from '../models/PriceCandle.js'
import { getCurrentBar } from '../services/candleAggregator.js'

const router = express.Router()

// GET /api/charts/history
router.get('/history', async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query

    if (!symbol || !resolution || !from || !to) {
      return res.json({ s: 'error', errmsg: 'symbol, resolution, from, to required' })
    }

    const fromSec = parseInt(from, 10)
    const toSec = parseInt(to, 10)

    // Map TradingView resolution to our stored resolution
    const mappedRes = mapResolution(resolution)

    // Query candles from DB
    const candles = await PriceCandle.find({
      symbol: symbol.toUpperCase(),
      resolution: mappedRes,
      time: { $gte: fromSec, $lte: toSec },
    })
      .sort({ time: 1 })
      .lean()

    if (!candles || candles.length === 0) {
      return res.json({ s: 'no_data' })
    }

    // Also include current open bar if it falls in range
    const currentBar = getCurrentBar(symbol.toUpperCase(), mappedRes)
    let allCandles = [...candles]

    if (currentBar) {
      const currentBarSec = Math.floor(currentBar.time / 1000)
      if (currentBarSec >= fromSec && currentBarSec <= toSec) {
        // Replace last candle if same time, else append
        const last = allCandles[allCandles.length - 1]
        if (last && last.time === currentBarSec) {
          allCandles[allCandles.length - 1] = {
            time: currentBarSec,
            open: currentBar.open,
            high: currentBar.high,
            low: currentBar.low,
            close: currentBar.close,
            volume: currentBar.volume,
          }
        } else if (currentBarSec > (last?.time || 0)) {
          allCandles.push({
            time: currentBarSec,
            open: currentBar.open,
            high: currentBar.high,
            low: currentBar.low,
            close: currentBar.close,
            volume: currentBar.volume,
          })
        }
      }
    }

    res.json({
      s: 'ok',
      t: allCandles.map(c => c.time),
      o: allCandles.map(c => c.open),
      h: allCandles.map(c => c.high),
      l: allCandles.map(c => c.low),
      c: allCandles.map(c => c.close),
      v: allCandles.map(c => c.volume || 0),
    })
  } catch (err) {
    console.error('[Charts] History error:', err)
    res.json({ s: 'error', errmsg: err.message })
  }
})

// GET /api/charts/time - server time for TradingView
router.get('/time', (req, res) => {
  res.send(String(Math.floor(Date.now() / 1000)))
})

function mapResolution(resolution) {
  const map = {
    '1': '1', '3': '1', '5': '5', '10': '5',
    '15': '15', '30': '30',
    '60': '60', '120': '60', '240': '240',
    'D': 'D', '1D': 'D',
    'W': 'W', '1W': 'W',
    'M': 'D', '1M': 'D',
  }
  return map[resolution] || '5'
}

export default router
