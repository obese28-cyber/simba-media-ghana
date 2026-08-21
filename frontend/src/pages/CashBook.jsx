import { apiFetch } from '../auth';
import { useEffect, useState } from 'react';
import { fmt, MONTHS, YEARS, CURRENT_YEAR, BRAND, ACCENT } from '../utils';

const ACCOUNTS = [
  { key: 'Cash',        label: 'Cash',        color: '#166534', bg: '#dcfce7', border: '#bbf7d0' },
  { key: 'Zenith Bank', label: 'Zenith Bank', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
  { key: 'MTN Momo',   label: 'MTN Momo',   color: '#713f12', bg: '#fef9c3', border: '#fef08a' },
];

const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CashBook() {
  var [year, setYear]         = useState(CURRENT_YEAR);
  var [tab, setTab]           = useState('Cash');
  var [view, setView]         = useState('summary');   /* 'summary' | 'detail' */
  var [summary, setSummary]   = useState([]);
  var [txns, setTxns]         = useState([]);
  var [loading, setLoading]   = useState(false);
  var [openBal, setOpenBal]   = useState({});

  function loadSummary(yr) {
    setLoading(true);
    apiFetch('/api/cashbook-by-payment?year=' + yr)
      .then(function(r) { return r.json(); })
      .then(function(data) { setSummary(data); setLoading(false); })
      .catch(function() { setLoading(false); });
  }

  function loadTxns(yr, pm) {
    setLoading(true);
    apiFetch('/api/cashbook-transactions?year=' + yr + '&payment_method=' + encodeURIComponent(pm))
      .then(function(r) { return r.json(); })
      .then(function(data) { setTxns(data); setLoading(false); })
      .catch(function() { setLoading(false); });
  }

  useEffect(function() { loadSummary(year); }, [year]);

  useEffect(function() {
    if (view === 'detail') loadTxns(year, tab);
  }, [view, year, tab]);

  var acct = ACCOUNTS.find(function(a) { return a.key === tab; });

  /* ── Summary rows ── */
  var rows = [];
  var running = parseFloat(openBal[tab] || 0);
  for (var i = 0; i < 12; i++) {
    var m = summary[i];
    if (!m) { rows.push({ month: i + 1, out: 0, expenses: 0, dc: 0, balance: running }); continue; }
    var detail = m.pm_detail ? (m.pm_detail[tab] || { expenses: 0, dc: 0, total: 0 }) : { expenses: 0, dc: 0, total: 0 };
    running = running - detail.total;
    rows.push({ month: i + 1, out: detail.total, expenses: detail.expenses, dc: detail.dc, balance: running });
  }

  /* ── Detail rows with running balance ── */
  var detailRows = [];
  var bal = parseFloat(openBal[tab] || 0);
  for (var j = 0; j < txns.length; j++) {
    bal = bal - txns[j].amount;
    detailRows.push(Object.assign({}, txns[j], { balance: bal }));
  }

  /* ── All-accounts overview ── */
  var allTotals = ACCOUNTS.map(function(a) {
    var total = summary.reduce(function(s, m) {
      return s + (m.pm_detail && m.pm_detail[a.key] ? m.pm_detail[a.key].total : 0);
    }, 0);
    return { key: a.key, label: a.label, color: a.color, bg: a.bg, border: a.border, total: total };
  });
  var grandTotal = allTotals.reduce(function(s, a) { return s + a.total; }, 0);

  function switchTab(key) {
    setTab(key);
    if (view === 'detail') loadTxns(year, key);
  }

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", color: '#1e293b' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND, margin: 0 }}>Cash Book</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Account ledger by payment method — {year}</p>
        </div>
        <select value={year} onChange={function(e) { setYear(+e.target.value); }}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
        </select>
      </div>

      {/* Account summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 22 }}>
        {allTotals.map(function(a) {
          return (
            <div key={a.key} onClick={function() { switchTab(a.key); }}
              style={{ background: tab === a.key ? a.bg : '#fff', border: '2px solid ' + (tab === a.key ? a.border : '#e2e8f0'),
                borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tab === a.key ? a.color : '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{a.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: tab === a.key ? a.color : '#0f172a' }}>{fmt(a.total)}</div>
              <div style={{ fontSize: 11, color: tab === a.key ? a.color : '#94a3b8', marginTop: 3, opacity: 0.8 }}>Total outflow {year}</div>
            </div>
          );
        })}
      </div>

      {/* Account tabs + view toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {ACCOUNTS.map(function(a) {
            var active = tab === a.key;
            return (
              <button key={a.key} onClick={function() { switchTab(a.key); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1.5px solid ' + (active ? a.border : '#e2e8f0'),
                  background: active ? a.bg : '#fff', color: active ? a.color : '#64748b',
                  fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                {a.label}
              </button>
            );
          })}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', background: BRAND, borderRadius: 10, padding: 4, gap: 3, boxShadow: '0 2px 8px rgba(10,39,68,0.25)' }}>
          <button onClick={function() { setView('summary'); }}
            style={{ padding: '8px 18px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: view === 'summary' ? '#f9a825' : 'transparent',
              color: view === 'summary' ? '#0a2744' : 'rgba(255,255,255,0.6)',
              boxShadow: view === 'summary' ? '0 2px 6px rgba(249,168,37,0.4)' : 'none',
              letterSpacing: '0.2px', transition: 'all 0.15s' }}>
            📅 Monthly
          </button>
          <button onClick={function() { setView('detail'); }}
            style={{ padding: '8px 18px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: view === 'detail' ? '#f9a825' : 'transparent',
              color: view === 'detail' ? '#0a2744' : 'rgba(255,255,255,0.6)',
              boxShadow: view === 'detail' ? '0 2px 6px rgba(249,168,37,0.4)' : 'none',
              letterSpacing: '0.2px', transition: 'all 0.15s' }}>
            🧾 Transactions
          </button>
        </div>
      </div>

      {/* Opening balance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px',
        background: acct.bg, borderRadius: 10, border: '1px solid ' + acct.border }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: acct.color }}>Opening Balance ({acct.label}):</span>
        <input type="number" step="0.01" placeholder="0.00"
          value={openBal[tab] || ''}
          onChange={function(e) {
            var v = e.target.value;
            setOpenBal(function(prev) { var n = Object.assign({}, prev); n[tab] = v; return n; });
          }}
          style={{ padding: '6px 12px', border: '1px solid ' + acct.border, borderRadius: 7, fontSize: 13, width: 160,
            fontWeight: 600, color: acct.color, background: '#fff', outline: 'none' }} />
        <span style={{ fontSize: 12, color: acct.color, opacity: 0.7 }}>Enter opening balance before {year} if known</span>
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading…</div>
      ) : view === 'summary' ? (

        /* ── MONTHLY SUMMARY TABLE ── */
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: BRAND, color: '#fff' }}>
                <th style={th}>Month</th>
                <th style={{ ...th, textAlign: 'right' }}>Admin Expenses</th>
                <th style={{ ...th, textAlign: 'right' }}>Direct Costs</th>
                <th style={{ ...th, textAlign: 'right', background: 'rgba(255,255,255,0.12)' }}>Total Outflow</th>
                <th style={{ ...th, textAlign: 'right' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(function(r, i) {
                var hasData = r.out > 0;
                return (
                  <tr key={r.month} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={td2}><span style={{ fontWeight: 600 }}>{MN[r.month - 1]}</span></td>
                    <td style={{ ...td2, textAlign: 'right', color: hasData ? '#374151' : '#cbd5e1' }}>
                      {hasData ? fmt(r.expenses) : '—'}
                    </td>
                    <td style={{ ...td2, textAlign: 'right', color: hasData ? '#374151' : '#cbd5e1' }}>
                      {hasData ? fmt(r.dc) : '—'}
                    </td>
                    <td style={{ ...td2, textAlign: 'right', fontWeight: 700,
                      color: hasData ? acct.color : '#cbd5e1',
                      background: hasData ? acct.bg : 'transparent' }}>
                      {hasData ? fmt(r.out) : '—'}
                    </td>
                    <td style={{ ...td2, textAlign: 'right', fontWeight: 700,
                      color: r.balance >= 0 ? '#166534' : '#dc2626' }}>
                      {fmt(r.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: BRAND, color: '#fff' }}>
                <td style={{ ...td2, fontWeight: 800, fontSize: 12 }}>TOTAL {year}</td>
                <td style={{ ...td2, textAlign: 'right', fontWeight: 800 }}>{fmt(rows.reduce(function(s, r) { return s + r.expenses; }, 0))}</td>
                <td style={{ ...td2, textAlign: 'right', fontWeight: 800 }}>{fmt(rows.reduce(function(s, r) { return s + r.dc; }, 0))}</td>
                <td style={{ ...td2, textAlign: 'right', fontWeight: 800, background: 'rgba(255,255,255,0.12)' }}>{fmt(rows.reduce(function(s, r) { return s + r.out; }, 0))}</td>
                <td style={{ ...td2, textAlign: 'right', fontWeight: 800 }}>{fmt(rows[11] ? rows[11].balance : parseFloat(openBal[tab] || 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

      ) : (

        /* ── TRANSACTION DETAIL TABLE ── */
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {detailRows.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              No transactions found for {acct.label} in {year}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: BRAND, color: '#fff' }}>
                  <th style={th}>Month</th>
                  <th style={th}>Type</th>
                  <th style={th}>Category</th>
                  <th style={{ ...th, width: '35%' }}>Description</th>
                  <th style={{ ...th, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...th, textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map(function(r, i) {
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ ...td2, fontWeight: 600, whiteSpace: 'nowrap' }}>{MN[r.month - 1]}</td>
                      <td style={{ ...td2 }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                          background: r.source === 'Admin Expense' ? '#eff6ff' : '#fef3c7',
                          color:      r.source === 'Admin Expense' ? '#1d4ed8'  : '#92400e' }}>
                          {r.source}
                        </span>
                      </td>
                      <td style={{ ...td2, color: '#475569' }}>{r.category}</td>
                      <td style={{ ...td2, color: '#64748b', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={r.description}>{r.description || '—'}</td>
                      <td style={{ ...td2, textAlign: 'right', fontWeight: 700, color: acct.color, whiteSpace: 'nowrap' }}>
                        ({fmt(r.amount)})
                      </td>
                      <td style={{ ...td2, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap',
                        color: r.balance >= 0 ? '#166534' : '#dc2626' }}>
                        {fmt(r.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: BRAND, color: '#fff' }}>
                  <td colSpan={4} style={{ ...td2, fontWeight: 800, fontSize: 12 }}>
                    {detailRows.length} transactions — {acct.label} {year}
                  </td>
                  <td style={{ ...td2, textAlign: 'right', fontWeight: 800 }}>
                    ({fmt(detailRows.reduce(function(s, r) { return s + r.amount; }, 0))})
                  </td>
                  <td style={{ ...td2, textAlign: 'right', fontWeight: 800 }}>
                    {fmt(detailRows.length > 0 ? detailRows[detailRows.length - 1].balance : parseFloat(openBal[tab] || 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {/* All Accounts overview */}
      <div style={{ marginTop: 24, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: BRAND, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          All Accounts — {year} Overview
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {allTotals.map(function(a) {
            return (
              <div key={a.key} style={{ textAlign: 'center', padding: '12px 8px', background: a.bg, borderRadius: 8, border: '1px solid ' + a.border }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: a.color, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{a.label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: a.color }}>{fmt(a.total)}</div>
              </div>
            );
          })}
          <div style={{ textAlign: 'center', padding: '12px 8px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Grand Total</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: BRAND }}>{fmt(grandTotal)}</div>
          </div>
        </div>
      </div>

    </div>
  );
}

var th  = { padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, letterSpacing: '0.3px', whiteSpace: 'nowrap' };
var td2 = { padding: '11px 14px', color: '#374151' };
