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
  
  // Consignment Category Type
  type: { 
    type: String, 
    required: true, 
    default: 'Giant Bales' 
  },

  // Root-level landing cost field
  total_landing_cost: { type: Number, default: 0 },

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
  },

  // 5. PRODUCTION ITEMS
  // This field did not exist before, so Mongoose's strict mode was silently
  // dropping it on every save (see POST / and PUT /:id/production in
  // consignmentRoutes.js, and GET /reconciliation/:id which reads it back).
  // Field names match syncProductionToProducts() in consignmentRoutes.js
  // exactly, since that's the live code path that consumes them.
  production_items: [{
    itemCode: { type: String, uppercase: true, trim: true },
    description: String,
    unit: String,
    standardSize: Number,
    actualSize: Number,
    priceStd: Number,
    adjustedPrice: Number,
    balesQuantity: Number
  }]
}, { timestamps: true });

export default mongoose.model('Consignment', ConsignmentSchema);