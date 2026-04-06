/**
 * TradingView UDF-compatible chart history endpoint
 * GET /api/charts/history?symbol=XAUUSD&resolution=5&from=1700000000&to=1700086400
 *
 * Data priority:
 * 1. MongoDB PriceCandle (from LP ticks)
 * 2. Binance Klines API (for crypto symbols)
 * 3. Twelve Data API (for forex/metals symbols)
 */

import express from 'express'
import PriceCandle from '../models/PriceCandle.js'
import { getCurrentBar } from '../services/candleAggregator.js'

const router = express.Router()

const CRYPTO_SYMBOLS = new Set([
  'BTCUSD','ETHUSD','LTCUSD','XRPUSD','BNBUSD','SOLUSD',
  'ADAUSD','DOGEUSD','DOTUSD','BCHUSD','AVAXUSD','LINKUSD','MATICUSD',
  'UNIUSD','ATOMUSD','XLMUSD','ALGOUSD','VETUSD','ICPUSD','FILUSD',
  'TRXUSD','ETCUSD','XMRUSD','EOSUSD','AAVEUSD','MKRUSD','NEARUSD',
  'FTMUSD','SANDUSD','MANAUSD','AXSUSD','APEUSD','ARBUSD','OPUSD',
  'PEPEUSD','SHIBUSD',
])

const binanceSymbolMap = {
  'BTCUSD':'BTCUSDT','ETHUSD':'ETHUSDT','LTCUSD':'LTCUSDT',
  'XRPUSD':'XRPUSDT','BNBUSD':'BNBUSDT','SOLUSD':'SOLUSDT',
  'ADAUSD':'ADAUSDT','DOGEUSD':'DOGEUSDT','DOTUSD':'DOTUSDT',
  'BCHUSD':'BCHUSDT','AVAXUSD':'AVAXUSDT','LINKUSD':'LINKUSDT',
  'MATICUSD':'MATICUSDT','UNIUSD':'UNIUSDT','ATOMUSD':'ATOMUSDT',
  'XLMUSD':'XLMUSDT','NEARUSD':'NEARUSDT','FTMUSD':'FTMUSDT',
  'ALGOUSD':'ALGOUSDT','VETUSD':'VETUSDT','ICPUSD':'ICPUSDT',
  'FILUSD':'FILUSDT','TRXUSD':'TRXUSDT','ETCUSD':'ETCUSDT',
  'AAVEUSD':'AAVEUSDT','SANDUSD':'SANDUSDT','MANAUSD':'MANAUSDT',
  'AXSUSD':'AXSUSDT','APEUSD':'APEUSDT','ARBUSD':'ARBUSDT',
  'OPUSD':'OPUSDT','PEPEUSD':'PEPEUSDT','SHIBUSD':'SHIBUSDT',
}

const resolutionToBinanceInterval = {
  '1':'1m','3':'3m','5':'5m','15':'15m','30':'30m',
  '60':'1h','120':'2h','240':'4h',
  'D':'1d','1D':'1d','W':'1w','1W':'1w','M':'1M','1M':'1M',
}

// Twelve Data symbol map for forex/metals
const twelveDataSymbolMap = {
  'EURUSD':'EUR/USD','GBPUSD':'GBP/USD','USDJPY':'USD/JPY',
  'USDCHF':'USD/CHF','AUDUSD':'AUD/USD','NZDUSD':'NZD/USD',
  'USDCAD':'USD/CAD','EURGBP':'EUR/GBP','EURJPY':'EUR/JPY',
  'GBPJPY':'GBP/JPY','EURCHF':'EUR/CHF','EURAUD':'EUR/AUD',
  'EURCAD':'EUR/CAD','GBPAUD':'GBP/AUD','GBPCAD':'GBP/CAD',
  'AUDCAD':'AUD/CAD','AUDJPY':'AUD/JPY','CADJPY':'CAD/JPY',
  'CHFJPY':'CHF/JPY','NZDJPY':'NZD/JPY',
  'XAUUSD':'XAU/USD','XAGUSD':'XAG/USD',
}

