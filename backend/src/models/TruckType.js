const mongoose = require('mongoose');

const truckTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  length: {
    type: Number,
    required: true,
    min: 0
  },
  width: {
    type: Number,
    required: true,
    min: 0
  },
  height: {
    type: Number,
    required: true,
    min: 0
  },
  weightCapacity: {
    type: Number,
    required: true,
    min: 0
  }
});

module.exports = mongoose.model('TruckType', truckTypeSchema); 