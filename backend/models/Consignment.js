import mongoose from 'mongoose';

const ConsignmentSchema = new mongoose.Schema({
  consignment_ref: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true // e.g., "EB-2026-07"
  },
  arrival_date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
  
  // ADDED: Consignment Category Type
  type: { 
    type: String, 
    required: true, 
    default: 'Giant Bales' 
  },

  // 1. FINANCIAL COST POOL (Capital Outlays)
  cost_pool: {
    base_purchase_cost: { type: Number, default: 0 },
    sea_freight: { type: Number, default: 0 },
    port_clearing_fees: { type: Number, default: 0 },
    terminal_handling: { type: Number, default: 0 },
    inbound_remnant_value_injected: { type: Number, default: 0 } 
  },

  // 2. OPERATIONAL EXPENSES
  operating_expenses: [{
    description: String,
    amount: Number,
    date: { type: Date, default: Date.now }
  }],

  // 3. BY-PRODUCT REVENUE MATRIX
  by_products_sales: [{
    description: String,
    quantity: Number,
    unit: String,
    amount_earned: Number,
    date: { type: Date, default: Date.now }
  }],

  // 4. CLOSING ACCOUNTABILITY
  closing_remnants: {
    estimated_mass_kg: { type: Number, default: 0 },
    assigned_financial_value: { type: Number, default: 0 },
    transferred_to_consignment_ref: { type: String, default: '' } 
  }
}, { timestamps: true });

export default mongoose.model('Consignment', ConsignmentSchema);