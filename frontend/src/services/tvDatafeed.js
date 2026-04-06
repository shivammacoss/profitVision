// Custom TradingView Datafeed
// Historical bars: backend /api/charts/history first, fallback to Binance Klines (crypto) or Stooq (forex/metals)
// Real-time price updates from backend Socket.IO price stream
import priceStreamService from './priceStream'
import { API_BASE_URL } from '../config/api'

const CRYPTO_SYMBOLS = new Set([
  'BTCUSD','ETHUSD','LTCUSD','XRPUSD','BNBUSD','SOLUSD',
  'ADAUSD','DOGEUSD','DOTUSD','BCHUSD','AVAXUSD','LINKUSD','MATICUSD',
  'UNIUSD','ATOMUSD','XLMUSD','ALGOUSD','VETUSD','ICPUSD','FILUSD',
  'TRXUSD','ETCUSD','XMRUSD','EOSUSD','AAVEUSD','MKRUSD','NEARUSD',
  'FTMUSD','SANDUSD','MANAUSD','AXSUSD','APEUSD','ARBUSD','OPUSD',
  'PEPEUSD','SHIBUSD',
])

// Map our symbols to Binance USDT pairs
const binanceSymbolMap = {
  'BTCUSD': 'BTCUSDT', 'ETHUSD': 'ETHUSDT', 'LTCUSD': 'LTCUSDT',
  'XRPUSD': 'XRPUSDT', 'BNBUSD': 'BNBUSDT', 'SOLUSD': 'SOLUSDT',
  'ADAUSD': 'ADAUSDT', 'DOGEUSD': 'DOGEUSDT', 'DOTUSD': 'DOTUSDT',
  'BCHUSD': 'BCHUSDT', 'AVAXUSD': 'AVAXUSDT', 'LINKUSD': 'LINKUSDT',
  'MATICUSD': 'MATICUSDT', 'UNIUSD': 'UNIUSDT', 'ATOMUSD': 'ATOMUSDT',
  'XLMUSD': 'XLMUSDT', 'NEARUSD': 'NEARUSDT', 'FTMUSD': 'FTMUSDT',
  'ALGOUSD': 'ALGOUSDT', 'VETUSD': 'VETUSDT', 'ICPUSD': 'ICPUSDT',
  'FILUSD': 'FILUSDT', 'TRXUSD': 'TRXUSDT', 'ETCUSD': 'ETCUSDT',
  'AAVEUSD': 'AAVEUSDT', 'SANDUSD': 'SANDUSDT', 'MANAUSD': 'MANAUSDT',
  'AXSUSD': 'AXSUSDT', 'APEUSD': 'APEUSDT', 'ARBUSD': 'ARBUSDT',
  'OPUSD': 'OPUSDT', 'PEPEUSD': 'PEPEUSDT', 'SHIBUSD': 'SHIBUSDT',
}

// Map TradingView resolution to Binance klines interval
const resolutionToBinanceInterval = {
  '1': '1m', '3': '3m', '5': '5m', '15': '15m', '30': '30m',
  '60': '1h', '120': '2h', '240': '4h',
  'D': '1d', '1D': '1d', 'W': '1w', '1W': '1w', 'M': '1M', '1M': '1M',
}

// Map our symbols to Stooq symbols for forex/metals fallback
const stooqSymbolMap = {
  'EURUSD': 'eurusd', 'GBPUSD': 'gbpusd', 'USDJPY': 'usdjpy',
  'USDCHF': 'usdchf', 'AUDUSD': 'audusd', 'NZDUSD': 'nzdusd',
  'USDCAD': 'usdcad', 'EURGBP': 'eurgbp', 'EURJPY': 'eurjpy',
  'GBPJPY': 'gbpjpy', 'EURCHF': 'eurchf', 'EURAUD': 'euraud',
  'EURCAD': 'eurcad', 'GBPAUD': 'gbpaud', 'GBPCAD': 'gbpcad',
  'AUDCAD': 'audcad', 'AUDJPY': 'audjpy', 'CADJPY': 'cadjpy',
  'CHFJPY': 'chfjpy', 'NZDJPY': 'nzdjpy',
  'XAUUSD': 'xauusd', 'XAGUSD': 'xagusd',
}

// Map TradingView resolution to Stooq interval
const resolutionToStooqInterval = {
  '1': '5m', '3': '5m', '5': '5m', '15': '15m', '30': '30m',
  '60': '1h', '120': '1h', '240': '4h',
  'D': 'd', '1D': 'd', 'W': 'w', '1W': 'w', 'M': 'm', '1M': 'm',
}

