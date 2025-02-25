const db = require('../config/db');

const logAuditHistory = async (auditId, action, userId) => {
  try {
    await db.execute(
      `INSERT INTO AuditHistory (audit_id, action, user_id, timestamp) VALUES (?, ?, ?, NOW())`,
      [auditId, action, userId]
    );
  } catch (error) {
    console.error("Error logging audit history:", error);
  }
};

module.exports = { logAuditHistory };