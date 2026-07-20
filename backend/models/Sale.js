// backend/models/Sale.js
import mongoose from 'mongoose';

const SaleItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductItem', required: true },
  production_ref: { type: String, required: true },
  consignment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consignment', required: true },
  
  is_adjusted_bale: { type: Boolean, default: false }, // 👈 Tracks if this line is the remnant bale
  actual_size: { type: Number, required: true },       // Exact weight (e.g., 55kg or custom)
  quantity_sold: { type: Number, required: true, default: 1 },
  set_price: { type: Number, required: true },         // Baseline target price
  selling_price: { type: Number, required: true },     // Override negotiated price
  
  revenue: { type: Number, required: true, default: 0 },
  variance: { type: Number, required: true, default: 0 },
  performance: { type: String, enum: ['Above Target', 'On Target', 'Below Target'] }
});

const SaleSchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  
  // 👈 Upgraded to a structured array so one invoice can contain multiple items
  items: [SaleItemSchema], 

  gross_revenue: { type: Number, required: true, default: 0 },
  payment_type: { type: String, enum: ['Cash', 'Part Payment', 'Credit'], required: true },
  amount_paid: { type: Number, required: true, default: 0 },
  balance: { type: Number, required: true, default: 0 },
  debt_status: { type: String, enum: ['N/A', 'Owing', 'Settled'], default: 'N/A' },
  
  // 🛡️ Admin Audit Anchor
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// --- AUTOMATED ACCOUNTING ENGINE ---
SaleSchema.pre('save', function(next) {
  let computedGross = 0;

  // 1. Calculate the financial metrics individually for each item row
  this.items.forEach(item => {
    item.revenue = item.quantity_sold * item.selling_price;
    item.variance = (item.selling_price - item.set_price) * item.quantity_sold;

    if (item.variance > 0) item.performance = 'Above Target';
    else if (item.variance === 0) item.performance = 'On Target';
    else item.performance = 'Below Target';

    computedGross += item.revenue;
  });

  this.gross_revenue = computedGross;

  // 2. Evaluate overall invoice cash flows and balance positions
  if (this.payment_type === 'Cash') {
    this.amount_paid = this.gross_revenue;
    this.balance = 0;
    this.debt_status = 'N/A';
  } else {
    this.balance = this.gross_revenue - this.amount_paid;
    this.debt_status = this.balance > 0 ? 'Owing' : 'Settled';
  }
  next();
});

export default mongoose.model('Sale', SaleSchema);