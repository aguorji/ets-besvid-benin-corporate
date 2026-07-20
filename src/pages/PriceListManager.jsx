import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Edit2, Check, RefreshCw, DollarSign, Layers, ArrowUpRight } from 'lucide-react';

export default function PriceListManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Panel States
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: '',
    description: '',
    unit: 'KGS',
    standardSize: '55',
    targetPricePerUnit: '',
    notes: ''
  });
  
  // Inline Editing States
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  const fetchPriceList = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetching from your master product inventory endpoint
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error(`Server returned status: ${response.status}`);
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Error fetching price list:", err);
      setError("Failed to sync master price list. Verify backend server connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceList();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          itemCode: formData.itemCode.toUpperCase().trim(),
          standardSize: Number(formData.standardSize) || 0,
          targetPricePerUnit: Number(formData.targetPricePerUnit) || 0
        })
      });

      if (!response.ok) {
        const errResult = await response.json();
        throw new Error(errResult.message || 'Failed to save product.');
      }

      setFormData({ itemCode: '', description: '', unit: 'KGS', standardSize: '55', targetPricePerUnit: '', notes: '' });
      setShowAddForm(false);
      fetchPriceList();
    } catch (err) {
      alert(`🚨 Error creating product: ${err.message}`);
    }
  };

  // --- INLINE EDITING LOGIC ---
  const startEditing = (product) => {
    setEditingId(product._id);
    setEditData({ ...product });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const saveInlineEdit = async (id) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          standardSize: Number(editData.standardSize) || 0,
          targetPricePerUnit: Number(editData.targetPricePerUnit) || 0
        })
      });

      if (!response.ok) throw new Error('Failed to update product settings.');
      
      setEditingId(null);
      fetchPriceList();
    } catch (err) {
      alert(`🚨 Error updating: ${err.message}`);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(p => 
    p.itemCode?.toUpperCase().includes(searchQuery.toUpperCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Global calculations for valuation insights
  const totalTrackedCategories = products.length;
  const averageBaleValue = products.reduce((acc, curr) => {
    const size = curr.standardSize || 1;
    const price = curr.targetPricePerUnit || 0;
    return acc + (size * price);
  }, 0) / (totalTrackedCategories || 1);

  return (
    <div className="min-h-screen bg-off-white text-navy font-sans pb-20">
      
      {/* HEADER SECTION */}
      <section className="bg-navy text-white py-12 border-b-2 border-gold">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Price List & Profit Estimation Master</h1>
            <p className="text-white/60 text-xs md:text-sm mt-2 max-w-xl">
              Set standard weights and baseline target values per unit. These values act as dynamic benchmarks to estimate total yield profitability during container negotiations.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gold hover:bg-gold/90 text-navy font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded flex items-center gap-2 cursor-pointer transition-all shadow-md border-none"
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Close Intake Panel" : "Register Item Code"}
          </button>
        </div>
      </section>

      {/* PROFIT ESTIMATION SUMMARY CARDS */}
      <section className="max-w-6xl mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow-xs border-l-4 border-navy flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy/40">Monitored Items</p>
            <h3 className="text-xl font-bold font-mono mt-1 text-navy">{totalTrackedCategories} Categories</h3>
          </div>
          <Layers className="text-navy/20" size={28} />
        </div>
        
        <div className="bg-white p-4 rounded shadow-xs border-l-4 border-gold flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy/40">Est. Average Gross Bale Value</p>
            <h3 className="text-xl font-bold font-mono mt-1 text-navy">
              {averageBaleValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </h3>
          </div>
          <DollarSign className="text-gold/30" size={28} />
        </div>

        <div className="bg-white p-4 rounded shadow-xs border-l-4 border-green-500 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy/40">Margin Control Status</p>
            <h3 className="text-xs font-bold uppercase mt-2 text-green-600 flex items-center gap-1">
              <ArrowUpRight size={14} /> Ready for Sales Baseline
            </h3>
          </div>
        </div>
      </section>

      {/* NEW ITEM PORTAL */}
      {showAddForm && (
        <section className="max-w-6xl mx-auto px-6 mt-6 animate-fadeIn">
          <div className="bg-white border border-navy/10 rounded shadow-sm p-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-navy mb-4">
              Add New Product Reference & Base Estimation Target
            </h2>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Item Code / Reference</label>
                <input
                  type="text"
                  name="itemCode"
                  required
                  placeholder="e.g., LMD, PODR"
                  value={formData.itemCode}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Description / Category Name</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g., Light Mix Ladies, Polo Shirts Premium"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Base Counting Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-2 py-2 text-xs font-bold focus:outline-none focus:border-gold"
                >
                  <option value="KGS">KG (Bale Weight)</option>
                  <option value="PCS">PCS (Single Piece Count)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Standard Size (Qty or Weight per Bale)</label>
                <input
                  type="number"
                  name="standardSize"
                  required
                  value={formData.standardSize}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Target Baseline Price (per individual unit/KG)</label>
                <input
                  type="number"
                  name="targetPricePerUnit"
                  required
                  placeholder="Base valuation rate"
                  value={formData.targetPricePerUnit}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="flex items-end justify-end">
                <button
                  type="submit"
                  className="w-full bg-navy text-gold hover:bg-navy/90 font-bold text-xs uppercase tracking-widest py-2.5 rounded transition-all border-none cursor-pointer text-center"
                >
                  Commit to Master Catalog
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* FILTER & DATA MATRIX DISPLAY */}
      <main className="max-w-6xl mx-auto px-6 mt-6">
        <div className="bg-white border border-navy/10 rounded shadow-xs">
          
          {/* SEARCH COMPONENT HEADER */}
          <div className="p-4 border-b border-navy/5 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 text-navy/40" size={16} />
              <input
                type="text"
                placeholder="Search catalog by Item Code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-off-white border border-navy/10 rounded pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-gold"
              />
            </div>
            <button 
              onClick={fetchPriceList}
              className="text-navy/60 hover:text-navy p-2 rounded hover:bg-off-white transition-colors border-none bg-transparent cursor-pointer"
              title="Refresh Catalog Data"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* MASTER MATRIX TABLE */}
          {loading ? (
            <div className="text-center py-12 text-navy/60 text-xs font-bold uppercase tracking-wider">
              Syncing Master Catalog Matrices...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-navy/40 text-sm font-medium">
              No matching configurations or items detected inside the active list.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy text-white text-[10px] font-bold uppercase tracking-wider border-b border-gold">
                    <th className="py-3 px-4">Item Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Unit Type</th>
                    <th className="py-3 px-4">Standard size</th>
                    <th className="py-3 px-4">Est. Target Price / Unit</th>
                    <th className="py-3 px-4">Est. Value / Bale</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5 text-xs font-medium">
                  {filteredProducts.map((product) => {
                    const isEditing = editingId === product._id;
                    const size = isEditing ? editData.standardSize : product.standardSize;
                    const price = isEditing ? editData.targetPricePerUnit : product.targetPricePerUnit;
                    const calculatedBaleValue = (Number(size) || 0) * (Number(price) || 0);

                    return (
                      <tr key={product._id} className="hover:bg-off-white/40 transition-colors">
                        
                        {/* 1. Item Code */}
                        <td className="py-3.5 px-4 font-mono font-bold text-navy">{product.itemCode}</td>
                        
                        {/* 2. Description */}
                        <td className="py-3.5 px-4 text-navy/80">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData.description}
                              onChange={(e) => handleEditChange('description', e.target.value)}
                              className="bg-off-white border border-navy/20 rounded px-2 py-1 text-xs font-medium w-full max-w-xs focus:outline-none"
                            />
                          ) : (
                            product.description
                          )}
                        </td>
                        
                        {/* 3. Unit Display */}
                        <td className="py-3.5 px-4 font-bold text-[10px] text-navy/60">
                          {isEditing ? (
                            <select
                              value={editData.unit}
                              onChange={(e) => handleEditChange('unit', e.target.value)}
                              className="bg-off-white border border-navy/20 rounded px-1.5 py-0.5 text-xs outline-none"
                            >
                              <option value="KGS">KGS</option>
                              <option value="PCS">PCS</option>
                            </select>
                          ) : (
                            product.unit || 'KGS'
                          )}
                        </td>

                        {/* 4. Standard Size */}
                        <td className="py-3.5 px-4 font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editData.standardSize}
                              onChange={(e) => handleEditChange('standardSize', e.target.value)}
                              className="bg-off-white border border-navy/20 rounded px-2 py-1 text-xs font-bold w-20 text-center focus:outline-none"
                            />
                          ) : (
                            `${product.standardSize || 55} ${product.unit === 'PCS' ? 'items' : 'KG'}`
                          )}
                        </td>

                        {/* 5. Target Cost Rate Base */}
                        <td className="py-3.5 px-4 font-bold font-mono text-navy/70">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editData.targetPricePerUnit}
                              onChange={(e) => handleEditChange('targetPricePerUnit', e.target.value)}
                              className="bg-off-white border border-navy/20 rounded px-2 py-1 text-xs font-bold w-24 focus:outline-none"
                            />
                          ) : (
                            (product.targetPricePerUnit || 0).toLocaleString()
                          )}
                        </td>

                        {/* 6. Calculated Profit Target Estimation Block */}
                        <td className="py-3.5 px-4 font-bold font-mono text-gold-dark bg-off-white/30">
                          {calculatedBaleValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        {/* Actions Control */}
                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => saveInlineEdit(product._id)}
                              className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 transition cursor-pointer border-none mr-1"
                              title="Commit Row Changes"
                            >
                              <Check size={12} />
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditing(product)}
                              className="text-navy/60 hover:text-navy p-1.5 rounded hover:bg-off-white transition cursor-pointer border-none"
                              title="Modify Target Estimates"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}