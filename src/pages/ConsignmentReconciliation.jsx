// src/pages/ConsignmentReconciliation.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { ArrowLeft, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function ConsignmentReconciliation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReconciliationData = async () => {
      try {
        setLoading(true);
        // Backend aggregation pipeline returns data matching your tabs
        const response = await apiClient.get(`/consignments/${id}/reconciliation`);
        setData(response.data);
      } catch (err) {
        console.error("Failed to load calculation sheets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReconciliationData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto font-mono text-xs text-gray-400 animate-pulse">
        Reconciling ledger calculations from database nodes...
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-8 max-w-6xl mx-auto font-mono text-xs text-red-600">
        🚨 Ledger sheet not found or server link broken.
      </div>
    );
  }

  // Was hardcoded to Intl.NumberFormat('en-NG', ..., currency: 'NGN'), which
  // always rendered Naira regardless of the currency chosen at intake.
  // Plain symbol + grouped number works for ₦ / CFA / $ alike.
  const formatNaira = (val) => `${currency}${Number(val || 0).toLocaleString()}`;

  // The backend actually returns { manifest, financials, ledgers } — this
  // was previously reading everything as if it were flat on `data` itself,
  // so every field silently fell back to 0/N/A regardless of what the API
  // returned, even once the routing itself was fixed.
  const manifest = data.manifest || {};
  const financials = data.financials || {};
  const currency = manifest.currency || localStorage.getItem('dashboard_currency') || '₦';

  const consignmentRef = manifest.consignment_ref || 'N/A';
  const totalBaleRevenue = Number(financials.totalBaleRevenue ?? 0);
  const byproductRevenue = Number(financials.byproductRevenue ?? 0);
  const totalRevenue = Number(financials.totalRevenue ?? 0);
  // totalCost is landing cost + expenses combined — baseLandingCost is
  // shown separately below since that's specifically what's needed to
  // compute the business position, not the combined figure.
  const baseLandingCost = Number(manifest.total_landing_cost ?? 0);
  const totalCost = Number(financials.totalCost ?? 0);
  const totalExpenses = Number(financials.totalExpenses ?? 0);
  const stockValue = Number(financials.stockValue ?? 0);
  const totalDebt = Number(financials.totalDebt ?? 0);
  const netProfit = Number(financials.netProfit ?? 0);
  const realCashPosition = Number(financials.realCashPosition ?? 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs text-navy bg-off-white min-h-screen">
      
      {/* Back Button Link */}
      <button 
        onClick={() => navigate('/dashboard')} 
        className="text-gray-500 hover:text-navy mb-2 cursor-pointer bg-transparent border-none flex items-center gap-1.5 font-bold uppercase transition-colors"
      >
        <ArrowLeft size={14} /> Return to Central Terminal
      </button>

      {/* Corporate Identity Sheet Header */}
      <div className="bg-navy text-white p-6 rounded-lg border-b-2 border-gold shadow-xs">
        <h2 className="text-lg font-serif font-bold text-gold">
          {consignmentRef.replace("-", "/")} — Statement of Ledger Sheets
        </h2>
        <p className="text-white/60 mt-1 font-mono tracking-wider text-[10px]">
          STATUS REPORT & OPERATIONAL RECONCILIATION MATRIX
        </p>
      </div>

      {/* The Reconciled Balanced Matrix (Mirroring Excel Layouts) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Revenue Inflows */}
        <div className="bg-white border border-gray-200 rounded p-4 flex flex-col justify-between shadow-sm space-y-3">
          <div>
            <h4 className="font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5 flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-600" /> Revenue Matrix
            </h4>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-gray-600">
                <span>Total Bale Sales:</span>
                <span className="font-bold">{formatNaira(totalBaleRevenue)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Byproduct Yields:</span>
                <span className="font-bold">{formatNaira(byproductRevenue)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 font-bold text-navy text-[13px]">
            <span>Total Inflows:</span>
            <span>{formatNaira(totalRevenue)}</span>
          </div>
        </div>

        {/* Card 2: Cost Pool & Assets */}
        <div className="bg-white border border-gray-200 rounded p-4 flex flex-col justify-between shadow-sm space-y-3">
          <div>
            <h4 className="font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5 flex items-center gap-1">
              <Activity size={12} className="text-red-500" /> Outlay & Valuation
            </h4>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-gray-600">
                <span>Base Landing Cost:</span>
                <span className="font-bold">{formatNaira(baseLandingCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Cost Pool:</span>
                <span className="font-bold text-red-600">{formatNaira(totalCost)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Operational Fees:</span>
                <span className="font-bold text-red-600">{formatNaira(totalExpenses)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3 font-bold text-gold text-[13px]">
            <span>Stock Book Value:</span>
            <span>{formatNaira(stockValue)}</span>
          </div>
        </div>

        {/* Card 3: True Capital Position */}
        <div className="bg-white border border-gray-200 rounded p-4 flex flex-col justify-between shadow-sm space-y-3">
          <div>
            <h4 className="font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5 flex items-center gap-1">
              <TrendingUp size={12} className="text-navy" /> Net Position
            </h4>
            <div className="space-y-2 mt-3">
              <div className="flex justify-between text-gray-600">
                <span>Outstanding Debt:</span>
                <span className="font-bold text-amber-600">{formatNaira(totalDebt)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-700">
                <span>Net Profit (Accrual):</span>
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatNaira(netProfit)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between font-bold text-xs text-white bg-navy p-2.5 rounded shadow-xs">
            <span>Real Cash Balance:</span>
            <span className="text-gold">{formatNaira(realCashPosition)}</span>
          </div>
        </div>

      </div>

      {/* Sub-tab placeholder zone for nested item ledgers */}
      <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400">
        📌 Section open for sub-tab components (Expenses Logs, Physical Stock Tallies, and Debt Recovery Actions).
      </div>
      
    </div>
  );
}