import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Trash2, CheckCircle2, AlertCircle, 
  LogOut, RefreshCw, Calculator, DollarSign, Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function StaffTerminal() {
  const { user, logout } = useAuth();

  // Active Tab: 'standard' or 'byproduct'
  const [activeTab, setActiveTab] = useState('standard');

  // Loading & Notification feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Form State for Standard Sales
  const [standardForm, setStandardForm] = useState({
    customerName: '',
    itemDescription: '',
    categoryType: 'Giant Bales',
    quantity: 1,
    unitPrice: '',
    paymentMethod: 'Cash',
    consignmentRef: '',
    notes: ''
  });

  // 2. Form State for Byproduct / Scrap Sales
  const [byproductForm, setByproductForm] = useState({
    customerName: '',
    byproductType: 'Torn Wrapper Scrap',
    weightKgs: '',
    pricePerKg: '',
    paymentMethod: 'Cash',
    notes: ''
  });

  // Auto-dismiss notification banners after 5 seconds
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Derived Calculations
  const standardTotalAmount = Number(standardForm.quantity || 0) * Number(standardForm.unitPrice || 0);
  const byproductTotalAmount = Number(byproductForm.weightKgs || 0) * Number(byproductForm.pricePerKg || 0);

  // Submit Handler for Standard Goods Sale
  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload = {
      saleType: 'Standard',
      operatorName: user?.name || 'Staff Operator',
      customerName: standardForm.customerName,
      itemDescription: standardForm.itemDescription,
      categoryType: standardForm.categoryType,
      quantity: Number(standardForm.quantity),
      unitPrice: Number(standardForm.unitPrice),
      totalAmount: standardTotalAmount,
      paymentMethod: standardForm.paymentMethod,
      consignmentRef: standardForm.consignmentRef,
      notes: standardForm.notes
    };

    try {
      const response = await apiClient.post('/sales', payload);

      if (response.data) {
        setSuccessMsg(`Standard sale (#${response.data._id || 'SUCCESS'}) recorded successfully!`);
        // Reset Form
        setStandardForm({
          customerName: '',
          itemDescription: '',
          categoryType: 'Giant Bales',
          quantity: 1,
          unitPrice: '',
          paymentMethod: 'Cash',
          consignmentRef: '',
          notes: ''
        });
      }
    } catch (err) {
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setErrorMsg(backendError || 'Failed to record standard sale. Check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Byproduct / Scrap Sale
  const handleByproductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    const payload = {
      saleType: 'Byproduct',
      operatorName: user?.name || 'Staff Operator',
      customerName: byproductForm.customerName,
      itemDescription: byproductForm.byproductType,
      weightKgs: Number(byproductForm.weightKgs),
      pricePerKg: Number(byproductForm.pricePerKg),
      totalAmount: byproductTotalAmount,
      paymentMethod: byproductForm.paymentMethod,
      notes: byproductForm.notes
    };

    try {
      const response = await apiClient.post('/sales', payload);

      if (response.data) {
        setSuccessMsg(`Byproduct scrap sale recorded successfully! Total: ${byproductTotalAmount.toLocaleString()}`);
        // Reset Form
        setByproductForm({
          customerName: '',
          byproductType: 'Torn Wrapper Scrap',
          weightKgs: '',
          pricePerKg: '',
          paymentMethod: 'Cash',
          notes: ''
        });
      }
    } catch (err) {
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setErrorMsg(backendError || 'Failed to record byproduct sale. Check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Yard Operations Terminal
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Staff Sales Terminal</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Logged in as: <span className="text-white font-semibold">{user?.name || 'Staff Operator'}</span> ({user?.role || 'user'})
            </p>
          </div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs px-4 py-2 rounded-xl transition font-semibold"
          >
            <LogOut className="w-4 h-4" /> Exit Session
          </button>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm shadow-lg animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm shadow-lg animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Tab Selection Navigation */}
        <div className="flex bg-slate-800/60 p-1.5 rounded-2xl border border-slate-800 max-w-md">
          <button
            onClick={() => setActiveTab('standard')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'standard'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Standard Bales & Goods
          </button>
          
          <button
            onClick={() => setActiveTab('byproduct')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'byproduct'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trash2 className="w-4 h-4" /> Byproduct & Scrap Sales
          </button>
        </div>

        {/* TAB 1: Standard Goods Form */}
        {activeTab === 'standard' && (
          <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" /> Dispatch Standard Goods Order
            </h2>

            <form onSubmit={handleStandardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Customer Name / Buyer</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alhaji Ibrahim"
                    value={standardForm.customerName}
                    onChange={(e) => setStandardForm({ ...standardForm, customerName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Consignment Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. GB-2026-08"
                    value={standardForm.consignmentRef}
                    onChange={(e) => setStandardForm({ ...standardForm, consignmentRef: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Category Type</label>
                  <select
                    value={standardForm.categoryType}
                    onChange={(e) => setStandardForm({ ...standardForm, categoryType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Giant Bales">Giant Bales</option>
                    <option value="Direct Bales">Direct Bales</option>
                    <option value="Shoes">Shoes (Sacks)</option>
                    <option value="Bags">Bags (Sacks)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Item Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Adult Summer Wear (Grade A)"
                    value={standardForm.itemDescription}
                    onChange={(e) => setStandardForm({ ...standardForm, itemDescription: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Quantity (Bales/Sacks)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={standardForm.quantity}
                    onChange={(e) => setStandardForm({ ...standardForm, quantity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0.00"
                    value={standardForm.unitPrice}
                    onChange={(e) => setStandardForm({ ...standardForm, unitPrice: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Payment Method</label>
                  <select
                    value={standardForm.paymentMethod}
                    onChange={(e) => setStandardForm({ ...standardForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cash">Cash Transfer</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                    <option value="POS">POS Terminal</option>
                  </select>
                </div>
              </div>

              {/* Total Calculation Display Box */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center mt-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-500" /> Calculated Order Total:
                </span>
                <span className="text-xl font-mono font-bold text-amber-400">
                  {standardTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl py-3.5 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {isSubmitting ? 'Posting Transaction...' : 'Commit & Record Sale'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Byproduct / Scrap Sales Form */}
        {activeTab === 'byproduct' && (
          <div className="bg-slate-800/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-amber-500" /> Record Yard Byproduct / Scrap Clearance
            </h2>

            <form onSubmit={handleByproductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Buyer Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Local Recycling Buyer"
                    value={byproductForm.customerName}
                    onChange={(e) => setByproductForm({ ...byproductForm, customerName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Byproduct Category</label>
                  <select
                    value={byproductForm.byproductType}
                    onChange={(e) => setByproductForm({ ...byproductForm, byproductType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Torn Wrapper Scrap">Torn Wrapper Scrap</option>
                    <option value="Metal Strapping Bands">Metal Strapping Bands</option>
                    <option value="Loose Fabric Scrap">Loose Fabric Scrap</option>
                    <option value="Damaged Sacks">Damaged Sacks</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Total Mass Weight (KGS)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 45.5"
                    value={byproductForm.weightKgs}
                    onChange={(e) => setByproductForm({ ...byproductForm, weightKgs: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Price Per KG</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0.00"
                    value={byproductForm.pricePerKg}
                    onChange={(e) => setByproductForm({ ...byproductForm, pricePerKg: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-medium">Payment Method</label>
                  <select
                    value={byproductForm.paymentMethod}
                    onChange={(e) => setByproductForm({ ...byproductForm, paymentMethod: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Total Calculation Display Box */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center mt-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-amber-500" /> Byproduct Yield Total:
                </span>
                <span className="text-xl font-mono font-bold text-amber-400">
                  {byproductTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl py-3.5 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {isSubmitting ? 'Posting Transaction...' : 'Commit Byproduct Sale'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}