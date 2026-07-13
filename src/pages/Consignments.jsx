import React, { useState, useEffect } from 'react';
import { Search, Loader2, Ship, Plus, X, CheckCircle, AlertCircle, Layers, Trash2 } from 'lucide-react';

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

  // --- DYNAMIC SORTING MODAL STATES ---
  const [showSortModal, setShowSortModal] = useState(false);
  const [activeSortShip, setActiveSortShip] = useState(null);
  
  // Houses our fully dynamic arrays matching our backend expectations
  const [sortedItems, setSortedItems] = useState([
    { product_ref: '', target_weight_g_bale: 55, actual_weight_g_bale: 55, bales_produced: '' }
  ]);
  const [byproductsSacked, setByproductsSacked] = useState([
    { byproduct_type: '', weight_kg: '', price_per_kg: '' }
  ]);
  const [sortLoading, setSortLoading] = useState(false);

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

  // --- DYNAMIC HANDLERS FOR SORTED BALES ---
  const handleAddSortedItem = () => {
    setSortedItems(prev => [...prev, { product_ref: '', target_weight_g_bale: 55, actual_weight_g_bale: 55, bales_produced: '' }]);
  };

  const handleRemoveSortedItem = (index) => {
    setSortedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSortedItemChange = (index, field, value) => {
    setSortedItems(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // --- DYNAMIC HANDLERS FOR BYPRODUCTS ---
  const handleAddByproduct = () => {
    setByproductsSacked(prev => [...prev, { byproduct_type: '', weight_kg: '', price_per_kg: '' }]);
  };

  const handleRemoveByproduct = (index) => {
    setByproductsSacked(prev => prev.filter((_, i) => i !== index));
  };

  const handleByproductChange = (index, field, value) => {
    setByproductsSacked(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
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

  // --- DYNAMIC SORTING TRANSACTION SUBMISSION ---
  const handleSortSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty rows to avoid bad database submissions
    const cleanItems = sortedItems.filter(item => item.product_ref.trim() !== '');
    const cleanByproducts = byproductsSacked.filter(by => by.byproduct_type.trim() !== '');

    if (cleanItems.length === 0) {
      alert("⚠️ You must log at least one completed bale variety!");
      return;
    }

    setSortLoading(true);
    try {
      const response = await fetch(`/api/consignments/${activeSortShip._id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sortedItems: cleanItems.map(item => ({
            product_ref: item.product_ref.toUpperCase(),
            target_weight_g_bale: Number(item.target_weight_g_bale),
            actual_weight_g_bale: Number(item.actual_weight_g_bale),
            bales_produced: Number(item.bales_produced)
          })),
          byproductsSacked: cleanByproducts.map(by => ({
            byproduct_type: by.byproduct_type.toUpperCase(),
            weight_kg: Number(by.weight_kg),
            price_per_kg: Number(by.price_per_kg)
          }))
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to complete sorting transaction.');

      alert(`🎉 Sorting run for ${activeSortShip.consignment_ref} processed and committed successfully!`);
      setShowSortModal(false);
      
      // Reset structures safely
      setSortedItems([{ product_ref: '', target_weight_g_bale: 55, actual_weight_g_bale: 55, bales_produced: '' }]);
      setByproductsSacked([{ byproduct_type: '', weight_kg: '', price_per_kg: '' }]);
      
      fetchConsignments();
    } catch (err) {
      console.error("Sorting transaction failure:", err);
      alert(`🚨 Error committing transaction: ${err.message}`);
    } finally {
      setSortLoading(false);
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
                        <button 
                          onClick={() => { setActiveSortShip(ship); setShowSortModal(true); }}
                          className="bg-navy text-gold text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded hover:bg-navy/90 cursor-pointer transition-all"
                        >
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

      {/* --- FULLY DYNAMIC RECONCILE/SORTING MODAL --- */}
      {showSortModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex justify-center items-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded border-t-4 border-gold max-w-4xl w-full p-6 shadow-2xl animate-fadeIn text-navy my-8">
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-navy/5">
              <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                <Layers size={22} className="text-gold" /> Process Sorting Manifest: {activeSortShip?.consignment_ref}
              </h3>
              <button 
                onClick={() => setShowSortModal(false)}
                className="text-navy/60 hover:text-navy transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-xs text-navy/60 mb-6">
              Establish output metrics for this sorted Giant Bale. Adding product codes and weights dynamically updates central master stock catalogs.
            </p>
            
            <form onSubmit={handleSortSubmit} className="space-y-6">
              
              {/* SECTION 1: DYNAMIC PACKED BALES */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-navy border-b-2 border-gold/40 pb-1">
                    1. Sorted Product Bales (Units)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSortedItem}
                    className="text-gold hover:text-gold/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Item Code
                  </button>
                </div>

                <div className="space-y-3">
                  {sortedItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-off-white/50 p-2 rounded border border-navy/5">
                      <div className="md:col-span-3">
                        <label className="block md:hidden text-[9px] font-bold uppercase text-navy/40">Product Code</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g., LMD, PODR"
                          value={item.product_ref}
                          onChange={(e) => handleSortedItemChange(index, 'product_ref', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-gold"
                        />
                      </div>
                      
                      <div className="md:col-span-3">
                        <label className="block md:hidden text-[9px] font-bold uppercase text-navy/40">Standard Size (KG)</label>
                        <input 
                          type="number" 
                          required
                          placeholder="Std KG (e.g. 55)"
                          value={item.target_weight_g_bale}
                          onChange={(e) => handleSortedItemChange(index, 'target_weight_g_bale', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block md:hidden text-[9px] font-bold uppercase text-navy/40">Actual Weight (KG)</label>
                        <input 
                          type="number" 
                          required
                          placeholder="Actual KG (e.g. 50)"
                          value={item.actual_weight_g_bale}
                          onChange={(e) => handleSortedItemChange(index, 'actual_weight_g_bale', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block md:hidden text-[9px] font-bold uppercase text-navy/40">Qty Produced</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          placeholder="Bales Count"
                          value={item.bales_produced}
                          onChange={(e) => handleSortedItemChange(index, 'bales_produced', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                        />
                      </div>

                      <div className="md:col-span-1 text-right">
                        {sortedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSortedItem(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: DYNAMIC BYPRODUCTS */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-navy border-b-2 border-gold/40 pb-1">
                    2. Sacked Byproduct Yields (Loose weight)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddByproduct}
                    className="text-gold hover:text-gold/80 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <Plus size={12} /> Add Byproduct Type
                  </button>
                </div>

                <div className="space-y-3">
                  {byproductsSacked.map((by, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-off-white/50 p-2 rounded border border-navy/5">
                      <div className="md:col-span-4">
                        <label className="block md:hidden text-[9px] font-bold uppercase text-navy/40">Byproduct Group</label>
                        <input 
                          type="text" 
                          placeholder="e.g., TROUSERS, HOUSEHOLDS"
                          value={by.byproduct_type}
                          onChange={(e) => handleByproductChange(index, 'byproduct_type', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block md:hidden text-[9px] font-bold uppercase text-navy/40">Total Weight (KG)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="Total weight (KG)"
                          value={by.weight_kg}
                          onChange={(e) => handleByproductChange(index, 'weight_kg', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block md:hidden text-[9px] font-bold uppercase text-navy/40">Target Price / KG</label>
                        <input 
                          type="number" 
                          placeholder="Selling Price per KG"
                          value={by.price_per_kg}
                          onChange={(e) => handleByproductChange(index, 'price_per_kg', e.target.value)}
                          className="w-full bg-white border border-navy/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-gold"
                        />
                      </div>

                      <div className="md:col-span-1 text-right">
                        {byproductsSacked.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveByproduct(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex justify-end gap-3 pt-4 border-t border-navy/5">
                <button 
                  type="button" 
                  onClick={() => setShowSortModal(false)}
                  className="text-navy/60 hover:text-navy text-xs font-bold uppercase tracking-wider px-3 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={sortLoading}
                  className="bg-navy text-gold hover:bg-navy/90 font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {sortLoading ? <Loader2 className="animate-spin" size={14} /> : "Write to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}