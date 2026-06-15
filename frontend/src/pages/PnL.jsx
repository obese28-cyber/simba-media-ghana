import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, BRAND, ACCENT } from '../utils'

export default function PnL() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [monthly, setMonthly] = useState([])

  useEffect(() => {
    apiFetch(`/api/monthly-summary?year=${year}`).then(r => r.json()).then(setMonthly)
  }, [year])

  const totals = monthly.reduce((acc, m) => ({
    revenue: acc.revenue + m.revenue,
    direct_costs: acc.direct_costs + m.direct_costs,
    gross_profit: acc.gross_profit + m.gross_profit,
    expenses: acc.expenses + m.expenses,
    net_profit: acc.net_profit + m.net_profit,
  }), { revenue: 0, direct_costs: 0, gross_profit: 0, expenses: 0, net_profit: 0 })

  const gpm = totals.revenue > 0 ? (totals.gross_profit / totals.revenue * 100).toFixed(1) : '0.0'
  const npm = totals.revenue > 0 ? (totals.net_profit / totals.revenue * 100).toFixed(1) : '0.0'

  const printPnL = () => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
    <title>P&L Statement ${year} — Simba Media Ghana</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;margin:0;padding:32px;color:#1e293b;background:#fff}
      h1{font-size:22px;color:#0a3d62;margin:0 0 4px}
      .sub{font-size:13px;color:#64748b;margin-bottom:24px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#0a3d62;color:#fff;padding:9px 12px;text-align:right;font-weight:600;font-size:12px}
      th:first-child{text-align:left}
      td{padding:8px 12px;text-align:right;border-bottom:1px solid #f1f5f9}
      td:first-child{text-align:left}
      .section-header{background:#f0f4f8;font-weight:700;color:#0a3d62;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
      .total-row{background:#0a3d62;color:#fff;font-weight:700}
      .gross{background:#e8f5e9;color:#2e7d32;font-weight:700}
      .net-pos{background:#e8f5e9;color:#166534;font-weight:800;font-size:14px}
      .net-neg{background:#fce4ec;color:#9b1c1c;font-weight:800;font-size:14px}
      .kpi{display:inline-block;border:2px solid #0a3d62;border-radius:8px;padding:10px 16px;margin-right:12px;font-size:12px}
      @media print{@page{margin:15mm}}
    </style>
    </head><body>
    <h1>Profit & Loss Statement</h1>
    <div class="sub">Simba Media Ghana Limited &nbsp;|&nbsp; Year: ${year}</div>
    <div style="margin-bottom:20px">
      <span class="kpi"><strong>Gross Margin:</strong> ${gpm}%</span>
      <span class="kpi"><strong>Net Margin:</strong> ${npm}%</span>
    </div>
    <table>
    <thead><tr><th>Item</th>${MONTHS.map(m => `<th>${m.slice(0,3)}</th>`).join('')}<th>Total</th></tr></thead>
    <tbody>
    <tr class="section-header"><td colspan="${MONTHS.length+2}">REVENUE</td></tr>
    <tr>
      <td>Total Revenue</td>
      ${monthly.map(m => `<td style="color:#16a34a">${m.revenue > 0 ? fmt(m.revenue).replace('GHS ','') : '—'}</td>`).join('')}
      <td style="color:#16a34a;font-weight:700">${fmt(totals.revenue)}</td>
    </tr>
    <tr class="section-header"><td colspan="${MONTHS.length+2}">DIRECT / PRODUCTION COSTS</td></tr>
    <tr>
      <td>Total Direct Costs</td>
      ${monthly.map(m => `<td style="color:#dc2626">${m.direct_costs > 0 ? `(${fmt(m.direct_costs).replace('GHS ','')})` : '—'}</td>`).join('')}
      <td style="color:#dc2626;font-weight:700">(${fmt(totals.direct_costs)})</td>
    </tr>
    <tr class="gross">
      <td>GROSS PROFIT</td>
      ${monthly.map(m => `<td>${fmt(m.gross_profit)}</td>`).join('')}
      <td>${fmt(totals.gross_profit)}</td>
    </tr>
    <tr class="section-header"><td colspan="${MONTHS.length+2}">ADMIN / OVERHEAD EXPENSES</td></tr>
    <tr>
      <td>Total Admin Expenses</td>
      ${monthly.map(m => `<td style="color:#dc2626">${m.expenses > 0 ? `(${fmt(m.expenses).replace('GHS ','')})` : '—'}</td>`).join('')}
      <td style="color:#dc2626;font-weight:700">(${fmt(totals.expenses)})</td>
    </tr>
    <tr class="${totals.net_profit >= 0 ? 'net-pos' : 'net-neg'}">
      <td>NET ${totals.net_profit >= 0 ? 'PROFIT' : 'LOSS'}</td>
      ${monthly.map(m => `<td>${fmt(m.net_profit)}</td>`).join('')}
      <td>${fmt(totals.net_profit)}</td>
    </tr>
    </tbody>
    </table>
    <div style="margin-top:24px;font-size:11px;color:#94a3b8">Generated ${new Date().toLocaleDateString('en-GH', {day:'numeric',month:'long',year:'numeric'})}</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Profit & Loss Statement</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Annual P&L — Simba Media Ghana Limited</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={year} onChange={e => setYear(+e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600 }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={printPnL}
            style={{ padding: '9px 20px', background: ACCENT, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
            🖨️ Print / Export
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Revenue', value: totals.revenue, color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
          { label: 'Direct Costs', value: totals.direct_costs, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
          { label: 'Gross Profit', value: totals.gross_profit, color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', extra: `GM: ${gpm}%` },
          { label: 'Admin Expenses', value: totals.expenses, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
          { label: 'Net Profit', value: totals.net_profit, color: totals.net_profit >= 0 ? '#166534' : '#991b1b', bg: totals.net_profit >= 0 ? '#f0fdf4' : '#fef2f2', border: totals.net_profit >= 0 ? '#86efac' : '#fca5a5', extra: `NM: ${npm}%` },
        ].map((c, i) => (
          <div key={i} style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{fmt(c.value)}</div>
            {c.extra && <div style={{ fontSize: 11, color: c.color, marginTop: 4, fontWeight: 600 }}>{c.extra}</div>}
          </div>
        ))}
      </div>

      {/* Monthly P&L table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 900 }}>
          <thead>
            <tr style={{ background: BRAND, color: '#fff' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Item</th>
              {MONTHS.map(m => <th key={m} style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600 }}>{m.slice(0,3)}</th>)}
              <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Revenue */}
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={14} style={{ padding: '6px 12px', fontWeight: 700, color: BRAND, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</td>
            </tr>
            <Row label="Total Revenue" data={monthly} key_="revenue" color="#16a34a" total={totals.revenue} />

            {/* Direct Costs */}
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={14} style={{ padding: '6px 12px', fontWeight: 700, color: BRAND, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Direct / Production Costs</td>
            </tr>
            <Row label="Total Direct Costs" data={monthly} key_="direct_costs" color="#dc2626" total={totals.direct_costs} brackets />

            {/* Gross Profit */}
            <tr style={{ background: '#e8f5e9', fontWeight: 700 }}>
              <td style={{ padding: '9px 12px', color: '#15803d', fontWeight: 800 }}>GROSS PROFIT</td>
              {monthly.map((m, i) => <td key={i} style={{ padding: '9px 10px', textAlign: 'right', color: m.gross_profit >= 0 ? '#15803d' : '#dc2626', fontWeight: 700 }}>{fmt(m.gross_profit)}</td>)}
              <td style={{ padding: '9px 12px', textAlign: 'right', color: totals.gross_profit >= 0 ? '#15803d' : '#dc2626', fontWeight: 800 }}>{fmt(totals.gross_profit)}</td>
            </tr>

            {/* Admin Expenses */}
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={14} style={{ padding: '6px 12px', fontWeight: 700, color: BRAND, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin / Overhead Expenses</td>
            </tr>
            <Row label="Total Admin Expenses" data={monthly} key_="expenses" color="#dc2626" total={totals.expenses} brackets />

            {/* Net Profit */}
            <tr style={{ background: totals.net_profit >= 0 ? '#dcfce7' : '#fee2e2', fontWeight: 800 }}>
              <td style={{ padding: '10px 12px', color: totals.net_profit >= 0 ? '#14532d' : '#991b1b', fontWeight: 800, fontSize: 13 }}>
                NET {totals.net_profit >= 0 ? 'PROFIT' : 'LOSS'}
              </td>
              {monthly.map((m, i) => <td key={i} style={{ padding: '10px 10px', textAlign: 'right', color: m.net_profit >= 0 ? '#14532d' : '#991b1b', fontWeight: 700 }}>{fmt(m.net_profit)}</td>)}
              <td style={{ padding: '10px 12px', textAlign: 'right', color: totals.net_profit >= 0 ? '#14532d' : '#991b1b', fontWeight: 800, fontSize: 14 }}>{fmt(totals.net_profit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ label, data, key_, color, total, brackets }) {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      <td style={{ padding: '8px 12px', fontSize: 13, color: '#374151' }}>{label}</td>
      {data.map((m, i) => (
        <td key={i} style={{ padding: '8px 10px', textAlign: 'right', color, fontSize: 12 }}>
          {m[key_] > 0 ? (brackets ? `(${fmt(m[key_]).replace('GHS ','')})` : fmt(m[key_])) : '—'}
        </td>
      ))}
      <td style={{ padding: '8px 12px', textAlign: 'right', color, fontWeight: 700 }}>{brackets ? `(${fmt(total)})` : fmt(total)}</td>
    </tr>
  )
}
