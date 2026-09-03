// backend/controllers/auditLogController.js
import AuditLog from '../models/AuditLog.js';

// @desc    Fetch recent audit log entries, most recent first
// @route   GET /api/audit-logs
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ created_at: -1 }).limit(500).lean();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
  }
};
