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
  
  // 1. FINANCIAL COST POOL (Capital Outlays)
  cost_pool: {
    base_purchase_cost: { type: Number, default: 0 },
    sea_freight: { type: Number, default: 0 },
    port_clearing_fees: { type: Number, default: 0 },
    terminal_handling: { type: Number, default: 0 },
    // Rolled over from the previous consignment's left-overs
    inbound_remnant_value_injected: { type: Number, default: 0 } 
  },

  // 2. OPERATIONAL EXPENSES (Running costs incurred during warehouse cycle)
  operating_expenses: [{
    description: String, // e.g., "Generator Diesel", "Offloading Labor"
    amount: Number,
    date: { type: Date, default: Date.now }
  }],

  // 3. BY-PRODUCT REVENUE MATRIX
  by_products_sales: [{
    description: String, // e.g., "Rags / Industrial Waste Scrap"
    quantity: Number,
    unit: String, // e.g., "KGS", "BAGS"
    amount_earned: Number,
    date: { type: Date, default: Date.now }
  }],

  // 4. CLOSING ACCOUNTABILITY (For when the batch is fully cleared)
  closing_remnants: {
    estimated_mass_kg: { type: Number, default: 0 },
    assigned_financial_value: { type: Number, default: 0 }, // Carries forward to next batch
    transferred_to_consignment_ref: { type: String, default: '' } 
  }
}, { timestamps: true });

export default mongoose.model('Consignment', ConsignmentSchema);