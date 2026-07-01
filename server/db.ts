import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { getDbPath } from "./utils/paths";

// Load environment variables
dotenv.config();

const isPostgres = !!process.env.DATABASE_URL;

let dbSQLite: any = null;
let pgPool: Pool | null = null;

if (isPostgres) {
  console.log("Database Mode: PostgreSQL (Neon Cloud)");
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon secure connection
  });
} else {
  console.log("Database Mode: SQLite (Local)");
  // Dynamically require better-sqlite3-multiple-ciphers only when using SQLite.
  // This prevents Vercel serverless functions from failing due to missing native binary.
  const Database = eval("require")("better-sqlite3-multiple-ciphers");
  
  const dbPath = getDbPath();
  
  // Ensure target directory exists for new installs
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbSQLite = new Database(dbPath);

  // Database Encryption Configuration
  const DEFAULT_PASSWORD = "NagarERP_Secure_2026_@Locked";
  const DB_PASSWORD = process.env.DB_PASSWORD || DEFAULT_PASSWORD;

  function tryUnlock(password: string) {
    try {
      dbSQLite.pragma(`key = '${password}'`);
      // Try a simple query to see if we're actually unlocked
      dbSQLite.prepare("SELECT count(*) FROM sqlite_master").get();
      return true;
    } catch (err) {
      return false;
    }
  }

  // Check if file status before opening (for fresh installs to apply encryption)
  let isNewDb = false;
  try {
    if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
      isNewDb = true;
    }
  } catch (e) {
    isNewDb = true;
  }

  if (isNewDb) {
    console.log("Setting up encryption for new database...");
    dbSQLite.pragma(`key = '${DB_PASSWORD}'`);
  } else {
    if (tryUnlock(DB_PASSWORD)) {
      console.log("Database opened with encryption.");
    } else if (DB_PASSWORD !== DEFAULT_PASSWORD && tryUnlock(DEFAULT_PASSWORD)) {
      console.log("Migrating database password to the new one in .env...");
      dbSQLite.pragma(`rekey = '${DB_PASSWORD}'`);
    } else {
      // Check if it's currently unencrypted
      try {
        const checkDb = new Database(dbPath);
        try {
          checkDb.prepare("SELECT count(*) FROM sqlite_master").get();
          console.log("Existing database was unencrypted. Applying encryption...");
          checkDb.pragma(`rekey = '${DB_PASSWORD}'`);
          checkDb.close();
          dbSQLite.pragma(`key = '${DB_PASSWORD}'`);
        } catch (err) {
          checkDb.close();
          console.error("CRITICAL ERROR: DATABASE ENCRYPTION MISMATCH");
          process.exit(1);
        }
      } catch (err) {
        console.error("Failed to perform deep check on database:", err);
        process.exit(1);
      }
    }
  }

  dbSQLite.pragma("verbose = true");
  dbSQLite.pragma("foreign_keys = ON");
}

