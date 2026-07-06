const pool = require('../config/db');

// GET /api/reports/sales?start_date=&end_date=
async function getSalesReport(req, res) {
  try {
    const { start_date, end_date } = req.query;
    let where = "s.status != 'cancelled'";
    const params = [];

    if (start_date && end_date) {
      where += ' AND s.sale_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.invoice_no, s.sale_date, s.total_amount, s.status, c.name as customer_name
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       WHERE ${where} ORDER BY s.sale_date DESC`,
      params
    );

    const [[summary]] = await pool.query(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount),0) as total_revenue
       FROM sales s WHERE ${where}`,
      params
    );

    res.json({ summary, rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate sales report', error: err.message });
  }
}

// GET /api/reports/purchases?start_date=&end_date=
async function getPurchaseReport(req, res) {
  try {
    const { start_date, end_date } = req.query;
    let where = "p.status != 'cancelled'";
    const params = [];

    if (start_date && end_date) {
      where += ' AND p.purchase_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.purchase_no, p.purchase_date, p.total_amount, p.status, s.name as supplier_name
       FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE ${where} ORDER BY p.purchase_date DESC`,
      params
    );

    const [[summary]] = await pool.query(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount),0) as total_spent
       FROM purchases p WHERE ${where}`,
      params
    );

    res.json({ summary, rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate purchase report', error: err.message });
  }
}

// GET /api/reports/inventory
async function getInventoryReport(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.sku, c.name as category_name, p.stock_quantity, p.low_stock_threshold,
              p.price, p.cost_price, (p.stock_quantity * p.cost_price) as stock_value
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.name ASC`
    );

    const [[summary]] = await pool.query(
      `SELECT COUNT(*) as total_products, COALESCE(SUM(stock_quantity * cost_price),0) as total_stock_value,
              SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_items
       FROM products`
    );

    res.json({ summary, rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate inventory report', error: err.message });
  }
}

// GET /api/reports/employees
async function getEmployeeReport(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, department, position, salary, joining_date, status FROM employees ORDER BY department, name`
    );

    const [[summary]] = await pool.query(
      `SELECT COUNT(*) as total_employees, COALESCE(SUM(salary),0) as total_payroll,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
       FROM employees`
    );

    const [byDept] = await pool.query(
      `SELECT department, COUNT(*) as count, COALESCE(SUM(salary),0) as total_salary
       FROM employees GROUP BY department`
    );

    res.json({ summary, byDepartment: byDept, rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate employee report', error: err.message });
  }
}

// GET /api/reports/expenses?start_date=&end_date=
async function getExpenseReport(req, res) {
  try {
    const { start_date, end_date } = req.query;
    let where = '1=1';
    const params = [];

    if (start_date && end_date) {
      where += ' AND expense_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    const [rows] = await pool.query(
      `SELECT * FROM expenses WHERE ${where} ORDER BY expense_date DESC`,
      params
    );

    const [byCategory] = await pool.query(
      `SELECT category, COALESCE(SUM(amount),0) as total FROM expenses WHERE ${where} GROUP BY category`,
      params
    );

    const [[summary]] = await pool.query(
      `SELECT COUNT(*) as total_entries, COALESCE(SUM(amount),0) as total_amount FROM expenses WHERE ${where}`,
      params
    );

    res.json({ summary, byCategory, rows });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate expense report', error: err.message });
  }
}

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getEmployeeReport,
  getExpenseReport,
};
