# Simba Media Ghana — Server Reference Notes

## App Details
| Item | Value |
|------|-------|
| Server | 5.78.216.203 (same as Axum) |
| App URL | http://5.78.216.203:8080 |
| App Path (server) | /var/www/simba-media-ghana |
| Flask Port | 5001 |
| Nginx Port | 8080 |
| Database | /var/www/simba-media-ghana/backend/database/simba.db |
| Service Name | simba |

---

## SSH Login
```
ssh root@5.78.216.203
```

---

## First-Time Server Setup (run once)

```bash
# 1. Copy project to server
scp -r "C:\Users\HomePC\Documents\Claude\Projects\Simba Media Ghana" root@5.78.216.203:/var/www/simba-media-ghana

# 2. SSH into server
ssh root@5.78.216.203

# 3. Install Python dependencies
cd /var/www/simba-media-ghana/backend
pip3 install flask flask-cors

# 4. Install systemd service
cp /var/www/simba-media-ghana/simba.service /etc/systemd/system/simba.service
systemctl daemon-reload
systemctl enable simba
systemctl start simba

# 5. Install nginx config
cp /var/www/simba-media-ghana/nginx-simba.conf /etc/nginx/conf.d/simba.conf
nginx -t
systemctl reload nginx
```

---

## Build Frontend (run on Windows before deploying)
```
cd C:\Users\HomePC\Documents\Claude\Projects\Simba Media Ghana\frontend
npm install
npm run build
```

---

## Deploy Updates (after making changes)
1. Build frontend on Windows:
```
cd "C:\Users\HomePC\Documents\Claude\Projects\Simba Media Ghana\frontend"
npm run build
```

2. Copy updated files to server:
```
scp -r "C:\Users\HomePC\Documents\Claude\Projects\Simba Media Ghana\backend" root@5.78.216.203:/var/www/simba-media-ghana/
scp -r "C:\Users\HomePC\Documents\Claude\Projects\Simba Media Ghana\frontend\dist" root@5.78.216.203:/var/www/simba-media-ghana/frontend/
```

3. Restart service:
```
ssh root@5.78.216.203 "systemctl restart simba"
```

---

## Service Commands
```bash
systemctl start simba      # Start
systemctl stop simba       # Stop
systemctl restart simba    # Restart
systemctl status simba     # Check status
journalctl -u simba -f     # View live logs
```

---

## Database Backup
```bash
cp /var/www/simba-media-ghana/backend/database/simba.db /root/simba_backup_$(date +%Y%m%d).db
cp /var/www/simba-media-ghana/backend/database/simba.db-wal /root/simba_backup_$(date +%Y%m%d).db-wal
```
**Always backup BOTH .db and .db-wal files together!**

---

## Protect DB from being overwritten (if using git later)
```bash
git update-index --assume-unchanged backend/database/simba.db
git update-index --assume-unchanged backend/database/simba.db-wal
```

---

## App Pages
| Page | URL |
|------|-----|
| Dashboard | http://5.78.216.203:8080/ |
| Revenue | http://5.78.216.203:8080/revenue |
| Direct Costs | http://5.78.216.203:8080/direct-costs |
| Admin Expenses | http://5.78.216.203:8080/expenses |
| Fixed Assets | http://5.78.216.203:8080/fixed-assets |
| Vendors | http://5.78.216.203:8080/vendors |
| Payments | http://5.78.216.203:8080/payments |
| P&L Statement | http://5.78.216.203:8080/pnl |
| Balance Sheet | http://5.78.216.203:8080/balance-sheet |
