const SKU = require('../../src/models/SKU');
const TruckType = require('../../src/models/TruckType');
const Calculation = require('../../src/models/Calculation');

const mockSKUs = [
  {
    name: 'Small Box',
    length: 0.1,
    width: 0.1,
    height: 0.1,
    weight: 0.2
  },
  {
    name: 'Medium Box',
    length: 0.2,
    width: 0.2,
    height: 0.2,
    weight: 0.5
  },
  {
    name: 'Large Box',
    length: 0.3,
    width: 0.3,
    height: 0.3,
    weight: 1
  },
  {
    name: 'Heavy Small Box',
    length: 0.4,
    width: 0.4,
    height: 0.4,
    weight: 1.5
  },
  {
    name: 'Too Large Box',
    length: 10,
    width: 10,
    height: 10,
    weight: 10
  },
  {
    name: 'Zero Volume Box',
    length: 0,
    width: 0.5,
    height: 0.5,
    weight: 1
  },
  {
    name: 'Zero Weight Box',
    length: 0.2,
    width: 0.2,
    height: 0.2,
    weight: 0
  }
];

const mockTruckTypes = [
  {
    name: 'Small Truck',
    length: 3,
    width: 2,
    height: 2,
    weightCapacity: 500
  },
  {
    name: 'Medium Truck',
    length: 4,
    width: 2,
    height: 2,
    weightCapacity: 700
  },
  {
    name: 'Large Truck',
    length: 5,
    width: 3,
    height: 3,
    weightCapacity: 1000
  }
];

const createTestSKUs = async () => {
  const skus = [];
  for (const skuData of mockSKUs) {
    const sku = new SKU(skuData);
    await sku.save();
    skus.push(sku);
  }
  return skus;
};

const createTestTruckTypes = async () => {
  const truckTypes = [];
  for (const truckData of mockTruckTypes) {
    const truck = new TruckType(truckData);
    await truck.save();
    truckTypes.push(truck);
  }
  return truckTypes;
};

const createTestCalculation = async (skus, truckType) => {
  const calculation = new Calculation({
    destination: 'Test Destination',
    skus: [
      { sku: skus[0]._id, quantity: 5 },
      { sku: skus[1]._id, quantity: 3 }
    ],
    truckType: truckType._id,
    calculatedTrucks: 1,
    totalVolume: 0.029,
    totalWeight: 2.5,
    utilization: 85.5,
    status: 'Planned'
  });
  await calculation.save();
  return calculation;
};

const createSampleSKUQuantities = (skus) => {
  return [
    { skuId: skus[0]._id, quantity: 5 },
    { skuId: skus[1]._id, quantity: 3 }
  ];
};

const validateTruckLoad = (truckLoad) => {
  expect(truckLoad).toHaveProperty('skus');
  expect(truckLoad).toHaveProperty('groupedBoxes');
  expect(truckLoad).toHaveProperty('currentVolume');
  expect(truckLoad).toHaveProperty('currentWeight');
  expect(Array.isArray(truckLoad.skus)).toBe(true);
  expect(Array.isArray(truckLoad.groupedBoxes)).toBe(true);
  expect(typeof truckLoad.currentVolume).toBe('number');
  expect(typeof truckLoad.currentWeight).toBe('number');
};

const validateCalculationDetails = (details) => {
  expect(details).toHaveProperty('totalVolume');
  expect(details).toHaveProperty('totalWeight');
  expect(details).toHaveProperty('calculatedTrucks');
  expect(details).toHaveProperty('truckVolume');
  expect(details).toHaveProperty('truckWeightCapacity');
  expect(details).toHaveProperty('trucks');
  expect(details).toHaveProperty('recommendations');
  expect(Array.isArray(details.trucks)).toBe(true);
  expect(Array.isArray(details.recommendations)).toBe(true);
};

module.exports = {
  mockSKUs,
  mockTruckTypes,
  createTestSKUs,
  createTestTruckTypes,
  createTestCalculation,
  createSampleSKUQuantities,
  validateTruckLoad,
  validateCalculationDetails
}; 