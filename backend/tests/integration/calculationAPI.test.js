const request = require('supertest');
const express = require('express');
const cors = require('cors');
const calculationRoutes = require('../../src/routes/calculationRoutes');
const skuRoutes = require('../../src/routes/skuRoutes');
const truckTypeRoutes = require('../../src/routes/truckTypeRoutes');

const {
  createTestSKUs,
  createTestTruckTypes,
  createTestCalculation
} = require('../utils/testHelpers');

const Calculation = require('../../src/models/Calculation');

// Create test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', calculationRoutes);
app.use('/api', skuRoutes);
app.use('/api', truckTypeRoutes);

describe('Calculation API Integration Tests', () => {
  let testSKUs, testTruckTypes;

  beforeEach(async () => {
    testSKUs = await createTestSKUs();
    testTruckTypes = await createTestTruckTypes();
  });

  describe('POST /api/calculations/calculate', () => {
    test('should calculate truck utilization successfully', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: testSKUs[0]._id, quantity: 5 },
          { skuId: testSKUs[1]._id, quantity: 3 }
        ],
        truckTypeId: testTruckTypes[1]._id
      };

      const response = await request(app)
        .post('/api/calculations/calculate')
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('response');
      expect(response.body.response).toHaveProperty('totalVolume');
      expect(response.body.response).toHaveProperty('totalWeight');
      expect(response.body.response).toHaveProperty('calculatedTrucks');
      expect(response.body.response).toHaveProperty('trucks');
      expect(response.body.response.totalVolume).toBeCloseTo(0.029, 3);
      expect(response.body.response.totalWeight).toBeCloseTo(2.5, 1);
      expect(response.body.response.calculatedTrucks).toBeGreaterThan(0);
    });

    test('should return 400 for missing required fields', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        // Missing skuQuantities and truckTypeId
      };

      const response = await request(app)
        .post('/api/calculations/calculate')
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Missing required fields.');
    });

    test('should return 500 for invalid SKU ID', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: '507f1f77bcf86cd799439011', quantity: 5 }
        ],
        truckTypeId: testTruckTypes[0]._id
      };

      const response = await request(app)
        .post('/api/calculations/calculate')
        .send(requestBody)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    test('should return 500 for invalid truck type ID', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: testSKUs[0]._id, quantity: 5 }
        ],
        truckTypeId: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/calculations/calculate')
        .send(requestBody)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    test('should handle large quantities requiring multiple trucks', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: testSKUs[2]._id, quantity: 500 } // Large boxes
        ],
        truckTypeId: testTruckTypes[0]._id // Small truck
      };

      const response = await request(app)
        .post('/api/calculations/calculate')
        .send(requestBody)
        .expect(201);

      expect(response.body.response.calculatedTrucks).toBeGreaterThan(1);
    });
  });

  describe('POST /api/calculations', () => {
    test('should save calculation successfully', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: testSKUs[0]._id, quantity: 5 },
          { skuId: testSKUs[1]._id, quantity: 3 }
        ],
        truckTypeId: testTruckTypes[1]._id
      };

      const response = await request(app)
        .post('/api/calculations')
        .send(requestBody)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('destination', 'Test Warehouse');
      expect(response.body).toHaveProperty('status', 'Planned');
      expect(response.body.skus).toHaveLength(2);
      expect(response.body.totalVolume).toBeCloseTo(0.029, 3);
      expect(response.body.totalWeight).toBeCloseTo(2.5, 1);

      // Verify it was actually saved to database
      const savedCalculation = await Calculation.findById(response.body._id);
      expect(savedCalculation).toBeDefined();
    });

    test('should return 400 for missing required fields', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        // Missing skuQuantities and truckTypeId
      };

      const response = await request(app)
        .post('/api/calculations')
        .send(requestBody)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Missing required fields.');
    });

    test('should return 500 for invalid data', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: 'invalid-id', quantity: 5 }
        ],
        truckTypeId: testTruckTypes[0]._id
      };

      const response = await request(app)
        .post('/api/calculations')
        .send(requestBody)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/calculations', () => {
    test('should get all calculations successfully', async () => {
      // Create test calculations
      await createTestCalculation(testSKUs, testTruckTypes[0]);
      await createTestCalculation(testSKUs, testTruckTypes[1]);

      const response = await request(app)
        .get('/api/calculations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      // Check that calculations have populated fields
      response.body.forEach(calculation => {
        expect(calculation).toHaveProperty('_id');
        expect(calculation).toHaveProperty('destination');
        expect(calculation).toHaveProperty('skus');
        expect(calculation).toHaveProperty('truckType');
        expect(calculation.skus[0]).toHaveProperty('sku');
        expect(calculation.skus[0].sku).toHaveProperty('name');
        expect(calculation.truckType).toHaveProperty('name');
      });
    });

    test('should return empty array when no calculations exist', async () => {
      const response = await request(app)
        .get('/api/calculations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/calculations/search', () => {
    test('should find existing planned shipment', async () => {
      const testCalculation = await createTestCalculation(testSKUs, testTruckTypes[0]);
      
      const response = await request(app)
        .get('/api/calculations/search')
        .query({ destination: testCalculation.destination })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('existingCalculations');
      expect(response.body.message).toContain('A planned shipment already exists');
      expect(Array.isArray(response.body.existingCalculations)).toBe(true);
      expect(response.body.existingCalculations.length).toBeGreaterThan(0);
    });

    test('should return no planned shipment found', async () => {
      const response = await request(app)
        .get('/api/calculations/search')
        .query({ destination: 'Non-existent Destination' })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No planned shipment found');
    });

    test('should return 400 when destination is missing', async () => {
      const response = await request(app)
        .get('/api/calculations/search')
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Destination is required.');
    });

    test('should handle special characters in destination', async () => {
      const destination = 'Wärehöuse & Co. (Special Chars!)';
      
      const response = await request(app)
        .get('/api/calculations/search')
        .query({ destination })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No planned shipment found');
    });
  });

  describe('PUT /api/calculations/:id', () => {
    let existingCalculation;

    beforeEach(async () => {
      existingCalculation = await createTestCalculation(testSKUs, testTruckTypes[0]);
    });

    test('should update calculation destination successfully', async () => {
      const requestBody = {
        destination: 'Updated Warehouse'
      };

      const response = await request(app)
        .put(`/api/calculations/${existingCalculation._id}`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('destination', 'Updated Warehouse');
      expect(response.body._id.toString()).toBe(existingCalculation._id.toString());
    });

    test('should update calculation status successfully', async () => {
      const requestBody = {
        status: 'Shipped'
      };

      const response = await request(app)
        .put(`/api/calculations/${existingCalculation._id}`)
        .send(requestBody)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'Shipped');
    });

    test('should update SKU quantities and truck type', async () => {
      const requestBody = {
        skuQuantities: [
          { skuId: testSKUs[2]._id, quantity: 2 }
        ],
        truckTypeId: testTruckTypes[2]._id
      };

      const response = await request(app)
        .put(`/api/calculations/${existingCalculation._id}`)
        .send(requestBody)
        .expect(200);

      expect(response.body.skus).toHaveLength(1);
      expect(response.body.skus[0].sku._id.toString()).toBe(testSKUs[2]._id.toString());
      expect(response.body.skus[0].quantity).toBe(2);
      expect(response.body.truckType._id.toString()).toBe(testTruckTypes[2]._id.toString());
    });

    test('should update all fields simultaneously', async () => {
      const requestBody = {
        destination: 'Updated Warehouse',
        status: 'Shipped',
        skuQuantities: [
          { skuId: testSKUs[1]._id, quantity: 1 }
        ],
        truckTypeId: testTruckTypes[1]._id
      };

      const response = await request(app)
        .put(`/api/calculations/${existingCalculation._id}`)
        .send(requestBody)
        .expect(200);

      expect(response.body.destination).toBe('Updated Warehouse');
      expect(response.body.status).toBe('Shipped');
      expect(response.body.skus).toHaveLength(1);
      expect(response.body.truckType._id.toString()).toBe(testTruckTypes[1]._id.toString());
    });

    test('should return 500 for non-existent calculation ID', async () => {
      const requestBody = {
        destination: 'Updated Warehouse'
      };

      const response = await request(app)
        .put('/api/calculations/507f1f77bcf86cd799439011')
        .send(requestBody)
        .expect(500);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Calculation not found');
    });

    test('should return 500 for invalid calculation ID format', async () => {
      const requestBody = {
        destination: 'Updated Warehouse'
      };

      const response = await request(app)
        .put('/api/calculations/invalid-id')
        .send(requestBody)
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/calculations/calculate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/calculations/calculate')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Missing required fields.');
    });

    test('should handle very large SKU quantities', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: testSKUs[0]._id, quantity: 10000 }
        ],
        truckTypeId: testTruckTypes[0]._id
      };

      const response = await request(app)
        .post('/api/calculations/calculate')
        .send(requestBody)
        .expect(201);

      expect(response.body.response.calculatedTrucks).toBeGreaterThan(1);
    });

    test('should handle zero quantity SKUs', async () => {
      const requestBody = {
        destination: 'Test Warehouse',
        skuQuantities: [
          { skuId: testSKUs[0]._id, quantity: 0 }
        ],
        truckTypeId: testTruckTypes[0]._id
      };

      const response = await request(app)
        .post('/api/calculations/calculate')
        .send(requestBody)
        .expect(201);

      expect(response.body.response.totalVolume).toBe(0);
      expect(response.body.response.totalWeight).toBe(0);
    });
  });
}); 