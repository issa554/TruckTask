const TruckType = require('../models/TruckType');

const getTruckTypes = async (req, res) => {
  try {
    const truckTypes = await TruckType.find({});
    res.status(200).json(truckTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTruckTypes
}; 