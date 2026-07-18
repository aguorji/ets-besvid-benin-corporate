// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatter';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Financial metrics states
  const [metrics, setMetrics] = useState({
    totalOutlay: 0,
    activeConsignmentsCount: 0,
    completedProcessingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        setLoading(true);
        // Hit our verified database communication pipeline
        const response = await apiClient.get('/consignments');
        const data = response.data || [];

        // Aggregate financial outlays and manifest states safely on the fly
        let aggregatedOutlay = 0;
        let activeCount = 0;
        let completedCount = 0;

        data.forEach(item => {
          // Fallback parsing to prevent NaN breaks if raw data properties differ slightly
          const totalCost = item.financials?.total_landing_cost || item.total_cost || 0;
          aggregatedOutlay += Number(totalCost);

          if (item.status === 'completed') {
            completedCount++;
          } else {
            activeCount++;
          }
        });

        setMetrics({
          totalOutlay: aggregatedOutlay,
          activeConsignmentsCount: activeCount,
          completedProcessingCount: completedCount
        });
        setError(null);
      } catch (err) {
        console.error('Metrics loading roadblock:', err);
        setError('Failed to securely synchronize live corporate ledgers.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Upper Control Panel Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-serif text-gray-900 font-bold">Corporate Console</h1>
          <p className="text-xs text-gray-500 mt-1 font-mono tracking-tight">Active Node: Multi-Currency Ledger Aggregator</p>
        </div>
        <button 
          onClick={logout}
          className="bg-red-600 text-white text-xs px-4 py-2 rounded font-bold uppercase tracking-wider cursor-pointer border-none hover:bg-red-700 transition-colors"
        >
          Secure Disconnect
        </button>
      </div>

      {/* Primary Sub-Navigation Row */}
      <div className="bg-white border border-gray-200 rounded p-4 flex gap-4 shadow-sm">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="bg-navy text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer border-none"
        >
          Overview Console
        </button>
        <button 
          onClick={() => navigate('/consignments')} 
          className="bg-gray-100 text-gray-700 hover:bg-gold hover:text-navy text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer border-none transition-colors"
        >
          Manage Shipments & Arrivals
        </button>
      </div>

      {/* Conditional Handling Zones */}
      {loading ? (
        <div className="py-12 text-center text-sm font-medium text-gray-400 font-mono animate-pulse">
          Synchronizing transactional data boundaries...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-xs font-mono">
          🚨 {error}
        </div>
      ) : (
        /* The Executive Visual Summary Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Total Corporate Capital Commitment */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Total Operational Outlay</span>
            <span className="text-3xl font-mono font-bold text-gray-800 tracking-tight mt-2 block">
              {formatCurrency(metrics.totalOutlay)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded w-max mt-4">
              Live DB Aggregation
            </span>
          </div>

          {/* Card 2: Transit Control Volumes */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Active Manifests In Transit</span>
            <span className="text-4xl font-mono font-bold text-navy mt-2 block">
              {metrics.activeConsignmentsCount}
            </span>
            <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded w-max mt-4">
              Pending Port Clearance
            </span>
          </div>

          {/* Card 3: Historical Runs Metric */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Completed Shipments</span>
            <span className="text-4xl font-mono font-bold text-gray-800 mt-2 block">
              {metrics.completedProcessingCount}
            </span>
            <span className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded w-max mt-4">
              Fully Reconciled
            </span>
          </div>

        </div>
      )}
    </div>
  );
}