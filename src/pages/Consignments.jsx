import React, { useState, useEffect } from 'react';
import { Search, Loader2, Ship, Plus, X, CheckCircle, AlertCircle, Layers } from 'lucide-react';

export default function Consignments() {
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Display and Input States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    consignment_ref: '',
    type: 'direct_container',
    total_landing_cost: '',
    total_raw_weight: '',
    notes: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Data Fetching Pipeline
  const fetchConsignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/consignments');
      if (!response.ok) throw new Error(`Server returned status: ${response.status}`);
      const data = await response.json();
      setConsignments(data);
    } catch (err) {
      console.error("Manifest retrieval failure:", err);
      setError("Unable to sync with live consignment profiles. Verify backend server connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/consignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_landing_cost: Number(formData.total_landing_cost),
          total_raw_weight: formData.type === 'giant_bale' ? Number(formData.total_raw_weight) : 0
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to file manifest.');

      setFormMessage({ type: 'success', text: `Consignment '${formData.consignment_ref.toUpperCase()}' registered successfully.` });
      setFormData({ consignment_ref: '', type: 'direct_container', total_landing_cost: '', total_raw_weight: '', notes: '' });
      fetchConsignments();
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-off-white text-navy font-sans pb-20">
      
      {/* HEADER ROW */}
      <section className="bg-navy text-white py-12 border-b-2 border-gold">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Arrivals & Consignments</h1>
            <p className="text-white/60 text-xs md:text-sm mt-2 max-w-xl">
              Track incoming direct containers and local giant bale breakdown workflows with precision landing metrics.
            </p>
          </div>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setFormMessage({ type: '', text: '' }); }}
            className="bg-gold hover:bg-gold/90 text-navy font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Close Intake Panel" : "Log New Arrival"}
          </button>
        </div>
      </section>

      {/* MANIFEST ENTRY INTERFACE */}
      {showAddForm && (
        <section className="max-w-6xl mx-auto px-6 mt-6 animate-fadeIn">
          <div className="bg-white border-l-4 border-gold rounded shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-4 flex items-center gap-2">
              <Ship size={16} className="text-gold" /> Shipment Manifest Intake Portal
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Consignment Ref</label>
                  <input
                    type="text"
                    name="consignment_ref"
                    required
                    placeholder="e.g., BR-2026-01"
                    value={formData.consignment_ref}
                    onChange={handleInputChange}
                    className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Consignment Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-off-white border border-navy/10 rounded px-2 py-2 text-xs font-bold focus:outline-none focus:border-gold"
                  >
                    <option value="direct_container">Direct Container</option>
                    <option value="giant_bale">Giant Bale (Sorting Run)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Total Landing Cost</label>
                  <input
                    type="number"
                    name="total_landing_cost"
                    required
                    placeholder="Landed expenses amount"
                    value={formData.total_landing_cost}
                    onChange={handleInputChange}
                    className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-gold"
                  />
                </div>

                {formData.type === 'giant_bale' && (
                  <div className="animate-fadeIn">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Total Raw Weight (KGS)</label>
                    <input
                      type="number"
                      name="total_raw_weight"
                      required
                      placeholder="e.g., 2500"
                      value={formData.total_raw_weight}
                      onChange={handleInputChange}
                      className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-bold border-gold focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Manifest Notes / Port Details</label>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Vessel name, clearing coordinates, or loading benchmarks..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-gold"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-navy text-gold hover:bg-navy/90 font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitLoading ? <Loader2 className="animate-spin" size={14} /> : "Inject Shipment Profile"}
                </button>
              </div>
            </form>

            {formMessage.text && (
              <div className={`mt-4 p-3 rounded text-xs font-medium flex items-center gap-2 ${
                formMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {formMessage.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {formMessage.text}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ARRIVALS DATA MATRIX VIEW */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-navy/60">
            <Loader2 className="animate-spin text-gold mb-2" size={32} />
            <p className="text-xs font-bold tracking-widest uppercase">Syncing Manifest Ledgers...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 text-red-700 p-6 rounded text-center text-xs font-medium">
            {error}
          </div>
        ) : consignments.length === 0 ? (
          <div className="bg-white border border-navy/10 p-12 text-center text-navy/40 font-medium text-sm rounded">
            No tracked arrivals or container manifests detected on the current interface.
          </div>
        ) : (
          <div className="bg-white border border-navy/10 rounded shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-navy text-white text-[10px] font-bold uppercase tracking-wider border-b border-gold">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Landed Cost</th>
                  <th className="py-3 px-4">Date Filed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5 text-xs font-medium">
                {consignments.map((ship) => (
                  <tr key={ship._id} className="hover:bg-off-white/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">{ship.consignment_ref}</td>
                    <td className="py-3.5 px-4 uppercase text-[10px] tracking-wider">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        ship.type === 'direct_container' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {ship.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {ship.total_landing_cost.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-navy/60">{new Date(ship.arrival_date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 uppercase text-[10px]">
                      <span className={`font-bold ${ship.status === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>
                        ● {ship.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ship.type === 'giant_bale' && ship.status !== 'completed' ? (
                        <button className="bg-navy text-gold text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded hover:bg-navy/90 cursor-pointer transition-all">
                          Process Sorting Run
                        </button>
                      ) : (
                        <span className="text-navy/40 text-[10px] font-bold italic uppercase">Logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

    </div>
  );
}
