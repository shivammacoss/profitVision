import React, { useState, useEffect } from 'react'
import { 
  Wallet, Plus, Edit2, Trash2, Save, X, QrCode, Copy, Check, 
  RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Clock, AlertTriangle,
  ExternalLink, Search, Filter
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

export default function AdminManualCrypto({ isDarkMode = true }) {
  const [activeTab, setActiveTab] = useState('wallets') // 'wallets' or 'deposits'
  const [wallets, setWallets] = useState([])
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [depositFilter, setDepositFilter] = useState('Pending')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedDeposit, setSelectedDeposit] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    currency: 'USDT',
    network: 'BEP20',
    address: '',
    qrCodeData: '',
    displayName: '',
    feePercentage: 0.5,
    minDeposit: 10,
    maxDeposit: 50000,
    instructions: 'Send the exact amount shown to the wallet address. After sending, submit your transaction hash for verification.'
  })

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  useEffect(() => {
    if (activeTab === 'wallets') {
      fetchWallets()
    } else {
      fetchDeposits()
    }
  }, [activeTab, depositFilter])

  const fetchWallets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/manual-crypto/admin/wallets`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setWallets(data.wallets)
      }
    } catch (error) {
      console.error('Error fetching wallets:', error)
    }
    setLoading(false)
  }

  const fetchDeposits = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/manual-crypto/admin/pending-deposits?status=${depositFilter}`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setDeposits(data.deposits)
      }
    } catch (error) {
      console.error('Error fetching deposits:', error)
    }
    setLoading(false)
  }

  const handleSaveWallet = async () => {
    try {
      const url = editingWallet 
        ? `${API_URL}/manual-crypto/admin/wallets/${editingWallet._id}`
        : `${API_URL}/manual-crypto/admin/wallets`
      
      const res = await fetch(url, {
        method: editingWallet ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: editingWallet ? 'Wallet updated!' : 'Wallet created!' })
        setShowAddModal(false)
        setEditingWallet(null)
        resetForm()
        fetchWallets()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving wallet' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleDeleteWallet = async (walletId) => {
    if (!confirm('Are you sure you want to delete this wallet?')) return
    
    try {
      const res = await fetch(`${API_URL}/manual-crypto/admin/wallets/${walletId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Wallet deleted!' })
        fetchWallets()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting wallet' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleToggleActive = async (wallet) => {
    try {
      const res = await fetch(`${API_URL}/manual-crypto/admin/wallets/${wallet._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !wallet.isActive })
      })
      const data = await res.json()
      if (data.success) {
        fetchWallets()
      }
    } catch (error) {
      console.error('Error toggling wallet:', error)
    }
  }

  const handleApproveDeposit = async (transactionId) => {
    try {
      const res = await fetch(`${API_URL}/manual-crypto/admin/approve/${transactionId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminRemarks: 'Approved by admin' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Deposit approved! New balance: $${data.newWalletBalance}` })
        fetchDeposits()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error approving deposit' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleRejectDeposit = async (transactionId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    
    try {
      const res = await fetch(`${API_URL}/manual-crypto/admin/reject/${transactionId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Deposit rejected' })
        fetchDeposits()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error rejecting deposit' })
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const resetForm = () => {
    setFormData({
      currency: 'USDT',
      network: 'BEP20',
      address: '',
      qrCodeData: '',
      displayName: '',
      feePercentage: 0.5,
      minDeposit: 10,
      maxDeposit: 50000,
      instructions: 'Send the exact amount shown to the wallet address. After sending, submit your transaction hash for verification.'
    })
  }

  const openEditModal = (wallet) => {
    setEditingWallet(wallet)
    setFormData({
      currency: wallet.currency,
      network: wallet.network,
      address: wallet.address,
      qrCodeData: wallet.qrCodeData || '',
      displayName: wallet.displayName || '',
      feePercentage: wallet.feePercentage,
      minDeposit: wallet.minDeposit,
      maxDeposit: wallet.maxDeposit,
      instructions: wallet.instructions
    })
    setShowAddModal(true)
  }

  const handleQrUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, qrCodeData: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const getBlockchainExplorerUrl = (network, txHash) => {
    const explorers = {
      'BEP20': `https://bscscan.com/tx/${txHash}`,
      'ERC20': `https://etherscan.io/tx/${txHash}`,
      'TRC20': `https://tronscan.org/#/transaction/${txHash}`,
      'Bitcoin': `https://blockchain.com/btc/tx/${txHash}`,
      'Solana': `https://solscan.io/tx/${txHash}`
    }
    return explorers[network] || '#'
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-dark-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Wallet size={24} className="text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Manual Crypto Wallets</h1>
            <p className="text-gray-500 text-sm">Manage crypto wallets for manual deposits (0.5% fee)</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
            : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'wallets'
              ? 'bg-purple-500 text-white'
              : isDarkMode ? 'bg-dark-700 text-gray-400 hover:text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          <Wallet size={16} className="inline mr-2" />
          Wallets
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'deposits'
              ? 'bg-purple-500 text-white'
              : isDarkMode ? 'bg-dark-700 text-gray-400 hover:text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          <Clock size={16} className="inline mr-2" />
          Pending Deposits
          {deposits.filter(d => d.status === 'Pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {deposits.filter(d => d.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Wallets Tab */}
      {activeTab === 'wallets' && (
        <div>
          {/* Add Wallet Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => { resetForm(); setEditingWallet(null); setShowAddModal(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Add Wallet
            </button>
          </div>

          {/* Wallets Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw size={32} className="animate-spin text-purple-500" />
            </div>
          ) : wallets.length === 0 ? (
            <div className={`text-center py-12 rounded-xl ${isDarkMode ? 'bg-dark-800' : 'bg-white'}`}>
              <Wallet size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-500">No wallets configured yet</p>
              <p className="text-gray-600 text-sm">Add a wallet to enable manual crypto deposits</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map(wallet => (
                <div 
                  key={wallet._id} 
                  className={`rounded-xl border p-4 ${
                    isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'
                  } ${!wallet.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{wallet.currency}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        wallet.isActive 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {wallet.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(wallet)}
                        className="p-1.5 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Edit2 size={14} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteWallet(wallet._id)}
                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Network:</span>
                      <span className="font-medium">{wallet.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fee:</span>
                      <span className="font-medium text-green-400">{wallet.feePercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Min/Max:</span>
                      <span className="font-medium">${wallet.minDeposit} - ${wallet.maxDeposit}</span>
                    </div>
                  </div>

                  <div className={`mt-3 p-2 rounded text-xs font-mono break-all ${
                    isDarkMode ? 'bg-dark-700' : 'bg-gray-100'
                  }`}>
                    {wallet.address}
                  </div>

                  {wallet.qrCodeData && (
                    <div className="mt-3 flex justify-center">
                      <img src={wallet.qrCodeData} alt="QR Code" className="w-24 h-24 rounded" />
                    </div>
                  )}

                  <button
                    onClick={() => handleToggleActive(wallet)}
                    className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                      wallet.isActive
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {wallet.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deposits Tab */}
      {activeTab === 'deposits' && (
        <div>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {['Pending', 'Approved', 'Rejected', 'all'].map(status => (
              <button
                key={status}
                onClick={() => setDepositFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  depositFilter === status
                    ? 'bg-purple-500 text-white'
                    : isDarkMode ? 'bg-dark-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
            <button
              onClick={fetchDeposits}
              className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-dark-700' : 'bg-gray-200'}`}
            >
              <RefreshCw size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Deposits Table */}
          <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? 'bg-dark-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Currency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">TxHash</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center">
                        <RefreshCw size={24} className="animate-spin mx-auto text-purple-500" />
                      </td>
                    </tr>
                  ) : deposits.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No deposits found
                      </td>
                    </tr>
                  ) : (
                    deposits.map(deposit => (
                      <tr key={deposit._id} className={isDarkMode ? 'hover:bg-dark-700' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{deposit.userId?.firstName} {deposit.userId?.lastName}</p>
                            <p className="text-xs text-gray-500">{deposit.userId?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-bold text-green-400">${deposit.amount}</p>
                            <p className="text-xs text-gray-500">Paid: ${deposit.totalPaid || deposit.amount}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                            {deposit.cryptoCurrency} ({deposit.cryptoNetwork})
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs truncate max-w-[120px]">
                              {deposit.cryptoTxHash}
                            </span>
                            <a
                              href={getBlockchainExplorerUrl(deposit.cryptoNetwork, deposit.cryptoTxHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            deposit.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                            deposit.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {deposit.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(deposit.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedDeposit(deposit)
                                setShowDetailModal(true)
                              }}
                              className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {deposit.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveDeposit(deposit._id)}
                                  className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
                                  title="Approve"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => handleRejectDeposit(deposit._id)}
                                  className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                                  title="Reject"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Detail Modal */}
      {showDetailModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-xl p-6 ${isDarkMode ? 'bg-dark-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Transaction Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Deposit Info */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
                <h3 className="text-sm text-gray-400 mb-2">Deposit Request</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs">Amount</p>
                    <p className="text-2xl font-bold text-green-400">${selectedDeposit.amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Status</p>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      selectedDeposit.status === 'Approved' ? 'bg-green-500/20 text-green-400' :
                      selectedDeposit.status === 'Rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {selectedDeposit.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Payment Method</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedDeposit.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Date</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{new Date(selectedDeposit.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Currency</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedDeposit.cryptoCurrency} ({selectedDeposit.cryptoNetwork})</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Fee</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>${selectedDeposit.feeAmount || 0} ({selectedDeposit.feePercentage || 0.5}%)</p>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
                <h3 className="text-sm text-gray-400 mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs">Name</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedDeposit.userId?.firstName} {selectedDeposit.userId?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Email</p>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedDeposit.userId?.email}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Hash */}
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
                <h3 className="text-sm text-gray-400 mb-2">Transaction Hash</h3>
                <div className="flex items-center gap-2">
                  <p className={`font-mono text-sm break-all ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedDeposit.cryptoTxHash || 'N/A'}
                  </p>
                  {selectedDeposit.cryptoTxHash && (
                    <a
                      href={getBlockchainExplorerUrl(selectedDeposit.cryptoNetwork, selectedDeposit.cryptoTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex-shrink-0"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>

              {/* Screenshot */}
              {selectedDeposit.screenshotUrl && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-dark-700' : 'bg-gray-100'}`}>
                  <h3 className="text-sm text-gray-400 mb-2">Payment Screenshot</h3>
                  <img 
                    src={selectedDeposit.screenshotUrl} 
                    alt="Payment Screenshot" 
                    className="w-full max-h-64 object-contain rounded-lg cursor-pointer"
                    onClick={() => window.open(selectedDeposit.screenshotUrl, '_blank')}
                  />
                </div>
              )}

              {/* Actions */}
              {selectedDeposit.status === 'Pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleRejectDeposit(selectedDeposit._id)
                      setShowDetailModal(false)
                    }}
                    className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApproveDeposit(selectedDeposit._id)
                      setShowDetailModal(false)
                    }}
                    className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-xl p-6 ${isDarkMode ? 'bg-dark-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingWallet ? 'Edit Wallet' : 'Add New Wallet'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Currency & Network */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-dark-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    {['USDT', 'BTC', 'ETH', 'BNB', 'TRX', 'LTC', 'DOGE', 'SOL'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Network</label>
                  <select
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-dark-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    {['TRC20', 'ERC20', 'BEP20', 'Bitcoin', 'Ethereum', 'Solana', 'Litecoin', 'Dogecoin'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Wallet Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="0x..."
                  className={`w-full px-3 py-2 rounded-lg border font-mono text-sm ${
                    isDarkMode ? 'bg-dark-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              {/* QR Code Upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">QR Code Image</label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                    id="qr-upload"
                  />
                  <label
                    htmlFor="qr-upload"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${
                      isDarkMode ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <QrCode size={18} />
                    Upload QR
                  </label>
                  {formData.qrCodeData && (
                    <img src={formData.qrCodeData} alt="QR Preview" className="w-16 h-16 rounded" />
                  )}
                </div>
              </div>

              {/* Fee & Limits */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fee %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.feePercentage}
                    onChange={(e) => setFormData({ ...formData, feePercentage: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-dark-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Min $</label>
                  <input
                    type="number"
                    value={formData.minDeposit}
                    onChange={(e) => setFormData({ ...formData, minDeposit: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-dark-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max $</label>
                  <input
                    type="number"
                    value={formData.maxDeposit}
                    onChange={(e) => setFormData({ ...formData, maxDeposit: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode ? 'bg-dark-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Instructions for Users</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDarkMode ? 'bg-dark-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                  }`}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 py-2 rounded-lg ${
                    isDarkMode ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWallet}
                  className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editingWallet ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
