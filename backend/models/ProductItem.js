import mongoose from 'mongoose';

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

const ProductItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: true, uppercase: true, trim: true },
  description: { type: String, required: true, trim: true },
  unit: { type: String, enum: ['KGS', 'PCS'], default: 'KGS' },
  standardSize: { type: Number, required: true },

  stock_variations: [VariationSchema]
}, { timestamps: true });

ProductItemSchema.pre('save', function(next) {
  this.stock_variations.forEach(v => {
    v.quantity_balance = v.quantity_produced - v.quantity_sold;
    v.stock_value = v.quantity_balance * v.adj_price;
  });
  next();
});

export default mongoose.model('ProductItem', ProductItemSchema);
