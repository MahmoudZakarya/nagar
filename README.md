# Nagar ERP (نجار) 🛠️

Nagar ERP is a secure, comprehensive Desktop Enterprise Resource Planning (ERP) application designed specifically for workshops, carpentry businesses, and service-based business models. It streamlines client management, tracks project progress, coordinates material purchases, manages employee payroll/attendance, automates quote generation, and guards financial logs (the Safe) under a localized, high-performance interface.

---

## 📖 Project Overview

Running a custom fabrication, workshop, or carpentry business involves juggling multiple operations—calculating custom quotes based on dimensions/materials, tracking multiple project phases, recording material costs, and processing daily employee check-ins and wage deductions. 

**Nagar ERP** solves these issues by uniting these workflows in a unified desktop client:
* **Who it is for**: Small-to-medium workshop owners, carpentry businesses, construction project coordinators, and manufacturing units.
* **The Core Problem it Solves**: Eliminates manual spreadsheets and disjointed tracking mechanisms by providing a secure, local, offline-capable database that synchronizes operations between sales, warehousing/purchasing, finance, and human resources.

---

## ✨ Key Features

### 👥 Client & Sales Management
* **Interactive Client Profiles**: Store client records, contact options, address fields, and complete activity history.
* **Transaction History**: Instantly view all projects, payments, and generated quotations associated with each client.
* **Quick Search**: Real-time customer indexing.

### 🔨 Project & Task Tracking
* **Project Lifecycle States**: Move projects dynamically through `Pending`, `In Progress`, `Ready`, `Delivered`, and `Cancelled` states.
* **Progress Tracking**: Track completion metrics (0-100%) and interactive subtask checklists.
* **Financial Ledger Sync**: Monitor total agreed price, deposit paid, middle payment milestones, extra expenses, and final settlement statuses.

### 💰 The Safe (الخزنة)
* **Cash Flow Log**: Track all income and expenses flowing in and out of the business's main vault.
* **Auto-Linkings**: Transactions originating from project payments, purchases, or payroll disbursements are automatically logged into the safe with audit logs.
* **Categorizations & Auditing**: Group cash movements and identify exact transaction performers.

### 🛒 Material Purchases
* **Warehouse Ledger**: Log material purchases containing supplier details, quantities, unit pricing, and discounts.
* **Creditor Monitoring**: Track current cash payments versus remaining balances owed to suppliers.

### 👷 Employee Management & Payroll
* **Detailed Employee Profiles**: Maintain records including national ID, roles, emergency contacts, status, and hourly rates.
* **Attendance System**: Digitized clock-in/out actions with configurable break durations and auto-calculated wages.
* **Leaves & Deductions**: Register vacation/sick leaves and process salary deductions.
* **Payroll Processing**: Periodical payroll payouts linked directly to the cash vault.

### 📄 Quotation Editor & Native PDF Export
* **Flexible Quotation Builder**: Create detailed cost estimations including unit prices, custom sizing, dimensions, sorting order, and design images.
* **Native Print API Integration**: Export beautifully rendered invoices and quotations directly to `.pdf` formats using Electron's native print engine.

### 🛡️ Local Encryption & Cloud Backups
* **SQLCipher Encryption**: The local SQLite database is encrypted at rest using `better-sqlite3-multiple-ciphers`.
* **Automated Google Cloud Storage Backups**: Periodically back up database files to GCS at scheduled intervals (configured via an integrated Express-cron scheduler).

---

## 🛠️ Tech Stack

The application is structured as a hybrid Desktop app using **Electron** for native shell interactions, **Express** for the database/REST controller backend, and **React** for the user interface.

### Frontend
* **React 19 & TypeScript**: Provides a robust, declarative component architecture.
* **Vite 7**: Ultra-fast build tool and bundler.
* **Tailwind CSS v4**: Modern CSS utility compilation with native design variables support.
* **React Router Dom 7**: Navigational routing configured with `HashRouter` to prevent relative asset mapping issues inside Electron's filesystem container.
* **Lucide React**: Clean vector icon toolkit.
* **Cairo Font**: Optimized, modern variable typography configured specifically for high-readability in Arabic and English UI layouts.

### Backend
* **Node.js & Express.js (v5)**: Lightweight REST API engine handling all controllers, database operations, and filesystems.
* **Node-Cron**: Runs in the background to handle daily scheduled backups.

### Database
* **SQLite (`better-sqlite3-multiple-ciphers`)**: Embedded relational database. Multiple Ciphers extension guarantees database-level encryption (`AES-256`) to safeguard internal payrolls, customer details, and cash balances.

