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
    total_raw_weight: { type: Number, default: 0 }, // Used if giant_bale
    bales_produced: { type: Number, default: 0 },   // Total count of standard bales packed
    byproducts_kgs: { type: Number, default: 0 }    // Total weight of loose residue sold in sacks
  }
}, { timestamps: true });

export default mongoose.model('Consignment', ConsignmentSchema);
