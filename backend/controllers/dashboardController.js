const pool = require('../config/db');

// GET /api/dashboard/summary
async function getSummary(req, res) {
  try {
    const [[employees]] = await pool.query('SELECT COUNT(*) as count FROM employees');
    const [[customers]] = await pool.query('SELECT COUNT(*) as count FROM customers');
    const [[suppliers]] = await pool.query('SELECT COUNT(*) as count FROM suppliers');
    const [[products]] = await pool.query('SELECT COUNT(*) as count FROM products');
    const [[sales]] = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as total FROM sales WHERE status != "cancelled"');
    const [[purchases]] = await pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount),0) as total FROM purchases WHERE status != "cancelled"');
    const [[expenses]] = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM expenses');
    const [[lowStock]] = await pool.query('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= low_stock_threshold');

    const revenue = Number(sales.total);
    const totalExpenses = Number(purchases.total) + Number(expenses.total);
    const netProfit = revenue - totalExpenses;

    res.json({
      totalEmployees: employees.count,
      totalCustomers: customers.count,
      totalSuppliers: suppliers.count,
      totalProducts: products.count,
      totalSales: sales.count,
      totalPurchases: purchases.count,
      totalRevenue: revenue,
      totalExpenses: totalExpenses,
      netProfit,
      lowStockCount: lowStock.count,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch dashboard summary', error: err.message });
  }
}

// GET /api/dashboard/monthly-sales?year=
async function getMonthlySales(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(sale_date, '%Y-%m') as month, COALESCE(SUM(total_amount),0) as total, COUNT(*) as count
       FROM sales
       WHERE YEAR(sale_date) = ? AND status != 'cancelled'
       GROUP BY month ORDER BY month ASC`,
      [year]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch monthly sales', error: err.message });
  }
}

// GET /api/dashboard/revenue-vs-expense?year=
async function getRevenueVsExpense(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const [salesRows] = await pool.query(
      `SELECT DATE_FORMAT(sale_date, '%Y-%m') as month, COALESCE(SUM(total_amount),0) as revenue
       FROM sales WHERE YEAR(sale_date) = ? AND status != 'cancelled' GROUP BY month`,
      [year]
    );
    const [purchaseRows] = await pool.query(
      `SELECT DATE_FORMAT(purchase_date, '%Y-%m') as month, COALESCE(SUM(total_amount),0) as purchases
       FROM purchases WHERE YEAR(purchase_date) = ? AND status != 'cancelled' GROUP BY month`,
      [year]
    );
    const [expenseRows] = await pool.query(
      `SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, COALESCE(SUM(amount),0) as expenses
       FROM expenses WHERE YEAR(expense_date) = ? GROUP BY month`,
      [year]
    );

    const map = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${year}-${String(m).padStart(2, '0')}`;
      map[key] = { month: key, revenue: 0, expenses: 0 };
    }
    salesRows.forEach((r) => { if (map[r.month]) map[r.month].revenue = Number(r.revenue); });
    purchaseRows.forEach((r) => { if (map[r.month]) map[r.month].expenses += Number(r.purchases); });
    expenseRows.forEach((r) => { if (map[r.month]) map[r.month].expenses += Number(r.expenses); });

    res.json(Object.values(map));
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch revenue vs expense data', error: err.message });
  }
}

// GET /api/dashboard/recent-activities
async function getRecentActivities(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch recent activities', error: err.message });
  }
}

module.exports = { getSummary, getMonthlySales, getRevenueVsExpense, getRecentActivities };
