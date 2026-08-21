import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, BRAND, ACCENT } from '../utils'

/* strip "GHS " prefix for table cells — currency shown once at top */
function n(value) {
  if (!value && value !== 0) return '—'
  return fmt(value).replace('GHS ', '')
}

const GOLD   = '#f9a825'
const NAVY   = '#0a2744'
const STEEL  = '#1e3a5f'

/* glass card style */
const glass = {
  background:    'rgba(255,255,255,0.72)',
  backdropFilter:'blur(18px)',
  WebkitBackdropFilter:'blur(18px)',
  border:        '1px solid rgba(255,255,255,0.85)',
  boxShadow:     '0 8px 32px rgba(10,39,68,0.10), inset 0 1px 0 rgba(255,255,255,0.7)',
  borderRadius:  14,
}

export default function PnL() {
  var [year, setYear]     = useState(CURRENT_YEAR)
  var [monthly, setMonthly] = useState([])

  useEffect(function() {
    apiFetch('/api/monthly-summary?year=' + year).then(function(r) { return r.json(); }).then(setMonthly)
  }, [year])

  var totals = monthly.reduce(function(acc, m) {
    return {
      revenue:          acc.revenue          + m.revenue,
      revenue_taxes:    acc.revenue_taxes    + (m.revenue_taxes  || 0),
      net_revenue:      acc.net_revenue      + (m.net_revenue    || m.revenue),
      direct_costs:     acc.direct_costs     + m.direct_costs,
      gross_profit:     acc.gross_profit     + m.gross_profit,
      expenses:         acc.expenses         + m.expenses,
      operating_profit: acc.operating_profit + (m.operating_profit || (m.gross_profit - m.expenses)),
      corporate_tax:    acc.corporate_tax    + (m.corporate_tax  || 0),
      net_profit:       acc.net_profit       + m.net_profit,
    }
  }, { revenue: 0, revenue_taxes: 0, net_revenue: 0, direct_costs: 0, gross_profit: 0, expenses: 0, operating_profit: 0, corporate_tax: 0, net_profit: 0 })

  var gpm = totals.net_revenue > 0 ? (totals.gross_profit  / totals.net_revenue * 100).toFixed(1) : '0.0'
  var npm = totals.net_revenue > 0 ? (totals.net_profit    / totals.net_revenue * 100).toFixed(1) : '0.0'

  var printPnL = function() {
    var w = window.open('', '_blank')
    w.document.write('<!DOCTYPE html><html><head>' +
    '<title>P&L Statement ' + year + '</title>' +
    '<style>body{font-family:"Segoe UI",sans-serif;margin:0;padding:32px;color:#1e293b;background:#fff}' +
    'h1{font-size:22px;color:' + NAVY + ';margin:0 0 4px}' +
    '.sub{font-size:13px;color:#64748b;margin-bottom:8px}' +
    '.cur{font-size:11px;color:#94a3b8;margin-bottom:20px;font-style:italic}' +
    'table{width:100%;border-collapse:collapse;font-size:12px}' +
    'th{background:' + NAVY + ';color:#fff;padding:9px 12px;text-align:right;font-weight:600;font-size:11px}' +
    'th:first-child{text-align:left}' +
    'td{padding:7px 12px;text-align:right;border-bottom:1px solid #f1f5f9}' +
    'td:first-child{text-align:left}' +
    '.sh{background:#f0f4f8;font-weight:700;color:' + NAVY + ';font-size:11px;text-transform:uppercase;letter-spacing:0.5px}' +
    '.sub-row{color:#64748b}' +
    '.profit{background:#fff8e1;color:' + NAVY + ';font-weight:700}' +
    '.total{background:' + NAVY + ';color:#fff;font-weight:800;font-size:13px}' +
    '@media print{@page{margin:15mm;size:landscape}}' +
    '</style></head><body>' +
    '<h1>Profit & Loss Statement</h1>' +
    '<div class="sub">Simba Media Ghana Limited &nbsp;|&nbsp; Year: ' + year + '</div>' +
    '<div class="cur">All figures in GHS (Ghanaian Cedi)</div>' +
    '<div style="margin-bottom:20px">' +
    '<span style="display:inline-block;border:2px solid ' + NAVY + ';border-radius:8px;padding:8px 14px;margin-right:10px;font-size:12px"><strong>Gross Margin:</strong> ' + gpm + '%</span>' +
    '<span style="display:inline-block;border:2px solid ' + GOLD  + ';border-radius:8px;padding:8px 14px;font-size:12px"><strong>Net Margin:</strong> '   + npm + '%</span>' +
    '</div>' +
    '<table><thead><tr><th>Item</th>' + MONTHS.map(function(m) { return '<th>' + m.slice(0,3) + '</th>'; }).join('') + '<th>Total</th></tr></thead><tbody>' +
    '<tr class="sh"><td colspan="' + (MONTHS.length+2) + '">REVENUE</td></tr>' +
    '<tr><td>Gross Revenue</td>' + monthly.map(function(m) { return '<td>' + (m.revenue > 0 ? n(m.revenue) : '—') + '</td>'; }).join('') + '<td style="font-weight:700">' + n(totals.revenue) + '</td></tr>' +
    (totals.revenue_taxes > 0 ? '<tr class="sub-row"><td>Less: Revenue Taxes</td>' + monthly.map(function(m) { return '<td>' + ((m.revenue_taxes||0)>0 ? '('+n(m.revenue_taxes||0)+')' : '—') + '</td>'; }).join('') + '<td style="font-weight:700">(' + n(totals.revenue_taxes) + ')</td></tr>' : '') +
    (totals.revenue_taxes > 0 ? '<tr class="profit"><td>Net Revenue</td>' + monthly.map(function(m) { return '<td>' + n(m.net_revenue||m.revenue) + '</td>'; }).join('') + '<td>' + n(totals.net_revenue) + '</td></tr>' : '') +
    '<tr class="sh"><td colspan="' + (MONTHS.length+2) + '">DIRECT / PRODUCTION COSTS</td></tr>' +
    '<tr><td>Total Direct Costs</td>' + monthly.map(function(m) { return '<td>' + (m.direct_costs>0 ? '('+n(m.direct_costs)+')' : '—') + '</td>'; }).join('') + '<td style="font-weight:700">(' + n(totals.direct_costs) + ')</td></tr>' +
    '<tr class="profit"><td>GROSS PROFIT</td>' + monthly.map(function(m) { return '<td>' + n(m.gross_profit) + '</td>'; }).join('') + '<td>' + n(totals.gross_profit) + '</td></tr>' +
    '<tr class="sh"><td colspan="' + (MONTHS.length+2) + '">ADMIN / OVERHEAD EXPENSES</td></tr>' +
    '<tr><td>Total Admin Expenses</td>' + monthly.map(function(m) { return '<td>' + (m.expenses>0 ? '('+n(m.expenses)+')' : '—') + '</td>'; }).join('') + '<td style="font-weight:700">(' + n(totals.expenses) + ')</td></tr>' +
    '<tr class="profit"><td>OPERATING PROFIT</td>' + monthly.map(function(m) { var op = m.operating_profit !== undefined ? m.operating_profit : m.gross_profit - m.expenses; return '<td>' + n(op) + '</td>'; }).join('') + '<td>' + n(totals.operating_profit) + '</td></tr>' +
    (totals.corporate_tax>0 ? '<tr class="sh"><td colspan="' + (MONTHS.length+2) + '">TAX</td></tr><tr><td>Tax (Corporate Tax)</td>' + monthly.map(function(m) { return '<td>' + ((m.corporate_tax||0)>0 ? '('+n(m.corporate_tax||0)+')' : '—') + '</td>'; }).join('') + '<td style="font-weight:700">(' + n(totals.corporate_tax) + ')</td></tr>' : '') +
    '<tr class="total"><td>NET ' + (totals.net_profit >= 0 ? 'PROFIT' : 'LOSS') + '</td>' + monthly.map(function(m) { return '<td>' + n(m.net_profit) + '</td>'; }).join('') + '<td>' + n(totals.net_profit) + '</td></tr>' +
    '</tbody></table>' +
    '<div style="margin-top:20px;font-size:11px;color:#94a3b8">Generated ' + new Date().toLocaleDateString('en-GH',{day:'numeric',month:'long',year:'numeric'}) + '</div>' +
    '</body></html>')
    w.document.close()
    setTimeout(function() { w.print(); }, 400)
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: '#1e293b',
      background: 'linear-gradient(135deg, #e8eef7 0%, #f0f4fb 50%, #e8eef7 100%)',
      minHeight: '100vh', margin: '-28px', padding: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>Profit & Loss Statement</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>
            Simba Media Ghana Limited &nbsp;·&nbsp; {year} &nbsp;·&nbsp;
            <span style={{ fontSize: 11, fontStyle: 'italic', color: '#94a3b8' }}>All figures in GHS</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={year} onChange={function(e) { setYear(+e.target.value); }}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.7)', fontWeight: 600, backdropFilter: 'blur(8px)', cursor: 'pointer' }}>
            {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
          </select>
          <button onClick={printPnL}
            style={{ padding: '9px 22px', background: GOLD, color: NAVY, border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,168,37,0.35)' }}>
            Print / Export
          </button>
        </div>
      </div>

      {/* KPI cards — glass style, 2 colors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue',  value: totals.revenue,      pct: null,        accent: false },
          { label: 'Direct Costs',   value: totals.direct_costs, pct: null,        accent: false },
          { label: 'Gross Profit',   value: totals.gross_profit, pct: gpm + '% GM', accent: true  },
          { label: 'Admin Expenses', value: totals.expenses,     pct: null,        accent: false },
          { label: totals.net_profit >= 0 ? 'Net Profit' : 'Net Loss',
            value: totals.net_profit, pct: npm + '% NM', accent: true },
        ].map(function(c, i) {
          return (
            <div key={i} style={Object.assign({}, glass, {
              padding: '16px 18px',
              borderTop: '3px solid ' + (c.accent ? GOLD : NAVY),
            })}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.accent ? NAVY : NAVY }}>{n(c.value)}</div>
              {c.pct && <div style={{ fontSize: 11, color: GOLD, marginTop: 5, fontWeight: 700 }}>{c.pct}</div>}
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div style={Object.assign({}, glass, { overflow: 'auto', padding: 0 })}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 960 }}>
          <thead>
            <tr style={{ background: NAVY, color: '#fff' }}>
              <th style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, minWidth: 180 }}>Item</th>
              {MONTHS.map(function(m) { return (
                <th key={m} style={{ padding: '11px 10px', textAlign: 'right', fontWeight: 600, fontSize: 11 }}>{m.slice(0,3)}</th>
              ); })}
              <th style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, fontSize: 11, background: 'rgba(249,168,37,0.25)' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {/* REVENUE */}
            <SectionHead label="Revenue" span={MONTHS.length + 2} />
            <DataRow label="Gross Revenue" data={monthly} field="revenue" totals={totals} />
            {totals.revenue_taxes > 0 && <DataRow label="Less: Revenue Taxes" data={monthly} field="revenue_taxes" totals={totals} brackets sub />}
            {totals.revenue_taxes > 0 && (
              <SubtotalRow label="Net Revenue" monthly={monthly} getter={function(m) { return m.net_revenue || m.revenue; }} total={totals.net_revenue} />
            )}

            {/* DIRECT COSTS */}
            <SectionHead label="Direct / Production Costs" span={MONTHS.length + 2} />
            <DataRow label="Total Direct Costs" data={monthly} field="direct_costs" totals={totals} brackets />

            {/* GROSS PROFIT */}
            <ProfitRow label="GROSS PROFIT" monthly={monthly} getter={function(m) { return m.gross_profit; }} total={totals.gross_profit} gold />

            {/* ADMIN EXPENSES */}
            <SectionHead label="Admin / Overhead Expenses" span={MONTHS.length + 2} />
            <DataRow label="Total Admin Expenses" data={monthly} field="expenses" totals={totals} brackets />

            {/* OPERATING PROFIT */}
            <ProfitRow label="OPERATING PROFIT" monthly={monthly}
              getter={function(m) { return m.operating_profit !== undefined ? m.operating_profit : m.gross_profit - m.expenses; }}
              total={totals.operating_profit} />

            {/* TAX */}
            {totals.corporate_tax > 0 && (
              <>
                <SectionHead label="Tax" span={MONTHS.length + 2} />
                <DataRow label="Tax (Corporate Tax)" data={monthly} field="corporate_tax" totals={totals} brackets />
              </>
            )}

            {/* NET PROFIT */}
            <tr style={{ background: NAVY }}>
              <td style={{ padding: '11px 14px', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                NET {totals.net_profit >= 0 ? 'PROFIT' : 'LOSS'}
              </td>
              {monthly.map(function(m, i) { return (
                <td key={i} style={{ padding: '11px 10px', textAlign: 'right', color: m.net_profit >= 0 ? GOLD : '#fca5a5', fontWeight: 700, fontSize: 12 }}>
                  {n(m.net_profit)}
                </td>
              ); })}
              <td style={{ padding: '11px 14px', textAlign: 'right', color: GOLD, fontWeight: 800, fontSize: 14, background: 'rgba(249,168,37,0.15)' }}>
                {n(totals.net_profit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Margin strip */}
      <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
        {[
          { label: 'Gross Margin', value: gpm + '%' },
          { label: 'Net Margin',   value: npm + '%' },
          { label: 'Net Revenue',  value: n(totals.net_revenue) },
        ].map(function(item, i) {
          return (
            <div key={i} style={Object.assign({}, glass, {
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14
            })}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{item.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{item.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionHead(props) {
  return (
    <tr>
      <td colSpan={props.span} style={{
        padding: '7px 14px', fontWeight: 700, color: NAVY, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.6px',
        background: 'rgba(10,39,68,0.06)',
        borderTop: '1px solid rgba(10,39,68,0.1)',
      }}>{props.label}</td>
    </tr>
  )
}

function DataRow(props) {
  var label = props.label; var data = props.data; var field = props.field;
  var totals = props.totals; var brackets = props.brackets; var sub = props.sub;
  return (
    <tr style={{ borderBottom: '1px solid rgba(10,39,68,0.06)' }}>
      <td style={{ padding: '8px 14px', fontSize: 12, color: sub ? '#64748b' : '#374151', paddingLeft: sub ? 24 : 14 }}>{label}</td>
      {data.map(function(m, i) { return (
        <td key={i} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: '#374151' }}>
          {(m[field] || 0) > 0 ? (brackets ? '(' + n(m[field]) + ')' : n(m[field])) : '—'}
        </td>
      ); })}
      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: NAVY, background: 'rgba(249,168,37,0.06)' }}>
        {totals[field] > 0 ? (brackets ? '(' + n(totals[field]) + ')' : n(totals[field])) : '—'}
      </td>
    </tr>
  )
}

function SubtotalRow(props) {
  return (
    <tr style={{ borderBottom: '1px solid rgba(10,39,68,0.06)', background: 'rgba(10,39,68,0.03)' }}>
      <td style={{ padding: '8px 14px', fontSize: 12, color: NAVY, fontWeight: 700 }}>{props.label}</td>
      {props.monthly.map(function(m, i) { return (
        <td key={i} style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, color: '#374151', fontWeight: 600 }}>
          {n(props.getter(m))}
        </td>
      ); })}
      <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 800, color: NAVY, background: 'rgba(249,168,37,0.06)' }}>
        {n(props.total)}
      </td>
    </tr>
  )
}

function ProfitRow(props) {
  return (
    <tr style={{ background: props.gold ? 'rgba(249,168,37,0.10)' : 'rgba(10,39,68,0.07)', borderTop: '1px solid rgba(10,39,68,0.12)' }}>
      <td style={{ padding: '10px 14px', color: NAVY, fontWeight: 800, fontSize: 12, letterSpacing: '0.2px' }}>{props.label}</td>
      {props.monthly.map(function(m, i) { return (
        <td key={i} style={{ padding: '10px 10px', textAlign: 'right', color: NAVY, fontWeight: 700, fontSize: 12 }}>
          {n(props.getter(m))}
        </td>
      ); })}
      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: NAVY,
        background: props.gold ? 'rgba(249,168,37,0.18)' : 'rgba(10,39,68,0.10)', fontSize: 13 }}>
        {n(props.total)}
      </td>
    </tr>
  )
}


