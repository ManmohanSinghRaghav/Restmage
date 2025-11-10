import { useState, useCallback } from 'react';
import api from '../utils/apiService';
import { useNotification } from '../contexts/NotificationContext';

interface PropertyFeatures {
  area: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  yearBuilt: number;
  location: 'urban' | 'suburban' | 'rural';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  garage: 'Yes' | 'No';
  amenities?: string[];
}

interface PricePrediction {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  breakdown: {
    basePrice: number;
    areaValue: number;
    locationBonus: number;
    conditionAdjustment: number;
    amenitiesValue: number;
  };
  confidence: number;
  currency: string;
}

interface ComparisonResult {
  property: PropertyFeatures;
  prediction: PricePrediction;
}

/**
 * Custom hook for price prediction operations
 * Simplifies ML model integration and comparison
 */
export function usePricePrediction() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  /**
   * Get price prediction for single property
   */
  const predictPrice = useCallback(async (features: PropertyFeatures) => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.post<{ success: boolean; prediction: PricePrediction }>('/price-prediction/predict', features);

      setPrediction(data.prediction);
      showNotification('Price prediction completed!', 'success');
      return data.prediction;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to predict price';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Compare multiple property configurations
   */
  const compareProperties = useCallback(async (properties: PropertyFeatures[]) => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.post<{ success: boolean; comparisons: ComparisonResult[] }>('/price-prediction/compare', {
        properties
      });

      setComparisons(data.comparisons);
      showNotification(`Compared ${properties.length} properties!`, 'success');
      return data.comparisons;
    } catch (err: any) {
      const errorMsg = err.message || 'Comparison failed';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Get market trends data
   */
  const getMarketTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get('/price-prediction/market-trends');
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch market trends';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Export prediction as PDF
   */
  const exportPDF = useCallback(async (predictionData: PricePrediction, propertyDetails: PropertyFeatures) => {
    try {
      setLoading(true);
      setError(null);

      await api.post('/export/pricing-pdf', {
        prediction: predictionData,
        propertyDetails,
        breakdown: predictionData.breakdown
      }, {
        responseType: 'blob'
      });

      showNotification('PDF exported successfully!', 'success');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to export PDF';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Clear prediction data
   */
  const clearPrediction = useCallback(() => {
    setPrediction(null);
    setComparisons([]);
    setError(null);
  }, []);

  /**
   * Format price with currency
   */
  const formatPrice = useCallback((price: number, currency: string = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  }, []);

  return {
    loading,
    prediction,
    comparisons,
    error,
    predictPrice,
    compareProperties,
    getMarketTrends,
    exportPDF,
    clearPrediction,
    formatPrice
  };
}
