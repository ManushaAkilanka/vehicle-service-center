# Backend Setup Guide — Vehicle Service Management System

## Prerequisites
- **Node.js ≥ 18** — [nodejs.org](https://nodejs.org)
- **MySQL 8.0** running locally with `vehicle_service_db` already created
  (run `migrations/001_initial_schema.sql` if you haven't yet)

---

## Step 1 — Install dependencies

```powershell
cd "d:\vehical service mgt system\backend"
npm install
```

---

## Step 2 — Configure the environment

Open **`backend/.env`** and set your real MySQL password:

```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_ACTUAL_PASSWORD   ← change this
DB_NAME=vehicle_service_db

DB_POOL_LIMIT=10
```

> **Never commit `.env` to version control.** It is already listed in `.gitignore`.

---

## Step 3 — Start the development server

```powershell
npm run dev
```

You should see:

```
✅  Database connection pool is ready
🚀  Server listening on http://0.0.0.0:3000
    Health check → http://localhost:3000/api/health
```

---

## Step 4 — Verify the health-check endpoint

Open a browser or run in PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime_s": 3
}
```

---

## Step 5 — Test from another computer on the LAN

1. Find this machine's local IP address:
   ```powershell
   ipconfig
   ```
   Look for the **IPv4 Address** under your active adapter (e.g. `192.168.1.42`).

2. On the other computer, open a browser and go to:
   ```
   http://192.168.1.42:3000/api/health
   ```
   You should get the same JSON response.

> **Firewall note**: If the other machine cannot reach the endpoint, allow
> port 3000 inbound in Windows Defender Firewall:
> ```powershell
> # Run as Administrator
> netsh advfirewall firewall add rule name="Node Backend Port 3000" protocol=TCP dir=in localport=3000 action=allow
> ```

---

## Project Structure

```
backend/
├── .env                     ← your local credentials (gitignored)
├── .env.example             ← template committed to source control
├── .gitignore
├── package.json
└── src/
    ├── server.js            ← entry point — binds to 0.0.0.0:PORT
    ├── app.js               ← Express setup (middleware + routes)
    ├── db/
    │   └── pool.js          ← mysql2 promise pool singleton
    ├── routes/
    │   ├── health.routes.js
    │   ├── vehicles.routes.js   (stub — 501 until implemented)
    │   ├── employees.routes.js  (stub — 501 until implemented)
    │   ├── services.routes.js   (stub — 501 until implemented)
    │   └── visits.routes.js     (stub — 501 until implemented)
    ├── controllers/
    │   └── health.controller.js
    └── middleware/
        ├── errorHandler.js  ← global error handler (4-arg Express handler)
        └── notFound.js      ← 404 catcher (mounted after all routes)
```

---

## Available Scripts

| Command       | Description                                   |
|---------------|-----------------------------------------------|
| `npm run dev` | Start with nodemon (auto-restarts on changes) |
| `npm start`   | Start without nodemon (production-like)       |

---

## Available API Endpoints

| Method | Path              | Status        | Description              |
|--------|-------------------|---------------|--------------------------|
| GET    | `/api/health`     | ✅ Implemented | Server + DB health check |
| *      | `/api/vehicles`   | 🔜 Stub (501)  | Vehicle CRUD             |
| *      | `/api/employees`  | 🔜 Stub (501)  | Employee CRUD            |
| *      | `/api/services`   | 🔜 Stub (501)  | Service catalogue CRUD   |
| *      | `/api/visits`     | 🔜 Stub (501)  | Service visit CRUD       |
