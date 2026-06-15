import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, BRAND, ACCENT } from '../utils'

const NAVY  = BRAND
const GOLD  = ACCENT
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
    fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%', outline: 'none'
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', padding: 2 }}>

      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY2} 100%)`,
        borderRadius: 18, padding: '28px 32px', marginBottom: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(10,61,98,0.22)'
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 22 }}>
        {METRICS.map((m, idx) => {
          const val = summary ? summary[m.key] : null
          const isAccent = idx % 2 === 1
          return (
            <div key={m.key} style={{
              background: isAccent ? GOLD : NAVY,
              borderRadius: 14, padding: '20px',
              boxShadow: isAccent ? '0 6px 24px rgba(249,168,37,0.25)' : '0 6px 24px rgba(10,61,98,0.18)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 52, opacity: 0.1, lineHeight: 1 }}>{m.icon}</div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: isAccent ? NAVY : GOLD, margin: '0 0 10px' }}>{m.label}</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: isAccent ? NAVY : '#fff', margin: 0, lineHeight: 1 }}>
                {val !== null ? fmtShort(val) : '—'}
              </p>
              <p style={{ fontSize: 11, color: isAccent ? 'rgba(10,61,98,0.6)' : 'rgba(255,255,255,0.45)', margin: '8px 0 0' }}>
                {month ? MONTHS[month - 1] : `Jan – Dec ${year}`}
              </p>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 18 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 24px 16px', boxShadow: '0 4px 20px rgba(10,61,98,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 3, height: 18, background: GOLD, borderRadius: 3 }} />
            <p style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: 0 }}>Revenue vs Total Costs</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barGap={4} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(10,61,98,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, fontWeight: 600 }} />
              <Bar dataKey="Revenue" fill={NAVY} radius={[6,6,0,0]} />
              <Bar dataKey="Costs"   fill={GOLD} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 24px 16px', boxShadow: '0 4px 20px rgba(10,61,98,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 3, height: 18, background: GOLD, borderRadius: 3 }} />
            <p style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: 0 }}>Revenue vs Costs</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius={72} outerRadius={108}
                dataKey="value" paddingAngle={4}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                <Cell fill={NAVY} />
                <Cell fill={GOLD} />
              </Pie>
              <Tooltip formatter={fmtShort} contentStyle={{ background: NAVY, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 24px 16px', boxShadow: '0 4px 20px rgba(10,61,98,0.08)', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 3, height: 18, background: GOLD, borderRadius: 3 }} />
          <p style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: 0 }}>Profit Trend</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gGross" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={GOLD} stopOpacity={0.3} />
                <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={NAVY} stopOpacity={0.25} />
                <stop offset="95%" stopColor={NAVY} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, fontWeight: 600 }} />
            <Area type="monotone" dataKey="Gross Profit" stroke={GOLD} strokeWidth={2.5} fill="url(#gGross)" dot={{ r: 4, fill: GOLD, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="Net Profit"   stroke={NAVY} strokeWidth={2.5} fill="url(#gNet)"   dot={{ r: 4, fill: NAVY, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(10,61,98,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: `3px solid ${GOLD}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 18, background: GOLD, borderRadius: 3 }} />
          <p style={{ fontSize: 14, fontWeight: 800, color: NAVY, margin: 0 }}>Monthly Breakdown — {year}</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {['Month','Revenue','Direct Costs','Gross Profit','Admin Expenses','Net Profit'].map(h => (
                  <th key={h} style={{ padding: '12px 18px', textAlign: h === 'Month' ? 'left' : 'right', fontWeight: 700, fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: NAVY }}>{MONTHS[row.month - 1]}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: NAVY, fontWeight: 600 }}>{fmt(row.revenue)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: '#64748b' }}>{fmt(row.direct_costs)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 700, color: row.gross_profit >= 0 ? NAVY : '#dc2626' }}>{fmt(row.gross_profit)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', color: '#64748b' }}>{fmt(row.expenses)}</td>
                  <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: row.net_profit >= 0 ? GOLD2 : '#dc2626' }}>{fmt(row.net_profit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: NAVY }}>
                <td style={{ padding: '13px 18px', fontWeight: 900, color: '#fff' }}>TOTAL</td>
                {['revenue','direct_costs','gross_profit','expenses','net_profit'].map(k => (
                  <td key={k} style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 800, color: GOLD }}>
                    {fmt(active.reduce((s, r) => s + r[k], 0))}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