const resolutionToTwelveInterval = {
  '1':'1min','3':'5min','5':'5min','15':'15min','30':'30min',
  '60':'1h','120':'2h','240':'4h',
  'D':'1day','1D':'1day','W':'1week','1W':'1week','M':'1month','1M':'1month',
}

/**
 * Fetch candles from Binance Klines (crypto)
 */
async function fetchBinanceCandles(symbol, resolution, fromSec, toSec) {
  try {
    const binSym = binanceSymbolMap[symbol] || symbol.replace('USD','USDT')
    const interval = resolutionToBinanceInterval[resolution] || '5m'
    const url = `https://api.binance.com/api/v3/klines?symbol=${binSym}&interval=${interval}&startTime=${fromSec*1000}&endTime=${toSec*1000}&limit=1000`
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = await resp.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return data.map(k => ({
      time: Math.floor(k[0] / 1000),
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  } catch (err) {
    console.error('[Charts] Binance fetch error:', err.message)
    return null
  }
}

/**
 * Fetch candles from Twelve Data (forex/metals)
 */
async function fetchTwelveDataCandles(symbol, resolution, fromSec, toSec) {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY || 'demo'
    const tdSym = twelveDataSymbolMap[symbol]
    if (!tdSym) return null
    const interval = resolutionToTwelveInterval[resolution] || '5min'
    const startDt = new Date(fromSec * 1000).toISOString().slice(0,19)
    const endDt = new Date(toSec * 1000).toISOString().slice(0,19)
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSym)}&interval=${interval}&start_date=${startDt}&end_date=${endDt}&outputsize=5000&apikey=${apiKey}&format=JSON`
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = await resp.json()
    if (data.status === 'error' || !data.values || data.values.length === 0) return null
    // Twelve Data returns newest first — reverse to ascending
    return data.values.reverse().map(v => ({
      time: Math.floor(new Date(v.datetime.replace(' ','T')+'Z').getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: v.volume ? parseFloat(v.volume) : 0,
    }))
  } catch (err) {
    console.error('[Charts] TwelveData fetch error:', err.message)
    return null
  }
}

// GET /api/charts/history
router.get('/history', async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query

    if (!symbol || !resolution || !from || !to) {
      return res.json({ s: 'error', errmsg: 'symbol, resolution, from, to required' })
    }

    const symUp = symbol.toUpperCase()
    const fromSec = parseInt(from, 10)
    const toSec = parseInt(to, 10)

    // Map TradingView resolution to our stored resolution
    const mappedRes = mapResolution(resolution)

    // 1. Query candles from DB (LP ticks)
    const candles = await PriceCandle.find({
      symbol: symUp,
      resolution: mappedRes,
      time: { $gte: fromSec, $lte: toSec },
    })
      .sort({ time: 1 })
      .lean()

    console.log(`[Charts] DB query: ${symUp} ${mappedRes} ${candles.length} candles from ${new Date(fromSec*1000).toISOString()} to ${new Date(toSec*1000).toISOString()}`)

    let allCandles = candles || []

    // 2. If DB is empty, fetch from external source
    if (allCandles.length === 0) {
      console.log(`[Charts] DB empty for ${symUp}, fetching external data...`)
      let externalCandles = null

      if (CRYPTO_SYMBOLS.has(symUp)) {
        externalCandles = await fetchBinanceCandles(symUp, resolution, fromSec, toSec)
      } else {
        externalCandles = await fetchTwelveDataCandles(symUp, resolution, fromSec, toSec)
      }

      if (!externalCandles || externalCandles.length === 0) {
        return res.json({ s: 'no_data' })
      }

      allCandles = externalCandles
    } else {
      // 3. Also include current open bar if it falls in range
      const currentBar = getCurrentBar(symUp, mappedRes)
      if (currentBar) {
        const currentBarSec = Math.floor(currentBar.time / 1000)
        if (currentBarSec >= fromSec && currentBarSec <= toSec) {
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