/**
 * Fetch historical bars from Stooq for forex/metals
 * Returns bars array or null on failure
 */
async function fetchStooqBars(symbol, resolution, fromSec, toSec) {
  const stooqSymbol = stooqSymbolMap[symbol]
  if (!stooqSymbol) return null

  const interval = resolutionToStooqInterval[resolution] || 'd'

  // Format dates for Stooq: YYYYMMDD
  const fromDate = new Date(fromSec * 1000)
  const toDate = new Date(toSec * 1000)
  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, '')

  try {
    const url = `https://stooq.com/q/d/l/?s=${stooqSymbol}&d1=${fmt(fromDate)}&d2=${fmt(toDate)}&i=${interval}`
    const resp = await fetch(url)
    if (!resp.ok) return null
    const text = await resp.text()
    if (!text || text.trim() === '' || text.includes('No data')) return null

    const lines = text.trim().split('\n')
    if (lines.length < 2) return null

    const bars = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',')
      if (cols.length < 5) continue
      const date = cols[0].replace(/-/g, '')
      const time = cols[1] // HH:MM:SS or empty for daily
      let ts
      if (time && time.includes(':')) {
        ts = new Date(`${cols[0]}T${time}Z`).getTime()
      } else {
        ts = new Date(`${cols[0]}T00:00:00Z`).getTime()
      }
      if (isNaN(ts)) continue
      bars.push({
        time: ts,
        open: parseFloat(cols[2]),
        high: parseFloat(cols[3]),
        low: parseFloat(cols[4]),
        close: parseFloat(cols[5] || cols[4]),
        volume: cols[6] ? parseFloat(cols[6]) : 0,
      })
    }

    return bars.length > 0 ? bars : null
  } catch (err) {
    console.error('[TVDatafeed] Stooq fetch error:', err)
    return null
  }
}

/**
 * Fetch historical bars from Binance Klines API
 * Returns bars array or null on failure
 */
