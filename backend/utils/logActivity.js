const pool = require('../config/db');

// Small helper to record an event for the dashboard's "Recent Activities" feed
async function logActivity(message, type = 'general') {
  try {
    await pool.query('INSERT INTO activity_log (message, type) VALUES (?, ?)', [message, type]);
  } catch (err) {
    // Logging failures shouldn't break the main request
    console.error('Failed to log activity:', err.message);
  }
}

module.exports = logActivity;
