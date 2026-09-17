# 🔧 Lanka Vehicle Service Centre — Management System

> A full-stack web application for managing day-to-day operations at a vehicle service center — built with **React**, **Node.js**, **Express**, and **MySQL**.

![System Preview](https://img.shields.io/badge/Status-Active-brightgreen)
![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Configuration](#-environment-configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [How to Use the System](#-how-to-use-the-system)
- [API Endpoints](#-api-endpoints)
- [Running on Another PC (Multi-location)](#-running-on-another-pc-multi-location)
- [Payment Gateway Setup](#-payment-gateway-setup)
- [Security Features](#-security-features)
- [Contributing](#-contributing)

---

## 🌟 Overview

Lanka Vehicle Service Centre Management System is a **production-grade, offline-capable** management tool designed specifically for Sri Lankan vehicle service workshops. It handles the full operational workflow — from registering a vehicle and recording services to assigning technicians, collecting payment, and generating instant receipts.

The system supports three vehicle types: **Cars**, **Motorcycles (Bikes)**, and **Three Wheelers**.

---

## ✨ Features

### 🏠 Dashboard
- Live summary cards: total vehicles, services performed today, revenue, and pending visits
- Recent activity feed showing the latest service visits

### 🚗 Vehicle Management
- Search vehicles instantly by number plate
- Register new vehicles with **smart Make/Model suggestions** tailored to Sri Lankan vehicles (Toyota, Bajaj, TVS, etc.)
- Edit vehicle details and owner information
- Full service history per vehicle

### ⚙️ Service Catalog (Admin)
- **54+ pre-loaded services** across 9 mechanical categories (Engine & Oil, Brakes, Battery & Electrical, Tires & Wheels, Suspension, Transmission, AC, Body & Cleaning, General Service)
- Filter services by vehicle type (Car / Bike / Three Wheeler)
- Admin-locked edit/add/delete for service items
- All prices are starting/approximate estimates — fully editable by admin

### 📋 New Visit
- Number plate lookup with instant vehicle recognition
- Multi-service booking per visit (add as many services as needed)
- Assign one or more technicians (employees) to each service line
- Vehicle photo capture and upload
- Running total calculation in real time

### 💳 Payment
- **Cash payment** — instant receipt
- **Online payment via PayHere** — supports Visa, Mastercard, AMEX, Google Pay, and local bank cards
- Server-side IPN signature verification (cryptographic MD5 hash)
- Automatic receipt generation after payment confirmation

### 🧾 Receipts
- Computer-generated receipts with full line-item breakdown
- Displays: vehicle plate, owner name, services, technicians, amounts, payment method, and transaction reference
- Downloadable PDF and browser print support

### 👥 Employees
- Add, edit, and manage workshop staff
- Assign employees to service visits during the booking flow

### 📊 Reports
- Revenue and visit analytics

---

## 💻 Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | React 19 + Vite 8, Vanilla CSS (dark theme)   |
| Backend     | Node.js 18+, Express.js 4                     |
| Database    | MySQL 8 with connection pooling (mysql2)       |
| PDF Engine  | PDFKit                                        |
| Payments    | PayHere JS SDK + IPN Webhook Verification     |
| Security    | Helmet, CORS, MD5 Hash, Rate Limiting         |
| Dev Tools   | Nodemon, Vite HMR, dotenv                     |

---

## 📁 Project Structure

```
vehical service mgt system/
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/                # API call functions (vehicles, services, visits…)
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page-level components (Dashboard, Vehicles, etc.)
│   │   ├── utils/              # Helpers: currency formatting, vehicle data, etc.
│   │   └── index.css           # Global dark theme design system
│   └── vite.config.js          # Vite config (dev proxy to backend)
│
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── controllers/        # Route handlers (vehicles, visits, payments, …)
│   │   ├── models/             # Database query models
│   │   ├── routes/             # Express router definitions
│   │   ├── modules/            # PayHere payment module
│   │   ├── middleware/         # Error handler, 404 handler
│   │   ├── db/                 # MySQL connection pool
│   │   └── utils/              # PDF generation, helpers
│   ├── uploads/                # Uploaded vehicle photos (auto-created)
│   ├── scripts/                # DB seed scripts
│   ├── tests/                  # Payment security test suite
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── migrations/                 # SQL migration files for database schema
│   ├── 001_initial_schema.sql
│   └── 002_add_vehicle_type_to_services.sql
│
└── README.md
```

---

## 📦 Prerequisites

Make sure the following are installed on your machine before proceeding:

| Tool         | Minimum Version | Download                         |
|--------------|-----------------|----------------------------------|
| Node.js      | 18.x or higher  | https://nodejs.org/              |
| npm          | 9.x or higher   | (included with Node.js)          |
| MySQL Server | 8.0+            | https://dev.mysql.com/downloads/ |
| Git          | any             | https://git-scm.com/             |

> 💡 **Tip:** XAMPP or WAMP is a convenient way to install MySQL on Windows if you don't have it already.  
> Download XAMPP: https://www.apachefriends.org/

---

## 🚀 Installation & Setup

### Step 1 — Clone the Repository

```bash
git clone https://github.com/ManushaAkilanka/vehicle-service-center.git
cd "vehicle-service-center"
```

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3 — Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 🔧 Environment Configuration

The backend requires an `.env` file with your database and payment credentials.

### Create the `.env` file:

```bash
cd backend
copy .env.example .env      # Windows
# OR
cp .env.example .env        # Mac / Linux
```

### Edit `backend/.env`:

```env
# ─── Server ────────────────────────────────────────────────────────────────────
PORT=3000

# ─── MySQL Database ─────────────────────────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=vehicle_service_db

# ─── Connection Pool ─────────────────────────────────────────────────────────────
DB_POOL_LIMIT=10

# ─── Shop Branding ───────────────────────────────────────────────────────────────
SHOP_NAME=Lanka Vehicle Service Centre
SHOP_ADDRESS=No. 45, Galle Road, Colombo 03, Sri Lanka
SHOP_PHONE=+94 11 234 5678
SHOP_EMAIL=service@lankavsc.lk

# ─── URLs (for PayHere return/notify URLs) ────────────────────────────────────────
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# ─── PayHere Payment Gateway (optional — Cash-only works without this) ────────────
PAYHERE_MERCHANT_ID=YOUR_PAYHERE_MERCHANT_ID
PAYHERE_MERCHANT_SECRET=YOUR_PAYHERE_MERCHANT_SECRET
PAYHERE_SANDBOX=true    # set to false for live payments
```

> ⚠️ **Never commit your `.env` file to GitHub.** It is already listed in `.gitignore`.

---

## 🗄️ Database Setup

### Step 1 — Start MySQL

Make sure your MySQL server is running (via XAMPP, WAMP, or as a system service).

### Step 2 — Run the Migration SQL Files

Open your MySQL client (phpMyAdmin, MySQL Workbench, or the MySQL CLI) and run the SQL files in order:

**Using MySQL CLI:**
```bash
mysql -u root -p < migrations/001_initial_schema.sql
mysql -u root -p < migrations/002_add_vehicle_type_to_services.sql
```

**Using phpMyAdmin:**
1. Open phpMyAdmin at `http://localhost/phpmyadmin`
2. Click **"New"** in the left sidebar → name the database **`vehicle_service_db`** → click **Create**
3. Select `vehicle_service_db` → click the **"Import"** tab
4. Upload and run `001_initial_schema.sql`, then `002_add_vehicle_type_to_services.sql`

### Step 3 — (Optional) Seed Demo Services

To populate the system with 54 pre-built Sri Lankan vehicle services:

```bash
cd backend
node scripts/seed_expanded_services.js
```

---

## ▶️ Running the Application

You need **two terminal windows** — one for the backend and one for the frontend.

### Terminal 1 — Start the Backend API

```bash
cd backend
npm start
```

You should see:
```
✅  Database connection pool is ready
🚀  Server listening on http://0.0.0.0:3000
    Health check → http://localhost:3000/api/health
```

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v8.x.x  ready

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Open in Browser

Navigate to: **http://localhost:5173**

---

## 📖 How to Use the System

### 1. 🏠 Dashboard
The home screen shows a live overview of your service center:
- Total registered vehicles
- Services performed and revenue for today
- Pending/unpaid visits

### 2. 🚗 Register a New Vehicle
1. Click **"Vehicles"** in the top navigation bar
2. Click **"＋ Register New Vehicle"** button
3. Fill in:
   - **Number Plate** (e.g., `WP CAA-1234`)
   - **Vehicle Type** (Car / Bike / Three Wheeler)
   - **Make** — start typing and select from the smart dropdown (e.g., Toyota, Bajaj)
   - **Model** — suggestions appear based on the selected Make
   - **Owner Name** and **Phone Number**
4. Click **"✅ Register Vehicle"**

> 💡 **Tip:** If you search for a plate that isn't registered yet, you'll see a "Register it →" shortcut button.

### 3. 📋 Create a New Service Visit
1. Click **"New Visit"** in the navigation bar
2. Search for a vehicle by number plate (e.g., `TI 6774`)
3. Select one or more services (filtered by the vehicle's type)
4. For each service, assign at least one technician from the **"Assign employees"** dropdown
5. (Optional) Capture or upload a vehicle photo
6. Review the **running total** at the bottom
7. Click **"✅ Submit Visit"**
8. A **Visit Summary Receipt** will appear — review it and click **"💳 Proceed to Payment"**

### 4. 💳 Complete Payment

#### Cash Payment:
- Select **"Cash"** tile → Click **"✅ Confirm Cash"**
- A receipt is generated instantly

#### Online Payment (PayHere):
- Select **"Online"** tile → Click **"💳 Pay via PayHere"**
- The PayHere secure popup appears
- For sandbox/demo testing, use these test cards:
  - **Visa:** `4916 2175 0161 1292`
  - **MasterCard:** `5307 7321 2553 1191`
  - Any future expiry (e.g. `12/28`) and any 3-digit CVV
- Receipt is auto-generated after server confirms payment

### 5. 🧾 Receipt
- The receipt shows the full service breakdown, assigned technicians, payment method, and transaction reference
- Click **"⬇️ Download PDF"** to save or **"🖨️ Print Receipt"** to print

### 6. ⚙️ Manage the Service Catalog
1. Click **"Services"** in the navigation bar
2. Filter by vehicle type using the tabs: **All / Bike / Car / Three Wheeler**
3. Click **"Admin Mode"** to unlock editing features:
   - **✏️ Edit** an existing service's name, price, category, or description
   - **🗑️ Delete** (deactivate) a service
   - **＋ Add Service** to add a completely new service
4. Click **"🔒 Lock"** to exit admin mode

### 7. 👥 Manage Employees
1. Click **"Employees"** in the navigation bar
2. Add new staff members with their name, phone, and role (Mechanic, Electrician, etc.)
3. Employees appear in the service assignment dropdown during New Visit creation

---

## 🌐 API Endpoints

The backend exposes a RESTful API at `http://localhost:3000/api/`.

| Method | Endpoint                          | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | `/api/health`                     | Health check                             |
| GET    | `/api/vehicles/:plate`            | Look up vehicle by number plate          |
| POST   | `/api/vehicles`                   | Register a new vehicle                   |
| PUT    | `/api/vehicles/:id`               | Update vehicle details                   |
| GET    | `/api/services`                   | List all active services                 |
| POST   | `/api/services`                   | Add a new service                        |
| PUT    | `/api/services/:id`               | Update service details                   |
| DELETE | `/api/services/:id`               | Deactivate a service                     |
| GET    | `/api/employees`                  | List all employees                       |
| POST   | `/api/employees`                  | Add a new employee                       |
| POST   | `/api/visits`                     | Create a new service visit               |
| GET    | `/api/visits/:id`                 | Get visit details                        |
| PATCH  | `/api/visits/:id/payment`         | Record cash payment                      |
| GET    | `/api/visits/:id/receipt`         | Download PDF receipt                     |
| POST   | `/api/payments/payhere/init`      | Initialize PayHere payment               |
| POST   | `/api/payments/payhere/notify`    | PayHere IPN webhook callback             |
| GET    | `/api/payments/by-order/:orderId` | Get visit by PayHere order ID            |
| GET    | `/api/payments/connectivity`      | Check internet/PayHere reachability      |
| GET    | `/api/dashboard/summary`          | Dashboard stats                          |
| GET    | `/api/reports`                    | Revenue and visit reports                |

---

## 🖥️ Running on Another PC (Multi-location)

This system can be deployed to any Windows/Mac/Linux PC at a different service center.

### Steps to Deploy on a New Machine:

1. **Transfer the code** — copy the project folder via USB drive, or clone from GitHub:
   ```bash
   git clone https://github.com/ManushaAkilanka/vehicle-service-center.git
   ```

2. **Install Node.js and MySQL** on the new PC

3. **Set up the database** — run the SQL migration files in MySQL (see [Database Setup](#-database-setup))

4. **Configure the `.env`** — set the new PC's MySQL credentials

5. **Install dependencies** — run `npm install` in both `backend/` and `frontend/`

6. **Start both servers** — `npm start` (backend) and `npm run dev` (frontend)

### 🌐 LAN / Workshop Wi-Fi Access

Because the Vite server is bound to `0.0.0.0`, any device on the **same Wi-Fi network** (tablet, laptop, phone) can access the system:

```
http://<SERVER_PC_IP_ADDRESS>:5173
```

For example: `http://192.168.1.100:5173`

> Find your PC's IP address:
> - **Windows:** Run `ipconfig` in Command Prompt — look for **IPv4 Address**
> - **Mac/Linux:** Run `ifconfig` or `ip a`

---

## 💰 Payment Gateway Setup

The system integrates with **PayHere** — Sri Lanka's most widely used payment gateway.

### To enable online payments:

1. Register at [https://www.payhere.lk](https://www.payhere.lk)
2. Go to the **PayHere Dashboard → Domains** and whitelist `localhost` (for testing) or your domain (for production)
3. Copy your **Merchant ID** and **Merchant Secret**
4. Add them to `backend/.env`:
   ```env
   PAYHERE_MERCHANT_ID=your_merchant_id
   PAYHERE_MERCHANT_SECRET=your_merchant_secret
   PAYHERE_SANDBOX=true      # set to false when going live
   ```
5. Restart the backend server

### Test Cards (Sandbox Mode):

| Card Type  | Number                |
|------------|-----------------------|
| Visa       | `4916 2175 0161 1292` |
| MasterCard | `5307 7321 2553 1191` |
| AMEX       | `3467 810055 10225`   |

Use any future expiry date and any 3-digit CVV.

> 💡 **Note:** The system works fully without PayHere configured — it will operate as **Cash-only** mode and the Online payment option will be automatically disabled.

---

## 🔐 Security Features

| Feature                          | Description                                                              |
|----------------------------------|--------------------------------------------------------------------------|
| **IPN Signature Verification**   | MD5 hash verified server-side before marking any payment as confirmed    |
| **Server-side Amount Validation**| Payment amount is always recomputed from the database, never trusted from client |
| **Rate Limiting**                | Prevents rapid double-click payment initiation (429 response)            |
| **Duplicate Payment Protection** | Idempotent IPN handling — duplicate callbacks are safely ignored         |
| **Helmet Security Headers**      | CSP, HSTS, X-Frame-Options, and 11 other HTTP security headers           |
| **Restricted CORS**              | API only accepts requests from the configured frontend origin            |
| **Credentials Never Exposed**    | `merchant_secret` lives only in `.env` (server-side), never sent to browser |
| **No Card Data Stored**          | Card processing is fully handled by PayHere's hosted modal               |

---

## 🧪 Running the Payment Security Test Suite

```bash
cd backend
node tests/payment_security.test.js
```

This runs 7 automated security tests:
1. Forged IPN signature is rejected
2. Tampered payment amount is blocked
3. Failed/cancelled payment does NOT mark visit as paid
4. Successful payment marks visit as paid with `"Online (Card)"`
5. Duplicate IPN callback is idempotent
6. Re-initiating a paid visit returns `409 ALREADY_PAID`
7. Rapid double-click returns `429 RATE_LIMITED`

---

## 🤝 Contributing

Contributions, ideas, and feedback are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add: your feature description"`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 👤 Author

**Manusha Akilanka**  
Undergraduate Student | Aspiring Full-Stack Developer  
🔗 [GitHub: ManushaAkilanka](https://github.com/ManushaAkilanka)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

> Built with ❤️ in Sri Lanka 🇱🇰
