-- ============================================
-- ERP SYSTEM - DATABASE SCHEMA (MySQL)
-- ============================================

mysql -h sql12.freesqldatabase.com -u sql12832357 -p jLfvvsvcek < backend/config/schema.sql

-- ---------------------------
-- USERS (login accounts)
-- ---------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- EMPLOYEES
-- ---------------------------
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(30),
  department VARCHAR(100),
  position VARCHAR(100),
  salary DECIMAL(12,2) DEFAULT 0,
  joining_date DATE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- CUSTOMERS
-- ---------------------------
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(30),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- SUPPLIERS
-- ---------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company_name VARCHAR(150),
  email VARCHAR(150),
  phone VARCHAR(30),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- CATEGORIES
-- ---------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- PRODUCTS
-- ---------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  category_id INT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(12,2) DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  unit VARCHAR(30) DEFAULT 'pcs',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- ---------------------------
-- INVENTORY (stock movement log)
-- ---------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  type ENUM('in', 'out') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  reference_type ENUM('purchase', 'sale', 'manual') DEFAULT 'manual',
  reference_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ---------------------------
-- SALES
-- ---------------------------
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_no VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
  sale_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------
-- SALE ITEMS
-- ---------------------------
CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ---------------------------
-- PURCHASES
-- ---------------------------
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_no VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('received', 'pending', 'cancelled') DEFAULT 'received',
  purchase_date DATE NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------
-- PURCHASE ITEMS
-- ---------------------------
CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ---------------------------
-- EXPENSES
-- ---------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------
-- COMPANY SETTINGS (single row)
-- ---------------------------
CREATE TABLE IF NOT EXISTS company_settings (
  id INT PRIMARY KEY DEFAULT 1,
  company_name VARCHAR(150) DEFAULT 'My Company Ltd.',
  address VARCHAR(255),
  phone VARCHAR(30),
  email VARCHAR(150),
  logo_url VARCHAR(255)
);

-- ---------------------------
-- ACTIVITY LOG (for dashboard "recent activities")
-- ---------------------------
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
