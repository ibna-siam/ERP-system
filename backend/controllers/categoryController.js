const pool = require('../config/db');

async function getCategories(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch categories', error: err.message });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Category created successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    res.status(500).json({ message: 'Failed to create category', error: err.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { name, description } = req.body;
    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Category not found' });

    await pool.query('UPDATE categories SET name=?, description=? WHERE id=?', [
      name,
      description,
      req.params.id,
    ]);
    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update category', error: err.message });
  }
}

async function deleteCategory(req, res) {
  try {
    const [existing] = await pool.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Category not found' });

    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
