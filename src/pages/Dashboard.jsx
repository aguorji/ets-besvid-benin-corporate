import React, { useState } from 'react';
import { Plus, Package, Globe } from 'lucide-react';
import ConsignmentCommandCenter from './ConsignmentCommandCenter';
import { useConsignmentData } from '../components/useConsignmentData';

export default function Dashboard() {
  const { 
    currency, 
    setCurrency, 
    consignments, 
    setConsignments, 
    getWorkspaceData, 
    saveWorkspaceData 
  } = useConsignmentData();

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    consignmentRef: '',
    type: 'Giant Bales',
    vesselIdentity: '',
    estBaseLandingCost: '',
    totalVolumeCount: '',
    totalGrossMassWeight: ''
  });

  const handleCreateManifest = (e) => {
    e.preventDefault();
    const newManifest = {
      id: Date.now().toString(),
      dateRegistered: new Date().toISOString().split('T')[0],
      consignmentRef: formData.consignmentRef,
      type: formData.type,
      vesselIdentity: formData.vesselIdentity,
      estBaseLandingCost: Number(formData.estBaseLandingCost),
      totalVolumeCount: Number(formData.totalVolumeCount),
      totalGrossMassWeight: Number(formData.totalGrossMassWeight),
      status: 'Active'
    };

    setConsignments([newManifest, ...consignments]);
    setIsModalOpen(false);
    setFormData({ 
      consignmentRef: '', 
      type: 'Giant Bales', 
      vesselIdentity: '', 
      estBaseLandingCost: '', 
      totalVolumeCount: '', 
      totalGrossMassWeight: '' 
    });
  };

  if (activeWorkspace) {
    return (
      <ConsignmentCommandCenter 
        consignment={activeWorkspace} 
        currency={currency}
        initialData={getWorkspaceData(activeWorkspace.id)}
        onSaveData={(updatedData) => saveWorkspaceData(activeWorkspace.id, updatedData)}
        onBack={() => setActiveWorkspace(null)} 
      />
    );
  }

  const getUnitLabel = (type) => {
    if (type === 'Shoes' || type === 'Bags') return 'Sacks';
    return 'Bales';
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Consignments Manifest Registry</h1>
            <p className="text-slate-400 text-xs mt-0.5">Initialize profiles for incoming Giant Bales, Direct Bales, Shoes, or Bags.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {/* Currency Symbol Selection Dropdown */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 gap-2">
              <Globe className="w-4 h-4 text-amber-500" />
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-sm text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="₦">Naira (₦)</option>
                <option value="CFA">FCFA (CFA)</option>
                <option value="$">USD ($)</option>
              </select>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-500 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-amber-400 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> New Intake Registration
            </button>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
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
                {consignments.map((row) => (
                  <tr key={row.id} className="border-b border-slate-850 hover:bg-slate-800/30 transition text-slate-200">
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
                      {getUnitLabel(row.type)}: <span className="text-white font-bold">{row.totalVolumeCount}</span> | Wt: <span className="text-white font-bold">{row.totalGrossMassWeight.toLocaleString()} KGS</span>
                    </td>
                    <td className="py-4 px-4 text-xs">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => setActiveWorkspace(row)}
                        className="bg-slate-800 hover:bg-slate-750 text-amber-500 hover:text-amber-400 font-bold text-xs border border-slate-700 rounded-lg px-3 py-1.5 transition"
                      >
                        Open Dashboard
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> Manifest Intake Setup Profile
              </h2>
              <p className="text-slate-400 text-xs mb-4">Initialize tracking data profiles for inventory tracking.</p>

              <form onSubmit={handleCreateManifest} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Consignment Category Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Giant Bales">Giant Bales</option>
                    <option value="Direct Bales">Direct Bales</option>
                    <option value="Shoes">Shoes (Sacks)</option>
                    <option value="Bags">Bags (Sacks)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Consignment Ref</label>
                  <input type="text" required placeholder="e.g. GB-2026-XYZ" value={formData.consignmentRef} onChange={e => setFormData({...formData, consignmentRef: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Vessel / Carrier Identity</label>
                  <input type="text" required placeholder="Carrier details" value={formData.vesselIdentity} onChange={e => setFormData({...formData, vesselIdentity: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Est. Base Landing Cost ({currency})</label>
                  <input type="number" required placeholder="Landing baseline cost" value={formData.estBaseLandingCost} onChange={e => setFormData({...formData, estBaseLandingCost: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Total Count ({getUnitLabel(formData.type)})</label>
                    <input type="number" required placeholder="Count" value={formData.totalVolumeCount} onChange={e => setFormData({...formData, totalVolumeCount: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Gross Weight (KGS)</label>
                    <input type="number" required placeholder="Mass" value={formData.totalGrossMassWeight} onChange={e => setFormData({...formData, totalGrossMassWeight: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-slate-750 transition">Cancel</button>
                  <button type="submit" className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-amber-400 transition">Commit Data Profile</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}