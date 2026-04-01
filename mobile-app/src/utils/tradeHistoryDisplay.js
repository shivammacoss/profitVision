/** Effective SL/TP (DB may use stopLoss or legacy sl/tp) */
export function effectiveStopLoss(trade) {
  const v = trade?.stopLoss ?? trade?.sl
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function effectiveTakeProfit(trade) {
  const v = trade?.takeProfit ?? trade?.tp
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function formatHistoryPrice(symbol, price) {
  if (price === null || price === undefined || price === '') return '—'
  const p = Number(price)
  if (!Number.isFinite(p)) return '—'
  if (!symbol) return p.toFixed(5)
  if (symbol.includes('JPY')) return p.toFixed(3)
  if (['BTCUSD', 'ETHUSD', 'XAUUSD'].includes(symbol)) return p.toFixed(2)
  if (['XAGUSD'].includes(symbol)) return p.toFixed(4)
  return p.toFixed(5)
}

export function closeReasonLabel(closedBy) {
  switch (closedBy) {
    case 'SL':
      return 'Stop loss hit'
    case 'TP':
      return 'Take profit hit'
    case 'STOP_OUT':
      return 'Stop out'
    case 'ADMIN':
      return 'Closed by admin'
    case 'USER':
      return 'Manual close'
    default:
      return closedBy ? String(closedBy).replace(/_/g, ' ') : 'Manual close'
  }
}
