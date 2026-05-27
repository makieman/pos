# Salon Point of Sale (POS) System

An enterprise-grade, compliance-driven Point of Sale (POS) application designed specifically for modern salons and wellness centers. The system features a robust **Node.js/Express/MongoDB** backend paired with a high-performance **Angular 21** frontend utilizing Tailwind CSS and Google Material design paradigms.

This application is built with stringent financial controls, automated inventory ledger calculations, and comprehensive compliance auditing tools.

---

## 🚀 Key Features & Compliance Modules

The system is architected around 6 core compliance modules, fully verified by an interactive automated test suite:

### 1. Robust Authentication & Session Control (`Module 1`)
*   **Role-Based Pre-seeded Accounts**: Instant system access for tested personas (`Admin`, `Manager`, `Cashier`, `Accountant`, `Supervisor`, `Waiter`).
*   **Failed Login Lockouts**: Safeguard against brute-force attacks by locking user accounts for 15 minutes after 5 consecutive incorrect passwords.
*   **Simultaneous Device Warning**: Blocks concurrent sessions on multiple browsers. Logging into a second device instantly invalidates the first session with a `401 forceLogout` signal.
*   **Auto-Logout Idle Guard**: Client-side inactivity listeners detect 60 seconds of idle time and automatically trigger a secure logout and session destruction.

### 2. Fine-Grained Role-Based Access Control (RBAC) (`Module 2`)
*   **Admin Boundary**: Full operational permissions including user provisioning, global catalog edits, database seeding, and final financial reports.
*   **Manager & Cashier Ledger Boundaries**: Managers can initiate shift updates, edit inventory, and override lockouts. Cashiers are restricted to processing checkouts and clock logs.
*   **Accountant Restraint**: Accountants are granted comprehensive view-only access to all reports and audits but are strictly forbidden (`403 Forbidden`) from inserting, modifying, or deleting transactions.

### 3. Precision Checkout Mathematics (`Module 3`)
*   **16% VAT Tax Audit**: Automated split tax calculation applied specifically on taxable products while exempting services. Proportional cart discounts are applied cleanly prior to tax computation.
*   **Split Payments Ledger**: Supports multi-tender payment inputs (e.g., partial Cash + Card split payments) written as separate transaction rows in the database.
*   **Out-of-Stock Sales Guard**: Inventory counts are validated atomically during transaction processing. Depleted inventory throws a `400 Bad Request` and blocks the transaction before payment capture.

### 4. Rigid Shift Ledger & Float Management (`Module 4`)
*   **Active Shift Enforcement**: Prevents checkouts or transactions from being submitted unless an active shift has been explicitly opened with a float.
*   **Z-Report Ledger Audits**: Provides exact cash drawer reconciliations comparing starting float, active sales, refunds, voids, and ending cash totals.
*   **Daily Rollups**: Generates automated summaries of shift logs, total VAT collections, and transaction distributions.

### 5. Secure Refunds & Restocking (`Module 5`)
*   **Automated Restocking**: Refunding a transaction automatically increments product stock counts back to the live inventory collection.
*   **Void Rules**: Cashiers are restricted from issuing refunds. Voiding past-shift transactions requires a Supervisor or Manager credentials override.
*   **Audit Logging**: Every refund and void records the operator ID, timestamp, and compliance reason in a dedicated `AuditLog` collection.

### 6. Shifts & Attendance Ledger (`Module 6`)
*   **Time Clock Logs**: Full clock-in and clock-out logs with automated duration tracking.
*   **Commission Tracking**: Computes employee commissions automatically based on service sales and configured commission ratios (percentage or fixed rates).

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Angular v21 | Standalone components, signals, reactive forms, and server-side rendering (SSR). |
| **Styling** | Tailwind CSS & PostCSS | Sleek utility styling with modern responsive grids. |
| **Backend Framework** | Node.js / Express | Fast REST API routing, custom middleware layers, and security controls. |
| **Database** | MongoDB & Mongoose | Document database with transaction safety and relational schemas. |
| **Security** | JWT & BcryptJS | Signed session tokens and strongly encrypted passwords. |

---

## 📂 Project Structure

```text
pos/
├── backend/                   # Node.js/Express API Engine
│   ├── config/                # Database configurations & connections
│   ├── controllers/           # REST Route business logic
│   ├── middleware/            # JWT authorization and RBAC validation guards
│   ├── models/                # Mongoose database schemas
│   ├── routes/                # Endpoint definitions
│   ├── server.js              # Server entry point
│   └── package.json           # Backend dependencies and run scripts
│
├── frontend/                  # Angular 21 Single Page App
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # Reusable layouts, navigation, and sidebar panels
│   │   │   ├── context/       # Auth and state signals
│   │   │   ├── guards/        # Route protection based on authentication and RBAC roles
│   │   │   ├── models/        # TypeScript interfaces and structural models
│   │   │   ├── pages/         # Interactive views (Dashboard, Commissions, Inventory, Compliance)
│   │   │   └── services/      # Angular HTTP services matching backend routes
│   │   └── main.ts            # Frontend entry point
│   ├── angular.json           # Angular project workspace configuration
│   └── package.json           # Frontend dependencies and Tailwind build setups
```

---

## 🔧 Installation & Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB Instance (Local Community Edition or MongoDB Atlas cloud cluster)

### Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on your environment. Example configuration:
   ```ini
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/salon_pos?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```
4. Start the backend:
   ```bash
   # Production mode
   npm start
   
   # Development hot-reload mode
   npm run dev
   ```

### Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set the environment or proxy configurations. The frontend interacts directly with `http://localhost:5000/api` through its core `BaseApiService`.
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The Angular client will start running locally at `http://localhost:3000` (or `http://localhost:4200` depending on port parameters).*

---

## 🚥 Automated Compliance Matrix

The system includes a dedicated **Compliance & Release Readiness** utility dashboard. Located inside the client at `/compliance` and written in `frontend/src/app/pages/compliance.ts`, this panel allows managers or developers to trigger a **32-assertion real-time integration audit**.

Clicking **"Run Full Compliance Suite"** will dynamically:
1. Seed a temporary testing ledger in MongoDB via `POST /api/auth/seed`.
2. Generate active logins for all 6 personas, verifying token generation and authorization headers.
3. Stress test brute-force attempts and confirm that the account enters a `403 Forbidden` lockout state.
4. Execute simultaneous sessions to confirm the `401 forceLogout` session termination.
5. Simulate mock checkout items, applying 16% VAT mathematically on products while omitting services.
6. Verify stock updates on refund and void transactions.

Upon completion, a green **SYSTEM READY FOR PRODUCTION** verdict is rendered, ensuring the application matches every operational compliance standard.
