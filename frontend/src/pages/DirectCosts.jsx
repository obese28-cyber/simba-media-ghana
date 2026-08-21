import { apiFetch } from '../auth'
import { useEffect, useState } from 'react'
import { fmt, MONTHS, YEARS, CURRENT_YEAR, CURRENT_MONTH, BRAND, DIRECT_COST_CATS } from '../utils'

const BASE_PAYMENT = ['Cash', 'Zenith Bank', 'MTN Momo']

function loadCustomCats() {
  try { return JSON.parse(localStorage.getItem('dc_custom_cats') || '[]'); } catch(e) { return []; }
}
function saveCustomCats(cats) {
  localStorage.setItem('dc_custom_cats', JSON.stringify(cats));
}

function makeBlank(cats) {
  return { year: CURRENT_YEAR, month: CURRENT_MONTH, category: cats[0], description: '', vendor_id: '', amount: '', payment_method: '' };
}

export default function DirectCosts() {
  const [rows, setRows]           = useState([])
  const [vendors, setVendors]     = useState([])
  const [filterYear, setFilterYear]   = useState(CURRENT_YEAR)
  const [filterMonth, setFilterMonth] = useState('')   // '' = All Months (static default)
  const [customCats, setCustomCats]   = useState(loadCustomCats)
  const [newCatInput, setNewCatInput] = useState('')
  const [showNewCat, setShowNewCat]   = useState(false)
  const [form, setForm]           = useState(makeBlank([...DIRECT_COST_CATS, ...loadCustomCats()]))
  const [editId, setEditId]       = useState(null)
  const [showForm, setShowForm]   = useState(false)

  var allCats = DIRECT_COST_CATS.concat(customCats);

  const load = () => {
    var url = '/api/direct-costs?year=' + filterYear
    if (filterMonth) url += '&month=' + filterMonth   // omit month param -> backend returns all months
    apiFetch(url).then(r => r.json()).then(setRows)
  }
  useEffect(() => { load() }, [filterYear, filterMonth])
  useEffect(() => { apiFetch('/api/vendors').then(r => r.json()).then(setVendors) }, [])

  function addCustomCat() {
    var name = newCatInput.trim();
    if (!name) return;
    if (allCats.indexOf(name) !== -1) { alert('Category already exists'); return; }
    var updated = customCats.concat([name]);
    setCustomCats(updated);
    saveCustomCats(updated);
    setForm(function(f) { return Object.assign({}, f, { category: name }); });
    setNewCatInput('');
    setShowNewCat(false);
  }

  function removeCustomCat(cat) {
    if (!window.confirm('Remove category "' + cat + '"?')) return;
    var updated = customCats.filter(function(c) { return c !== cat; });
    setCustomCats(updated);
    saveCustomCats(updated);
  }

  const save = async () => {
    if (!form.amount || !form.category) return
    var url    = editId ? '/api/direct-costs/' + editId : '/api/direct-costs'
    var method = editId ? 'PUT' : 'POST'
    await apiFetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({}, form, { amount: +form.amount, vendor_id: form.vendor_id || null })) })
    setForm(makeBlank(allCats)); setEditId(null); setShowForm(false); load()
  }

  const del  = async (id) => { if (!confirm('Delete?')) return; await apiFetch('/api/direct-costs/' + id, { method: 'DELETE' }); load() }
  const edit = (r) => {
    setForm({ year: r.year, month: r.month, category: r.category, description: r.description || '', vendor_id: r.vendor_id || '', amount: r.amount, payment_method: r.payment_method || '' });
    setEditId(r.id); setShowForm(true);
  }

  const total = rows.reduce(function(s, r) { return s + r.amount; }, 0)

  function pmColor(pm) {
    if (pm === 'Cash')        return { bg: '#f0fdf4', color: '#15803d' };
    if (pm === 'MTN Momo')    return { bg: '#fff8e1', color: '#f57f17' };
    if (pm === 'Zenith Bank') return { bg: '#e3f2fd', color: '#0d47a1' };
    return { bg: '#f1f5f9', color: '#475569' };
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND }}>Direct / Production Costs</h1>
        <button onClick={function() { setForm(makeBlank(allCats)); setEditId(null); setShowForm(true); }}
          style={{ padding: '9px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Add Cost
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24, border: '2px solid ' + BRAND }}>
          <div style={{ fontWeight: 700, color: BRAND, marginBottom: 16, fontSize: 15 }}>{editId ? 'Edit Cost' : 'New Direct Cost'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr 1fr 2fr 1.3fr 1.4fr', gap: 12, alignItems: 'end' }}>

            <div>
              <label style={lbl}>Year</label>
              <select value={form.year} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { year: +e.target.value }); }); }} style={inp}>
                {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
              </select>
            </div>

            <div>
              <label style={lbl}>Month</label>
              <select value={form.month} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { month: +e.target.value }); }); }} style={inp}>
                {MONTHS.map(function(m, i) { return <option key={i+1} value={i+1}>{m}</option>; })}
              </select>
            </div>

            <div>
              <label style={lbl}>
                Category
                <button onClick={function() { setShowNewCat(function(v) { return !v; }); }} style={{ marginLeft: 6, fontSize: 11, padding: '1px 6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 4, cursor: 'pointer', fontWeight: 700 }}>
                  + New
                </button>
              </label>
              {showNewCat ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input autoFocus value={newCatInput} onChange={function(e) { setNewCatInput(e.target.value); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') addCustomCat(); if (e.key === 'Escape') setShowNewCat(false); }}
                    placeholder="Category name…" style={{ ...inp, flex: 1 }} />
                  <button onClick={addCustomCat} style={{ padding: '8px 12px', background: BRAND, color: '#fff', border: 'none', borderRadius: 7, fontWeight: 700, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>Add</button>
                  <button onClick={function() { setShowNewCat(false); setNewCatInput(''); }} style={{ padding: '8px 10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 7, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <select value={form.category} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { category: e.target.value }); }); }} style={inp}>
                  <optgroup label="Standard">
                    {DIRECT_COST_CATS.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                  </optgroup>
                  {customCats.length > 0 && (
                    <optgroup label="Custom">
                      {customCats.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
                    </optgroup>
                  )}
                </select>
              )}
            </div>

            <div>
              <label style={lbl}>Vendor</label>
              <select value={form.vendor_id} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { vendor_id: e.target.value }); }); }} style={inp}>
                <option value="">— None —</option>
                {vendors.map(function(v) { return <option key={v.id} value={v.id}>{v.name}</option>; })}
              </select>
            </div>

            <div>
              <label style={lbl}>Description</label>
              <input value={form.description} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { description: e.target.value }); }); }} placeholder="Details…" style={inp} />
            </div>

            <div>
              <label style={lbl}>Amount (GHS)</label>
              <input type="number" value={form.amount} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { amount: e.target.value }); }); }} placeholder="0.00" style={inp} />
            </div>

            <div>
              <label style={lbl}>Payment Method</label>
              <select value={form.payment_method} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { payment_method: e.target.value }); }); }} style={inp}>
                <option value="">— Select —</option>
                {BASE_PAYMENT.map(function(m) { return <option key={m} value={m}>{m}</option>; })}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={save} style={{ padding: '9px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{editId ? 'Update' : 'Save'}</button>
            <button onClick={function() { setShowForm(false); setEditId(null); setForm(makeBlank(allCats)); }} style={{ padding: '9px 18px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Custom categories manager */}
      {customCats.length > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Categories:</span>
          {customCats.map(function(cat) { return (
            <span key={cat} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff3e0', color: '#e65100', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid #fed7aa' }}>
              {cat}
              <button onClick={function() { removeCustomCat(cat); }} style={{ background: 'none', border: 'none', color: '#e65100', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
            </span>
          ); })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <select value={filterYear} onChange={function(e) { setFilterYear(+e.target.value); }} style={{ ...inp, width: 'auto' }}>
          {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
        </select>
        <select value={filterMonth} onChange={function(e) { setFilterMonth(e.target.value ? +e.target.value : ''); }} style={{ ...inp, width: 'auto' }}>
          <option value="">All Months</option>
          {MONTHS.map(function(m, i) { return <option key={i+1} value={i+1}>{m}</option>; })}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#94a3b8', alignSelf: 'center' }}>{rows.length} entries</span>
      </div>

      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: BRAND, color: '#fff' }}>
              {['Month/Year', 'Category', 'Vendor', 'Description', 'Payment', 'Amount', 'Actions'].map(function(h) { return (
                <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left', fontWeight: 600, fontSize: 12 }}>{h}</th>
              ); })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>No entries for this period.</td></tr>}
            {rows.map(function(r, i) {
              var pc = pmColor(r.payment_method);
              return (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>{MONTHS[r.month - 1].slice(0,3)} {r.year}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ background: '#fff3e0', color: '#e65100', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.category}</span>
                  </td>
                  <td style={{ padding: '9px 14px', color: '#475569' }}>{r.vendor_name || '—'}</td>
                  <td style={{ padding: '9px 14px', color: '#475569', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.description}>{r.description || '—'}</td>
                  <td style={{ padding: '9px 14px' }}>
                    {r.payment_method
                      ? <span style={{ background: pc.bg, color: pc.color, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.payment_method}</span>
                      : <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: '#dc2626', whiteSpace: 'nowrap' }}>{fmt(r.amount)}</td>
                  <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                    <button onClick={function() { edit(r); }} style={actBtn('#2563eb')}>Edit</button>
                    <button onClick={function() { del(r.id); }} style={actBtn('#dc2626')}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: '#fff3e0', fontWeight: 700, borderTop: '2px solid #fed7aa' }}>
                <td colSpan={5} style={{ padding: '10px 14px', color: BRAND }}>TOTAL</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#dc2626', fontSize: 14 }}>{fmt(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

const lbl    = { display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }
const inp    = { width: '100%', padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fafafa', boxSizing: 'border-box' }
const actBtn = function(color) { return { marginRight: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 6, background: color + '18', color: color, cursor: 'pointer' }; }
