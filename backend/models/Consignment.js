import mongoose from 'mongoose';

const ConsignmentSchema = new mongoose.Schema({
  consignment_ref: { type: String, required: true, unique: true },
  arrival_date: { type: Date, required: true },
  description: String,

  cost_pool: {
    purchase_price: { type: Number, required: true, default: 0 },
    shipping_freight: { type: Number, required: true, default: 0 },
    port_clearing: { type: Number, required: true, default: 0 },
    transport: { type: Number, required: true, default: 0 },
    total_consignment_cost: { type: Number, required: true, default: 0 }
  },

  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ConsignmentSchema.pre('save', function(next) {
  const cp = this.cost_pool;
  cp.total_consignment_cost = cp.purchase_price + cp.shipping_freight + cp.port_clearing + cp.transport;
  next();
});

export default mongoose.model('Consignment', ConsignmentSchema);
