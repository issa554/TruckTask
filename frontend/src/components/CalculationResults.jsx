import React from 'react';
import { Truck, Package, Weight, AlertTriangle } from 'lucide-react';

const CalculationResults = ({ result, isPreview = false }) => {
  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Results Yet</h3>
          <p className="text-gray-500">
            Complete the form and click "Calculate & Preview" to see results
          </p>
        </div>
      </div>
    );
  }

  const utilization =result?.utilization || result?.trucks?.map(truck => truck.utilization).reduce((a, b) => a + b, 0) / result?.trucks?.length || 0;
  const utilizationClass = utilization >= 70 ? 'text-green-600' : 'text-red-600';
  const utilizationBgClass = utilization >= 70 ? 'bg-green-100' : 'bg-red-100';
  const isUnderUtilized = utilization < 50;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isPreview ? 'Calculation Preview' : 'Calculation Results'}
        </h2>
        {isPreview && (
          <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
            Preview Mode
          </span>
        )}
      </div>
      
      {/* Under-utilization Alert */}
      {isUnderUtilized && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-600 mr-2" size={24} />
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Under-Utilization Alert</h3>
              <p className="text-yellow-600">
                The calculated load is significantly under-utilized ({utilization.toFixed(1)}%). 
                Consider adding more items or reconsidering the shipment plan to save costs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Trucks Needed */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Truck className="text-blue-600" size={24} />
            <span className="text-sm text-gray-600">Trucks</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {Number.isInteger(result.calculatedTrucks) 
              ? result.calculatedTrucks 
              : result.calculatedTrucks?.toFixed(2)}
          </p>
          {!Number.isInteger(result.calculatedTrucks) && (
            <p className="text-xs text-gray-600 mt-1">Last truck not fully utilized</p>
          )}
        </div>

        {/* Total Volume */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Package className="text-purple-600" size={24} />
            <span className="text-sm text-gray-600">Volume</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {result.totalVolume?.toFixed(2)} m³
          </p>
        </div>

        {/* Total Weight */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Weight className="text-green-600" size={24} />
            <span className="text-sm text-gray-600">Weight</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {result.totalWeight?.toFixed(0)} kg
          </p>
        </div>

        {/* Utilization */}
        <div className={`${utilizationBgClass} p-4 rounded-lg`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`w-6 h-6 rounded-full ${utilization >= 70 ? 'bg-green-600' : 'bg-red-600'}`} />
            <span className="text-sm text-gray-600">Utilization</span>
          </div>
          <p className={`text-2xl font-bold ${utilizationClass}`}>
            {utilization.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Shipment Details */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Shipment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-gray-600">Destination:</span>{' '}
            <span className="text-gray-800">{result.destination}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Status:</span>{' '}
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              isPreview 
                ? 'bg-yellow-100 text-yellow-800' 
                : result.status === 'Planned' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {isPreview ? 'Preview' : "Planned"}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Truck Type:</span>{' '}
            <span className="text-gray-800">
              {result?.truckType?.name || result?.truckType || 'Loading...'}
            </span>
          </div>
          {result.createdAt && !isPreview && (
            <div>
              <span className="font-medium text-gray-600">Created:</span>{' '}
              <span className="text-gray-800">
                {new Date(result.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SKUs Summary */}
      {result.skus && result.skus.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">SKUs in Shipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.skus.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">
                  {item.sku?.name || 'Loading...'} 
                </span>
                <span className="text-sm text-gray-600">
                  Qty: {item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculationResults; 