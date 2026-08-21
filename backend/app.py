from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import secrets
import functools
from datetime import datetime

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')
CORS(app, supports_credentials=True)

# ─────────────────────────── AUTH ───────────────────────────────────────────
ADMIN_EMAIL    = 'admin@simbamedia.com'
ADMIN_PASSWORD = 'admin890'
VALID_TOKENS   = set()

def require_auth(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        token = auth.replace('Bearer ', '').strip()
        if not token or token not in VALID_TOKENS:
            return jsonify({'error': 'Unauthorized'}), 401
        return fn(*args, **kwargs)
    return wrapper

@app.route('/api/login', methods=['POST'])
def login():
    d = request.json or {}
    if d.get('email') == ADMIN_EMAIL and d.get('password') == ADMIN_PASSWORD:
        token = secrets.token_hex(32)
        VALID_TOKENS.add(token)
        return jsonify({'token': token})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    auth = request.headers.get('Authorization', '')
    token = auth.replace('Bearer ', '').strip()
    VALID_TOKENS.discard(token)
    return jsonify({'ok': True})

DB_PATH = os.path.join(os.path.dirname(__file__), 'database', 'simba.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cur = conn.cursor()

    # Revenue streams
    cur.execute("""
        CREATE TABLE IF NOT EXISTS revenue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Direct / production costs
    cur.execute("""
        CREATE TABLE IF NOT EXISTS direct_costs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            vendor_id INTEGER,
            amount REAL NOT NULL DEFAULT 0,
            payment_method TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Admin / overhead expenses
    cur.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            vendor_id INTEGER,
            amount REAL NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Fixed assets / capital items (one-time)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS fixed_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            purchase_date TEXT NOT NULL,
            cost REAL NOT NULL DEFAULT 0,
            useful_life_years INTEGER DEFAULT 5,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Vendors / suppliers
    cur.execute("""
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact TEXT,
            phone TEXT,
            email TEXT,
            service_type TEXT,
            notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    # Payments to vendors
    cur.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            amount REAL NOT NULL DEFAULT 0,
            description TEXT,
            payment_date TEXT,
            payment_method TEXT DEFAULT 'Bank Transfer',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (vendor_id) REFERENCES vendors(id)
        )
    """)

    # Taxes
    cur.execute("""
        CREATE TABLE IF NOT EXISTS taxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL DEFAULT 0,
            paye_expense_id INTEGER,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)

    conn.commit()

    # Migrations — add columns to existing tables if missing
    existing_dc = [r[1] for r in cur.execute("PRAGMA table_info(direct_costs)").fetchall()]
    if 'payment_method' not in existing_dc:
        cur.execute("ALTER TABLE direct_costs ADD COLUMN payment_method TEXT DEFAULT ''")

    existing_ex = [r[1] for r in cur.execute("PRAGMA table_info(expenses)").fetchall()]
    if 'payment_method' not in existing_ex:
        cur.execute("ALTER TABLE expenses ADD COLUMN payment_method TEXT DEFAULT ''")

    conn.commit()
    conn.close()

init_db()

# ─────────────────────────── SERVE REACT APP ────────────────────────────
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    dist = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
    if path and os.path.exists(os.path.join(dist, path)):
        return send_from_directory(dist, path)
    return send_from_directory(dist, 'index.html')

# ─────────────────────────── REVENUE ────────────────────────────────────
@app.route('/api/revenue', methods=['GET'])
@require_auth
def get_revenue():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    conn = get_db()
    q = "SELECT * FROM revenue WHERE 1=1"
    params = []
    if year: q += " AND year=?"; params.append(year)
    if month: q += " AND month=?"; params.append(month)
    q += " ORDER BY year DESC, month DESC, id DESC"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/revenue', methods=['POST'])
@require_auth
def add_revenue():
    d = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO revenue (year,month,category,description,amount) VALUES (?,?,?,?,?)",
        (d['year'], d['month'], d['category'], d.get('description',''), d['amount'])
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True}), 201

@app.route('/api/revenue/<int:rid>', methods=['PUT'])
@require_auth
def update_revenue(rid):
    d = request.json
    conn = get_db()
    conn.execute(
        "UPDATE revenue SET year=?,month=?,category=?,description=?,amount=? WHERE id=?",
        (d['year'], d['month'], d['category'], d.get('description',''), d['amount'], rid)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/revenue/<int:rid>', methods=['DELETE'])
@require_auth
def delete_revenue(rid):
    conn = get_db()
    conn.execute("DELETE FROM revenue WHERE id=?", (rid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─────────────────────────── DIRECT COSTS ────────────────────────────────
@app.route('/api/direct-costs', methods=['GET'])
@require_auth
def get_direct_costs():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    conn = get_db()
    q = "SELECT dc.*, v.name as vendor_name FROM direct_costs dc LEFT JOIN vendors v ON dc.vendor_id=v.id WHERE 1=1"
    params = []
    if year: q += " AND dc.year=?"; params.append(year)
    if month: q += " AND dc.month=?"; params.append(month)
    q += " ORDER BY dc.year DESC, dc.month DESC, dc.id DESC"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/direct-costs', methods=['POST'])
@require_auth
def add_direct_cost():
    d = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO direct_costs (year,month,category,description,vendor_id,amount,payment_method) VALUES (?,?,?,?,?,?,?)",
        (d['year'], d['month'], d['category'], d.get('description',''), d.get('vendor_id'), d['amount'], d.get('payment_method',''))
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True}), 201

@app.route('/api/direct-costs/<int:cid>', methods=['PUT'])
@require_auth
def update_direct_cost(cid):
    d = request.json
    conn = get_db()
    conn.execute(
        "UPDATE direct_costs SET year=?,month=?,category=?,description=?,vendor_id=?,amount=?,payment_method=? WHERE id=?",
        (d['year'], d['month'], d['category'], d.get('description',''), d.get('vendor_id'), d['amount'], d.get('payment_method',''), cid)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/direct-costs/<int:cid>', methods=['DELETE'])
@require_auth
def delete_direct_cost(cid):
    conn = get_db()
    conn.execute("DELETE FROM direct_costs WHERE id=?", (cid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─────────────────────────── EXPENSES ────────────────────────────────────
@app.route('/api/expenses', methods=['GET'])
@require_auth
def get_expenses():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    conn = get_db()
    q = "SELECT e.*, v.name as vendor_name FROM expenses e LEFT JOIN vendors v ON e.vendor_id=v.id WHERE 1=1"
    params = []
    if year: q += " AND e.year=?"; params.append(year)
    if month: q += " AND e.month=?"; params.append(month)
    q += " ORDER BY e.year DESC, e.month DESC, e.id DESC"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/expenses', methods=['POST'])
@require_auth
def add_expense():
    d = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO expenses (year,month,category,description,vendor_id,amount,payment_method) VALUES (?,?,?,?,?,?,?)",
        (d['year'], d['month'], d['category'], d.get('description',''), d.get('vendor_id'), d['amount'], d.get('payment_method',''))
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True}), 201

@app.route('/api/expenses/<int:eid>', methods=['PUT'])
@require_auth
def update_expense(eid):
    d = request.json
    conn = get_db()
    conn.execute(
        "UPDATE expenses SET year=?,month=?,category=?,description=?,vendor_id=?,amount=?,payment_method=? WHERE id=?",
        (d['year'], d['month'], d['category'], d.get('description',''), d.get('vendor_id'), d['amount'], d.get('payment_method',''), eid)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/expenses/<int:eid>', methods=['DELETE'])
@require_auth
def delete_expense(eid):
    conn = get_db()
    conn.execute("DELETE FROM expenses WHERE id=?", (eid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─────────────────────────── FIXED ASSETS ────────────────────────────────
@app.route('/api/fixed-assets', methods=['GET'])
@require_auth
def get_fixed_assets():
    conn = get_db()
    rows = conn.execute("SELECT * FROM fixed_assets ORDER BY purchase_date DESC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/fixed-assets', methods=['POST'])
@require_auth
def add_fixed_asset():
    d = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO fixed_assets (name,category,purchase_date,cost,useful_life_years,description) VALUES (?,?,?,?,?,?)",
        (d['name'], d['category'], d['purchase_date'], d['cost'], d.get('useful_life_years',5), d.get('description',''))
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True}), 201

@app.route('/api/fixed-assets/<int:aid>', methods=['PUT'])
@require_auth
def update_fixed_asset(aid):
    d = request.json
    conn = get_db()
    conn.execute(
        "UPDATE fixed_assets SET name=?,category=?,purchase_date=?,cost=?,useful_life_years=?,description=? WHERE id=?",
        (d['name'], d['category'], d['purchase_date'], d['cost'], d.get('useful_life_years',5), d.get('description',''), aid)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/fixed-assets/<int:aid>', methods=['DELETE'])
@require_auth
def delete_fixed_asset(aid):
    conn = get_db()
    conn.execute("DELETE FROM fixed_assets WHERE id=?", (aid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─────────────────────────── VENDORS ────────────────────────────────────
@app.route('/api/vendors', methods=['GET'])
@require_auth
def get_vendors():
    conn = get_db()
    rows = conn.execute("SELECT * FROM vendors ORDER BY name").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/vendors', methods=['POST'])
@require_auth
def add_vendor():
    d = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO vendors (name,contact,phone,email,service_type,notes) VALUES (?,?,?,?,?,?)",
        (d['name'], d.get('contact',''), d.get('phone',''), d.get('email',''), d.get('service_type',''), d.get('notes',''))
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True}), 201

@app.route('/api/vendors/<int:vid>', methods=['PUT'])
@require_auth
def update_vendor(vid):
    d = request.json
    conn = get_db()
    conn.execute(
        "UPDATE vendors SET name=?,contact=?,phone=?,email=?,service_type=?,notes=? WHERE id=?",
        (d['name'], d.get('contact',''), d.get('phone',''), d.get('email',''), d.get('service_type',''), d.get('notes',''), vid)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/vendors/<int:vid>', methods=['DELETE'])
@require_auth
def delete_vendor(vid):
    conn = get_db()
    conn.execute("DELETE FROM vendors WHERE id=?", (vid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─────────────────────────── PAYMENTS ────────────────────────────────────
@app.route('/api/payments', methods=['GET'])
@require_auth
def get_payments():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    vendor_id = request.args.get('vendor_id', type=int)
    conn = get_db()
    q = "SELECT p.*, v.name as vendor_name FROM payments p LEFT JOIN vendors v ON p.vendor_id=v.id WHERE 1=1"
    params = []
    if year: q += " AND p.year=?"; params.append(year)
    if month: q += " AND p.month=?"; params.append(month)
    if vendor_id: q += " AND p.vendor_id=?"; params.append(vendor_id)
    q += " ORDER BY p.year DESC, p.month DESC, p.id DESC"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/payments', methods=['POST'])
@require_auth
def add_payment():
    d = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO payments (vendor_id,year,month,amount,description,payment_date,payment_method) VALUES (?,?,?,?,?,?,?)",
        (d['vendor_id'], d['year'], d['month'], d['amount'], d.get('description',''), d.get('payment_date',''), d.get('payment_method','Bank Transfer'))
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True}), 201

@app.route('/api/payments/<int:pid>', methods=['PUT'])
@require_auth
def update_payment(pid):
    d = request.json
    conn = get_db()
    conn.execute(
        "UPDATE payments SET vendor_id=?,year=?,month=?,amount=?,description=?,payment_date=?,payment_method=? WHERE id=?",
        (d['vendor_id'], d['year'], d['month'], d['amount'], d.get('description',''), d.get('payment_date',''), d.get('payment_method','Bank Transfer'), pid)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/payments/<int:pid>', methods=['DELETE'])
@require_auth
def delete_payment(pid):
    conn = get_db()
    conn.execute("DELETE FROM payments WHERE id=?", (pid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─────────────────────────── TAXES ──────────────────────────────────────────
REVENUE_TAX_CATS = {'CST', 'VAT', 'NHIL', 'Withholding'}

@app.route('/api/taxes', methods=['GET'])
@require_auth
def get_taxes():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    conn = get_db()
    q = "SELECT * FROM taxes WHERE 1=1"
    params = []
    if year: q += " AND year=?"; params.append(year)
    if month: q += " AND month=?"; params.append(month)
    q += " ORDER BY year DESC, month DESC, id DESC"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/taxes', methods=['POST'])
@require_auth
def add_tax():
    d = request.json
    conn = get_db()
    paye_expense_id = None
    if d['category'] == 'PAYE':
        cur = conn.execute(
            "INSERT INTO expenses (year,month,category,description,amount) VALUES (?,?,?,?,?)",
            (d['year'], d['month'], 'Staff Cost', f"PAYE - {d.get('description','')}", d['amount'])
        )
        paye_expense_id = cur.lastrowid
    conn.execute(
        "INSERT INTO taxes (year,month,category,description,amount,paye_expense_id) VALUES (?,?,?,?,?,?)",
        (d['year'], d['month'], d['category'], d.get('description',''), d['amount'], paye_expense_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True}), 201

@app.route('/api/taxes/<int:tid>', methods=['PUT'])
@require_auth
def update_tax(tid):
    d = request.json
    conn = get_db()
    existing = conn.execute("SELECT * FROM taxes WHERE id=?", (tid,)).fetchone()
    if existing and existing['paye_expense_id']:
        conn.execute(
            "UPDATE expenses SET year=?,month=?,amount=?,description=? WHERE id=?",
            (d['year'], d['month'], d['amount'], f"PAYE - {d.get('description','')}", existing['paye_expense_id'])
        )
    conn.execute(
        "UPDATE taxes SET year=?,month=?,category=?,description=?,amount=? WHERE id=?",
        (d['year'], d['month'], d['category'], d.get('description',''), d['amount'], tid)
    )
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

@app.route('/api/taxes/<int:tid>', methods=['DELETE'])
@require_auth
def delete_tax(tid):
    conn = get_db()
    existing = conn.execute("SELECT * FROM taxes WHERE id=?", (tid,)).fetchone()
    if existing and existing['paye_expense_id']:
        conn.execute("DELETE FROM expenses WHERE id=?", (existing['paye_expense_id'],))
    conn.execute("DELETE FROM taxes WHERE id=?", (tid,))
    conn.commit()
    conn.close()
    return jsonify({'ok': True})

# ─────────────────────────── SUMMARY / P&L ────────────────────────────────
@app.route('/api/summary', methods=['GET'])
@require_auth
def get_summary():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    conn = get_db()
    params_filter = []
    year_filter = ""
    if year:
        year_filter += " AND year=?"
        params_filter.append(year)
    if month:
        year_filter += " AND month=?"
        params_filter.append(month)

    total_revenue = conn.execute(f"SELECT COALESCE(SUM(amount),0) FROM revenue WHERE 1=1{year_filter}", params_filter).fetchone()[0]
    total_direct = conn.execute(f"SELECT COALESCE(SUM(amount),0) FROM direct_costs WHERE 1=1{year_filter}", params_filter).fetchone()[0]
    total_expenses = conn.execute(f"SELECT COALESCE(SUM(amount),0) FROM expenses WHERE 1=1{year_filter}", params_filter).fetchone()[0]
    total_assets = conn.execute("SELECT COALESCE(SUM(cost),0) FROM fixed_assets").fetchone()[0]
    revenue_taxes = conn.execute(f"SELECT COALESCE(SUM(amount),0) FROM taxes WHERE category IN ('CST','VAT','NHIL','Withholding') AND 1=1{year_filter}", params_filter).fetchone()[0]
    corporate_tax = conn.execute(f"SELECT COALESCE(SUM(amount),0) FROM taxes WHERE category='Corporate Tax' AND 1=1{year_filter}", params_filter).fetchone()[0]

    net_revenue = total_revenue - revenue_taxes
    gross_profit = net_revenue - total_direct
    operating_profit = gross_profit - total_expenses
    net_profit = operating_profit - corporate_tax

    conn.close()
    return jsonify({
        'revenue': total_revenue,
        'revenue_taxes': revenue_taxes,
        'net_revenue': net_revenue,
        'direct_costs': total_direct,
        'gross_profit': gross_profit,
        'expenses': total_expenses,
        'operating_profit': operating_profit,
        'corporate_tax': corporate_tax,
        'net_profit': net_profit,
        'fixed_assets': total_assets,
    })

@app.route('/api/monthly-summary', methods=['GET'])
@require_auth
def get_monthly_summary():
    year = request.args.get('year', type=int, default=datetime.now().year)
    conn = get_db()
    months = range(1, 13)
    result = []
    for m in months:
        rev = conn.execute("SELECT COALESCE(SUM(amount),0) FROM revenue WHERE year=? AND month=?", (year, m)).fetchone()[0]
        dc = conn.execute("SELECT COALESCE(SUM(amount),0) FROM direct_costs WHERE year=? AND month=?", (year, m)).fetchone()[0]
        exp = conn.execute("SELECT COALESCE(SUM(amount),0) FROM expenses WHERE year=? AND month=?", (year, m)).fetchone()[0]
        rev_tax = conn.execute("SELECT COALESCE(SUM(amount),0) FROM taxes WHERE category IN ('CST','VAT','NHIL','Withholding') AND year=? AND month=?", (year, m)).fetchone()[0]
        corp_tax = conn.execute("SELECT COALESCE(SUM(amount),0) FROM taxes WHERE category='Corporate Tax' AND year=? AND month=?", (year, m)).fetchone()[0]
        net_rev = rev - rev_tax
        gross = net_rev - dc
        operating = gross - exp
        result.append({
            'month': m,
            'revenue': rev,
            'revenue_taxes': rev_tax,
            'net_revenue': net_rev,
            'direct_costs': dc,
            'gross_profit': gross,
            'expenses': exp,
            'operating_profit': operating,
            'corporate_tax': corp_tax,
            'net_profit': operating - corp_tax,
        })
    conn.close()
    return jsonify(result)

@app.route('/api/vendor-balances', methods=['GET'])
@require_auth
def vendor_balances():
    conn = get_db()
    rows = conn.execute("""
        SELECT v.id, v.name, v.service_type,
            COALESCE((SELECT SUM(amount) FROM direct_costs WHERE vendor_id=v.id), 0) as direct_costs_total,
            COALESCE((SELECT SUM(amount) FROM expenses WHERE vendor_id=v.id), 0) as expenses_total
        FROM vendors v
        ORDER BY (COALESCE((SELECT SUM(amount) FROM direct_costs WHERE vendor_id=v.id), 0) +
                  COALESCE((SELECT SUM(amount) FROM expenses WHERE vendor_id=v.id), 0)) DESC
    """).fetchall()
    conn.close()
    return jsonify([{
        'id': r['id'], 'name': r['name'], 'service_type': r['service_type'],
        'direct_costs': r['direct_costs_total'],
        'expenses': r['expenses_total'],
        'total': r['direct_costs_total'] + r['expenses_total']
    } for r in rows])

@app.route('/api/cashbook-by-payment', methods=['GET'])
@require_auth
def cashbook_by_payment():
    """
    Returns per-month totals for each payment method across expenses + direct_costs.
    Used by the Cash Book to split by Cash / Zenith Bank / MTN Momo.
    """
    year = request.args.get('year', type=int, default=datetime.now().year)
    pm   = request.args.get('payment_method', '')   # filter to one account; empty = all
    conn = get_db()
    result = []
    for m in range(1, 13):
        pm_filter = " AND payment_method=?" if pm else ""
        pm_params = [pm] if pm else []

        exp_out = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM expenses WHERE year=? AND month=?" + pm_filter,
            [year, m] + pm_params
        ).fetchone()[0]

        dc_out = conn.execute(
            "SELECT COALESCE(SUM(amount),0) FROM direct_costs WHERE year=? AND month=?" + pm_filter,
            [year, m] + pm_params
        ).fetchone()[0]

        # Per-payment-method breakdown (expenses + dc separately)
        pm_detail = {}
        for p in ['Cash', 'Zenith Bank', 'MTN Momo']:
            e = conn.execute(
                "SELECT COALESCE(SUM(amount),0) FROM expenses WHERE year=? AND month=? AND payment_method=?",
                (year, m, p)
            ).fetchone()[0]
            d = conn.execute(
                "SELECT COALESCE(SUM(amount),0) FROM direct_costs WHERE year=? AND month=? AND payment_method=?",
                (year, m, p)
            ).fetchone()[0]
            pm_detail[p] = {'expenses': e, 'dc': d, 'total': e + d}

        result.append({
            'month':      m,
            'pm_detail':  pm_detail,
        })
    conn.close()
    return jsonify(result)


@app.route('/api/cashbook-transactions', methods=['GET'])
@require_auth
def cashbook_transactions():
    """Individual transactions per payment method for the ledger detail view."""
    year = request.args.get('year', type=int, default=datetime.now().year)
    pm   = request.args.get('payment_method', '')
    conn = get_db()
    pm_filter = " AND payment_method=?" if pm else ""
    params    = [year] + ([pm] if pm else [])

    expenses = conn.execute(
        "SELECT month, category, description, amount FROM expenses "
        "WHERE year=?" + pm_filter + " ORDER BY month, id",
        params
    ).fetchall()

    dc = conn.execute(
        "SELECT month, category, description, amount FROM direct_costs "
        "WHERE year=?" + pm_filter + " ORDER BY month, id",
        params
    ).fetchall()

    rows = []
    for r in expenses:
        rows.append({'month': r[0], 'category': r[1], 'description': r[2] or '', 'amount': r[3], 'source': 'Admin Expense'})
    for r in dc:
        rows.append({'month': r[0], 'category': r[1], 'description': r[2] or '', 'amount': r[3], 'source': 'Direct Cost'})

    rows.sort(key=lambda x: x['month'])
    conn.close()
    return jsonify(rows)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
