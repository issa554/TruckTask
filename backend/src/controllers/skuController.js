const SKU = require('../models/SKU');

const getSKUs = async (req, res) => {
  try {
    const skus = await SKU.find({});
    res.status(200).json(skus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSKUs
}; 