const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonthlySales,
  getRevenueVsExpense,
  getRecentActivities,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/monthly-sales', getMonthlySales);
router.get('/revenue-vs-expense', getRevenueVsExpense);
router.get('/recent-activities', getRecentActivities);

module.exports = router;
