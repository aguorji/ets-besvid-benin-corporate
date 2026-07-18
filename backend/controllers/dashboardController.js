// backend/controllers/dashboardController.js
import Sale from '../models/Sale.js';
import Expense from '../models/Expense.js';
import Byproduct from '../models/Byproduct.js';
import Consignment from '../models/Consignment.js';

// @desc     Compile All Core Business Metrics for Main Office Analytics
// @route    GET /api/dashboard/summary
// @access   Private
export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Aggregate Sales Revenue & Receivables Balance
    const salesMetrics = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalSalesRevenue: { $sum: '$revenue' },
          totalOutstandingDebt: { $sum: '$balance' },
          totalCollectedCash: { $sum: '$amount_paid' }
        }
      }
    ]);

    // 2. Aggregate Operational Expenses
    const expenseMetrics = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    // 3. Aggregate Byproduct Reclamation Cash Flows
    const byproductMetrics = await Byproduct.aggregate([
      {
        $group: {
          _id: null,
          totalByproductRevenue: { $sum: '$revenue' }
        }
      }
    ]);

    // 4. Aggregate Capital Expenditures locked in Consignments
    const consignmentMetrics = await Consignment.aggregate([
      {
        $group: {
          _id: null,
          totalConsignmentCost: { $sum: '$total_landing_cost' } // 👈 FIX: Direct root path reference
        }
      }
    ]);

    // Extract values safely, defaulting to 0 if no records exist yet
    const sales = salesMetrics[0] || { totalSalesRevenue: 0, totalOutstandingDebt: 0, totalCollectedCash: 0 };
    const expenses = expenseMetrics[0] || { totalExpenses: 0 };
    const byproducts = byproductMetrics[0] || { totalByproductRevenue: 0 };
    const consignments = consignmentMetrics[0] || { totalConsignmentCost: 0 };

    // Calculate Overall Corporate Performance Variables
    const totalGrossInflow = sales.totalSalesRevenue + byproducts.totalByproductRevenue;
    const totalOutflow = expenses.totalExpenses + consignments.totalConsignmentCost;

    // Net profit calculation based on physical collected cash vs total outlays
    const netCashPosition = sales.totalCollectedCash + byproducts.totalByproductRevenue - expenses.totalExpenses;

    res.status(200).json({
      summary: {
        revenue: {
          wholesale_sales: sales.totalSalesRevenue,
          byproduct_sales: byproducts.totalByproductRevenue,
          total_gross: totalGrossInflow
        },
        financial_health: {
          capital_invested_shipments: consignments.totalConsignmentCost,
          operational_overhead: expenses.totalExpenses,
          total_outflow: totalOutflow,
          accounts_receivable_debt: sales.totalOutstandingDebt,
          collected_cash: sales.totalCollectedCash,
          net_cash_position: netCashPosition
        }
      }
    });
  } catch (error) {
    console.error("Dashboard compilation crash:", error.message); // Helpful for logging errors in dev
    res.status(500).json({ error: "Failed to compile financial dashboard metrics." });
  }
};