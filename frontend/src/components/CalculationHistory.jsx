import React, { useState, useEffect } from 'react';
import { fetchCalculations, updateCalculation } from '../services/api';
import CalculationDetails from './CalculationDetails';
import { History, Eye, Edit, Truck, MapPin, Calendar } from 'lucide-react';

const CalculationHistory = ({ onEditCalculation, onViewCalculation }) => {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalculation, setSelectedCalculation] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCalculations();
  }, []);

  const showToast = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    try {
      const toast = require('react-hot-toast').default;
      if (type === 'error') {
        toast.error(message);
      } else if (type === 'success') {
        toast.success(message);
      } else {
        toast(message);
      }
    } catch (error) {
      if (type === 'error') {
        alert(`Error: ${message}`);
      }
    }
  };

  const loadCalculations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCalculations();
      setCalculations(data);
    } catch (error) {
      console.error('Error loading calculations:', error);
      setError('Failed to load calculation history');
      showToast('Failed to load calculation history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (calculation) => {
    setSelectedCalculation(calculation);
  };

  const closeDetails = () => {
    setSelectedCalculation(null);
  };

  const handleToggleStatus = async (calculation) => {
    setUpdatingId(calculation._id);
    try {
      const newStatus = calculation.status === 'Planned' ? 'Shipped' : 'Planned';
      await updateCalculation(calculation._id, { status: newStatus });
      
      // Update local state
      setCalculations(calculations.map(calc => 
        calc._id === calculation._id ? { ...calc, status: newStatus } : calc
      ));
      
      showToast(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEdit = (calculation) => {
    if (onEditCalculation) {
      onEditCalculation(calculation);
    } else {
      showToast('Edit function not available');
    }
  };

  const handleView = (calculation) => {
    if (onViewCalculation) {
      onViewCalculation(calculation);
    } else {
      handleViewDetails(calculation);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <History size={48} className="mx-auto mb-2" />
            <h3 className="text-lg font-medium">Error Loading History</h3>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadCalculations}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="text-blue-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Calculation History</h2>
        </div>

        {calculations.length === 0 ? (
          <div className="text-center py-8">
            <History className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Calculations Yet</h3>
            <p className="text-gray-500">
              Create your first truck utilization calculation to see it here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKUs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trucks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculations.map((calculation) => (
                  <tr key={calculation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(calculation.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        {calculation.destination}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {calculation.skus?.slice(0, 3).map((item, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {item.sku?.name || 'SKU'} x{item.quantity}
                          </span>
                        ))}
                        {calculation.skus?.length > 3 && (
                          <span className="text-xs text-gray-500">+{calculation.skus.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Truck size={14} className="text-gray-400" />
                        {calculation.calculatedTrucks}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              calculation.utilization >= 70 ? 'bg-green-600' : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(calculation.utilization, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          calculation.utilization >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {calculation.utilization?.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(calculation)}
                        disabled={updatingId === calculation._id}
                        className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                          calculation.status === 'Planned' 
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } ${updatingId === calculation._id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {updatingId === calculation._id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                        ) : (
                          calculation.status
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(calculation)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        {calculation.status === 'Planned' && (
                          <button
                            onClick={() => handleEdit(calculation)}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="Edit calculation"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedCalculation && (
        <CalculationDetails 
          calculation={selectedCalculation} 
          onClose={closeDetails} 
        />
      )}
    </>
  );
};

export default CalculationHistory; 