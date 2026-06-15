import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, YEARS, CURRENT_YEAR, BRAND, ACCENT } from '../utils'

export default function BalanceSheet() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [data, setData] = useState(null)
  const [assets, setAssets] = useState([])

  useEffect(() => {
    // Get full year summary (no month filter = full year)
    apiFetch(`/api/summary?year=${year}`).then(r => r.json()).then(setData)
    apiFetch('/api/fixed-assets').then(r => r.json()).then(setAssets)
  }, [year])

  if (!data) return <div style={{ padding: 32, color: '#94a3b8' }}>Loading…</div>

  const fixedAssetsTotal = assets.reduce((s, a) => s + a.cost, 0)
  const annualDep = assets.reduce((s, a) => s + (a.useful_life_years > 0 ? a.cost / a.useful_life_years : 0), 0)
  // Net book value (simple: cost minus one year depreciation per year held since purchase)
  const nbv = assets.reduce((s, a) => {
    const yearsHeld = Math.max(0, year - new Date(a.purchase_date).getFullYear())
    const dep = a.useful_life_years > 0 ? (a.cost / a.useful_life_years) * Math.min(yearsHeld, a.useful_life_years) : 0
    return s + Math.max(0, a.cost - dep)
  }, 0)

  const cashAndBank = Math.max(0, data.revenue - data.direct_costs - data.expenses)
  const totalCurrentAssets = cashAndBank
  const totalAssets = totalCurrentAssets + nbv
  const retainedEarnings = data.net_profit
  const totalEquity = retainedEarnings
  // Simplified: Assets = Equity (no external liabilities tracked yet)
  const totalLiabilities = Math.max(0, totalAssets - totalEquity)

  const print = () => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
    <title>Balance Sheet ${year} — Simba Media Ghana</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;margin:0;padding:32px;color:#1e293b}
      h1{font-size:22px;color:#0a3d62;margin:0 0 4px}
      .sub{font-size:13px;color:#64748b;margin-bottom:28px}
      .cols{display:flex;gap:32px}
      .col{flex:1}
      h3{font-size:13px;font-weight:800;color:#0a3d62;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;border-bottom:2px solid #0a3d62;padding-bottom:6px}
      .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
      .section-title{font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.4px;margin-top:14px;margin-bottom:4px}
      .total-row{font-weight:800;color:#0a3d62;font-size:14px;border-top:2px solid #0a3d62;padding-top:8px;margin-top:4px;display:flex;justify-content:space-between}
      @media print{@page{margin:15mm}}
    </style></head><body>
    <h1>Balance Sheet</h1>
    <div class="sub">Simba Media Ghana Limited &nbsp;|&nbsp; As at 31 December ${year}</div>
    <div class="cols">
    <div class="col">
    <h3>Assets</h3>
    <div class="section-title">Current Assets</div>
    <div class="row"><span>Cash &amp; Bank Balance</span><span>${fmt(cashAndBank)}</span></div>
    <div class="row" style="font-weight:700"><span>Total Current Assets</span><span>${fmt(totalCurrentAssets)}</span></div>
    <div class="section-title">Non-Current Assets</div>
    <div class="row"><span>Fixed Assets (Cost)</span><span>${fmt(fixedAssetsTotal)}</span></div>
    <div class="row"><span>Less: Accumulated Depreciation</span><span>(${fmt(fixedAssetsTotal - nbv)})</span></div>
    <div class="row" style="font-weight:700"><span>Net Book Value</span><span>${fmt(nbv)}</span></div>
    <div class="total-row"><span>TOTAL ASSETS</span><span>${fmt(totalAssets)}</span></div>
    </div>
    <div class="col">
    <h3>Liabilities &amp; Equity</h3>
    <div class="section-title">Equity</div>
    <div class="row"><span>Retained Earnings / Net Profit</span><span>${fmt(retainedEarnings)}</span></div>
    <div class="row" style="font-weight:700"><span>Total Equity</span><span>${fmt(totalEquity)}</span></div>
    <div class="section-title">Liabilities</div>
    <div class="row"><span>Total Liabilities</span><span>${fmt(totalLiabilities)}</span></div>
    <div class="total-row"><span>TOTAL LIABILITIES &amp; EQUITY</span><span>${fmt(totalAssets)}</span></div>
    </div>
    </div>
    <div style="margin-top:24px;font-size:11px;color:#94a3b8">Generated ${new Date().toLocaleDateString('en-GH',{day:'numeric',month:'long',year:'numeric'})}</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 400)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Balance Sheet</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>As at 31 December {year} — Simba Media Ghana Limited</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={year} onChange={e => setYear(+e.target.value)}
            style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600 }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={print}
            style={{ padding: '9px 20px', background: ACCENT, color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
            🖨️ Print / Export
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* ASSETS */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ background: BRAND, color: '#fff', padding: '12px 20px', fontWeight: 800, fontSize: 14 }}>ASSETS</div>
          <div style={{ padding: '16px 20px' }}>
            <Section title="Current Assets">
              <BSRow label="Cash & Bank Balance" value={cashAndBank} />
              <BSRow label="Total Current Assets" value={totalCurrentAssets} bold />
            </Section>
            <Section title="Non-Current Assets">
              <BSRow label="Fixed Assets (Cost)" value={fixedAssetsTotal} />
              <BSRow label="Less: Accumulated Depreciation" value={-(fixedAssetsTotal - nbv)} color="#dc2626" />
              <BSRow label="Net Book Value" value={nbv} bold />
            </Section>
            <div style={{ borderTop: '2.5px solid ' + BRAND, paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: BRAND, fontSize: 14 }}>TOTAL ASSETS</span>
              <span style={{ fontWeight: 800, color: BRAND, fontSize: 16 }}>{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* LIABILITIES & EQUITY */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ background: BRAND, color: '#fff', padding: '12px 20px', fontWeight: 800, fontSize: 14 }}>LIABILITIES & EQUITY</div>
          <div style={{ padding: '16px 20px' }}>
            <Section title="Equity">
              <BSRow label="Retained Earnings / Net Profit" value={retainedEarnings} color={retainedEarnings >= 0 ? '#16a34a' : '#dc2626'} />
              <BSRow label="Total Equity" value={totalEquity} bold />
            </Section>
            <Section title="Liabilities">
              <BSRow label="Total Liabilities" value={totalLiabilities} />
            </Section>
            <div style={{ borderTop: '2.5px solid ' + BRAND, paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, color: BRAND, fontSize: 13 }}>TOTAL LIABILITIES & EQUITY</span>
              <span style={{ fontWeight: 800, color: BRAND, fontSize: 16 }}>{fmt(totalAssets)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef9c3', borderRadius: 10, fontSize: 12, color: '#713f12', border: '1px solid #fef08a' }}>
        <strong>Note:</strong> Cash & Bank Balance is estimated from Revenue minus Total Costs for the selected year. For an accurate balance sheet, ensure all income and expense entries are complete and up to date. Liabilities (accounts payable, loans) are not yet tracked — add entries directly once the module is available.
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )
}

function BSRow({ label, value, bold, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13, fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: bold ? '#1e293b' : '#475569' }}>{label}</span>
      <span style={{ color: color || (bold ? '#1e293b' : '#475569') }}>{fmt(Math.abs(value))}{value < 0 ? ' CR' : ''}</span>
    </div>
  )
}
