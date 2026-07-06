const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

// GET /api/products?search=&category=&page=&limit=
async function getProducts(req, res) {
  try {
    const { search = '', category = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const term = `%${search}%`;

    let where = '(p.name LIKE ? OR p.sku LIKE ?)';
    const params = [term, term];

    if (category) {
      where += ' AND p.category_id = ?';
      params.push(category);
    }

    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM products p WHERE ${where}`,
      params
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.message });
  }
}

// GET /api/products/low-stock
async function getLowStockProducts(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.stock_quantity <= p.low_stock_threshold
       ORDER BY p.stock_quantity ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch low stock products', error: err.message });
  }
}

async function getProductById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Product not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product', error: err.message });
  }
}

async function createProduct(req, res) {
  try {
    const { name, sku, category_id, price, cost_price, stock_quantity, low_stock_threshold, unit } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, sku, category_id, price, cost_price, stock_quantity, low_stock_threshold, unit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        sku || null,
        category_id || null,
        price,
        cost_price || 0,
        stock_quantity || 0,
        low_stock_threshold || 10,
        unit || 'pcs',
      ]
    );

    await logActivity(`New product added: ${name}`, 'product');
    res.status(201).json({ id: result.insertId, message: 'Product created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'A product with this SKU already exists' });
    }
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    const { name, sku, category_id, price, cost_price, stock_quantity, low_stock_threshold, unit } = req.body;
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Product not found' });

    await pool.query(
      `UPDATE products SET name=?, sku=?, category_id=?, price=?, cost_price=?, stock_quantity=?, low_stock_threshold=?, unit=?
       WHERE id=?`,
      [name, sku, category_id, price, cost_price, stock_quantity, low_stock_threshold, unit, req.params.id]
    );
    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
}

// PATCH /api/products/:id/stock  { quantity, type: 'in' | 'out', reason }
// Manual stock adjustment (also logs to inventory table)
async function updateStock(req, res) {
  const connection = await pool.getConnection();
  try {
    const { quantity, type, reason } = req.body;
    if (!quantity || !['in', 'out'].includes(type)) {
      return res.status(400).json({ message: 'Quantity and a valid type (in/out) are required' });
    }

    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [req.params.id]);
    const product = rows[0];
    if (!product) {
      await connection.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    const newQty = type === 'in' ? product.stock_quantity + Number(quantity) : product.stock_quantity - Number(quantity);
    if (newQty < 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Insufficient stock for this operation' });
    }

    await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newQty, req.params.id]);
    await connection.query(
      `INSERT INTO inventory (product_id, type, quantity, reason, reference_type) VALUES (?, ?, ?, ?, 'manual')`,
      [req.params.id, type, quantity, reason || null]
    );

    await connection.commit();
    await logActivity(`Stock ${type === 'in' ? 'added to' : 'removed from'} ${product.name}: ${quantity} ${product.unit}`, 'inventory');

    res.json({ message: 'Stock updated successfully', new_quantity: newQty });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Failed to update stock', error: err.message });
  } finally {
    connection.release();
  }
}

async function deleteProduct(req, res) {
  try {
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Product not found' });

    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
}

module.exports = {
  getProducts,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  deleteProduct,
};
