import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Menu, X, Mail, Phone, MapPin, Send, Shield, BookOpen, Users, TrendingUp, Star, CheckCircle, AlertTriangle, FileText, Lock } from 'lucide-react'
import logo from '../assets/logo.png'

const ProfitVisionLanding = () => {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactLoading, setContactLoading] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [legalModal, setLegalModal] = useState(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Chart.js initialization
  useEffect(() => {
    if (chartRef.current && window.Chart) {
      const ctx = chartRef.current.getContext('2d')
      new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Monthly Profit ($)',
            data: [2500, 3200, 4100, 5200, 6800, 7500, 8900, 10200, 11500, 13200, 14800, 16500],
            borderColor: '#d4af37',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: '#00d4ff',
            pointBorderColor: '#d4af37',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.1)' },
              ticks: { color: '#9ca3af' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af' }
            }
          }
        }
      })
    }
  }, [])

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Crypto Trader',
      text: 'Profit Vision FX has transformed my trading journey. The copy trading feature is incredibly intuitive and profitable.',
      avatar: 'AJ'
    },
    {
      name: 'Sarah Williams',
      role: 'Financial Analyst',
      text: 'Best trading platform I\'ve used. The signals are accurate and the UI is sleek. Highly recommended!',
      avatar: 'SW'
    },
    {
      name: 'Michael Chen',
      role: 'Professional Trader',
      text: 'The performance metrics and real-time analytics make decision-making so much easier. Love this platform!',
      avatar: 'MC'
    }
  ]

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-slate-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-slate-950/95 backdrop-blur-md border-b border-yellow-500/20' : 'bg-slate-950/50 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ProfitVision FX" className="h-12 w-auto" />
            <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              ProfitVision FX
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {['About', 'Services', 'Education', 'Referral', 'Career', 'Reviews', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-gray-300 hover:text-yellow-400 transition-colors duration-300 font-medium"
              >
                {item}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-yellow-400"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 border-2 border-yellow-500 rounded-lg font-semibold hover:bg-yellow-500/10 transition-all duration-300 text-yellow-400"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-slate-900"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-t border-yellow-500/20 p-4 space-y-3">
            {['About', 'Services', 'Education', 'Referral', 'Career', 'Reviews', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className="block w-full text-left text-gray-300 hover:text-yellow-400 py-2"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center z-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <div>
                <div className="text-left mb-4">
                  <p className="text-base font-semibold text-yellow-400 tracking-widest uppercase">Welcome to</p>
                </div>
                <h1 className="text-6xl md:text-7xl font-bold leading-tight mb-6">
                  <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                    ProfitVision
                  </span>
                  <br />
                  <span className="text-white">FX</span>
                </h1>
                <p className="text-2xl font-bold text-white mb-4">Trade Smarter. Grow Stronger. Scale Consistently.</p>
                <p className="text-lg text-gray-300 leading-relaxed mb-4">
                  At ProfitVision FX, we combine institutional-level trading strategies with advanced risk management to deliver a powerful trading experience.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Whether you choose manual trading or automated copy trading, our ecosystem is designed to help you achieve consistent and controlled growth in the global financial markets.
                </p>
                <div className="flex gap-6 mt-4 pt-4 border-t border-yellow-500/20">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">🎯</div>
                    <p className="text-xs text-gray-400 mt-1">Precision</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">⚖️</div>
                    <p className="text-xs text-gray-400 mt-1">Discipline</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">📈</div>
                    <p className="text-xs text-gray-400 mt-1">Performance</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg font-bold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-slate-900 hover:scale-105"
                >
                  Start Trading
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 border-2 border-yellow-500 rounded-lg font-bold hover:bg-yellow-500/10 transition-all duration-300"
                >
                  Login
                </button>
              </div>
            </div>

            {/* Hero Right - Stats + Images */}
            <div className="relative animate-fade-in-up space-y-4" style={{animationDelay: '0.2s'}}>
              {/* Dollar/Gold Image Card */}
              <div className="relative rounded-2xl overflow-hidden h-48 border border-yellow-500/30">
                <img
                  src="https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=800&h=400&fit=crop&q=80"
                  alt="Trading chart"
                  className="w-full h-full object-cover opacity-70"
                  onError={(e) => { e.target.style.display='none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-semibold">Live Trading Active</span>
                </div>
              </div>
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-yellow-500/30 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="text-xl font-bold text-yellow-400">+245%</div>
                  <p className="text-xs text-gray-400">YTD Profit</p>
                </div>
                <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-yellow-500/30 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">🏆</div>
                  <div className="text-xl font-bold text-yellow-400">8.5K+</div>
                  <p className="text-xs text-gray-400">Traders</p>
                </div>
                <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur border border-yellow-500/30 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">⭐</div>
                  <div className="text-xl font-bold text-yellow-400">10+</div>
                  <p className="text-xs text-gray-400">Years Exp.</p>
                </div>
              </div>
              {/* Gold Image Card */}
              <div className="relative rounded-2xl overflow-hidden h-36 border border-yellow-500/30">
                <img
                  src="https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800&h=300&fit=crop&q=80"
                  alt="Gold investment"
                  className="w-full h-full object-cover opacity-60"
                  onError={(e) => { e.target.style.display='none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-transparent"></div>
                <div className="absolute inset-0 flex items-center pl-6">
                  <div>
                    <p className="text-yellow-400 font-bold text-lg">$50M+</p>
                    <p className="text-gray-300 text-sm">Trading Volume</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="text-5xl">🏢</div>
              <h2 className="text-5xl font-bold">About <span className="text-yellow-400">Profit Vision FX</span></h2>
            </div>
          </div>
          <div className="max-w-4xl mx-auto space-y-6 text-center animate-fade-in-up">
            <p className="text-gray-300 leading-relaxed text-lg">
              Profit Vision FX is <span className="text-yellow-400 font-semibold">Registered in UK</span> and based in Dubai, with a team of pro-traders & mentors.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg">
              They use their knowledge & expertise to generate profits daily, monthly, and yearly.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg">
              The team has strong fundamentals & technical knowledge applied during live trading.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg">
              Plans to expand worldwide and provide financial freedom opportunities to clients.
            </p>
            <div className="pt-8 mt-8 border-t border-yellow-500/20">
              <p className="text-gray-200 leading-relaxed text-lg">
                With a vision to expand globally, Profit Vision aims to create a trusted platform where clients can learn, grow, and achieve lasting financial freedom. We're not just trading; we're building opportunities for wealth, stability, and success for individuals worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <p className="text-yellow-400 font-semibold tracking-widest uppercase mb-2">What We Offer</p>
            <h2 className="text-5xl font-bold mb-2">
              Our <span className="text-yellow-400">Services</span>
            </h2>
          </div>

          {/* Manual Trading Signals */}
          <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-500/20 rounded-xl"><TrendingUp className="text-yellow-400" size={28}/></div>
                <h3 className="text-3xl font-bold">Manual Trading <span className="text-yellow-400">Signals</span></h3>
              </div>
              <p className="text-gray-400 mb-6">Receive high-probability trade setups based on:</p>
              <div className="space-y-3 mb-6">
                {[
                  'Multi-timeframe analysis',
                  'Liquidity zones & institutional levels',
                  'Price action confirmations (Pin bar, Engulfing, etc.)',
                  'RSI & momentum confluence'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="text-yellow-400 flex-shrink-0" size={16}/>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Clear Entry, SL, TP', 'Intraday + Swing', 'Risk-managed'].map((tag, i) => (
                  <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-center text-xs text-yellow-300 font-semibold">✔ {tag}</div>
                ))}
              </div>
            </div>
            <div className="relative animate-fade-in-up" style={{animationDelay:'0.2s'}}>
              <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl blur-2xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-yellow-500/30 h-72">
                <img src="https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=700&h=400&fit=crop&q=80" alt="Manual Trading" className="w-full h-full object-cover opacity-70" onError={(e) => e.target.style.display='none'}/>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Copy Trading */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative animate-fade-in-up order-2 md:order-1">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl"></div>
              <div className="relative rounded-2xl overflow-hidden border border-blue-500/30 h-72">
                <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&h=400&fit=crop&q=80" alt="Copy Trading" className="w-full h-full object-cover opacity-70" onError={(e) => e.target.style.display='none'}/>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              </div>
            </div>
            <div className="animate-fade-in-up order-1 md:order-2" style={{animationDelay:'0.2s'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl"><Users className="text-blue-400" size={28}/></div>
                <h3 className="text-3xl font-bold">Copy Trading <span className="text-blue-400">System</span></h3>
              </div>
              <p className="text-gray-300 mb-4 font-medium">Automated Wealth System — mirror trades from our master account in real-time.</p>
              <p className="text-gray-400 mb-6">Why Choose Our Copy Trading?</p>
              <div className="space-y-3">
                {[
                  'Fully automated execution',
                  'Lot size proportional to your equity',
                  'Transparent performance tracking',
                  'Designed for consistency, not gambling'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="text-blue-400 flex-shrink-0" size={16}/>
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-blue-300 italic">👉 Ideal for investors who want passive participation in forex markets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Education System Section */}
      <section id="education" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <p className="text-yellow-400 font-semibold tracking-widest uppercase mb-2">Grow Your Knowledge</p>
            <h2 className="text-5xl font-bold mb-2">Education <span className="text-yellow-400">System</span></h2>
            <p className="text-gray-400">Learn Like a Professional Trader</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up space-y-4">
              <p className="text-gray-300">Our education system is designed to take you from beginner to advanced level with real market understanding.</p>
              <div className="space-y-3">
                {[
                  { icon: '📐', title: 'Market Structure & Price Action' },
                  { icon: '🎯', title: 'Support & Resistance Mastery' },
                  { icon: '💡', title: 'Liquidity & Smart Money Concepts' },
                  { icon: '🛡️', title: 'Risk Management (1% Rule, Capital Protection)' },
                  { icon: '🧠', title: 'Trading Psychology & Discipline' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-800/40 border border-yellow-500/20 rounded-xl px-5 py-3 hover:border-yellow-500/50 transition-all">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-gray-200 font-medium">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-fade-in-up space-y-4" style={{animationDelay:'0.2s'}}>
              <div className="relative bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2"><BookOpen size={20}/> Additional Features</h3>
                <div className="space-y-3">
                  {[
                    { icon: '🎥', text: 'Live Trading Sessions' },
                    { icon: '📊', text: 'Real-time Market Breakdown' },
                    { icon: '🗺️', text: 'Strategy Development Guidance' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-gray-300">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden h-40 border border-yellow-500/20">
                <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&h=300&fit=crop&q=80" alt="Education" className="w-full h-full object-cover opacity-50" onError={(e) => e.target.style.display='none'}/>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-transparent flex items-center pl-6">
                  <div>
                    <p className="text-yellow-400 font-bold text-lg">Beginner → Advanced</p>
                    <p className="text-gray-400 text-sm">Structured Learning Path</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Program Section */}
      <section id="referral" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-yellow-900/5 to-transparent z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <p className="text-yellow-400 font-semibold tracking-widest uppercase mb-2">Earn More</p>
            <h2 className="text-5xl font-bold mb-2">Referral <span className="text-yellow-400">Program</span></h2>
            <p className="text-gray-400">Turn Your Network into Income</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <p className="text-gray-300 mb-6 text-lg">Join our high-reward referral program and earn commissions by introducing clients to ProfitVision FX.</p>
              <div className="space-y-4">
                {[
                  { icon: '💎', title: 'Attractive Commission Structure', desc: 'Earn competitive commissions on every successful referral' },
                  { icon: '📡', title: 'Real-time Tracking', desc: 'Monitor your referrals and earnings in real-time' },
                  { icon: '♾️', title: 'Unlimited Earning Potential', desc: 'No cap on how much you can earn through referrals' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 bg-slate-800/40 border border-yellow-500/20 rounded-xl p-4 hover:border-yellow-500/50 transition-all">
                    <span className="text-3xl">{item.icon}</span>
                    <div>
                      <p className="font-bold text-white">✔ {item.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-yellow-300 italic text-sm">👉 Build a passive income stream while growing with us.</p>
            </div>
            <div className="animate-fade-in-up" style={{animationDelay:'0.2s'}}>
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/10 rounded-2xl blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-500/40 rounded-2xl p-8">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">How It Works</h3>
                  <div className="space-y-5">
                    {[
                      { step: '1', text: 'Join our referral program' },
                      { step: '2', text: 'Share your unique referral link' },
                      { step: '3', text: 'Friend signs up & deposits' },
                      { step: '4', text: 'You earn your commission' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center font-bold text-slate-900 flex-shrink-0">{item.step}</div>
                        <div className="flex-1 h-px bg-yellow-500/20"></div>
                        <p className="text-gray-300 flex-1">{item.text}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => navigate('/signup')} className="w-full mt-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg font-bold text-slate-900 hover:shadow-lg hover:shadow-yellow-500/30 transition-all">
                    Join Referral Program
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Types of Trading */}
      <section id="trading" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl font-bold mb-2">
              Types of <span className="text-yellow-400">Trading</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Manual Trading',
                description: 'Trade on your own decisions with full control over your strategy and risk management.',
                icon: '📈',
                features: ['Full Control', 'Personal Strategy', 'Real-time Decisions']
              },
              {
                title: 'Copy Trading',
                description: 'Follow expert traders\' strategies and earn without active daily trading.',
                icon: '👥',
                features: ['Expert Strategies', 'Passive Income', 'Risk Management']
              }
            ].map((type, i) => (
              <div key={i} className="group relative animate-fade-in-up" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-yellow-500/30 rounded-2xl p-8 hover:border-yellow-500/60 transition-all duration-300">
                  <div className="text-4xl mb-4">{type.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{type.title}</h3>
                  <p className="text-gray-400 mb-6">{type.description}</p>
                  <div className="space-y-2">
                    {type.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Path */}
      <section id="career" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl font-bold mb-2">
              Career Path in <span className="text-yellow-400">Trading</span>
            </h2>
          </div>

          <div className="space-y-8 max-w-2xl mx-auto">
            {[
              { step: '1', title: 'Learn Forex Basics & Advanced Concepts', desc: 'Study charts, indicators, currency pairs, and risk management.' },
              { step: '2', title: 'Trade Manually in Your Own Account', desc: 'Practice strategies, manage risk, and understand market behavior firsthand.' },
              { step: '3', title: 'Trade in Company Account', desc: 'Gain experience trading professionally while sharing profits with Prop Fund.' },
              { step: '4', title: 'Invest and Enjoy Copy Trading', desc: 'Mirror successful traders and earn without active daily trading.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start animate-fade-in-up" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 text-white font-bold text-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Copy Trading Earning */}
      <section id="earning" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl font-bold mb-2">
              How to Earn with <span className="text-yellow-400">Copy Trading</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex gap-4">
                <div className="text-yellow-400 font-bold text-xl">◆</div>
                <div>
                  <p className="font-semibold">Open a Trading Account</p>
                  <p className="text-gray-400 text-sm">Minimum deposit: $1,000 & above</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-yellow-400 font-bold text-xl">◆</div>
                <div>
                  <p className="font-semibold">Profit Sharing</p>
                  <p className="text-gray-400 text-sm">50% - You | 50% - Company</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-yellow-400 font-bold text-xl">◆</div>
                <div>
                  <p className="font-semibold">Expected Returns</p>
                  <p className="text-gray-400 text-sm">2x in 18 months</p>
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 rounded-2xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 backdrop-blur border-2 border-yellow-500/50 rounded-2xl p-8 shadow-lg shadow-yellow-500/20">
                <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                  ✓ Example Calculation
                </h3>
                <div className="space-y-3 text-sm text-gray-200">
                  <div className="flex justify-between">
                    <span>Account size</span>
                    <span className="font-semibold">$1,100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily profit assumption (1%)</span>
                    <span className="font-semibold">$10</span>
                  </div>
                  <div className="border-t border-yellow-500/30 pt-3 flex justify-between">
                    <span>Your share (50%)</span>
                    <span className="font-semibold text-yellow-400">$5/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly income</span>
                    <span className="font-semibold text-yellow-400">$110</span>
                  </div>
                  <div className="border-t border-yellow-500/30 pt-3 flex justify-between">
                    <span>In 18 months</span>
                    <span className="font-semibold text-yellow-400">$1,980 (~200%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl font-bold mb-2">
              Our Traders'
              <br />
              <span className="text-yellow-400">Reviews</span>
            </h2>
          </div>

          <div className="relative animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-blue-500/20 rounded-2xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-yellow-500/30 rounded-2xl p-8">
              <p className="text-gray-300 mb-6 italic text-lg">{testimonials[activeTestimonial].text}</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold">
                  {testimonials[activeTestimonial].avatar}
                </div>
                <div>
                  <p className="font-bold text-white">{testimonials[activeTestimonial].name}</p>
                  <p className="text-sm text-gray-400">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-slate-900"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-slate-900"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <p className="text-yellow-400 font-semibold tracking-widest uppercase mb-2">Get in Touch</p>
            <h2 className="text-5xl font-bold mb-2">
              We're Here to <span className="text-yellow-400">Support You</span>
            </h2>
            <p className="text-gray-400 text-lg">Our dedicated support team ensures smooth onboarding and quick assistance.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Mail, title: 'Email', content: 'support@profitvisionfx.com', link: 'mailto:support@profitvisionfx.com', color: 'yellow' },
              { icon: Phone, title: 'WhatsApp', content: '+91-XXXXXXXXXX', link: 'https://wa.me/91XXXXXXXXXX', color: 'green' },
              { icon: MapPin, title: 'Location', content: 'Dubai, UAE', link: '#', color: 'blue' },
              { icon: Shield, title: 'Support Hours', content: 'Mon–Fri (Market Hours)', link: '#', color: 'yellow' }
            ].map((contact, i) => (
              <div key={i} className="group relative animate-fade-in-up" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-yellow-500/30 rounded-2xl p-6 text-center hover:border-yellow-500/60 transition-all duration-300">
                  <contact.icon className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-1">{contact.title}</h3>
                  <a href={contact.link} className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">{contact.content}</a>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <div className="relative animate-fade-in-up">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-blue-500/20 rounded-2xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur border border-yellow-500/30 rounded-2xl p-8">
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  setContactLoading(true)
                  setContactMessage('')

                  try {
                    const response = await fetch('/api/contact/send', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(contactForm)
                    })

                    const data = await response.json()

                    if (response.ok && data.success) {
                      setContactMessage('✓ Message sent successfully! We will get back to you soon.')
                      setContactForm({ name: '', email: '', message: '' })
                      setTimeout(() => setContactMessage(''), 5000)
                    } else {
                      setContactMessage('✗ ' + (data.message || 'Failed to send message. Please try again.'))
                    }
                  } catch (error) {
                    console.error('Contact form error:', error)
                    setContactMessage('✗ Error sending message. Please try again later.')
                  } finally {
                    setContactLoading(false)
                  }
                }} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full bg-slate-700/50 border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full bg-slate-700/50 border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      placeholder="Your Message"
                      rows="4"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="w-full bg-slate-700/50 border border-yellow-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                      required
                    ></textarea>
                  </div>
                  {contactMessage && (
                    <div className={`p-3 rounded-lg text-center font-semibold ${
                      contactMessage.startsWith('✓') 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {contactMessage}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg py-3 font-bold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 text-slate-900 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {contactLoading ? 'Sending...' : 'Send Message'}
                    {!contactLoading && <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setLegalModal(null)}></div>
          <div className="relative bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto z-10">
            <button onClick={() => setLegalModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24}/></button>
            {legalModal === 'risk' && (
              <div>
                <div className="flex items-center gap-3 mb-6"><AlertTriangle className="text-yellow-400" size={28}/><h2 className="text-2xl font-bold text-yellow-400">Risk Disclosure</h2></div>
                <div className="space-y-4 text-gray-300 leading-relaxed text-sm">
                  <p>Trading in forex, commodities, and leveraged financial instruments carries a <strong className="text-yellow-400">high level of risk</strong> and may not be suitable for all investors.</p>
                  <p>You should carefully consider your investment objectives, level of experience, and risk appetite before participating in trading. There is a possibility of <strong className="text-red-400">losing some or all of your invested capital.</strong></p>
                  <p>ProfitVision FX does not guarantee profits or protection from losses. All trading decisions, whether manual or through copy trading, are ultimately the responsibility of the client.</p>
                  <p className="italic text-gray-400">Past performance is not indicative of future results.</p>
                </div>
              </div>
            )}
            {legalModal === 'terms' && (
              <div>
                <div className="flex items-center gap-3 mb-6"><FileText className="text-yellow-400" size={28}/><h2 className="text-2xl font-bold text-yellow-400">Terms & Conditions</h2></div>
                <div className="space-y-3 text-gray-300 leading-relaxed text-sm">
                  <p>By accessing and using our services, you agree to the following:</p>
                  <ol className="list-decimal list-inside space-y-2 pl-2">
                    <li>You understand the risks involved in trading.</li>
                    <li>You are responsible for your investment decisions.</li>
                    <li>ProfitVision FX provides trading assistance, not financial advice.</li>
                    <li>Copy trading results may vary depending on account size, broker conditions, and execution speed.</li>
                    <li>We reserve the right to modify services, pricing, or policies at any time without prior notice.</li>
                  </ol>
                </div>
              </div>
            )}
            {legalModal === 'privacy' && (
              <div>
                <div className="flex items-center gap-3 mb-6"><Lock className="text-yellow-400" size={28}/><h2 className="text-2xl font-bold text-yellow-400">Privacy Policy</h2></div>
                <div className="space-y-4 text-gray-300 leading-relaxed text-sm">
                  <p>At ProfitVision FX, we value your privacy and are committed to protecting your personal information.</p>
                  <div>
                    <p className="font-semibold text-white mb-2">We collect:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Name, email, phone number</li>
                      <li>Trading-related preferences</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-2">We use your data to:</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>Provide services</li>
                      <li>Improve user experience</li>
                      <li>Communicate important updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative border-t border-yellow-500/20 py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-yellow-900/10 to-transparent z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={logo} alt="ProfitVision FX" className="h-10 w-auto" />
                <span className="font-bold text-yellow-400">ProfitVision FX</span>
              </div>
              <p className="text-gray-400 text-sm">Trade Smarter. Grow Stronger. Scale Consistently.</p>
              <p className="text-gray-500 text-xs mt-2">Registered UK | Based in Dubai</p>
            </div>
            <div>
              <p className="font-bold text-white mb-3">Quick Links</p>
              <div className="space-y-2">
                {['About', 'Services', 'Education', 'Referral', 'Contact'].map((item) => (
                  <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm">{item}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-white mb-3">Legal</p>
              <div className="space-y-2">
                <button onClick={() => setLegalModal('risk')} className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm flex items-center gap-2"><AlertTriangle size={14}/> Risk Disclosure</button>
                <button onClick={() => setLegalModal('terms')} className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm flex items-center gap-2"><FileText size={14}/> Terms & Conditions</button>
                <button onClick={() => setLegalModal('privacy')} className="block text-gray-400 hover:text-yellow-400 transition-colors text-sm flex items-center gap-2"><Lock size={14}/> Privacy Policy</button>
              </div>
            </div>
          </div>
          <div className="border-t border-yellow-500/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© 2024 ProfitVision FX. All rights reserved.</p>
            <p className="text-gray-600 text-xs">⚠️ Trading involves significant risk. Please trade responsibly.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}

export default ProfitVisionLanding
