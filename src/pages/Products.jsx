import React, { useState, useEffect } from 'react';
import { Search, Loader2, Package, Plus, X, CheckCircle } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Form State Matrices
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: '',
    description: '',
    unit: 'KGS',
    standardSize: ''
  });
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  // Database Fetching Pipeline
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error(`Database connection failed: ${response.status}`);
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      console.error("Backend connection error:", err);
      setError("Could not connect to live inventory. Please refresh or try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Handle Form Inputs Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit New Master Product Row
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitLoading(true);
    setFormMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          standardSize: Number(formData.standardSize)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to establish product entry.');
      }

      setFormMessage({ type: 'success', text: `Product '${formData.itemCode.toUpperCase()}' registered successfully!` });
      setFormData({ itemCode: '', description: '', unit: 'KGS', standardSize: '' });
      
      // Dynamic live refresh without full page reload
      fetchInventory();
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message });
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Filter based on itemCode or description
  const filteredProducts = products.filter(product => {
    const codeMatch = product.itemCode?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const descMatch = product.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    return codeMatch || descMatch;
  });

  return (
    <div className="min-h-screen bg-off-white text-navy font-sans pb-20">

      {/* HEADER HERO ROW */}
      <section className="bg-navy text-white py-12 border-b-2 border-gold">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">Wholesale Product Catalog</h1>
            <p className="text-white/60 text-xs md:text-sm mt-2 max-w-xl">
              Live database sync with central storage magazines. Master item indices configured according to structural sheet entries.
            </p>
          </div>
          <button
            onClick={() => { setShowAdminForm(!showAdminForm); setFormMessage({ type: '', text: '' }); }}
            className="bg-gold hover:bg-gold/90 text-navy font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            {showAdminForm ? <X size={14} /> : <Plus size={14} />}
            {showAdminForm ? "Close Control Panel" : "Add New Item"}
          </button>
        </div>
      </section>

      {/* ADMIN DATA ENTRY MANAGEMENT INTERFACE */}
      {showAdminForm && (
        <section className="max-w-6xl mx-auto px-6 mt-6 animate-fadeIn">
          <div className="bg-white border-l-4 border-gold rounded shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-4 flex items-center gap-2">
              <Package size={16} className="text-gold" /> Master Item Registration Engine
            </h2>
            
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Item Code</label>
                <input
                  type="text"
                  name="itemCode"
                  required
                  placeholder="e.g., LMD"
                  value={formData.itemCode}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  required
                  placeholder="e.g., Ladies Mixed Dress"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-medium focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Unit</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full bg-off-white border border-navy/10 rounded px-2 py-2 text-xs font-bold focus:outline-none focus:border-gold"
                  >
                    <option value="KGS">KGS</option>
                    <option value="PCS">PCS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-navy/60 mb-1">Std Size</label>
                  <input
                    type="number"
                    name="standardSize"
                    required
                    placeholder="55"
                    value={formData.standardSize}
                    onChange={handleInputChange}
                    className="w-full bg-off-white border border-navy/10 rounded px-3 py-2 text-xs font-bold focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="w-full bg-navy text-gold hover:bg-navy/90 font-bold text-xs uppercase tracking-widest py-2.5 rounded transition-all cursor-pointer flex justify-center items-center"
                >
                  {formSubmitLoading ? <Loader2 className="animate-spin" size={14} /> : "Commit to DB Structure"}
                </button>
              </div>
            </form>

            {/* Notification Alerts */}
            {formMessage.text && (
              <div className={`mt-4 p-3 rounded text-xs font-medium flex items-center gap-2 ${
                formMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {formMessage.type === 'success' && <CheckCircle size={14} />}
                {formMessage.text}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FILTER CONTROLS HUB */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <div className="bg-white border border-navy/10 rounded p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-navy/40" size={16} />
            <input
              type="text"
              placeholder="Search by item code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-off-white border border-navy/10 rounded pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-gold font-medium text-navy placeholder:text-navy/40"
            />
          </div>
          <div className="text-[11px] font-bold text-navy/50 uppercase tracking-wider">
            Total Sheet Items: {filteredProducts.length}
          </div>
        </div>
      </section>

      {/* INVENTORY DISPLAY GRID */}
      <main className="max-w-6xl mx-auto px-6 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-navy/60">
            <Loader2 className="animate-spin text-gold" size={32} />
            <p className="text-xs font-bold tracking-widest uppercase">Connecting to stock inventory...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 text-red-700 rounded p-6 text-center text-xs font-medium">
            {error}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-navy/10 rounded p-12 text-center text-navy/50 font-medium text-sm">
            No live inventory items match your active search parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div key={product._id || product.id} className="bg-white border border-navy/10 rounded overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col">
                <div className="h-32 bg-navy flex items-center justify-center relative overflow-hidden group">
                  <Package className="text-gold/20 w-12 h-12 transform group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute bottom-3 left-3 bg-navy/90 text-white font-mono text-[11px] tracking-wider px-2 py-0.5 rounded border border-white/10">
                    {product.itemCode}
                  </span>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-serif text-base font-bold leading-snug text-navy">{product.itemCode}</h3>
                    <p className="text-xs text-navy/70 leading-relaxed min-h-[2.5rem]">{product.description || "No description provided."}</p>
                  </div>
                  <div className="border-t border-navy/5 pt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-navy/50 font-medium">Standard Size:</span>
                      <span className="font-bold text-navy">{product.standardSize} {product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-navy/50 font-medium">Unit Type:</span>
                      <span className="font-bold text-navy">{product.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}
