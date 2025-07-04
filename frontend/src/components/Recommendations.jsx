import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Package, 
  TrendingUp,
  AlertTriangle,
  Zap,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Recommendations = ({ 
  calculation, 
  isPreview = false, 
  onRecommendationAccepted 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed

  // Extract recommendations from calculation result
  useEffect(() => {
    // Don't process if no calculation data
    if (!calculation) {
      setRecommendations([]);
      return;
    }


    if (!calculation.recommendations) {
      setRecommendations([]);
      return;
    }

    let processedRecommendations = [];
    
    try {
      // Handle the current API structure where recommendations is an array of arrays
      if (Array.isArray(calculation.recommendations)) {
        calculation.recommendations.forEach((skuRec, skuIndex) => {
              
              
              // Create a unique recommendation entry
              processedRecommendations.push({
                id: `sku-${skuIndex}`,
                title: `Add ${skuRec.sku.name}`,
                description: `Add up to ${skuRec.maxQuantity} units of ${skuRec.sku.name} to optimize utilization.`,
                status: 'pending',
                potentialSavings: skuRec.maxQuantity > 100 ? 'high' : 'medium',
                impact: skuRec.maxQuantity > 100 ? 'High Impact' : 'Medium Impact',
                sku: skuRec.sku,
                maxQuantity: skuRec.maxQuantity,
               
               
              });
            });
          
       
      }
    } catch (error) {
      console.error('Error processing recommendations:', error);
      processedRecommendations = [];
    }
    
    setRecommendations(processedRecommendations);
  }, [calculation]);

  // Don't render anything if no calculation
  if (!calculation) {
    return null;
  }

  // If there are no recommendations, show a brief message when expanded
  if (!recommendations.length) {
    return;
  }

  const utilization = calculation.trucks?.map(truck => truck.utilization).reduce((a, b) => a + b, 0) / calculation.trucks?.length || 0;
  const isUnderUtilized = utilization < 60;

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
      console.log(`Toast error: ${error.message}`);
    }
  };

  const handleRecommendationAction = (index, action) => {
    console.log('🎯 Recommendation action called:', { index, action, recommendation: recommendations[index] });
    console.log('🔍 Handler status:', {
      handlerExists: !!onRecommendationAccepted,
      handlerType: typeof onRecommendationAccepted,
      handlerIsFunction: typeof onRecommendationAccepted === 'function'
    });
    
    const recommendation = recommendations[index];
    
    if (!recommendation) {
      console.error('❌ Recommendation at index', index, 'is null/undefined. Available recommendations:', recommendations);
      showToast('Invalid recommendation selected', 'error');
      return;
    }
    
    if (action === 'accepted') {
      // Check if handler exists and is a function
      if (!onRecommendationAccepted) {
        console.warn('⚠️ No recommendation handler provided');
        showToast('Recommendation system is still loading. Please wait a moment and try again.', 'error');
        return;
      }
      
      if (typeof onRecommendationAccepted !== 'function') {
        console.error('❌ onRecommendationAccepted is not a function:', typeof onRecommendationAccepted);
        showToast('Recommendation system error. Please refresh the page.', 'error');
        return;
      }
      
      try {
        console.log('✅ Calling recommendation handler from Recommendations component...');
        onRecommendationAccepted(recommendation);
      } catch (error) {
        console.error('❌ Error accepting recommendation:', error);
        showToast('Failed to accept recommendation: ' + error.message, 'error');
        return;
      }
    } else if (action === 'rejected') {
      showToast(`❌ Recommendation rejected`);
    }
    
    // Remove the recommendation from the list (both accepted and rejected)
    const updatedRecommendations = recommendations.filter((_, i) => i !== index);
    setRecommendations(updatedRecommendations);
  };

  const getImpactColor = (impact) => {
    if (impact === 'High Impact') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getSavingsIcon = (savings) => {
    if (savings === 'high') return <TrendingUp className="text-green-600" size={20} />;
    return <Zap className="text-blue-600" size={20} />;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-lg border border-yellow-200 p-6">
      {/* Collapsible Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Lightbulb className="text-yellow-600" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800"> Recommendations</h2>
            <p className="text-sm text-gray-600">
              {recommendations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                  {recommendations.length} suggestion{recommendations.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
          >
            <span className="text-sm font-medium">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
            {isExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Under-utilization alert */}
          {isUnderUtilized && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-800 mb-1">🚨 Optimization Alert</h3>
                  <p className="text-red-700 text-sm leading-relaxed">
                    Your current utilization is <strong>{utilization.toFixed(1)}%</strong> - there's room for improvement! 
                    Consider the smart recommendations below to maximize efficiency and reduce shipping costs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Grid */}
          <div className="grid gap-4 md:gap-6">
            {recommendations.map((rec, index) => {
            
              
              return (
                <div 
                  key={rec.id || index} 
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Recommendation Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Package className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{rec.sku.name}</h3>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mb-3">
                            Add up to <strong>{rec.maxQuantity} units</strong> to optimize your truck space utilization
                           
                          </p>
                          
                          {/* SKU Details */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500 uppercase tracking-wide">Dimensions</p>
                              <p className="font-medium text-gray-800">
                                {rec.sku.length}×{rec.sku.width}×{rec.sku.height}m
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500 uppercase tracking-wide">Weight</p>
                              <p className="font-medium text-gray-800">{rec.sku.weight}kg</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="text-gray-500 uppercase tracking-wide">Max Qty</p>
                              <p className="font-medium text-gray-800">{rec.maxQuantity}</p>
                            </div>
                           
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                     
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleRecommendationAction(index, 'rejected')}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <Minus size={16} />
                          Reject
                        </button>
                        <button
                          onClick={() => handleRecommendationAction(index, 'accepted')}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
                        >
                          <Plus size={16} />
                          Add to Shipment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>

         
        </div>
      )}
    </div>
  );
};

export default Recommendations; 