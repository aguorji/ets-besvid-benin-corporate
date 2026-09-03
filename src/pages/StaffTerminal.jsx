// src/pages/StaffTerminal.jsx
import React, { useState } from 'react';
import { LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConsignmentData } from '../components/useConsignmentData';
import GeneralStockModal from '../components/GeneralStockModal';
import ConsignmentCommandCenter from './ConsignmentCommandCenter';

/**
 * StaffTerminal Component
 *
 * Previously this was an ~1000-line independent duplicate of
 * ConsignmentCommandCenter.jsx — same Production Ledger, Pricelist Matrix,
 * Sales, Byproduct, Expenses, and Stock logic, maintained as a second copy.
 * Every fix made to one never automatically applied to the other (this is
 * exactly how the pricelist-price and debounce bugs could have existed in
 * one and not the other without anyone noticing).
 *
 * Now this is a thin wrapper: it keeps the same "select a consignment" grid
 * staff are used to, then renders the SAME ConsignmentCommandCenter
 * Dashboard.jsx uses, with role="staff" to hide the two admin-only tabs
 * (Financial Reconciliation, Debt Tracking Analysis). One implementation,
 * two entry points.
 */
export default function StaffTerminal() {
  const { logout } = useAuth();
  const {
    consignments,
    getWorkspaceData,
    saveWorkspaceData,
    commitWorkspaceToBackend
  } = useConsignmentData();

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isGeneralStockOpen, setIsGeneralStockOpen] = useState(false);

  const getUnitLabel = (type) => {
    if (type === 'Shoes' || type === 'Bags') return 'Sacks';
    return 'Bales';
  };

  if (activeWorkspace) {
    return (
      <ConsignmentCommandCenter
        consignment={activeWorkspace}
        role="staff"
        currency={activeWorkspace.raw?.currency || '₦'}
        initialData={getWorkspaceData(activeWorkspace.id, activeWorkspace.raw)}
        onSaveData={(updatedData) => saveWorkspaceData(activeWorkspace.id, updatedData)}
        onCommitData={(updatedData) => commitWorkspaceToBackend(activeWorkspace.id, updatedData)}
        onBack={() => setActiveWorkspace(null)}
      />
    );
  }

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Consignments Manifest Registry</h1>
            <p className="text-slate-400 text-xs mt-0.5">Select a consignment shipment created via New Intake Registration to initiate wholesale dispatch operations.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGeneralStockOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 text-xs px-3.5 py-2 rounded-xl transition font-bold cursor-pointer shadow-md"
            >
              <Package className="w-4 h-4" /> General Stock
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-rose-400 border border-slate-700 text-xs px-3.5 py-2 rounded-xl transition font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </button>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          {consignments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No active consignments found. Create an intake registration from the admin dashboard first.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-4">Date Registered</th>
                    <th className="py-4 px-4">Consignment Reference</th>
                    <th className="py-4 px-4">Category Type</th>
                    <th className="py-4 px-4">Metrics Info</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {consignments && consignments.map((row, index) => (
                    <tr key={row.id || index} className="border-b border-slate-850 hover:bg-slate-800/30 transition text-slate-200">
                      <td className="py-4 px-4 text-xs text-slate-400 font-mono">{row.dateRegistered}</td>
                      <td className="py-4 px-4 font-bold text-white tracking-tight">{row.consignmentRef}</td>
                      <td className="py-4 px-4 text-xs">
                        <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${
                          row.type === 'Giant Bales'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-slate-300">
                        {getUnitLabel(row.type)}: <span className="text-white font-bold">{Number(row.totalVolumeCount || 0)}</span> | Wt: <span className="text-white font-bold">{Number(row.totalGrossMassWeight || 0).toLocaleString()} KGS</span>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setActiveWorkspace(row)}
                          className="bg-slate-800 hover:bg-slate-750 text-amber-500 hover:text-amber-400 font-bold text-xs border border-slate-700 rounded-lg px-3 py-1.5 transition cursor-pointer"
                        >
                          Open Dashboard
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <GeneralStockModal
          isOpen={isGeneralStockOpen}
          onClose={() => setIsGeneralStockOpen(false)}
          consignments={consignments}
          getWorkspaceData={getWorkspaceData}
          currency="₦"
        />

      </div>
    </div>
  );
}
