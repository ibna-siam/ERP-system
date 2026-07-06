const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  getEmployeeReport,
  getExpenseReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/inventory', getInventoryReport);
router.get('/employees', getEmployeeReport);
router.get('/expenses', getExpenseReport);

module.exports = router;
