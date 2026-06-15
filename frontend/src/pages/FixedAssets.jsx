import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, BRAND, ASSET_CATS } from '../utils'

const today = new Date().toISOString().split('T')[0]
const BLANK = { name: '', category: ASSET_CATS[0], purchase_date: today, cost: '', useful_life_years: 5, description: '' }

export default function FixedAssets() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(BLANK)
  const [editId, setEditId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => { apiFetch('/api/fixed-assets').then(r => r.json()).then(setRows) }
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name || !form.cost) return
    const url = editId ? `/api/fixed-assets/${editId}` : '/api/fixed-assets'
    const method = editId ? 'PUT' : 'POST'
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, cost: +form.cost, useful_life_years: +form.useful_life_years }) })
    setForm(BLANK); setEditId(null); setShowForm(false); load()
  }

  const del = async (id) => { if (!confirm('Delete this asset?')) return; await apiFetch(`/api/fixed-assets/${id}`, { method: 'DELETE' }); load() }
  const edit = (r) => { setForm({ name: r.name, category: r.category, purchase_date: r.purchase_date, cost: r.cost, useful_life_years: r.useful_life_years, description: r.description || '' }); setEditId(r.id); setShowForm(true) }

  const totalCost = rows.reduce((s, r) => s + r.cost, 0)

  // Simple straight-line depreciation per year
  const annualDep = (r) => r.useful_life_years > 0 ? r.cost / r.useful_life_years : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Fixed Assets / Capital Items</h1>
        <button onClick={() => { setForm(BLANK); setEditId(null); setShowForm(true) }}
          style={{ padding: '9px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
          + Add Asset
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: `2px solid ${BRAND}` }}>
          <div style={{ fontWeight: 700, color: BRAND, marginBottom: 16, fontSize: 15 }}>{editId ? 'Edit Asset' : 'New Fixed Asset'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.2fr 1.5fr 1fr 2fr', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={lbl}>Asset Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sony Camera FX6" style={inp} />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
                {ASSET_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Purchase Date</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Cost (GHS)</label>
              <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" style={inp} />
            </div>
            <div>
              <label style={lbl}>Useful Life (yrs)</label>
              <input type="number" value={form.useful_life_years} onChange={e => setForm(f => ({ ...f, useful_life_years: e.target.value }))} min={1} max={50} style={inp} />
            </div>
            <div>
              <label style={lbl}>Notes</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Serial no., supplier…" style={inp} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ padding: '9px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>{editId ? 'Update' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(BLANK) }} style={{ padding: '9px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Summary card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '2px solid #6366f1', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', marginBottom: 8 }}>Total Assets</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>{fmt(totalCost)}</div>
        </div>
        <div style={{ background: '#fff', border: '2px solid #0891b2', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', textTransform: 'uppercase', marginBottom: 8 }}>Number of Assets</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0e7490' }}>{rows.length}</div>
        </div>
        <div style={{ background: '#fff', border: '2px solid #f59e0b', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', marginBottom: 8 }}>Annual Depreciation</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309' }}>{fmt(rows.reduce((s, r) => s + annualDep(r), 0))}</div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: BRAND, color: '#fff' }}>
              {['Asset Name', 'Category', 'Purchase Date', 'Cost', 'Useful Life', 'Annual Dep.', 'Notes', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: ['Cost','Annual Dep.'].includes(h) ? 'right' : 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No fixed assets recorded yet.</td></tr>}
            {rows.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '9px 14px', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '9px 14px' }}><span style={{ background: '#ede9fe', color: '#5b21b6', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.category}</span></td>
                <td style={{ padding: '9px 14px', color: '#475569' }}>{r.purchase_date}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: '#4f46e5' }}>{fmt(r.cost)}</td>
                <td style={{ padding: '9px 14px', textAlign: 'center' }}>{r.useful_life_years} yr{r.useful_life_years !== 1 ? 's' : ''}</td>
                <td style={{ padding: '9px 14px', textAlign: 'right', color: '#b45309' }}>{fmt(annualDep(r))}</td>
                <td style={{ padding: '9px 14px', color: '#475569', fontSize: 12 }}>{r.description}</td>
                <td style={{ padding: '9px 14px' }}>
                  <button onClick={() => edit(r)} style={actBtn('#2563eb')}>Edit</button>
                  <button onClick={() => del(r.id)} style={actBtn('#dc2626')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: '#ede9fe', fontWeight: 700, borderTop: '2px solid #c4b5fd' }}>
                <td colSpan={3} style={{ padding: '10px 14px', color: BRAND }}>TOTAL</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#4f46e5', fontSize: 14 }}>{fmt(totalCost)}</td>
                <td />
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#b45309', fontSize: 14 }}>{fmt(rows.reduce((s, r) => s + annualDep(r), 0))}</td>
                <td /><td />
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
