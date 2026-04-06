/**
 * Candle Aggregator Service
 * Builds OHLC candles from incoming LP price ticks and persists to MongoDB.
 * Resolutions: 1, 5, 15, 30, 60, 240 (minutes), D (daily), W (weekly)
 */

import PriceCandle from '../models/PriceCandle.js'

const RESOLUTIONS = ['1', '5', '15', '30', '60', '240', 'D', 'W']

const resolutionToSeconds = {
  '1': 60,
  '5': 300,
  '15': 900,
  '30': 1800,
  '60': 3600,
  '240': 14400,
  'D': 86400,
  'W': 604800,
}

// In-memory buffer: { symbol: { resolution: { barTime, open, high, low, close, volume, dirty } } }
const candleBuffer = {}

// Batch write queue
let writeQueue = []
let writeTimer = null
const WRITE_INTERVAL_MS = 5000 // flush to DB every 5 seconds

function getBarTime(timestampMs, resolution) {
  const seconds = Math.floor(timestampMs / 1000)
  const period = resolutionToSeconds[resolution]
  return Math.floor(seconds / period) * period
}

function getMidPrice(bid, ask) {
  return (bid + ask) / 2
}

/**
 * Process a single tick for all resolutions of a symbol
 */
export function processTick(symbol, bid, ask, timestampMs = Date.now()) {
  const mid = getMidPrice(bid, ask)

  if (!candleBuffer[symbol]) candleBuffer[symbol] = {}

  for (const resolution of RESOLUTIONS) {
    const barTime = getBarTime(timestampMs, resolution)

    if (!candleBuffer[symbol][resolution]) {
      // New symbol+resolution — start fresh bar
      candleBuffer[symbol][resolution] = {
        barTime,
        open: mid,
        high: mid,
        low: mid,
        close: mid,
        volume: 0,
        dirty: true,
      }
    } else {
      const bar = candleBuffer[symbol][resolution]

      if (barTime > bar.barTime) {
        // New candle — persist old one, start new
        scheduleWrite(symbol, resolution, { ...bar })

        candleBuffer[symbol][resolution] = {
          barTime,
          open: mid,
          high: mid,
          low: mid,
          close: mid,
          volume: 0,
          dirty: true,
        }
      } else {
        // Same candle — update OHLC
        bar.high = Math.max(bar.high, mid)
        bar.low = Math.min(bar.low, mid)
        bar.close = mid
        bar.dirty = true
      }
    }
  }
}

/**
 * Process a batch of ticks (from POST /api/lp/prices/batch)
 */
export function processBatchTicks(ticks) {
  const now = Date.now()
  for (const tick of ticks) {
    if (tick.bid && tick.ask && tick.symbol) {
      processTick(tick.symbol, tick.bid, tick.ask, tick.timestamp || now)
    }
  }
}

function scheduleWrite(symbol, resolution, bar) {
  writeQueue.push({
    symbol,
    resolution,
    time: bar.barTime,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  })

  if (!writeTimer) {
    writeTimer = setTimeout(flushWriteQueue, WRITE_INTERVAL_MS)
  }
}

async function flushWriteQueue() {
  writeTimer = null
  if (writeQueue.length === 0) return

  const toWrite = writeQueue.splice(0, writeQueue.length)

  try {
    const bulkOps = toWrite.map(candle => ({
      updateOne: {
        filter: { symbol: candle.symbol, resolution: candle.resolution, time: candle.time },
        update: { $set: candle },
        upsert: true,
      },
    }))

    await PriceCandle.bulkWrite(bulkOps, { ordered: false })
  } catch (err) {
    console.error('[CandleAggregator] DB write error:', err.message)
  }
}

/**
 * Also flush current (open) bars to DB periodically so history is always fresh
 */
export function startPeriodicFlush() {
  setInterval(async () => {
    const toWrite = []
    for (const symbol of Object.keys(candleBuffer)) {
      for (const resolution of RESOLUTIONS) {
        const bar = candleBuffer[symbol]?.[resolution]
        if (bar?.dirty) {
          toWrite.push({
            symbol,
            resolution,
            time: bar.barTime,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
          })
          bar.dirty = false
        }
      }
    }

    if (toWrite.length === 0) return

    try {
      const bulkOps = toWrite.map(candle => ({
        updateOne: {
          filter: { symbol: candle.symbol, resolution: candle.resolution, time: candle.time },
          update: { $set: candle },
          upsert: true,
        },
      }))
      await PriceCandle.bulkWrite(bulkOps, { ordered: false })
    } catch (err) {
      console.error('[CandleAggregator] Periodic flush error:', err.message)
    }
  }, 10000) // flush open bars every 10s
}

/**
 * Get current open bar for a symbol+resolution (for real-time streaming)
 */
export function getCurrentBar(symbol, resolution) {
  const bar = candleBuffer[symbol]?.[resolution]
  if (!bar) return null
  return {
    time: bar.barTime * 1000, // ms for TradingView
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }
}
