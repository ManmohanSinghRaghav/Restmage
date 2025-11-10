import { useState, useCallback } from 'react';
import api from '../utils/apiService';
import { useNotification } from '../contexts/NotificationContext';

interface FloorPlanRequirements {
  plotLength: number;
  plotWidth: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  kitchen?: boolean;
  livingRoom?: boolean;
  diningRoom?: boolean;
  garage?: boolean;
}

interface Room {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface FloorPlan {
  plotDimensions: {
    length: number;
    width: number;
  };
  rooms: Room[];
  walls?: any[];
  doors?: any[];
  windows?: any[];
}

/**
 * Custom hook for floor plan operations
 * Simplifies component logic and provides loading/error states
 */
export function useFloorPlan() {
  const [loading, setLoading] = useState(false);
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  /**
   * Generate AI-powered floor plan using Gemini
   */
  const generateWithAI = useCallback(async (requirements: FloorPlanRequirements) => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.post<{ success: boolean; data: FloorPlan }>('/gemini/generate-map', {
        requirements
      });

      setFloorPlan(data.data);
      showNotification('AI floor plan generated successfully!', 'success');
      return data.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate floor plan';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Generate basic floor plan (rule-based)
   */
  const generateBasic = useCallback(async (requirements: FloorPlanRequirements) => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.post<FloorPlan>('/floorplan/generate', {
        propertyWidth: requirements.plotLength,
        propertyHeight: requirements.plotWidth,
        bedrooms: requirements.bedrooms,
        bathrooms: requirements.bathrooms,
        floors: requirements.floors,
        kitchen: requirements.kitchen,
        livingRoom: requirements.livingRoom,
        diningRoom: requirements.diningRoom,
        garage: requirements.garage
      });

      setFloorPlan(data);
      showNotification('Floor plan generated successfully!', 'success');
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to generate floor plan';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Optimize existing floor plan layout
   */
  const optimizeLayout = useCallback(async (currentPlan: FloorPlan) => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.post<FloorPlan>('/floorplan/optimize', currentPlan);

      setFloorPlan(data);
      showNotification('Layout optimized!', 'success');
      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Optimization failed';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Save floor plan to project
   */
  const saveToProject = useCallback(async (projectId: string, floorPlanData: FloorPlan) => {
    try {
      setLoading(true);
      setError(null);

      await api.put(`/projects/${projectId}`, {
        floorPlanData
      });

      showNotification('Floor plan saved successfully!', 'success');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save floor plan';
      setError(errorMsg);
      showNotification(errorMsg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  /**
   * Clear current floor plan
   */
  const clearFloorPlan = useCallback(() => {
    setFloorPlan(null);
    setError(null);
  }, []);

  return {
    loading,
    floorPlan,
    error,
    generateWithAI,
    generateBasic,
    optimizeLayout,
    saveToProject,
    clearFloorPlan
  };
}
