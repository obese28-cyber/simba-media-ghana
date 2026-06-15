import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, BRAND, ACCENT } from '../utils'

export default function CashBook() {
  const [year, setYear]       = useState(CURRENT_YEAR)
  const [monthly, setMonthly] = useState([])
  const [opening, setOpening] = useState(0)

  useEffect(() => {
    apiFetch(`/api/monthly-summary?year=${year}`).then(r => r.json()).then(setMonthly)
  }, [year])

  const active = monthly.filter(r => r.revenue || r.direct_costs || r.expenses)

  // Build running balance rows
  let balance = opening
  const ledger = monthly.map(r => {
    const cashIn  = r.revenue
    const cashOut = r.direct_costs + r.expenses
    const net     = cashIn - cashOut
    balance += net
    return { ...r, cashIn, cashOut, net, balance }
  })
  const activeLedger = ledger.filter(r => r.cashIn || r.cashOut)

  const totalIn  = activeLedger.reduce((s, r) => s + r.cashIn, 0)
  const totalOut = activeLedger.reduce((s, r) => s + r.cashOut, 0)
  const netTotal = totalIn - totalOut
  const closing  = opening + netTotal

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Cash Book</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(+e.target.value)} style={sel}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Opening Balance', value: opening,  color: BRAND,      bg: '#dbeafe' },
          { label: 'Total Cash In',   value: totalIn,  color: '#16a34a',  bg: '#dcfce7' },
          { label: 'Total Cash Out',  value: totalOut, color: '#dc2626',  bg: '#fee2e2' },
          { label: 'Closing Balance', value: closing,  color: closing>=0?BRAND:'#dc2626', bg: closing>=0?'#dbeafe':'#fee2e2' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 2px 12px rgba(10,61,98,0.08)', borderLeft: `4px solid ${c.color}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 8px' }}>{c.label}</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: c.color, margin: 0 }}>{fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Opening balance input */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 20px', marginBottom: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: BRAND, whiteSpace: 'nowrap' }}>Opening Balance (GHS)</label>
        <input type="number" value={opening} onChange={e => setOpening(+e.target.value || 0)}
          placeholder="0.00"
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, width: 180 }} />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Set your starting cash balance for {year}</span>
      </div>

      {/* Ledger table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ background: BRAND, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 18, background: ACCENT, borderRadius: 3 }} />
          <p style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: 0 }}>Monthly Cash Flow — {year}</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Month','Cash In (Revenue)','Cash Out (Costs)','Net Cash Flow','Running Balance'].map(h => (
                  <th key={h} style={{ padding: '11px 18px', textAlign: h==='Month'?'left':'right', fontWeight: 700, fontSize: 12, color: BRAND, borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeLedger.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>No transactions for {year}</td></tr>
              )}
              {ledger.filter(r => r.cashIn || r.cashOut || r.balance !== opening).map((r, i) => (
                <tr key={r.month} style={{ borderBottom: '1px solid #f1f5f9', background: i%2===0?'#fff':'#fafafa' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f0f4f8'}
                  onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'#fafafa'}>
                  <td style={{ padding: '11px 18px', fontWeight: 700, color: BRAND }}>{MONTHS[r.month-1]}</td>
                  <td style={{ padding: '11px 18px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                    {r.cashIn > 0 ? fmt(r.cashIn) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                    {r.cashOut > 0 ? fmt(r.cashOut) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 700, color: r.net>=0?'#16a34a':'#dc2626' }}>
                    {r.net !== 0 ? (r.net > 0 ? '+' : '') + fmt(r.net) : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '11px 18px', textAlign: 'right', fontWeight: 800, color: r.balance>=0?BRAND:'#dc2626' }}>
                    {fmt(r.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: BRAND }}>
                <td style={{ padding: '13px 18px', fontWeight: 900, color: '#fff' }}>TOTAL / CLOSING</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 800, color: '#86efac' }}>{fmt(totalIn)}</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 800, color: '#fca5a5' }}>{fmt(totalOut)}</td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 800, color: netTotal>=0?'#86efac':'#fca5a5' }}>
                  {(netTotal>0?'+':'') + fmt(netTotal)}
                </td>
                <td style={{ padding: '13px 18px', textAlign: 'right', fontWeight: 900, color: ACCENT, fontSize: 15 }}>{fmt(closing)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

const sel = { padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff', fontWeight: 700, color: BRAND }
