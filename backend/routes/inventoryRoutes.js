const express = require('express');
const router = express.Router();
const { getCurrentInventory, getInventoryHistory } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/current', getCurrentInventory);
router.get('/history', getInventoryHistory);

module.exports = router;
