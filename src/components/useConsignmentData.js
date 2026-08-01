import { useState, useEffect } from 'react';

export function useConsignmentData() {
  // 1. Global Currency Configuration State
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('global_currency_symbol') || '₦';
  });

  // 2. Main Manifest Registry State
  const [consignments, setConsignments] = useState(() => {
    const saved = localStorage.getItem('manifest_consignments');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        dateRegistered: '2026-07-30',
        consignmentRef: 'GB-2026-001',
        type: 'Giant Bales',
        vesselIdentity: 'MSK Adriatic V-204',
        estBaseLandingCost: 14500,
        totalVolumeCount: 480, 
        totalGrossMassWeight: 21600,
        status: 'Active'
      }
    ];
  });

  // Sync core structures to localStorage whenever states update
  useEffect(() => {
    localStorage.setItem('global_currency_symbol', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('manifest_consignments', JSON.stringify(consignments));
  }, [consignments]);

  // 3. Dynamic Workplace Workspace Store Manager
  // Standardizing the default empty template structure
  const DEFAULT_WORKSPACE = {
    productionList: [],
    pricelist: [],
    salesLog: [],
    byproductSales: [],
    expenses: []
  };

  const getWorkspaceData = (consignmentId) => {
    if (!consignmentId) return DEFAULT_WORKSPACE;
    const saved = localStorage.getItem(`workspace_${consignmentId}`);
    return saved ? JSON.parse(saved) : DEFAULT_WORKSPACE;
  };

  // CRITICAL FIX: This updates both localStorage AND alerts React to trigger UI updates
  const saveWorkspaceData = (consignmentId, data) => {
    if (!consignmentId) return;
    localStorage.setItem(`workspace_${consignmentId}`, JSON.stringify(data));
    
    // Optional: Forces a safe state updates broadcast if you use this hook 
    // across multiple distant parent/child tree nodes
    window.dispatchEvent(new Event('storage_workspace_update'));
  };

  return {
    currency,
    setCurrency,
    consignments,
    setConsignments,
    getWorkspaceData,
    saveWorkspaceData
  };
}