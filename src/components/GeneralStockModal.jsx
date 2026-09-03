// src/components/GeneralStockModal.jsx
import React, { useMemo } from 'react';
import { X, Package, Printer, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx'; // 👈 Import XLSX library for Excel export

/**
 * GeneralStockModal Component
 * Displays active stock grouped by Consignment Reference and Category, 
 * listing items underneath with individual consignment subtotals, 
 * a grand total general stock value at the end, and Print or Excel export options.
 */
export default function GeneralStockModal({ isOpen, onClose, consignments, getWorkspaceData, currency = '₦' }) {
  // Return null if modal is closed
  if (!isOpen) return null;

  // Sort consignments alphabetically by their Consignment Reference
  const sortedConsignments = useMemo(() => {
    if (!consignments) return [];
    return [...consignments].sort((a, b) => {
      const refA = (a.consignmentRef || '').toString().toUpperCase();
      const refB = (b.consignmentRef || '').toString().toUpperCase();
      return refA.localeCompare(refB);
    });
  }, [consignments]);

  // Group active stock items under their respective Consignment References and calculate group totals
  const consignmentStockGroups = useMemo(() => {
    const groups = [];

    sortedConsignments.forEach(consignment => {
      const workspace = getWorkspaceData(consignment.id);
      const pricelist = workspace.pricelist || [];
      const salesLog = workspace.salesLog || [];
      const itemsInStock = [];
      let groupTotalValue = 0;
      let groupTotalQty = 0;

      pricelist.forEach(p => {
        const stdWt = parseFloat(p.stdSize) || 1;
        let varianceValueRemaining = 0;
        let totalRemainingVarianceBalesCount = 0;

        // Calculate standard units sold from sales logs
        const totalStdSold = salesLog.reduce((sum, inv) => {
          const matches = inv.items.filter(i => i.itemCode.toLowerCase() === p.item.toLowerCase() && i.actualSize === p.stdSize);
          return sum + matches.reduce((acc, curr) => acc + curr.qty, 0);
        }, 0);

        const baseBalance = p.qty - totalStdSold;

        // Calculate variance bales sold and remaining balance quantities
        if (p.varianceBales) {
          p.varianceBales.forEach(v => {
            const totalVarSold = salesLog.reduce((sum, inv) => {
              const matches = inv.items.filter(i => i.itemCode.toLowerCase() === p.item.toLowerCase() && i.actualSize === v.actualSize);
              return sum + matches.reduce((acc, curr) => acc + curr.qty, 0);
            }, 0);
            const varBal = v.qty - totalVarSold;
            if (varBal > 0) {
              const actWt = parseFloat(v.actualSize) || 0;
              varianceValueRemaining += varBal * (actWt / stdWt) * (p.stdPrice || 0);
              totalRemainingVarianceBalesCount += varBal;
            }
          });
        }

        const currentBalanceQty = baseBalance + totalRemainingVarianceBalesCount;
        const netStockValue = (baseBalance * (p.stdPrice || 0)) + varianceValueRemaining;

        // Push item if there is remaining stock quantity available
        if (currentBalanceQty > 0) {
          itemsInStock.push({
            item: p.item,
            stdSize: p.stdSize,
            qty: currentBalanceQty,
            unitPrice: p.stdPrice || 0,
            stockValue: netStockValue
          });
          groupTotalValue += netStockValue;
          groupTotalQty += currentBalanceQty;
        }
      });

      // Each consignment now carries its own currency (see Consignment
      // schema) — use it here instead of assuming every group shares the
      // single currency prop, which broke once consignments could genuinely
      // differ (e.g. one in CFA, another in Naira).
      const groupCurrency = consignment.raw?.currency || currency;

      // Include group only if it contains active stock items
      if (itemsInStock.length > 0) {
        groups.push({
          consignmentRef: consignment.consignmentRef,
          categoryType: consignment.type,
          currency: groupCurrency,
          items: itemsInStock,
          groupTotalValue: groupTotalValue,
          groupTotalQty: groupTotalQty
        });
      }
    });

    return groups;
  }, [sortedConsignments, getWorkspaceData, currency]);

  // Grand totals split by currency — a single combined number would be
  // meaningless (or actively misleading) once different consignments use
  // different currencies.
  const grandTotalsByCurrency = useMemo(() => {
    const totals = {};
    consignmentStockGroups.forEach(group => {
      if (!totals[group.currency]) {
        totals[group.currency] = { value: 0, qty: 0 };
      }
      totals[group.currency].value += group.groupTotalValue;
      totals[group.currency].qty += group.groupTotalQty;
    });
    return totals;
  }, [consignmentStockGroups]);

  // Handle printing or exporting the inventory matrix as PDF
  const handlePrintReport = () => {
    window.print();
  };

  // Handle exporting the general stock matrix directly into an Excel (.xlsx) file
  const handleExportExcel = () => {
    const excelData = [];

    // Format rows sequentially for the spreadsheet
    consignmentStockGroups.forEach(group => {
      // Add a header row for the Consignment Reference
      excelData.push({
        "Consignment Reference": group.consignmentRef,
        "Category": group.categoryType,
        "Currency": group.currency,
        "Item Description": "",
        "Size Base": "",
        "In-Stock Qty": "",
        "Unit Price": "",
        "Net Stock Value": ""
      });

      // Add individual items under the consignment
      group.items.forEach(item => {
        excelData.push({
          "Consignment Reference": "",
          "Category": "",
          "Currency": "",
          "Item Description": item.item,
          "Size Base": item.stdSize,
          "In-Stock Qty": item.qty,
          "Unit Price": item.unitPrice,
          "Net Stock Value": item.stockValue
        });
      });

      // Add a subtotal row for the consignment
      excelData.push({
        "Consignment Reference": `Subtotal for ${group.consignmentRef}`,
        "Category": "",
        "Currency": group.currency,
        "Item Description": "",
        "Size Base": "",
        "In-Stock Qty": group.groupTotalQty,
        "Unit Price": "",
        "Net Stock Value": group.groupTotalValue
      });

      // Blank spacing row between groups
      excelData.push({});
    });

    // Grand total row per currency — a single combined total across
    // different currencies would misrepresent the actual position.
    Object.entries(grandTotalsByCurrency).forEach(([curr, totals]) => {
      excelData.push({
        "Consignment Reference": `GENERAL TOTAL STOCK VALUE (${curr})`,
        "Category": "",
        "Currency": curr,
        "Item Description": "",
        "Size Base": "",
        "In-Stock Qty": totals.qty,
        "Unit Price": "",
        "Net Stock Value": totals.value
      });
    });

    // Create worksheet and workbook structure
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "General Stock");

    // Trigger file download
    XLSX.writeFile(workbook, `General_Stock_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-850">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" /> General Stock Inventory Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active stock items grouped sequentially by Consignment Reference with individual consignment subtotals.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export to Excel Button */}
            <button 
              onClick={handleExportExcel} 
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-500 text-xs px-3.5 py-2 rounded-xl transition font-bold cursor-pointer shadow-sm"
              title="Download as Excel File"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>

            {/* Print / Export Report Button */}
            <button 
              onClick={handlePrintReport} 
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 text-xs px-3.5 py-2 rounded-xl transition font-bold cursor-pointer shadow-sm"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 p-2 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Grouped Consignment Inventory Records */}
        <div className="p-6 overflow-y-auto grow space-y-6">
          {consignmentStockGroups.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No active stock items available across current registered consignments.
            </div>
          ) : (
            consignmentStockGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-850/40 shadow-sm">
                
                {/* Consignment Reference & Category Header Row */}
                <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Consignment Reference:</span>
                    <span className="text-sm font-bold text-amber-400">{group.consignmentRef}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Category:</span>
                    <span className="text-xs px-2.5 py-1 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">
                      {group.categoryType}
                    </span>
                  </div>
                </div>

                {/* Items Table Underneath Consignment Header */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-medium">Item Description</th>
                        <th className="py-2.5 px-4 font-medium">Size Base</th>
                        <th className="py-2.5 px-4 font-medium">In-Stock Qty</th>
                        <th className="py-2.5 px-4 font-medium">Unit Price ({group.currency})</th>
                        <th className="py-2.5 px-4 font-medium text-right">Net Stock Value ({group.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-mono">
                      {group.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="hover:bg-slate-800/20 text-slate-300">
                          <td className="py-2.5 px-4 font-sans font-bold text-white">{item.item}</td>
                          <td className="py-2.5 px-4 text-slate-400">{item.stdSize}</td>
                          <td className="py-2.5 px-4 font-bold text-emerald-400">{item.qty}</td>
                          <td className="py-2.5 px-4">{group.currency}{item.unitPrice.toLocaleString()}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-white">{group.currency}{item.stockValue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Consignment Subtotal Footer Bar */}
                <div className="bg-slate-900/80 px-4 py-2.5 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs">
                  <span className="text-slate-400 font-medium">
                    Total In-Stock Qty for <strong className="text-amber-400">{group.consignmentRef}</strong>: <strong className="text-emerald-400">{group.groupTotalQty}</strong>
                  </span>
                  <span className="text-slate-400 font-medium">
                    Total Value for <strong className="text-amber-400">{group.consignmentRef}</strong>:
                  </span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {group.currency}{group.groupTotalValue.toLocaleString()}
                  </span>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Modal Footer: Grand Totals, split by currency — combining
            different currencies into one number would be meaningless. */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-4 border-t border-slate-800 bg-slate-850 gap-3">
          <span className="text-xs text-slate-400 font-medium">
            Total Active Consignment Groups Tracked: <strong className="text-white">{consignmentStockGroups.length}</strong>
          </span>
          <div className="text-right space-y-1">
            {Object.entries(grandTotalsByCurrency).map(([curr, totals]) => (
              <div key={curr}>
                <span className="text-xs text-slate-400 mr-2 font-semibold uppercase tracking-wider text-amber-500">
                  Total Stock Value ({curr}):
                </span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {curr}{totals.value.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 ml-2">({totals.qty} units)</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}