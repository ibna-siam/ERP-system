const pool = require('../config/db');

// GET /api/inventory/current - current stock levels for all products
async function getCurrentInventory(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.sku, c.name as category_name, p.stock_quantity, p.low_stock_threshold, p.unit
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inventory', error: err.message });
  }
}

// GET /api/inventory/history?product_id=&page=&limit=
async function getInventoryHistory(req, res) {
  try {
    const { product_id = '', page = 1, limit = 15 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = '1=1';
    const params = [];
    if (product_id) {
      where += ' AND i.product_id = ?';
      params.push(product_id);
    }

    const [rows] = await pool.query(
      `SELECT i.*, p.name as product_name, p.unit
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE ${where}
       ORDER BY i.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM inventory i WHERE ${where}`,
      params
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch inventory history', error: err.message });
  }
}

module.exports = { getCurrentInventory, getInventoryHistory };
