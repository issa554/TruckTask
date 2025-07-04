const express = require('express');
const { calculateTrucks, getCalculations, searchPlannedShipments, updateCalculation, saveCalculation } = require('../controllers/calculationController');

const router = express.Router();

router.post('/calculations/calculate', calculateTrucks);

router.post('/calculations', saveCalculation);

router.get('/calculations', getCalculations);

router.get('/calculations/search', searchPlannedShipments);

router.put('/calculations/:id', updateCalculation);

module.exports = router; 