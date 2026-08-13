// src/components/useConsignmentData.js
import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

/**
 * useConsignmentData Custom Hook
 * Centralizes the fetching, persistence, and state management of consignments,
 * workspaces, and currency metrics across both Admin and Staff Terminal views.
 */
export function useConsignmentData() {
  const [consignments, setConsignments] = useState([]);
  const [currency] = useState('₦'); // Default corporate currency symbol (Naira)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches live consignment records from the secure backend API.
   */
  const fetchConsignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Explicitly call the backend consignments endpoint
      const response = await apiClient.get('/consignments');
      
      console.log("Raw API Consignments Response:", response.data);

      // Normalize data to ensure both backend field styles (_id vs id, consignment_ref vs consignmentRef) work seamlessly
      const rawData = Array.isArray(response.data) ? response.data : (response.data.consignments || []);
      
      const normalized = rawData.map(item => ({
        id: item._id || item.id,
        consignmentRef: item.consignment_ref || item.consignmentRef || 'N/A',
        type: item.type === 'giant_bale' ? 'Giant Bales' : (item.type || 'Direct Container'),
        totalVolumeCount: item.totalVolumeCount || item.total_volume_count || 0,
        totalGrossMassWeight: item.totalGrossMassWeight || item.total_landing_cost || item.totalGrossWeight || 0,
        status: item.status || 'Active',
        dateRegistered: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        raw: item
      }));

      setConsignments(normalized);
    } catch (err) {
      console.error("Failed to fetch backend consignments:", err);
      setError("Failed to synchronize active consignments from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data automatically when the hook initializes
  useEffect(() => {
    fetchConsignments();
  }, [fetchConsignments]);

  /**
   * Retrieves specific workspace production/sales logs from local storage mapped by ID.
   */
  const getWorkspaceData = (consignmentId) => {
    try {
      const data = localStorage.getItem(`workspace_${consignmentId}`);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Error reading workspace data:", e);
      return {};
    }
  };

  /**
   * Saves workspace logs locally for operation continuity.
   */
  const saveWorkspaceData = (consignmentId, workspaceData) => {
    try {
      localStorage.setItem(`workspace_${consignmentId}`, JSON.stringify(workspaceData));
    } catch (e) {
      console.error("Error saving workspace data:", e);
    }
  };

  return {
    consignments,
    currency,
    loading,
    error,
    refreshConsignments: fetchConsignments,
    getWorkspaceData,
    saveWorkspaceData
  };
}