const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

function generateInvoiceNo() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${Date.now().toString().slice(-6)}-${rand}`;
}

// GET /api/sales?search=&status=&page=&limit=
async function getSales(req, res) {
  try {
    const { search = '', status = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = '(s.invoice_no LIKE ? OR c.name LIKE ?)';
    const term = `%${search}%`;
    const params = [term, term];

    if (status) {
      where += ' AND s.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT s.*, c.name as customer_name
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE ${where}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE ${where}`,
      params
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sales', error: err.message });
  }
}

// GET /api/sales/:id - full invoice detail with line items
async function getSaleById(req, res) {
  try {
    const [saleRows] = await pool.query(
      `SELECT s.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!saleRows[0]) return res.status(404).json({ message: 'Sale not found' });

    const [items] = await pool.query(
      `SELECT si.*, p.name as product_name, p.unit
       FROM sale_items si JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );

    res.json({ ...saleRows[0], items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sale', error: err.message });
  }
}

// POST /api/sales
// body: { customer_id, sale_date, items: [{ product_id, quantity, unit_price }] }
async function createSale(req, res) {
  const connection = await pool.getConnection();
  try {
    const { customer_id, sale_date, items } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'At least one product item is required' });
    }

    await connection.beginTransaction();

    let total = 0;
    for (const item of items) {
      const [productRows] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
      const product = productRows[0];
      if (!product) {
        await connection.rollback();
        return res.status(404).json({ message: `Product with id ${item.product_id} not found` });
      }
      if (product.stock_quantity < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` });
      }
      total += Number(item.unit_price) * Number(item.quantity);
    }

    const invoiceNo = generateInvoiceNo();
    const [saleResult] = await connection.query(
      `INSERT INTO sales (invoice_no, customer_id, total_amount, status, sale_date, created_by)
       VALUES (?, ?, ?, 'completed', ?, ?)`,
      [invoiceNo, customer_id || null, total, sale_date || new Date().toISOString().slice(0, 10), req.user?.id || null]
    );
    const saleId = saleResult.insertId;

    for (const item of items) {
      const subtotal = Number(item.unit_price) * Number(item.quantity);
      await connection.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.quantity, item.unit_price, subtotal]
      );

      await connection.query('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?', [
        item.quantity,
        item.product_id,
      ]);

      await connection.query(
        `INSERT INTO inventory (product_id, type, quantity, reason, reference_type, reference_id)
         VALUES (?, 'out', ?, 'Sale', 'sale', ?)`,
        [item.product_id, item.quantity, saleId]
      );
    }

    await connection.commit();
    await logActivity(`New sale recorded: ${invoiceNo} (৳${total.toFixed(2)})`, 'sale');

    res.status(201).json({ id: saleId, invoice_no: invoiceNo, total_amount: total, message: 'Sale created successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Failed to create sale', error: err.message });
  } finally {
    connection.release();
  }
}

// PATCH /api/sales/:id/status  { status }
async function updateSaleStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['completed', 'pending', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [existing] = await pool.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Sale not found' });

    await pool.query('UPDATE sales SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Sale status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update sale status', error: err.message });
  }
}

module.exports = { getSales, getSaleById, createSale, updateSaleStatus };
