const express = require('express');
const { getTruckTypes } = require('../controllers/truckTypeController');

const router = express.Router();

router.get('/trucks', getTruckTypes);

module.exports = router; 