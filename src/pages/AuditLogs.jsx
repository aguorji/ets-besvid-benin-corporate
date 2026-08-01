// src/pages/AuditLogs.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatter'; // Standardized baseline formatter

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Fetches chronologically sorted corporate events
      const response = await apiClient.get('/audit-logs');
      setLogs(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Audit terminal sync failure:", err);
      setError("Failed to stream secure system operations logs from database node.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-mono text-xs text-navy">
      {/* Upper Navigation Control Panel */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => navigate('/dashboard')} 
          className="text-gray-500 hover:text-navy cursor-pointer bg-transparent border-none flex items-center gap-1.5 font-bold uppercase"
        >
          <ArrowLeft size={14} /> Central Terminal
        </button>
        <button 
          onClick={fetchLogs} 
          className="bg-gray-100 hover:bg-gray-200 text-navy font-bold px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer border-none transition-colors"
        >
          <RefreshCw size={12} /> Sync Ledger
        </button>
      </div>

      {/* Header Flag */}
      <div className="bg-navy text-white p-6 rounded-lg border-b-2 border-gold shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-bold text-gold flex items-center gap-2">
            <ShieldCheck size={20} className="text-gold" /> Workspace Activity Logs
          </h2>
          <p className="text-white/60 mt-1 text-[10px] tracking-wider uppercase">
            Immutable Real-Time Operations Security Journal
          </p>
        </div>
      </div>

      {/* Data Stream */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 animate-pulse">
          Streaming active database log frames...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          🚨 {error}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Execution Time</th>
                  <th className="p-3">Operator Node</th>
                  <th className="p-3">Action Module</th>
                  <th className="p-3">Payload Details</th>
                  <th className="p-3 text-right">Value Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-400 italic">
                      No recent operational transactions recorded in this cycle.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id || log.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-3 text-gray-400 text-[11px]">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-navy/5 text-navy border border-navy/10">
                          {log.operator_name || log.operator || 'System Daemon'}
                        </span>
                      </td>
                      <td className="p-3 font-bold uppercase text-[10px] text-gray-500">
                        {log.action_module || log.module || 'General Ledger'}
                      </td>
                      <td className="p-3 text-gray-600 text-[11px] max-w-xs truncate" title={log.details}>
                        {log.details || log.operation_details}
                      </td>
                      <td className="p-3 text-right font-bold text-navy">
                        {log.value_impact || log.amount > 0 ? formatCurrency(log.value_impact || log.amount) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}