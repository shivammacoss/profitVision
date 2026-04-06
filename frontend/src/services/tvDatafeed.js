// Custom TradingView Datafeed
// Historical bars: backend /api/charts/history first, fallback to Binance Klines (crypto) or TradingView demo UDF (forex/metals)
// Real-time price updates from backend Socket.IO price stream
import priceStreamService from './priceStream'
import { API_BASE_URL } from '../config/api'

const UDF_BASE = 'https://demo-feed-data.tradingview.com'

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

// Map symbols to TradingView UDF equivalents for fallback (forex/metals)
const udfSymbolMap = {
  'XAUUSD': 'XAUUSD', 'XAGUSD': 'XAGUSD',
  'EURUSD': 'EURUSD', 'GBPUSD': 'GBPUSD', 'USDJPY': 'USDJPY',
  'USDCHF': 'USDCHF', 'AUDUSD': 'AUDUSD', 'NZDUSD': 'NZDUSD',
  'USDCAD': 'USDCAD', 'EURGBP': 'EURGBP', 'EURJPY': 'EURJPY',
  'GBPJPY': 'GBPJPY',
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

        // Fallback: TradingView demo UDF for forex/metals
        const udfSymbol = udfSymbolMap[symbolInfo.name] || symbolInfo.name
        const udfUrl = `${UDF_BASE}/history?symbol=${udfSymbol}&resolution=${resolution}&from=${from}&to=${to}`
        const udfResp = await fetch(udfUrl)
        const udfData = await udfResp.json()

        if (udfData.s === 'no_data' || !udfData.t || udfData.t.length === 0) {
          onResult([], { noData: true })
          return
        }

        const udfBars = udfData.t.map((time, i) => ({
          time: time * 1000,
          open: udfData.o[i],
          high: udfData.h[i],
          low: udfData.l[i],
          close: udfData.c[i],
          volume: udfData.v ? udfData.v[i] : 0,
        }))
        onResult(udfBars, { noData: false })
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
