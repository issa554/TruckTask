const SKU = require('../models/SKU');
const TruckType = require('../models/TruckType');
const Calculation = require('../models/Calculation');


function createSpace(x, y, z, width, height, depth) {
  return { x, y, z, width, height, depth };
}

function canFit(space, boxWidth, boxHeight, boxDepth) {
  return space.width >= boxWidth && space.height >= boxHeight && space.depth >= boxDepth;
}

function splitSpace(space, boxWidth, boxHeight, boxDepth) {
  const spaces = [];

  if (space.width > boxWidth) {
    spaces.push(createSpace(
      space.x + boxWidth,
      space.y,
      space.z,
      space.width - boxWidth,
      space.height,
      space.depth
    ));
  }

  if (space.height > boxHeight) {
    spaces.push(createSpace(
      space.x,
      space.y + boxHeight,
      space.z,
      space.width,
      space.height - boxHeight,
      space.depth
    ));
  }

  if (space.depth > boxDepth) {
    spaces.push(createSpace(
      space.x,
      space.y,
      space.z + boxDepth,
      space.width,
      space.height,
      space.depth - boxDepth
    ));
  }

  return spaces.filter(s => s.width > 0 && s.height > 0 && s.depth > 0);
}

function calculateEnd(start, count, grid, boxSize) {
  const index = count - 1;
  const xIndex = index % grid.x;
  const yIndex = Math.floor(index / grid.x) % grid.y;
  const zIndex = Math.floor(index / (grid.x * grid.y));

  return {
    x: start.x + xIndex * boxSize.length,
    y: start.y + yIndex * boxSize.height,
    z: start.z + zIndex * boxSize.width
  };
}

const simulateTruckPacking = async (skuQuantities, truckType) => {
  const truckLength = truckType.length;
  const truckWidth = truckType.width;
  const truckHeight = truckType.height;
  const truckVolumeCapacity = truckLength * truckWidth * truckHeight;
  const truckWeightCapacity = truckType.weightCapacity;

  const truckLoads = [];
  const skusToPack = JSON.parse(JSON.stringify(skuQuantities));
  const skuDetailsMap = new Map();

  for (const item of skusToPack) {
    const skuDetails = await SKU.findById(item.skuId);
    skuDetailsMap.set(item.skuId, skuDetails);
  }

  let currentTruck = {
    skus: [],
    placedBoxes: [],
    skuGroups: new Map(),
    currentVolume: 0,
    currentWeight: 0,
    availableSpaces: [createSpace(0, 0, 0, truckLength, truckHeight, truckWidth)]
  };
  truckLoads.push(currentTruck);

  for (const item of skusToPack) {
    const sku = skuDetailsMap.get(item.skuId);
    const { length, width, height, weight } = sku;
    const boxVolume = length * width * height;

    if (boxVolume > truckVolumeCapacity || weight > truckWeightCapacity) {
      throw new Error(`SKU ${sku.name} is too large for the truck.`);
    }

    let quantity = item.quantity;

    while (quantity > 0) {
      let placed = false;

      for (let i = 0; i < currentTruck.availableSpaces.length; i++) {
        const space = currentTruck.availableSpaces[i];

        if (canFit(space, length, height, width) &&
            currentTruck.currentVolume + boxVolume <= truckVolumeCapacity &&
            currentTruck.currentWeight + weight <= truckWeightCapacity) {

          const position = { x: space.x, y: space.y, z: space.z };

          currentTruck.placedBoxes.push({ sku, ...position, length, width, height });

          const skuId = sku._id.toString();
          if (!currentTruck.skuGroups.has(skuId)) {
            currentTruck.skuGroups.set(skuId, {
              sku,
              count: 0,
              positions: [],
              dimensions: { length, width, height },
              weight
            });
          }

          const group = currentTruck.skuGroups.get(skuId);
          group.count++;
          group.positions.push(position);

          currentTruck.currentVolume += boxVolume;
          currentTruck.currentWeight += weight;

          const existing = currentTruck.skus.find(s => s.sku._id.equals(sku._id));
          if (existing) existing.quantity++;
          else currentTruck.skus.push({ sku, quantity: 1 });

          const newSpaces = splitSpace(space, length, height, width);
          currentTruck.availableSpaces.splice(i, 1, ...newSpaces);
          currentTruck.availableSpaces.sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);

          quantity--;
          placed = true;
          break;
        }
      }

      if (!placed) {
        currentTruck = {
          skus: [],
          placedBoxes: [],
          skuGroups: new Map(),
          currentVolume: 0,
          currentWeight: 0,
          availableSpaces: [createSpace(0, 0, 0, truckLength, truckHeight, truckWidth)]
        };
        truckLoads.push(currentTruck);
      }
    }
  }

  return truckLoads.map(truck => {
    const groupedBoxes = [];
    truck.skuGroups.forEach((group, skuId) => {
      const sorted = group.positions.sort((a, b) => a.y - b.y || a.z - b.z || a.x - b.x);
      const start = sorted[0];

      const gridCapacity = {
        x: Math.floor(truckLength / group.dimensions.length),
        y: Math.floor(truckHeight / group.dimensions.height),
        z: Math.floor(truckWidth / group.dimensions.width)
      };

      const end = calculateEnd(start, group.count, gridCapacity, group.dimensions);

      groupedBoxes.push({
        sku: group.sku.name,
        count: group.count,
        dimensions: group.dimensions,
        weight: group.weight,
        positionPattern: {
          start,
          end,
          count: group.count
        },
        gridCapacity
      });
    });

    return {
      skus: truck.skus,
      groupedBoxes,
      currentVolume: truck.currentVolume,
      currentWeight: truck.currentWeight
    };
  });
};

