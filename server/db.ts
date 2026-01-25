import Database from "better-sqlite3-multiple-ciphers";
import path from "path";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Ensure the db directory exists or just put it in root
const dbPath =
  process.env.DATABASE_PATH || path.resolve(__dirname, "../nagar.db");
console.log(`Initializing database at: ${dbPath}`);
const db = new Database(dbPath);

// Database Encryption Configuration
const DEFAULT_PASSWORD = "NagarERP_Secure_2026_@Locked";
const DB_PASSWORD = process.env.DB_PASSWORD || DEFAULT_PASSWORD;

function tryUnlock(password: string) {
  try {
    db.pragma(`key = '${password}'`);
    db.prepare("SELECT count(*) FROM sqlite_master").get();
    return true;
  } catch (err) {
    return false;
  }
}

if (tryUnlock(DB_PASSWORD)) {
  console.log("Database opened with encryption.");
} else if (DB_PASSWORD !== DEFAULT_PASSWORD && tryUnlock(DEFAULT_PASSWORD)) {
  console.log("Migrating database password to the new one in .env...");
  db.pragma(`rekey = '${DB_PASSWORD}'`);
  console.log("Database password updated successfully.");
} else {
  // Check if unencrypted
  try {
    // To check if unencrypted, we need a fresh connection or we can try to rekey a temporary one
    const unencryptedDb = new Database(dbPath);
    try {
      unencryptedDb.prepare("SELECT count(*) FROM sqlite_master").get();
      // If this works, it IS unencrypted
      unencryptedDb.pragma(`rekey = '${DB_PASSWORD}'`);
      unencryptedDb.close();
      db.pragma(`key = '${DB_PASSWORD}'`);
      console.log("Database was unencrypted. Encrypted with new password.");
    } catch (err) {
      unencryptedDb.close();
      console.error(
        "CRITICAL: Database is locked with an unknown password or is corrupted.",
      );
      process.exit(1);
    }
  } catch (err) {
    console.error("Failed to unlock or encrypt database:", err);
    process.exit(1);
  }
}

db.pragma("verbose = true"); // Enable logging after unlock if needed
// Enable foreign keys
db.pragma("foreign_keys = ON");

