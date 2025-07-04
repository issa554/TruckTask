const mongoose = require('mongoose');

const calculationSchema = new mongoose.Schema({
  destination: {
    type: String,
    required: true,
    trim: true
  },
  skus: [{
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    _id: false

  }],
  truckType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TruckType',
    required: true
  },
  calculatedTrucks: {
    type: Number,
    required: true,
    min: 0
  },
  totalVolume: {
    type: Number,
    required: true,
    min: 0
  },
  totalWeight: {
    type: Number,
    required: true,
    min: 0
  },
  utilization: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Planned', 'Shipped'],
    default: 'Planned'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Calculation', calculationSchema); 