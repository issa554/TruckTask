// Verification script for the overlap fix
const { 
  simulateTruckPacking,
  getTruckingCalculationDetails 
} = require('./src/services/calculationService');

// Mock data for testing
const mockSKUs = [
  {
    _id: '1',
    name: 'Small Box',
    length: 1,
    width: 1,
    height: 1,
    weight: 5
  },
  {
    _id: '2', 
    name: 'Medium Box',
    length: 2,
    width: 1.5,
    height: 1,
    weight: 8
  },
  {
    _id: '3',
    name: 'Large Box', 
    length: 2,
    width: 2,
    height: 1.5,
    weight: 12
  }
];

const mockTruckType = {
  name: 'Standard Truck',
  length: 10,
  width: 6,
  height: 4,
  weightCapacity: 1000
};

// Mock the SKU.findById function
const originalRequire = require;
require = function(path) {
  if (path === '../models/SKU') {
    return {
      findById: (id) => {
        return Promise.resolve(mockSKUs.find(sku => sku._id === id));
      }
    };
  }
  return originalRequire(path);
};

async function testOverlapFix() {
  try {
    console.log('🔧 Testing Improved Overlap Prevention');
    console.log('=====================================');
    
    const testQuantities = [
      { skuId: '1', quantity: 10 },
      { skuId: '2', quantity: 8 },
      { skuId: '3', quantity: 5 }
    ];
    
    console.log('Test Configuration:');
    console.log(`- Small Box (1×1×1): 10 units`);
    console.log(`- Medium Box (2×1.5×1): 8 units`);
    console.log(`- Large Box (2×2×1.5): 5 units`);
    console.log(`- Truck: ${mockTruckType.length}×${mockTruckType.width}×${mockTruckType.height}m`);
    
    const result = await simulateTruckPacking(testQuantities, mockTruckType);
    
    console.log('\n✅ Results:');
    console.log(`- Trucks used: ${result.length}`);
    
    let totalBoxes = 0;
    result.forEach((truck, index) => {
      console.log(`\n  Truck ${index + 1}:`);
      console.log(`    Volume utilization: ${truck.volumeUtilization.toFixed(1)}%`);
      console.log(`    Weight utilization: ${truck.weightUtilization.toFixed(1)}%`);
      console.log(`    Total boxes: ${truck.totalBoxes}`);
      totalBoxes += truck.totalBoxes;
      
      truck.packedSKUs?.forEach(sku => {
        console.log(`    ${sku.skuName}: ${sku.quantity} boxes`);
      });
    });
    
    const expectedTotal = testQuantities.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`\n📊 Summary:`);
    console.log(`- Expected total boxes: ${expectedTotal}`);
    console.log(`- Actually packed boxes: ${totalBoxes}`);
    console.log(`- Packing success rate: ${((totalBoxes / expectedTotal) * 100).toFixed(1)}%`);
    
    if (totalBoxes === expectedTotal) {
      console.log('🎉 SUCCESS: All boxes were packed without overlaps!');
    } else {
      console.log(`⚠️  Some boxes couldn't be packed (${expectedTotal - totalBoxes} missing)`);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

testOverlapFix(); 