export function initData() {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'manager', 'user')) NOT NULL DEFAULT 'user'
    );
  `;

  const clientsTable = `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone_1 TEXT NOT NULL,
      phone_2 TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const tasksTable = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT CHECK(status IN ('Pending', 'Postponed', 'In Progress', 'Ready', 'Delivered', 'Cancelled')) DEFAULT 'Pending',
      completion_percent INTEGER DEFAULT 0 CHECK(completion_percent >= 0 AND completion_percent <= 100),
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivery_due_date DATETIME,
      delivered_at DATETIME,
      total_agreed_price REAL DEFAULT 0,
      deposit_paid REAL DEFAULT 0,
      middle_payment_agreed REAL DEFAULT 0,
      extra_costs REAL DEFAULT 0,
      final_payment_status TEXT CHECK(final_payment_status IN ('Unpaid', 'Partial', 'Settled')) DEFAULT 'Unpaid',
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `;

  const subTasksTable = `
    CREATE TABLE IF NOT EXISTS subtasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      is_completed BOOLEAN DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `;

  const safeTable = `
    CREATE TABLE IF NOT EXISTS safe (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_type TEXT CHECK(transaction_type IN ('Income', 'Expense')) NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      related_id INTEGER,
      description TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      performed_by_id INTEGER,
      FOREIGN KEY (performed_by_id) REFERENCES users(id)
    );
  `;

  const purchasesTable = `
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name TEXT,
      item_name TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      price_per_unit REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      discount_received REAL DEFAULT 0,
      amount_paid_now REAL DEFAULT 0,
      amount_remaining REAL DEFAULT 0,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      performed_by_id INTEGER,
      FOREIGN KEY (performed_by_id) REFERENCES users(id)
    );
  `;

  const employeesTable = `
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      national_id TEXT,
      address TEXT,
      phone_1 TEXT,
      phone_2 TEXT,
      relative_name TEXT,
      relative_phone TEXT,
      relative_relation TEXT,
      age INTEGER,
      role TEXT NOT NULL,
      hourly_rate REAL DEFAULT 0,
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('Active', 'Inactive', 'On Leave')) DEFAULT 'Active'
    );
  `;

  const attendanceTable = `
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date DATE NOT NULL,
      check_in DATETIME,
      check_out DATETIME,
      unpaid_break_minutes INTEGER DEFAULT 0,
      total_hours REAL DEFAULT 0,
      calculated_pay REAL DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `;

  const leavesTable = `
    CREATE TABLE IF NOT EXISTS leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('Sick', 'Vacation', 'Weekend', 'Unpaid')) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_paid BOOLEAN DEFAULT 0,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `;

  const deductionsTable = `
    CREATE TABLE IF NOT EXISTS deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );
  `;

  const payrollTable = `
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      amount_paid REAL NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      period_start DATE,
      period_end DATE,
      performed_by_id INTEGER,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by_id) REFERENCES users(id)
    );
  `;

  const quotationsTable = `
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      quotation_number TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      status TEXT CHECK(status IN ('Draft', 'Sent', 'Accepted', 'Rejected')) DEFAULT 'Draft',
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );
  `;

  const quotationItemsTable = `
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      description TEXT,
      image_path TEXT,
      meter_price REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      quantity INTEGER DEFAULT 1,
      row_total REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
    );
  `;

  const taskPaymentsTable = `
    CREATE TABLE IF NOT EXISTS task_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      note TEXT,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      performed_by_id INTEGER,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by_id) REFERENCES users(id)
    );
  `;

  // Execute Migrations
  db.exec(usersTable);
  db.exec(clientsTable);
  db.exec(tasksTable);
  db.exec(subTasksTable);
  db.exec(safeTable);
  db.exec(purchasesTable);
  db.exec(employeesTable);
  db.exec(attendanceTable);
  db.exec(leavesTable);
  db.exec(deductionsTable);
  db.exec(payrollTable);
  db.exec(quotationsTable);
  db.exec(quotationItemsTable);
  db.exec(taskPaymentsTable);

  // Migration: Add discount column to quotations if it doesn't exist
  const tableInfo = db.prepare("PRAGMA table_info(quotations)").all() as any[];
  const hasDiscount = tableInfo.some((col) => col.name === "discount");
  if (!hasDiscount) {
    try {
      db.exec("ALTER TABLE quotations ADD COLUMN discount REAL DEFAULT 0");
      console.log("Added discount column to quotations table.");
    } catch (err) {
      console.error("Failed to add discount column:", err);
    }
  }

  // Migration: Update users table role constraint (SQLite doesn't support ALTER TABLE for CHECK, need to recreate)
  try {
    const info = db.prepare("PRAGMA table_info(users)").all() as any[];
    // Check if it's the old schema (missing manager in check or something we can detect)
    // Actually, safest is to just try a dummy insert or check the current check constraint if possible
    // But PRAGMA table_info doesn't show CHECK.
    // We can check if we can insert 'manager'.
    try {
      const testStmt = db.prepare(
        "INSERT INTO users (username, password_hash, role) VALUES ('__test_migraton__', 'x', 'manager')",
      );
      db.transaction(() => {
        testStmt.run();
        db.prepare(
          "DELETE FROM users WHERE username = '__test_migraton__'",
        ).run();
      })();
    } catch (err: any) {
      if (err.message.includes("CHECK constraint failed")) {
        console.log(
          "Migration: Recreating users table to support 'manager' role...",
        );
        db.transaction(() => {
          db.exec("ALTER TABLE users RENAME TO users_old");
          db.exec(usersTable);
          db.exec(
            "INSERT INTO users (id, username, password_hash, role) SELECT id, username, password_hash, role FROM users_old",
          );
          db.exec("DROP TABLE users_old");
        })();
        console.log("Migration: Users table recreated successfully.");
      }
    }
  } catch (err) {
    console.error("Failed to migrate users table:", err);
  }

  // Migration: Update tables to add performed_by_id
  const tablesToUpdate = ["safe", "task_payments", "payroll", "purchases"];
  tablesToUpdate.forEach((tableName) => {
    try {
      const info = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
      const hasPerformedBy = info.some((col) => col.name === "performed_by_id");
      if (!hasPerformedBy) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN performed_by_id INTEGER`);
        console.log(`Added performed_by_id column to ${tableName} table.`);
      }
    } catch (err) {
      console.error(`Failed to add performed_by_id to ${tableName}:`, err);
    }
  });

  // Seed Default Admin User if none exists
  const userCount = (
    db.prepare("SELECT COUNT(*) as count FROM users").get() as any
  ).count;
  if (userCount === 0) {
    const defaultPassword = "admin";
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    db.prepare(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
    ).run("admin", hashedPassword, "admin");
    console.log("Seeded default admin user: admin / admin");
  }

  console.log("Database initialized successfully.");
}

export default db;
