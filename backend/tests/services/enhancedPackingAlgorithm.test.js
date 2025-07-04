const {
  simulateTruckPacking,
  getTruckingCalculationDetails,
  getBoxOrientations,
  findBestFit,
  sortItemsForPacking
} = require('../../src/services/calculationService');

const {
  formatFor3DVisualization,
  generatePackingSummary,
  validatePackingConstraints
} = require('../../src/services/visualizationService');

const SKU = require('../../src/models/SKU');
const TruckType = require('../../src/models/TruckType');

// Mock the models
jest.mock('../../src/models/SKU');
jest.mock('../../src/models/TruckType');
jest.mock('../../src/models/Calculation');

describe('Enhanced 3D Packing Algorithm', () => {
  const mockTruckType = {
    _id: 'truck1',
    name: 'Standard Truck',
    length: 1200, // 12m
    width: 240,   // 2.4m  
    height: 250,  // 2.5m
    weightCapacity: 10000 // 10 tons
  };

  const mockSKUs = [
    {
      _id: 'sku1',
      name: 'Large Box',
      length: 100,
      width: 80,
      height: 60,
      weight: 50
    },
    {
      _id: 'sku2', 
      name: 'Medium Box',
      length: 60,
      width: 40,
      height: 30,
      weight: 20
    },
    {
      _id: 'sku3',
      name: 'Small Box',
      length: 30,
      width: 20,
      height: 20,
      weight: 5
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock SKU.findById
    SKU.findById.mockImplementation((id) => {
      return Promise.resolve(mockSKUs.find(sku => sku._id === id));
    });

    // Mock TruckType.findById
    TruckType.findById.mockResolvedValue(mockTruckType);

    // Mock SKU.find for recommendations
    SKU.find.mockResolvedValue(mockSKUs);
  });

  describe('Box Orientation Handling', () => {
    test('should generate all 6 possible orientations for a box', () => {
      const box = { length: 100, width: 80, height: 60 };
      const orientations = getBoxOrientations(box);
      
      expect(orientations).toHaveLength(6);
      
      // Check that all orientations preserve volume
      const originalVolume = box.length * box.width * box.height;
      orientations.forEach(orientation => {
        const orientationVolume = orientation.width * orientation.height * orientation.depth;
        expect(orientationVolume).toBe(originalVolume);
      });

      // Check that we have different orientations
      const uniqueOrientations = new Set(orientations.map(o => o.orientation));
      expect(uniqueOrientations.size).toBe(6);
    });

    test('should find the best fitting orientation for available space', async () => {
      const availableSpaces = [
        { x: 0, y: 0, z: 0, width: 120, height: 70, depth: 90 }
      ];
      
      const box = { length: 100, width: 80, height: 60 };
      const weight = 50;
      
      const fit = findBestFit(
        availableSpaces,
        box,
        weight,
        1000000, // Large volume capacity
        10000,   // Large weight capacity
        0,       // Current volume
        0        // Current weight
      );

      expect(fit).toBeTruthy();
      expect(fit.position).toEqual({ x: 0, y: 0, z: 0 });
      expect(fit.dimensions.width).toBeLessThanOrEqual(120);
      expect(fit.dimensions.height).toBeLessThanOrEqual(70);
      expect(fit.dimensions.depth).toBeLessThanOrEqual(90);
    });
  });

  describe('Enhanced Packing Simulation', () => {
    test('should pack items efficiently with rotation', async () => {
      const skuQuantities = [
        { skuId: 'sku1', quantity: 5 },  // Large boxes
        { skuId: 'sku2', quantity: 10 }, // Medium boxes
        { skuId: 'sku3', quantity: 20 }  // Small boxes
      ];

      const results = await simulateTruckPacking(skuQuantities, mockTruckType);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Check that each truck has detailed information
      results.forEach(truck => {
        expect(truck).toHaveProperty('truckNumber');
        expect(truck).toHaveProperty('volumeUtilization');
        expect(truck).toHaveProperty('weightUtilization');
        expect(truck).toHaveProperty('packedSKUs');
        expect(truck).toHaveProperty('totalBoxes');
        
        // Verify that boxes have position and orientation data
        truck.packedSKUs.forEach(skuGroup => {
          expect(skuGroup).toHaveProperty('boxes');
          skuGroup.boxes.forEach(box => {
            expect(box).toHaveProperty('position');
            expect(box).toHaveProperty('orientation');
            expect(box).toHaveProperty('dimensions');
            expect(box.position).toHaveProperty('x');
            expect(box.position).toHaveProperty('y');
            expect(box.position).toHaveProperty('z');
          });
        });
      });
    });

    test('should minimize truck count by efficient packing', async () => {
      const smallQuantities = [
        { skuId: 'sku3', quantity: 10 } // 10 small boxes
      ];

      const results = await simulateTruckPacking(smallQuantities, mockTruckType);
      
      // Small boxes should fit in a single truck
      expect(results.length).toBe(1);
      expect(results[0].totalBoxes).toBe(10);
    });

    test('should handle large quantities requiring multiple trucks', async () => {
      const largeQuantities = [
        { skuId: 'sku1', quantity: 100 } // 100 large boxes
      ];

      const results = await simulateTruckPacking(largeQuantities, mockTruckType);
      
      expect(results.length).toBeGreaterThan(1);
      
      // Verify all boxes are packed
      const totalBoxesPacked = results.reduce((sum, truck) => sum + truck.totalBoxes, 0);
      expect(totalBoxesPacked).toBe(100);
    });
  });

  describe('Utilization Optimization', () => {
    test('should maximize space and weight utilization', async () => {
      const skuQuantities = [
        { skuId: 'sku1', quantity: 10 },
        { skuId: 'sku2', quantity: 15 },
        { skuId: 'sku3', quantity: 25 }
      ];

      const details = await getTruckingCalculationDetails(
        skuQuantities, 
        'truck1', 
        'Test Destination'
      );

      expect(details).toHaveProperty('trucks');
      expect(details).toHaveProperty('summary');
      
      // Check utilization metrics
      details.trucks.forEach(truck => {
        expect(truck.volumeUtilization).toBeGreaterThan(0);
        expect(truck.weightUtilization).toBeGreaterThan(0);
        expect(truck.overallUtilization).toBeGreaterThan(0);
        
        // Utilization should not exceed 100%
        expect(truck.volumeUtilization).toBeLessThanOrEqual(100);
        expect(truck.weightUtilization).toBeLessThanOrEqual(100);
      });

      // Check summary statistics
      expect(details.summary.averageUtilization).toBeGreaterThan(0);
      expect(details.summary.volumeEfficiency).toBeGreaterThan(0);
      expect(details.summary.weightEfficiency).toBeGreaterThan(0);
    });

    test('should provide optimization recommendations for underutilized trucks', async () => {
      const smallQuantities = [
        { skuId: 'sku3', quantity: 5 } // Few small boxes
      ];

      const details = await getTruckingCalculationDetails(
        smallQuantities, 
        'truck1', 
        'Test Destination'
      );

      // Should have recommendations for underutilized space
      if (details.recommendations && details.recommendations.length > 0) {
        const recommendation = details.recommendations[0];
        expect(recommendation).toHaveProperty('truckNumber');
        expect(recommendation).toHaveProperty('remainingVolume');
        expect(recommendation).toHaveProperty('remainingWeight');
        expect(recommendation).toHaveProperty('suggestedSKUs');
      }
    });
  });

  describe('3D Visualization Support', () => {
    test('should format data for 3D visualization', async () => {
      const skuQuantities = [
        { skuId: 'sku1', quantity: 3 },
        { skuId: 'sku2', quantity: 5 }
      ];

      const packingResults = await getTruckingCalculationDetails(
        skuQuantities, 
        'truck1', 
        'Test Destination'
      );

      const visualizationData = formatFor3DVisualization(packingResults);

      expect(visualizationData).toHaveProperty('truckDimensions');
      expect(visualizationData).toHaveProperty('trucks');
      
      expect(visualizationData.truckDimensions).toEqual({
        length: mockTruckType.length,
        width: mockTruckType.width,
        height: mockTruckType.height
      });

      visualizationData.trucks.forEach(truck => {
        expect(truck).toHaveProperty('packedBoxes');
        expect(truck).toHaveProperty('utilization');
        expect(truck).toHaveProperty('statistics');
        
        truck.packedBoxes.forEach(box => {
          expect(box).toHaveProperty('id');
          expect(box).toHaveProperty('position');
          expect(box).toHaveProperty('dimensions');
          expect(box).toHaveProperty('orientation');
          expect(box).toHaveProperty('color');
          expect(box.color).toMatch(/^#[0-9A-F]{6}$/i); // Valid hex color
        });
      });
    });

    test('should generate packing summary with statistics', async () => {
      const skuQuantities = [
        { skuId: 'sku1', quantity: 2 },
        { skuId: 'sku2', quantity: 3 },
        { skuId: 'sku3', quantity: 5 }
      ];

      const packingResults = await getTruckingCalculationDetails(
        skuQuantities, 
        'truck1', 
        'Test Destination'
      );

      const summary = generatePackingSummary(packingResults);

      expect(summary).toHaveProperty('totalTrucks');
      expect(summary).toHaveProperty('averageUtilization');
      expect(summary).toHaveProperty('efficiency');
      expect(summary).toHaveProperty('truckUtilizations');
      expect(summary).toHaveProperty('skuDistribution');

      // Verify SKU distribution tracking
      Object.keys(summary.skuDistribution).forEach(skuId => {
        const distribution = summary.skuDistribution[skuId];
        expect(distribution).toHaveProperty('skuName');
        expect(distribution).toHaveProperty('totalQuantity');
        expect(distribution).toHaveProperty('truckDistribution');
      });
    });

    test('should validate packing constraints', async () => {
      const skuQuantities = [
        { skuId: 'sku1', quantity: 2 }
      ];

      const packingResults = await getTruckingCalculationDetails(
        skuQuantities, 
        'truck1', 
        'Test Destination'
      );

      const validation = validatePackingConstraints(packingResults);

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('violations');
      
      // Should be valid for reasonable quantities
      expect(validation.isValid).toBe(true);
      expect(validation.violations).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle oversized items gracefully', async () => {
      const oversizedSKU = {
        _id: 'oversized',
        name: 'Oversized Box',
        length: 2000, // Larger than truck
        width: 300,
        height: 300,
        weight: 100
      };

      SKU.findById.mockImplementation((id) => {
        if (id === 'oversized') return Promise.resolve(oversizedSKU);
        return Promise.resolve(mockSKUs.find(sku => sku._id === id));
      });

      const skuQuantities = [{ skuId: 'oversized', quantity: 1 }];

      await expect(
        simulateTruckPacking(skuQuantities, mockTruckType)
      ).rejects.toThrow('too large for the truck type');
    });

    test('should handle weight capacity exceeded', async () => {
      const heavySKU = {
        _id: 'heavy',
        name: 'Heavy Box',
        length: 50,
        width: 50,
        height: 50,
        weight: 15000 // Heavier than truck capacity
      };

      SKU.findById.mockImplementation((id) => {
        if (id === 'heavy') return Promise.resolve(heavySKU);
        return Promise.resolve(mockSKUs.find(sku => sku._id === id));
      });

      const skuQuantities = [{ skuId: 'heavy', quantity: 1 }];

      await expect(
        simulateTruckPacking(skuQuantities, mockTruckType)
      ).rejects.toThrow('too large for the truck type');
    });
  });

  describe('Algorithm Performance', () => {
    test('should sort items optimally for packing', () => {
      const skuDetailsMap = new Map();
      mockSKUs.forEach(sku => skuDetailsMap.set(sku._id, sku));

      const skuQuantities = [
        { skuId: 'sku1', quantity: 2 }, // Large boxes
        { skuId: 'sku2', quantity: 3 }, // Medium boxes  
        { skuId: 'sku3', quantity: 5 }  // Small boxes
      ];

      const sortedItems = sortItemsForPacking(skuQuantities, skuDetailsMap);

      expect(sortedItems).toHaveLength(10); // 2 + 3 + 5
      
      // Larger/heavier items should come first (higher priority)
      expect(sortedItems[0].priority).toBeGreaterThanOrEqual(sortedItems[9].priority);
      
      // Should include all individual boxes
      const skuCounts = {};
      sortedItems.forEach(item => {
        skuCounts[item.skuId] = (skuCounts[item.skuId] || 0) + 1;
      });
      
      expect(skuCounts['sku1']).toBe(2);
      expect(skuCounts['sku2']).toBe(3);
      expect(skuCounts['sku3']).toBe(5);
    });
  });
}); 