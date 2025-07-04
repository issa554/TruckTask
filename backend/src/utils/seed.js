const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SKU = require('../models/SKU');
const TruckType = require('../models/TruckType');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');

    await SKU.deleteMany({});
    await TruckType.deleteMany({});
    console.log('Existing data cleared');

    const skus = [
      {
        name: 'Laptop',
        length: 0.5,
        width: 0.5,
        height: 0.5,
        weight: 20
      },
      {
        name: 'Monitor',
        length: 0.5,
        width: 0.1,
        height: 0.4,
        weight: 5
      },
      {
        name: 'Table',
        length:1,
        width: 0.5,
        height: 0.5,
        weight: 10
      }
    ];

    const truckTypes = [
      {
        name: 'Small Van',
        length: 3,
        width: 1.5,
        height: 1.8,
        weightCapacity: 1000
      },
      {
        name: 'Truck',
        length: 6,
        width: 2.2,
        height: 2.5,
        weightCapacity: 5000
      }
    ];

    await SKU.insertMany(skus);
    await TruckType.insertMany(truckTypes);
    console.log('Sample data inserted!');

    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding database:', err);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDB(); 