const express = require('express');
const { getSKUs } = require('../controllers/skuController');

const router = express.Router();

router.get('/skus', getSKUs);

module.exports = router; 