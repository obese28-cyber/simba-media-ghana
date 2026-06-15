import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { getToken, clearToken, apiFetch } from './auth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Revenue from './pages/Revenue'
import DirectCosts from './pages/DirectCosts'
import Expenses from './pages/Expenses'
import Vendors from './pages/Vendors'
import Payments from './pages/Payments'
import PnL from './pages/PnL'
import BalanceSheet from './pages/BalanceSheet'
import FixedAssets from './pages/FixedAssets'

const BRAND  = '#0a3d62'
const ACCENT = '#f9a825'

const NAV_ITEMS = [
  { to: '/',              label: 'Dashboard',      icon: '📊' },
  { to: '/revenue',       label: 'Revenue',        icon: '💰' },
  { to: '/direct-costs',  label: 'Direct Costs',   icon: '🏭' },
  { to: '/expenses',      label: 'Admin Expenses', icon: '📋' },
  { to: '/fixed-assets',  label: 'Fixed Assets',   icon: '🏗️' },
  { to: '/vendors',       label: 'Vendors',        icon: '🤝' },
  { to: '/payments',      label: 'Payments',       icon: '💳' },
  { to: '/pnl',           label: 'P&L Statement',  icon: '📈' },
  { to: '/balance-sheet', label: 'Balance Sheet',  icon: '⚖️' },
]

function Sidebar({ onLogout }) {
  return (
    <aside style={{
      width: 230, minHeight: '100vh', background: BRAND,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
    }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <img src="/logo.jpg" alt="Simba Media" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', display: 'block', marginBottom: 10 }} />
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Simba Media Ghana</div>
        <div style={{ color: ACCENT, fontSize: 11, marginTop: 3, fontWeight: 600 }}>Finance Tracker</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              color: isActive ? BRAND : 'rgba(255,255,255,0.82)',
              background: isActive ? ACCENT : 'transparent',
              transition: 'all 0.15s',
            })}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={onLogout} style={{
          width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}>
          🚪 Sign Out
        </button>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 8 }}>
          © {new Date().getFullYear()} Simba Media Ghana Ltd
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken())

  const handleLogout = async () => {
    await apiFetch('/api/logout', { method: 'POST' })
    clearToken()
    setAuthed(false)
  }

  if (!authed) return <Login onLogin={() => setAuthed(true)} />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar onLogout={handleLogout} />
        <main style={{ marginLeft: 230, flex: 1, minHeight: '100vh', padding: '28px 32px' }}>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/revenue"       element={<Revenue />} />
            <Route path="/direct-costs"  element={<DirectCosts />} />
            <Route path="/expenses"      element={<Expenses />} />
            <Route path="/fixed-assets"  element={<FixedAssets />} />
            <Route path="/vendors"       element={<Vendors />} />
            <Route path="/payments"      element={<Payments />} />
            <Route path="/pnl"           element={<PnL />} />
            <Route path="/balance-sheet" element={<BalanceSheet />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