async function fetchBinanceKlines(symbol, resolution, fromMs, toMs) {
  const binanceSymbol = binanceSymbolMap[symbol] || (symbol.replace('USD', 'USDT'))
  const interval = resolutionToBinanceInterval[resolution] || '5m'
  const limit = 1000

  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&startTime=${fromMs}&endTime=${toMs}&limit=${limit}`
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = await resp.json()
    if (!Array.isArray(data) || data.length === 0) return null

    return data.map(k => ({
      time: k[0],           // open time in ms
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }))
  } catch (err) {
    console.error('[TVDatafeed] Binance klines error:', err)
    return null
  }
}

const resolutionToSeconds = {
  '1': 60, '3': 180, '5': 300, '15': 900, '30': 1800,
  '60': 3600, '120': 7200, '240': 14400,
  'D': 86400, '1D': 86400, 'W': 604800, '1W': 604800,
  'M': 2592000, '1M': 2592000,
}

function getSymbolInfo(symbol) {
  const isForex = ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','USDCAD',
    'EURGBP','EURJPY','GBPJPY','EURCHF','EURAUD','EURCAD','GBPAUD','GBPCAD',
    'AUDCAD','AUDJPY','CADJPY','CHFJPY','NZDJPY'].includes(symbol)
  const isMetal = ['XAUUSD','XAGUSD'].includes(symbol)
  const isCrypto = ['BTCUSD','ETHUSD','LTCUSD','XRPUSD','BNBUSD','SOLUSD',
    'ADAUSD','DOGEUSD','DOTUSD','BCHUSD','AVAXUSD','LINKUSD','MATICUSD'].includes(symbol)

  return {
    name: symbol,
    full_name: symbol,
    description: symbol,
    type: isCrypto ? 'crypto' : isForex ? 'forex' : isMetal ? 'commodity' : 'forex',
    session: isCrypto ? '24x7' : '0000-0000:23456',
    exchange: isCrypto ? 'Crypto' : isForex ? 'Forex' : 'Commodity',
    listed_exchange: 'ProfitVisionFX',
    timezone: 'Etc/UTC',
    format: 'price',
    pricescale: isForex ? (symbol.includes('JPY') ? 1000 : 100000) : isMetal ? 100 : isCrypto ? 100 : 100,
    minmov: 1,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: ['1', '3', '5', '15', '30', '60', '120', '240', 'D', 'W', 'M'],
    volume_precision: 2,
    data_status: 'streaming',
  }
}

export function createDatafeed() {
  const subscribers = {}
  let priceSubscriptionId = null

  return {
    onReady: (callback) => {
      setTimeout(() => callback({
        supported_resolutions: ['1', '3', '5', '15', '30', '60', '120', '240', 'D', 'W', 'M'],
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
        exchanges: [
          { value: '', name: 'All', desc: '' },
          { value: 'Forex', name: 'Forex', desc: 'Forex Pairs' },
          { value: 'Crypto', name: 'Crypto', desc: 'Cryptocurrencies' },
          { value: 'Commodity', name: 'Commodity', desc: 'Commodities' },
        ],
      }), 0)
    },

    searchSymbols: (userInput, exchange, symbolType, onResult) => {
      const symbols = [
        'EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','USDCAD',
        'EURGBP','EURJPY','GBPJPY','EURCHF','EURAUD','EURCAD','GBPAUD','GBPCAD',
        'AUDCAD','AUDJPY','CADJPY','CHFJPY','NZDJPY',
        'XAUUSD','XAGUSD',
        'BTCUSD','ETHUSD','LTCUSD','XRPUSD','BNBUSD','SOLUSD',
        'ADAUSD','DOGEUSD','DOTUSD','BCHUSD','AVAXUSD','LINKUSD','MATICUSD',
      ]
      const filtered = symbols.filter(s =>
        s.toLowerCase().includes(userInput.toLowerCase())
      ).map(s => {
        const info = getSymbolInfo(s)
        return { symbol: s, full_name: s, description: s, exchange: info.exchange, type: info.type }
      })
      onResult(filtered)
    },

    resolveSymbol: (symbolName, onResolve, onError) => {
      const clean = symbolName.replace(/^[^:]+:/, '')
      const info = getSymbolInfo(clean)
      if (info) {
        setTimeout(() => onResolve(info), 0)
      } else {
        onError('Symbol not found')
      }
    },

    getBars: async (symbolInfo, resolution, periodParams, onResult, onError) => {
      const { from, to, firstDataRequest } = periodParams
      const fromMs = from * 1000
      const toMs = to * 1000

      try {
        // Try backend first
        const url = `${API_BASE_URL}/charts/history?symbol=${symbolInfo.name}&resolution=${resolution}&from=${from}&to=${to}`
        const resp = await fetch(url)
        const data = await resp.json()

        if (data.s === 'ok' && data.t && data.t.length > 0) {
          const bars = data.t.map((time, i) => ({
            time: time * 1000,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
            volume: data.v ? data.v[i] : 0,
          }))
          onResult(bars, { noData: false })
          return
        }

        // Fallback: Binance Klines for crypto symbols
        if (CRYPTO_SYMBOLS.has(symbolInfo.name)) {
          const bars = await fetchBinanceKlines(symbolInfo.name, resolution, fromMs, toMs)
          if (bars && bars.length > 0) {
            onResult(bars, { noData: false })
            return
          }
          onResult([], { noData: true })
          return
        }

        // Fallback: Stooq for forex/metals
        const stooqBars = await fetchStooqBars(symbolInfo.name, resolution, from, to)
        if (stooqBars && stooqBars.length > 0) {
          onResult(stooqBars, { noData: false })
          return
        }
        onResult([], { noData: true })
      } catch (err) {
        console.error('[TVDatafeed] getBars error:', err)
        onResult([], { noData: true })
      }
    },

    subscribeBars: (symbolInfo, resolution, onTick, listenerGuid) => {
      const symbol = symbolInfo.name
      const resSeconds = resolutionToSeconds[resolution] || 60

      let lastBar = null

      const handler = (prices) => {
        const priceData = prices[symbol]
        if (!priceData) return

        const mid = (priceData.bid + priceData.ask) / 2
        const now = Date.now()
        const barTime = Math.floor(now / (resSeconds * 1000)) * resSeconds * 1000

        if (!lastBar || barTime > lastBar.time) {
          lastBar = {
            time: barTime,
            open: mid,
            high: mid,
            low: mid,
            close: mid,
            volume: 0,
          }
        } else {
          lastBar = {
            ...lastBar,
            high: Math.max(lastBar.high, mid),
            low: Math.min(lastBar.low, mid),
            close: mid,
          }
        }

        onTick(lastBar)
      }

      const subId = `tv_${listenerGuid}`
      subscribers[listenerGuid] = subId
      priceStreamService.subscribe(subId, handler)
    },

    unsubscribeBars: (listenerGuid) => {
      const subId = subscribers[listenerGuid]
      if (subId) {
        priceStreamService.unsubscribe(subId)
        delete subscribers[listenerGuid]
      }
    },
  }
}

export default createDatafeed
