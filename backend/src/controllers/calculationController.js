const Calculation = require('../models/Calculation');
const { createCalculationService, updateCalculationService  ,getTruckingCalculationDetails} = require('../services/calculationService');

const calculateTrucks = async (req, res) => {
  try {
    const { destination, skuQuantities, truckTypeId } = req.body;

    if (!destination || !skuQuantities || !truckTypeId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const response = await getTruckingCalculationDetails(skuQuantities, truckTypeId , destination);

    res.status(201).json({
      response
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveCalculation = async (req, res) => {
  try {
    const { destination, skuQuantities, truckTypeId } = req.body;

    if (!destination || !skuQuantities || !truckTypeId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const savedCalculation = await createCalculationService(destination, skuQuantities, truckTypeId);
    res.status(201).json(savedCalculation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCalculations = async (req, res) => {
  try {
    const calculations = await Calculation.find()
      .populate('skus.sku')
      .populate('truckType');
    res.status(200).json(calculations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchPlannedShipments = async (req, res) => {
  try {
    const { destination } = req.query;

    if (!destination) {
      return res.status(400).json({ message: 'Destination is required.' });
    }

    const existingPlannedCalculation = await Calculation.find({ destination, status: 'Planned' });

    if (existingPlannedCalculation.length > 0) {
      return res.status(200).json({
        message: 'A planned shipment already exists for this destination.',
        existingCalculations: existingPlannedCalculation
      });
    } else {
      return res.status(200).json({
        message: 'No planned shipment found for this destination. Proceed with new calculation.'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCalculation = async (req, res) => {
  try {
    const { id } = req.params;
    const { destination, skuQuantities, truckTypeId, status } = req.body;

    const response= await updateCalculationService(id, destination, skuQuantities, truckTypeId, status);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  calculateTrucks,
  getCalculations,
  searchPlannedShipments,
  updateCalculation,
  saveCalculation
}; 