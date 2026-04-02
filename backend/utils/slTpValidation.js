/**
 * BUY: SL < entry, TP > entry
 * SELL: SL > entry, TP < entry
 * @returns {string|null} Error message or null if OK / nothing to validate
 */
export function validateSlTpPlacement(side, entryPrice, sl, tp) {
  const entry = Number(entryPrice)
  if (!Number.isFinite(entry) || entry <= 0) return null

  const s = String(side || '').toUpperCase()
  if (s !== 'BUY' && s !== 'SELL') return null

  const slNum = sl != null && sl !== '' ? Number(sl) : null
  const tpNum = tp != null && tp !== '' ? Number(tp) : null

  if (slNum != null && Number.isFinite(slNum)) {
    if (s === 'BUY' && slNum >= entry) {
      return 'For BUY, stop loss must be below entry price. For SELL, stop loss must be above entry price.'
    }
    if (s === 'SELL' && slNum <= entry) {
      return 'For SELL, stop loss must be above entry price. For BUY, stop loss must be below entry price.'
    }
  }

  if (tpNum != null && Number.isFinite(tpNum)) {
    if (s === 'BUY' && tpNum <= entry) {
      return 'For BUY, take profit must be above entry price. For SELL, take profit must be below entry price.'
    }
    if (s === 'SELL' && tpNum >= entry) {
      return 'For SELL, take profit must be below entry price. For BUY, take profit must be above entry price.'
    }
  }

  return null
}
