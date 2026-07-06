const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

async function getSuppliers(req, res) {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const term = `%${search}%`;

    const [rows] = await pool.query(
      `SELECT * FROM suppliers WHERE name LIKE ? OR company_name LIKE ? OR email LIKE ? OR phone LIKE ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [term, term, term, term, Number(limit), offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM suppliers WHERE name LIKE ? OR company_name LIKE ? OR email LIKE ? OR phone LIKE ?`,
      [term, term, term, term]
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch suppliers', error: err.message });
  }
}

async function getSupplierById(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Supplier not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch supplier', error: err.message });
  }
}

async function createSupplier(req, res) {
  try {
    const { name, company_name, email, phone, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const [result] = await pool.query(
      `INSERT INTO suppliers (name, company_name, email, phone, address) VALUES (?, ?, ?, ?, ?)`,
      [name, company_name || null, email || null, phone || null, address || null]
    );
    await logActivity(`New supplier added: ${name}`, 'supplier');
    res.status(201).json({ id: result.insertId, message: 'Supplier created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create supplier', error: err.message });
  }
}

async function updateSupplier(req, res) {
  try {
    const { name, company_name, email, phone, address } = req.body;
    const [existing] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Supplier not found' });

    await pool.query(
      `UPDATE suppliers SET name=?, company_name=?, email=?, phone=?, address=? WHERE id=?`,
      [name, company_name, email, phone, address, req.params.id]
    );
    res.json({ message: 'Supplier updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update supplier', error: err.message });
  }
}

async function deleteSupplier(req, res) {
  try {
    const [existing] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Supplier not found' });

    await pool.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete supplier', error: err.message });
  }
}

module.exports = { getSuppliers, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
