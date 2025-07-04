import React from 'react';
import { X, Truck, Package, Weight, MapPin, Calendar, User } from 'lucide-react';

const CalculationDetails = ({ calculation, onClose }) => {
  if (!calculation) return null;

  const utilization = calculation.utilization || 0;
  const utilizationClass = utilization >= 70 ? 'text-green-600' : 'text-red-600';
  const utilizationBgClass = utilization >= 70 ? 'bg-green-100' : 'bg-red-100';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Shipment Details</h2>
            <p className="text-gray-600 mt-1">Calculation ID: {calculation._id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="text-blue-600" size={20} />
                <div>
                  <span className="text-sm font-medium text-gray-600">Destination:</span>
                  <p className="text-lg font-semibold text-gray-800">{calculation.destination}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-600" size={20} />
                <div>
                  <span className="text-sm font-medium text-gray-600">Created:</span>
                  <p className="text-lg font-semibold text-gray-800">{formatDate(calculation.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full ${calculation.status === 'Planned' ? 'bg-blue-600' : 'bg-green-600'}`} />
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <p className="text-lg font-semibold text-gray-800">{calculation.status}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Truck className="text-blue-600" size={20} />
                <div>
                  <span className="text-sm font-medium text-gray-600">Truck Type:</span>
                  <p className="text-lg font-semibold text-gray-800">
                    {calculation.truckType?.name || 'Loading...'}
                  </p>
                  {calculation.truckType && (
                    <p className="text-sm text-gray-500">
                      {calculation.truckType.length}m × {calculation.truckType.width}m × {calculation.truckType.height}m
                      (Max: {calculation.truckType.weightCapacity}kg)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Truck className="text-blue-600" size={24} />
                <span className="text-sm text-gray-600">Trucks</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {Number.isInteger(calculation.calculatedTrucks) 
                  ? calculation.calculatedTrucks 
                  : calculation.calculatedTrucks.toFixed(2)}
              </p>
              {!Number.isInteger(calculation.calculatedTrucks) && (
                <p className="text-xs text-gray-600 mt-1">Last truck not fully utilized</p>
              )}
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Package className="text-purple-600" size={24} />
                <span className="text-sm text-gray-600">Volume</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {calculation.totalVolume?.toFixed(2)} m³
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Weight className="text-green-600" size={24} />
                <span className="text-sm text-gray-600">Weight</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {calculation.totalWeight?.toFixed(0)} kg
              </p>
            </div>

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

          {/* SKUs Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">SKUs in Shipment</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dimensions (L×W×H)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Volume
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Weight
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calculation.skus?.map((item, index) => {
                    const sku = item.sku;
                    const totalVolume = sku ? (sku.length * sku.width * sku.height * item.quantity) : 0;
                    const totalWeight = sku ? (sku.weight * item.quantity) : 0;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sku?.name || 'Loading...'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sku ? `${sku.length}×${sku.width}×${sku.height}m` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {sku ? `${sku.weight}kg` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {totalVolume.toFixed(2)} m³
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {totalWeight.toFixed(0)} kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Under-utilization Alert */}
          {utilization < 70 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex items-center">
                <div className="mr-3">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Under-Utilization Alert</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This shipment is significantly under-utilized ({utilization.toFixed(1)}%). 
                    Consider adding more items or reconsidering the shipment plan to save costs.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationDetails; 