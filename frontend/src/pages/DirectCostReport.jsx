import { apiFetch } from '../auth';
import { useEffect, useState } from 'react';
import { fmt, MONTHS, YEARS, CURRENT_YEAR, BRAND, ACCENT, DIRECT_COST_CATS } from '../utils';

export default function DirectCostReport() {
  const [rows, setRows] = useState([]);
  const [year, setYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    // No `month` param -> backend returns every month for the selected year
    apiFetch('/api/direct-costs?year=' + year).then(r => r.json()).then(setRows);
  }, [year]);

  // Build matrix: category → month → total
  function getAmt(cat, month) {
    return rows.filter(function(r) { return r.category === cat && r.month === month; })
               .reduce(function(s, r) { return s + r.amount; }, 0);
  }

  function monthTotal(month) {
    return rows.filter(function(r) { return r.month === month; })
               .reduce(function(s, r) { return s + r.amount; }, 0);
  }

  function catTotal(cat) {
    return rows.filter(function(r) { return r.category === cat; })
               .reduce(function(s, r) { return s + r.amount; }, 0);
  }

  var grandTotal = rows.reduce(function(s, r) { return s + r.amount; }, 0);

  // Standard categories + any custom categories present in the data, limited to those with activity
  var allCats = DIRECT_COST_CATS.concat(
    Array.from(new Set(rows.map(function(r) { return r.category; })))
      .filter(function(c) { return DIRECT_COST_CATS.indexOf(c) === -1; })
  );
  var activeCats = allCats.filter(function(cat) { return catTotal(cat) > 0; });

  function printReport() {
    var w = window.open('', '_blank');
    var rows_html = activeCats.map(function(cat) {
      var cells = MONTHS.map(function(_, i) {
        var amt = getAmt(cat, i + 1);
        return '<td>' + (amt > 0 ? Number(amt).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-') + '</td>';
      }).join('');
      var ct = catTotal(cat);
      return '<tr><td class="label">' + cat + '</td>' + cells + '<td class="rowtotal">' + Number(ct).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</td></tr>';
    }).join('');

    var totals_html = MONTHS.map(function(_, i) {
      var mt = monthTotal(i + 1);
      return '<td class="coltotal">' + (mt > 0 ? Number(mt).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-') + '</td>';
    }).join('');

    w.document.write('<!DOCTYPE html><html><head>' +
      '<title>Direct Cost Report ' + year + ' — Simba Media Ghana</title>' +
      '<style>' +
      'body{font-family:"Segoe UI",sans-serif;margin:0;padding:20px;color:#1e293b;font-size:11px}' +
      'h1{font-size:16px;color:#0a2744;margin:0 0 2px}' +
      '.sub{font-size:11px;color:#64748b;margin-bottom:14px}' +
      'table{width:100%;border-collapse:collapse}' +
      'th{background:#0a2744;color:#fff;padding:6px 8px;text-align:right;font-size:10px;white-space:nowrap}' +
      'th.lh{text-align:left}' +
      'td{padding:5px 8px;text-align:right;border-bottom:1px solid #f1f5f9;white-space:nowrap}' +
      'td.label{text-align:left;color:#374151}' +
      'tr:nth-child(even){background:#fafbfc}' +
      '.rowtotal{background:#f0f4f8;font-weight:700;color:#0a2744}' +
      '.coltotal{background:#0a2744;color:#fff;font-weight:700}' +
      '.grandtotal{background:#f9a825;color:#0a2744;font-weight:800}' +
      '@media print{@page{margin:10mm;size:landscape}}' +
      '</style></head><body>' +
      '<h1>Direct / Production Cost Report</h1>' +
      '<div class="sub">Simba Media Ghana Limited &nbsp;|&nbsp; Year: ' + year + ' &nbsp;|&nbsp; Generated: ' + new Date().toLocaleDateString('en-GH', {day:'numeric',month:'long',year:'numeric'}) + '</div>' +
      '<table><thead><tr>' +
      '<th class="lh" style="min-width:140px">Direct Costs</th>' +
      MONTHS.map(function(m) { return '<th>' + m.slice(0,3) + '</th>'; }).join('') +
      '<th>Total</th></tr></thead><tbody>' +
      rows_html +
      '</tbody><tfoot><tr>' +
      '<td class="coltotal" style="text-align:left">TOTAL</td>' +
      totals_html +
      '<td class="grandtotal">' + Number(grandTotal).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</td>' +
      '</tr></tfoot></table></body></html>');
    w.document.close();
    setTimeout(function() { w.print(); }, 400);
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#1e293b' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND, margin: 0 }}>Direct / Production Cost Report</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>Monthly breakdown by category — {year}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={year} onChange={function(e) { setYear(+e.target.value); }}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600, fontSize: 13 }}>
            {YEARS.map(function(y) { return <option key={y} value={y}>{y}</option>; })}
          </select>
          <button onClick={printReport} style={{ padding: '9px 20px', background: ACCENT, color: '#0a2744', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            🖨️ Print / Export
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        <KPI label="Annual Total"      value={fmt(grandTotal)} hi />
        <KPI label="Active Categories" value={activeCats.length} />
        <KPI label="Transactions"      value={rows.length} />
        <KPI label="Monthly Avg"       value={fmt(grandTotal / 12)} />
      </div>

      {/* Matrix table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'auto', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1100 }}>
          <thead>
            <tr style={{ background: BRAND, color: '#fff' }}>
              <th style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, position: 'sticky', left: 0, background: BRAND, minWidth: 160, zIndex: 2 }}>
                Direct Costs
              </th>
              {MONTHS.map(function(m) {
                return <th key={m} style={{ padding: '11px 8px', textAlign: 'right', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' }}>{m.slice(0,3)}</th>;
              })}
              <th style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 700, fontSize: 12, background: 'rgba(0,0,0,0.15)', whiteSpace: 'nowrap' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {activeCats.length === 0 ? (
              <tr><td colSpan={14} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No data for {year}</td></tr>
            ) : activeCats.map(function(cat, ci) {
              var ct = catTotal(cat);
              return (
                <tr key={cat} style={{ background: ci % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 14px', fontWeight: 500, color: '#374151', position: 'sticky', left: 0, background: ci % 2 === 0 ? '#fff' : '#fafbfc', zIndex: 1, borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    {cat}
                  </td>
                  {MONTHS.map(function(_, mi) {
                    var amt = getAmt(cat, mi + 1);
                    return (
                      <td key={mi} style={{ padding: '9px 8px', textAlign: 'right', color: amt > 0 ? '#0f172a' : '#cbd5e1', fontSize: 12 }}>
                        {amt > 0 ? Number(amt).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: BRAND, background: '#f0f4f8', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {Number(ct).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: BRAND, color: '#fff', fontWeight: 700 }}>
              <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: 12, position: 'sticky', left: 0, background: BRAND, zIndex: 1 }}>TOTAL</td>
              {MONTHS.map(function(_, mi) {
                var mt = monthTotal(mi + 1);
                return (
                  <td key={mi} style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, color: mt > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                    {mt > 0 ? Number(mt).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '-'}
                  </td>
                );
              })}
              <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, fontWeight: 800, background: ACCENT, color: '#0a2744', whiteSpace: 'nowrap' }}>
                {Number(grandTotal).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>
        Showing {activeCats.length} active categories · {rows.length} transactions · amounts in GHS
      </div>
    </div>
  );
}

function KPI({ label, value, hi }) {
  return (
    <div style={{ background: hi ? BRAND : '#fff', padding: '16px 18px', borderRadius: 12, border: hi ? 'none' : '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: hi ? 'rgba(255,255,255,0.6)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: hi ? '#fff' : '#0f172a' }}>{value}</div>
    </div>
  );
}