function convertSql(sql: string): string {
  if (!isPostgres) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

class SQLiteMutex {
  private queue = Promise.resolve();
  async run<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const promise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const current = this.queue;
    this.queue = current.then(() => promise);
    await current;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

const sqliteMutex = new SQLiteMutex();

export const db = {
  isPostgres,

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (isPostgres) {
      const res = await pgPool!.query(convertSql(sql), params);
      return res.rows;
    } else {
      return sqliteMutex.run(async () => {
        return dbSQLite.prepare(sql).all(...params);
      });
    }
  },

  async queryOne(sql: string, params: any[] = []): Promise<any> {
    if (isPostgres) {
      const res = await pgPool!.query(convertSql(sql), params);
      return res.rows[0] || null;
    } else {
      return sqliteMutex.run(async () => {
        return dbSQLite.prepare(sql).get(...params);
      });
    }
  },

  async execute(sql: string, params: any[] = []): Promise<{ lastInsertRowid: any; changes: number }> {
    if (isPostgres) {
      let modifiedSql = sql;
      const isInsert = modifiedSql.trim().toUpperCase().startsWith("INSERT ");
      if (isInsert && !modifiedSql.toUpperCase().includes("RETURNING")) {
        const isSettings = modifiedSql.toLowerCase().includes("into settings");
        if (!isSettings) {
          modifiedSql += " RETURNING id";
        }
      }
      const res = await pgPool!.query(convertSql(modifiedSql), params);
      const lastInsertRowid = isInsert && res.rows[0] ? res.rows[0].id : null;
      return { lastInsertRowid, changes: res.rowCount || 0 };
    } else {
      return sqliteMutex.run(async () => {
        const res = dbSQLite.prepare(sql).run(...params);
        return { lastInsertRowid: res.lastInsertRowid, changes: res.changes };
      });
    }
  },

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    if (isPostgres) {
      const client = await pgPool!.connect();
      try {
        await client.query("BEGIN");
        const tx = {
          query: (sql: string, params: any[] = []) => client.query(convertSql(sql), params).then(r => r.rows),
          queryOne: (sql: string, params: any[] = []) => client.query(convertSql(sql), params).then(r => r.rows[0] || null),
          execute: async (sql: string, params: any[] = []) => {
            let modifiedSql = sql;
            const isInsert = modifiedSql.trim().toUpperCase().startsWith("INSERT ");
            if (isInsert && !modifiedSql.toUpperCase().includes("RETURNING")) {
              const isSettings = modifiedSql.toLowerCase().includes("into settings");
              if (!isSettings) {
                modifiedSql += " RETURNING id";
              }
            }
            const res = await client.query(convertSql(modifiedSql), params);
            const lastInsertRowid = isInsert && res.rows[0] ? res.rows[0].id : null;
            return { lastInsertRowid, changes: res.rowCount || 0 };
          },
          transaction: (cb: any) => cb(tx),
        };
        const result = await callback(tx);
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } else {
      return sqliteMutex.run(async () => {
        dbSQLite.prepare("BEGIN").run();
        try {
          const tx = {
            query: async (sql: string, params: any[] = []) => dbSQLite.prepare(sql).all(...params),
            queryOne: async (sql: string, params: any[] = []) => dbSQLite.prepare(sql).get(...params),
            execute: async (sql: string, params: any[] = []) => {
              const res = dbSQLite.prepare(sql).run(...params);
              return { lastInsertRowid: res.lastInsertRowid, changes: res.changes };
            },
            transaction: (cb: any) => cb(tx),
          };
          const result = await callback(tx);
          dbSQLite.prepare("COMMIT").run();
          return result;
        } catch (e) {
          dbSQLite.prepare("ROLLBACK").run();
          throw e;
        }
      });
    }
  }
};

export async function initData() {
  if (isPostgres) {
    console.log("Initializing Postgres Database...");
    const client = await pgPool!.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role VARCHAR(50) CHECK(role IN ('admin', 'manager', 'user')) NOT NULL DEFAULT 'user',
          status VARCHAR(50) CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active'
        );
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          phone_1 TEXT NOT NULL,
          phone_2 TEXT,
          address TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL REFERENCES clients(id),
          title TEXT NOT NULL,
          description TEXT,
          status VARCHAR(50) CHECK(status IN ('Pending', 'Postponed', 'In Progress', 'Ready', 'Delivered', 'Cancelled')) DEFAULT 'Pending',
          completion_percent INTEGER DEFAULT 0 CHECK(completion_percent >= 0 AND completion_percent <= 100),
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          delivery_due_date TIMESTAMP,
          delivered_at TIMESTAMP,
          total_agreed_price REAL DEFAULT 0,
          deposit_paid REAL DEFAULT 0,
          middle_payment_agreed REAL DEFAULT 0,
          extra_costs REAL DEFAULT 0,
          final_payment_status VARCHAR(50) CHECK(final_payment_status IN ('Unpaid', 'Partial', 'Settled')) DEFAULT 'Unpaid'
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS subtasks (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          description TEXT NOT NULL,
          is_completed BOOLEAN DEFAULT false
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS safe (
          id SERIAL PRIMARY KEY,
          transaction_type VARCHAR(50) CHECK(transaction_type IN ('Income', 'Expense')) NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          related_id INTEGER,
          description TEXT,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          performed_by_id INTEGER REFERENCES users(id)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS purchases (
          id SERIAL PRIMARY KEY,
          supplier_name TEXT,
          item_name TEXT NOT NULL,
          quantity REAL DEFAULT 1,
          price_per_unit REAL DEFAULT 0,
          total_cost REAL DEFAULT 0,
          discount_received REAL DEFAULT 0,
          amount_paid_now REAL DEFAULT 0,
          amount_remaining REAL DEFAULT 0,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          performed_by_id INTEGER REFERENCES users(id)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS employees (
          id SERIAL PRIMARY KEY,
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
          start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) CHECK(status IN ('Active', 'Inactive', 'On Leave')) DEFAULT 'Active'
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          check_in TIMESTAMP,
          check_out TIMESTAMP,
          current_break_start TIMESTAMP,
          unpaid_break_minutes INTEGER DEFAULT 0,
          total_hours REAL DEFAULT 0,
          calculated_pay REAL DEFAULT 0
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS leaves (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          type VARCHAR(50) CHECK(type IN ('Sick', 'Vacation', 'Weekend', 'Unpaid')) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          is_paid BOOLEAN DEFAULT false
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS deductions (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          amount REAL NOT NULL,
          reason TEXT,
          date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS payroll (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          amount_paid REAL NOT NULL,
          payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          period_start DATE,
          period_end DATE,
          performed_by_id INTEGER REFERENCES users(id)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS quotations (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          quotation_number TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_amount REAL DEFAULT 0,
          discount REAL DEFAULT 0,
          status VARCHAR(50) CHECK(status IN ('Draft', 'Sent', 'Accepted', 'Rejected')) DEFAULT 'Draft'
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS quotation_items (
          id SERIAL PRIMARY KEY,
          quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
          item_name TEXT NOT NULL,
          description TEXT,
          image_path TEXT,
          meter_price REAL DEFAULT 0,
          unit_price REAL DEFAULT 0,
          quantity INTEGER DEFAULT 1,
          row_total REAL DEFAULT 0,
          sort_order INTEGER DEFAULT 0
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS task_payments (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          amount REAL NOT NULL,
          note TEXT,
          payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          performed_by_id INTEGER REFERENCES users(id)
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS settings (
          "key" VARCHAR(255) PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed Default Admin User if none exists
      const userRes = await client.query("SELECT COUNT(*) as count FROM users");
      const count = parseInt(userRes.rows[0].count);
      if (count === 0) {
        const defaultPassword = "admin";
        const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
        await client.query(
          "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
          ["admin", hashedPassword, "admin"]
        );
        console.log("Seeded default Postgres admin user: admin / admin");
      }
    } finally {
      client.release();
    }
  } else {
    // SQLite mode initialization
    const usersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'manager', 'user')) NOT NULL DEFAULT 'user',
        status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active'
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
        current_break_start DATETIME,
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

    const settingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Execute SQLite schema creations
    dbSQLite.exec(usersTable);
    dbSQLite.exec(clientsTable);
    dbSQLite.exec(tasksTable);
    dbSQLite.exec(subTasksTable);
    dbSQLite.exec(safeTable);
    dbSQLite.exec(purchasesTable);
    dbSQLite.exec(employeesTable);
    dbSQLite.exec(attendanceTable);
    dbSQLite.exec(leavesTable);
    dbSQLite.exec(deductionsTable);
    dbSQLite.exec(payrollTable);
    dbSQLite.exec(quotationsTable);
    dbSQLite.exec(quotationItemsTable);
    dbSQLite.exec(taskPaymentsTable);
    dbSQLite.exec(settingsTable);

    // SQLite Migrations
    try {
      const info = dbSQLite.prepare("PRAGMA table_info(users)").all() as any[];
      const hasStatus = info.some((col: any) => col.name === "status");
      if (!hasStatus) {
        dbSQLite.exec("ALTER TABLE users ADD COLUMN status TEXT CHECK(status IN ('Active', 'Inactive')) DEFAULT 'Active'");
        dbSQLite.exec("UPDATE users SET status = 'Active' WHERE status IS NULL");
      }
    } catch (err) {
      console.error("Failed to add status column:", err);
    }

    try {
      const info = dbSQLite.prepare("PRAGMA table_info(attendance)").all() as any[];
      const hasBreakStart = info.some((col: any) => col.name === "current_break_start");
      if (!hasBreakStart) {
        dbSQLite.exec("ALTER TABLE attendance ADD COLUMN current_break_start DATETIME");
      }
    } catch (err) {
      console.error("Failed to add current_break_start column:", err);
    }

    try {
      const tableInfo = dbSQLite.prepare("PRAGMA table_info(quotations)").all() as any[];
      const hasDiscount = tableInfo.some((col: any) => col.name === "discount");
      if (!hasDiscount) {
        dbSQLite.exec("ALTER TABLE quotations ADD COLUMN discount REAL DEFAULT 0");
      }
    } catch (err) {
      console.error("Failed to add discount column:", err);
    }

    try {
      const testStmt = dbSQLite.prepare("INSERT INTO users (username, password_hash, role) VALUES ('__test_migration__', 'x', 'manager')");
      dbSQLite.transaction(() => {
        testStmt.run();
        dbSQLite.prepare("DELETE FROM users WHERE username = '__test_migration__'").run();
      })();
    } catch (err: any) {
      if (err.message.includes("CHECK constraint failed")) {
        dbSQLite.transaction(() => {
          dbSQLite.exec("ALTER TABLE users RENAME TO users_old");
          dbSQLite.exec(usersTable);
          dbSQLite.exec("INSERT INTO users (id, username, password_hash, role) SELECT id, username, password_hash, role FROM users_old");
          dbSQLite.exec("DROP TABLE users_old");
        })();
      }
    }

    const tablesToUpdate = ["safe", "task_payments", "payroll", "purchases"];
    tablesToUpdate.forEach((tableName) => {
      try {
        const info = dbSQLite.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
        const hasPerformedBy = info.some((col: any) => col.name === "performed_by_id");
        if (!hasPerformedBy) {
          dbSQLite.exec(`ALTER TABLE ${tableName} ADD COLUMN performed_by_id INTEGER`);
        }
      } catch (err) {
        console.error(`Failed to add performed_by_id to ${tableName}:`, err);
      }
    });

    const userCount = (dbSQLite.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
    if (userCount === 0) {
      const defaultPassword = "admin";
      const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
      dbSQLite.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run("admin", hashedPassword, "admin");
      console.log("Seeded default SQLite admin user: admin / admin");
    }

    console.log("SQLite database initialized successfully.");
  }
}

export default db;
