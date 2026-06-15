import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, CURRENT_MONTH, BRAND, ACCENT, REVENUE_CATS } from '../utils'

const BLANK = { year: CURRENT_YEAR, month: CURRENT_MONTH, category: REVENUE_CATS[0], description: '', amount: '' }

export default function Revenue() {
  const [rows, setRows]               = useState([])
  const [filterYear, setFilterYear]   = useState(CURRENT_YEAR)
  const [filterMonth, setFilterMonth] = useState('')
  const [form, setForm]               = useState(BLANK)
  const [editId, setEditId]           = useState(null)
  const [showForm, setShowForm]       = useState(false)

  const load = () => {
    let url = `/api/revenue?year=${filterYear}`
    if (filterMonth) url += `&month=${filterMonth}`
    apiFetch(url).then(r => r.json()).then(setRows)
  }
  useEffect(() => { load() }, [filterYear, filterMonth])

  const save = async () => {
    const amt = parseFloat(form.amount)
    if (!amt || !form.category) return
    const url    = editId ? `/api/revenue/${editId}` : '/api/revenue'
    const method = editId ? 'PUT' : 'POST'
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: amt }) })
    setForm(BLANK); setEditId(null); setShowForm(false); load()
  }

  const del  = async (id) => { if (!confirm('Delete?')) return; await apiFetch(`/api/revenue/${id}`, { method: 'DELETE' }); load() }
  const edit = (r) => { setForm({ year: r.year, month: r.month, category: r.category, description: r.description || '', amount: r.amount }); setEditId(r.id); setShowForm(true) }

  const total = rows.reduce((s, r) => s + r.amount, 0)

  const catTotals = REVENUE_CATS.map(cat => ({
    cat, amount: rows.filter(r => r.category === cat).reduce((s, r) => s + r.amount, 0)
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)
  const maxCat = catTotals[0]?.amount || 1

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

      {/* LEFT */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Revenue</h1>
          <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
            style={{ padding: '9px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
            + Add Revenue
          </button>
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: `2px solid ${BRAND}` }}>
            <div style={{ fontWeight: 700, color: BRAND, marginBottom: 16, fontSize: 15 }}>{editId ? 'Edit Revenue' : 'New Revenue'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr 1.5fr', gap: 12, alignItems: 'end' }}>
              <div><label style={lbl}>Year</label>
                <select value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} style={inp}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select></div>
              <div><label style={lbl}>Month</label>
                <select value={form.month} onChange={e => setForm(f => ({ ...f, month: +e.target.value }))} style={inp}>
                  {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select></div>
              <div><label style={lbl}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                  {REVENUE_CATS.map(c => <option key={c}>{c}</option>)}
                </select></div>
              <div><label style={lbl}>Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Client / project…" style={inp} /></div>
              <div><label style={lbl}>Amount (GHS)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" style={inp} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={save} style={{ padding: '9px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>{editId ? 'Update' : 'Save'}</button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK) }} style={{ padding: '9px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <select value={filterYear} onChange={e => setFilterYear(+e.target.value)} style={{ ...inp, width: 'auto' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inp, width: 'auto' }}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: BRAND, color: '#fff' }}>
                {['Month/Year','Category','Description','Amount','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h==='Amount'?'right':'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No revenue for this period.</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id} style={{ background: i%2===0?'#fff':'#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 14px' }}>{MONTHS[r.month-1]} {r.year}</td>
                  <td style={{ padding: '9px 14px' }}><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.category}</span></td>
                  <td style={{ padding: '9px 14px', color: '#475569' }}>{r.description}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{fmt(r.amount)}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <button onClick={() => edit(r)} style={actBtn('#2563eb', true)}>Edit</button>
                    <button onClick={() => del(r.id)} style={actBtn('#dc2626')}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ background: '#e8f5e9', fontWeight: 700, borderTop: '2px solid #a7f3d0' }}>
                  <td colSpan={3} style={{ padding: '10px 14px', color: BRAND }}>TOTAL</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a', fontSize: 14 }}>{fmt(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* RIGHT — summary panel */}
      <div style={{ position: 'sticky', top: 20 }}>
        <div style={{ background: '#16a34a', borderRadius: 14, padding: '20px', marginBottom: 14, boxShadow: '0 4px 20px rgba(22,163,74,0.2)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#bbf7d0', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 10px' }}>
            {filterMonth ? `${MONTHS[filterMonth-1]} ${filterYear}` : `Year ${filterYear}`}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 4px' }}>Total Revenue</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>{fmt(total)}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{rows.length} entries</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>By Category</p>
          {catTotals.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>No data yet</p>}
          {catTotals.map(({ cat, amount }) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{cat}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{fmt(amount)}</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${(amount/maxCat)*100}%`, background: '#16a34a', borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{total > 0 ? ((amount/total)*100).toFixed(1) : 0}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const lbl    = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }
const inp    = { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fafafa' }
const actBtn = (color, solid) => ({ marginRight: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, background: solid ? color : color+'18', color: solid ? '#fff' : color, cursor: 'pointer' })
