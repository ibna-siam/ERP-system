const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

// GET /api/expenses?category=&month=&page=&limit=
async function getExpenses(req, res) {
  try {
    const { category = '', month = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = '1=1';
    const params = [];
    if (category) {
      where += ' AND category = ?';
      params.push(category);
    }
    if (month) {
      where += ' AND DATE_FORMAT(expense_date, "%Y-%m") = ?';
      params.push(month);
    }

    const [rows] = await pool.query(
      `SELECT * FROM expenses WHERE ${where} ORDER BY expense_date DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM expenses WHERE ${where}`, params);

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: err.message });
  }
}

async function createExpense(req, res) {
  try {
    const { title, category, amount, expense_date, notes } = req.body;
    if (!title || !category || !amount || !expense_date) {
      return res.status(400).json({ message: 'Title, category, amount, and date are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO expenses (title, category, amount, expense_date, notes) VALUES (?, ?, ?, ?, ?)`,
      [title, category, amount, expense_date, notes || null]
    );
    await logActivity(`New expense recorded: ${title} (৳${amount})`, 'expense');
    res.status(201).json({ id: result.insertId, message: 'Expense added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add expense', error: err.message });
  }
}

async function updateExpense(req, res) {
  try {
    const { title, category, amount, expense_date, notes } = req.body;
    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Expense not found' });

    await pool.query(
      `UPDATE expenses SET title=?, category=?, amount=?, expense_date=?, notes=? WHERE id=?`,
      [title, category, amount, expense_date, notes, req.params.id]
    );
    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update expense', error: err.message });
  }
}

async function deleteExpense(req, res) {
  try {
    const [existing] = await pool.query('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Expense not found' });

    await pool.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete expense', error: err.message });
  }
}

// GET /api/expenses/monthly-report?year=
async function getMonthlyExpenseReport(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(amount) as total
       FROM expenses
       WHERE YEAR(expense_date) = ?
       GROUP BY month ORDER BY month ASC`,
      [year]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch monthly report', error: err.message });
  }
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getMonthlyExpenseReport };
