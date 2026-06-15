import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, CURRENT_MONTH, BRAND, DIRECT_COST_CATS } from '../utils'

const PAYMENT_METHODS = ['Zenith Bank', 'MTN Momo']
const BLANK = { year: CURRENT_YEAR, month: CURRENT_MONTH, category: DIRECT_COST_CATS[0], description: '', vendor_id: '', amount: '', payment_method: '' }

export default function DirectCosts() {
  const [rows, setRows] = useState([])
  const [vendors, setVendors] = useState([])
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH)
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    apiFetch(`/api/direct-costs?year=${filterYear}&month=${filterMonth}`).then(r => r.json()).then(setRows)
  }
  useEffect(() => { load() }, [filterYear, filterMonth])
  useEffect(() => { apiFetch('/api/vendors').then(r => r.json()).then(setVendors) }, [])

  const save = async () => {
    if (!form.amount || !form.category) return
    const url = editId ? `/api/direct-costs/${editId}` : '/api/direct-costs'
    const method = editId ? 'PUT' : 'POST'
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: +form.amount, vendor_id: form.vendor_id || null }) })
    setForm(BLANK); setEditId(null); setShowForm(false); load()
  }

  const del = async (id) => { if (!confirm('Delete?')) return; await apiFetch(`/api/direct-costs/${id}`, { method: 'DELETE' }); load() }
  const edit = (r) => { setForm({ year: r.year, month: r.month, category: r.category, description: r.description || '', vendor_id: r.vendor_id || '', amount: r.amount, payment_method: r.payment_method || '' }); setEditId(r.id); setShowForm(true) }

  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Direct / Production Costs</h1>
        <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
          style={{ padding: '9px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
          + Add Cost
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: `2px solid ${BRAND}` }}>
          <div style={{ fontWeight: 700, color: BRAND, marginBottom: 16, fontSize: 15 }}>{editId ? 'Edit Cost' : 'New Direct Cost'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr 1.5fr 1.5fr', gap: 12, alignItems: 'end' }}>
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
                {DIRECT_COST_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Vendor (optional)</label>
              <select value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} style={inp}>
                <option value="">— None —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Details…" style={inp} />
            </div>
            <div>
              <label style={lbl}>Amount (GHS)</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} style={inp}>
                <option value="">— Select —</option>
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
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
        <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} style={{ ...inp, width: 'auto' }}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: BRAND, color: '#fff' }}>
              {['Month/Year', 'Category', 'Vendor', 'Description', 'Payment Method', 'Amount', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No entries for this period.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 14px' }}>{MONTHS[r.month - 1]} {r.year}</td>
                <td style={{ padding: '9px 14px' }}><span style={{ background: '#fff3e0', color: '#e65100', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.category}</span></td>
                <td style={{ padding: '9px 14px', color: '#475569' }}>{r.vendor_name || '—'}</td>
                <td style={{ padding: '9px 14px', color: '#475569' }}>{r.description}</td>
                <td style={{ padding: '9px 14px' }}>
                  {r.payment_method
                    ? <span style={{ background: r.payment_method === 'MTN Momo' ? '#fff8e1' : '#e3f2fd', color: r.payment_method === 'MTN Momo' ? '#f57f17' : '#0d47a1', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.payment_method}</span>
                    : <span style={{ color: '#cbd5e1' }}>—</span>}
                </td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(r.amount)}</td>
                <td style={{ padding: '9px 14px' }}>
                  <button onClick={() => edit(r)} style={actBtn('#2563eb')}>Edit</button>
                  <button onClick={() => del(r.id)} style={actBtn('#dc2626')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody