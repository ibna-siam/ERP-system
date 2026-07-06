// Seeds the database with an admin user, a staff user, and sample records
// Run with: npm run seed

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function seed() {
  try {
    console.log('Seeding database...');

    // --- Users ---
    const adminPass = await bcrypt.hash('admin123', 10);
    const staffPass = await bcrypt.hash('staff123', 10);

    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      ['Admin User', 'admin@erp.com', adminPass]
    );
    await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'staff')
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      ['Staff User', 'staff@erp.com', staffPass]
    );

    // --- Company settings ---
    await pool.query(
      `INSERT INTO company_settings (id, company_name, address, phone, email)
       VALUES (1, 'Nexus Trading Co.', 'House 12, Road 5, Dhaka, Bangladesh', '+880 1700-000000', 'info@nexustrading.com')
       ON DUPLICATE KEY UPDATE company_name = VALUES(company_name)`
    );

    // --- Categories ---
    const categories = ['Electronics', 'Office Supplies', 'Furniture', 'Groceries'];
    for (const name of categories) {
      await pool.query(
        `INSERT INTO categories (name, description) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [name, `${name} category`]
      );
    }
    const [catRows] = await pool.query('SELECT id, name FROM categories');
    const catMap = Object.fromEntries(catRows.map((c) => [c.name, c.id]));

    // --- Products ---
    const products = [
      ['Wireless Mouse', 'ELEC-001', catMap['Electronics'], 850, 500, 45, 10, 'pcs'],
      ['Mechanical Keyboard', 'ELEC-002', catMap['Electronics'], 3200, 2200, 20, 5, 'pcs'],
      ['A4 Paper Ream', 'OFF-001', catMap['Office Supplies'], 350, 220, 8, 15, 'ream'],
      ['Office Chair', 'FUR-001', catMap['Furniture'], 8500, 6000, 12, 5, 'pcs'],
      ['Executive Desk', 'FUR-002', catMap['Furniture'], 15000, 11000, 4, 3, 'pcs'],
      ['Rice (25kg bag)', 'GRO-001', catMap['Groceries'], 1800, 1500, 30, 10, 'bag'],
      ['Ballpoint Pen (box)', 'OFF-002', catMap['Office Supplies'], 120, 70, 60, 20, 'box'],
    ];
    for (const p of products) {
      await pool.query(
        `INSERT INTO products (name, sku, category_id, price, cost_price, stock_quantity, low_stock_threshold, unit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        p
      );
    }

    // --- Customers ---
    const customers = [
      ['Rahim Uddin', 'rahim@example.com', '01711000001', 'Mirpur, Dhaka'],
      ['Karim Store', 'karim@example.com', '01711000002', 'Gulshan, Dhaka'],
      ['Fatema Enterprise', 'fatema@example.com', '01711000003', 'Chattogram'],
    ];
    for (const c of customers) {
      await pool.query(
        `INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)`,
        c
      );
    }

    // --- Suppliers ---
    const suppliers = [
      ['Jamal Hossain', 'ABC Traders', 'abc@example.com', '01811000001', 'Motijheel, Dhaka'],
      ['Nasrin Akter', 'Global Supplies Ltd.', 'global@example.com', '01811000002', 'Khulna'],
    ];
    for (const s of suppliers) {
      await pool.query(
        `INSERT INTO suppliers (name, company_name, email, phone, address) VALUES (?, ?, ?, ?, ?)`,
        s
      );
    }

    // --- Employees ---
    const employees = [
      ['Sadia Islam', 'sadia@erp.com', '01611000001', 'Sales', 'Sales Executive', 35000, '2023-02-01'],
      ['Tanvir Ahmed', 'tanvir@erp.com', '01611000002', 'Accounts', 'Accountant', 42000, '2022-08-15'],
      ['Nusrat Jahan', 'nusrat@erp.com', '01611000003', 'Warehouse', 'Inventory Officer', 30000, '2023-11-10'],
    ];
    for (const e of employees) {
      await pool.query(
        `INSERT INTO employees (name, email, phone, department, position, salary, joining_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        e
      );
    }

    // --- Expenses ---
    const expenses = [
      ['Office Rent - June', 'Rent', 25000, '2026-06-05'],
      ['Electricity Bill', 'Utilities', 6500, '2026-06-10'],
      ['Internet Bill', 'Utilities', 2500, '2026-06-10'],
      ['Staff Refreshments', 'Miscellaneous', 3200, '2026-06-20'],
    ];
    for (const ex of expenses) {
      await pool.query(
        `INSERT INTO expenses (title, category, amount, expense_date) VALUES (?, ?, ?, ?)`,
        ex
      );
    }

    console.log('Seeding complete.');
    console.log('Login with: admin@erp.com / admin123  (or staff@erp.com / staff123)');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
