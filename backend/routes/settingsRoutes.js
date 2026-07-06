const express = require('express');
const router = express.Router();
const { getCompanySettings, updateCompanySettings } = require('../controllers/settingsController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/company', getCompanySettings);
router.put('/company', adminOnly, updateCompanySettings);

module.exports = router;
