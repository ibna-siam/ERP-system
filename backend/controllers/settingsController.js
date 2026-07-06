const pool = require('../config/db');

// GET /api/settings/company
async function getCompanySettings(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM company_settings WHERE id = 1');
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch company settings', error: err.message });
  }
}

// PUT /api/settings/company
async function updateCompanySettings(req, res) {
  try {
    const { company_name, address, phone, email, logo_url } = req.body;

    await pool.query(
      `INSERT INTO company_settings (id, company_name, address, phone, email, logo_url)
       VALUES (1, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE company_name=VALUES(company_name), address=VALUES(address),
         phone=VALUES(phone), email=VALUES(email), logo_url=VALUES(logo_url)`,
      [company_name, address, phone, email, logo_url]
    );

    res.json({ message: 'Company settings updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update company settings', error: err.message });
  }
}

module.exports = { getCompanySettings, updateCompanySettings };
