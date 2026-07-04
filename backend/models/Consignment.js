const mongoose = require('mongoose');

const ConsignmentSchema = new mongoose.Schema({
  consignment_ref: { type: String, required: true, unique: true }, // e.g., "CON-2026-001"
  arrival_date: { type: Date, required: true },
  description: String,
  
  // Cost Pool (All fields explicitly in CFA)
  cost_pool: {
    purchase_price_cfa: { type: Number, required: true, default: 0 },
    shipping_freight_cfa: { type: Number, required: true, default: 0 },
    port_clearing_cfa: { type: Number, required: true, default: 0 },
    transport_cfa: { type: Number, required: true, default: 0 },
    total_consignment_cost: { type: Number, required: true, default: 0 }
  },
  
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Automatically calculate the full cost pool total before storing
ConsignmentSchema.pre('save', function(next) {
  const cp = this.cost_pool;
  cp.total_consignment_cost = cp.purchase_price_cfa + cp.shipping_freight_cfa + cp.port_clearing_cfa + cp.transport_cfa;
  next();
});

module.exports = mongoose.model('Consignment', ConsignmentSchema);