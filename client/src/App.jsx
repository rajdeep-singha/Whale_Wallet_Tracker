import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.PROD 
  ? 'https://whale-wallet-tracker.onrender.com/'  : ''  

const WHALE_WALLETS = [
  { address: "0x28C6c06298d514Db089934071355E5743bf21d60", name: "Binance Hot Wallet" },
  { address: "0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549", name: "Binance Cold Wallet" },
  { address: "0xDFd5293D8e347dFe59E90eFd55b2956a1343963d", name: "Kraken" },
  { address: "0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0", name: "Kraken 4" },
]

function formatAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatNumber(num, decimals = 2) {
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B'
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M'
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K'
  return num.toFixed(decimals)
}

function App() {
  const [selectedWallet, setSelectedWallet] = useState(WHALE_WALLETS[0])
  const [balances, setBalances] = useState(null)
  const [transactions, setTransactions] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState({ balances: false, transactions: false, analysis: false })
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAllData()
  }, [selectedWallet])

  async function fetchAllData() {
    setError(null)
    setLoading({ balances: true, transactions: true, analysis: true })

    try {
      const [balRes, txRes, analysisRes] = await Promise.all([
        fetch(`${API_BASE}/api/balances/${selectedWallet.address}`),
        fetch(`${API_BASE}/api/transactions/${selectedWallet.address}`),
        fetch(`${API_BASE}/api/analyze/${selectedWallet.address}`)
      ])

      if (!balRes.ok || !txRes.ok || !analysisRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [balData, txData, analysisData] = await Promise.all([
        balRes.json(),
        txRes.json(),
        analysisRes.json()
      ])

      setBalances(balData)
      setTransactions(txData)
      setAnalysis(analysisData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading({ balances: false, transactions: false, analysis: false })
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1><span>🐋</span> Whale Watcher</h1>
        <p>Real-time monitoring of major cryptocurrency whale wallets</p>
      </header>

      <div className="wallet-selector">
        {WHALE_WALLETS.map((wallet) => (
          <button
            key={wallet.address}
            className={`wallet-btn ${selectedWallet.address === wallet.address ? 'active' : ''}`}
            onClick={() => setSelectedWallet(wallet)}
          >
            <span className="wallet-name">{wallet.name}</span>
            <span>{formatAddress(wallet.address)}</span>
          </button>
        ))}
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      <div className="dashboard">
        {/* Analysis Card */}
        <div className="card analysis-card">
          <div className="card-header">
            <span className="icon">📊</span>
            <h2>Whale Activity Analysis</h2>
          </div>
          
          {loading.analysis ? (
            <div className="loading">
              <div className="spinner"></div>
              <span>Analyzing whale activity...</span>
            </div>
          ) : analysis ? (
            <>
              <div className="analysis-grid">
                <div className={`stat-box ${analysis.signal}`}>
                  <div className="label">Outgoing (Last 10)</div>
                  <div className="value">{analysis.depositCount}</div>
                </div>
                <div className={`stat-box ${analysis.signal}`}>
                  <div className="label">Incoming (Last 10)</div>
                  <div className="value">{analysis.withdrawCount}</div>
                </div>
                <div className="stat-box neutral">
                  <div className="label">Total ETH Moved</div>
                  <div className="value">{formatNumber(analysis.totalValue, 4)}</div>
                </div>
                <div className="stat-box neutral">
                  <div className="label">Transactions</div>
                  <div className="value">{analysis.txCount}</div>
                </div>
              </div>
              <div className={`signal-banner ${analysis.signal}`}>
                <span className="signal-icon">
                  {analysis.signal === 'bullish' ? '🐂' : analysis.signal === 'bearish' ? '🐻' : 'ℹ️'}
                </span>
                <span>{analysis.message}</span>
              </div>
            </>
          ) : (
            <div className="empty">No analysis data available</div>
          )}
        </div>

        {/* Balances Card */}
        <div className="card">
          <div className="card-header">
            <span className="icon">💰</span>
            <h2>Token Holdings</h2>
          </div>
          
          {loading.balances ? (
            <div className="loading">
              <div className="spinner"></div>
              <span>Loading balances...</span>
            </div>
          ) : balances?.items ? (
            <div className="token-list">
              {balances.items
                .filter(item => item.quote > 1000)
                .slice(0, 15)
                .map((token, i) => {
                  const balance = parseFloat(token.balance) / Math.pow(10, token.contract_decimals)
                  return (
                    <div key={i} className="token-item">
                      <div className="token-info">
                        <div className="token-logo">
                          {token.logo_url ? (
                            <img src={token.logo_url} alt={token.contract_ticker_symbol} />
                          ) : (
                            token.contract_ticker_symbol?.slice(0, 2) || '?'
                          )}
                        </div>
                        <div>
                          <div className="token-name">{token.contract_ticker_symbol || 'Unknown'}</div>
                          <div className="token-balance">{formatNumber(balance)}</div>
                        </div>
                      </div>
                      <div className="token-value">
                        <div className="token-usd">${formatNumber(token.quote)}</div>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="empty">No balance data available</div>
          )}
        </div>

        {/* Transactions Card */}
        <div className="card">
          <div className="card-header">
            <span className="icon">📜</span>
            <h2>Recent Transactions</h2>
          </div>
          
          {loading.transactions ? (
            <div className="loading">
              <div className="spinner"></div>
              <span>Loading transactions...</span>
            </div>
          ) : transactions?.items ? (
            <div className="tx-list">
              {transactions.items.slice(0, 15).map((tx, i) => {
                const isOutgoing = tx.from_address?.toLowerCase() === selectedWallet.address.toLowerCase()
                const value = parseFloat(tx.value || 0) / 1e18
                const date = tx.block_signed_at ? new Date(tx.block_signed_at).toLocaleDateString() : 'N/A'
                
                return (
                  <div key={i} className="tx-item">
                    <div className={`tx-direction ${isOutgoing ? 'out' : 'in'}`}>
                      {isOutgoing ? '↗️' : '↙️'}
                    </div>
                    <div className="tx-details">
                      <div className={`tx-type ${isOutgoing ? 'out' : 'in'}`}>
                        {isOutgoing ? 'Outgoing' : 'Incoming'}
                      </div>
                      <div className="tx-hash">{formatAddress(tx.tx_hash)}</div>
                    </div>
                    <div className="tx-amount">
                      <div className="tx-eth">{value.toFixed(4)} ETH</div>
                      <div className="tx-date">{date}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty">No transaction data available</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

