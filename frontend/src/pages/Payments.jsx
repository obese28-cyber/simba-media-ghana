import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, CURRENT_MONTH, BRAND } from '../utils'

const today = new Date().toISOString().split('T')[0]
const BLANK = { vendor_id: '', year: CURRENT_YEAR, month: CURRENT_MONTH, amount: '', description: '', payment_date: today, payment_method: 'Bank Transfer' }
const METHODS = ['Bank Transfer', 'Cash', 'Mobile Money', 'Cheque', 'Card']

export default function Payments() {
  const [rows, setRows] = useState([])
  const [vendors, setVendors] = useState([])
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR)
  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH)
  const [filterVendor, setFilterVendor] = useState('')
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    let url = `/api/payments?year=${filterYear}&month=${filterMonth}`
    if (filterVendor) url += `&vendor_id=${filterVendor}`
    apiFetch(url).then(r => r.json()).then(setRows)
  }
  useEffect(() => { load() }, [filterYear, filterMonth, filterVendor])
  useEffect(() => { apiFetch('/api/vendors').then(r => r.json()).then(setVendors) }, [])

  const save = async () => {
    if (!form.vendor_id || !form.amount) return
    const url = editId ? `/api/payments/${editId}` : '/api/payments'
    const method = editId ? 'PUT' : 'POST'
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: +form.amount, vendor_id: +form.vendor_id }) })
    setForm(BLANK); setEditId(null); setShowForm(false); load()
  }

  const del = async (id) => { if (!confirm('Delete payment?')) return; await apiFetch(`/api/payments/${id}`, { method: 'DELETE' }); load() }
  const edit = (r) => {
    setForm({ vendor_id: r.vendor_id, year: r.year, month: r.month, amount: r.amount, description: r.description || '', payment_date: r.payment_date || today, payment_method: r.payment_method || 'Bank Transfer' })
    setEditId(r.id); setShowForm(true)
  }

  const total = rows.reduce((s, r) => s + r.amount, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Vendor Payments</h1>
        <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
          style={{ padding: '9px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
          + Record Payment
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: `2px solid ${BRAND}` }}>
          <div style={{ fontWeight: 700, color: BRAND, marginBottom: 16, fontSize: 15 }}>{editId ? 'Edit Payment' : 'Record Payment'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={lbl}>Vendor *</label>
              <select value={form.vendor_id} onChange={e => setForm(f => ({ ...f, vendor_id: e.target.value }))} style={inp}>
                <option value="">Select vendor…</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
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
              <label style={lbl}>Amount (GHS) *</label>
              <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Payment Date</label>
              <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Method</label>
              <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} style={inp}>
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Invoice ref…" style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ padding: '9px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>{editId ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK) }} style={{ padding: '9px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={filterYear} onChange={e => setFilterYear(+e.target.value)} style={{ ...inp, width: 'auto' }}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)} style={{ ...inp, width: 'auto' }}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} style={{ ...inp, width: 'auto' }}>
          <option value="">All Vendors</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: BRAND, color: '#fff' }}>
              {['Vendor', 'Month/Year', 'Payment Date', 'Method', 'Description', 'Amount', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No payments for this period.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 14px', fontWeight: 600 }}>{r.vendor_name}</td>
                <td style={{ padding: '9px 14px' }}>{MONTHS[r.month - 1]} {r.year}</td>
                <td style={{ padding: '9px 14px', color: '#475569' }}>{r.payment_date}</td>
                <td style={{ padding: '9px 14px' }}><span style={{ background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{r.payment_method}</span></td>
                <td style={{ padding: '9px 14px', color: '#475569' }}>{r.description}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: '#0a3d62' }}>{fmt(r.amount)}</td>
                <td style={{ padding: '9px 14px' }}>
                  <button onClick={() => edit(r)} style={actBtn('#2563eb')}>Edit</button>
                  <button onClick={() => del(r.id)} style={actBtn('#dc2626')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: '#dbeafe', fontWeight: 700, borderTop: '2px solid #93c5fd' }}>
                <td colSpan={5} style={{ padding: '10px 14px', color: BRAND }}>TOTAL PAID</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: BRAND, fontSize: 14 }}>{fmt(total)}</td>
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
const actBtn = (color) => ({ marginRight: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, background: color + '18', color, cursor: 'pointer' })
