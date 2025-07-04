import React from 'react';
import { X, Truck, Calendar, Package, TrendingUp, Edit, Plus } from 'lucide-react';

const ShipmentSelectionModal = ({ shipments, destination, onSelect, onClose, onCreateNew }) => {
  if (!shipments || shipments.length === 0) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 80) return 'text-green-600 bg-green-100';
    if (utilization >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] overflow-y-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-blue-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-blue-600" size={28} />
              Existing Shipments Found
            </h2>
            <p className="text-gray-700 mt-1">
              Found <strong>{shipments.length}</strong> planned shipment{shipments.length > 1 ? 's' : ''} for <strong>{destination}</strong>. 
            </p>
            <p className="text-sm text-blue-600 mt-1">
              💡 <strong>Suggestion:</strong> Edit an existing shipment to add more items and optimize truck utilization
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Shipments List */}
        <div className="p-6">
          <div className="grid gap-4">
            {shipments.map((shipment, index) => (
              <div
                key={shipment._id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
                onClick={() => onSelect(shipment)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      Shipment #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500">ID: ...{shipment._id.slice(-8)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(shipment);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors group-hover:bg-blue-700"
                  >
                    <Edit size={16} />
                    Edit This Shipment
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                      <p className="text-sm font-medium">{formatDate(shipment.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Trucks</p>
                      <p className="text-sm font-medium">{shipment.calculatedTrucks} needed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">SKU Types</p>
                      <p className="text-sm font-medium">{shipment.skus?.length || 0} different</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Utilization</p>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getUtilizationColor(shipment.utilization)}`}>
                        {shipment.utilization?.toFixed(1) || 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <p><strong>Volume:</strong> {shipment.totalVolume?.toFixed(2) || 0} m³</p>
                  <p><strong>Weight:</strong> {shipment.totalWeight?.toFixed(0) || 0} kg</p>
                </div>

                {/* SKU Summary */}
                {shipment.skus && shipment.skus.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Current SKUs:</p>
                    <div className="flex flex-wrap gap-2">
                      {shipment.skus.slice(0, 4).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                          {item.sku?.name || 'SKU'} × {item.quantity}
                        </span>
                      ))}
                      {shipment.skus.length > 4 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{shipment.skus.length - 4} more...
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Hover hint */}
                <div className="mt-3 text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  👆 Click anywhere on this card to edit and add more items to this shipment
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              <p>💡 <strong>Tip:</strong> Editing existing shipments helps optimize truck utilization</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Plus size={16} />
                Create New Instead
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentSelectionModal; 