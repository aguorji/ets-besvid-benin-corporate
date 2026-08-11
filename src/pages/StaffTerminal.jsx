// src/pages/StaffTerminal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogOut, Package, ArrowLeft, Layers, TrendingUp, 
  ShoppingBag, BarChart2, DollarSign, FileText, Plus, Trash2, CheckCircle2, AlertCircle, Upload 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useConsignmentData } from '../components/useConsignmentData'; 
import GeneralStockModal from '../components/GeneralStockModal';
import * as XLSX from 'xlsx';

/**
 * StaffTerminal Component
 * Provides the operational interface for staff members to manage consignments,
 * log production (via manual entry or Excel manifest upload), generate commercial invoices with explicit 
 * cross-consignment selection and "Bales Supplied" inputs, run stock checks, and track fulfillment status.
 */
export default function StaffTerminal() {
  const { user, logout } = useAuth();
  const { 
    currency, 
    consignments, 
    getWorkspaceData, 
    saveWorkspaceData 
  } = useConsignmentData();

  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isGeneralStockOpen, setIsGeneralStockOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pricelist');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [productionList, setProductionList] = useState([]);
  const [pricelist, setPricelist] = useState([]);
  const [salesLog, setSalesLog] = useState([]);
  const [byproductSales, setByproductSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [prodForm, setProdForm] = useState({ item: '', unit: 'KGS per Bale', stdSize: '55KG', qty: '', actualSize: '55KG' });
  
  // Sales Invoice Multi-Item & Payment Options State with "delivered" (Bales Supplied) input
  const [invoiceCustomer, setInvoiceCustomer] = useState('');
  const [invoicePaymentType, setInvoicePaymentType] = useState('Cash'); 
  const [invoiceAmountPaid, setInvoiceAmountPaid] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { itemCode: '', actualSize: '', qty: '', sellingPrice: '', delivered: '', selectedProfileKey: '', sourceConsignmentRef: '' }
  ]);

  // Out of stock warning alert state
  const [stockAlert, setStockAlert] = useState(null);

  const [byproductForm, setByproductForm] = useState({ date: '', type: 'Loose Fiber', subType: 'Grade A', qty: '', price: '' });
  const [expenseForm, setExpenseForm] = useState({ date: '', category: '', description: '', amount: '' });

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Safely open workspace and load saved arrays or default to empty arrays
  const handleOpenWorkspace = (consignment) => {
    setActiveWorkspace(consignment);
    const workspaceData = getWorkspaceData(consignment.id) || {};
    setProductionList(workspaceData.productionList || []);
    setPricelist(workspaceData.pricelist || []);
    setSalesLog(workspaceData.salesLog || []);
    setByproductSales(workspaceData.byproductSales || []);
    setExpenses(workspaceData.expenses || []);
    setActiveTab(consignment.type === 'Giant Bales' ? 'production' : 'pricelist');
  };

  const getUnitLabel = (type) => {
    if (type === 'Shoes' || type === 'Bags') return 'Sacks';
    return 'Bales';
  };

  const handleUnitToggle = (selectedUnit) => {
    const defaultSize = selectedUnit === 'KGS per Bale' ? '55KG' : '250 PCS';
    setProdForm({ ...prodForm, unit: selectedUnit, stdSize: defaultSize, actualSize: defaultSize });
  };

  const processProductionEntry = (itemName, unit, stdSize, qtyNum, actualSize, currentProdList, currentPriceList) => {
    const newItemId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const numericStd = parseFloat(stdSize) || 1;
    const numericActual = parseFloat(actualSize) || 1;
    const isVarianceBale = numericStd !== numericActual;

    currentProdList.push({ id: newItemId, item: itemName, unit, stdSize, qty: qtyNum, actualSize, isVariance: isVarianceBale });

    const existingIdx = currentPriceList.findIndex(p => p.item && p.item.toLowerCase() === itemName.toLowerCase());
    if (existingIdx > -1) {
      if (isVarianceBale) {
        currentPriceList[existingIdx].varianceBales = [...(currentPriceList[existingIdx].varianceBales || []), { id: newItemId, qty: qtyNum, actualSize }];
      } else {
        currentPriceList[existingIdx].qty += qtyNum;
      }
    } else {
      currentPriceList.push({
        id: newItemId, item: itemName, unit, stdSize, stdPrice: 0,
        qty: isVarianceBale ? 0 : qtyNum,
        varianceBales: isVarianceBale ? [{ id: newItemId, qty: qtyNum, actualSize }] : []
      });
    }
  };

  const handleAddProduction = (e) => {
    e.preventDefault();
    if (!prodForm.item || !prodForm.qty || !activeWorkspace) return;
    const qtyNum = Number(prodForm.qty);
    const itemName = prodForm.item.toUpperCase().trim();
    const numericStd = parseFloat(prodForm.stdSize) || 1;
    const numericActual = parseFloat(prodForm.actualSize) || 1;
    const isVarianceBale = numericStd !== numericActual;

    let updatedProd = [...productionList];
    let updatedPrice = [...pricelist];

    if (isVarianceBale && qtyNum > 0) {
      const standardCount = qtyNum - 1;
      if (standardCount > 0) processProductionEntry(itemName, prodForm.unit, prodForm.stdSize, standardCount, prodForm.stdSize, updatedProd, updatedPrice);
      processProductionEntry(itemName, prodForm.unit, prodForm.stdSize, 1, prodForm.actualSize, updatedProd, updatedPrice);
    } else {
      processProductionEntry(itemName, prodForm.unit, prodForm.stdSize, qtyNum, prodForm.stdSize, updatedProd, updatedPrice);
    }

    setProductionList(updatedProd);
    setPricelist(updatedPrice);
    saveWorkspaceData(activeWorkspace.id, { productionList: updatedProd, pricelist: updatedPrice, salesLog, byproductSales, expenses });
    setProdForm({ item: '', unit: 'KGS per Bale', stdSize: '55KG', qty: '', actualSize: '55KG' });
  };

  // Handle uploading and parsing Excel manifest packing lists for staff production ledger
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeWorkspace) return;

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
      saveWorkspaceData(activeWorkspace.id, { productionList: updatedProd, pricelist: updatedPrice, salesLog, byproductSales, expenses });
      setSuccessMsg('Manifest packing list uploaded and processed successfully.');
    };
    reader.readAsBinaryString(file);
  };

  // Compile available stock profiles across ALL consignments for staff cross-sales with sizes
  const availableStockProfiles = useMemo(() => {
    const profiles = [];
    const extractProfiles = (pList, sLog, refName) => {
      if (!pList) return;
      pList.forEach(p => {
        if (!p) return;
        const totalStdSold = sLog ? sLog.reduce((sum, inv) => {
          const matches = inv.items ? inv.items.filter(i => i.itemCode && i.itemCode.toLowerCase() === p.item.toLowerCase() && i.actualSize === p.stdSize) : [];
          return sum + matches.reduce((acc, curr) => acc + (curr.qty || 0), 0);
        }, 0) : 0;
        const baseBalance = (p.qty || 0) - totalStdSold;

        if (baseBalance > 0) {
          profiles.push({
            itemCode: p.item,
            displayName: `${p.item} (${p.stdSize}) [Ref: ${refName}] - Bal: ${baseBalance}`,
            actualSize: p.stdSize,
            isVariance: false,
            availableQty: baseBalance,
            sourceConsignmentRef: refName
          });
        }

        if (p.varianceBales) {
          p.varianceBales.forEach(v => {
            const totalVarSold = sLog ? sLog.reduce((sum, inv) => {
              const matches = inv.items ? inv.items.filter(i => i.itemCode && i.itemCode.toLowerCase() === p.item.toLowerCase() && i.actualSize === v.actualSize) : [];
              return sum + matches.reduce((acc, curr) => acc + (curr.qty || 0), 0);
            }, 0) : 0;
            const varBal = (v.qty || 0) - totalVarSold;
            if (varBal > 0) {
              profiles.push({
                itemCode: p.item,
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

    // 1. Current workspace profiles
    extractProfiles(pricelist, salesLog, activeWorkspace?.consignmentRef);

    // 2. All other consignments workspaces
    if (consignments && consignments.length > 0) {
      consignments.forEach(c => {
        if (!activeWorkspace || c.id === activeWorkspace.id) return;
        const wsData = getWorkspaceData(c.id) || {};
        extractProfiles(wsData.pricelist || [], wsData.salesLog || [], c.consignmentRef);
      });
    }

    return profiles;
  }, [pricelist, salesLog, activeWorkspace, consignments, getWorkspaceData]);

  // Handle invoice item changes with multi-size and cross-consignment awareness
  const handleInvoiceItemChange = (index, field, value) => {
    const updated = [...invoiceItems];
    updated[index][field] = (field === 'qty' || field === 'sellingPrice' || field === 'delivered') ? Number(value) : value;
    
    if (field === 'itemCode' || field === 'selectedProfileKey') {
      const selectedProfile = availableStockProfiles.find(p => p.displayName === value || p.itemCode === value || `${p.itemCode} (${p.actualSize})` === value);
      if (selectedProfile) {
        updated[index].itemCode = selectedProfile.itemCode;
        updated[index].actualSize = selectedProfile.actualSize;
        updated[index].isVariance = selectedProfile.isVariance;
        updated[index].selectedProfileKey = selectedProfile.displayName;
        updated[index].sourceConsignmentRef = selectedProfile.sourceConsignmentRef || activeWorkspace?.consignmentRef;
      } else {
        const matchingProfiles = availableStockProfiles.filter(p => p.itemCode.toLowerCase() === value.toLowerCase());
        if (matchingProfiles.length === 1) {
          updated[index].itemCode = matchingProfiles[0].itemCode;
          updated[index].actualSize = matchingProfiles[0].actualSize;
          updated[index].sourceConsignmentRef = matchingProfiles[0].sourceConsignmentRef || activeWorkspace?.consignmentRef;
        } else {
          updated[index].itemCode = value.toUpperCase();
          if (!updated[index].sourceConsignmentRef) {
            updated[index].sourceConsignmentRef = activeWorkspace?.consignmentRef || '';
          }
        }
      }
    }
    setInvoiceItems(updated);
    setStockAlert(null);
  };

  const checkAndResolveStockAvailability = (itemCode, requestedQty, size) => {
    const currentStockItem = liveStockLedger.find(s => s.item && s.item.toLowerCase() === itemCode.toLowerCase() && s.actualSize === size);
    if (currentStockItem && currentStockItem.balance >= requestedQty) {
      return { found: true, sourceRef: activeWorkspace?.consignmentRef, deductionType: 'current' };
    }

    if (consignments && consignments.length > 0) {
      for (const otherConsignment of consignments) {
        if (!activeWorkspace || otherConsignment.id === otherConsignment.id) continue;
        
        const otherWorkspaceData = getWorkspaceData(otherConsignment.id) || {};
        const otherPricelist = otherWorkspaceData.pricelist || [];
        const otherSalesLog = otherWorkspaceData.salesLog || [];
        
        const foundMatch = otherPricelist.find(p => p.item && p.item.toLowerCase() === itemCode.toLowerCase());
        if (foundMatch) {
          const otherSold = otherSalesLog.reduce((sum, inv) => {
            const matches = inv.items ? inv.items.filter(i => i.itemCode && i.itemCode.toLowerCase() === itemCode.toLowerCase()) : [];
            return sum + matches.reduce((acc, curr) => acc + (curr.qty || 0), 0);
          }, 0);
          const otherBalance = foundMatch.qty - otherSold;

          if (otherBalance >= requestedQty) {
            return { found: true, sourceRef: otherConsignment.consignmentRef, consignmentId: otherConsignment.id, deductionType: 'cross' };
          }
        }
      }
    }

    return { found: false };
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invoiceCustomer || invoiceItems.some(i => !i.itemCode || !i.qty) || !activeWorkspace) return;

    for (const item of invoiceItems) {
      const reqQty = Number(item.qty);
      const stockCheck = checkAndResolveStockAvailability(item.itemCode, reqQty, item.actualSize);

      if (!stockCheck.found) {
        setStockAlert(`⚠️ Alert: Item "${item.itemCode}" (${item.actualSize}) is NOT in stock in this consignment or any other available consignment!`);
        return;
      }

      item.sourceConsignmentRef = stockCheck.sourceRef || activeWorkspace.consignmentRef;
      item.delivered = item.delivered !== '' && !isNaN(item.delivered) ? Number(item.delivered) : 0;
    }

    const grossInvoiceTotal = invoiceItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.sellingPrice || 0)), 0);
    const amountPaidVal = invoicePaymentType === 'Cash' 
      ? grossInvoiceTotal 
      : invoicePaymentType === 'Credit' 
      ? 0 
      : Number(invoiceAmountPaid || 0);

    const newInvoice = {
      id: Date.now().toString(),
      customer: invoiceCustomer,
      paymentType: invoicePaymentType,
      amountPaid: amountPaidVal,
      items: invoiceItems.map(item => {
        const baseMatch = pricelist.find(p => p.item && p.item.toLowerCase() === item.itemCode.toLowerCase());
        const basePrice = baseMatch ? baseMatch.stdPrice : 0;
        const revenue = Number(item.qty || 0) * Number(item.sellingPrice || 0);
        return { ...item, revenue, basePrice };
      }),
      total: grossInvoiceTotal,
      date: new Date().toLocaleDateString()
    };

    const updatedSales = [...salesLog, newInvoice];
    setSalesLog(updatedSales);
    saveWorkspaceData(activeWorkspace.id, { productionList, pricelist, salesLog: updatedSales, byproductSales, expenses });
    setSuccessMsg(`Commercial invoice successfully logged for ${invoiceCustomer}!`);
    setStockAlert(null);
    setInvoiceCustomer('');
    setInvoicePaymentType('Cash');
    setInvoiceAmountPaid('');
    setInvoiceItems([{ itemCode: '', actualSize: '', qty: '', sellingPrice: '', delivered: '', selectedProfileKey: '', sourceConsignmentRef: '' }]);
  };

  const handleAddByproduct = (e) => {
    e.preventDefault();
    if (!byproductForm.qty || !byproductForm.price || !activeWorkspace) return;
    const updatedByproducts = [...byproductSales, {
      id: Date.now().toString(),
      date: byproductForm.date || new Date().toISOString().split('T')[0],
      type: byproductForm.type,
      subType: byproductForm.subType || 'N/A',
      qty: Number(byproductForm.qty),
      price: Number(byproductForm.price),
      revenue: Number(byproductForm.qty) * Number(byproductForm.price)
    }];
    setByproductSales(updatedByproducts);
    saveWorkspaceData(activeWorkspace.id, { productionList, pricelist, salesLog, byproductSales: updatedByproducts, expenses });
    setByproductForm({ date: '', type: 'Loose Fiber', subType: 'Grade A', qty: '', price: '' });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !activeWorkspace) return;
    const newExpense = {
      id: Date.now().toString(),
      date: expenseForm.date || new Date().toISOString().split('T')[0],
      category: expenseForm.category || 'General Operations',
      description: expenseForm.description || '',
      amount: Number(expenseForm.amount),
      loggedBy: user?.name || 'Staff Operator',
      timestamp: new Date().toLocaleTimeString()
    };
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    saveWorkspaceData(activeWorkspace.id, { productionList, pricelist, salesLog, byproductSales, expenses: updatedExpenses });
    setSuccessMsg('Operational expense logged successfully.');
    setExpenseForm({ date: '', category: '', description: '', amount: '' });
  };

  const detailedSalesRows = useMemo(() => {
    if (!salesLog) return [];
    const entries = [];
    salesLog.forEach(inv => {
      const itemWeightFactor = inv.total > 0 ? inv.amountPaid / inv.total : 0;
      if (inv.items) {
        inv.items.forEach(item => {
          const deliveredQty = item.delivered || 0;
          const pendingQty = Math.max(0, (item.qty || 0) - deliveredQty);

          entries.push({
            date: inv.date, customer: inv.customer, paymentType: inv.paymentType,
            item: item.itemCode, actualSize: item.actualSize, qty: item.qty,
            sellingPrice: item.sellingPrice, revenue: item.revenue,
            amountPaid: (item.revenue || 0) * itemWeightFactor,
            balance: (item.revenue || 0) - ((item.revenue || 0) * itemWeightFactor),
            sourceRef: item.sourceConsignmentRef || activeWorkspace?.consignmentRef,
            delivered: deliveredQty,
            pending: pendingQty
          });
        });
      }
    });
    return entries;
  }, [salesLog, activeWorkspace]);

  const calculatedPricelistItems = useMemo(() => {
    if (!pricelist) return [];
    return pricelist.map(p => {
      const stdWt = parseFloat(p.stdSize) || 1;
      let extraValue = 0;
      let extraBaleCountDisplay = [];
      if (p.varianceBales) {
        p.varianceBales.forEach(v => {
          const actWt = parseFloat(v.actualSize) || 0;
          extraValue += v.qty * (actWt / stdWt) * (p.stdPrice || 0);
          extraBaleCountDisplay.push(`${v.qty} (${v.actualSize})`);
        });
      }
      return { ...p, totalStockVal: ((p.qty || 0) * (p.stdPrice || 0)) + extraValue, extraDisplay: extraBaleCountDisplay.join(', ') || 'None' };
    });
  }, [pricelist]);

  const liveStockLedger = useMemo(() => {
    if (!calculatedPricelistItems) return [];
    return calculatedPricelistItems.map(p => {
      const totalStdSold = salesLog ? salesLog.reduce((sum, inv) => {
        const matches = inv.items ? inv.items.filter(i => i.itemCode && i.itemCode.toLowerCase() === p.item.toLowerCase() && i.actualSize === p.stdSize) : [];
        return sum + matches.reduce((acc, curr) => acc + (curr.qty || 0), 0);
      }, 0) : 0;
      const baseBalance = (p.qty || 0) - totalStdSold;
      const stdWt = parseFloat(p.stdSize) || 1;
      let varianceValueRemaining = 0;
      let activeVarianceStrings = [];
      let totalRemainingVarianceBalesCount = 0;

      if (p.varianceBales) {
        p.varianceBales.forEach(v => {
          const totalVarSold = salesLog ? salesLog.reduce((sum, inv) => {
            const matches = inv.items ? inv.items.filter(i => i.itemCode && i.itemCode.toLowerCase() === p.item.toLowerCase() && i.actualSize === v.actualSize) : [];
            return sum + matches.reduce((acc, curr) => acc + (curr.qty || 0), 0);
          }, 0) : 0;
          const varBal = (v.qty || 0) - totalVarSold;
          if (varBal > 0) {
            const actWt = parseFloat(v.actualSize) || 0;
            varianceValueRemaining += varBal * (actWt / stdWt) * (p.stdPrice || 0);
            activeVarianceStrings.push(`${varBal} (${v.actualSize})`);
            totalRemainingVarianceBalesCount += varBal;
          }
        });
      }
      return {
        item: p.item, actualSize: p.stdSize, qty: p.qty,
        varianceInfo: activeVarianceStrings.join(', ') || 'None',
        sold: totalStdSold, balance: baseBalance + totalRemainingVarianceBalesCount,
        stdPrice: p.stdPrice, stockValue: (baseBalance * (p.stdPrice || 0)) + varianceValueRemaining
      };
    });
  }, [calculatedPricelistItems, salesLog]);

  const workspaceTabs = [
    { id: 'production', name: 'Production Ledger', icon: Layers },
    { id: 'pricelist', name: 'Pricelist Matrix', icon: TrendingUp },
    { id: 'sales', name: 'Sales Ledger Engine', icon: ShoppingBag },
    { id: 'byproduct', name: 'Byproduct Sales', icon: BarChart2 },
    { id: 'expenses', name: 'Operational Expenses', icon: DollarSign },
    { id: 'stock', name: 'Live Stock Ledger', icon: FileText }
  ];

  if (activeWorkspace) {
    return (
      <div className="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-6 gap-4">
          <div>
            <button onClick={() => setActiveWorkspace(null)} className="flex items-center text-sm text-amber-500 hover:text-amber-400 mb-2 transition cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Consignments Registry
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Terminal Workspace: <span className="text-amber-500">{activeWorkspace.consignmentRef}</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">Active Consignment Dispatch Mode</p>
          </div>

          {/* Upload Manifest Packing List Button for Staff Production Ledger */}
          {activeTab === 'production' && activeWorkspace.type === 'Giant Bales' && (
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 gap-3 shadow-md">
              <label className="text-xs text-slate-300 font-medium flex items-center gap-2 cursor-pointer hover:text-amber-400 transition">
                <Upload className="w-4 h-4 text-amber-500" />
                <span>Upload Manifest Packing List</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" />
              </label>
            </div>
          )}

          <button onClick={logout} className="flex items-center gap-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 text-xs px-4 py-2 rounded-xl transition font-semibold cursor-pointer">
            <LogOut className="w-4 h-4" /> Exit Session
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm shadow-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-1.5">
            {workspaceTabs.map(tab => {
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
                <h2 className="text-xl font-semibold text-white">Production Tracking Log Run</h2>
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
                    <label className="block text-xs text-slate-400 mb-1">Quantity (Bales)</label>
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

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase font-semibold">
                        <th className="py-3 px-2">Item Description</th>
                        <th className="py-3 px-2">Unit</th>
                        <th className="py-3 px-2">Std Size</th>
                        <th className="py-3 px-2">Quantity</th>
                        <th className="py-3 px-2">Actual Output Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionList.length === 0 ? (
                        <tr><td colSpan="5" className="py-8 text-center text-slate-500 text-xs">No production records logged.</td></tr>
                      ) : (
                        productionList.map((p) => (
                          <tr key={p.id} className="border-b border-slate-800 text-slate-200">
                            <td className="py-2 px-2 font-bold text-white">{p.item}</td>
                            <td className="py-2 px-2 text-xs text-slate-300">{p.unit}</td>
                            <td className="py-2 px-2 font-mono text-slate-300">{p.stdSize}</td>
                            <td className="py-2 px-2 font-black text-amber-500">{p.qty}</td>
                            <td className="py-2 px-2 font-mono text-white">{p.actualSize}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
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
                        <th className="py-3 px-2 text-right">Total Matrix Stock Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculatedPricelistItems.length === 0 ? (
                        <tr><td colSpan="5" className="py-8 text-center text-slate-500 text-xs">No pricelist items available.</td></tr>
                      ) : (
                        calculatedPricelistItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-800 text-slate-200">
                            <td className="py-3 px-2 font-bold text-white">{item.item}</td>
                            <td className="py-3 px-2 font-mono text-slate-400 text-xs">{item.stdSize}</td>
                            {/* Read-Only Price Display for Staff */}
                            <td className="py-3 px-2 font-mono text-emerald-400 font-semibold">
                              {currency}{Number(item.stdPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-2 font-black text-slate-300">{item.qty}</td>
                            <td className="py-3 px-2 text-right font-bold text-white">{currency}{item.totalStockVal.toLocaleString()}</td>
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
                      <select value={invoicePaymentType} onChange={e => handlePaymentTypeChange(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none cursor-pointer">
                        <option value="Cash">Cash (Full Payment)</option>
                        <option value="Part payment">Part payment (Deposit)</option>
                        <option value="Credit">Credit (Full Debt)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Initial Amount Paid ({currency})</label>
                      <input 
                        type="number" 
                        required 
                        disabled={invoicePaymentType !== 'Part payment'}
                        placeholder="0.00" 
                        value={invoiceAmountPaid} 
                        onChange={e => setInvoiceAmountPaid(e.target.value)} 
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-bold w-full focus:outline-none disabled:opacity-60" 
                      />
                    </div>
                  </div>

                  {/* Multi-Item Line Rows Management with Bales Supplied Input */}
                  <div className="space-y-2">
                    <label className="block text-xs text-slate-400 font-medium">Manifest Line Items Allocation & Supply Input</label>
                    {invoiceItems.map((line, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        <div className="flex flex-col grow">
                          <input 
                            type="text" 
                            list={`staff-stock-profiles-${idx}`} 
                            required 
                            placeholder="Select or type item code..." 
                            value={line.itemCode || ''} 
                            onChange={e => handleInvoiceItemChange(idx, 'itemCode', e.target.value.toUpperCase())} 
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white uppercase font-bold focus:outline-none" 
                          />
                          <datalist id={`staff-stock-profiles-${idx}`}>
                            {availableStockProfiles.map(p => (
                              <option key={p.displayName} value={p.itemCode}>
                                {p.displayName}
                              </option>
                            ))}
                          </datalist>
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
                          <button type="button" onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx))} className="text-rose-500 p-1 cursor-pointer mt-4"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={() => setInvoiceItems([...invoiceItems, { itemCode: '', actualSize: '', qty: '', sellingPrice: '', delivered: '', selectedProfileKey: '', sourceConsignmentRef: '' }])} className="text-xs text-amber-500 font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3 h-3" /> Add Item Line Row</button>
                    <button type="submit" className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400 transition cursor-pointer">Post Commercial Invoice</button>
                  </div>
                </form>

                {/* Sales Transactions Ledger Table with Supply Status Indicator */}
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">Qty Ordered</th>
                        <th className="py-2.5 px-3 text-emerald-400">Supplied</th>
                        <th className="py-2.5 px-3">Price</th>
                        <th className="py-2.5 px-3">Revenue</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3 text-amber-400">Stock Source</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3">Balance</th>
                        <th className="py-2.5 px-3 text-center">Supply Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-mono">
                      {detailedSalesRows.map((row, index) => (
                        <tr key={index} className="hover:bg-slate-800/10 text-slate-300">
                          <td className="py-2.5 px-3 text-slate-500">{row.date}</td>
                          <td className="py-2.5 px-3 font-sans font-bold text-white">{row.item}</td>
                          <td className="py-2.5 px-3 text-slate-400">{row.actualSize}</td>
                          <td className="py-2.5 px-3 text-white font-bold">{row.qty}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.delivered}</td>
                          <td>{currency}{row.sellingPrice.toLocaleString()}</td>
                          <td className="text-emerald-400 font-bold">{currency}{row.revenue.toLocaleString()}</td>
                          <td className="font-sans font-semibold text-slate-200">{row.customer}</td>
                          <td className="text-amber-400 font-sans font-medium text-[11px]">{row.sourceRef}</td>
                          <td className="text-emerald-400">{currency}{row.amountPaid.toLocaleString()}</td>
                          <td className="text-rose-400">{currency}{row.balance.toLocaleString()}</td>
                          
                          <td className="py-2.5 px-3 text-center">
                            {row.pending === 0 ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Supplied (Complete)
                              </span>
                            ) : (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Pending ({row.pending} {getUnitLabel(activeWorkspace?.type)})
                              </span>
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
                  <input type="date" required value={byproductForm.date} onChange={e => setByproductForm({...byproductForm, date: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <input type="text" required placeholder="Type" value={byproductForm.type} onChange={e => setByproductForm({...byproductForm, type: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <input type="text" placeholder="Sub-Type" value={byproductForm.subType} onChange={e => setByproductForm({...byproductForm, subType: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <input type="number" required placeholder="Qty" value={byproductForm.qty} onChange={e => setByproductForm({...byproductForm, qty: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <input type="number" required placeholder="Price" value={byproductForm.price} onChange={e => setByproductForm({...byproductForm, price: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
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
                </table>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Yard Operational Expenses Ledger</h2>
                  <p className="text-xs text-slate-400 mt-1">Expenses logged here will record your staff operator profile and timestamp.</p>
                </div>

                <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                  <input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <input type="text" required placeholder="Category" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <input type="text" required placeholder="Description" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
                  <div className="flex gap-2">
                    <input type="number" required placeholder="Amount" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white grow" />
                    <button type="submit" className="bg-rose-500 text-white font-bold text-xs rounded-lg px-4 h-8 transition hover:bg-rose-400 cursor-pointer">Log Expense</button>
                  </div>
                </form>

                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 text-xs">
                      <th>Date / Time</th><th>Category</th><th>Description</th><th>Logged By Staff</th><th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 ? (
                      <tr><td colSpan="5" className="py-8 text-center text-slate-500 text-xs">No operational expenses logged during this session.</td></tr>
                    ) : (
                      expenses.map(e => (
                        <tr key={e.id} className="border-b border-slate-800 text-slate-200">
                          <td className="py-2 text-xs font-mono text-slate-400">{e.date} <span className="text-slate-500">({e.timestamp})</span></td>
                          <td className="font-bold text-white">{e.category}</td>
                          <td className="text-slate-300 text-xs">{e.description}</td>
                          <td className="text-amber-400 text-xs font-semibold">{e.loggedBy}</td>
                          <td className="text-right font-bold text-rose-400 font-mono">{currency}{e.amount.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
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
                        <th className="py-3 px-2">Sold</th>
                        <th className="py-3 px-2">Current Balance</th>
                        <th className="py-3 px-2 text-right">Stock Net Asset Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveStockLedger.length === 0 ? (
                        <tr><td colSpan="6" className="py-8 text-center text-slate-500 text-xs">No stock items found.</td></tr>
                      ) : (
                        liveStockLedger.map((stock, idx) => (
                          <tr key={idx} className="border-b border-slate-800 text-slate-200">
                            <td className="py-3 px-2 text-white font-bold">{stock.item}</td>
                            <td className="py-3 px-2 font-mono text-slate-400 text-xs">{stock.actualSize}</td>
                            <td className="py-3 px-2 font-mono">{stock.qty}</td>
                            <td className="py-3 px-2 text-amber-400 font-mono">{stock.sold}</td>
                            <td className="py-3 px-2 font-black text-emerald-400 font-mono">{stock.balance}</td>
                            <td className="py-3 px-2 text-right font-black text-white font-mono">{currency}{stock.stockValue.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
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
                          onClick={() => handleOpenWorkspace(row)}
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
          currency={currency}
        />

      </div>
    </div>
  );
}