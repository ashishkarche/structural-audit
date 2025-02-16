// server/index.js
const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const cors = require('cors');
const PDFDocument = require("pdfkit");
const path = require("path");

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


app.get('/api/audits/total', authenticate, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT COUNT(*) AS totalAudits FROM Audits WHERE auditor_id = ?`,
      [req.user.id]
    );
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching audit count:', error);
    res.status(500).json({ message: 'Failed to fetch audit count' });
  }
});


// Fetch recent audits (latest 5)
app.get('/api/audits/recent', authenticate, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT id, name, location, date_of_audit 
      FROM Audits WHERE auditor_id = ? ORDER BY date_of_audit DESC LIMIT 5`,
      [req.user.id]
    );
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
app.post(
  "/submit-audit",
  authenticate,
  upload.fields([{ name: "architecturalDrawing" }, { name: "structuralDrawing" }]),
  async (req, res) => {
    try {
      const {
        name,
        location,
        yearOfConstruction,
        dateOfAudit,
        area,
        structureType,
        cementType,
        steelType,
        numberOfStories,
        designedUse,
        presentUse,
        changesInBuilding,
        distressYear,
        distressNature,
      } = req.body;

      // Extract file names if files are uploaded
      const architecturalDrawing = req.files["architecturalDrawing"]
        ? req.files["architecturalDrawing"][0].originalname
        : null;
      const structuralDrawing = req.files["structuralDrawing"]
        ? req.files["structuralDrawing"][0].originalname
        : null;

      // Function to format date
      const formatDate = (date) => (date ? new Date(date).toISOString().split("T")[0] : null);
      const formattedDate = formatDate(dateOfAudit);
      const formattedDistressYear = distressYear ? parseInt(distressYear, 10) : null;

      if (!formattedDate) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
      }

      // Insert audit into database
      const sql = `
        INSERT INTO Audits (
          auditor_id, name, location, year_of_construction, date_of_audit, area, structure_type,
          cement_type, steel_type, number_of_stories, designed_use, present_use, changes_in_building,
          distress_year, distress_nature, architectural_drawing, structural_drawing
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(sql, [
        req.user.id,
        name,
        location,
        yearOfConstruction,
        formattedDate,
        area,
        structureType,
        cementType,
        steelType,
        numberOfStories,
        designedUse,
        presentUse,
        changesInBuilding,
        formattedDistressYear,
        distressNature,
        architecturalDrawing,
        structuralDrawing,
      ]);

      // Log audit history
      await logAuditHistory(result.insertId, "Audit submitted", req.user.id);

      // 🔥 Log a notification
      await createNotification(req.user.id, `Audit "${name}" has been Submitted.`, "success");

      res.json({ message: "Audit submitted successfully", auditId: result.insertId });
    } catch (error) {
      console.error("Error submitting audit:", error);
      res.status(500).json({ message: "Failed to submit audit" });
    }
  }
);

app.get('/api/audits/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch audit details
    const auditSql = `SELECT * FROM Audits WHERE id = ? AND auditor_id = ?`;
    const [auditResult] = await db.execute(auditSql, [id, req.user.id]);

    if (auditResult.length === 0) {
      return res.status(404).json({ message: "Audit not found" });
    }

    // Fetch final submission details
    const finalSql = `SELECT * FROM AuditConclusions WHERE audit_id = ?`;
    const [finalResult] = await db.execute(finalSql, [id]);

    // Combine audit details with final submission details
    const auditData = {
      ...auditResult[0], // Audit details
      finalSubmission: finalResult.length > 0 ? finalResult[0] : null, // Include final submission if available
    };

    res.json(auditData);
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
    const {
      name, location, year_of_construction, date_of_audit, area, structure_type,
      cement_type, steel_type, number_of_stories, designed_use, present_use,
      changes_in_building, distress_year, distress_nature
    } = req.body;

    const sql = `
      UPDATE Audits
      SET name = ?, location = ?, year_of_construction = ?, date_of_audit = ?, area = ?,
          structure_type = ?, cement_type = ?, steel_type = ?, number_of_stories = ?,
          designed_use = ?, present_use = ?, changes_in_building = ?, distress_year = ?, distress_nature = ?
      WHERE id = ? AND auditor_id = ?`;

    await db.execute(sql, [
      name, location, year_of_construction, date_of_audit, area,
      steel_type, cement_type, steel_type, number_of_stories,
      designed_use, present_use, changes_in_building, distress_year, distress_nature,
      id, req.user.id
    ]);

    await logAuditHistory(id, "Audit Updated.", req.user.id);
    await createNotification(req.user.id, `Audit "${name}" has been updated.`, "success");

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
    const {
      name
    } = req.body;

    const sql = `DELETE FROM Audits WHERE id = ? AND auditor_id = ?`;
    const [result] = await db.execute(sql, [id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Audit not found or unauthorized" });
    }
    await logAuditHistory(id, "Audit Deleted", req.user.id);
    await createNotification(req.user.id, `Audit "${name}" has been updated.`, "success");
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
// ✅ Structural Changes Submission with Fix for `repair_year`
app.post(
  "/api/structural-changes/:auditId",
  authenticate,
  upload.fields([
    { name: "previousInvestigations", maxCount: 1 },
    { name: "previousInvestigationReports", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { auditId } = req.params;
      let {
        briefBackgroundHistory, // ✅ Added missing field
        dateOfChange,
        changeDetails,
        repairYear,
        repairType,
        repairEfficacy,
        repairCost,
        conclusionFromPreviousReport,
        scopeOfWork,
        purposeOfInvestigation
      } = req.body;

      // 🛠️ Convert repairYear from YYYY-MM-DD to just YYYY
      repairYear = repairYear ? new Date(repairYear).getFullYear() : null;

      // 🛠️ Handle File Uploads
      const previousInvestigations = req.files["previousInvestigations"] 
        ? req.files["previousInvestigations"][0].originalname 
        : null;

      const previousInvestigationReports = req.files["previousInvestigationReports"] 
        ? req.files["previousInvestigationReports"][0].originalname 
        : null;

      // ✅ Insert into DB with all required fields
      const sql = `
        INSERT INTO StructuralChanges (
          audit_id, 
          brief_background_history, 
          date_of_change, 
          change_details, 
          previous_investigations, 
          previous_investigation_reports, 
          repair_year, 
          repair_type, 
          repair_efficacy, 
          repair_cost, 
          conclusion_from_previous_report, 
          scope_of_work, 
          purpose_of_investigation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.execute(sql, [
        auditId, 
        briefBackgroundHistory, 
        dateOfChange, 
        changeDetails, 
        previousInvestigations, 
        previousInvestigationReports, 
        repairYear, 
        repairType, 
        repairEfficacy, 
        repairCost, 
        conclusionFromPreviousReport, 
        scopeOfWork, 
        purposeOfInvestigation
      ]);

      await logAuditHistory(auditId, "Structural changes submitted", req.user.id);

      res.json({ message: "Structural changes submitted successfully" });

    } catch (error) {
      console.error("Error submitting structural changes:", error);
      res.status(500).json({ message: "Failed to submit structural changes" });
    }
  }
);



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


