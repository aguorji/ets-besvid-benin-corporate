import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  operator_name: { type: String, default: 'System' },
  action_module: { type: String, required: true },
  details: { type: String, default: '' },
  value_impact: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('AuditLog', AuditLogSchema);
