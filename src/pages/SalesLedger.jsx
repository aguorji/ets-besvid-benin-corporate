import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, ShoppingCart, User, Calendar, FileText, CreditCard } from 'lucide-react';

export default function SalesLedger() {
  const [catalog, setCatalog] = useState([]); // Master Price List reference
  const [loading, setLoading] = useState(true);
  
  // Invoice Metadata
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentType, setPaymentType] = useState('Cash'); // STEP 3 & 4: Payment Type Selector
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Dynamic Transaction Line Items
  const [lineItems, setLineItems] = useState([
    { 
      id: Date.now(), 
      itemCode: '', 
      batchNumber: '', // STEP 4: Batch tracking property
      description: '', 
      unitType: 'KGS', 
      isAdjustedBale: false, 
      standardSize: 55, 
      qty: 1, 
      customWeight: '', 
      negotiatedPrice: '', 
      targetPrice: 0 
    }
  ]);

  // STEP 2: Catalog Sync Handler (Populates options including batches if nested)
  useEffect(() => {
    async function fetchCatalog() {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setCatalog(data);
        }
      } catch (err) {
        console.error("Error fetching product configurations:", err);
      } finally {
        loading && setLoading(false);
      }
    }
    fetchCatalog();
  }, []);

  // STEP 2: Dynamic row mapping when product code changes
  const handleItemCodeChange = (id, code) => {
    const selectedProd = catalog.find(p => p.itemCode === code);
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        itemCode: code,
        batchNumber: selectedProd?.availableBatches?.[0] || '', // Fallback or clear batch
        description: selectedProd ? selectedProd.description : '',
        unitType: selectedProd ? selectedProd.unit : 'KGS',
        standardSize: selectedProd ? (selectedProd.standardSize || 55) : 55,
        targetPrice: selectedProd ? (selectedProd.targetPricePerUnit || 0) : 0,
        negotiatedPrice: selectedProd ? selectedProd.targetPricePerUnit : '' 
      };
    }));
  };

  const updateLineProp = (id, prop, value) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, [prop]: value } : item));
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      { id: Date.now(), itemCode: '', batchNumber: '', description: '', unitType: 'KGS', isAdjustedBale: false, standardSize: 55, qty: 1, customWeight: '', negotiatedPrice: '', targetPrice: 0 }
    ]);
  };

  const removeLineItem = (id) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // --- CALCULATIONS ENGINE ---
  const calculatedRows = lineItems.map(item => {
    let totalWeightOrPcs = 0;
    if (item.isAdjustedBale) {
      totalWeightOrPcs = Number(item.customWeight) || 0;
    } else {
      totalWeightOrPcs = (Number(item.qty) || 0) * (Number(item.standardSize) || 55);
    }

    const billingQuantity = item.isAdjustedBale ? 1 : (Number(item.qty) || 0);
    const itemSubtotal = billingQuantity * (Number(item.negotiatedPrice) || 0);
    const targetSubtotal = billingQuantity * (item.targetPrice || 0);
    const estimatedProfitVariance = itemSubtotal - targetSubtotal;

    return { ...item, totalWeightOrPcs, itemSubtotal, estimatedProfitVariance, billingQuantity };
  });

  const grossTotalInvoiceValue = calculatedRows.reduce((sum, item) => sum + item.itemSubtotal, 0);
  const totalInvoiceWeightKgs = calculatedRows.reduce((sum, item) => sum + (item.unitType === 'KGS' ? item.totalWeightOrPcs : 0), 0);
  const netReceivablesOutstanding = Math.max(0, grossTotalInvoiceValue - (Number(amountPaid) || 0));

  // STEP 3: Align Submit Request Payload with batch metadata and payment types
  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    
    // Find the full product object from the catalog state for each row
    // to grab its MongoDB _id property for the backend
    const formattedItems = calculatedRows.map(row => {
      const originalCatalogProduct = catalog.find(p => p.itemCode === row.itemCode);
      
      return {
        productId: originalCatalogProduct ? originalCatalogProduct._id : null, // Securely binds Mongo _id
        itemCode: row.itemCode,
        consignmentRef: row.batchNumber, // Maps frontend 'batchNumber' to backend 'consignmentRef'
        quantitySold: row.isAdjustedBale ? 1 : (Number(row.qty) || 0), // Adjusts for remnant rows
        actualWeight: Number(row.totalWeightOrPcs) || 0,
        sellingPricePerBale: Number(row.negotiatedPrice) || 0
      };
    });
  
    const invoicePayload = {
      customerName,
      date: invoiceDate,
      paymentType, // Maps perfectly to paymentType backend variable
      amountPaid: Number(amountPaid) || 0,
      items: formattedItems
    };
  
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.message || 'Failed to execute wholesale ledger transaction.');
      }
      
      alert(`Success: ${result.message}`);
      
      // Reset State Hooks
      setCustomerName('');
      setAmountPaid('');
      setPaymentType('Cash');
      setInvoiceNotes('');
      setLineItems([{ id: Date.now(), itemCode: '', batchNumber: '', description: '', unitType: 'KGS', isAdjustedBale: false, standardSize: 55, qty: 1, customWeight: '', negotiatedPrice: '', targetPrice: 0 }]);
    } catch (err) {
      alert(`🚨 Entry Refused: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-off-white text-navy font-sans pb-20">
      
      {/* HEADER BAR */}
      <section className="bg-navy text-white py-10 border-b-2 border-gold">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="font-serif text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-gold" size={28} />
            Sales Dispatch & Invoicing Ledger
          </h1>
          <p className="text-white/60 text-xs mt-2 max-w-xl">
            Log outbound customer orders instantly. System supplies default estimation prices, allowing manual negotiated price overrides and precise tracking of custom-sized tail-end bales.
          </p>
        </div>
      </section>

      <form onSubmit={handleInvoiceSubmit} className="max-w-6xl mx-auto px-6 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT / CENTER: PRIMARY TRANSACTION ROW BUILDER */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-navy/10 rounded shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy/60 mb-4 flex items-center gap-2">
              <FileText size={14} /> Itemized Dispatch Lines
            </h3>

            {loading ? (
              <p className="text-xs font-bold text-center py-6 text-navy/40">Syncing Master Product Baselines...</p>
            ) : (
              <div className="space-y-4">
                {lineItems.map((item) => {
                  const calculated = calculatedRows.find(r => r.id === item.id);
                  // Find selected product info to pull the right array of batches
                  const selectedProductInfo = catalog.find(p => p.itemCode === item.itemCode);

                  return (
                    <div key={item.id} className="p-4 bg-off-white/40 border border-navy/5 rounded relative flex flex-col gap-3">
                      
                      {/* Controls Top Row */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        
                        {/* 1. Item Selection */}
                        <div className="md:col-span-3">
                          <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1">Product Reference</label>
                          <select
                            required
                            value={item.itemCode}
                            onChange={(e) => handleItemCodeChange(item.id, e.target.value)}
                            className="w-full bg-white border border-navy/10 rounded px-2 py-1.5 text-xs font-bold focus:outline-none focus:border-gold"
                          >
                            <option value="">-- Choose Code --</option>
                            {catalog.map(cat => (
                              <option key={cat._id || cat.itemCode} value={cat.itemCode}>{cat.itemCode} ({cat.description})</option>
                            ))}
                          </select>
                        </div>

                        {/* STEP 4: Batch Select Box (Dynamic options from product context) */}
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1">Batch / Lot</label>
                          <select
                            required
                            disabled={!item.itemCode}
                            value={item.batchNumber}
                            onChange={(e) => updateLineProp(item.id, 'batchNumber', e.target.value)}
                            className="w-full bg-white border border-navy/10 rounded px-2 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-gold disabled:opacity-50"
                          >
                            <option value="">-- Batch --</option>
                            {selectedProductInfo?.availableBatches?.map(batch => (
                              <option key={batch} value={batch}>{batch}</option>
                            )) || (item.itemCode && <option value="DEFAULT-A">DEFAULT-A</option>)}
                          </select>
                        </div>

                        {/* 2. Target/Remnant Condition Check */}
                        <div className="md:col-span-2 pt-4 flex items-center">
                          <label className="inline-flex items-center gap-2 text-xs font-bold text-navy/80 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.isAdjustedBale}
                              onChange={(e) => updateLineProp(item.id, 'isAdjustedBale', e.target.checked)}
                              className="accent-gold h-4 w-4 rounded"
                            />
                            Tail-End Remnant?
                          </label>
                        </div>

                        {/* 3. Dynamic Weight/Size Fields */}
                        <div className="md:col-span-2">
                          {item.isAdjustedBale ? (
                            <>
                              <label className="block text-[9px] font-bold text-red-700 uppercase mb-1">Weight (KGS)</label>
                              <input
                                type="number"
                                required
                                placeholder="Exact weight"
                                value={item.customWeight}
                                onChange={(e) => updateLineProp(item.id, 'customWeight', e.target.value)}
                                className="w-full bg-white border border-red-300 rounded px-2 py-1 text-xs font-bold text-red-800 outline-none"
                              />
                            </>
                          ) : (
                            <>
                              <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1">Qty (Bales)</label>
                              <input
                                type="number"
                                required
                                min="1"
                                value={item.qty}
                                onChange={(e) => updateLineProp(item.id, 'qty', e.target.value)}
                                className="w-full bg-white border border-navy/10 rounded px-2 py-1 text-xs font-mono font-bold text-center focus:outline-none"
                              />
                            </>
                          )}
                        </div>

                        {/* 4. Price Negotiated Override */}
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1">Negotiated Rate</label>
                          <input
                            type="number"
                            required
                            placeholder={`Target: ${item.targetPrice}`}
                            value={item.negotiatedPrice}
                            onChange={(e) => updateLineProp(item.id, 'negotiatedPrice', e.target.value)}
                            className="w-full bg-white border border-gold rounded px-2 py-1 text-xs font-mono font-bold text-right outline-none"
                          />
                        </div>

                        {/* 5. Delete Action */}
                        <div className="md:col-span-1 text-right pt-4">
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length === 1}
                            className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1.5 rounded transition bg-transparent border-none cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Line Item Context Label Footnote */}
                      {item.itemCode && (
                        <div className="text-[10px] text-navy/60 bg-white/60 p-1.5 rounded flex justify-between font-medium">
                          <span><strong>Description:</strong> {item.description}</span>
                          <span className="font-mono">
                            <strong>Total Content:</strong> {calculated?.totalWeightOrPcs.toLocaleString()} {item.unitType} 
                            {item.isAdjustedBale ? " (Custom Remnant)" : ` (${item.qty} Bales x ${item.standardSize} ${item.unitType})`}
                          </span>
                          <span className="font-mono"><strong>Line Subtotal:</strong> ₦{calculated?.itemSubtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={addLineItem}
              className="mt-4 bg-navy/5 hover:bg-navy/10 text-navy text-xs font-bold uppercase tracking-wider py-2 px-4 rounded border border-dashed border-navy/20 flex items-center gap-1 cursor-pointer transition"
            >
              <Plus size={14} /> Add Transaction Line
            </button>
          </div>
        </div>

        {/* RIGHT METADATA PANEL & METRICS SUBMISSION SIDEBAR */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-navy/10 rounded shadow-xs p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy/60 border-b border-navy/5 pb-2">
              Invoice Meta Data
            </h3>

            <div>
              <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1 flex items-center gap-1">
                <User size={10} /> Customer Name / Account
              </label>
              <input
                type="text"
                required
                placeholder="Enter client name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-off-white border border-navy/10 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1 flex items-center gap-1">
                <Calendar size={10} /> Dispatch Date
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full bg-off-white border border-navy/10 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none"
              />
            </div>

            {/* STEP 4: Add Payment Type Selector Component */}
            <div>
              <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1 flex items-center gap-1">
                <CreditCard size={10} /> Payment Terms / Channel
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full bg-off-white border border-navy/10 rounded px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-gold"
              >
                <option value="Cash">Cash Handout</option>
                <option value="Bank Transfer">Direct Bank Wire</option>
                <option value="Cheque">Clearing Cheque</option>
                <option value="Credit Balance">Deferred Credit Terms</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-navy/50 uppercase mb-1">Transaction Notes</label>
              <textarea
                placeholder="Loading bays, custom agreements..."
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                rows="2"
                className="w-full bg-off-white border border-navy/10 rounded px-2.5 py-1.5 text-xs resize-none focus:outline-none"
              />
            </div>
          </div>

          {/* RUNNING ACCOUNT TOTALS MATRIX */}
          <div className="bg-navy text-white rounded shadow-sm p-4 space-y-3 font-mono">
            <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-gold border-b border-white/10 pb-2">
              Financial Summary
            </h3>

            <div className="flex justify-between text-xs">
              <span className="text-white/60">Total Mass Outbound:</span>
              <span className="font-bold text-white">{totalInvoiceWeightKgs.toLocaleString()} KGS</span>
            </div>

            <div className="flex justify-between text-xs border-b border-white/5 pb-2">
              <span className="text-white/60">Gross Valuation:</span>
              <span className="font-bold text-gold text-sm">₦{grossTotalInvoiceValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>

            <div className="space-y-1 pt-1">
              <label className="block text-[9px] font-bold text-gold uppercase tracking-wider font-sans">Immediate Cash Deposited</label>
              <input
                type="number"
                placeholder="Enter amount paid"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white text-right font-bold tracking-wide outline-none focus:border-gold"
              />
            </div>

            <div className="flex justify-between text-xs pt-2 border-t border-white/10 text-red-300 font-bold">
              <span>Balance Due (Receivables):</span>
              <span className="text-red-400">₦{netReceivablesOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-gold hover:bg-gold/90 text-navy font-bold text-xs uppercase tracking-widest py-2.5 rounded transition cursor-pointer border-none flex items-center justify-center gap-1.5 mt-2 font-sans"
            >
              <Save size={14} /> Commit Sales Invoice
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}