app.post("/api/observations/:auditId", authenticate, upload.array("damagePhotos", 5), async (req, res) => {
  try {
    const { auditId } = req.params;
    let {
      unexpectedLoad, unapprovedChanges, additionalFloor, vegetationGrowth, leakage,
      cracksBeams, cracksColumns, cracksFlooring, floorSagging, bulgingWalls,
      windowProblems, heavingFloor, concreteTexture, algaeGrowth,
      damageDescription, damageLocation, damageCause, damageClassification
    } = req.body;

    // Convert boolean values to 0 or 1
    const toBoolean = (value) => (value === "true" || value === true ? 1 : 0);

    unexpectedLoad = toBoolean(unexpectedLoad);
    unapprovedChanges = toBoolean(unapprovedChanges);
    additionalFloor = toBoolean(additionalFloor);
    vegetationGrowth = toBoolean(vegetationGrowth);
    leakage = toBoolean(leakage);
    cracksBeams = toBoolean(cracksBeams);
    cracksColumns = toBoolean(cracksColumns);
    cracksFlooring = toBoolean(cracksFlooring);
    floorSagging = toBoolean(floorSagging);
    bulgingWalls = toBoolean(bulgingWalls);
    windowProblems = toBoolean(windowProblems);
    heavingFloor = toBoolean(heavingFloor);
    algaeGrowth = toBoolean(algaeGrowth);

    // Extract only the classification code (e.g., "Class 4" instead of "Class 4 - Major Repair")
    if (damageClassification) {
      damageClassification = damageClassification.split(" - ")[0];
    }

    // Handle multiple file uploads (damage photos)
    const damagePhotos = req.files ? req.files.map(file => file.originalname).join(",") : null;

    // Insert into the database
    const sql = `
      INSERT INTO Observations (
        audit_id, unexpected_load, unapproved_changes, additional_floor,
        vegetation_growth, leakage, cracks_beams, cracks_columns, cracks_flooring,
        floor_sagging, bulging_walls, window_problems, heaving_floor, concrete_texture,
        algae_growth, damage_description, damage_location, damage_cause, damage_classification, damage_photos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      auditId, unexpectedLoad, unapprovedChanges, additionalFloor,
      vegetationGrowth, leakage, cracksBeams, cracksColumns, cracksFlooring,
      floorSagging, bulgingWalls, windowProblems, heavingFloor, concreteTexture,
      algaeGrowth, damageDescription, damageLocation, damageCause, damageClassification, damagePhotos
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

app.post("/api/conclusion/:auditId", authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const { conclusion, recommendations, technicalComments, executiveEngineers, superintendingEngineers, chiefEngineers } = req.body;

    // Validate input fields
    if (!conclusion || !recommendations || !technicalComments || !executiveEngineers || !superintendingEngineers || !chiefEngineers) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Insert into the database
    const sql = `
      INSERT INTO AuditConclusions (
        audit_id, conclusion, recommendations, technical_comments,
        executive_engineers, superintending_engineers, chief_engineers
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [auditId, conclusion, recommendations, technicalComments, executiveEngineers, superintendingEngineers, chiefEngineers]);

    // Log audit history
    await logAuditHistory(auditId, "Conclusion & Recommendations submitted", req.user.id);

    res.json({ message: "Conclusion & Recommendations submitted successfully" });
  } catch (error) {
    console.error("Error submitting conclusion:", error);
    res.status(500).json({ message: "Failed to submit conclusion & recommendations" });
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


app.get('/api/audits/:auditId/report', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;

    // Fetch auditor details
    const [auditorResult] = await db.execute(
      `SELECT name, firm_name, qualification, specialization, 
       general_experience, specialized_experience, employment_period 
       FROM Auditors WHERE id = ?`,
      [req.user.id]
    );

    if (auditorResult.length === 0) {
      return res.status(404).json({ message: "Auditor not found" });
    }
    const auditor = auditorResult[0];

    // Fetch audit details
    const [auditResult] = await db.execute(
      `SELECT * FROM Audits WHERE id = ? AND auditor_id = ?`,
      [auditId, req.user.id]
    );

    if (auditResult.length === 0) {
      return res.status(404).json({ message: "Audit not found" });
    }
    const audit = auditResult[0];

    // Fetch related data
    const [structuralChanges] = await db.execute(`SELECT * FROM StructuralChanges WHERE audit_id = ?`, [auditId]);
    const [observations] = await db.execute(`SELECT * FROM Observations WHERE audit_id = ?`, [auditId]);
    const [immediateConcerns] = await db.execute(`SELECT * FROM ImmediateConcerns WHERE audit_id = ?`, [auditId]);
    const [ndtTests] = await db.execute(`SELECT * FROM NDTTests WHERE audit_id = ?`, [auditId]);
    const [conclusion] = await db.execute(`SELECT * FROM AuditConclusions WHERE audit_id = ?`, [auditId]);

    // Create PDF document
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Audit_Report_${auditId}.pdf`);
    doc.pipe(res);

    // 📌 Title Page
    doc.fontSize(20).text("Structural Audit Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Prepared by: ${auditor.firm_name}`, { align: "center" });
    doc.moveDown(2);

    // 📌 Auditor Details (Page 1)
    doc.fontSize(16).text("Auditor Details", { underline: true });
    doc.fontSize(12).text(`Name: ${auditor.name}`);
    doc.text(`Qualification: ${auditor.qualification}`);
    doc.text(`Specialization: ${auditor.specialization}`);
    doc.text(`Firm Name: ${auditor.firm_name}`);
    doc.text(`General Professional Experience: ${auditor.general_experience} years`);
    doc.text(`Specialized Experience: ${auditor.specialized_experience} years`);
    doc.text(`Employment Period: ${auditor.employment_period} years`);
    doc.moveDown();

    // 📌 Project Details (Page 2)
    doc.fontSize(16).text("Project Details", { underline: true });
    doc.fontSize(12).text(`Name: ${audit.name}`);
    doc.text(`Location: ${audit.location}`);
    doc.text(`Year of Construction: ${audit.year_of_construction}`);
    doc.text(`Date of Audit: ${audit.date_of_audit}`);
    doc.text(`Area of Building: ${audit.area}`);
    doc.text(`Type of Structure: ${audit.structure_type}`);
    doc.text(`Number of Stories: ${audit.number_of_stories}`);
    doc.text(`Use of Building:`);
    doc.text(`  - Designed Use: ${audit.designed_use}`);
    doc.text(`  - Present Use: ${audit.present_use}`);
    doc.text(`  - Changes in Use: ${audit.changes_in_use}`);
    doc.moveDown();

    // 📌 Introduction (Page 3)
    doc.fontSize(16).text("Introduction", { underline: true });
    doc.fontSize(12).text(
      `${auditor.firm_name} has been appointed to inspect and analyze the condition of ${audit.name} situated at ${audit.location} and subsequently submit an audit report.`
    );
    doc.text(
      "A team of experts and engineers carried out a series of detailed visual inspections. Material testing using specialized Non-Destructive Testing (NDT) techniques was also performed."
    );
    doc.moveDown();

    // 📌 Background History (Page 4)
    if (structuralChanges.length > 0) {
      doc.fontSize(16).text("Background History", { underline: true });
      structuralChanges.forEach((change) => {
        doc.fontSize(12).text(`- Date of Change: ${change.change_date}`);
        doc.text(`  Details: ${change.change_details}`);
        doc.text(`  Repair Year: ${change.repair_year}`);
        doc.text(`  Repair Type: ${change.repair_type}`);
        doc.text(`  Repair Efficacy: ${change.repair_efficacy}`);
        doc.text(`  Repair Cost: ${change.repair_cost}`);
        doc.moveDown();
      });
    }

    // 📌 Visual Observations (Page 5)
    if (observations.length > 0) {
      doc.fontSize(16).text("Visual Observations", { underline: true });
      observations.forEach((obs) => {
        doc.fontSize(12).text(`- ${obs.description}`);
      });
      doc.moveDown();
    }

    // 📌 NDT Test Results (Page 7)
    if (ndtTests.length > 0) {
      doc.fontSize(16).text("Non-Destructive Testing (NDT) Results", { underline: true });
      ndtTests.forEach((ndt) => {
        doc.fontSize(12).text(`- Test Type: ${ndt.test_type}`);
        doc.text(`  Results: ${ndt.test_results}`);
        doc.text(`  Conclusion: ${ndt.conclusion}`);
        doc.moveDown();
      });
    }

    // 📌 Conclusion & Recommendations (Page 8)
    // 📌 Conclusion & Recommendations (Final Section)
    if (conclusion.length > 0) {
      doc.addPage(); // Ensure conclusion starts on new page
      doc.fontSize(16).text("Conclusion & Recommendations", { underline: true });

      // Main Conclusion
      doc.fontSize(12)
        .text("Conclusion:", { continued: true })
        .font('Helvetica-Bold')
        .text(` ${conclusion[0].conclusion || "N/A"}`);

      // Recommendations
      doc.font('Helvetica')
        .text("\nRecommendations:", { continued: true })
        .font('Helvetica-Bold')
        .text(` ${conclusion[0].recommendations || "N/A"}`);

      // Technical Comments
      doc.font('Helvetica')
        .text("\nTechnical Comments on Nature of Distress:", { continued: true })
        .font('Helvetica-Bold')
        .text(` ${conclusion[0].technical_comments || "N/A"}`);

      // Engineering Signatures
      doc.font('Helvetica')
        .text("\n\nApproved By:")
        .text(`\nExecutive Engineers: ${conclusion[0].executive_engineers || "___________________"}`)
        .text(`Superintending Engineers: ${conclusion[0].superintending_engineers || "___________________"}`)
        .text(`Chief Engineers: ${conclusion[0].chief_engineers || "___________________"}`);
    }

    // 📌 Proforma (Page 4)
    doc.addPage();
    doc.fontSize(16).text("Proforma", { underline: true });
    doc.fontSize(12).text(`Subject: Structural Audit of ${audit.name} at ${audit.location}`);
    doc.text(`Date of Audit: ${audit.date_of_audit}`);
    doc.text(`1. Name of the Project: ${audit.name}`);
    doc.text(`   a. Location: ${audit.location}`);
    doc.text(`   b. Area of Building: ${audit.area_of_building}`);
    doc.text(`   c. Type of Structure: ${audit.structure_type}`);
    doc.text(`   d. Number of Stories: ${audit.stories}`);
    doc.text(`2. Year of Construction: ${audit.year_of_construction}`);
    doc.text(`3. Use of the Building:`);
    doc.text(`   a. Designed Use: ${audit.designed_use}`);
    doc.text(`   b. Present Use: ${audit.present_use}`);
    doc.text(`   c. Changes in Use: ${audit.changes_in_use}`);
    doc.text(`4. History of Structure:`);
    doc.text(`   a. Year of Repairs: ${structuralChanges[0]?.repair_year || "N/A"}`);
    doc.text(`   b. Type of Repairs: ${structuralChanges[0]?.repair_type || "N/A"}`);
    doc.text(`   c. Efficacy of Repairs: ${structuralChanges[0]?.repair_efficacy || "N/A"}`);
    doc.text(`   d. Cost of Repairs: ${structuralChanges[0]?.repair_cost || "N/A"}`);
    doc.text(`5. Type of Cement Used: ${audit.cement_type}`);
    doc.text(`6. Type of Steel Reinforcement: ${audit.steel_type}`);
    doc.text(`7. Visual Observations Conclusion: ${conclusion[0]?.conclusion || "N/A"}`);
    doc.text(`8. Areas of Immediate Concern: ${immediateConcerns[0]?.description || "N/A"}`);
    doc.text(`9. NDT Test Results:`);
    ndtTests.forEach((ndt, index) => {
      doc.text(`   ${index + 1}. ${ndt.test_type}: ${ndt.conclusion}`);
    });

    doc.end();
    
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

// 📌 Fetch All Reports Available for Download
app.get('/api/reports', authenticate, async (req, res) => {
  try {
    const [reports] = await db.execute(
      `SELECT id, name, location, date_of_audit FROM Audits WHERE auditor_id = ? ORDER BY date_of_audit DESC`,
      [req.user.id]
    );

    // Generate download links dynamically
    const reportsWithLinks = reports.map(report => ({
      id: report.id,
      name: report.name,
      location: report.location,
      date_of_audit: report.date_of_audit,
      download_url: `http://localhost:5000/api/audits/${report.id}/report`,
    }));

    res.json(reportsWithLinks);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