### Desktop Wrapper & Build Tools
* **Electron (v40)**: Wraps the web bundle into an installer-ready desktop executable.
* **Electron Builder**: Compiles, packages, and produces production-ready desktop installers (`.exe`).
* **Concurrently & Wait-on**: Orchestrates startup dependencies in local development mode.

---

## 📁 Architecture & File Structure

```
nagar/
├── build/                 # Desktop build artifacts and icons
├── dist/                  # Compiled frontend assets (HTML, CSS, JS)
├── dist-electron/         # Compiled Electron main/preload scripts
├── dist-server/           # Compiled Express backend server
├── electron/              # Electron wrapper source code
│   ├── main.ts            # Bootstraps desktop wrapper & spawns Express backend process
│   ├── preload.ts         # Exposes native window APIs securely
│   └── tsconfig.json      # Electron compiler configurations
├── server/                # Node/Express API server source code
│   ├── config/            # Cloud storage & environment adapters
│   ├── controllers/       # Route controllers (clients, payroll, purchases, etc.)
│   ├── db.ts              # SQLite database configuration, encryption & migrations
│   ├── index.ts           # Express server bootstrap file & backup scheduler
│   ├── routes/            # REST API endpoints mapping
│   ├── services/          # Business logic services (automated back-up, PDF)
│   └── utils/             # Filesystem & system path helpers
├── src/                   # React frontend application
│   ├── assets/            # Embedded resources (Cairo fonts, logos, images)
│   ├── components/        # Reusable UI elements & layouts (Sidebar, Dialogs)
│   ├── context/           # Global states (Authentication & Theme wrappers)
│   ├── pages/             # App views (Dashboard, Employees, Purchases, Safe, etc.)
│   ├── App.tsx            # Routes configurations
│   └── index.css          # Tailwind imports & customized design system themes
├── package.json           # Scripts, dependencies, and builder options
├── tsconfig.json          # Global TypeScript configuration
└── vite.config.mts        # Vite bundling and client setup
```

---

## 🚀 Getting Started

Follow these instructions to set up the repository, install dependencies, and run the project locally.

### Prerequisites
* **Node.js** (v18.x or above recommended)
* **npm** (comes with Node.js)
* **Git**

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd nagar
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory. You can configure:
   ```env
   DB_PASSWORD=your_secure_database_encryption_password
   DATABASE_PATH=nagar.db
   BACKUP_SCHEDULE=0 3 * * *
   
   # Google Cloud Storage Backups (Optional)
   GCS_BUCKET_NAME=your-gcs-bucket-name
   GCS_PROJECT_ID=your-gcs-project-id
   GCS_KEY_FILE=path-to-gcs-service-account-key.json
   ```

### Running Locally

To run the application in development mode, run:
```bash
npm run dev
```
This command triggers `concurrently` to:
1. Start the Vite React development server on `http://localhost:5173`.
2. Wait for the server to load, then compile the Electron processes and open the desktop application interface.

### Seeding & Default Credentials

On initial startup, the database is auto-created, encrypted, and migrated. A default administrator account is seeded. Use the following credentials to log in:
* **Username**: `admin`
* **Password**: `admin`

> [!IMPORTANT]
> Immediately change the default admin password from the user settings dropdown inside the sidebar for security reasons.

---

## 📦 Packaging & Building

To bundle the application and generate a local installer (specifically for Windows configurations):

1. **Build the production package**:
   ```bash
   npm run build
   ```
   This script triggers the typescript compiler (`tsc`), compiles server-side dependencies, rebuilds local SQLite bindings targeting Electron's ABI versions (`electron-rebuild`), compiles Vite client bundles, and runs `electron-builder` to package everything.

2. **Locate the installer**:
   Once execution finishes, navigate to `dist-installer/` to access the generated executable installer (`.exe`).

---

## 🔒 Security & Backups Configuration

### Database Encryption
The application initializes SQLite database encryption transparently. If a password mismatch is detected, the database locks execution to protect sensitive details. 

### Google Cloud Storage Backups
Automated cloud backups can be configured inside the application settings panel:
1. Navigate to the **النسخ الاحتياطي** (Backup Settings) page (visible only to Administrator roles).
2. Save GCS settings (**Project ID**, **Bucket Name**).
3. Upload the Google service account `.json` credential key.
4. The backend stores the credentials securely and schedules an automated snapshot export daily at `03:00 AM`.

---

## 🌐 Localization & Design System

* **Bilingual UI / Typography**: Font rendering relies on the premium `Cairo` typography system, ensuring text alignment matches RTL (Right-to-Left) constraints.
* **Active Themes**: Supports seamless real-time switching between Light and Dark mode.
* **Branding Colors**: Matches workshop aesthetics using a primary dark/amber palette (`--main-color: #000000`, `--secondary-color: #faa70d`).
