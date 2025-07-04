import { Canvas } from "@react-three/fiber"
import { OrbitControls, Box, Text, Environment, Grid } from "@react-three/drei"
import { useState } from "react"
import { ChevronDown, Truck, Package, TrendingUp } from "lucide-react"

// Color mapping for different SKUs
const skuColors = {
  Mouse: "#3b82f6", // Blue
  Monitor: "#ef4444", // Red
  Laptop: "#22c55e", // Green
  Keyboard: "#7c3aed", // Purple
  Speaker: "#f59e0b", // Amber
  Webcam: "#06b6d4", // Cyan
  Headset: "#84cc16", // Lime
  Tablet: "#ec4899", // Pink
}

// Fallback colors for additional SKUs
const fallbackColors = ["#6366f1", "#8b5cf6", "#d946ef", "#f97316", "#eab308", "#10b981", "#06b6d4", "#64748b"]

function TruckContainer({ truck }) {
  const { length, width, height } = truck

  return (
    <group>
      {/* Truck container wireframe */}
      <Box args={[length, height, width]} position={[length / 2, height / 2, width / 2]}>
        <meshBasicMaterial wireframe color="#666666" />
      </Box>

      {/* Floor */}
      <Box args={[length, 0.02, width]} position={[length / 2, 0.01, width / 2]}>
        <meshStandardMaterial color="#8b5cf6" opacity={0.3} transparent />
      </Box>

      {/* Grid on floor for reference */}
      <Grid
        args={[length, width]}
        position={[length / 2, 0.02, width / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#666666"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#999999"
      />
    </group>
  )
}

function CargoBoxes({ packedSKUs, groupedBoxes, skus, showSku, showAllBoxes = true }) {
  const generateBoxPositions = (orientGroup) => {
    // If individual positions are provided (small quantities), use them directly
    if (orientGroup.positions && orientGroup.positions.length > 0) {
      return orientGroup.positions
    }
    
    // For larger quantities, generate precise grid positions within the placement area
    const { start, end } = orientGroup.placementArea
    const count = orientGroup.count
    const positions = []
    
    if (count === 1) {
      return [start]
    }
    
    // Calculate box dimensions for proper spacing
    const boxWidth = orientGroup.dimensions.width
    const boxHeight = orientGroup.dimensions.height
    const boxDepth = orientGroup.dimensions.depth
    
    // Use gridCapacity if available, otherwise calculate from placement area
    let xBoxes, yBoxes, zBoxes
    
    if (orientGroup.gridCapacity) {
      // Use the gridCapacity constraints provided by the backend
      xBoxes = orientGroup.gridCapacity.x
      yBoxes = orientGroup.gridCapacity.y
      zBoxes = orientGroup.gridCapacity.z
    } else {
      // Fallback: calculate from placement area dimensions
      xBoxes = Math.max(1, Math.floor((end.x - start.x + boxWidth) / boxWidth))
      yBoxes = Math.max(1, Math.floor((end.y - start.y + boxHeight) / boxHeight))
      zBoxes = Math.max(1, Math.floor((end.z - start.z + boxDepth) / boxDepth))
    }
    
    // Generate positions using proper box spacing and grid constraints
    let boxCount = 0
    for (let z = 0; z < zBoxes && boxCount < count; z++) {
      for (let y = 0; y < yBoxes && boxCount < count; y++) {
        for (let x = 0; x < xBoxes && boxCount < count; x++) {
          positions.push({
            x: start.x + x * boxWidth,
            y: start.y + y * boxHeight,
            z: start.z + z * boxDepth
          })
          boxCount++
        }
      }
    }
    
    return positions.slice(0, count) // Ensure we don't exceed the actual count
  }

  // Handle new compact format
  if (packedSKUs) {
    return (
      <group>
        {packedSKUs.map((skuGroup, skuIndex) => {
          if (!showSku[skuGroup.skuName]) return null

          const color = skuColors[skuGroup.skuName] || fallbackColors[skuIndex % fallbackColors.length] || "#666666"

          return (
            <group key={skuIndex}>
              {skuGroup.orientationGroups.map((orientGroup, orientIndex) => {
                const positions = generateBoxPositions(orientGroup)
                
                return (
                  <group key={`${skuIndex}-${orientIndex}`}>
                    {positions.map((position, posIndex) => (
                      <Box
                        key={`${skuIndex}-${orientIndex}-${posIndex}`}
                        args={[
                          orientGroup.dimensions.width,
                          orientGroup.dimensions.height,
                          orientGroup.dimensions.depth
                        ]}
                        position={[
                          position.x + orientGroup.dimensions.width / 2,
                          position.y + orientGroup.dimensions.height / 2,
                          position.z + orientGroup.dimensions.depth / 2,
                        ]}
                      >
                        <meshStandardMaterial 
                          color={color} 
                          opacity={0.8} 
                          transparent 
                        />
                      </Box>
                    ))}
                    
                    {/* Add count label for orientation groups */}
                    {orientGroup.count > 10 && (
                      <Text
                        position={[
                          orientGroup.placementArea.start.x,
                          orientGroup.placementArea.end.y + 0.5,
                          orientGroup.placementArea.start.z
                        ]}
                        fontSize={0.15}
                        color="#333333"
                        anchorX="left"
                        anchorY="bottom"
                      >
                        {`${orientGroup.count} boxes (${orientGroup.orientation})`}
                      </Text>
                    )}
                  </group>
                )
              })}
            </group>
          )
        })}
      </group>
    )
  }

  // Fallback for legacy format
  if (groupedBoxes) {
    return (
      <group>
        {groupedBoxes.map((box, boxIndex) => {
          if (!showSku[box.sku]) return null

          const color = skuColors[box.sku] || fallbackColors[boxIndex % fallbackColors.length] || "#666666"
          
          // Generate positions for legacy format
          const positions = []
          if (box.positionPattern && box.dimensions) {
            const { start } = box.positionPattern
            const count = Math.min(box.count || 1, 20)
            
            // Use gridCapacity if available, otherwise fallback to hardcoded values
            const gridCapacity = box.gridCapacity || { x: 5, y: 5, z: 5 }
            
            for (let i = 0; i < count; i++) {
              const x = i % gridCapacity.x
              const z = Math.floor((i % (gridCapacity.x * gridCapacity.z)) / gridCapacity.x)
              const y = Math.floor(i / (gridCapacity.x * gridCapacity.z))
              
              positions.push({
                x: start.x + x * box.dimensions.length,
                y: start.y + y * box.dimensions.height,
                z: start.z + z * box.dimensions.width
              })
            }
          }

          return (
            <group key={boxIndex}>
              {positions.map((position, posIndex) => (
                <Box
                  key={`${boxIndex}-${posIndex}`}
                  args={[box.dimensions.length, box.dimensions.height, box.dimensions.width]}
                  position={[
                    position.x + box.dimensions.length / 2,
                    position.y + box.dimensions.height / 2,
                    position.z + box.dimensions.width / 2,
                  ]}
                >
                  <meshStandardMaterial color={color} opacity={0.8} transparent />
                </Box>
              ))}
            </group>
          )
        })}
      </group>
    )
  }

  // Final fallback for basic SKUs array (minimal visualization)
  if (skus) {
    return (
      <group>
        {skus.map((skuItem, index) => {
          const skuName = skuItem.sku?.name || 'Unknown'
          if (!showSku[skuName]) return null

          const color = skuColors[skuName] || fallbackColors[index % fallbackColors.length] || "#666666"
          const sku = skuItem.sku
          
          if (!sku || !sku.length || !sku.width || !sku.height) return null
          
          // Create a simple grid layout for the SKU items
          const positions = []
          for (let i = 0; i < Math.min(skuItem.quantity, 20); i++) {
            positions.push({
              x: (i % 4) * sku.length,
              y: 0,
              z: Math.floor(i / 4) * sku.width
            })
          }

          return (
            <group key={index}>
              {positions.map((position, posIndex) => (
                <Box
                  key={`${index}-${posIndex}`}
                  args={[sku.length, sku.height, sku.width]}
                  position={[
                    position.x + sku.length / 2,
                    position.y + sku.height / 2,
                    position.z + sku.width / 2,
                  ]}
                >
                  <meshStandardMaterial color={color} opacity={0.8} transparent />
                </Box>
              ))}
            </group>
          )
        })}
      </group>
    )
  }

  return null
}

function TruckLabel({ truck, position }) {
  return (
    <Text position={position} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
      {truck.name}
      {"\n"}
      {`${truck.length}m × ${truck.width}m × ${truck.height}m`}
    </Text>
  )
}

function SingleTruckView({ truckData, truckIndex, truckType }) {
  console.log('truckData', JSON.stringify(truckData));
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAllBoxes, setShowAllBoxes] = useState(true)
  const [showSku, setShowSku] = useState(() => {
    const initial = {}
    // Handle new compact format
    if (truckData.packedSKUs) {
      truckData.packedSKUs.forEach((skuGroup) => {
        initial[skuGroup.skuName] = true
      })
    }
    // Current service format with groupedBoxes
    else if (truckData.groupedBoxes) {
      truckData.groupedBoxes.forEach((box) => {
        initial[box.sku] = true
      })
    }
    // Fallback for SKUs array
    else if (truckData.skus) {
      truckData.skus.forEach((skuItem) => {
        const skuName = skuItem.sku?.name || skuItem.sku || 'Unknown'
        initial[skuName] = true
      })
    }
    return initial
  })

  const toggleSku = (sku) => {
    setShowSku((prev) => ({ ...prev, [sku]: !prev[sku] }))
  }

  const truckNumber = truckData.truckNumber || truckData.truck || truckIndex + 1
  const utilization = truckData.overallUtilization || truckData.utilization || 0
  const totalBoxes = truckData.totalBoxes || 
    (truckData.packedSKUs ? truckData.packedSKUs.reduce((sum, sku) => sum + sku.quantity, 0) : 0) ||
    (truckData.groupedBoxes ? truckData.groupedBoxes.reduce((sum, box) => sum + box.count, 0) : 0) ||
    (truckData.skus ? truckData.skus.reduce((sum, skuItem) => sum + skuItem.quantity, 0) : 0)

  const getUtilizationColor = (util) => {
    if (util >= 80) return "bg-green-100 text-green-800"
    if (util >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getCameraPosition = () => {
    // Adjust camera position based on truck size and number of boxes
    const distance = Math.max(truckType.length, truckType.width, truckType.height) * 2
    return [distance, distance * 0.8, distance]
  }
  
  const getTotalBoxCount = () => {
    if (truckData.packedSKUs) {
      return truckData.packedSKUs.reduce((sum, sku) => sum + sku.quantity, 0)
    }
    if (truckData.groupedBoxes) {
      return truckData.groupedBoxes.reduce((sum, box) => sum + box.count, 0)
    }
    if (truckData.skus) {
      return truckData.skus.reduce((sum, skuItem) => sum + skuItem.quantity, 0)
    }
    return totalBoxes
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 cursor-pointer transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="text-blue-600" size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Truck {truckNumber}</h4>
              <p className="text-sm text-gray-600">{truckType.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-500" />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getUtilizationColor(utilization)}`}>
                {utilization.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{totalBoxes} boxes</span>
            </div>
            <div
              className="text-gray-400 transition-transform duration-200"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <ChevronDown size={20} />
            </div>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Click to {isExpanded ? "hide" : "view"} enhanced 3D visualization
        </div>
      </div>

      {/* Enhanced 3D Visualization */}
      {isExpanded && (
        <div className="p-6 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
          <div className="h-96 bg-gradient-to-b from-slate-100 to-slate-200 rounded-xl overflow-hidden mb-6 shadow-inner relative">
            <Canvas camera={{ position: getCameraPosition(), fov: 60 }}>
              <Environment preset="warehouse" />
              <ambientLight intensity={0.4} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <pointLight
                position={[truckType.length / 2, truckType.height + 2, truckType.width / 2]}
                intensity={0.5}
              />

              <TruckContainer truck={truckType} />
              {(truckData.packedSKUs || truckData.groupedBoxes || truckData.skus) && (
                <CargoBoxes 
                  packedSKUs={truckData.packedSKUs} 
                  groupedBoxes={truckData.groupedBoxes}
                  skus={truckData.skus}
                  showSku={showSku}
                  showAllBoxes={showAllBoxes}
                />
              )}
              <TruckLabel
                truck={truckType}
                position={[truckType.length / 2, truckType.height + 1, truckType.width / 2]}
              />

              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                target={[truckType.length / 2, truckType.height / 2, truckType.width / 2]}
              />
            </Canvas>

            {/* Controls overlay */}
            <div className="absolute top-4 right-4 z-10">
              <div className="w-64 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Cargo Controls</h3>
                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => setShowAllBoxes(!showAllBoxes)}
                      className={`w-full px-3 py-1 text-xs rounded transition-colors ${
                        showAllBoxes
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {showAllBoxes ? "All Boxes Shown" : "Limited View"}
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                      {getTotalBoxCount()} total boxes
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {/* Handle new compact format */}
                  {truckData.packedSKUs &&
                    truckData.packedSKUs.map((skuGroup, index) => (
                      <div key={skuGroup.skuId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: skuColors[skuGroup.skuName] || fallbackColors[index % fallbackColors.length] }}
                          />
                          <span className="text-xs text-gray-700">{skuGroup.skuName}</span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border">
                            {skuGroup.quantity}
                          </span>
                          <span className="px-1 py-0.5 text-xs bg-blue-50 text-blue-600 rounded text-xs">
                            {skuGroup.orientationGroups.length} orient.
                          </span>
                        </div>
                        <button
                          onClick={() => toggleSku(skuGroup.skuName)}
                          className={`h-6 px-2 text-xs rounded transition-colors ${
                            showSku[skuGroup.skuName]
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {showSku[skuGroup.skuName] ? "Hide" : "Show"}
                        </button>
                      </div>
                    ))}
                    
                  {/* Current service format with groupedBoxes */}
                  {!truckData.packedSKUs && truckData.groupedBoxes &&
                    truckData.groupedBoxes.map((box, index) => (
                      <div key={box.sku || index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: skuColors[box.sku] || fallbackColors[index % fallbackColors.length] }}
                          />
                          <span className="text-xs text-gray-700">{box.sku}</span>
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border">
                            {box.count}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleSku(box.sku)}
                          className={`h-6 px-2 text-xs rounded transition-colors ${
                            showSku[box.sku]
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {showSku[box.sku] ? "Hide" : "Show"}
                        </button>
                      </div>
                    ))}
                    
                  {/* Fallback for basic SKUs array */}
                  {!truckData.packedSKUs && !truckData.groupedBoxes && truckData.skus &&
                    truckData.skus.map((skuItem, index) => {
                      const skuName = skuItem.sku?.name || 'Unknown'
                      return (
                        <div key={skuItem.sku?._id || index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: skuColors[skuName] || fallbackColors[index % fallbackColors.length] }}
                            />
                            <span className="text-xs text-gray-700">{skuName}</span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border">
                              {skuItem.quantity}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleSku(skuName)}
                            className={`h-6 px-2 text-xs rounded transition-colors ${
                              showSku[skuName]
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {showSku[skuName] ? "Hide" : "Show"}
                          </button>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced SKU Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package size={16} />
              Cargo Contents
            </h5>
            
            {/* New compact format with orientation details */}
            {truckData.packedSKUs && (
              <div className="space-y-3">
                {truckData.packedSKUs.map((group, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: skuColors[group.skuName] || fallbackColors[idx % fallbackColors.length] }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{group.skuName}</div>
                        <div className="text-sm text-gray-600">{group.quantity} units total</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="text-xs font-medium text-gray-700 mb-1">Orientations:</div>
                      {group.orientationGroups.map((orient, orientIdx) => (
                        <div key={orientIdx} className="flex justify-between items-center bg-white px-2 py-1 rounded">
                          <span className="font-mono">{orient.orientation}: {orient.count} boxes</span>
                          <span className="text-gray-400">{orient.dimensions.width}×{orient.dimensions.height}×{orient.dimensions.depth}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Current service format with groupedBoxes */}
            {!truckData.packedSKUs && truckData.groupedBoxes && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {truckData.groupedBoxes.map((group, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: skuColors[group.sku] || fallbackColors[idx % fallbackColors.length] }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{group.sku}</div>
                      <div className="text-sm text-gray-600">{group.count} units</div>
                      <div className="text-xs text-gray-500">
                        {group.dimensions.length}×{group.dimensions.width}×{group.dimensions.height}m
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Fallback for basic SKUs array */}
            {!truckData.packedSKUs && !truckData.groupedBoxes && truckData.skus && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {truckData.skus.map((skuItem, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: skuColors[skuItem.sku?.name] || fallbackColors[idx % fallbackColors.length] }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{skuItem.sku?.name || 'Unknown SKU'}</div>
                      <div className="text-sm text-gray-600">{skuItem.quantity} units</div>
                      {skuItem.sku && (
                        <div className="text-xs text-gray-500">
                          {skuItem.sku.length}×{skuItem.sku.width}×{skuItem.sku.height}m
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const TruckVisualization = ({ calculation, isPreview = false }) => {
  if (!calculation) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Truck Load Preview</h2>
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
            <span className="text-gray-400 text-2xl">📦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Preview Data</h3>
          <p className="text-gray-500">Complete a calculation to see the truck loading preview</p>
        </div>
      </div>
    )
  }

  // Default truck type with better dimensions
  let truckType = calculation.truckType

  const trucksData = calculation.trucks || calculation.trucksData || []

  if (trucksData.length === 0) {
    const numTrucks = Math.ceil(calculation.calculatedTrucks || 1)
    const fallbackTrucks = []

    for (let i = 0; i < numTrucks; i++) {
      fallbackTrucks.push({
        truck: i + 1,
        utilization: calculation.utilization || 50,
        skus: calculation.skus || [],
      })
    }

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Enhanced Truck Load Preview</h2>
          <span className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
            {fallbackTrucks.length} truck{fallbackTrucks.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="space-y-4">
          {fallbackTrucks.map((truck, index) => (
            <SingleTruckView key={index} truckData={truck} truckIndex={index} truckType={truckType} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Enhanced Truck Load Preview</h2>
        <span className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
          {trucksData.length} truck{trucksData.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-4">
        {trucksData.map((truck, index) => (
          <SingleTruckView key={index} truckData={truck} truckIndex={index} truckType={truckType} />
        ))}
      </div>
    </div>
  )
}

export default TruckVisualization