const getTruckingCalculationDetails = async (skuQuantities, truckTypeId, destination) => {
  let totalVolume = 0;
  let totalWeight = 0;

  for (const item of skuQuantities) {
    if (item.quantity < 0) throw new Error(`Quantity cannot be negative.`);
    const sku = await SKU.findById(item.skuId);
    if (!sku) throw new Error(`SKU ${item.skuId} not found.`);
    totalVolume += sku.length * sku.width * sku.height * item.quantity;
    totalWeight += sku.weight * item.quantity;
  }

  const truckType = await TruckType.findById(truckTypeId);
  if (!truckType) throw new Error(`TruckType ${truckTypeId} not found.`);

  const truckVolume = truckType.length * truckType.width * truckType.height;
  const truckWeightCapacity = truckType.weightCapacity;

  const truckLoads = await simulateTruckPacking(skuQuantities, truckType);
  const recommendations = [];

  const trucks = await Promise.all(truckLoads.map(async (truck, i) => {
    const volUtil = (truck.currentVolume / truckVolume) * 100;
    const wtUtil = (truck.currentWeight / truckWeightCapacity) * 100;
    const utilization = Math.max(volUtil, wtUtil);
    const remainingCapacityTruck = getRemainingCapacity(
      truck.currentVolume,
      truck.currentWeight,
      truckVolume,
      truckWeightCapacity
    );
  
    if (utilization < 100) {
      const recommendationForTruck = await getOptimizationRecommendations(
        remainingCapacityTruck.remainingVolume,
        remainingCapacityTruck.remainingWeight
      );
  
      if (recommendationForTruck.length > 0) {
        for (const rec of recommendationForTruck) {
          const existingRec = recommendations.find(r => r.sku._id.toString() === rec.sku._id.toString());
          if (existingRec) {
            existingRec.maxQuantity += rec.maxQuantity;
          } else {
            recommendations.push(rec);
          }
        }
      }
    }
  
    return {
      truck: i + 1,
      utilization: parseFloat(utilization.toFixed(1)),
      groupedBoxes: truck.groupedBoxes,
    };
  }));
  



  return {
    destination,
    truckType,
    totalVolume,
    totalWeight,
    calculatedTrucks: trucks.length,
    truckVolume,
    truckWeightCapacity,
    trucks,
    recommendations
  };
};



const getRemainingCapacity = (totalVolume, totalWeight, truckVolume, truckWeightCapacity) => {
  const remainingVolume = truckVolume - totalVolume;
  const remainingWeight = truckWeightCapacity - totalWeight;
  return {
    remainingVolume: Math.max(0, remainingVolume),
    remainingWeight: Math.max(0, remainingWeight)
  };
};

const getOptimizationRecommendations = async (remainingVolume, remainingWeight) => {
  const allSKUs = await SKU.find({});
  const recommendations = [];

  for (const sku of allSKUs) {
    const skuVolume = sku.length * sku.width * sku.height;
    const skuWeight = sku.weight;

    if (skuVolume > 0 && skuWeight > 0) {
      const maxQuantityByVolume = Math.floor(remainingVolume / skuVolume);
      const maxQuantityByWeight = Math.floor(remainingWeight / skuWeight);

      const maxQuantity = Math.min(maxQuantityByVolume, maxQuantityByWeight);

      if (maxQuantity > 0) {
        recommendations.push({
          sku: sku,
          maxQuantity: maxQuantity
        });
      }
    }
  }


  return recommendations;
};  
const createCalculationService = async (destination, skuQuantities, truckTypeId) => {
  const { totalVolume, totalWeight, calculatedTrucks, truckVolume, truckWeightCapacity, trucks } = await getTruckingCalculationDetails(skuQuantities, truckTypeId , destination);
  const truckType = await TruckType.findById(truckTypeId);

  const newCalculation = new Calculation({
    destination,
    skus: skuQuantities.map(item => ({ sku: item.skuId, quantity: item.quantity })),
    truckType: truckTypeId,
    calculatedTrucks: calculatedTrucks,
    totalVolume,
    totalWeight,
    utilization: trucks.reduce((sum, truck) => sum + truck.utilization, 0) / trucks.length
  });

  await newCalculation.save();

  // Convert the Mongoose document to a plain JS object, including virtuals and getters
  const calculationObj = newCalculation.toObject({ getters: true, virtuals: true });

  // Populate truckType as a plain object
  const truckTypeObj = truckType ? (truckType.toObject ? truckType.toObject() : truckType) : null;

  // Populate skus as array of { sku: <skuDoc>, quantity }
  const skus = await Promise.all(
    skuQuantities.map(async item => {
      const skuDoc = await SKU.findById(item.skuId).lean();
      if (!skuDoc) throw new Error(`SKU ${item.skuId} not found.`);
      return {
        sku: skuDoc,
        quantity: item.quantity
      };
    })
  );

  // Return a clean object with only the needed fields
  return {
    _id: calculationObj._id,
    destination: calculationObj.destination,
    skus,
    truckType: truckTypeObj,
    calculatedTrucks: calculationObj.calculatedTrucks,
    totalVolume: calculationObj.totalVolume,
    totalWeight: calculationObj.totalWeight,
    utilization: calculationObj.utilization,
    status: calculationObj.status,
    createdAt: calculationObj.createdAt,
    updatedAt: calculationObj.updatedAt
  };
  
};

