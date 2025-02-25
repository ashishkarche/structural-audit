const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const auditController = require('../controllers/auditController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/submit-audit", authenticate, auditController.submitAudit);
router.get("/:auditId/drawings", authenticate, auditController.getDrawings);
router.get("/:id", authenticate, auditController.getAuditDetails);
router.put("/:id", authenticate, auditController.updateAudit);
router.delete("/:id", authenticate, auditController.deleteAudit);

module.exports = router;