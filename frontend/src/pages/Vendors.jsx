import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { BRAND } from '../utils'

const BLANK = { name: '', contact: '', phone: '', email: '', service_type: '', notes: '' }

export default function Vendors() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => { apiFetch('/api/vendors').then(r => r.json()).then(setRows) }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name) return
    const url = editId ? `/api/vendors/${editId}` : '/api/vendors'
    const method = editId ? 'PUT' : 'POST'
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm(BLANK); setEditId(null); setShowForm(false); load()
  }

  const del = async (id) => { if (!confirm('Delete this vendor?')) return; await apiFetch(`/api/vendors/${id}`, { method: 'DELETE' }); load() }
  const edit = (r) => { setForm({ name: r.name, contact: r.contact || '', phone: r.phone || '', email: r.email || '', service_type: r.service_type || '', notes: r.notes || '' }); setEditId(r.id); setShowForm(true) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Vendors / Suppliers</h1>
        <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
          style={{ padding: '9px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
          + Add Vendor
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: `2px solid ${BRAND}` }}>
          <div style={{ fontWeight: 700, color: BRAND, marginBottom: 16, fontSize: 15 }}>{editId ? 'Edit Vendor' : 'New Vendor'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.2fr 1.5fr 1.5fr', gap: 12 }}>
            <div>
              <label style={lbl}>Company / Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Vendor name" style={inp} />
            </div>
            <div>
              <label style={lbl}>Contact Person</label>
              <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="Contact name" style={inp} />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+233…" style={inp} />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@…" style={inp} />
            </div>
            <div>
              <label style={lbl}>Service Type</label>
              <input value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} placeholder="e.g. Equipment Hire" style={inp} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Bank details, payment terms…" style={{ ...inp, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ padding: '9px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>{editId ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK) }} style={{ padding: '9px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {rows.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center', color: '#94a3b8', gridColumn: '1/-1' }}>
            No vendors yet. Add your first supplier.
          </div>
        )}
        {rows.map(v => (
          <div key={v.id} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: BRAND }}>{v.name}</div>
                {v.service_type && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{v.service_type}</span>}
              </div>
              <div>
                <button onClick={() => edit(v)} style={actBtn('#2563eb')}>Edit</button>
                <button onClick={() => del(v.id)} style={actBtn('#dc2626')}>Del</button>
              </div>
            </div>
            {v.contact && <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>👤 {v.contact}</div>}
            {v.phone && <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>📞 {v.phone}</div>}
            {v.email && <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>✉️ {v.email}</div>}
            {v.notes && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>{v.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }
const inp = { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fafafa' }
const actBtn = (color) => ({ marginRight: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, background: color + '18', color, cursor: 'pointer' })
