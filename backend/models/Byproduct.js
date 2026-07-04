const mongoose = require('mongoose');

const ByproductSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, required: true, default: 'Rags' }, // e.g., Cotton Rags, Metal Straps
  sub_type: String,
  quantity: { type: Number, required: true, min: 0 },
  price_per_unit_cfa: { type: Number, required: true, min: 0 },
  revenue_cfa: { type: Number, default: 0 }, // Auto-calculated (Quantity * Price)
  
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Auto-calculate byproduct value before database injection
ByproductSchema.pre('save', function(next) {
  this.revenue_cfa = this.quantity * this.price_per_unit_cfa;
  next();
});

module.exports = mongoose.model('Byproduct', ByproductSchema);