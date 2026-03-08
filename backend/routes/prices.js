import express from 'express'
import { getAllLpPrices } from './lpIntegration.js'

const router = express.Router()

// All prices come from Corecen LP (Infoway) - no MetaAPI or Binance fallback needed

// GET /api/prices/:symbol - Get single symbol price from LP cache
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params
    const lpPrices = getAllLpPrices()
    const priceData = lpPrices.get(symbol)
    
    if (priceData && priceData.bid) {
      res.json({ success: true, price: { bid: priceData.bid, ask: priceData.ask }, source: 'CORECEN_LP' })
    } else {
      res.status(404).json({ success: false, message: 'Price not available from LP' })
    }
  } catch (error) {
    console.error('Error fetching price:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/batch - Get multiple symbol prices from LP cache
router.post('/batch', async (req, res) => {
  try {
    const { symbols } = req.body
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ success: false, message: 'symbols array required' })
    }
    
    const prices = {}
    const lpPrices = getAllLpPrices()
    
    // Get all prices from LP cache
    for (const symbol of symbols) {
      const priceData = lpPrices.get(symbol)
      if (priceData && priceData.bid) {
        prices[symbol] = { bid: priceData.bid, ask: priceData.ask }
      }
    }
    
    res.json({ success: true, prices, source: 'CORECEN_LP' })
  } catch (error) {
    console.error('Error fetching batch prices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
