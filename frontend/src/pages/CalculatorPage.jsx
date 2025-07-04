import React, { useState, useCallback } from 'react';
import CalculationForm from '../components/CalculationForm';
import CalculationResults from '../components/CalculationResults';
import Recommendations from '../components/Recommendations';
import TruckVisualization from '../components/TruckVisualization';

function CalculatorPage() {
  const [calculationResult, setCalculationResult] = useState(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [savedCalculationId, setSavedCalculationId] = useState(null);
  const [recommendationHandler, setRecommendationHandler] = useState(null);

  const handleCalculationComplete = (result, isPreview = false) => {
    setCalculationResult(result);
    setIsPreviewMode(isPreview);
    
    if (!isPreview && result?.calculationId) {
      setSavedCalculationId(result.calculationId);
    }
  };

  const handleSaveComplete = (savedResult) => {
    console.log('Calculator Page - Save complete:', savedResult);
    // Don't update calculationResult to prevent Truck Load Preview from updating
    // setCalculationResult(savedResult);
    setIsPreviewMode(false);
    setSavedCalculationId(savedResult?.calculationId);
  };

  const handleClearAll = () => {
    setCalculationResult(null);
    setIsPreviewMode(false);
    setSavedCalculationId(null);
    setRecommendationHandler(null);
  };

  // Enhanced recommendation handler with better error handling and debugging
  const safeRecommendationHandler = useCallback((recommendation) => {
    console.log('🔍 Safe recommendation handler called');
    console.log('📋 Recommendation data:', recommendation);
    console.log('🔧 Handler status:', {
      handlerExists: !!recommendationHandler,
      handlerType: typeof recommendationHandler,
      handlerIsFunction: typeof recommendationHandler === 'function'
    });
    
    // Don't process if no recommendation data
    if (!recommendation) {
      console.warn('❌ Safe handler called with null/undefined recommendation');
      alert('❌ Invalid recommendation data. Please try again.');
      return;
    }
    
    // Check if handler is ready
    if (!recommendationHandler) {
      console.warn('⚠️ Recommendation handler not yet ready');
      alert('⚠️ Recommendation system is still loading. Please wait a moment and try again.');
      return;
    }
    
    if (typeof recommendationHandler !== 'function') {
      console.error('❌ Recommendation handler is not a function:', typeof recommendationHandler);
      alert('❌ Recommendation system error. Please refresh the page and try again.');
      return;
    }
    
    try {
      console.log('✅ Calling recommendation handler...');
      recommendationHandler(recommendation);
      console.log('✅ Recommendation handler completed successfully');
    } catch (error) {
      console.error('❌ Error in recommendation handler:', error);
      alert('❌ Error processing recommendation: ' + error.message);
    }
  }, [recommendationHandler]);

  // Handler to receive the recommendation function from CalculationForm
  const handleRecommendationHandlerReady = useCallback((handler) => {
    console.log('🔧 Recommendation handler ready:', {
      handlerExists: !!handler,
      handlerType: typeof handler,
      handlerIsFunction: typeof handler === 'function'
    });
    setRecommendationHandler(() => handler);
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Truck Utilization Calculator
            </h1>
            <p className="text-gray-600">
              Calculate optimal truck loading and space utilization
            </p>
          </div>
          
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div>
          <CalculationForm 
            onCalculationComplete={handleCalculationComplete}
            onSaveComplete={handleSaveComplete}
            onRecommendationHandlerReady={handleRecommendationHandlerReady}
            onClearAll={handleClearAll}
          />
        </div>
        
        <div>
          <CalculationResults 
            result={calculationResult}
            isPreview={isPreviewMode}
          />
        </div>
      </div>

      {calculationResult && (
        <Recommendations 
          calculation={calculationResult}
          isPreview={isPreviewMode}
          onRecommendationAccepted={safeRecommendationHandler}
        />
      )}

      {calculationResult && (
        <TruckVisualization 
          calculation={calculationResult}
          isPreview={isPreviewMode}
        />
      )}

     
    </div>
  );
}

export default CalculatorPage; 