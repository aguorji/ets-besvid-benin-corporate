import mongoose from 'mongoose';

const ConsignmentSchema = new mongoose.Schema({
  consignment_ref: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['direct_container', 'giant_bale'], required: true },
  status: { type: String, enum: ['ordered', 'arrived', 'processing', 'completed'], default: 'arrived' },
  arrival_date: { type: Date, default: Date.now },
  
  // Financial metrics for calculating precise landed cost distribution later
  total_landing_cost: { type: Number, required: true, default: 0 },
  notes: { type: String, trim: true },

  // Tracking sorted structural output metrics
  processing_run: {
    total_raw_weight: { type: Number, default: 0 }, 
    
    // Track bales grouped by their physical size/weight
    sorted_items: [
      {
        product_ref: { type: String, required: true, uppercase: true, trim: true }, // e.g., 'LMD'
        target_weight_g_bale: { type: Number, required: true, default: 55 },      // Standard weight (e.g., 55 kg)
        actual_weight_g_bale: { type: Number, required: true, default: 55 },      // Actual weight of this group (e.g., 50 kg)
        bales_produced: { type: Number, required: true, default: 0 }              // Quantity of bales at this specific weight (e.g., 1 bale)
      }
    ],
    
    // Dynamic Byproducts Sacked
    byproducts_sacked: [
      {
        byproduct_type: { type: String, required: true, uppercase: true, trim: true }, 
        weight_kg: { type: Number, required: true, default: 0 },
        price_per_kg: { type: Number, default: 0 } 
      }
    ]
  }
}, { timestamps: true });

export default mongoose.model('Consignment', ConsignmentSchema);