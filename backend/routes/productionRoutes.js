const express = require('express');
const router = express.Router();
const { logSortingRun } = require('../controllers/productionController');

// POST route to handle warehouse sorting actions
router.post('/log-sorting', logSortingRun);

module.exports = router;