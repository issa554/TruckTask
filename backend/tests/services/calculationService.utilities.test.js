const {
  getTruckingCalculationDetails,
  getOptimizationRecommendations,
  getRemainingCapacity,
  simulateTruckPacking,
  calculateEnd,
  splitSpace,
  canFit,
  createSpace
} = require('../../src/services/calculationService');

const {
  createTestSKUs,
  createTestTruckTypes
} = require('../utils/testHelpers');


describe('CalculationService Utility Functions', () => {
  describe('createSpace', () => {
    test('should create space object with correct properties', () => {
      const space = createSpace(10, 20, 30, 100, 200, 300);
      
      expect(space).toEqual({
        x: 10,
        y: 20,
        z: 30,
        width: 100,
        height: 200,
        depth: 300
      });
    });

    test('should handle zero coordinates', () => {
      const space = createSpace(0, 0, 0, 50, 60, 70);
      
      expect(space.x).toBe(0);
      expect(space.y).toBe(0);
      expect(space.z).toBe(0);
      expect(space.width).toBe(50);
      expect(space.height).toBe(60);
      expect(space.depth).toBe(70);
    });

    test('should handle negative coordinates', () => {
      const space = createSpace(-10, -20, -30, 100, 200, 300);
      
      expect(space.x).toBe(-10);
      expect(space.y).toBe(-20);
      expect(space.z).toBe(-30);
    });
  });

  describe('canFit', () => {
    let space;

    beforeEach(() => {
      space = createSpace(0, 0, 0, 100, 200, 300);
    });

    test('should return true when box fits exactly', () => {
      const result = canFit(space, 100, 200, 300);
      expect(result).toBe(true);
    });

    test('should return true when box is smaller than space', () => {
      const result = canFit(space, 50, 100, 150);
      expect(result).toBe(true);
    });

    test('should return false when box width is too large', () => {
      const result = canFit(space, 150, 100, 200);
      expect(result).toBe(false);
    });

    test('should return false when box height is too large', () => {
      const result = canFit(space, 50, 250, 200);
      expect(result).toBe(false);
    });

    test('should return false when box depth is too large', () => {
      const result = canFit(space, 50, 100, 350);
      expect(result).toBe(false);
    });

    test('should return false when multiple dimensions are too large', () => {
      const result = canFit(space, 150, 250, 350);
      expect(result).toBe(false);
    });

    test('should handle edge case with zero-sized box', () => {
      const result = canFit(space, 0, 0, 0);
      expect(result).toBe(true);
    });

    test('should handle edge case with zero-sized space', () => {
      const zeroSpace = createSpace(0, 0, 0, 0, 0, 0);
      const result = canFit(zeroSpace, 10, 10, 10);
      expect(result).toBe(false);
    });
  });

  describe('splitSpace', () => {
    let space;

    beforeEach(() => {
      space = createSpace(0, 0, 0, 100, 200, 300);
    });

    test('should split space correctly when box is smaller in all dimensions', () => {
      const result = splitSpace(space, 50, 100, 150);
      
      expect(result).toHaveLength(3);
      
      // Check width split (remaining width space)
      expect(result[0]).toEqual({
        x: 50, y: 0, z: 0,
        width: 50, height: 200, depth: 300
      });
      
      // Check height split (remaining height space)
      expect(result[1]).toEqual({
        x: 0, y: 100, z: 0,
        width: 100, height: 100, depth: 300
      });
      
      // Check depth split (remaining depth space)
      expect(result[2]).toEqual({
        x: 0, y: 0, z: 150,
        width: 100, height: 200, depth: 150
      });
    });

    test('should return only necessary splits when box matches some dimensions', () => {
      const result = splitSpace(space, 100, 100, 150); // Width matches exactly
      
      expect(result).toHaveLength(2); // Only height and depth splits
      
      expect(result[0]).toEqual({
        x: 0, y: 100, z: 0,
        width: 100, height: 100, depth: 300
      });
      
      expect(result[1]).toEqual({
        x: 0, y: 0, z: 150,
        width: 100, height: 200, depth: 150
      });
    });

    test('should return empty array when box matches space exactly', () => {
      const result = splitSpace(space, 100, 200, 300);
      expect(result).toHaveLength(0);
    });

    test('should filter out zero-sized spaces', () => {
      // Create a space and split with same width
      const result = splitSpace(space, 100, 50, 50);
      
      // Should only have height and depth splits (width split would be 0)
      expect(result).toHaveLength(2);
      expect(result.every(s => s.width > 0 && s.height > 0 && s.depth > 0)).toBe(true);
    });

    test('should handle edge case with very small remaining spaces', () => {
      const result = splitSpace(space, 99, 199, 299);
      
      expect(result).toHaveLength(3);
      expect(result[0].width).toBe(1);
      expect(result[1].height).toBe(1);
      expect(result[2].depth).toBe(1);
    });

    test('should maintain position relationships correctly', () => {
      const offsetSpace = createSpace(10, 20, 30, 100, 200, 300);
      const result = splitSpace(offsetSpace, 50, 100, 150);
      
      expect(result[0].x).toBe(60); // 10 + 50
      expect(result[1].y).toBe(120); // 20 + 100
      expect(result[2].z).toBe(180); // 30 + 150
    });
  });

  describe('calculateEnd', () => {
    test('should calculate end position for single box', () => {
      const start = { x: 0, y: 0, z: 0 };
      const grid = { x: 10, y: 10, z: 10 };
      const boxSize = { length: 20, height: 30, width: 40 };
      
      const result = calculateEnd(start, 1, grid, boxSize);
      
      expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });

    test('should calculate end position for multiple boxes in x direction', () => {
      const start = { x: 0, y: 0, z: 0 };
      const grid = { x: 5, y: 5, z: 5 };
      const boxSize = { length: 10, height: 20, width: 30 };
      
      const result = calculateEnd(start, 3, grid, boxSize);
      
      expect(result.x).toBe(20); // 0 + 2 * 10
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    test('should calculate end position for boxes wrapping to next row', () => {
      const start = { x: 0, y: 0, z: 0 };
      const grid = { x: 3, y: 3, z: 3 };
      const boxSize = { length: 10, height: 20, width: 30 };
      
      const result = calculateEnd(start, 5, grid, boxSize); // Wraps to second row
      
      expect(result.x).toBe(10); // index 4: 4 % 3 = 1, so 1 * 10
      expect(result.y).toBe(20); // floor(4/3) % 3 = 1, so 1 * 20
      expect(result.z).toBe(0);
    });

    test('should calculate end position for boxes wrapping to next layer', () => {
      const start = { x: 5, y: 10, z: 15 };
      const grid = { x: 2, y: 2, z: 2 };
      const boxSize = { length: 10, height: 20, width: 30 };
      
      const result = calculateEnd(start, 9, grid, boxSize); // Index 8, wraps to second layer
      
      // Index 8: 8 % 2 = 0, floor(8/2) % 2 = 0, floor(8/4) = 2
      expect(result.x).toBe(5); // 5 + 0 * 10
      expect(result.y).toBe(10); // 10 + 0 * 20  
      expect(result.z).toBe(75); // 15 + 2 * 30 = 75
    });

    test('should handle large counts correctly', () => {
      const start = { x: 0, y: 0, z: 0 };
      const grid = { x: 10, y: 10, z: 10 };
      const boxSize = { length: 5, height: 5, width: 5 };
      
      const result = calculateEnd(start, 100, grid, boxSize);
      
      // Index 99: 99 % 10 = 9, floor(99/10) % 10 = 9, floor(99/100) = 0
      expect(result.x).toBe(45); // 0 + 9 * 5
      expect(result.y).toBe(45); // 0 + 9 * 5
      expect(result.z).toBe(0);  // 0 + 0 * 5
    });

    test('should handle offset start positions', () => {
      const start = { x: 100, y: 200, z: 300 };
      const grid = { x: 3, y: 3, z: 3 };
      const boxSize = { length: 10, height: 15, width: 20 };
      
      const result = calculateEnd(start, 4, grid, boxSize);
      
      // Index 3: 3 % 3 = 0, floor(3/3) % 3 = 1, floor(3/9) = 0
      expect(result.x).toBe(100); // 100 + 0 * 10
      expect(result.y).toBe(215); // 200 + 1 * 15
      expect(result.z).toBe(300); // 300 + 0 * 20
    });
  });

  describe('getRemainingCapacity', () => {
    test('should calculate remaining capacity correctly when partially used', () => {
      const result = getRemainingCapacity(500, 1000, 1000, 2000);
      
      expect(result.remainingVolume).toBe(500);
      expect(result.remainingWeight).toBe(1000);
    });

    test('should return zero when capacity is fully used', () => {
      const result = getRemainingCapacity(1000, 2000, 1000, 2000);
      
      expect(result.remainingVolume).toBe(0);
      expect(result.remainingWeight).toBe(0);
    });

    test('should return zero when usage exceeds capacity', () => {
      const result = getRemainingCapacity(1500, 2500, 1000, 2000);
      
      expect(result.remainingVolume).toBe(0);
      expect(result.remainingWeight).toBe(0);
    });

    test('should handle zero usage correctly', () => {
      const result = getRemainingCapacity(0, 0, 1000, 2000);
      
      expect(result.remainingVolume).toBe(1000);
      expect(result.remainingWeight).toBe(2000);
    });

    test('should handle fractional values correctly', () => {
      const result = getRemainingCapacity(250.5, 750.25, 1000, 2000);
      
      expect(result.remainingVolume).toBe(749.5);
      expect(result.remainingWeight).toBe(1249.75);
    });
  });

  describe('getOptimizationRecommendations', () => {
    let testSKUs;

    beforeEach(async () => {
      testSKUs = await createTestSKUs();
    });

    test('should return recommendations for SKUs that fit within remaining capacity', async () => {
      const remainingVolume = 10000; // Large enough for test SKUs
      const remainingWeight = 100; // Large enough for test SKUs

      const recommendations = await getOptimizationRecommendations(remainingVolume, remainingWeight);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Check that each recommendation has required properties
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('sku');
        expect(rec).toHaveProperty('maxQuantity');
        expect(rec.maxQuantity).toBeGreaterThan(0);
        expect(typeof rec.maxQuantity).toBe('number');
      });
    });

    test('should return empty array when no SKUs fit', async () => {
      const remainingVolume = 1; // Too small for any SKU
      const remainingWeight = 0.1; // Too small for any SKU

      const recommendations = await getOptimizationRecommendations(remainingVolume, remainingWeight);

      expect(recommendations).toEqual([]);
    });

    test('should calculate max quantity correctly based on volume constraint', async () => {
      // Assuming first test SKU has specific dimensions, let's test with known capacity
      const sku = testSKUs[0];
      const skuVolume = sku.length * sku.width * sku.height;
      const remainingVolume = skuVolume * 5; // Should allow 5 units
      const remainingWeight = sku.weight * 10; // Weight is not the limiting factor

      const recommendations = await getOptimizationRecommendations(remainingVolume, remainingWeight);

      const skuRecommendation = recommendations.find(rec => rec.sku._id.equals(sku._id));
      expect(skuRecommendation).toBeDefined();
      expect(skuRecommendation.maxQuantity).toBe(5);
    });

    test('should calculate max quantity correctly based on weight constraint', async () => {
      const sku = testSKUs[0];
      const skuVolume = sku.length * sku.width * sku.height;
      const remainingVolume = skuVolume * 10; // Volume is not the limiting factor
      const remainingWeight = sku.weight * 3; // Should allow 3 units

      const recommendations = await getOptimizationRecommendations(remainingVolume, remainingWeight);

      const skuRecommendation = recommendations.find(rec => rec.sku._id.equals(sku._id));
      expect(skuRecommendation).toBeDefined();
      expect(skuRecommendation.maxQuantity).toBe(3);
    });

    test('should use the most restrictive constraint', async () => {
      const sku = testSKUs[0];
      const skuVolume = sku.length * sku.width * sku.height;
      const remainingVolume = skuVolume * 2; // Allows 2 units by volume
      const remainingWeight = sku.weight * 5; // Allows 5 units by weight

      const recommendations = await getOptimizationRecommendations(remainingVolume, remainingWeight);

      const skuRecommendation = recommendations.find(rec => rec.sku._id.equals(sku._id));
      expect(skuRecommendation).toBeDefined();
      expect(skuRecommendation.maxQuantity).toBe(2); // Limited by volume
    });

    test('should exclude SKUs with zero volume or weight', async () => {
      const remainingVolume = 10000;
      const remainingWeight = 10000;

      const recommendations = await getOptimizationRecommendations(remainingVolume, remainingWeight);

      // All recommendations should have positive volume and weight
      recommendations.forEach(rec => {
        const skuVolume = rec.sku.length * rec.sku.width * rec.sku.height;
        expect(skuVolume).toBeGreaterThan(0);
        expect(rec.sku.weight).toBeGreaterThan(0);
      });
    });
  });

  describe('simulateTruckPacking', () => {
    let testSKUs, testTruckTypes;

    beforeEach(async () => {
      testSKUs = await createTestSKUs();
      testTruckTypes = await createTestTruckTypes();
    });

    test('should pack single SKU type successfully', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 3 }];
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await simulateTruckPacking(skuQuantities, truckType);

      expect(result).toHaveLength(1); // Should fit in one truck
      expect(result[0].skus).toHaveLength(1);
      expect(result[0].skus[0].quantity).toBe(3);
      expect(result[0].groupedBoxes).toHaveLength(1);
      expect(result[0].groupedBoxes[0].count).toBe(3);
    });

    test('should handle multiple SKU types', async () => {
      const skuQuantities = [
        { skuId: testSKUs[0]._id, quantity: 2 },
        { skuId: testSKUs[1]._id, quantity: 1 }
      ];
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await simulateTruckPacking(skuQuantities, truckType);

      expect(result).toHaveLength(1); // Should fit in one truck
      expect(result[0].skus).toHaveLength(2);
      expect(result[0].groupedBoxes).toHaveLength(2);
      
      // Verify total quantities
      const totalPacked = result[0].skus.reduce((sum, sku) => sum + sku.quantity, 0);
      expect(totalPacked).toBe(3);
    });

    test('should create multiple trucks when capacity exceeded', async () => {
      const skuQuantities = [{ skuId: testSKUs[3]._id, quantity: 250 }]; // Large quantity
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await simulateTruckPacking(skuQuantities, truckType);

      expect(result.length).toBeGreaterThan(1); // Should need multiple trucks
      
      // Verify all items are packed
      const totalPacked = result.reduce((sum, truck) => {
        return sum + truck.skus.reduce((truckSum, sku) => truckSum + sku.quantity, 0);
      }, 0);
      expect(totalPacked).toBe(250);
    });

    test('should respect weight capacity', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 1 }];
      const truckType = testTruckTypes[0]; // Small truck

      const result = await simulateTruckPacking(skuQuantities, truckType);

      result.forEach(truck => {
        expect(truck.currentWeight).toBeLessThanOrEqual(truckType.weightCapacity);
      });
    });

    test('should respect volume capacity', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 1 }];
      const truckType = testTruckTypes[0]; // Small truck

      const result = await simulateTruckPacking(skuQuantities, truckType);
      const truckVolume = truckType.length * truckType.width * truckType.height;

      result.forEach(truck => {
        expect(truck.currentVolume).toBeLessThanOrEqual(truckVolume);
      });
    });

    test('should throw error for SKU too large for truck', async () => {
      // Create a mock large SKU that won't fit
      const skuQuantities = [{ skuId: testSKUs[4]._id, quantity: 1 }];
      const smallTruck = {
        length: 1,
        width: 1,
        height: 1,
        weightCapacity: 1
      };

      await expect(simulateTruckPacking(skuQuantities, smallTruck))
        .rejects.toThrow('is too large for the truck');
    });

    test('should maintain proper space management', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 2 }];
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await simulateTruckPacking(skuQuantities, truckType);

      expect(result[0].groupedBoxes[0].positionPattern).toBeDefined();
      expect(result[0].groupedBoxes[0].positionPattern.start).toBeDefined();
      expect(result[0].groupedBoxes[0].positionPattern.end).toBeDefined();
      expect(result[0].groupedBoxes[0].gridCapacity).toBeDefined();
    });

    test('should handle zero quantity gracefully', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 0 }];
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await simulateTruckPacking(skuQuantities, truckType);

      expect(result).toHaveLength(1); // One empty truck
      expect(result[0].skus).toHaveLength(0);
      expect(result[0].groupedBoxes).toHaveLength(0);
      expect(result[0].currentVolume).toBe(0);
      expect(result[0].currentWeight).toBe(0);
    });
  });

  describe('Integration with simulateTruckPacking', () => {
    let testSKUs, testTruckTypes;

    beforeEach(async () => {
      testSKUs = await createTestSKUs();
      testTruckTypes = await createTestTruckTypes();
    });

    test('should use utility functions correctly in truck packing simulation', async () => {
      const skuQuantities = [{ skuId: testSKUs[0]._id, quantity: 5 }];
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      // Verify the simulation worked correctly
      expect(result.trucks).toHaveLength(1);
      expect(result.trucks[0].groupedBoxes).toHaveLength(1);
      
      const groupedBox = result.trucks[0].groupedBoxes[0];
      expect(groupedBox.count).toBe(5);
      expect(groupedBox.positionPattern).toBeDefined();
      expect(groupedBox.positionPattern.start).toBeDefined();
      expect(groupedBox.positionPattern.end).toBeDefined();
    });

    test('should handle space splitting correctly with multiple SKU types', async () => {
      const skuQuantities = [
        { skuId: testSKUs[0]._id, quantity: 2 }, // Small boxes
        { skuId: testSKUs[1]._id, quantity: 1 }  // Medium box
      ];
      const truckType = testTruckTypes[1]; // Medium truck

      const result = await getTruckingCalculationDetails(skuQuantities, truckType._id);

      expect(result.trucks).toHaveLength(1);
      expect(result.trucks[0].groupedBoxes).toHaveLength(2);
      
      // Verify all items were placed
      const totalPlaced = result.trucks[0].groupedBoxes.reduce((sum, group) => sum + group.count, 0);
      expect(totalPlaced).toBe(3);
    });
  });
}); 