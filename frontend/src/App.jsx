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
import CashBook from './pages/CashBook'
import Taxes from './pages/Taxes'
import ExpenseReport from './pages/ExpenseReport'
import DirectCostReport from './pages/DirectCostReport'

const BRAND  = '#0a2744'
const ACCENT = '#f9a825'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/',         label: 'Dashboard',    icon: '📊' },
    ]
  },
  {
    label: 'Income & Costs',
    items: [
      { to: '/revenue',      label: 'Revenue',        icon: '💰' },
      { to: '/direct-costs', label: 'Direct Costs',   icon: '🏭' },
      { to: '/expenses',     label: 'Admin Expenses', icon: '📋' },
      { to: '/taxes',        label: 'Tax Payments',   icon: '🧾' },
    ]
  },
  {
    label: 'Assets & Partners',
    items: [
      { to: '/fixed-assets', label: 'Fixed Assets', icon: '🏗️' },
      { to: '/vendors',      label: 'Vendors',      icon: '🤝' },
      { to: '/payments',     label: 'Payments',     icon: '💳' },
    ]
  },
  {
    label: 'Reports',
    items: [
      { to: '/pnl',            label: 'P&L Statement',    icon: '📈' },
      { to: '/balance-sheet',  label: 'Balance Sheet',    icon: '⚖️' },
      { to: '/cashbook',       label: 'Cash Book',        icon: '📒' },
      { to: '/expense-report', label: 'Expense Analysis', icon: '📑' },
      { to: '/direct-cost-report', label: 'Direct Cost Analysis', icon: '🏭' },
    ]
  },
]

function Sidebar({ onLogout }) {
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a2744 0%, #0d3360 60%, #0a2744 100%)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      zIndex: 100,
      borderRight: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
    }}>

      <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src="/logo.jpg" alt="Simba Media" style={{
              width: 44, height: 44, borderRadius: 10,
              objectFit: 'cover', display: 'block',
              border: '2px solid rgba(249,168,37,0.5)',
            }} />
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 10, height: 10, borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #0a2744',
            }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, lineHeight: 1.2, letterSpacing: '-0.2px' }}>Simba Media</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>Ghana</div>
            <div style={{ color: ACCENT, fontSize: 10, marginTop: 2, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Finance Tracker</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        {NAV_SECTIONS.map(function(section) { return (
          <div key={section.label} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
              textTransform: 'uppercase', letterSpacing: '1.2px',
              padding: '8px 10px 4px',
            }}>{section.label}</div>
            {section.items.map(function(item) { return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                style={function(p) { return {
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8, marginBottom: 1,
                  textDecoration: 'none', fontSize: 13, fontWeight: p.isActive ? 700 : 500,
                  color: p.isActive ? '#0a2744' : 'rgba(255,255,255,0.78)',
                  background: p.isActive
                    ? 'linear-gradient(135deg, #f9a825 0%, #fbbf24 100%)'
                    : 'transparent',
                  boxShadow: p.isActive ? '0 2px 8px rgba(249,168,37,0.35)' : 'none',
                  transition: 'all 0.15s ease',
                  letterSpacing: '-0.1px',
                }; }}>
                <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ); })}
          </div>
        ); })}
      </nav>

      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onLogout} style={{
          width: '100%', padding: '9px 12px',
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 0.15s',
        }}
          onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}>
          <span style={{ fontSize: 14 }}>🚪</span> Sign Out
        </button>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 10, letterSpacing: '0.3px' }}>
          © {new Date().getFullYear()} Simba Media Ghana Ltd
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(!!getToken())

  const handleLogin  = () => setAuthed(true)
  const handleLogout = async () => {
    await apiFetch('/api/logout', { method: 'POST' })
    clearToken()
    setAuthed(false)
  }

  if (!authed) return <Login onLogin={handleLogin} />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
        <Sidebar onLogout={handleLogout} />
        <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
          <Routes>
            <Route path="/"               element={<Dashboard />} />
            <Route path="/revenue"        element={<Revenue />} />
            <Route path="/direct-costs"   element={<DirectCosts />} />
            <Route path="/expenses"       element={<Expenses />} />
            <Route path="/fixed-assets"   element={<FixedAssets />} />
            <Route path="/vendors"        element={<Vendors />} />
            <Route path="/payments"       element={<Payments />} />
            <Route path="/pnl"            element={<PnL />} />
            <Route path="/balance-sheet"  element={<BalanceSheet />} />
            <Route path="/cashbook"       element={<CashBook />} />
            <Route path="/taxes"          element={<Taxes />} />
            <Route path="/expense-report" element={<ExpenseReport />} />
            <Route path="/direct-cost-report" element={<DirectCostReport />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
