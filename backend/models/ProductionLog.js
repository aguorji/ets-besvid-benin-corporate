import mongoose from 'mongoose';

const ProductionLogSchema = new mongoose.Schema({
  consignment_ref: { 
    type: String, 
    required: true, 
    trim: true // Link directly to the batch (e.g., "EB-2026-07")
  },
  processing_date: { type: Date, default: Date.now },
  
  // 1. WHAT WENT IN (The Giant Bales broken down)
  input_giant_bales: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    itemCode: { type: String, required: true }, // e.g., "G-LMD"
    bales_deducted: { type: Number, required: true }
  }],

  // 2. WHAT CAME OUT (Standard wholesale items ready for retail sale)
  sorted_bales_produced: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    itemCode: { type: String, required: true }, // e.g., "LMD", "MCSH"
    bales_added: { type: Number, required: true },
    total_weight_yielded: { type: Number, default: 0 } // Optional crosscheck metric
  }],

  // 3. BY-PRODUCTS / SCRAP GENERATED
  by_products_yielded: [{
    description: { type: String, required: true }, // e.g., "Industrial Cleaning Rags", "Scrap Mix"
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'KGS' } // KGS, Bags, Pcs
  }],

  // 4. REMNANTS CARRIED FORWARD
  remnants_retained: {
    weight_kg: { type: Number, default: 0 },
    estimated_financial_value: { type: Number, default: 0 } // Value to inject into the next consignment
  }
}, { timestamps: true });

export default mongoose.model('ProductionLog', ProductionLogSchema);