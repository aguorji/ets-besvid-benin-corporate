const mongoose = require('mongoose');

const VariationSchema = new mongoose.Schema({
  production_ref: { type: String, required: true, unique: true }, // Auto-generated: e.g., PMM4501
  consignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consignment', required: true },
  
  actual_size: { type: Number, required: true }, // Measured weight in KGS
  size_type: { type: String, enum: ['standard', 'adjusted'], required: true },
  
  quantity_produced: { type: Number, required: true, default: 0 },
  quantity_sold: { type: Number, default: 0 },
  quantity_balance: { type: Number, default: 0 }, // Auto-calculated (Produced - Sold)
  
  base_price_cfa: { type: Number, required: true }, // Linear scaled price based on weight
  adj_price_cfa: { type: Number, required: true },  // Final overridden price matrix value
  stock_value_cfa: { type: Number, default: 0 }     // Auto-calculated: quantity_balance * adj_price_cfa
});

const ProductItemSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Premium Men's Mix Bales"
  initials: { type: String, required: true, uppercase: true }, // e.g., "PMM"
  unit: { type: String, enum: ['KGS', 'PCS'], default: 'KGS' },
  standard_size: { type: Number, required: true }, // Standard weight blueprint (e.g., 45)
  
  // This empty array dynamically holds actual physical batches produced across all consignments
  stock_variations: [VariationSchema]
}, { timestamps: true });

// Automatically compute balance calculations and inventory financial assets value
ProductItemSchema.pre('save', function(next) {
  this.stock_variations.forEach(v => {
    v.quantity_balance = v.quantity_produced - v.quantity_sold;
    v.stock_value_cfa = v.quantity_balance * v.adj_price_cfa;
  });
  next();
});

module.exports = mongoose.model('ProductItem', ProductItemSchema);