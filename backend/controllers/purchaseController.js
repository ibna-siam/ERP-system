const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

function generatePurchaseNo() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PUR-${Date.now().toString().slice(-6)}-${rand}`;
}

// GET /api/purchases?search=&status=&page=&limit=
async function getPurchases(req, res) {
  try {
    const { search = '', status = '', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = '(p.purchase_no LIKE ? OR s.name LIKE ?)';
    const term = `%${search}%`;
    const params = [term, term];

    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }

    const [rows] = await pool.query(
      `SELECT p.*, s.name as supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE ${where}`,
      params
    );

    res.json({
      data: rows,
      total: countRows[0].total,
      page: Number(page),
      totalPages: Math.ceil(countRows[0].total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch purchases', error: err.message });
  }
}

async function getPurchaseById(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, s.name as supplier_name, s.company_name, s.phone as supplier_phone
       FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Purchase not found' });

    const [items] = await pool.query(
      `SELECT pi.*, pr.name as product_name, pr.unit
       FROM purchase_items pi JOIN products pr ON pr.id = pi.product_id
       WHERE pi.purchase_id = ?`,
      [req.params.id]
    );

    res.json({ ...rows[0], items });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch purchase', error: err.message });
  }
}

// POST /api/purchases
// body: { supplier_id, purchase_date, items: [{ product_id, quantity, unit_price }] }
async function createPurchase(req, res) {
  const connection = await pool.getConnection();
  try {
    const { supplier_id, purchase_date, items } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ message: 'At least one product item is required' });
    }

    await connection.beginTransaction();

    let total = 0;
    for (const item of items) {
      total += Number(item.unit_price) * Number(item.quantity);
    }

    const purchaseNo = generatePurchaseNo();
    const [result] = await connection.query(
      `INSERT INTO purchases (purchase_no, supplier_id, total_amount, status, purchase_date, created_by)
       VALUES (?, ?, ?, 'received', ?, ?)`,
      [purchaseNo, supplier_id || null, total, purchase_date || new Date().toISOString().slice(0, 10), req.user?.id || null]
    );
    const purchaseId = result.insertId;

    for (const item of items) {
      const subtotal = Number(item.unit_price) * Number(item.quantity);
      await connection.query(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [purchaseId, item.product_id, item.quantity, item.unit_price, subtotal]
      );

      // Purchases increase stock (goods received)
      await connection.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [
        item.quantity,
        item.product_id,
      ]);

      await connection.query(
        `INSERT INTO inventory (product_id, type, quantity, reason, reference_type, reference_id)
         VALUES (?, 'in', ?, 'Purchase', 'purchase', ?)`,
        [item.product_id, item.quantity, purchaseId]
      );
    }

    await connection.commit();
    await logActivity(`New purchase recorded: ${purchaseNo} (৳${total.toFixed(2)})`, 'purchase');

    res.status(201).json({ id: purchaseId, purchase_no: purchaseNo, total_amount: total, message: 'Purchase recorded successfully' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Failed to create purchase', error: err.message });
  } finally {
    connection.release();
  }
}

async function updatePurchaseStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['received', 'pending', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const [existing] = await pool.query('SELECT * FROM purchases WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Purchase not found' });

    await pool.query('UPDATE purchases SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Purchase status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update purchase status', error: err.message });
  }
}

module.exports = { getPurchases, getPurchaseById, createPurchase, updatePurchaseStatus };
