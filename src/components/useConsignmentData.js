// src/components/useConsignmentData.js
import { useState, useEffect, useCallback, useRef } from 'react';
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
        totalVolumeCount: item.total_volume_count || item.totalVolumeCount || 0,
        // Previously fell back to item.total_landing_cost here, which meant
        // "gross weight" could silently display the landing cost instead —
        // two different, unrelated quantities. Fixed to only ever read
        // actual weight fields, defaulting to 0 (shown honestly as unknown)
        // rather than a wrong number that looks plausible.
        totalGrossMassWeight: item.total_gross_weight || item.totalGrossMassWeight || 0,
        // total_landing_cost was never exposed as its own field before —
        // anything trying to display "Base Landing Cost" from this
        // normalized object had nothing to read. Kept in snake_case too
        // since ConsignmentCommandCenter.jsx reads consignment?.total_landing_cost
        // directly, not a camelCase version.
        totalLandingCost: item.total_landing_cost || 0,
        total_landing_cost: item.total_landing_cost || 0,
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
   * Rebuilds ConsignmentCommandCenter's productionList/pricelist shape from
   * the backend's production_items — the inverse of buildProductionItemsPayload
   * below. Used as a fallback when local storage is empty (e.g. after a
   * localStorage.clear(), a new device/browser, or clearing site data), so
   * the ledger view is reconstructed from the real database record instead
   * of just showing blank.
   */
  const rebuildWorkspaceFromProductionItems = (productionItems = []) => {
    const productionList = [];
    const pricelistMap = new Map();

    productionItems.forEach((row, idx) => {
      const item = row.itemCode || '';
      const stdSize = row.standardSize || 0;
      const actualSize = row.actualSize || stdSize;
      const isVariance = actualSize !== stdSize;
      const rowId = `${item}-${actualSize}-${idx}`;

      productionList.push({
        id: rowId,
        item,
        unit: row.unit || '',
        stdSize,
        qty: row.balesQuantity || 0,
        actualSize,
        isVariance
      });

      if (!pricelistMap.has(item)) {
        // id must be set here — handlePricelistChange in
        // ConsignmentCommandCenter.jsx matches rows by id, and a missing id
        // (undefined) matched EVERY row at once, causing one price edit to
        // overwrite every item's price simultaneously.
        pricelistMap.set(item, {
          id: rowId,
          item,
          unit: row.unit || '',
          stdSize,
          stdPrice: row.priceStd || 0,
          qty: 0,
          varianceBales: []
        });
      }
      const entry = pricelistMap.get(item);
      if (isVariance) {
        entry.varianceBales.push({ id: rowId, actualSize, qty: row.balesQuantity || 0 });
      } else {
        entry.qty += row.balesQuantity || 0;
      }
    });

    return {
      productionList,
      pricelist: Array.from(pricelistMap.values()),
      salesLog: [],
      byproductSales: [],
      expenses: []
    };
  };

  /**
   * Retrieves the current production/pricelist data for a consignment.
   *
   * Previously this checked local storage FIRST and only fell back to the
   * backend if the cache was empty — meaning once a browser cached a
   * consignment even once, it would keep showing that same snapshot
   * forever, never re-checking whether the backend had moved on. That's
   * exactly why price updates made by admin (then committed via the
   * "Update" button) never appeared in staff's already-cached view: staff's
   * browser had no way to know a different session had updated anything.
   *
   * Now the backend's committed data (rawConsignment.production_items) is
   * always preferred when it exists — that's the real, shared source of
   * truth for a multi-user app. Local storage is only a fallback for the
   * rare case where the backend genuinely has nothing yet.
   */
  const getWorkspaceData = (consignmentId, rawConsignment) => {
    if (rawConsignment?.production_items?.length) {
      const rebuilt = rebuildWorkspaceFromProductionItems(rawConsignment.production_items);
      try {
        localStorage.setItem(`workspace_${consignmentId}`, JSON.stringify(rebuilt));
      } catch (e) {
        console.error("Error caching rebuilt workspace data:", e);
      }
      return rebuilt;
    }

    // Backend has nothing for this consignment yet — fall back to local
    // cache (e.g. a genuinely new consignment whose data hasn't been
    // committed via Update yet, or a rare offline scenario).
    try {
      const data = localStorage.getItem(`workspace_${consignmentId}`);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Error reading workspace data:", e);
    }

    return {};
  };

  /**
   * Transforms ConsignmentCommandCenter's internal productionList/pricelist
   * shape into the production_items shape the backend actually expects
   * (see syncProductionToProducts in consignmentRoutes.js).
   */
  const buildProductionItemsPayload = (productionList = [], pricelist = []) => {
    return productionList.map(prod => {
      const priceEntry = pricelist.find(
        p => p.item?.toLowerCase() === prod.item?.toLowerCase()
      );
      return {
        itemCode: prod.item,
        description: prod.item,
        unit: prod.unit,
        standardSize: parseFloat(prod.stdSize) || 0,
        actualSize: parseFloat(prod.actualSize) || 0,
        priceStd: priceEntry?.stdPrice || 0,
        adjustedPrice: priceEntry?.stdPrice || 0,
        balesQuantity: prod.qty
      };
    });
  };

  /**
   * Saves workspace state locally only — instant, every change, so nothing
   * is lost if the tab closes. This NO LONGER auto-syncs to the backend.
   * Auto-sync was the root cause of two separate incidents: a mid-typing
   * itemCode correction registering multiple partial ProductItem documents,
   * and (via a since-fixed bug) a single price edit briefly overwriting
   * every item's price before the next auto-save could catch it. Use
   * commitWorkspaceToBackend below for an explicit, user-triggered save.
   */
  const saveWorkspaceData = (consignmentId, workspaceData) => {
    try {
      localStorage.setItem(`workspace_${consignmentId}`, JSON.stringify(workspaceData));
    } catch (e) {
      console.error("Error saving workspace data locally:", e);
    }
  };

  /**
   * Explicitly pushes the current workspace state to the backend. Call this
   * from a deliberate user action (an "Update"/"Commit" button), never
   * automatically from a change effect — that's the whole point of
   * separating this from saveWorkspaceData above.
   */
  const commitWorkspaceToBackend = async (consignmentId, workspaceData) => {
    const production_items = buildProductionItemsPayload(
      workspaceData.productionList,
      workspaceData.pricelist
    );

    if (production_items.length === 0) {
      console.warn(
        `Skipped backend commit for consignment ${consignmentId}: productionList was empty. ` +
        `If this consignment should genuinely be empty, this needs a different, explicit path — not a silent skip.`
      );
      return { success: false, reason: 'empty' };
    }

    try {
      await apiClient.put(`/consignments/${consignmentId}/production`, { production_items });
      return { success: true };
    } catch (e) {
      console.error("Failed to commit production data to backend:", e.response?.data || e.message);
      return { success: false, reason: 'error', error: e };
    }
  };

  /**
   * When a sale is fulfilled from a DIFFERENT consignment's stock (the item
   * was out of stock in the consignment currently open, but available
   * elsewhere), this records a zero-revenue entry against that OTHER
   * consignment's own salesLog — so its balance math correctly reflects the
   * depletion, without double-counting revenue (the real revenue is already
   * recorded on the invoice under the consignment actually being viewed).
   * This restores behavior the old standalone StaffTerminal.jsx had, which
   * was otherwise silently dropped when it was consolidated to share
   * ConsignmentCommandCenter with Dashboard.jsx — that component already
   * supports this via its allConsignmentsData/onCrossConsignmentStockUpdate
   * props, but nothing was actually calling them until now.
   */
  const handleCrossConsignmentStockUpdate = (otherConsignmentId, itemCode, actualSize, qtySold) => {
    const otherData = getWorkspaceData(otherConsignmentId) || {};
    const updatedSalesLog = [
      ...(otherData.salesLog || []),
      {
        id: `cross-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        customer: '(fulfilled via another consignment)',
        items: [{ itemCode, actualSize, qty: qtySold, sellingPrice: 0, revenue: 0 }],
        total: 0
      }
    ];
    saveWorkspaceData(otherConsignmentId, { ...otherData, salesLog: updatedSalesLog });
  };

  return {
    consignments,
    currency,
    loading,
    error,
    refreshConsignments: fetchConsignments,
    getWorkspaceData,
    saveWorkspaceData,
    commitWorkspaceToBackend,
    handleCrossConsignmentStockUpdate
  };
}