const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

async function getCustomers(req, res) {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const term = `%${search}%`;

    const [rows] = await pool.query(
      `SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [term, term, term, Number(limit), offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`,
      [term, term, term]
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customers', error: err.message });
  }
}

async function getCustomerById(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Customer not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch customer', error: err.message });
  }
}

async function createCustomer(req, res) {
  try {
    const { name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const [result] = await pool.query(
      `INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)`,
      [name, email || null, phone || null, address || null]
    );
    await logActivity(`New customer added: ${name}`, 'customer');
    res.status(201).json({ id: result.insertId, message: 'Customer created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create customer', error: err.message });
  }
}

async function updateCustomer(req, res) {
  try {
    const { name, email, phone, address } = req.body;
    const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Customer not found' });

    await pool.query(
      `UPDATE customers SET name=?, email=?, phone=?, address=? WHERE id=?`,
      [name, email, phone, address, req.params.id]
    );
    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update customer', error: err.message });
  }
}

async function deleteCustomer(req, res) {
  try {
    const [existing] = await pool.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Customer not found' });

    await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete customer', error: err.message });
  }
}

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };
