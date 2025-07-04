import React from 'react';
import { useNavigate } from 'react-router-dom';
import CalculationHistory from '../components/CalculationHistory';
import { Calculator, FileText } from 'lucide-react';

function HistoryPage() {
  const navigate = useNavigate();

  const handleEditCalculation = (calculation) => {
    navigate('/', { 
      state: { 
        editCalculation: calculation 
      } 
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Calculation History
            </h1>
            <p className="text-gray-600">
              Browse and manage your saved truck utilization calculations
            </p>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Calculator size={20} />
            New Calculation
          </button>
        </div>
      </div>

      <CalculationHistory 
        onEditCalculation={handleEditCalculation}
      />

    
    </div>
  );
}

export default HistoryPage; 