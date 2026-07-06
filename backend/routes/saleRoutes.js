const express = require('express');
const router = express.Router();
const { getSales, getSaleById, createSale, updateSaleStatus } = require('../controllers/saleController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);
router.patch('/:id/status', updateSaleStatus);

module.exports = router;
