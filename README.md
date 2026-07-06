# Nexus ERP — Enterprise Resource Planning System

A full-stack ERP system built as a college/portfolio project. Covers employees, customers,
suppliers, products, inventory, sales, purchases, expenses, reports, and a dashboard with
charts — all backed by a real MySQL database and a JWT-protected REST API.

## Tech Stack

**Frontend:** React 19 + Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide icons
**Backend:** Node.js + Express
**Database:** MySQL

## Project Structure

```
erp-system/
├── backend/
│   ├── config/          # DB connection, schema.sql, seed script
│   ├── controllers/     # Business logic for each resource
│   ├── middleware/       # JWT auth middleware
│   ├── routes/           # Express route definitions
│   ├── utils/            # Small shared helpers (activity logging)
│   └── server.js         # App entry point
└── frontend/
    └── src/
        ├── components/    # Reusable UI (DataTable, Modal, Button, etc.)
        ├── context/       # Auth + Toast global state
        ├── hooks/         # Small reusable hooks (debounce)
        ├── layouts/       # Sidebar, Navbar, MainLayout, ProtectedRoute
        ├── pages/         # One page per module
        └── services/      # Axios calls, grouped by resource
```

## Getting Started

### 1. Database Setup

You'll need MySQL installed and running locally.

```bash
mysql -u root -p < backend/config/schema.sql
```

This creates the `erp_system` database and all tables with their relationships.

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# edit .env and set your MySQL password + a JWT secret
npm install
npm run seed     # populates sample data + creates login accounts
npm run dev       # starts the API on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env    # defaults to http://localhost:5000/api, adjust if needed
npm install
npm run dev              # starts the app on http://localhost:5173
```

### 4. Login

Once seeded, you can sign in with:

- **Admin:** admin@erp.com / admin123
- **Staff:** staff@erp.com / staff123

## What's Included

- **Dashboard** — key metrics, low stock alerts, monthly sales chart, revenue vs. expense chart, recent activity feed
- **Employees** — full CRUD with search, department/position/salary tracking
- **Customers & Suppliers** — full CRUD with search
- **Products** — categories, pricing, stock levels, low-stock threshold, manual stock adjustments
- **Inventory** — current stock view + full movement history (in/out, tied to sales/purchases/manual adjustments)
- **Sales** — multi-line invoices with live total calculation, automatic stock deduction, printable invoice view
- **Purchases** — multi-line purchase entries, automatic stock increase
- **Expenses** — categorized expense tracking with a monthly report chart
- **Reports** — sales, purchases, inventory, employees, and expenses, each with summary cards and detail tables
- **Settings** — company info, profile view, change password, logout

## Notes on Scope

This was built for a student portfolio, not production. A few deliberate simplifications:

- JWT auth with no refresh tokens, email verification, or 2FA
- Two roles only (`admin` and `staff`) — no granular permission system
- Passwords are hashed with bcrypt but there's no rate limiting or lockout policy
- No automated tests — the codebase favors clarity and readability over full coverage

If you want to harden this for real use, the auth middleware and the transaction handling
in `saleController.js` / `productController.js` (stock updates) are the places to start.
