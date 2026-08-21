import { apiFetch } from '../auth';
import { useEffect, useState } from 'react';
import { fmt, MONTHS, YEARS, CURRENT_YEAR, CURRENT_MONTH, BRAND, ACCENT, EXPENSE_CATS } from '../utils';

const PER_PAGE = 20;

export default function Expenses() {
  var [rows, setRows]               = useState([]);
  var [filterYear, setFilterYear]   = useState(CURRENT_YEAR);
  var [filterMonth, setFilterMonth] = useState(0);
  var [filterCat, setFilterCat]     = useState('');
  var [sortCol, setSortCol]         = useState('month');
  var [sortDir, setSortDir]         = useState('desc');
  var [page, setPage]               = useState(1);
  var [showForm, setShowForm]       = useState(false);
  var [editRow, setEditRow]         = useState(null);
  var [form, setForm]               = useState(blank());
  var [saving, setSaving]           = useState(false);

  function blank() {
    return { year: CURRENT_YEAR, month: CURRENT_MONTH, category: EXPENSE_CATS[0], description: '', amount: '', payment_method: '' };
  }

  var load = function() {
    apiFetch('/api/expenses?year=' + filterYear).then(function(r) { return r.json(); }).then(function(data) {
      setRows(data); setPage(1);
    });
  };

  useEffect(function() { load(); }, [filterYear]);

  function toggleSort(col) {
    if (sortCol === col) {
      setSortDir(function(d) { return d === 'asc' ? 'desc' : 'asc'; });
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  }

  var base     = filterMonth ? rows.filter(function(r) { return r.month === filterMonth; }) : rows;
  var filtered = filterCat   ? base.filter(function(r) { return r.category === filterCat; }) : base;

  var sorted = filtered.slice().sort(function(a, b) {
    var av, bv;
    if      (sortCol === 'month') { av = a.year * 100 + a.month;        bv = b.year * 100 + b.month; }
    else if (sortCol === 'cat')   { av = a.category.toLowerCase();       bv = b.category.toLowerCase(); }
    else if (sortCol === 'amt')   { av = a.amount;                       bv = b.amount; }
    else if (sortCol === 'desc')  { av = (a.description||'').toLowerCase(); bv = (b.description||'').toLowerCase(); }
    else                          { av = a.month; bv = b.month; }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  var total      = filtered.reduce(function(s, r) { return s + r.amount; }, 0);
  var totalPages = Math.ceil(sorted.length / PER_PAGE);
  var paged      = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  var byCat = EXPENSE_CATS
    .map(function(cat) {
      return { cat: cat, amount: filtered.filter(function(r) { return r.category === cat; }).reduce(function(s, r) { return s + r.amount; }, 0) };
    })
    .filter(function(c) { return c.amount > 0; })
    .sort(function(a, b) { return b.amount - a.amount; });

  var byMonth = MONTHS
    .map(function(name, i) {
      return { name: name, month: i + 1, amount: rows.filter(function(r) { return r.month === i + 1; }).reduce(function(s, r) { return s + r.amount; }, 0) };
    })
    .filter(function(m) { return m.amount > 0; });

  var maxCat   = byCat[0] ? byCat[0].amount : 1;
  var maxMonth = Math.max.apply(null, byMonth.map(function(m) { return m.amount; }).concat([1]));

  var openAdd  = function() { setEditRow(null); setForm(blank()); setShowForm(true); };
  var openEdit = function(r) {
    setEditRow(r);
    setForm({ year: r.year, month: r.month, category: r.category, description: r.description || '', amount: r.amount, payment_method: r.payment_method || '' });
    setShowForm(true);
  };

  var handleDelete = async function(id) {
    if (!window.confirm('Delete this expense entry?')) return;
    await apiFetch('/api/expenses/' + id, { method: 'DELETE' });
    load();
  };

  var handleSave = async function() {
    if (!form.amount || isNaN(+form.amount)) return;
    setSaving(true);
    var body = JSON.stringify(Object.assign({}, form, { amount: +form.amount }));
    var hdrs = { 'Content-Type': 'application/json' };
    if (editRow) await apiFetch('/api/expenses/' + editRow.id, { method: 'PUT',  headers: hdrs, body: body });
    else         await apiFetch('/api/expenses',                { method: 'POST', headers: hdrs, body: body });
    setSaving(false); setShowForm(false); load();
  };

  var goPage = function(p) { setPage(Math.max(1, Math.min(totalPages, p))); };

  function SortTh(props) {
    var col = props.col; var children = props.children; var right = props.right; var wide = props.wide;
    var active = sortCol === col;
    return (
      <th onClick={function() { toggleSort(col); }} style={{
        padding: '10px 12px', textAlign: right ? 'right' : 'left',
        fontWeight: 600, fontSize: 11, letterSpacing: '0.3px', whiteSpace: 'nowrap',
        cursor: 'pointer', userSelect: 'none',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        width: wide ? '28%' : undefined,
      }}>
        {children}
        <span style={{ marginLeft: 4, opacity: active ? 1 : 0.35, fontSize: 10 }}>
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </th>
    );
  }

  function pmBadge(pm) {
    if (!pm) return null;
    var bg    = pm === 'Cash' ? '#dcfce7' : pm === 'MTN Momo' ? '#fef9c3' : '#dbeafe';
    var color = pm === 'Cash' ? '#166534' : pm === 'MTN Momo' ? '#713f12' : '#1d4ed8';
    return (
      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', background: bg, color: color }}>
        {pm}
      </span>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND, margin: 0 }}>Admin / Overhead Expenses</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Track all overhead expenditure for {filterYear}</p>
        </div>
        <button onClick={openAdd} style={primaryBtn}>+ Add Expense</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: 22 }}>

        <div>
          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
            <Card label="Total Expenditure" value={fmt(total)} hi />
            <Card label="Transactions"      value={filtered.length} />
            <Card label="Avg per Entry"     value={filtered.length ? fmt(total / filtered.length) : 'GHS 0.00'} />
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <select style={sel} value={filterYear} onChange={function(e) { setFilterYear(+e.target.value); setPage(1); }}>
              {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
            </select>
            <select style={sel} value={filterMonth} onChange={function(e) { setFilterMonth(+e.target.value); setPage(1); }}>
              <option value={0}>All Months</option>
              {MONTHS.map(function(m, i) { return <option key={i} value={i + 1}>{m}</option>; })}
            </select>
            <select style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500, maxWidth: 180 }} value={filterCat} onChange={function(e) { setFilterCat(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {EXPENSE_CATS.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
            {filterCat && (
              <button onClick={function() { setFilterCat(''); setPage(1); }} style={{ padding: '7px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                x Clear
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>
              {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
              {totalPages > 1 ? ' - page ' + page + '/' + totalPages : ''}
            </span>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: BRAND, color: '#fff' }}>
                  <SortTh col="month">Month</SortTh>
                  <SortTh col="cat">Category</SortTh>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>Vendor</th>
                  <SortTh col="desc" wide>Description</SortTh>
                  <SortTh col="amt" right>Amount</SortTh>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>Payment</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 11 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No expenses found</td></tr>
                ) : paged.map(function(r, i) {
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={td}><span style={{ whiteSpace: 'nowrap' }}>{MONTHS[r.month - 1].slice(0, 3)} {r.year}</span></td>
                      <td style={td}>
                        <span onClick={function() { setFilterCat(r.category); setPage(1); }}
                          style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer' }}
                          title={'Filter by ' + r.category}>
                          {r.category}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{r.vendor_name || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#374151', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.description || ''}>
                        {r.description || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#374151', textAlign: 'right', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmt(r.amount)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {r.payment_method ? pmBadge(r.payment_method) : <span style={{ color: '#cbd5e1', fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button onClick={function() { openEdit(r); }} style={editBtn}>Edit</button>
                        <button onClick={function() { handleDelete(r.id); }} style={delBtn}>Del</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {paged.length > 0 && (
                <tfoot>
                  <tr style={{ background: '#f0f4f8' }}>
                    <td colSpan={5} style={{ padding: '10px 12px', color: '#374151', fontWeight: 800, color: BRAND, fontSize: 12 }}>
                      {filterCat ? filterCat + ' - ' : ''}{filterMonth ? MONTHS[filterMonth - 1] + ' ' : ''}{filterYear} TOTAL
                    </td>
                    <td style={{ padding: '10px 12px', color: '#374151', textAlign: 'right', fontWeight: 800, color: BRAND, whiteSpace: 'nowrap' }}>{fmt(total)}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, marginTop: 16, flexWrap: 'wrap' }}>
              <PgBtn onClick={function() { goPage(1); }}          disabled={page === 1}>First</PgBtn>
              <PgBtn onClick={function() { goPage(page - 1); }}   disabled={page === 1}>Prev</PgBtn>
              {pageNums(page, totalPages).map(function(p, i) {
                return p === '...'
                  ? <span key={'d' + i} style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>
                  : <PgBtn key={p} onClick={function() { goPage(p); }} active={p === page}>{p}</PgBtn>;
              })}
              <PgBtn onClick={function() { goPage(page + 1); }}   disabled={page === totalPages}>Next</PgBtn>
              <PgBtn onClick={function() { goPage(totalPages); }} disabled={page === totalPages}>Last</PgBtn>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: BRAND, borderRadius: 12, padding: '20px 18px', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.7, marginBottom: 6 }}>
              {filterCat ? filterCat : filterMonth ? MONTHS[filterMonth - 1] : 'Annual'} Expenditure
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(total)}</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{filtered.length} transactions</div>
          </div>

          {byCat.length > 0 && (
            <Panel title="By Category">
              {byCat.map(function(item) {
                return (
                  <div key={item.cat} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span onClick={function() { setFilterCat(item.cat); setPage(1); }}
                        style={{ color: filterCat === item.cat ? BRAND : '#374151', fontWeight: filterCat === item.cat ? 700 : 500, flex: 1, marginRight: 6, cursor: 'pointer' }}>
                        {item.cat}
                      </span>
                      <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmt(item.amount)}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 4, height: 5 }}>
                      <div style={{ background: filterCat === item.cat ? ACCENT : BRAND, borderRadius: 4, height: 5, width: ((item.amount / maxCat) * 100) + '%' }} />
                    </div>
                  </div>
                );
              })}
              {filterCat && (
                <button onClick={function() { setFilterCat(''); setPage(1); }} style={{ marginTop: 4, fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  x Clear filter
                </button>
              )}
            </Panel>
          )}

          {byMonth.length > 0 && (
            <Panel title="By Month">
              {byMonth.map(function(item) {
                return (
                  <div key={item.month} style={{ marginBottom: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: '#374151', fontWeight: 500 }}>{item.name}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{fmt(item.amount)}</span>
                    </div>
                    <div style={{ background: '#f1f5f9', borderRadius: 4, height: 5 }}>
                      <div style={{ background: ACCENT, borderRadius: 4, height: 5, width: ((item.amount / maxMonth) * 100) + '%' }} />
                    </div>
                  </div>
                );
              })}
            </Panel>
          )}
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,39,68,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={function(e) { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
            <h3 style={{ margin: '0 0 20px', color: BRAND, fontWeight: 800, fontSize: 17 }}>
              {editRow ? 'Edit Expense' : 'New Expense'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Year</label>
                <select style={inp} value={form.year} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { year: +e.target.value }); }); }}>
                  {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
                </select>
              </div>
              <div>
                <label style={lbl}>Month</label>
                <select style={inp} value={form.month} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { month: +e.target.value }); }); }}>
                  {MONTHS.map(function(m, i) { return <option key={i} value={i + 1}>{m}</option>; })}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.category} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { category: e.target.value }); }); }}>
                {EXPENSE_CATS.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Description</label>
              <input style={inp} value={form.description} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { description: e.target.value }); }); }} placeholder="What was this for?" />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Amount (GHS)</label>
              <input style={inp} type="number" min="0" step="0.01" value={form.amount} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { amount: e.target.value }); }); }} placeholder="0.00" />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={lbl}>Payment Method</label>
              <select style={inp} value={form.payment_method} onChange={function(e) { setForm(function(f) { return Object.assign({}, f, { payment_method: e.target.value }); }); }}>
                <option value="">-- Select --</option>
                <option value="Cash">Cash</option>
                <option value="Zenith Bank">Zenith Bank</option>
                <option value="MTN Momo">MTN Momo</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                {saving ? 'Saving...' : editRow ? 'Update Expense' : 'Add Expense'}
              </button>
              <button onClick={function() { setShowForm(false); }} style={{ padding: '11px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pageNums(cur, total) {
  if (total <= 7) return Array.from({ length: total }, function(_, i) { return i + 1; });
  var pages = new Set([1, total, cur, cur - 1, cur + 1].filter(function(p) { return p >= 1 && p <= total; }));
  var srt = Array.from(pages).sort(function(a, b) { return a - b; });
  var result = [];
  srt.forEach(function(p, i) {
    if (i > 0 && p - srt[i - 1] > 1) result.push('...');
    result.push(p);
  });
  return result;
}

function Card(props) {
  var label = props.label; var value = props.value; var hi = props.hi;
  return (
    <div style={{ background: hi ? BRAND : '#fff', padding: '16px 18px', borderRadius: 12, border: hi ? 'none' : '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: hi ? 'rgba(255,255,255,0.65)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: hi ? '#fff' : '#0f172a' }}>{value}</div>
    </div>
  );
}

function Panel(props) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ fontWeight: 700, fontSize: 11, color: BRAND, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{props.title}</div>
      {props.children}
    </div>
  );
}

function PgBtn(props) {
  var children = props.children; var onClick = props.onClick; var disabled = props.disabled; var active = props.active;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '5px 11px', minWidth: 36,
      background: active ? BRAND : disabled ? '#f8fafc' : '#fff',
      color:      active ? '#fff' : disabled ? '#cbd5e1' : '#374151',
      border:     '1px solid ' + (active ? BRAND : '#e2e8f0'),
      borderRadius: 6, fontSize: 12, fontWeight: active ? 700 : 500,
      cursor: disabled ? 'default' : 'pointer',
    }}>{children}</button>
  );
}

var td  = { padding: '10px 12px', color: '#374151' };
var sel = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 500 };
var inp = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
var primaryBtn = { padding: '10px 20px', background: BRAND, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
var editBtn = { padding: '4px 10px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginRight: 4 };
var delBtn  = { padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' };
var lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
