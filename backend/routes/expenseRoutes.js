const express = require('express');
const router = express.Router();
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMonthlyExpenseReport,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/monthly-report', getMonthlyExpenseReport);
router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