const updateCalculationService = async (id, destination, skuQuantities, truckTypeId, status) => {
  // Input validation
  if (!id) {
    throw new Error('Calculation ID is required.');
  }

  // Find the calculation first
  const calculation = await Calculation.findById(id);
  if (!calculation) {
    throw new Error('Calculation not found.');
  }

  // Track what needs to be updated
  const needsRecalculation = skuQuantities && truckTypeId;
  let truckType = null;

  // If we need to recalculate, validate truck type exists first
  if (needsRecalculation) {
    truckType = await TruckType.findById(truckTypeId);
    if (!truckType) {
      throw new Error(`TruckType ${truckTypeId} not found.`);
    }
  }

  // Update simple fields
  if (destination !== undefined && destination !== null) {
    calculation.destination = destination;
  }
  if (status !== undefined && status !== null) {
    calculation.status = status;
  }

  // Handle recalculation if SKUs and truck type are provided
  if (needsRecalculation) {
    // Validate SKU quantities
    if (!Array.isArray(skuQuantities)) {
      throw new Error('SKU quantities must be an array.');
    }

    // Perform calculation with the provided data
    const calculationDetails = await getTruckingCalculationDetails(
      skuQuantities, 
      truckTypeId, 
      destination || calculation.destination
    );

    // Update calculation fields
    calculation.skus = skuQuantities.map(item => ({ 
      sku: item.skuId, 
      quantity: item.quantity 
    }));
    calculation.truckType = truckTypeId;
    calculation.calculatedTrucks = calculationDetails.calculatedTrucks;
    calculation.totalVolume = calculationDetails.totalVolume;
    calculation.totalWeight = calculationDetails.totalWeight;
    calculation.utilization = calculationDetails.trucks.reduce(
      (sum, truck) => sum + truck.utilization, 0
    ) / calculationDetails.trucks.length;
  }

  // Save the updated calculation
  await calculation.save();

  // Handle status-only updates (backward compatibility)
  if (!needsRecalculation && status) {
    return {
      message: "Status updated successfully",
      ...calculation.toObject()
    };
  }

  // Return populated calculation result
  return await populateCalculationForResponse(calculation, skuQuantities, truckType);
};

// Helper function to populate calculation data for response
const populateCalculationForResponse = async (calculation, skuQuantities, truckType) => {
  // If no skuQuantities provided, get them from the saved calculation
  const skuQuantitiesToUse = skuQuantities || calculation.skus.map(item => ({
    skuId: item.sku,
    quantity: item.quantity
  }));

  // Get truck type if not already provided
  const truckTypeToUse = truckType || await TruckType.findById(calculation.truckType);
  
  // Populate SKUs with full details
  const skus = await Promise.all(
    skuQuantitiesToUse.map(async item => {
      const skuDoc = await SKU.findById(item.skuId).lean();
      if (!skuDoc) {
        throw new Error(`SKU ${item.skuId} not found.`);
      }
      return {
        sku: skuDoc,
        quantity: item.quantity
      };
    })
  );

  // Return clean response object
  return {
    _id: calculation._id,
    destination: calculation.destination,
    skus,
    truckType: truckTypeToUse ? (truckTypeToUse.toObject ? truckTypeToUse.toObject() : truckTypeToUse) : null,
    calculatedTrucks: calculation.calculatedTrucks,
    totalVolume: calculation.totalVolume,
    totalWeight: calculation.totalWeight,
    utilization: calculation.utilization,
    status: calculation.status,
    createdAt: calculation.createdAt,
    updatedAt: calculation.updatedAt
  };
};

const getPlannedShipments = async (destination) => {
  const existingPlannedCalculation = await Calculation.find({ destination, status: 'Planned' });

    if (existingPlannedCalculation.length > 0) {
      return {message: 'A planned shipment already exists for this destination.', existingCalculations: existingPlannedCalculation};
    } else {
      return {message: 'No planned shipment found for this destination. Proceed with new calculation.'};
    }
};

module.exports = {
  createCalculationService,
  updateCalculationService,
  getTruckingCalculationDetails,
  getOptimizationRecommendations,
  getRemainingCapacity,
  simulateTruckPacking,
  splitSpace,
  canFit,
  createSpace,
  populateCalculationForResponse,
  calculateEnd,
  getPlannedShipments
}; 