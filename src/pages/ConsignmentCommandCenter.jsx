// src/components/ConsignmentCommandCenter.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, TrendingUp, ShoppingBag, Layers, 
  DollarSign, BarChart2, Users, Wallet, Plus, Trash2, ArrowLeft, Upload, AlertCircle, CheckCircle2 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import apiClient from '../api/client';

/**
 * ConsignmentCommandCenter Component
 * Manages the detailed operational workspace for an individual consignment shipment.
 * Handles production tracking, pricelist valuations, sales invoices with multi-consignment cross-stock checks,
 * immediate or partial bale/sack supply inputs, byproduct sales, expenses, and fulfillment status.
 */
export default function ConsignmentCommandCenter({ consignment, currency, initialData, onSaveData, onCommitData, onBack, allConsignmentsData, onCrossConsignmentStockUpdate, getWorkspaceData, role = 'admin' }) {
  const [commitStatus, setCommitStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [feedbackMsg, setFeedbackMsg] = useState(null); // { type: 'success'|'error', text: string }

  // Debt repayment inline form state
  const [repayingInvoiceId, setRepayingInvoiceId] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');

  // Supply/delivery update inline form state — keyed by `${invoiceId}-${itemIndex}`
  const [supplyingRowKey, setSupplyingRowKey] = useState(null);
  const [supplyAmount, setSupplyAmount] = useState('');

  // Void sale inline form state
  const [voidingInvoiceId, setVoidingInvoiceId] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const handleVoidSale = async (invoiceId) => {
    if (!voidReason.trim()) return;

    setFeedbackMsg(null);
    try {
      await apiClient.put(`/consignments/${consignment.id}/invoice/${invoiceId}/void`, {
        reason: voidReason.trim()
      });

      // Remove the voided invoice from the local view — matches the
      // backend, which excludes voided sales from the active ledger.
      setSalesLog(prev => prev.filter(inv => (inv.backendId || inv.id) !== invoiceId));
      setFeedbackMsg({ type: 'success', text: 'Invoice voided and stock released.' });
      setVoidingInvoiceId(null);
      setVoidReason('');
    } catch (err) {
      console.error('Failed to void sale:', err.response?.data || err.message);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to void sale. Please try again.'
      });
    }
  };

  const handleRecordPayment = async (invoiceId) => {
    const amount = Number(repayAmount);
    if (!amount || amount <= 0) return;

    setFeedbackMsg(null);
    try {
      const response = await apiClient.put(`/consignments/${consignment.id}/invoice/${invoiceId}/repay`, {
        depositAmount: amount
      });
      const updatedSale = response.data.target;

      setSalesLog(prev => prev.map(inv =>
        (inv.backendId || inv.id) === invoiceId
          ? { ...inv, amountPaid: updatedSale.amount_paid }
          : inv
      ));
      setFeedbackMsg({ type: 'success', text: 'Payment recorded.' });
      setRepayingInvoiceId(null);
      setRepayAmount('');
    } catch (err) {
      console.error('Failed to record payment:', err.response?.data || err.message);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to record payment — nothing was updated. Please try again.'
      });
    }
  };

  const handleRecordSupply = async (invoiceId, itemIndex) => {
    const additionalQty = Number(supplyAmount);
    if (!additionalQty || additionalQty <= 0) return;

    setFeedbackMsg(null);
    try {
      const response = await apiClient.put(`/consignments/${consignment.id}/invoice/${invoiceId}/supply`, {
        itemIndex,
        additionalQty
      });
      const updatedSale = response.data.target;
      const updatedItem = updatedSale.items[itemIndex];

      setSalesLog(prev => prev.map(inv => {
        if ((inv.backendId || inv.id) !== invoiceId) return inv;
        const items = inv.items.map((it, idx) =>
          idx === itemIndex ? { ...it, delivered: updatedItem.quantity_delivered } : it
        );
        return { ...inv, items };
      }));
      setFeedbackMsg({ type: 'success', text: 'Supply status updated.' });
      setSupplyingRowKey(null);
      setSupplyAmount('');
    } catch (err) {
      console.error('Failed to update supply status:', err.response?.data || err.message);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update supply status — nothing was recorded. Please try again.'
      });
    }
  };
  const isDirectCargo = consignment?.type !== 'Giant Bales';
  const unitLabel = (consignment?.type === 'Shoes' || consignment?.type === 'Bags') ? 'Sack' : 'Bale';
  
  // Always default to 'production' tab so the ledger is visible instantly upon opening
  const [activeTab, setActiveTab] = useState('production');

  // Initialize operational workspace state variables from persistent storage
  const [productionList, setProductionList] = useState(initialData.productionList || []);
  const [pricelist, setPricelist] = useState(initialData.pricelist || []);
  const [salesLog, setSalesLog] = useState(initialData.salesLog || []);
  const [byproductSales, setByproductSales] = useState(initialData.byproductSales || []);
  const [expenses, setExpenses] = useState(initialData.expenses || []);

  const [prodForm, setProdForm] = useState({ 
    item: '', unit: 'KGS per Bale', stdSize: '55KG', qty: '', actualSize: '55KG' 
  });

  // Automatically save workspace state changes upstream whenever core ledgers update
  useEffect(() => {
    onSaveData({ productionList, pricelist, salesLog, byproductSales, expenses });
  }, [productionList, pricelist, salesLog, byproductSales, expenses]);

  // Fetch the REAL, current sales/expenses/byproducts from the database on
  // open. Local cache was previously the only source for these, which
  // meant admin and staff — separate browser sessions — never saw each
  // other's sales at all. Production/pricelist intentionally stay on the
  // explicit-Update-button design; these three already auto-save
  // immediately on creation, so it's consistent for reads to always be
  // live too, not cached.
  useEffect(() => {
    if (!consignment?.id) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await apiClient.get(`/consignments/${consignment.id}/ledger`);
        if (cancelled) return;
        const { sales, expenses: fetchedExpenses, byproducts } = response.data;

        setSalesLog(sales.map(s => ({
          id: s._id,
          backendId: s._id,
          customer: s.customer_name,
          paymentType: s.payment_type,
          amountPaid: s.amount_paid,
          total: s.gross_revenue,
          date: new Date(s.date || s.createdAt).toLocaleDateString(),
          items: (s.items || []).map(it => ({
            itemCode: it.item_name,
            actualSize: it.actual_size,
            qty: it.quantity_sold,
            sellingPrice: it.selling_price,
            basePrice: it.set_price,
            revenue: it.revenue,
            variance: it.variance,
            performance: it.performance,
            delivered: it.quantity_delivered ?? it.quantity_sold,
            sourceConsignmentRef: consignment.consignmentRef
          }))
        })));

        setExpenses(fetchedExpenses.map(e => ({
          id: e._id,
          date: new Date(e.date).toISOString().split('T')[0],
          category: e.category,
          description: e.description,
          amount: e.amount
        })));

        setByproductSales(byproducts.map(b => ({
          id: b._id,
          date: new Date(b.date).toISOString().split('T')[0],
          type: b.type,
          subType: b.sub_type,
          qty: b.quantity,
          price: b.price_per_unit,
          revenue: b.revenue
        })));
      } catch (err) {
        console.error('Failed to fetch live sales/expenses/byproducts:', err.response?.data || err.message);
      }
    })();

    return () => { cancelled = true; };
  }, [consignment?.id]);

  // Sales Invoice creation form states
  const [invoiceCustomer, setInvoiceCustomer] = useState('');
  const [invoicePaymentType, setInvoicePaymentType] = useState('Cash'); 
  const [invoiceAmountPaid, setInvoiceAmountPaid] = useState('');
  
  // Sales Invoice Item Line rows with explicit initial supplied quantity input field
  const [invoiceItems, setInvoiceItems] = useState([
    { itemCode: '', actualSize: '', qty: '', sellingPrice: '', delivered: '', sourceConsignmentRef: '' }
  ]);
  
  // Alert notification state for out-of-stock items during invoice processing
  const [stockAlert, setStockAlert] = useState(null);

  // Live total across all line items — auto-fills Initial Amount Paid below
  // so it never needs to be calculated by hand. For Part Payment, this
  // still auto-fills as a correct starting point; the field stays editable
  // so it can be reduced to whatever was actually received.
  const invoiceTotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.sellingPrice || 0)), 0);
  }, [invoiceItems]);

  useEffect(() => {
    if (invoicePaymentType === 'Credit') {
      setInvoiceAmountPaid(0);
    } else {
      // Cash forces the full total (enforced via disabled input below);
      // Part Payment defaults to the full total as a starting point, but
      // stays editable so it can be reduced to what was actually received.
      setInvoiceAmountPaid(invoiceTotal);
    }
  }, [invoiceTotal, invoicePaymentType]);

  const invoiceBalance = Math.max(0, invoiceTotal - Number(invoiceAmountPaid || 0));

  const [byproductForm, setByproductForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'Loose Fiber', subType: 'Grade A', qty: '', price: '' });
  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '' });

  // Helper function to toggle packaging default standards
  const handleUnitToggle = (selectedUnit) => {
    const defaultSize = selectedUnit === 'KGS per Bale' ? '55KG' : '250 PCS';
    setProdForm({ ...prodForm, unit: selectedUnit, stdSize: defaultSize, actualSize: defaultSize });
  };

  // Helper engine to process production records (used by manual forms and Excel upload parsers)
  const processProductionEntry = (itemName, unit, stdSize, qtyNum, actualSize, currentProdList, currentPriceList) => {
    const newItemId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const numericStd = parseFloat(stdSize) || 1;
    const numericActual = parseFloat(actualSize) || 1;
    const isVarianceBale = numericStd !== numericActual;

    currentProdList.push({
      id: newItemId,
      item: itemName,
      unit,
      stdSize,
      qty: qtyNum,
      actualSize,
      isVariance: isVarianceBale
    });

    const existingIdx = currentPriceList.findIndex(p => p.item.toLowerCase() === itemName.toLowerCase());
    if (existingIdx > -1) {
      if (isVarianceBale) {
        currentPriceList[existingIdx].varianceBales = [
          ...(currentPriceList[existingIdx].varianceBales || []),
          { id: newItemId, qty: qtyNum, actualSize: actualSize }
        ];
      } else {
        currentPriceList[existingIdx].qty += qtyNum;
      }
    } else {
      currentPriceList.push({
        id: newItemId,
        item: itemName,
        unit,
        stdSize,
        stdPrice: 0,
        qty: isVarianceBale ? 0 : qtyNum,
        varianceBales: isVarianceBale ? [{ id: newItemId, qty: qtyNum, actualSize: actualSize }] : []
      });
    }
  };

  // Handle manual addition of a production entry
  const handleAddProduction = (e) => {
    e.preventDefault();
    if (!prodForm.item || !prodForm.qty) return;

    const qtyNum = Number(prodForm.qty);
    const itemName = prodForm.item.toUpperCase().trim();
    const numericStd = parseFloat(prodForm.stdSize) || 1;
    const numericActual = parseFloat(prodForm.actualSize) || 1;
    const isVarianceBale = numericStd !== numericActual;

    let updatedProd = [...productionList];
    let updatedPrice = [...pricelist];

    if (isVarianceBale && qtyNum > 0) {
      const standardCount = qtyNum - 1;
      if (standardCount > 0) {
        processProductionEntry(itemName, prodForm.unit, prodForm.stdSize, standardCount, prodForm.stdSize, updatedProd, updatedPrice);
      }
      processProductionEntry(itemName, prodForm.unit, prodForm.stdSize, 1, prodForm.actualSize, updatedProd, updatedPrice);
    } else {
      processProductionEntry(itemName, prodForm.unit, prodForm.stdSize, qtyNum, prodForm.stdSize, updatedProd, updatedPrice);
    }

    setProductionList(updatedProd);
    setPricelist(updatedPrice);
    setProdForm({ item: '', unit: 'KGS per Bale', stdSize: '55KG', qty: '', actualSize: '55KG' });
  };

  // Handle uploading and parsing Excel manifest packing lists
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Previously this always appended onto whatever was already in
    // productionList — uploading the same file twice (or uploading after
    // manual entries already exist) silently doubled up quantities with no
    // warning. This is very likely what produced 8 standard CR instead of
    // the correct 6 (6 from parsing "7 (40)" correctly, plus 2 extra from
    // an earlier action never getting cleared first).
    if (productionList.length > 0) {
      const proceed = window.confirm(
        `This consignment already has ${productionList.length} production item row(s) logged. ` +
        `Uploading this Excel file will ADD to them, not replace them — if you're re-uploading the ` +
        `same or a corrected file, this will likely create duplicates.\n\n` +
        `Click OK to add anyway, or Cancel to stop and clear/review existing rows first.`
      );
      if (!proceed) {
        e.target.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const updatedProd = [...productionList];
      const updatedPrice = [...pricelist];

      for (let i = 5; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;

        const itemName = String(row[0]).toUpperCase().trim();
        const rawSize = String(row[1]).toUpperCase().trim(); 
        const rawBaleCount = String(row[2]).trim();          

        const unit = rawSize.includes('PCS') ? 'PCS per Bale' : 'KGS per Bale';
        const stdSize = rawSize.replace('KGS', 'KG');

        const varianceMatch = rawBaleCount.match(/^(\d+)\s*\((\d+)\)$/);

        if (varianceMatch) {
          const totalBaleCount = parseInt(varianceMatch[1], 10);
          const standardCount = totalBaleCount - 1;
          const varianceWeight = varianceMatch[2] + (unit === 'PCS per Bale' ? 'PCS' : 'KG');

          if (standardCount > 0) {
            processProductionEntry(itemName, unit, stdSize, standardCount, stdSize, updatedProd, updatedPrice);
          }
          processProductionEntry(itemName, unit, stdSize, 1, varianceWeight, updatedProd, updatedPrice);
        } else {
          const cleanCount = parseInt(rawBaleCount, 10) || 0;
          if (cleanCount > 0) {
            processProductionEntry(itemName, unit, stdSize, cleanCount, stdSize, updatedProd, updatedPrice);
          }
        }
      }

      setProductionList(updatedProd);
      setPricelist(updatedPrice);
    };
    reader.readAsBinaryString(file);
  };

  // Handle inline edits within the production ledger
  const handleInlineProductionEdit = (id, field, value) => {
    setProductionList(prevProd => {
      const updatedProd = prevProd.map(p => {
        if (p.id !== id) return p;
        let updatedRow = { ...p, [field]: value };
        if (field === 'stdSize' || field === 'actualSize') {
          const numericStd = parseFloat(field === 'stdSize' ? value : p.stdSize) || 1;
          const numericActual = parseFloat(field === 'actualSize' ? value : p.actualSize) || 1;
          updatedRow.isVariance = numericStd !== numericActual;
        }
        return updatedRow;
      });
      rebuildPricelistFromProduction(updatedProd);
      return updatedProd;
    });
  };

  // Handle removing a production row
  const handleDeleteProductionRow = (id) => {
    if (window.confirm("Are you sure you want to remove this entry from the production list?")) {
      const updatedProd = productionList.filter(p => p.id !== id);
      setProductionList(updatedProd);
      rebuildPricelistFromProduction(updatedProd);
    }
  };

  // Rebuild the pricelist matrix whenever production entries change
  const rebuildPricelistFromProduction = (currentProdList) => {
    setPricelist(prevPrice => {
      const workingPriceMap = {};
      prevPrice.forEach(p => {
        workingPriceMap[p.item.toLowerCase()] = { stdPrice: p.stdPrice };
      });

      const newPriceMatrix = [];
      currentProdList.forEach(p => {
        const key = p.item.toUpperCase().trim();
        const existingIdx = newPriceMatrix.findIndex(item => item.item === key);
        const oldPricing = workingPriceMap[p.item.toLowerCase()] || { stdPrice: 0 };

        if (existingIdx > -1) {
          if (p.isVariance) {
            newPriceMatrix[existingIdx].varianceBales.push({ id: p.id, qty: p.qty, actualSize: p.actualSize });
          } else {
            newPriceMatrix[existingIdx].qty += p.qty;
          }
        } else {
          newPriceMatrix.push({
            id: p.id,
            item: key,
            unit: p.unit,
            stdSize: p.stdSize,
            stdPrice: oldPricing.stdPrice,
            qty: p.isVariance ? 0 : p.qty,
            varianceBales: p.isVariance ? [{ id: p.id, qty: p.qty, actualSize: p.actualSize }] : []
          });
        }
      });
      return newPriceMatrix;
    });
  };

  // Handle editing item standard prices in the pricelist matrix and syncing to backend API
  const handlePricelistChange = async (id, field, value) => {
    const numericValue = Number(value);
    
    // 1. Update local state immediately for smooth UI responsiveness
    setPricelist(prev => prev.map(item => item.id === id ? { ...item, [field]: numericValue } : item));

    // 2. Sync price update to the backend database so other terminals reflect it instantly
    if (field === 'stdPrice') {
      try {
        await apiClient.put(`/api/products/${id}`, {
          basePrice: numericValue
        });
      } catch (error) {
        console.error("Failed to sync price update to server:", error.response?.data || error.message);
      }
    }
  };

  // Compile available stock profiles across ALL consignments for dropdown and manual entry mapping
  const availableStockProfiles = useMemo(() => {
    const profiles = [];
    
    const extractProfiles = (pList, sLog, refName) => {
      if (!pList) return;
      pList.forEach(p => {
        const totalStdSold = sLog ? sLog.reduce((sum, inv) => {
          const matches = inv.items ? inv.items.filter(i => i.itemCode && i.itemCode.toLowerCase() === p.item.toLowerCase() && parseFloat(i.actualSize) === parseFloat(p.stdSize)) : [];
          return sum + matches.reduce((acc, curr) => acc + (curr.qty || 0), 0);
        }, 0) : 0;
        const baseBalance = (p.qty || 0) - totalStdSold;

        if (baseBalance > 0) {
          profiles.push({
            itemCode: p.item,
            key: `${p.item}::${p.stdSize}::${refName}`,
            displayName: `${p.item} (${p.stdSize}) [Ref: ${refName}] - Bal: ${baseBalance}`,
            actualSize: p.stdSize,
            isVariance: false,
            availableQty: baseBalance,
            sourceConsignmentRef: refName
          });
        }

        if (p.varianceBales && p.varianceBales.length > 0) {
          p.varianceBales.forEach(v => {
            const totalVarSold = sLog ? sLog.reduce((sum, inv) => {
              const matches = inv.items ? inv.items.filter(i => i.itemCode && i.itemCode.toLowerCase() === p.item.toLowerCase() && parseFloat(i.actualSize) === parseFloat(v.actualSize)) : [];
              return sum + matches.reduce((acc, curr) => acc + (curr.qty || 0), 0);
            }, 0) : 0;
            const varBal = (v.qty || 0) - totalVarSold;
            if (varBal > 0) {
              profiles.push({
                itemCode: p.item,
                key: `${p.item}::${v.actualSize}::${refName}`,
                displayName: `${p.item} (${v.actualSize}) [Ref: ${refName}] - Bal: ${varBal}`,
                actualSize: v.actualSize,
                isVariance: true,
                availableQty: varBal,
                sourceConsignmentRef: refName
              });
            }
          });
        }
      });
    };

    // 1. Current Consignment Stock
    extractProfiles(pricelist, salesLog, consignment?.consignmentRef);

    // 2. All Other Consignments Stock — previously read otherC.pricelist/
    // otherC.salesLog directly, but the normalized consignments list never
    // carries those fields at all (they only exist via getWorkspaceData),
    // so this always silently found nothing for every other consignment.
    if (allConsignmentsData && allConsignmentsData.length > 0 && getWorkspaceData) {
      allConsignmentsData.forEach(otherC => {
        if (otherC.id === consignment?.id) return;
        const otherWs = getWorkspaceData(otherC.id, otherC.raw) || {};
        extractProfiles(otherWs.pricelist || [], otherWs.salesLog || [], otherC.consignmentRef);
      });
    }

    return profiles;
  }, [pricelist, salesLog, consignment, allConsignmentsData, getWorkspaceData]);

  // Compute pricing valuations for pricelist items
  const calculatedPricelistItems = useMemo(() => {
    return pricelist.map(p => {
      const stdWt = parseFloat(p.stdSize) || 1;
      let extraValue = 0;
      let extraBaleCountDisplay = [];

      if (p.varianceBales && p.varianceBales.length > 0) {
        p.varianceBales.forEach(v => {
          const actWt = parseFloat(v.actualSize) || 0;
          const proportionalFactor = actWt / stdWt;
          extraValue += v.qty * proportionalFactor * p.stdPrice;
          extraBaleCountDisplay.push(`${v.qty} (${v.actualSize})`);
        });
      }

      const standardStockValue = p.qty * p.stdPrice;
      const totalStockVal = standardStockValue + extraValue;

      return {
        ...p,
        totalStockVal,
        extraDisplay: extraBaleCountDisplay.join(', ') || 'None'
      };
    });
  }, [pricelist]);

  // Automated live stock balance ledger calculations
  const liveStockLedger = useMemo(() => {
    return calculatedPricelistItems.map(p => {
      const totalStdSold = salesLog.reduce((sum, inv) => {
        const matches = inv.items.filter(i => i.itemCode.toLowerCase() === p.item.toLowerCase() && parseFloat(i.actualSize) === parseFloat(p.stdSize));
        return sum + matches.reduce((acc, curr) => acc + curr.qty, 0);
      }, 0);

      const baseBalance = p.qty - totalStdSold;
      const stdWt = parseFloat(p.stdSize) || 1;
      let varianceValueRemaining = 0;
      let activeVarianceStrings = [];
      let totalRemainingVarianceBalesCount = 0;

      if (p.varianceBales && p.varianceBales.length > 0) {
        p.varianceBales.forEach(v => {
          const totalVarSold = salesLog.reduce((sum, inv) => {
            const matches = inv.items.filter(i => i.itemCode.toLowerCase() === p.item.toLowerCase() && parseFloat(i.actualSize) === parseFloat(v.actualSize));
            return sum + matches.reduce((acc, curr) => acc + curr.qty, 0);
          }, 0);

          const varBal = v.qty - totalVarSold;
          if (varBal > 0) {
            const actWt = parseFloat(v.actualSize) || 0;
            varianceValueRemaining += varBal * (actWt / stdWt) * p.stdPrice;
            activeVarianceStrings.push(`${varBal} (${v.actualSize})`);
            totalRemainingVarianceBalesCount += varBal;
          }
        });
      }

      const stockValue = (baseBalance * p.stdPrice) + varianceValueRemaining;
      const cumulativePhysicalBalance = baseBalance + totalRemainingVarianceBalesCount;

      return {
        item: p.item,
        actualSize: p.stdSize,
        qty: p.qty,
        varianceInfo: activeVarianceStrings.join(', ') || 'None',
        sold: totalStdSold,
        balance: cumulativePhysicalBalance,
        stdPrice: p.stdPrice,
        stockValue
      };
    });
  }, [calculatedPricelistItems, salesLog]);

  // Handle invoice item changes with multi-size and cross-consignment awareness
  const handleInvoiceItemChange = (index, field, value) => {
    const updated = [...invoiceItems];
    updated[index][field] = (field === 'qty' || field === 'sellingPrice' || field === 'delivered') ? Number(value) : value;

    if (field === 'selectedProfileKey') {
      // Matching by the stable key here is deliberate — previously this
      // matched by itemCode alone as a fallback whenever the exact display
      // string didn't match, which silently picked whichever batch of that
      // item happened to be listed first (usually the standard size),
      // regardless of which specific batch was actually selected or
      // whether it still had stock. A real <select> bound to a unique key
      // makes that whole class of ambiguity impossible.
      const selectedProfile = availableStockProfiles.find(p => p.key === value);
      if (selectedProfile) {
        updated[index].itemCode = selectedProfile.itemCode;
        updated[index].actualSize = selectedProfile.actualSize;
        updated[index].isVariance = selectedProfile.isVariance;
        updated[index].selectedProfileKey = selectedProfile.key;
        updated[index].sourceConsignmentRef = selectedProfile.sourceConsignmentRef || consignment.consignmentRef;
      }
    }
    setInvoiceItems(updated);
    setStockAlert(null);
  };

  // Cross-Consignment Stock Inspection Engine
  const checkAndResolveStockAvailability = (itemCode, requestedQty, size) => {
    // Reuses availableStockProfiles (already correctly per-size and
    // cross-consignment-aware) instead of a separate parallel
    // implementation — that duplication is exactly what let this silently
    // fail for variance sizes (liveStockLedger collapses every size into
    // one row keyed by the STANDARD size only) and for every other
    // consignment (allConsignmentsData never carried pricelist/salesLog).
    const matchingProfiles = availableStockProfiles.filter(
      p => p.itemCode.toLowerCase() === itemCode.toLowerCase() && String(p.actualSize) === String(size)
    );

    const currentMatch = matchingProfiles.find(p => p.sourceConsignmentRef === consignment?.consignmentRef);
    if (currentMatch && currentMatch.availableQty >= requestedQty) {
      return { found: true, sourceRef: consignment.consignmentRef, deductionType: 'current' };
    }

    const crossMatch = matchingProfiles.find(
      p => p.sourceConsignmentRef !== consignment?.consignmentRef && p.availableQty >= requestedQty
    );
    if (crossMatch) {
      const sourceConsignment = (allConsignmentsData || []).find(c => c.consignmentRef === crossMatch.sourceConsignmentRef);
      return {
        found: true,
        sourceRef: crossMatch.sourceConsignmentRef,
        consignmentId: sourceConsignment?.id,
        deductionType: 'cross'
      };
    }

    return { found: false };
  };

  const removeInvoiceRow = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Submit commercial invoice and run stock validation checks across consignments
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceCustomer || invoiceItems.some(i => !i.itemCode || !i.qty)) return;

    const stockChecks = [];
    for (const item of invoiceItems) {
      const reqQty = Number(item.qty);
      const stockCheck = checkAndResolveStockAvailability(item.itemCode, reqQty, item.actualSize);

      if (!stockCheck.found) {
        setStockAlert(`⚠️ Alert: Item "${item.itemCode}" (${item.actualSize}) is NOT in stock in this consignment or any other available consignment!`);
        return;
      }
      stockChecks.push(stockCheck);
      item.delivered = item.delivered !== '' && !isNaN(item.delivered) ? Number(item.delivered) : 0;
    }

    const totalInvoiceValue = invoiceItems.reduce((sum, item) => sum + (item.qty * item.sellingPrice), 0);
    const amountPaidVal = Number(invoiceAmountPaid || 0);

    // This is now a real save, not a local-only action — previously
    // handleCreateInvoice never called the backend at all, so every sale
    // logged through this form lived only in localStorage and never reached
    // MongoDB (which is why Financial Reconciliation has likely always
    // looked thin, and why debt repayment had nothing real to act on).
    setFeedbackMsg(null);
    try {
      const response = await apiClient.post(`/consignments/${consignment.id}/invoice`, {
        customerName: invoiceCustomer,
        paymentType: invoicePaymentType,
        amountPaid: amountPaidVal,
        items: invoiceItems.map(item => {
          const baseMatch = pricelist.find(p => p.item.toLowerCase() === item.itemCode.toLowerCase());
          return {
            itemCode: item.itemCode,
            // parseFloat strips the embedded unit suffix ("55KG" -> 55,
            // "200PCS" -> 200) — Sale.js's actual_size field is a Number,
            // and sending the raw string caused every sale to fail with
            // "Cast to Number failed for value '55KG'".
            actualSize: parseFloat(item.actualSize) || 0,
            qty: item.qty,
            sellingPrice: item.sellingPrice,
            basePrice: baseMatch ? baseMatch.stdPrice : 0,
            delivered: item.delivered
          };
        })
      });
      const savedSale = response.data;

      // Cross-consignment stock deduction and source attribution only
      // happen now that the save is confirmed — never before, so local
      // state can't drift ahead of what's actually in the database.
      invoiceItems.forEach((item, idx) => {
        const stockCheck = stockChecks[idx];
        if (stockCheck.deductionType === 'cross' && onCrossConsignmentStockUpdate) {
          onCrossConsignmentStockUpdate(stockCheck.consignmentId, item.itemCode, item.actualSize, Number(item.qty));
        }
        item.sourceConsignmentRef = stockCheck.deductionType === 'cross' ? stockCheck.sourceRef : consignment.consignmentRef;
      });

      const newInvoice = {
        id: savedSale._id || Date.now().toString(),
        backendId: savedSale._id,
        customer: invoiceCustomer,
        paymentType: invoicePaymentType,
        amountPaid: savedSale.amount_paid ?? amountPaidVal,
        items: invoiceItems.map(item => {
          const baseMatch = pricelist.find(p => p.item.toLowerCase() === item.itemCode.toLowerCase());
          const basePrice = baseMatch ? baseMatch.stdPrice : 0;
          const revenue = item.qty * item.sellingPrice;
          const expectedRevenueAtBase = item.qty * basePrice;

          return {
            ...item,
            revenue,
            variance: revenue - expectedRevenueAtBase,
            performance: expectedRevenueAtBase > 0 ? (revenue / expectedRevenueAtBase) * 100 : 100,
            basePrice
          };
        }),
        total: savedSale.gross_revenue ?? totalInvoiceValue,
        date: new Date().toLocaleDateString()
      };

      setSalesLog([...salesLog, newInvoice]);
      setStockAlert(null);
      setFeedbackMsg({ type: 'success', text: 'Invoice saved to the database.' });
      setInvoiceCustomer('');
      setInvoicePaymentType('Cash');
      setInvoiceAmountPaid('');
      setInvoiceItems([{ itemCode: '', actualSize: '', qty: '', sellingPrice: '', delivered: '', selectedProfileKey: '', sourceConsignmentRef: '' }]);
    } catch (err) {
      console.error('Failed to save invoice:', err.response?.data || err.message);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save invoice — nothing was recorded. Please try again.'
      });
    }
  };

  const handleAddByproduct = async (e) => {
    e.preventDefault();
    if (!byproductForm.qty || !byproductForm.price) return;

    setFeedbackMsg(null);
    try {
      const response = await apiClient.post(`/consignments/${consignment.id}/byproduct-sale`, {
        date: byproductForm.date || new Date().toISOString().split('T')[0],
        type: byproductForm.type,
        subType: byproductForm.subType || 'N/A',
        qty: Number(byproductForm.qty),
        pricePerKg: Number(byproductForm.price)
      });
      const saved = response.data;

      const newSale = {
        id: saved._id || Date.now().toString(),
        date: byproductForm.date || new Date().toISOString().split('T')[0],
        type: byproductForm.type,
        subType: byproductForm.subType || 'N/A',
        qty: Number(byproductForm.qty),
        price: Number(byproductForm.price),
        revenue: saved.revenue ?? (Number(byproductForm.qty) * Number(byproductForm.price))
      };
      setByproductSales([...byproductSales, newSale]);
      setFeedbackMsg({ type: 'success', text: 'Byproduct sale saved to the database.' });
      setByproductForm({ date: new Date().toISOString().split('T')[0], type: 'Loose Fiber', subType: 'Grade A', qty: '', price: '' });
    } catch (err) {
      console.error('Failed to save byproduct sale:', err.response?.data || err.message);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save byproduct sale — nothing was recorded. Please try again.'
      });
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.category) return;

    setFeedbackMsg(null);
    try {
      const response = await apiClient.post(`/consignments/${consignment.id}/expense`, {
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        category: expenseForm.category,
        description: expenseForm.description || '',
        amount: Number(expenseForm.amount)
      });
      const saved = response.data;

      const newExpense = {
        id: saved._id || Date.now().toString(),
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        category: expenseForm.category,
        description: expenseForm.description || '',
        amount: Number(expenseForm.amount)
      };
      setExpenses([...expenses, newExpense]);
      setFeedbackMsg({ type: 'success', text: 'Expense saved to the database.' });
      setExpenseForm({ date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '' });
    } catch (err) {
      console.error('Failed to save expense:', err.response?.data || err.message);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save expense — nothing was recorded. Please try again.'
      });
    }
  };

  const detailedSalesRows = useMemo(() => {
    const entries = [];
    salesLog.forEach(inv => {
      const itemWeightFactor = inv.total > 0 ? inv.amountPaid / inv.total : 0;
      inv.items.forEach((item, itemIdx) => {
        const deliveredQty = item.delivered || 0;
        const pendingQty = Math.max(0, item.qty - deliveredQty);
        
        entries.push({
          invoiceId: inv.backendId || inv.id,
          itemIndex: itemIdx,
          date: inv.date,
          customer: inv.customer,
          paymentType: inv.paymentType,
          item: item.itemCode,
          actualSize: item.actualSize,
          qty: item.qty,
          sellingPrice: item.sellingPrice,
          revenue: item.revenue,
          amountPaid: item.revenue * itemWeightFactor,
          balance: item.revenue - (item.revenue * itemWeightFactor),
          sourceRef: item.sourceConsignmentRef || consignment.consignmentRef,
          delivered: deliveredQty,
          pending: pendingQty
        });
      });
    });
    return entries;
  }, [salesLog, consignment]);

  const grandTotalStockAssetValue = useMemo(() => {
    return liveStockLedger.reduce((sum, item) => sum + item.stockValue, 0);
  }, [liveStockLedger]);

  const debtManagementLedger = useMemo(() => {
    return salesLog.map(inv => ({
      id: inv.id,
      date: inv.date,
      customer: inv.customer,
      totalInvoice: inv.total,
      amountPaid: inv.amountPaid,
      outstandingDebt: Math.max(0, inv.total - inv.amountPaid)
    }));
  }, [salesLog]);

  const reconciliationMetrics = useMemo(() => {
    const totalItemRevenue = salesLog.reduce((sum, inv) => sum + inv.total, 0);
    const byproductRevenue = byproductSales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalRevenue = totalItemRevenue + byproductRevenue;
    const stockValue = grandTotalStockAssetValue;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const estBaseLandingCost = Number(consignment?.total_landing_cost || consignment?.estBaseLandingCost || 0);

    // totalItemRevenue above counts the FULL invoice value even where a
    // balance is still owing — that's correct for accrual accounting, but
    // it means netProfit alone overstates actual cash on hand whenever
    // there's outstanding debt. These two numbers separate the two views.
    const totalOutstandingDebt = salesLog.reduce((sum, inv) => sum + Math.max(0, inv.total - inv.amountPaid), 0);
    const totalCashReceived = salesLog.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const realCashPosition = (totalCashReceived + byproductRevenue) - (totalExpenses + estBaseLandingCost);

    return {
      totalItemRevenue,
      byproductRevenue,
      totalRevenue,
      stockValue,
      totalExpenses,
      estBaseLandingCost,
      totalCost: totalExpenses + estBaseLandingCost,
      netProfit: (totalRevenue + stockValue) - (totalExpenses + estBaseLandingCost),
      totalOutstandingDebt,
      totalCashReceived,
      realCashPosition
    };
  }, [salesLog, byproductSales, grandTotalStockAssetValue, expenses, consignment]);

  // Production Ledger and Byproduct Sales tabs are now included for all consignments
  // 'debts' moved out of admin-only: staff regularly collect debt payments
  // from customers directly and need to be able to record them in real
  // time. 'reconciliation' stays admin-only — it shows profit margins and
  // overall business position, which is a different kind of sensitivity
  // than "which customers owe money."
  const ADMIN_ONLY_TAB_IDS = ['reconciliation'];
  const tabs = [
    { id: 'production', name: 'Production Ledger', icon: Layers },
    { id: 'pricelist', name: 'Pricelist Matrix', icon: TrendingUp },
    { id: 'sales', name: 'Sales Ledger Engine', icon: ShoppingBag },
    { id: 'byproduct', name: 'Byproduct Sales', icon: BarChart2 },
    { id: 'expenses', name: 'Operational Expenses', icon: DollarSign },
    { id: 'stock', name: 'Live Stock Ledger', icon: FileText },
    { id: 'debts', name: 'Debt Tracking Analysis', icon: Users },
    { id: 'reconciliation', name: 'Financial Reconciliation', icon: Wallet },
  ].filter(tab => role === 'admin' || !ADMIN_ONLY_TAB_IDS.includes(tab.id));

  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-6 gap-4">
        <div>
          <button onClick={onBack} className="flex items-center text-sm text-amber-500 hover:text-amber-400 mb-2 transition cursor-pointer">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Workspace Grid
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Consignment Workspace: <span className="text-amber-500">{consignment?.consignment_ref || consignment?.consignmentRef || 'N/A'}</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Category Profile: <span className="text-amber-400 font-semibold">{consignment?.type}</span> | 
            Manifest Volume: <span className="text-slate-200">{consignment?.totalVolumeCount || 0} {unitLabel}s ({consignment?.totalGrossMassWeight || 0} KGS)</span>
          </p>
        </div>

        {/* Upload Manifest Packing List Button for Production Ledger - admin only */}
        {activeTab === 'production' && role === 'admin' && (
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 gap-3 shadow-md">
            <label className="text-xs text-slate-300 font-medium flex items-center gap-2 cursor-pointer hover:text-amber-400 transition">
              <Upload className="w-4 h-4 text-amber-500" />
              <span>Upload Manifest Packing List</span>
              <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" />
            </label>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Base Landing Cost</div>
            <div className="text-lg font-bold text-emerald-400">{currency}{reconciliationMetrics.estBaseLandingCost.toLocaleString()}</div>
          </div>

          {/* Explicit save to the database. Edits below only update local
              state/cache until this is clicked — nothing here reaches the
              database automatically on every keystroke anymore. */}
          <button
            type="button"
            disabled={commitStatus === 'saving'}
            onClick={async () => {
              if (!onCommitData) return;
              setCommitStatus('saving');
              const result = await onCommitData({ productionList, pricelist, salesLog, byproductSales, expenses });
              setCommitStatus(result?.success ? 'saved' : 'error');
              setTimeout(() => setCommitStatus('idle'), 2500);
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer shadow-md"
          >
            {commitStatus === 'saving' ? 'Saving…' : commitStatus === 'saved' ? '✔ Saved' : commitStatus === 'error' ? '⚠ Save failed' : 'Update'}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-1.5">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition text-left cursor-pointer ${
                  activeTab === tab.id ? 'bg-amber-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                {tab.name}
              </button>
            );
          })}
        </div>

        <div className="xl:col-span-3 bg-slate-800/40 border border-slate-850 p-6 rounded-2xl shadow-inner backdrop-blur-sm">
          
          {activeTab === 'production' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h2 className="text-xl font-semibold text-white">Production Tracking Log Run</h2>
                <span className="text-xs text-slate-400 italic">💡 Entry adjustments automatically auto-calculate balances inside your ledger sheets</span>
              </div>
              {role === 'admin' && (
                <form onSubmit={handleAddProduction} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Item Description</label>
                    <input type="text" required placeholder="LMD" value={prodForm.item} onChange={e => setProdForm({...prodForm, item: e.target.value.toUpperCase()})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Unit</label>
                    <select value={prodForm.unit} onChange={e => handleUnitToggle(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white cursor-pointer">
                      <option value="KGS per Bale">KGS per Bale</option>
                      <option value="PCS per Bale">PCS per Bale</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Std Size</label>
                    <input type="text" value={prodForm.stdSize} onChange={e => setProdForm({...prodForm, stdSize: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Quantity ({unitLabel}s)</label>
                    <input type="number" required placeholder="0" value={prodForm.qty} onChange={e => setProdForm({...prodForm, qty: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Actual Output Size</label>
                    <input type="text" value={prodForm.actualSize} onChange={e => setProdForm({...prodForm, actualSize: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono" />
                  </div>
                  <div className="col-span-1 md:col-span-5 flex justify-end pt-2">
                    <button type="submit" className="bg-amber-500 text-slate-900 font-bold text-xs rounded-xl px-5 py-2.5 hover:bg-amber-400 transition flex items-center gap-1 cursor-pointer">
                      <Plus className="w-4 h-4" /> Add Item Record
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase font-semibold">
                      <th className="py-3 px-2">Item Description</th>
                      <th className="py-3 px-2">Unit</th>
                      <th className="py-3 px-2">Std Size</th>
                      <th className="py-3 px-2">Quantity</th>
                      <th className="py-3 px-2">Actual Output Size</th>
                      <th className="py-3 px-2">Type Status</th>
                      <th className="py-3 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionList.length === 0 ? (
                      <tr><td colSpan="7" className="py-8 text-center text-slate-500 text-xs">No records logged. You can upload an Excel manifest above or add entries manually.</td></tr>
                    ) : (
                      productionList.map((p) => (
                        <tr key={p.id} className="border-b border-slate-800 text-slate-200 hover:bg-slate-800/20">
                          <td className="py-2 px-1">
                            <input type="text" disabled={role !== 'admin'} value={p.item} onChange={(e) => handleInlineProductionEdit(p.id, 'item', e.target.value.toUpperCase())} className="bg-transparent border border-transparent hover:border-slate-700 focus:bg-slate-900 focus:border-amber-500 rounded px-2 py-1 text-sm text-white font-bold w-28 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70" />
                          </td>
                          <td className="py-2 px-1 text-xs">
                            <select disabled={role !== 'admin'} value={p.unit} onChange={(e) => handleInlineProductionEdit(p.id, 'unit', e.target.value)} className="bg-transparent border border-transparent hover:border-slate-700 focus:bg-slate-900 focus:border-amber-500 rounded px-1 py-1 text-slate-300 focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-70">
                              <option value="KGS per Bale">KGS per Bale</option>
                              <option value="PCS per Bale">PCS per Bale</option>
                            </select>
                          </td>
                          <td className="py-2 px-1">
                            <input type="text" disabled={role !== 'admin'} value={p.stdSize} onChange={(e) => handleInlineProductionEdit(p.id, 'stdSize', e.target.value)} className="bg-transparent border border-transparent hover:border-slate-700 focus:bg-slate-900 focus:border-amber-500 rounded px-2 py-1 text-sm font-mono text-slate-300 w-20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70" />
                          </td>
                          <td className="py-2 px-1">
                            <input type="number" disabled={role !== 'admin'} value={p.qty} onChange={(e) => handleInlineProductionEdit(p.id, 'qty', Number(e.target.value))} className="bg-transparent border border-transparent hover:border-slate-700 focus:bg-slate-900 focus:border-amber-500 rounded px-2 py-1 text-sm font-black text-amber-500 w-20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70" />
                          </td>
                          <td className="py-2 px-1">
                            <input type="text" disabled={role !== 'admin'} value={p.actualSize} onChange={(e) => handleInlineProductionEdit(p.id, 'actualSize', e.target.value)} className="bg-transparent border border-transparent hover:border-slate-700 focus:bg-slate-900 focus:border-amber-500 rounded px-2 py-1 text-sm font-mono text-white w-24 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70" />
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${p.isVariance ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {p.isVariance ? 'Weight Variance' : 'Standard Base'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button type="button" onClick={() => handleDeleteProductionRow(p.id)} className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {productionList.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-amber-500/40 text-slate-100 font-bold text-sm">
                        <td className="py-3 px-2" colSpan="3">Total Quantity (Bales Produced)</td>
                        <td className="py-3 px-2 text-amber-400">
                          {productionList.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)}
                        </td>
                        <td className="py-3 px-2" colSpan="3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pricelist' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Pricelist Matrix Valuation</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs">
                      <th className="py-3 px-2">Item</th>
                      <th className="py-3 px-2">Std Size</th>
                      <th className="py-3 px-2">Price (Std Base)</th>
                      <th className="py-3 px-2">Std Qty Base</th>
                      <th className="py-3 px-2">Variance Bales Logged</th>
                      <th className="py-3 px-2 text-right">Total Matrix Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedPricelistItems.length === 0 ? (
                      <tr><td colSpan="6" className="py-8 text-center text-slate-500 text-xs">Waiting for Production Logs.</td></tr>
                    ) : (
                      calculatedPricelistItems.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800 text-slate-200">
                          <td className="py-3 px-2 font-bold text-white">{item.item}</td>
                          <td className="py-3 px-2 font-mono text-slate-400 text-xs">{item.stdSize}</td>
                          <td className="py-3 px-2">
                            <input type="number" disabled={role !== 'admin'} value={item.stdPrice || ''} onChange={e => handlePricelistChange(item.id, 'stdPrice', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-28 text-xs text-emerald-400 font-semibold focus:outline-none disabled:cursor-not-allowed disabled:opacity-70" />
                          </td>
                          <td className="py-3 px-2 font-black text-slate-300">{item.qty}</td>
                          <td className="py-3 px-2 text-xs text-slate-400 italic max-w-xs truncate">{item.extraDisplay}</td>
                          <td className="py-3 px-2 text-right font-bold text-white">{currency}{item.totalStockVal.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-8">
              <h2 className="text-xl font-semibold text-white">Commercial Invoice Registry</h2>
              
              {stockAlert && (
                <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">{stockAlert}</span>
                </div>
              )}

              <form onSubmit={handleCreateInvoice} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Customer Account Designation</label>
                    <input type="text" required placeholder="CLIENT ALIAS" value={invoiceCustomer} onChange={e => setInvoiceCustomer(e.target.value.toUpperCase())} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-full font-semibold focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Payment Type Method</label>
                    <select value={invoicePaymentType} onChange={e => setInvoicePaymentType(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none cursor-pointer">
                      <option value="Cash">Cash (Cash or Bank Transfer)</option>
                      <option value="Part Payment">Part Payment</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Initial Amount Paid ({currency}) — Total: {currency}{invoiceTotal.toLocaleString()}
                    </label>
                    <input
                      type="number"
                      required
                      disabled={invoicePaymentType === 'Cash' || invoicePaymentType === 'Credit'}
                      placeholder="0.00"
                      value={invoiceAmountPaid}
                      onChange={e => setInvoiceAmountPaid(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold w-full focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                    {(invoicePaymentType === 'Part Payment' || invoicePaymentType === 'Credit') && (
                      <p className="text-[11px] mt-1 font-semibold text-rose-400">
                        Balance: {currency}{invoiceBalance.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs text-slate-400 font-medium">Manifest Line Items Allocation & Supply Input</label>
                  {invoiceItems.map((line, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      
                      <div className="flex flex-col grow">
                        <select
                          required
                          value={line.selectedProfileKey || ''}
                          onChange={e => handleInvoiceItemChange(idx, 'selectedProfileKey', e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="" disabled>Select item & batch...</option>
                          {availableStockProfiles.map(p => (
                            <option key={p.key} value={p.key}>
                              {p.displayName}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <input type="text" disabled placeholder="Size" value={line.actualSize || ''} className="bg-slate-950 border border-slate-800 text-slate-400 rounded px-2 py-1.5 text-xs w-20 font-mono text-center" />
                      
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 mb-0.5">Qty Ordered</span>
                        <input type="number" required placeholder="Qty" value={line.qty || ''} onChange={e => handleInvoiceItemChange(idx, 'qty', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white w-20 font-bold" />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-emerald-400 mb-0.5 font-medium">Bales Supplied</span>
                        <input type="number" placeholder="Supplied" value={line.delivered !== '' ? line.delivered : ''} onChange={e => handleInvoiceItemChange(idx, 'delivered', e.target.value)} className="bg-slate-900 border border-emerald-500/50 rounded px-2 py-1.5 text-xs text-emerald-400 w-24 font-bold" />
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 mb-0.5">Unit Price</span>
                        <input type="number" required placeholder="Price" value={line.sellingPrice || ''} onChange={e => handleInvoiceItemChange(idx, 'sellingPrice', e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-400 w-24 font-mono" />
                      </div>

                      {invoiceItems.length > 1 && (
                        <button type="button" onClick={() => removeInvoiceRow(idx)} className="text-rose-500 p-1 cursor-pointer mt-4"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button type="button" onClick={() => setInvoiceItems([...invoiceItems, { itemCode: '', actualSize: '', qty: '', sellingPrice: '', delivered: '', selectedProfileKey: '', sourceConsignmentRef: '' }])} className="text-xs text-amber-500 font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3 h-3" /> Add Item Line Row</button>
                  <button type="submit" className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400 transition cursor-pointer">Post Commercial Invoice</button>
                </div>
              </form>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">Revenue</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-center">Supply Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 font-mono">
                    {detailedSalesRows.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-800/10 text-slate-300">
                        <td className="py-2.5 px-3 text-slate-500">{row.date}</td>
                        <td className="py-2.5 px-3 font-sans font-bold text-white">
                          {row.item} <span className="text-slate-400 text-[10px] font-mono font-normal">({row.actualSize})</span>
                          {row.sourceRef && row.sourceRef !== consignment.consignmentRef && (
                            <div className="text-amber-400 text-[9px] font-sans font-medium mt-0.5">via {row.sourceRef}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className={row.delivered < row.qty ? 'text-amber-400' : 'text-white'}>{row.delivered}</span>
                          <span className="text-slate-500"> / {row.qty}</span>
                        </td>
                        <td>{currency}{row.sellingPrice.toLocaleString()}</td>
                        <td className="text-emerald-400 font-bold">{currency}{row.revenue.toLocaleString()}</td>
                        <td className="font-sans font-semibold text-slate-200">
                          {row.customer}
                          {role === 'admin' && (
                            voidingInvoiceId === row.invoiceId ? (
                              <div className="mt-1 flex items-center gap-1">
                                <input
                                  type="text"
                                  autoFocus
                                  placeholder="Reason for voiding..."
                                  value={voidReason}
                                  onChange={e => setVoidReason(e.target.value)}
                                  className="bg-slate-900 border border-rose-700 rounded px-2 py-1 text-[10px] text-white w-32 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleVoidSale(row.invoiceId)}
                                  className="bg-rose-600 text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setVoidingInvoiceId(null); setVoidReason(''); }}
                                  className="text-slate-400 text-[10px] px-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => { setVoidingInvoiceId(row.invoiceId); setVoidReason(''); }}
                                className="block mt-0.5 text-rose-500 hover:text-rose-400 text-[9px] font-sans font-medium underline cursor-pointer"
                              >
                                Void Sale
                              </button>
                            )
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-emerald-400 font-bold">{currency}{row.amountPaid.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                          {row.balance > 0.01 && (
                            <div className="text-rose-400 text-[10px]">Bal: {currency}{row.balance.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                          )}
                        </td>
                        
                        <td className="py-2.5 px-3 text-center">
                          {row.pending === 0 ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Supplied (Complete)
                            </span>
                          ) : supplyingRowKey === `${row.invoiceId}-${row.itemIndex}` ? (
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                autoFocus
                                min="1"
                                max={row.pending}
                                placeholder="Qty"
                                value={supplyAmount}
                                onChange={e => setSupplyAmount(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-16 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRecordSupply(row.invoiceId, row.itemIndex)}
                                className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSupplyingRowKey(null); setSupplyAmount(''); }}
                                className="text-slate-400 text-[10px] px-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setSupplyingRowKey(`${row.invoiceId}-${row.itemIndex}`); setSupplyAmount(''); }}
                              className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <AlertCircle className="w-3 h-3" /> Pending ({row.pending} {unitLabel}) — Mark Supplied
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'byproduct' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">ByProduct Salvage Monetization Ledger</h2>
              <form onSubmit={handleAddByproduct} className="grid grid-cols-2 md:grid-cols-6 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <input type="date" required value={byproductForm.date} onChange={e => setByproductForm({...byproductForm, date: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <input type="text" required placeholder="Type" value={byproductForm.type} onChange={e => setByproductForm({...byproductForm, type: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <input type="text" placeholder="Sub-Type" value={byproductForm.subType} onChange={e => setByproductForm({...byproductForm, subType: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <input type="number" required placeholder="Qty" value={byproductForm.qty} onChange={e => setByproductForm({...byproductForm, qty: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <input type="number" required placeholder="Price" value={byproductForm.price} onChange={e => setByproductForm({...byproductForm, price: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                </div>
                <button type="submit" className="bg-amber-500 text-slate-900 font-bold text-xs rounded-lg h-8 hover:bg-amber-400 transition cursor-pointer">Add Salvage</button>
              </form>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs">
                    <th>Date</th><th>Type</th><th>Sub-Type</th><th>Qty</th><th>Price</th><th className="text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {byproductSales.map(s => (
                    <tr key={s.id} className="border-b border-slate-800 text-slate-200 py-3">
                      <td className="py-2 text-xs font-mono text-slate-400">{s.date}</td>
                      <td className="font-bold text-white">{s.type}</td>
                      <td className="text-xs text-slate-300">{s.subType}</td>
                      <td className="font-mono">{s.qty}</td>
                      <td className="font-mono">{currency}{s.price}</td>
                      <td className="text-right font-bold text-emerald-400 font-mono">{currency}{s.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                {byproductSales.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-amber-500/40 text-slate-100 font-bold text-sm">
                      <td colSpan="5" className="py-3">Total Value Realised</td>
                      <td className="text-right py-3 text-emerald-400 font-mono">
                        {currency}{byproductSales.reduce((sum, s) => sum + (s.revenue || 0), 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Yard Operational Expenses Ledger</h2>
              <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                <select required value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer">
                    <option value="" disabled>Select Category</option>
                    <option value="Port logistics">Port logistics</option>
                    <option value="Magazine Rent">Magazine Rent</option>
                    <option value="Fuel & Transport">Fuel & Transport</option>
                    <option value="Staff Wages">Staff Wages</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Others">Others</option>
                  </select>
                <input type="text" required placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none" />
                <div className="flex gap-2">
                  <input type="number" required placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none grow" />
                  <button type="submit" className="bg-rose-500 text-white font-bold text-xs rounded-lg px-4 h-8 transition hover:bg-rose-400 cursor-pointer">Add</button>
                </div>
              </form>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs">
                    <th>Date</th><th>Category</th><th>Description</th><th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(e => (
                    <tr key={e.id} className="border-b border-slate-800 text-slate-200">
                      <td className="py-2 text-xs font-mono text-slate-400">{e.date}</td>
                      <td className="font-bold text-white">{e.category}</td>
                      <td className="text-slate-300 text-xs">{e.description}</td>
                      <td className="text-right font-bold text-rose-400 font-mono">{currency}{e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Automated Live Stock Balance Ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                      <th className="py-3 px-2">Item</th>
                      <th className="py-3 px-2">Std Size</th>
                      <th className="py-3 px-2">Standard Qty Base</th>
                      <th className="py-3 px-2">Variance Track Info (Remaining)</th>
                      <th className="py-3 px-2">Sold (Std)</th>
                      <th className="py-3 px-2">Current Balance (Total Units)</th>
                      <th className="py-3 px-2 text-right">Stock Net Asset Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveStockLedger.length === 0 ? (
                      <tr><td colSpan="7" className="py-8 text-center text-slate-500 text-xs">No stock items found.</td></tr>
                    ) : (
                      <>
                        {liveStockLedger.map((stock, idx) => (
                          <tr key={idx} className="border-b border-slate-800 text-slate-200 hover:bg-slate-800/10">
                            <td className="py-3 px-2 text-white font-bold">{stock.item}</td>
                            <td className="py-3 px-2 font-mono text-slate-400 text-xs">{stock.actualSize}</td>
                            <td className="py-3 px-2 font-mono font-semibold">{stock.qty}</td>
                            <td className="py-3 px-2 text-xs text-slate-400 italic font-mono">{stock.varianceInfo}</td>
                            <td className="py-3 px-2 font-semibold text-amber-400 font-mono">{stock.sold}</td>
                            <td className="py-3 px-2 font-black text-emerald-400 font-mono">{stock.balance}</td>
                            <td className="py-3 px-2 text-right font-black text-white font-mono">{currency}{stock.stockValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-900/80 border-t-2 border-slate-700 font-sans font-bold text-white">
                          <td colSpan="4" className="py-4 px-2 text-right text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Total Items Available:
                          </td>
                          <td></td>
                          <td className="py-4 px-2 font-black text-emerald-400 font-mono">
                            {liveStockLedger.reduce((sum, s) => sum + (s.balance || 0), 0)}
                          </td>
                          <td className="py-4 px-2 text-right text-base font-black text-amber-400 font-mono">
                            {currency}{grandTotalStockAssetValue.toLocaleString(undefined, {maximumFractionDigits: 2})}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'debts' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Outstanding Customer Debts</h2>
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs">
                    <th>Invoice Date</th><th>Customer</th><th>Invoice Value</th><th>Amount Paid</th><th>Outstanding Debt</th><th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {debtManagementLedger.filter(d => d.outstandingDebt > 0).map(debt => (
                    <tr key={debt.id} className="border-b border-slate-800 text-slate-200">
                      <td className="py-3 text-xs text-slate-400 font-mono">{debt.date}</td>
                      <td className="font-bold text-white">{debt.customer}</td>
                      <td className="font-mono">{currency}{debt.totalInvoice.toLocaleString()}</td>
                      <td className="font-mono text-emerald-400">{currency}{debt.amountPaid.toLocaleString()}</td>
                      <td className="font-black text-rose-400 font-mono">{currency}{debt.outstandingDebt.toLocaleString()}</td>
                      <td className="text-right">
                        {repayingInvoiceId === debt.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              autoFocus
                              min="1"
                              max={debt.outstandingDebt}
                              placeholder="Amount"
                              value={repayAmount}
                              onChange={e => setRepayAmount(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-24 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleRecordPayment(debt.id)}
                              className="bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRepayingInvoiceId(null); setRepayAmount(''); }}
                              className="text-slate-400 text-[10px] px-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setRepayingInvoiceId(debt.id); setRepayAmount(''); }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white border-b border-slate-800 pb-2">Consignment Settlement Statement</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Gross Sales Revenue</span>
                  <p className="text-xl font-black text-emerald-400">{currency}{reconciliationMetrics.totalItemRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Byproduct Revenue Allocation</span>
                  <p className="text-xl font-black text-sky-400">{currency}{reconciliationMetrics.byproductRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Cumulative Gross Revenue</span>
                  <p className="text-xl font-black text-white">{currency}{reconciliationMetrics.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Base Landing Cost</span>
                  <p className="text-xl font-black text-slate-200">{currency}{reconciliationMetrics.estBaseLandingCost.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Yard Overheads</span>
                  <p className="text-xl font-black text-rose-400">{currency}{reconciliationMetrics.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">Total Cost Accumulation</span>
                  <p className="text-xl font-black text-rose-500">{currency}{reconciliationMetrics.totalCost.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Estimated Yard Asset Stock Value</span>
                  <p className="text-2xl font-black text-amber-400">{currency}{reconciliationMetrics.stockValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                </div>
                <div className="space-y-1 md:pl-6 pt-4 md:pt-0">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Net Position Assessment Position Margin</span>
                  <p className={`text-2xl font-black ${reconciliationMetrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currency}{reconciliationMetrics.netProfit.toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-rose-500/30 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                <div className="space-y-1">
                  <span className="text-xs text-rose-400 font-medium uppercase tracking-wider">Outstanding Customer Debt</span>
                  <p className="text-2xl font-black text-rose-400">{currency}{reconciliationMetrics.totalOutstandingDebt.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
                  <p className="text-[11px] text-slate-500">Unpaid balance across all invoices — see Debt Tracking Analysis for the breakdown.</p>
                </div>
                <div className="space-y-1 md:pl-6 pt-4 md:pt-0">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Real Cash Position</span>
                  <p className={`text-2xl font-black ${reconciliationMetrics.realCashPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currency}{reconciliationMetrics.realCashPosition.toLocaleString(undefined, {maximumFractionDigits: 2})}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Actual cash received minus costs — unlike Net Position above, this excludes revenue still sitting as unpaid debt.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}