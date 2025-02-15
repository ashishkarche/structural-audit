// server/index.js
const express = require('express');
const mysql = require('mysql2/promise'); 
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

// Database connection (using Pool for better efficiency)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { ca: fs.readFileSync(__dirname + '/isrgrootx1.pem') },
  connectionLimit: 10,
});

// Multer setup using in-memory storage for Vercel deployments
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware for authentication with token expiration handling
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });
    
    // Verify token. If expired, jwt.verify will throw a TokenExpiredError.
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Auto logout if token expired
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    res.status(400).json({ message: "Invalid Token" });
  }
};

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

const createNotification = async (userId, message, type = "info") => {
  try {
    await db.execute(
      `INSERT INTO Notifications (user_id, message, type) VALUES (?, ?, ?)`,
      [userId, message, type]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

app.get("/", (req, res) => {
  res.json("Success");
});

// ------------------------------
// Auditor Endpoints
// ------------------------------

// Register auditor
app.post('/register', async (req, res) => {
  try {
    const { name, qualification, specialization, firmName, generalExperience, specializedExperience, employmentPeriod, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO Auditors (name, qualification, specialization, firm_name, general_experience, specialized_experience, employment_period, email, password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.execute(sql, [name, qualification, specialization, firmName, generalExperience, specializedExperience, employmentPeriod, email, hashedPassword]);
    res.status(201).json({ message: 'Auditor registered successfully' });
  } catch (error) {
    console.error('Error registering:', error);
    res.status(500).json({ message: 'Failed to register auditor' });
  }
});

// Login endpoint (generates token with expiration)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute(`SELECT * FROM Auditors WHERE email = ?`, [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    // Token expires in 1 hour
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to log in' });
  }
});

// Get auditor profile
app.get('/api/auditors/me', authenticate, async (req, res) => {
  try {
    const [result] = await db.execute(
      `SELECT name, qualification, specialization, firm_name, general_experience, specialized_experience, employment_period, email FROM Auditors WHERE id = ?`,
      [req.user.id]
    );
    if (result.length === 0) return res.status(404).json({ message: "Auditor not found" });
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Update auditor profile
app.put('/api/auditors/me', authenticate, async (req, res) => {
  try {
    let { name, qualification, specialization, firm_name, general_experience, specialized_experience, employment_period, email } = req.body;
    // Set default values if missing
    name = name || "";
    qualification = qualification || "";
    specialization = specialization || "";
    firm_name = firm_name || "";
    general_experience = general_experience || 0;
    specialized_experience = specialized_experience || 0;
    employment_period = employment_period || 0;
    email = email || "";
    const sql = `UPDATE Auditors SET name = ?, qualification = ?, specialization = ?, firm_name = ?, general_experience = ?, specialized_experience = ?, employment_period = ?, email = ? WHERE id = ?`;
    const [result] = await db.execute(sql, [name, qualification, specialization, firm_name, general_experience, specialized_experience, employment_period, email, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Profile not found or not updated" });
    }
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});


// Fetch audit statistics
app.get('/api/audits/stats', authenticate, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT COUNT(*) AS totalAudits,
             SUM(CASE WHEN status = 'In-Progress' THEN 1 ELSE 0 END) AS inProgress,
             SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
      FROM Audits WHERE auditor_id = ?`, [req.user.id]);
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ message: 'Failed to fetch audit stats' });
  }
});

// Fetch recent audits
app.get('/api/audits/recent', authenticate, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT id, name, location, date_of_audit, COALESCE(status, 'In-Progress') AS status 
      FROM Audits WHERE auditor_id = ? ORDER BY date_of_audit DESC LIMIT 5`, [req.user.id]);
    res.json(results);
  } catch (error) {
    console.error('Error fetching recent audits:', error);
    res.status(500).json({ message: 'Failed to fetch recent audits' });
  }
});

// ------------------------------
// Audit Endpoints
// ------------------------------

// Submit audit report
app.post('/submit-audit', authenticate, upload.fields([{ name: 'architecturalDrawing' }, { name: 'structuralDrawing' }]), async (req, res) => {
  try {
    const { id } = req.params;

    const { name, location, yearOfConstruction, dateOfAudit, area, use, structuralChanges, distressYear, distressNature, previousReports } = req.body;
    // For files using memoryStorage, you can store the file as base64 (if needed) or process it further.
    // Here, we'll simply store the original filename (or you may choose to store the buffer as needed).
    const architecturalDrawing = req.files['architecturalDrawing'] ? req.files['architecturalDrawing'][0].originalname : null;
    const structuralDrawing = req.files['structuralDrawing'] ? req.files['structuralDrawing'][0].originalname : null;
    const formatDate = (date) => (date ? new Date(date).toISOString().split('T')[0] : null);
    const formattedDate = formatDate(dateOfAudit);
    const formattedDistressYear = distressYear ? parseInt(distressYear, 10) : null;
    if (!formattedDate) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }
    const sql = `INSERT INTO Audits (auditor_id, name, location, year_of_construction, date_of_audit, area, usage_type, structural_changes, distress_year, distress_nature, previous_reports, architectural_drawing, structural_drawing) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [req.user.id, name, location, yearOfConstruction, formattedDate, area, use, structuralChanges, formattedDistressYear, distressNature, previousReports, architecturalDrawing, structuralDrawing]);
    await logAuditHistory(id, "Audit submitted", req.user.id);
    // 🔥 Log a notification
    await createNotification(req.user.id, "A new audit has been submitted.", "success");

    res.json({ message: 'Audit submitted successfully', auditId: result.insertId });
  } catch (error) {
    console.error('Error submitting audit:', error);
    res.status(500).json({ message: 'Failed to submit audit' });
  }
});

// Get audit details
app.get('/api/audits/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM Audits WHERE id = ? AND auditor_id = ?`;
    const [result] = await db.execute(sql, [id, req.user.id]);
    if (result.length === 0) {
      return res.status(404).json({ message: "Audit not found" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching audit details:", error);
    res.status(500).json({ message: "Failed to fetch audit details" });
  }
});

// Full Audit Details Endpoint (includes sub-tables)
app.get('/api/audits/:auditId/full', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const [auditResult] = await db.execute(`SELECT * FROM Audits WHERE id = ? AND auditor_id = ?`, [auditId, req.user.id]);
    if (auditResult.length === 0) {
      return res.status(404).json({ message: "Audit not found" });
    }
    const audit = auditResult[0];
    const [structuralChanges] = await db.execute(`SELECT * FROM StructuralChanges WHERE audit_id = ?`, [auditId]);
    const [observations] = await db.execute(`SELECT * FROM Observations WHERE audit_id = ?`, [auditId]);
    const [immediateConcerns] = await db.execute(`SELECT * FROM ImmediateConcerns WHERE audit_id = ?`, [auditId]);
    const [ndtTests] = await db.execute(`SELECT * FROM NDTTests WHERE audit_id = ?`, [auditId]);
    res.json({
      audit,
      structuralChanges,
      observations,
      immediateConcerns,
      ndtTests,
    });
  } catch (error) {
    console.error("Error fetching full audit details:", error);
    res.status(500).json({ message: "Failed to fetch full audit details" });
  }
});

// Update audit
app.put('/api/audits/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, date_of_audit, structural_changes, status } = req.body;
    const sql = `UPDATE Audits SET name = ?, location = ?, date_of_audit = ?, structural_changes = ?, status = ? WHERE id = ? AND auditor_id = ?`;
    await db.execute(sql, [name, location, date_of_audit, structural_changes, status, id, req.user.id]);
    await logAuditHistory(id, "Audit Updated.", req.user.id);
    await createNotification(req.user.id,`Audit "${name}" has been updated.`, "success");
    res.json({ message: "Audit updated successfully" });
  } catch (error) {
    console.error("Error updating audit:", error);
    res.status(500).json({ message: "Failed to update audit" });
  }
});

// Delete audit
app.delete('/api/audits/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM Audits WHERE id = ? AND auditor_id = ?`;
    const [result] = await db.execute(sql, [id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Audit not found or unauthorized" });
    }
    await logAuditHistory(id, "Audit Deleted", req.user.id);
    await createNotification(req.user.id, "An audit has been deleted.", "warning");
    res.json({ message: "Audit deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit:", error);
    res.status(500).json({ message: "Failed to delete audit" });
  }
});


// ------------------------------
// Sub-Table Endpoints (using audit_id)
// ------------------------------

// Structural Changes Submission
app.post("/api/structural-changes/:auditId", authenticate, upload.single("previousInvestigations"), async (req, res) => {
  try {
    const { auditId } = req.params;
    const { dateOfChange, changeDetails, repairYear, repairType, repairEfficacy, repairCost } = req.body;
    // For memoryStorage, file is in req.file.buffer; here, for simplicity, we'll store the original filename.
    const previousInvestigations = req.file ? req.file.originalname : null;
    const sql = `INSERT INTO StructuralChanges (audit_id, date_of_change, change_details, previous_investigations, repair_year, repair_type, repair_efficacy, repair_cost) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.execute(sql, [auditId, dateOfChange, changeDetails, previousInvestigations, repairYear, repairType, repairEfficacy, repairCost]);
    await logAuditHistory(auditId, "Structural changes submitted", req.user.id);
    res.json({ message: "Structural changes submitted successfully" });
  } catch (error) {
    console.error("Error submitting structural changes:", error);
    res.status(500).json({ message: "Failed to submit structural changes" });
  }
});

// Fetch Audit History
app.get('/api/audits/:auditId/history', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const [history] = await db.execute(
      `SELECT * FROM AuditHistory WHERE audit_id = ? ORDER BY timestamp DESC`,
      [auditId]
    );
    res.json(history);
  } catch (error) {
    console.error("Error fetching audit history:", error);
    res.status(500).json({ message: "Failed to fetch audit history" });
  }
});

// Insert into Audit History


app.post("/api/observations/:auditId", authenticate, upload.single("damagePhoto"), async (req, res) => {
  try {
    const { auditId } = req.params;
    let {
      unexpectedLoad, unapprovedChanges, additionalFloor, vegetationGrowth, leakage,
      cracksBeams, cracksColumns, cracksFlooring, floorSagging, bulgingWalls,
      windowProblems, heavingFloor, concreteTexture, algaeGrowth, damageClassification
    } = req.body;

    // Convert boolean values to 0 or 1
    unexpectedLoad = unexpectedLoad === "true" || unexpectedLoad === true ? 1 : 0;
    unapprovedChanges = unapprovedChanges === "true" || unapprovedChanges === true ? 1 : 0;
    additionalFloor = additionalFloor === "true" || additionalFloor === true ? 1 : 0;
    vegetationGrowth = vegetationGrowth === "true" || vegetationGrowth === true ? 1 : 0;
    leakage = leakage === "true" || leakage === true ? 1 : 0;
    cracksBeams = cracksBeams === "true" || cracksBeams === true ? 1 : 0;
    cracksColumns = cracksColumns === "true" || cracksColumns === true ? 1 : 0;
    cracksFlooring = cracksFlooring === "true" || cracksFlooring === true ? 1 : 0;
    floorSagging = floorSagging === "true" || floorSagging === true ? 1 : 0;
    bulgingWalls = bulgingWalls === "true" || bulgingWalls === true ? 1 : 0;
    windowProblems = windowProblems === "true" || windowProblems === true ? 1 : 0;
    heavingFloor = heavingFloor === "true" || heavingFloor === true ? 1 : 0;
    algaeGrowth = algaeGrowth === "true" || algaeGrowth === true ? 1 : 0;

    // Handle file upload
    const damagePhoto = req.file ? req.file.originalname : null;

    // Insert into the database
    const sql = `
      INSERT INTO Observations (
        audit_id, unexpected_load, unapproved_changes, additional_floor,
        vegetation_growth, leakage, cracks_beams, cracks_columns, cracks_flooring,
        floor_sagging, bulging_walls, window_problems, heaving_floor, concrete_texture,
        algae_growth, damage_classification, damage_photo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      auditId, unexpectedLoad, unapprovedChanges, additionalFloor,
      vegetationGrowth, leakage, cracksBeams, cracksColumns, cracksFlooring,
      floorSagging, bulgingWalls, windowProblems, heavingFloor, concreteTexture,
      algaeGrowth, damageClassification, damagePhoto
    ]);

    await logAuditHistory(auditId, "Observations submitted", req.user.id);

    res.json({ message: "Observations submitted successfully" });
  } catch (error) {
    console.error("Error submitting observations:", error);
    res.status(500).json({ message: "Failed to submit observations" });
  }
});


app.post("/api/ndt/:auditId", authenticate, upload.single("ndtPhoto"), async (req, res) => {
  try {
    const { auditId } = req.params;
    const { 
      reboundHammerTest, reboundGrading, ultrasonicTest, ultrasonicGrading, 
      coreSamplingTest, carbonationTest, chlorideTest, sulfateTest, 
      halfCellPotentialTest, concreteCoverRequired, concreteCoverMeasured, 
      rebarDiameterReduction, crushingStrength 
    } = req.body;

    const ndtPhoto = req.file ? req.file.originalname : null;

    // Fix: Ensure `ndtPhoto` is only included when it's uploaded
    const sql = `INSERT INTO NDTTests (
                    audit_id, rebound_hammer_test, rebound_grading, ultrasonic_test, ultrasonic_grading, 
                    core_sampling_test, carbonation_test, chloride_test, sulfate_test, 
                    half_cell_potential_test, concrete_cover_required, concrete_cover_measured, 
                    rebar_diameter_reduction, crushing_strength ${ndtPhoto ? ", ndt_photo" : ""}
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${ndtPhoto ? ", ?" : ""})`;

    const params = [
      auditId, reboundHammerTest, reboundGrading, ultrasonicTest, ultrasonicGrading, 
      coreSamplingTest, carbonationTest, chlorideTest, sulfateTest, 
      halfCellPotentialTest, concreteCoverRequired, concreteCoverMeasured, 
      rebarDiameterReduction, crushingStrength
    ];

    if (ndtPhoto) {
      params.push(ndtPhoto);
    }

    await db.execute(sql, params);
    await logAuditHistory(auditId, "NDT Results submitted", req.user.id);

    res.json({ message: "NDT results submitted successfully" });
  } catch (error) {
    console.error("Error submitting NDT results:", error);
    res.status(500).json({ message: "Failed to submit NDT results" });
  }
});


// Immediate Concern Submission
app.post("/api/immediate-concern/:auditId", authenticate, upload.single("damagePhoto"), async (req, res) => {
  try {
    const { auditId } = req.params;
    const { concernDescription, location, effectDescription, recommendedMeasures } = req.body;
    const damagePhoto = req.file ? req.file.originalname : null;
    const sql = `INSERT INTO ImmediateConcerns (audit_id, concern_description, location, effect_description, recommended_measures, damage_photo) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    await db.execute(sql, [auditId, concernDescription, location, effectDescription, recommendedMeasures, damagePhoto]);
    await logAuditHistory(auditId, "Immediate concern submitted", req.user.id);

    res.json({ message: "Immediate concern submitted successfully" });
  } catch (error) {
    console.error("Error submitting immediate concern:", error);
    res.status(500).json({ message: "Failed to submit immediate concern" });
  }
});


// Notification endpoint
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      `SELECT id, message, is_read, created_at FROM Notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

app.put('/api/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(
      `UPDATE Notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});
app.delete('/api/notifications/clear', authenticate, async (req, res) => {
  try {
    await db.execute(
      `DELETE FROM Notifications WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({ message: "All notifications cleared successfully" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Failed to clear notifications" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
