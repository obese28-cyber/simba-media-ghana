import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, BRAND, ACCENT } from '../utils'

const NAVY  = BRAND   // #0a3d62
const GOLD  = ACCENT  // #f9a825
const NAVY2 = '#1a5276'
const GOLD2 = '#fbc02d'

const fmtShort = (n) => {
  const v = Math.abs(Number(n || 0))
  if (v >= 1_000_000) return (n < 0 ? '-' : '') + 'GHS ' + (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000)     return (n < 0 ? '-' : '') + 'GHS ' + (v / 1_000).toFixed(1) + 'K'
  return fmt(n)
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: NAVY, borderRadius: 10, padding: '10px 16px', boxShadow: '0 8px 32px rgba(10,61,98,0.35)' }}>
      <p style={{ color: GOLD, fontWeight: 700, marginBottom: 6, fontSize: 12 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: '#fff', margin: '3px 0', fontSize: 12 }}>
          <span style={{ color: p.color }}>■</span> {p.name}: <strong>{fmtShort(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

const METRICS = [
  { key: 'revenue',      label: 'Total Revenue',  icon: '💰' },
  { key: 'direct_costs', label: 'Direct Costs',   icon: '⚙️' },
  { key: 'gross_profit', label: 'Gross Profit',   icon: '📊' },
  { key: 'expenses',     label: 'Admin Expenses', icon: '🧾' },
  { key: 'net_profit',   label: 'Net Profit',     icon: '🏆' },
]

export default function Dashboard() {
  const [year, setYear]       = useState(CURRENT_YEAR)
  const [month, setMonth]     = useState('')
  const [summary, setSummary] = useState(null)
  const [monthly, setMonthly] = useState([])

  useEffect(() => {
    let url = `/api/summary?year=${year}`
    if (month) url += `&month=${month}`
    apiFetch(url).then(r => r.json()).then(setSummary)
    apiFetch(`/api/monthly-summary?year=${year}`).then(r => r.json()).then(setMonthly)
  }, [year, month])

  const active = monthly.filter(r => r.revenue || r.direct_costs || r.expenses)

  const chartData = active.map(r => ({
    name: MONTHS[r.month - 1]?.slice(0, 3),
    Revenue:        r.revenue,
    Costs:          r.direct_costs + r.expenses,
    'Gross Profit': r.gross_profit,
    'Net Profit':   r.net_profit,
  }))

  const pieData = summary ? [
    { name: 'Revenue',   value: summary.revenue },
    { name: 'All Costs', value: summary.direct_costs + summary.expenses },
  ] : []

  const sel = {
    padding: '8px 12px', borderRadius: 8, border: 'none',
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%',
    outline: 'none'
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: 2 }}>

      {/* ── HEADER ── */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        borderRadius: 18, padding: '28px 32px', marginBottom: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: `0 8px 32px rgba(10,61,98,0.22)`
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 4, height: 32, background: GOLD, borderRadius: 4 }} />
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>Financial Overview</p>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2 }}>Simba Media Ghana</h1>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginLeft: 14 }}>
            {month ? `${MONTHS[month - 1]} ${year}` : `Full Year ${year}`} · Live Dashboard
          </p>
        </div>

        {/* Filters — vertical */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
          <label style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Year</label>
          <select value={year} onChange={e => setYear(+e.target.value)} style={sel}>
            {YEARS.map(y => <option key={y} value={y} style={{ background: NAVY, color: '#fff' }}>{y}</option>)}
          </select>
          <label style={{ fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 6 }}>Month</label>
          <select value={month} onChange={e => setMonth(e.target.value)} style={sel}>
            <option value="" style={{ background: NAVY }}>All Months</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1} style={{ background: NAVY }}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 22 }}>
        {METRICS.map((m, idx) => {
          const val = summary ? summary[m.key] : null
          const isAccent = idx % 2 === 1
          return (
            <div key={m.key} style={{
              background: isAccent ? GOLD : NAVY,
              borderRadius: 14, padding: '20px 20px',
              boxShadow: isAccent
                ? `0 6px 24px rgba(249,168,37,0.25)`
                : `0 6px 24px rgba(10,61,98,0.18)`,
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', right: -10, top: -10, fontSize: 52, opacity: