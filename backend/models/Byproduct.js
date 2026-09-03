import mongoose from 'mongoose';

const ByproductSchema = new mongoose.Schema({
  // Same gap as Expense.js — this link never existed, so byproduct sales
  // could never be correctly attributed back to their consignment.
  consignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consignment',
    required: true
  },
  date: { type: Date, default: Date.now },
  type: { type: String, required: true, default: 'Rags' },
  sub_type: String,
  quantity: { type: Number, required: true, min: 0 },
  price_per_unit: { type: Number, required: true, min: 0 },
  revenue: { type: Number, default: 0 },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ByproductSchema.pre('save', function(next) {
  this.revenue = this.quantity * this.price_per_unit;
  next();
});

export default mongoose.model('Byproduct', ByproductSchema);
