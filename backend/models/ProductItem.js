import mongoose from 'mongoose';

// Define the schema for individual production batches or stock variations tied to a product
const VariationSchema = new mongoose.Schema({
  production_ref: { type: String, required: true, index: { unique: true, sparse: true } },
  consignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consignment', required: true },

  actual_size: { type: Number, required: true },
  size_type: { type: String, enum: ['standard', 'adjusted'], required: true },

  quantity_produced: { type: Number, required: true, default: 0 },
  quantity_sold: { type: Number, default: 0 },
  quantity_balance: { type: Number, default: 0 },

  base_price: { type: Number, required: true },
  adj_price: { type: Number, required: true },
  stock_value: { type: Number, default: 0 }
});

// Define the master product schema for the catalog registry
const ProductItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, uppercase: true, trim: true },
  description: { type: String, required: true, trim: true },
  unit: { type: String, enum: ['KGS', 'PCS'], default: 'KGS' },
  standardSize: { type: Number, required: true },
  
  // Master baseline price for a standard bale/unit
  basePrice: { type: Number, required: true, default: 0 }, 

  stock_variations: [VariationSchema]
}, { 
  timestamps: true, 
  collection: 'productitems' // Explicitly maps this model to the 'products' MongoDB collection to align with manually populated records
});

// Middleware to automatically recalculate stock balances and total values before saving any product document
ProductItemSchema.pre('save', function(next) {
  this.stock_variations.forEach(v => {
    v.quantity_balance = v.quantity_produced - v.quantity_sold;
    v.stock_value = v.quantity_balance * v.adj_price;
  });
  next();
});

export default mongoose.model('ProductItem', ProductItemSchema);