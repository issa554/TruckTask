const {
  createCalculationService,
  updateCalculationService,
  getTruckingCalculationDetails
} = require('../../src/services/calculationService');

const {
  createTestSKUs,
  createTestTruckTypes,
  createTestCalculation,
  createSampleSKUQuantities,
  validateCalculationDetails
} = require('../utils/testHelpers');

const SKU = require('../../src/models/SKU');
const TruckType = require('../../src/models/TruckType');
const Calculation = require('../../src/models/Calculation');

describe('CalculationService', () => {
  let testSKUs, testTruckTypes;

  beforeEach(async () => {
    testSKUs = await createTestSKUs();
    testTruckTypes = await createTestTruckTypes();
  });

  describe('getTruckingCalculationDetails', () => {
    test('should calculate truck utilization correctly for normal load', async () => {
      const skuQuantities = createSampleSKUQuantities(testSKUs);
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      validateCalculationDetails(result);
      expect(result.calculatedTrucks).toBe(1);
      expect(result.totalVolume).toBeCloseTo(0.029, 3); // (0.1*0.1*0.1*5) + (0.2*0.2*0.2*3)
      expect(result.totalWeight).toBeCloseTo(2.5, 1); // (0.2*5) + (0.5*3)
      expect(result.trucks).toHaveLength(result.calculatedTrucks);
    });

    test('should handle single item that fits in truck', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 1 }];
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(1);
      expect(result.totalVolume).toBeCloseTo(0.001, 3); // 0.1*0.1*0.1
      expect(result.totalWeight).toBeCloseTo(0.2, 1);
      expect(result.trucks[0].utilization).toBeGreaterThanOrEqual(0); // Very small items have low utilization
    });

    test('should require multiple trucks for large quantities', async () => {
      const skuQuantities = [{ skuId: testSKUs[2]._id, quantity: 1000 }]; // 500 large boxes
      const truckType = testTruckTypes[0]; // Small truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(3);
      expect(result.totalVolume).toBeCloseTo(27, 1); // 0.3*0.3*0.3*1000
      expect(result.totalWeight).toBeCloseTo(1000, 1); // 1*1000
    });

    test("should require multiple trucks for large quantities and multiple SKUs", async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 1000 }, { skuId: testSKUs[1]._id, quantity: 1000 }, { skuId: testSKUs[2]._id, quantity: 1000 }]; // 500 large boxes
      const truckType = testTruckTypes[0]; // Small truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(4);
      expect(result.totalVolume).toBeCloseTo(36, 1); // 0.1*0.1*0.1*1000 + 0.2*0.2*0.2*1000 + 0.3*0.3*0.3*1000
      expect(result.totalWeight).toBeCloseTo(1700, 1); // 0.2*1000 + 0.5*1000 + 1*1000
      expect(result.trucks).toHaveLength(4);
      expect(result.trucks[0].utilization).toBeGreaterThan(90);
      expect(result.trucks[1].utilization).toBeGreaterThan(90);
      expect(result.trucks[2].utilization).toBeGreaterThan(90);
      expect(result.trucks[3].utilization).toBeGreaterThan(0);
    });

    test('should handle weight-limited scenarios', async () => {
      const skuQuantities = [{ skuId: testSKUs[3]._id, quantity: 400 }]; // 400 heavy small boxes
      const truckType = testTruckTypes[0]; // Small truck (500 weight capacity)

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBeGreaterThan(1); // Should need multiple trucks due to weight
      expect(result.totalWeight).toBeCloseTo(600, 1); // 1.5*400
    });

    test('should provide optimization recommendations for under-utilized trucks', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 1 }]; // Single small box
      const truckType = testTruckTypes[2]; // Large truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(1);
      expect(result.trucks[0].utilization).toBeLessThan(100);
      expect(result.recommendations).toBeDefined();
    });

    test('should throw error when SKU is too large for the truck', async () => {
      const skuQuantities = [{ skuId:testSKUs[4]._id , quantity: 1 }];
      const truckType = testTruckTypes[0];

      await expect(
        getTruckingCalculationDetails(skuQuantities, truckType._id)
      ).rejects.toThrow(`SKU ${testSKUs[4].name } is too large for the truck.`);
    });

    test('should throw error for non-existent SKU', async () => {
      const skuQuantities = [{ skuId: '507f1f77bcf86cd799439011', quantity: 1 }];
      const truckType = testTruckTypes[0];

      await expect(
        getTruckingCalculationDetails(skuQuantities, truckType._id)
      ).rejects.toThrow('SKU 507f1f77bcf86cd799439011 not found.');
    });

    test('should throw error for non-existent truck type', async () => {
      const skuQuantities = createSampleSKUQuantities(testSKUs);
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        getTruckingCalculationDetails(skuQuantities, fakeId)
      ).rejects.toThrow(`TruckType ${fakeId} not found.`);
    });

    test('should throw error for item too large for truck', async () => {
      // Create a very large SKU
      const largeSKU = new SKU({
        name: 'Oversized Box',
        length: 10,
        width: 10,
        height: 10,
        weight: 2000
      });
      await largeSKU.save();

      const skuQuantities = [{ skuId: largeSKU._id, quantity: 1 }];
      const truckType = testTruckTypes[0]; // Small truck

      await expect(
        getTruckingCalculationDetails(skuQuantities, truckType._id)
      ).rejects.toThrow(/is too large for the truck/);
    });

    // NEW CRITICAL TESTS
    test('should correctly pack boxes with optimal 3D positioning', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 8 }]; // 8 small boxes that should fit optimally
      const truckType = testTruckTypes[0]; // Small truck (3x2x2 = 12m³)

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(1);
      expect(result.trucks[0].groupedBoxes).toBeDefined();
      expect(result.trucks[0].groupedBoxes[0].positionPattern).toBeDefined();
      expect(result.trucks[0].groupedBoxes[0].count).toBe(8);
    });

    test('should handle exact capacity scenarios - volume limited', async () => {
      // Create SKU that exactly fills truck volume
      const perfectFitSKU = new SKU({
        name: 'Perfect Fit Box',
        length: 3,
        width: 2,
        height: 2,
        weight: 1
      });
      await perfectFitSKU.save();

      const skuQuantities = [{ skuId: perfectFitSKU._id, quantity: 1 }];
      const truckType = testTruckTypes[0]; // Small truck (3x2x2)

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(1);
      expect(result.trucks[0].utilization).toBeCloseTo(100, 0);
    });

    test('should handle exact capacity scenarios - weight limited', async () => {
      // Create SKU that exactly fills truck weight capacity
      const heavyPerfectSKU = new SKU({
        name: 'Heavy Perfect Fit',
        length: 0.1,
        width: 0.1,
        height: 0.1,
        weight: 500 // Exactly matches small truck weight capacity
      });
      await heavyPerfectSKU.save();

      const skuQuantities = [{ skuId: heavyPerfectSKU._id, quantity: 1 }];
      const truckType = testTruckTypes[0]; // Small truck (500kg capacity)

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(1);
      expect(result.trucks[0].utilization).toBeCloseTo(100, 0);
    });

    test('should validate recommendations accuracy', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 1 }];
      const truckType = testTruckTypes[2]; // Large truck with lots of remaining space

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.recommendations).toBeDefined();
      if (result.recommendations.length > 0) {
        expect(result.recommendations[0]).toBeInstanceOf(Array);
        result.recommendations[0].forEach(rec => {
          expect(rec).toHaveProperty('sku');
          expect(rec).toHaveProperty('maxQuantity');
          expect(rec.maxQuantity).toBeGreaterThan(0);
        });
      }
    });

    test('should handle SKUs with zero volume/weight in recommendations', async () => {
      // This test will trigger recommendation system which encounters all SKUs in database
      // including the ones with zero volume/weight (testSKUs[5] and testSKUs[6])
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 1 }]; // Small load
      const truckType = testTruckTypes[2]; // Large truck (lots of remaining space)

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.recommendations).toBeDefined();
      expect(result.trucks[0].utilization).toBeLessThan(50); // Should be under-utilized

      // The recommendation system should skip SKUs with zero volume or weight
      // and only recommend valid SKUs
      if (result.recommendations.length > 0) {
        result.recommendations[0].forEach(rec => {
          expect(rec.sku.length * rec.sku.width * rec.sku.height).toBeGreaterThan(0);
          expect(rec.sku.weight).toBeGreaterThan(0);
          expect(rec.maxQuantity).toBeGreaterThan(0);
        });
      }
    });

    test('should handle mixed size optimization correctly', async () => {
      // Test that algorithm chooses optimal arrangement of different sized items
      const mixedQuantities = [
        { skuId: testSKUs[0]._id, quantity: 100 }, // Small boxes
        { skuId: testSKUs[2]._id, quantity: 5 }    // Large boxes
      ];
      const truckType = testTruckTypes[2]; // Large truck

      const result = await getTruckingCalculationDetails(mixedQuantities, truckType._id);

      expect(result.calculatedTrucks).toBeGreaterThanOrEqual(1);
      
      // Verify trucks contain mix of items efficiently
      const totalSmallBoxes = result.trucks.reduce((sum, truck) => {
        const smallBoxGroup = truck.groupedBoxes.find(box => box.sku === 'Small Box');
        return sum + (smallBoxGroup ? smallBoxGroup.count : 0);
      }, 0);
      
      expect(totalSmallBoxes).toBe(100);
    });
  });

  describe('3D Packing Algorithm Validation', () => {
    test('should validate box positioning logic', async () => {
      const skuQuantities = [{ skuId: testSKUs[1]._id, quantity: 4 }]; // 4 medium boxes
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.trucks[0].groupedBoxes).toBeDefined();
      const boxGroup = result.trucks[0].groupedBoxes[0];
      
      expect(boxGroup.positionPattern.start).toBeDefined();
      expect(boxGroup.positionPattern.end).toBeDefined();
      expect(boxGroup.positionPattern.count).toBe(4);
      expect(boxGroup.gridCapacity).toBeDefined();
      
      // Validate positioning coordinates are logical
      expect(boxGroup.positionPattern.start.x).toBeGreaterThanOrEqual(0);
      expect(boxGroup.positionPattern.start.y).toBeGreaterThanOrEqual(0);
      expect(boxGroup.positionPattern.start.z).toBeGreaterThanOrEqual(0);
    });

    test('should handle space splitting correctly', async () => {
      // Test that algorithm properly handles remaining spaces after placing boxes
      const skuQuantities = [
        { skuId: testSKUs[0]._id, quantity: 1 }, // One small box
        { skuId: testSKUs[1]._id, quantity: 1 }  // One medium box
      ];
      const truckType = testTruckTypes[2]; // Large truck with plenty of space

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(1);
      expect(result.trucks[0].groupedBoxes).toHaveLength(2);
      
      // Both should fit in one truck with room to spare
      expect(result.trucks[0].utilization).toBeLessThan(50);
    });
  });

  describe('Performance and Boundary Tests', () => {

    test('should validate input data types', async () => {
      // Test with invalid quantity types
      const invalidQuantities = [{ skuId: testSKUs[0]._id, quantity: "invalid" }];
      const truckType = testTruckTypes[0];

      // Should handle gracefully or throw appropriate error
      try {
        await getTruckingCalculationDetails(invalidQuantities, truckType._id);
      } catch (error) {
        expect(error.message).toContain('quantity');
      }
    });

    test('should throw error for negative quantities', async () => {
      const negativeQuantities = [{ skuId: testSKUs[0]._id, quantity: -1 }];
      const truckType = testTruckTypes[0];

      await expect(
        getTruckingCalculationDetails(negativeQuantities, truckType._id)
      ).rejects.toThrow("Quantity cannot be negative.");
    });
  });

  describe('createCalculationService', () => {
    test('should create a new calculation successfully', async () => {
      const skuQuantities = createSampleSKUQuantities(testSKUs);
      const truckType = testTruckTypes[1];
      const destination = 'Test Warehouse';

      const result = await createCalculationService(destination, skuQuantities, truckType._id);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.destination).toBe(destination);
      expect(result.skus).toHaveLength(2);
      expect(result.truckType._id.toString()).toBe(truckType._id.toString());
      expect(result.status).toBe('Planned');
      expect(result.totalVolume).toBeCloseTo(0.029, 3);
      expect(result.totalWeight).toBeCloseTo(2.5, 1);
      expect(result.calculatedTrucks).toBeGreaterThan(0);
      expect(result.utilization).toBeGreaterThan(0);
    });

    test('should save calculation to database', async () => {
      const skuQuantities = createSampleSKUQuantities(testSKUs);
      const truckType = testTruckTypes[1];
      const destination = 'Test Warehouse';

      const result = await createCalculationService(destination, skuQuantities, truckType._id);

      // Verify it was saved to database
      const savedCalculation = await Calculation.findById(result._id);
      expect(savedCalculation).toBeDefined();
      expect(savedCalculation.destination).toBe(destination);
    });
  });

  describe('updateCalculationService', () => {
    let existingCalculation;

    beforeEach(async () => {
      existingCalculation = await createTestCalculation(testSKUs, testTruckTypes[0]);
    });

    test('should update destination only', async () => {
      const newDestination = 'Updated Warehouse';

      const result = await updateCalculationService(
        existingCalculation._id,
        newDestination,
        null,
        null,
        null
      );

      expect(result.destination).toBe(newDestination);
      expect(result.skus).toHaveLength(2); // Should remain unchanged
    });

    test('should update status only', async () => {
      const newStatus = 'Shipped';

      const result = await updateCalculationService(
        existingCalculation._id,
        null,
        null,
        null,
        newStatus
      );

      expect(result.status).toBe(newStatus);
      expect(result.destination).toBe(existingCalculation.destination); // Should remain unchanged
    });

    test('should update SKU quantities and truck type', async () => {
      const newSkuQuantities = [{ skuId: testSKUs[2]._id, quantity: 2 }]; // Large boxes
      const newTruckType = testTruckTypes[2]; // Large truck

      const result = await updateCalculationService(
        existingCalculation._id,
        null,
        newSkuQuantities,
        newTruckType._id,
        null
      );

      expect(result.skus).toHaveLength(1);
      expect(result.skus[0].sku._id.toString()).toBe(testSKUs[2]._id.toString());
      expect(result.skus[0].quantity).toBe(2);
      expect(result.truckType._id.toString()).toBe(newTruckType._id.toString());
      expect(result.totalVolume).toBeCloseTo(0.054, 3); // 0.3*0.3*0.3*2
      expect(result.totalWeight).toBeCloseTo(2, 1); // 1*2
    });

    test('should update all fields simultaneously', async () => {
      const newDestination = 'Updated Warehouse';
      const newStatus = 'Shipped';
      const newSkuQuantities = [{ skuId: testSKUs[1]._id, quantity: 1 }];
      const newTruckType = testTruckTypes[1];

      const result = await updateCalculationService(
        existingCalculation._id,
        newDestination,
        newSkuQuantities,
        newTruckType._id,
        newStatus
      );

      expect(result.destination).toBe(newDestination);
      expect(result.status).toBe(newStatus);
      expect(result.skus).toHaveLength(1);
      expect(result.truckType._id.toString()).toBe(newTruckType._id.toString());
    });

    test('should throw error for non-existent calculation', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        updateCalculationService(fakeId, 'New Destination', null, null, null)
      ).rejects.toThrow('Calculation not found.');
    });

    test('should persist changes to database', async () => {
      const newDestination = 'Updated Warehouse';

      await updateCalculationService(
        existingCalculation._id,
        newDestination,
        null,
        null,
        null
      );

      // Verify changes were persisted
      const updatedCalculation = await Calculation.findById(existingCalculation._id);
      expect(updatedCalculation.destination).toBe(newDestination);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty SKU quantities array', async () => {
      const skuQuantities = [];
      const truckType = testTruckTypes[0];

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.totalVolume).toBe(0);
      expect(result.totalWeight).toBe(0);
      expect(result.calculatedTrucks).toBe(1); // Still creates one truck load
      expect(result.trucks).toHaveLength(1);
    });

    test('should handle zero quantity SKU', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 0 }];
      const truckType = testTruckTypes[0];

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.totalVolume).toBe(0);
      expect(result.totalWeight).toBe(0);
    });

    test('should handle very large quantities requiring many trucks', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 10000 }];
      const truckType = testTruckTypes[0]; // Small truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.calculatedTrucks).toBe(4);
      expect(result.totalVolume).toBeCloseTo(10, 1); // 0.1*0.1*0.1*10000
      expect(result.totalWeight).toBeCloseTo(2000, 1); // 0.2*10000
    });
  });
});