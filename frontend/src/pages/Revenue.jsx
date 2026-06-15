import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, CURRENT_MONTH, BRAND, ACCENT, REVENUE_CATS } from '../utils'

const BLANK = { year: CURRENT_YEAR, month: CURRENT_MONTH, category: REVENUE_CATS[0], description: '', amount: '' }

export default function Revenue() {
  const [rows, setRows] = useState([])
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [filterMonth, setFilterMonth] = useState('')
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    let url = `/api/revenue?year=${filterYear}`
    if (filterMonth) url += `&month=${filterMonth}`
    apiFetch(url).then(r => r.json()).then(setRows)
  }

  useEffect(() => { load() }, [filterYear, filterMonth])

  const save = async () => {
    if (!form.amount || !form.category) return
    const url = editId ? `/api/revenue/${editId}` : '/api/revenue'
    const method = editId ? 'PUT' : 'POST'
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: +form.amount }) })
    setForm(BLANK); setEditId(null); setShowForm(false); load()
  }

  const del = async (id) => {
    if (!confirm('Delete this entry?')) return
    await apiFetch(`/api/revenue/${id}`, { method: 'DELETE' })
    load()
  }

  const edit = (r) => {
    setForm({ year: r.year, month: r.month, category: r.category, description: r.description || '', amount: r.amount })
    setEditId(r.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Revenue</h1>
        <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
          style={{ padding: '9px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
          + Add Revenue
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: `2px solid ${BRAND}` }}>
          <div style={{ fontWeight: 700, color: BRAND, marginBottom: 16, fontSize: 15 }}>{editId ? 'Edit Revenue Entry' : 'New Revenue Entry'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr 1.5fr', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={lbl}>Year</label>
              <select value={form.year} onChange={e => setForm(f => ({ ...f, year: +e.target.value }))} style={inp}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Month</label>
              <select value={form.month} onChange={e => setForm(f => ({ ...f, month: +e.target.value }))} style={inp}>
                {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                {REVENUE_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Client name / project…" style={inp} />
            </div>
            <div>
              <label style={lbl}>Amount (GHS)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00" style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save}
              style={{ padding: '9px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
              {editId ? 'Update' : 'Save'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK) }}
              style={{ padding: '9px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={filterYear} onChange={e => setFilterYear(+e.target.value)} style={{ ...inp, width: 'auto' }}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...inp, width: 'auto' }}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: BRAND, color: '#fff' }}>
              {['Month/Year', 'Category', 'Description', 'Amount', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No revenue entries for this period.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 14px' }}>{MONTHS[r.month - 1]} {r.year}</td>
                <td style={{ padding: '9px 14px' }}><span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.category}</span></td>
                <td style={{ padding: '9px 14px', color: '#475569' }}>{r.description}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{fmt(r.amount)}</td>
                <td style={{ padding: '9px 14px' }}>
                  <button onClick={() => edit(r)} style={actBtn('#2563eb', true)}>✏️ Edit</button>
                  <button onClick={() => del(r.id)} style={actBtn('#dc2626')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f0f9ff', fontWeight: 700, borderTop: '2px solid #bfdbfe' }}>
                <td colSpan={3} style={{ padding: '10px 14px', color: BRAND }}>TOTAL</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a', fontSize: 14 }}>{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }
const inp = { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fafafa' }
const actBtn = (color, solid) => ({ marginRight: 6, padding: '5px 14px', fontSize: 12, fontWei