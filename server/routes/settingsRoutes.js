const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getSettings, updateSettings } = require('../controllers/settingsController');

const router = express.Router();

router.use(protect);
router.get('/', getSettings);
router.put('/', authorize(ROLES.ADMIN), updateSettings);

module.exports = router;
