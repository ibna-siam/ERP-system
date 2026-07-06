const express = require('express');
const router = express.Router();
const { getPurchases, getPurchaseById, createPurchase, updatePurchaseStatus } = require('../controllers/purchaseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', createPurchase);
router.patch('/:id/status', updatePurchaseStatus);

module.exports = router;
