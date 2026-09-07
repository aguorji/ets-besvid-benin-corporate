import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  // operator_id is the real reference — enables querying "everything this
  // specific user did" or looking up their full account later, which a
  // plain name string can never support (e.g. if their display name
  // changes). operator_name stays too, since it's what actually renders in
  // AuditLogs.jsx and is cheaper than a populate() on every log view.
  // Nullable because some events (e.g. an automated catalog-conflict flag)
  // are genuinely system-generated, not tied to a logged-in user.
  operator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  operator_name: { type: String, default: 'System' },
  action_module: { type: String, required: true },
  details: { type: String, default: '' },
  value_impact: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('AuditLog', AuditLogSchema);