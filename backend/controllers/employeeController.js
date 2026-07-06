const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

// GET /api/employees?search=&page=&limit=
async function getEmployees(req, res) {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const searchTerm = `%${search}%`;
    const [rows] = await pool.query(
      `SELECT * FROM employees
       WHERE name LIKE ? OR email LIKE ? OR department LIKE ? OR position LIKE ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm, Number(limit), offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM employees
       WHERE name LIKE ? OR email LIKE ? OR department LIKE ? OR position LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch employees', error: err.message });
  }
}

// GET /api/employees/:id
async function getEmployeeById(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch employee', error: err.message });
  }
}

// POST /api/employees
async function createEmployee(req, res) {
  try {
    const { name, email, phone, department, position, salary, joining_date, status } = req.body;
    if (!name || !department || !position) {
      return res.status(400).json({ message: 'Name, department and position are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO employees (name, email, phone, department, position, salary, joining_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, phone || null, department, position, salary || 0, joining_date || null, status || 'active']
    );

    await logActivity(`New employee added: ${name}`, 'employee');
    res.status(201).json({ id: result.insertId, message: 'Employee created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create employee', error: err.message });
  }
}

// PUT /api/employees/:id
async function updateEmployee(req, res) {
  try {
    const { name, email, phone, department, position, salary, joining_date, status } = req.body;
    const [existing] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Employee not found' });

    await pool.query(
      `UPDATE employees SET name=?, email=?, phone=?, department=?, position=?, salary=?, joining_date=?, status=?
       WHERE id=?`,
      [name, email, phone, department, position, salary, joining_date, status, req.params.id]
    );

    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update employee', error: err.message });
  }
}

// DELETE /api/employees/:id
async function deleteEmployee(req, res) {
  try {
    const [existing] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Employee not found' });

    await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete employee', error: err.message });
  }
}

module.exports = { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };
