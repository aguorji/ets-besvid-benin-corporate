// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatter';
import { ShieldAlert, TrendingUp, DollarSign, Layers, ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Financial metrics states
  const [metrics, setMetrics] = useState({
    totalOutlay: 0,
    activeConsignmentsCount: 0,
    completedProcessingCount: 0,
    totalSalesRevenue: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Pull core consignment layout parameters
        const consResponse = await apiClient.get('/consignments');
        const consData = consResponse.data || [];

        let aggregatedOutlay = 0;
        let activeCount = 0;
        let completedCount = 0;

        consData.forEach(item => {
          const totalCost = item.financials?.total_landing_cost || item.total_cost || 0;
          aggregatedOutlay += Number(totalCost);

          if (item.status === 'completed') {
            completedCount++;
          } else {
            activeCount++;
          }
        });

        // 2. Fetch recent sales logs for administrative audit trail transparency
        let salesRevenue = 0;
        let activitiesList = [];
        try {
          const salesResponse = await apiClient.get('/sales');
          const salesData = salesResponse.data || [];
          
          salesRevenue = salesData.reduce((sum, item) => sum + (item.grossTotal || 0), 0);
          
          // Format raw sales updates into readable audit rows
          activitiesList = salesData.map(sale => ({
            id: sale._id,
            timestamp: sale.date || sale.createdAt,
            operator: sale.createdBy || 'Staff Terminal',
            details: `Logged invoice for ${sale.customerName} - ${sale.items?.length || 0} items items loaded.`,
            amount: sale.grossTotal || 0
          })).slice(0, 5); // display top 5 most recent activities
        } catch (salesErr) {
          console.warn("Sales ledger pipeline bypass:", salesErr);
          // Fallback if backend /api/sales is still spooling up
          activitiesList = [
            { id: 1, timestamp: '2026-07-20', operator: 'System Monitor', details: 'Sales tracking engine active. Awaiting fresh database logs.', amount: 0 }
          ];
        }

        setMetrics({
          totalOutlay: aggregatedOutlay,
          activeConsignmentsCount: activeCount,
          completedProcessingCount: completedCount,
          totalSalesRevenue: salesRevenue
        });
        setRecentActivities(activitiesList);
        setError(null);
      } catch (err) {
        console.error('Metrics loading roadblock:', err);
        setError('Failed to securely synchronize live corporate ledgers.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      <div className="bg-white border border-gray-200 rounded p-4 flex flex-wrap gap-3 shadow-sm">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="bg-navy text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer border-none shadow-xs"
        >
          Overview Console
        </button>
        <button 
          onClick={() => navigate('/consignments')} 
          className="bg-gray-100 text-gray-700 hover:bg-gold hover:text-navy text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer border-none transition-colors"
        >
          Manage Shipments & Arrivals
        </button>
        <button 
          onClick={() => navigate('/pricelist')} 
          className="bg-gray-100 text-gray-700 hover:bg-gold hover:text-navy text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer border-none transition-colors"
        >
          Price Catalog Baseline
        </button>
        <button 
          onClick={() => navigate('/salesledger')} 
          className="bg-gray-100 text-gray-700 hover:bg-gold hover:text-navy text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded cursor-pointer border-none transition-colors"
        >
          Sales Invoicing Engine
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
        <>
          {/* The Executive Visual Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Total Corporate Capital Commitment */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1.5">
                <Layers size={14} className="text-gray-400" /> Total Operational Outlay
              </span>
              <span className="text-3xl font-mono font-bold text-gray-800 tracking-tight mt-2 block">
                {formatCurrency(metrics.totalOutlay)}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded w-max mt-4">
                Live DB Aggregation
              </span>
            </div>

            {/* Card 2: Transit Control Volumes */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1.5">
                <TrendingUp size={14} className="text-navy" /> Active Manifests In Transit
              </span>
              <span className="text-4xl font-mono font-bold text-navy mt-2 block">
                {metrics.activeConsignmentsCount}
              </span>
              <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded w-max mt-4">
                Pending Port Clearance
              </span>
            </div>

            {/* Card 3: Aggregated Sales Turnovers */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-600" /> Recorded Sales Valuation
              </span>
              <span className="text-3xl font-mono font-bold text-emerald-700 mt-2 block">
                {formatCurrency(metrics.totalSalesRevenue)}
              </span>
              <span className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded w-max mt-4">
                Gross Turnover Base
              </span>
            </div>

          </div>

          {/* DYNAMIC ADMINISTRATIVE AUDIT STREAM MATRIX */}
          <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden mt-4">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={14} className="text-amber-600" /> Real-Time Workspace Audit Trail
              </h2>
              <span className="text-[9px] font-mono bg-navy text-white px-2 py-0.5 rounded font-bold uppercase">
                Global Monitor Active
              </span>
            </div>
            
            <div className="p-2 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Account Node</th>
                    <th className="p-3">Operation Details</th>
                    <th className="p-3 text-right">Transaction Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                  {recentActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-off-white/50 transition-colors">
                      <td className="p-3 text-gray-400 font-mono text-[11px]">{act.timestamp?.split('T')[0]}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-navy/5 text-navy border border-navy/10">
                          {act.operator}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 text-[11px]">{act.details}</td>
                      <td className="p-3 text-right font-mono font-bold text-navy">
                        {act.amount > 0 ? formatCurrency(act.amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}