const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductItem', required: true },
  production_ref: { type: String, required: true }, // Points to the exact production batch variant size
  consignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consignment', required: true },
  
  actual_size: { type: Number, required: true },
  quantity_sold: { type: Number, required: true, default: 1 },
  set_price_cfa: { type: Number, required: true },      // Targeted baseline price
  selling_price_cfa: { type: Number, required: true },  // Actual realized deal price
  
  revenue_cfa: { type: Number, required: true },  // quantity_sold * selling_price_cfa
  variance_cfa: { type: Number, required: true }, // (selling_price_cfa - set_price_cfa) * quantity_sold
  performance: { type: String, enum: ['Above Target', 'On Target', 'Below Target'] },
  
  customer_name: { type: String, required: true },
  payment_type: { type: String, enum: ['Cash', 'Part Payment', 'Credit'], required: true },
  amount_paid_cfa: { type: Number, required: true, default: 0 },
  balance_cfa: { type: Number, required: true, default: 0 },
  
  debt_status: { type: String, enum: ['N/A', 'Owing', 'Settled'], default: 'N/A' },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Pre-save validations for automatic sales financial modeling
SaleSchema.pre('save', function(next) {
  this.revenue_cfa = this.quantity_sold * this.selling_price_cfa;
  this.variance_cfa = (this.selling_price_cfa - this.set_price_cfa) * this.quantity_sold;
  
  if (this.variance_cfa > 0) this.performance = 'Above Target';
  else if (this.variance_cfa === 0) this.performance = 'On Target';
  else this.performance = 'Below Target';
  
  // Enforce payment ledger workflows
  if (this.payment_type === 'Cash') {
    this.amount_paid_cfa = this.revenue_cfa;
    this.balance_cfa = 0;
    this.debt_status = 'N/A';
  } else {
    this.balance_cfa = this.revenue_cfa - this.amount_paid_cfa;
    this.debt_status = this.balance_cfa > 0 ? 'Owing' : 'Settled';
  }
  next();
});

module.exports = mongoose.model('Sale', SaleSchema);