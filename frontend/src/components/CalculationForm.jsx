import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchSKUs, fetchTruckTypes, calculateOnly, createCalculation, searchCalculationsByDestination, updateCalculation } from '../services/api';
import ShipmentSelectionModal from './ShipmentSelectionModal';
import { Plus, Trash2, Calculator, Edit, CheckCircle, Save, AlertCircle } from 'lucide-react';

const CalculationForm = ({ 
  onCalculationComplete, 
  onSaveComplete,
  onRecommendationHandlerReady,
  onClearAll
}) => {
  // Data states
  const [skus, setSkus] = useState([]);
  const [truckTypes, setTruckTypes] = useState([]);
  
  // Form states
  const [destination, setDestination] = useState('');
  const [selectedTruckType, setSelectedTruckType] = useState('');
  const [skuQuantities, setSkuQuantities] = useState([{ skuId: '', quantity: 1 }]);
  
  // UI states
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Calculation states
  const [calculationResult, setCalculationResult] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Editing states
  const [currentCalculation, setCurrentCalculation] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingToastShown, setEditingToastShown] = useState(false);
  
  // Modal states
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [availableShipments, setAvailableShipments] = useState([]);
  const [selectedDestinationForModal, setSelectedDestinationForModal] = useState('');

  const location = useLocation();
  const destinations = ['Jeddah', 'Dammam', 'Riyadh', 'Khobar', 'Makkah'];
  const navigationHandled = useRef(false);

  // Toast helper function
  const showToast = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    try {
      if (type === 'error') {
        toast.error(message);
      } else if (type === 'success') {
        toast.success(message);
      } else {
        toast(message);
      }
    } catch (error) {
      console.warn('Toast not available, using console fallback');
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [skusData, truckTypesData] = await Promise.all([
          fetchSKUs(),
          fetchTruckTypes()
        ]);
        
        setSkus(skusData);
        setTruckTypes(truckTypesData);
        setError(null);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setError('Failed to load SKUs and truck types');
        showToast('Failed to load initial data', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Handle editing from navigation state (only once on component mount)
  useEffect(() => {
    if (location.state?.editCalculation && !navigationHandled.current) {
      navigationHandled.current = true;
      const calculation = location.state.editCalculation;
      setCurrentCalculation(calculation);
      loadCalculationForEditing(calculation, true); // true indicates this is from navigation
    }
  }, []); // Empty dependency array to run only once

  // Load calculation for editing
  const loadCalculationForEditing = (calculation, fromNavigation = false) => {
    if (!calculation) return;

    setIsEditing(true);
    setDestination(calculation.destination || '');
    
    if (calculation.truckType) {
      setSelectedTruckType(calculation.truckType._id || calculation.truckType);
    }
    
    if (calculation.skus && calculation.skus.length > 0) {
      const existingSkuQuantities = calculation.skus.map(item => {
        if (!item || !item.sku) {
          console.warn('Invalid SKU item found:', item);
          return null;
        }
        return {
          skuId: item.sku._id || item.sku,
          quantity: item.quantity || 0
        };
      }).filter(Boolean);
      
      setSkuQuantities(existingSkuQuantities.length > 0 ? existingSkuQuantities : [{ skuId: '', quantity: 1 }]);
    }
    
    setCalculationResult(calculation);
    setHasUnsavedChanges(false);
    
    // Only show toast message if loading from navigation and haven't shown it yet
    if (fromNavigation && !editingToastShown) {
      setEditingToastShown(true);
      showToast('Editing existing calculation. Update fields and recalculate.');
    }
  };

  // Track form changes
  useEffect(() => {
    if (calculationResult && !isEditing) {
      setHasUnsavedChanges(true);
    }
  }, [destination, selectedTruckType, skuQuantities, calculationResult, isEditing]);

  // SKU management
  const handleAddSKU = () => {
    setSkuQuantities([...skuQuantities, { skuId: '', quantity: 1 }]);
  };

  const handleRemoveSKU = (index) => {
    const newSkuQuantities = skuQuantities.filter((_, i) => i !== index);
    setSkuQuantities(newSkuQuantities.length ? newSkuQuantities : [{ skuId: '', quantity: 1 }]);
  };

  const handleSKUChange = (index, field, value) => {
    const newSkuQuantities = [...skuQuantities];
    newSkuQuantities[index][field] = field === 'quantity' ? parseInt(value) || 0 : value;
    setSkuQuantities(newSkuQuantities);
  };

  // Destination handling with existing shipment check
  const handleDestinationChange = async (selectedDestination) => {
    setDestination(selectedDestination);
    
    if (selectedDestination && !isEditing) {
      try {
        const response = await searchCalculationsByDestination(selectedDestination);
        
        if (response.existingCalculations && response.existingCalculations.length > 0) {
          const plannedCalculations = response.existingCalculations.filter(calc => calc.status === 'Planned');
          
          if (plannedCalculations.length > 0) {
            // Always show the shipment selection modal for easier interaction
            setAvailableShipments(plannedCalculations);
            setSelectedDestinationForModal(selectedDestination);
            setShowShipmentModal(true);
          }
          // If no planned calculations, just continue silently (no message)
        }
        // If no existing calculations at all, continue silently (no message)
      } catch (error) {
        console.error('Error checking existing shipments:', error);
        // Don't show error message to user, just log it
      }
    }
  };

  // Load existing calculation
  const loadExistingCalculation = (existingCalc) => {
    if (!existingCalc) {
      console.error('loadExistingCalculation called with null/undefined calculation');
      return;
    }
    
    setCurrentCalculation(existingCalc);
    setIsEditing(true);
    setDestination(existingCalc.destination || '');
    
    if (existingCalc.truckType) {
      setSelectedTruckType(existingCalc.truckType._id || existingCalc.truckType);
    }
    if (existingCalc.skus && existingCalc.skus.length > 0) {
      const existingSkuQuantities = existingCalc.skus.map(item => {
        if (!item || !item.sku) {
          console.warn('Invalid SKU item found:', item);
          return null;
        }
        return {
          skuId: item.sku._id || item.sku,
          quantity: item.quantity || 0
        };
      }).filter(Boolean);
      
      setSkuQuantities(existingSkuQuantities.length > 0 ? existingSkuQuantities : [{ skuId: '', quantity: 1 }]);
    }
    
    setCalculationResult(existingCalc);
    setHasUnsavedChanges(false);
    setShowShipmentModal(false);
    showToast('Loaded existing shipment for editing');
  };

  // Modal handlers
  const handleModalSelect = (selectedShipment) => {
    loadExistingCalculation(selectedShipment);
  };

  const handleModalCreateNew = () => {
    setShowShipmentModal(false);
    showToast(`Creating new shipment for ${selectedDestinationForModal}`);
  };

  const handleModalClose = () => {
    setShowShipmentModal(false);
    setDestination('');
  };

  // Recommendation handler
  const handleAcceptRecommendation = useCallback((recommendation) => {
    
    // More thorough validation
    if (!recommendation) {
      return;
    }
    
    if (typeof recommendation !== 'object') {
      console.error('Recommendation is not an object:', recommendation);
      showToast('Invalid recommendation format', 'error');
      return;
    }
    
    if (!recommendation.sku || typeof recommendation.sku !== 'object' || !recommendation.sku._id) {
      console.error('Invalid recommendation SKU:', recommendation);
      showToast('Recommendation is missing SKU information', 'error');
      return;
    }
    
    if (!recommendation.maxQuantity || typeof recommendation.maxQuantity !== 'number' || recommendation.maxQuantity <= 0) {
      console.error('Invalid recommendation quantity:', recommendation);
      showToast('Recommendation has invalid quantity', 'error');
      return;
    }
    
    try {
      const existingIndex = skuQuantities.findIndex(sq => sq.skuId === recommendation.sku._id);
      
      if (existingIndex >= 0) {
        const newSkuQuantities = [...skuQuantities];
        newSkuQuantities[existingIndex].quantity += recommendation.maxQuantity;
        setSkuQuantities(newSkuQuantities);
        showToast(`Added ${recommendation.maxQuantity} more ${recommendation.sku.name} to existing quantity`, 'success');
      } else {
        const newSkuQuantities = [...skuQuantities, {
          skuId: recommendation.sku._id,
          quantity: recommendation.maxQuantity
        }];
        setSkuQuantities(newSkuQuantities);
        showToast(`Added ${recommendation.maxQuantity} ${recommendation.sku.name} to your shipment`, 'success');
      }
      
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error processing recommendation:', error);
      showToast('Failed to add recommendation to shipment', 'error');
    }
  }, [skuQuantities]);

  // Expose recommendation handler
  useEffect(() => {
    if (onRecommendationHandlerReady && typeof onRecommendationHandlerReady === 'function') {
      try {
        onRecommendationHandlerReady(handleAcceptRecommendation);
      } catch (error) {
        console.error('Error setting recommendation handler:', error);
      }
    }
  }, [onRecommendationHandlerReady, handleAcceptRecommendation]);

  // Form utilities
  const handleClearForm = () => {
    setDestination('');
    setSelectedTruckType('');
    setSkuQuantities([{ skuId: '', quantity: 1 }]);
    setCurrentCalculation(null);
    setIsEditing(false);
    setRecommendations([]);
    setCalculationResult(null);
    setHasUnsavedChanges(false);
    setIsPreviewMode(false);
    setEditingToastShown(false); // Reset the toast flag
    
    // Notify parent to clear Results, Recommendations, and 3D Visualization
    if (onClearAll && typeof onClearAll === 'function') {
      onClearAll();
    }
    
    showToast('All data cleared');
  };

  const validateForm = () => {
    if (!destination) {
      showToast('Please select a destination', 'error');
      return false;
    }
    if (!selectedTruckType) {
      showToast('Please select a truck type', 'error');
      return false;
    }
    const validSkus = skuQuantities.filter(sq => sq.skuId && sq.quantity > 0);
    if (validSkus.length === 0) {
      showToast('Please add at least one SKU with quantity', 'error');
      return false;
    }
    return true;
  };

  // Calculate function
  const handleCalculate = async () => {
    if (!validateForm()) return;

    setCalculating(true);
    
    try {
      const validSkus = skuQuantities.filter(sq => sq.skuId && sq.quantity > 0);
      const calculationData = {
        destination,
        skuQuantities: validSkus,
        truckTypeId: selectedTruckType
      };

      const apiResult = await calculateOnly(calculationData);
      const result = apiResult.response || apiResult;
      
      if (result.trucks) {
        result.trucksData = result.trucks;
      }
      
      // Process recommendations
      let processedRecommendations = [];
      if (result.recommendations && Array.isArray(result.recommendations)) {
        try {
          const recList = result.recommendations[0] || result.recommendations;
          if (Array.isArray(recList)) {
            processedRecommendations = recList.map((rec, index) => {
              if (!rec || !rec.sku || !rec.sku._id || !rec.maxQuantity) {
                return null;
              }
              
              return {
                id: `rec-${index}`,
                title: `Add ${rec.sku.name}`,
                description: `You can add up to ${rec.maxQuantity} units of ${rec.sku.name} to optimize truck utilization.`,
                status: 'pending',
                potentialSavings: rec.maxQuantity > 100 ? 'Significant space optimization' : 'Minor space optimization',
                sku: rec.sku,
                maxQuantity: rec.maxQuantity
              };
            }).filter(Boolean);
          }
        } catch (error) {
          console.error('Error processing recommendations:', error);
        }
      }
      
      setCalculationResult(result);
      setRecommendations(processedRecommendations);
      setIsPreviewMode(true);
      setHasUnsavedChanges(!isEditing);
      
      showToast('Calculation completed! Review results and save if satisfied.');
      
      if (onCalculationComplete) {
        onCalculationComplete(result, true); // true for preview mode
      }
    } catch (error) {
      console.error('Calculation error:', error);
      showToast('Failed to perform calculation', 'error');
    } finally {
      setCalculating(false);
    }
  };

  // Save function
  const handleSave = async () => {
    if (!calculationResult) {
      showToast('Please calculate first before saving', 'error');
      return;
    }

    setSaving(true);
    
    try {
      const validSkus = skuQuantities.filter(sq => sq.skuId && sq.quantity > 0);
      
      if (isEditing && currentCalculation._id) {
        const updateData = {
          destination,
          skuQuantities: validSkus,
          truckTypeId: selectedTruckType
        };
        
        const result = await updateCalculation(currentCalculation._id, updateData);
        setCurrentCalculation(result);
        setHasUnsavedChanges(false);
        setIsPreviewMode(false);
        
        showToast('Calculation updated and saved successfully');
        
        if (onSaveComplete) {
          onSaveComplete(result);
        }
      } else {
        const calculationData = {
          destination,
          skuQuantities: validSkus,
          truckTypeId: selectedTruckType
        };

        
        const result = await createCalculation(calculationData);
        console.log('result', result);
        setCurrentCalculation(result);
        setIsEditing(true);
        setHasUnsavedChanges(false);
        setIsPreviewMode(false);
        
        showToast('Calculation saved successfully');
        
        if (onSaveComplete) {
          onSaveComplete(result);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      showToast('Failed to save calculation', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <AlertCircle size={24} />
          <h2 className="text-xl font-bold">Error Loading Form</h2>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {isEditing && <Edit size={24} className="text-orange-600" />}
            {isEditing ? 'Edit Calculation' : 'New Calculation'}
          </h2>
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                Unsaved changes
              </span>
            )}
            {isPreviewMode && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                Preview mode
              </span>
            )}
            <button
              onClick={handleClearForm}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

      

        {isEditing && (
          <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-md">
            <p className="text-orange-800 text-sm">
              <strong>Editing Mode:</strong> You are editing an existing calculation. 
              Update the fields below, calculate to preview changes, then save.
            </p>
          </div>
        )}
        
        {/* Destination Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination
          </label>
          <select
            value={destination}
            onChange={(e) => handleDestinationChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select destination</option>
            {destinations.map(dest => (
              <option key={dest} value={dest}>{dest}</option>
            ))}
          </select>
        </div>

        {/* Truck Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Truck Type
          </label>
          <select
            value={selectedTruckType}
            onChange={(e) => setSelectedTruckType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select truck type</option>
            {truckTypes.map(truck => (
              <option key={truck._id} value={truck._id}>
                {truck.name} - {truck.length}m × {truck.width}m × {truck.height}m 
                (Max: {truck.weightCapacity}kg)
              </option>
            ))}
          </select>
        </div>

        {/* SKU Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              SKUs and Quantities
            </label>
            <button
              onClick={handleAddSKU}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Plus size={16} />
              Add SKU
            </button>
          </div>
          
          <div className="space-y-3">
            {skuQuantities.map((skuQ, index) => (
              <div key={index} className="flex gap-3">
                <select
                  value={skuQ.skuId}
                  onChange={(e) => handleSKUChange(index, 'skuId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select SKU</option>
                  {skus.map(sku => (
                    <option key={sku._id} value={sku._id}>
                      {sku.name} ({sku.length}×{sku.width}×{sku.height}m, {sku.weight}kg)
                    </option>
                  ))}
                </select>
                
                <input
                  type="number"
                  min="1"
                  value={skuQ.quantity}
                  onChange={(e) => handleSKUChange(index, 'quantity', e.target.value)}
                  placeholder="Qty"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={() => handleRemoveSKU(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  disabled={skuQuantities.length === 1}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Calculator size={20} />
            {calculating ? 'Calculating...' : 'Calculate & Preview'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !calculationResult}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-colors disabled:cursor-not-allowed ${
              calculationResult 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-300 text-gray-500'
            } ${saving ? 'bg-gray-400' : ''}`}
          >
            <Save size={20} />
            {saving ? 'Saving...' : isEditing ? 'Update Calculation' : 'Save Calculation'}
          </button>
        </div>

      
      </div>

      {/* Shipment Selection Modal */}
      {showShipmentModal && (
        <ShipmentSelectionModal
          shipments={availableShipments}
          destination={selectedDestinationForModal}
          onSelect={handleModalSelect}
          onClose={handleModalClose}
          onCreateNew={handleModalCreateNew}
        />
      )}
    </>
  );
};

export default CalculationForm; 