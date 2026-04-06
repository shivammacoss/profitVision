import { useSearchParams } from 'react-router-dom'
import TradingViewChart from '../components/TradingViewChart'

const ChartEmbed = () => {
  const [searchParams] = useSearchParams()
  const symbol = searchParams.get('symbol') || 'XAUUSD'
  const theme = searchParams.get('theme') || 'dark'
  const interval = searchParams.get('interval') || '60'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme === 'dark' ? '#0d0d0d' : '#ffffff',
      }}
    >
      <TradingViewChart symbol={symbol} theme={theme} interval={interval} isMobile={true} />
    </div>
  )
}

export default ChartEmbed
