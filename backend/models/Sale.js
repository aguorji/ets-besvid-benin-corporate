const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductItem', required: true },
  production_ref: { type: String, required: true },
  consignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consignment', required: true },
  
  actual_size: { type: Number, required: true },
  quantity_sold: { type: Number, required: true, default: 1 },
  set_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  
  revenue: { type: Number, required: true },
  variance: { type: Number, required: true },
  performance: { type: String, enum: ['Above Target', 'On Target', 'Below Target'] },
  
  customer_name: { type: String, required: true },
  payment_type: { type: String, enum: ['Cash', 'Part Payment', 'Credit'], required: true },
  amount_paid: { type: Number, required: true, default: 0 },
  balance: { type: Number, required: true, default: 0 },
  
  debt_status: { type: String, enum: ['N/A', 'Owing', 'Settled'], default: 'N/A' },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

SaleSchema.pre('save', function(next) {
  this.revenue = this.quantity_sold * this.selling_price;
  this.variance = (this.selling_price - this.set_price) * this.quantity_sold;
  
  if (this.variance > 0) this.performance = 'Above Target';
  else if (this.variance === 0) this.performance = 'On Target';
  else this.performance = 'Below Target';
  
  if (this.payment_type === 'Cash') {
    this.amount_paid = this.revenue;
    this.balance = 0;
    this.debt_status = 'N/A';
  } else {
    this.balance = this.revenue - this.amount_paid;
    this.debt_status = this.balance > 0 ? 'Owing' : 'Settled';
  }
  next();
});

module.exports = mongoose.model('Sale', SaleSchema);