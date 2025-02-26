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
    const { name, qualification, specialization, firmName, generalExperience, specializedExperience, employmentPeriod, email, password, termsAccepted } = req.body;

    // Ensure terms are accepted
    if (!termsAccepted) {
      return res.status(400).json({ message: 'You must accept the terms and conditions' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO Auditors (name, qualification, specialization, firm_name, general_experience, specialized_experience, employment_period, email, password, terms_accepted)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await db.execute(sql, [name, qualification, specialization, firmName, generalExperience, specializedExperience, employmentPeriod, email, hashedPassword, termsAccepted]);

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
app.post("/submit-audit", authenticate, async (req, res) => {
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

    // Ensure required fields are provided
    if (!name || !location || !yearOfConstruction || !dateOfAudit || !area || !structureType || !cementType || !steelType || !numberOfStories || !designedUse || !presentUse) {
      return res.status(400).json({ message: "Missing required fields. Please fill in all necessary details." });
    }

    // Function to safely format dates
    const formatDate = (date) => {
      const parsedDate = new Date(date);
      return isNaN(parsedDate) ? null : parsedDate.toISOString().split("T")[0];
    };

    // Format dates
    const formattedDate = formatDate(dateOfAudit);
    const formattedDistressYear = distressYear ? parseInt(distressYear, 10) : null;

    if (!formattedDate) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    // Insert audit into database WITHOUT file uploads
    const sql = `
    INSERT INTO Audits (
    auditor_id, name, location, year_of_construction, date_of_audit, area, structure_type,
    cement_type, steel_type, number_of_stories, designed_use, present_use, changes_in_building,
    distress_year, distress_nature ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

    `;

    const [result] = await db.execute(sql, [
      req.user.id,
      name.trim(),
      location.trim(),
      parseInt(yearOfConstruction, 10),
      formattedDate,
      parseFloat(area),
      structureType.trim(),
      cementType.trim(),
      steelType.trim(),
      parseInt(numberOfStories, 10),
      designedUse.trim(),
      presentUse.trim(),
      changesInBuilding ? changesInBuilding.trim() : null,
      formattedDistressYear,
      distressNature ? distressNature.trim() : null,
    ]);

    // Log audit history
    await logAuditHistory(result.insertId, "Audit submitted", req.user.id);

    // Log a notification
    await createNotification(req.user.id, `Audit "${name}" has been submitted.`, "success");

    res.json({ message: "Audit submitted successfully", auditId: result.insertId });
  } catch (error) {
    console.error("Error submitting audit:", error);
    res.status(500).json({ message: "Failed to submit audit. Please try again later." });
  }
});


app.post("/api/upload-drawings", authenticate, upload.fields([
  { name: "architecturalDrawing", maxCount: 1 },
  { name: "structuralDrawing", maxCount: 1 }
]), async (req, res) => {
  try {
    const { auditId } = req.body;

    if (!auditId || !req.files) {
      return res.status(400).json({ message: "Audit ID and files are required" });
    }

    const files = [];
    if (req.files["architecturalDrawing"]) {
      const fileBuffer = req.files["architecturalDrawing"][0].buffer;
      files.push([auditId, req.user.id, "architecturalDrawing", fileBuffer]);
    }
    if (req.files["structuralDrawing"]) {
      const fileBuffer = req.files["structuralDrawing"][0].buffer;
      files.push([auditId, req.user.id, "structuralDrawing", fileBuffer]);
    }

    // ✅ Insert file as BLOB into DB
    const sql = `INSERT INTO AuditDrawings (audit_id, auditor_id, drawing_type, file_data) VALUES ?`;
    await db.query(sql, [files]);

    res.json({ message: "Drawings uploaded successfully" });
  } catch (error) {
    console.error("Error uploading drawings:", error);
    res.status(500).json({ message: "Failed to upload drawings" });
  }
});

app.get("/api/files/:auditId/drawings", authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const sql = `SELECT drawing_type, file_data FROM AuditDrawings WHERE audit_id = ?`;
    const [drawings] = await db.execute(sql, [auditId]);

    if (!drawings.length) {
      return res.status(404).json({ message: "No drawings found for this audit." });
    }

    // ✅ Convert BLOBs to base64 and return both PDFs
    const response = {};
    drawings.forEach((drawing) => {
      response[drawing.drawing_type] = `data:application/pdf;base64,${drawing.file_data.toString("base64")}`;
    });

    res.json(response);
  } catch (error) {
    console.error("Error fetching drawings:", error);
    res.status(500).json({ message: "Failed to fetch drawings" });
  }
});



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


// ✅ Serve PDFs & Images from Database
app.get("/api/files/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    // 🔍 Check if file exists in memory storage (Database)
    const [result] = await db.execute(
      `SELECT damage_photo FROM Observations WHERE damage_photos = ? `,
      [filename, filename]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    // 📌 Identify file type
    const fileType = filename.endsWith(".pdf") ? "application/pdf" : "image/jpeg";

    // 🔹 Serve File
    res.setHeader("Content-Type", fileType);
    res.sendFile(filename, { root: "memory_storage_path_here" }); // Replace with actual memory handling
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ message: "Failed to fetch file" });
  }
});

// ✅ Get Full Audit Details (Includes PDFs & Images)
app.get('/api/audits/:auditId/full', async (req, res) => {
  try {
    const { auditId } = req.params;

    // 🔍 Fetch audit details
    const [auditResult] = await db.execute(`SELECT * FROM Audits WHERE id = ?`, [auditId]);
    if (auditResult.length === 0) {
      return res.status(404).json({ message: "Audit not found" });
    }
    const audit = auditResult[0];

    // 🔍 Fetch related tables
    const [structuralChanges] = await db.execute(`SELECT * FROM StructuralChanges WHERE audit_id = ?`, [auditId]);
    const [observations] = await db.execute(`SELECT * FROM Observations WHERE audit_id = ?`, [auditId]);
    const [dataEntries] = await db.execute(`SELECT * FROM DamageEntries WHERE audit_id = ?`, [auditId]);
    const [immediateConcerns] = await db.execute(`SELECT * FROM ImmediateConcerns WHERE audit_id = ?`, [auditId]);
    const [ndtTests] = await db.execute(`SELECT * FROM NDTTests WHERE audit_id = ?`, [auditId]);

    // 🔹 Return full audit details
    res.json({ audit, structuralChanges, observations, immediateConcerns, ndtTests, dataEntries });
  } catch (error) {
    console.error("Error fetching audit details:", error);
    res.status(500).json({ message: "Failed to fetch audit details" });
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


app.delete('/api/audits/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch audit details before deletion
    const [audit] = await db.execute(`SELECT name FROM Audits WHERE id = ? AND auditor_id = ?`, [id, req.user.id]);

    if (audit.length === 0) {
      return res.status(404).json({ message: "Audit not found or unauthorized" });
    }

    const auditName = audit[0].name; // Get the audit name

    // Delete the audit
    const sql = `DELETE FROM Audits WHERE id = ? AND auditor_id = ?`;
    const [result] = await db.execute(sql, [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Audit not found or unauthorized" });
    }

    await logAuditHistory(id, "Audit Deleted", req.user.id);
    await createNotification(req.user.id, `Audit "${auditName}" has been deleted.`, "success");

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
  upload.single("investigationFile"), // ✅ Handle single file upload
  async (req, res) => {
    try {
      const { auditId } = req.params;
      let {
        briefBackgroundHistory,
        briefHistoryDetails,
        dateOfChange,
        structuralChanges,
        changeDetails,
        previousInvestigation,
        conclusionFromPreviousReport,
        scopeOfWork,
        purposeOfInvestigation,
      } = req.body;

      // ✅ Convert "Yes"/"No" to boolean (1 or 0)
      briefBackgroundHistory = briefBackgroundHistory === "Yes" ? 1 : 0;
      structuralChanges = structuralChanges === "Yes" ? 1 : 0;
      previousInvestigation = previousInvestigation === "Yes" ? 1 : 0;

      // ✅ Convert empty date to NULL
      dateOfChange = dateOfChange?.trim() ? dateOfChange : null;

      // ✅ Handle File Uploads (Store as BLOB)
      const previousInvestigationReports = req.file ? req.file.buffer : null;

      // ✅ Insert into DB
      const sql = `
        INSERT INTO StructuralChanges (
          audit_id, 
          brief_background_history, 
          brief_history_details, 
          date_of_change, 
          structural_changes, 
          change_details, 
          previous_investigation, 
          previous_investigation_reports, 
          conclusion_from_previous_report, 
          scope_of_work, 
          purpose_of_investigation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.execute(sql, [
        auditId,
        briefBackgroundHistory,
        briefHistoryDetails,
        dateOfChange,
        structuralChanges,
        changeDetails,
        previousInvestigation,
        previousInvestigationReports,
        conclusionFromPreviousReport,
        scopeOfWork,
        purposeOfInvestigation,
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

app.get('/api/audits/:auditId/structural-changes', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const sql = `
      SELECT brief_background_history, brief_history_details, date_of_change, 
             structural_changes, change_details, previous_investigation 
      FROM StructuralChanges 
      WHERE audit_id = ?`;

    const [structuralChanges] = await db.execute(sql, [auditId]);

    if (structuralChanges.length === 0) {
      return res.status(404).json({ message: "No structural changes found for this audit." });
    }

    res.json(structuralChanges);
  } catch (error) {
    console.error("Error fetching structural changes:", error);
    res.status(500).json({ message: "Failed to fetch structural changes." });
  }
});

app.get('/api/audits/:auditId/immediate-concerns', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const sql = `
      SELECT concern_description, location, effect_description, recommended_measures 
      FROM ImmediateConcerns 
      WHERE audit_id = ?`;

    const [immediateConcerns] = await db.execute(sql, [auditId]);

    if (immediateConcerns.length === 0) {
      return res.status(404).json({ message: "No immediate concerns found for this audit." });
    }

    res.json(immediateConcerns);
  } catch (error) {
    console.error("Error fetching immediate concerns:", error);
    res.status(500).json({ message: "Failed to fetch immediate concerns." });
  }
});

app.get('/api/audits/:auditId/drawings', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const sql = `
      SELECT drawing_type, file_data 
      FROM AuditDrawings 
      WHERE audit_id = ?`;

    const [drawings] = await db.execute(sql, [auditId]);

    if (drawings.length === 0) {
      return res.status(404).json({ message: "No drawings found for this audit." });
    }

    // Convert BLOB to Base64
    const drawingsWithBase64 = drawings.map((drawing) => ({
      ...drawing,
      file_data: drawing.file_data ? drawing.file_data.toString('base64') : null
    }));

    res.json(drawingsWithBase64);
  } catch (error) {
    console.error("Error fetching audit drawings:", error);
    res.status(500).json({ message: "Failed to fetch audit drawings." });
  }
});

// Fetch Structural Changes for a given auditId
app.get('/api/structural-changes/:auditId', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;

    // Query the database to fetch structural changes for the given auditId
    const [result] = await db.execute(
      `SELECT * FROM StructuralChanges WHERE audit_id = ?`,
      [auditId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "No structural changes found for this audit." });
    }

    res.json(result[0]);  // Return the first record, assuming there is only one structural change record per auditId
  } catch (error) {
    console.error("Error fetching structural changes:", error);
    res.status(500).json({ message: "Failed to fetch structural changes" });
  }
});

// Insert into Audit History
app.post(
  "/api/observations/:auditId",
  authenticate,
  upload.array("damagePhotos", 10), // Allow up to 10 photos
  async (req, res) => {
    try {
      const { auditId } = req.params;
      let {
        unexpectedLoad, unapprovedChanges, additionalFloor, vegetationGrowth, leakage,
        cracksBeams, cracksColumns, cracksFlooring, floorSagging, bulgingWalls,
        windowProblems, heavingFloor, concreteTexture, algaeGrowth, damages
      } = req.body;

      // ✅ Convert "Yes"/"No" responses to boolean (1 or 0)
      const toBoolean = (value) => (value === "Yes" ? 1 : 0);

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

      if (!auditId) {
        return res.status(400).json({ message: "Audit ID is required." });
      }

      // ✅ Insert General Observations
      const sqlObservations = `
        INSERT INTO Observations (
          audit_id, unexpected_load, unapproved_changes, additional_floor,
          vegetation_growth, leakage, cracks_beams, cracks_columns, cracks_flooring,
          floor_sagging, bulging_walls, window_problems, heaving_floor, concrete_texture,
          algae_growth
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.execute(sqlObservations, [
        auditId, unexpectedLoad, unapprovedChanges, additionalFloor,
        vegetationGrowth, leakage, cracksBeams, cracksColumns, cracksFlooring,
        floorSagging, bulgingWalls, windowProblems, heavingFloor, concreteTexture,
        algaeGrowth
      ]);

      // ✅ Parse JSON String for `damages`
      try {
        damages = JSON.parse(damages);
      } catch (error) {
        return res.status(400).json({ message: "Invalid damages format" });
      }

      if (!Array.isArray(damages)) {
        return res.status(400).json({ message: "Damages must be an array" });
      }

      // ✅ Insert Damage Entries with BLOB Images
      const damageSql = `
        INSERT INTO DamageEntries (
          audit_id, description, location, cause, classification, damage_photos
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (let i = 0; i < damages.length; i++) {
        let { description, location, cause, classification } = damages[i];

        if (!description || !location || !cause || !classification) {
          return res.status(400).json({ message: "All damage details are required for each entry." });
        }

        classification = classification.split(" - ")[0];

        // ✅ Convert image to BLOB
        const imageBuffer = req.files[i] ? req.files[i].buffer : null;

        await db.execute(damageSql, [auditId, description, location, cause, classification, imageBuffer]);
      }

      await logAuditHistory(auditId, "Observations submitted", req.user.id);

      res.json({ message: "Observations submitted successfully." });
    } catch (error) {
      console.error("Error submitting observations:", error);
      res.status(500).json({ message: "Failed to submit observations" });
    }
  }
);

app.get("/api/observations/:auditId", authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;

    // Fetch the general observations for the given auditId
    const sqlObservations = `SELECT * FROM Observations WHERE audit_id = ?`;
    const [observationRows] = await db.execute(sqlObservations, [auditId]);

    if (observationRows.length === 0) {
      return res.status(404).json({ message: "Observations not found for this audit." });
    }

    const observation = observationRows[0];

    // Fetch damage entries for the given auditId
    const sqlDamage = `SELECT id, description, location, cause, classification, damage_photos FROM DamageEntries WHERE audit_id = ?`;
    const [damageRows] = await db.execute(sqlDamage, [auditId]);

    // Convert BLOB images to base64 for frontend compatibility
    const damages = damageRows.map((damage) => ({
      id: damage.id,
      description: damage.description,
      location: damage.location,
      cause: damage.cause,
      classification: damage.classification,
      photo: damage.damage_photo ? `data:image/jpeg;base64,${damage.damage_photo.toString("base64")}` : null,
    }));

    // Prepare the final response
    const responseData = {
      unexpectedLoad: observation.unexpected_load,
      unapprovedChanges: observation.unapproved_changes,
      additionalFloor: observation.additional_floor,
      vegetationGrowth: observation.vegetation_growth,
      leakage: observation.leakage,
      cracksBeams: observation.cracks_beams,
      cracksColumns: observation.cracks_columns,
      cracksFlooring: observation.cracks_flooring,
      floorSagging: observation.floor_sagging,
      bulgingWalls: observation.bulging_walls,
      windowProblems: observation.window_problems,
      heavingFloor: observation.heaving_floor,
      concreteTexture: observation.concrete_texture,
      algaeGrowth: observation.algae_growth,
      damages, // Include damage entries with decoded images
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching observations:", error);
    res.status(500).json({ message: "Failed to fetch observations" });
  }
});

app.post("/api/ndt/:auditId", authenticate, upload.fields([
  { name: "reboundHammerImage", maxCount: 1 },
  { name: "ultrasonicImage", maxCount: 1 },
  { name: "coreSamplingImage", maxCount: 1 },
  { name: "carbonationImage", maxCount: 1 },
  { name: "chlorideImage", maxCount: 1 },
  { name: "sulfateImage", maxCount: 1 },
  { name: "halfCellPotentialImage", maxCount: 1 },
  { name: "concreteCoverImage", maxCount: 1 },
  { name: "rebarDiameterImage", maxCount: 1 },
  { name: "crushingStrengthImage", maxCount: 1 }
]), async (req, res) => {
  try {
    const { auditId } = req.params;
    const testFields = [
      "rebound_hammer_test", "ultrasonic_test", "core_sampling_test", "carbonation_test", "chloride_test",
      "sulfate_test", "half_cell_potential_test", "concrete_cover_test", "rebar_diameter_test", "crushing_strength_test",
      "concrete_cover_required", "concrete_cover_measured", "rebar_diameter_reduction", "crushing_strength"
    ];

    // ✅ Parse JSON test data safely
    const testData = {};
    testFields.forEach(field => {
      if (req.body[field]) {
        try {
          testData[field] = JSON.parse(req.body[field]); // Store as object
        } catch (error) {
          testData[field] = req.body[field]; // Store as string if JSON parsing fails
        }
      } else {
        testData[field] = null;
      }
    });

    // ✅ Retrieve uploaded images as binary buffers
    const imageFields = {
      rebound_hammer_image: req.files?.reboundHammerImage?.[0]?.buffer || null,
      ultrasonic_image: req.files?.ultrasonicImage?.[0]?.buffer || null,
      core_sampling_image: req.files?.coreSamplingImage?.[0]?.buffer || null,
      carbonation_image: req.files?.carbonationImage?.[0]?.buffer || null,
      chloride_image: req.files?.chlorideImage?.[0]?.buffer || null,
      sulfate_image: req.files?.sulfateImage?.[0]?.buffer || null,
      half_cell_potential_image: req.files?.halfCellPotentialImage?.[0]?.buffer || null,
      concrete_cover_image: req.files?.concreteCoverImage?.[0]?.buffer || null,
      rebar_diameter_image: req.files?.rebarDiameterImage?.[0]?.buffer || null,
      crushing_strength_image: req.files?.crushingStrengthImage?.[0]?.buffer || null
    };

    // ✅ Build SQL query dynamically
    let columns = ["audit_id", ...Object.keys(testData).map(key => key.toLowerCase())];
    let values = [auditId, ...Object.values(testData)];
    let placeholders = new Array(values.length).fill("?");

    // ✅ Add image columns dynamically
    Object.keys(imageFields).forEach((key) => {
      if (imageFields[key] !== null) {
        columns.push(key);
        values.push(imageFields[key]);
        placeholders.push("?");
      }
    });

    // ✅ Final SQL Query
    const sql = `INSERT INTO NDTTests (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;

    // ✅ Execute the SQL query
    await db.execute(sql, values);

    // ✅ Log the audit history
    await logAuditHistory(auditId, "NDT Results submitted", req.user.id);

    res.json({ message: "NDT results submitted successfully" });

  } catch (error) {
    console.error("❌ Error submitting NDT results:", error);
    res.status(500).json({ message: "Failed to submit NDT results", error: error.message });
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
app.post("/api/immediate-concern/:auditId", authenticate, upload.single("damagePhoto"), async (req, res) => {
  try {
    const { auditId } = req.params;
    const { concernDescription, location, effectDescription, recommendedMeasures } = req.body;
    const damagePhoto = req.file ? req.file.buffer : null; // Store image as binary

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

app.get("/api/immediate-concern/image/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT damage_photo FROM ImmediateConcerns WHERE id = ?`;
    const [rows] = await db.execute(sql, [id]);

    if (rows.length === 0 || !rows[0].damage_photo) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.setHeader("Content-Type", "image/jpeg"); // Adjust MIME type as needed
    res.send(rows[0].damage_photo);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ message: "Failed to fetch image" });
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
    const [damageEntries] = await db.execute(`SELECT * FROM DamageEntries WHERE audit_id = ?`, [auditId]);

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
    doc.text(`Type of Cement: ${audit.cement_type}`);
    doc.text(`Type of Steel: ${audit.steel_type}`);
    doc.text(`Number of Stories: ${audit.number_of_stories}`);
    doc.text(`Use of Building:`);
    doc.text(`  - Designed Use: ${audit.designed_use}`);
    doc.text(`  - Present Use: ${audit.present_use}`);
    doc.text(`  - Changes in Building: ${audit.changes_in_building}`);
    doc.text(`  - Distress Year: ${audit.distress_year}`);
    doc.text(`  - Distress Nature: ${audit.distress_nature}`);
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
        doc.fontSize(12).text(`- Brief Background History: ${change.brief_background_history}`);
        doc.fontSize(12).text(`- Date of Change: ${change.date_of_change || "Data Not Availble"}`);
        doc.text(`  Details: ${change.change_details}`);
        doc.text(`  Conclusion From Previous Report: ${change.conclusion_from_previous_report}`);
        doc.text(`  Scope Of Work: ${change.scope_of_work}`);
        doc.text(`  Purpose Of investigation: ${change.purpose_of_investigation}`);
        doc.moveDown();
      });
    }

    // 📌 Visual Observations (Page 5)
    if (observations.length > 0) {
      doc.fontSize(16).text("Visual Observations", { underline: true });
      observations.forEach((obs) => {
        doc.fontSize(12).text(` Unexpected Load: ${obs.unexpected_load ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Unapproved Changes: ${obs.unapproved_changes ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Additional Floor: ${obs.additional_floor ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Vegetation Growth: ${obs.vegetation_growth ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Leakage Load: ${obs.leakage ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Cracks Beams: ${obs.cracks_beams ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Cracks Columns: ${obs.cracks_columns ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Cracks Flooring: ${obs.cracks_flooring ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Floor Sagging: ${obs.floor_sagging ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Bulging Walls: ${obs.bulging_walls ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Window Pronlems: ${obs.window_problems ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Heaving Floor: ${obs.heaving_floor ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Concrete Texture: ${obs.concrete_texture ? "Yes" : "No"}`);
        doc.fontSize(12).text(` Algae Growth: ${obs.algae_growth ? "Yes" : "No"}`);
      });
    }

    // 📌 Damage Entries
    if (damageEntries.length > 0) {
      doc.fontSize(16).text("Damage Observations", { underline: true });
      damageEntries.forEach((damage) => {
        doc.fontSize(12).text(`- Description: ${damage.description || "N/A"}`);
        doc.text(`  Location: ${damage.location || "N/A"}`);
        doc.text(`  Cause: ${damage.cause || "N/A"}`);
        doc.text(`  Classification: ${damage.classification || "N/A"}`);
        doc.moveDown();
      });
    }

    // 📌 NDT Test Results Table
    if (ndtTests.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("Non-Destructive Testing (NDT) Results", { underline: true });
      doc.moveDown(1);

      const ndtTable = {
        headers: ["Test Type", "Value", "Quality", "Recommendation"],
        rows: [],
      };

      // Loop through all tests and parse JSON data
      ndtTests.forEach((ndt) => {
        Object.keys(ndt).forEach((key) => {
          if (key !== "id" && ndt[key]) {
            try {
              const data = JSON.parse(ndt[key]); // Parse stored JSON test results
              ndtTable.rows.push([
                key.replace(/_/g, " "), // Format test type name (e.g., "rebound_hammer_test" → "Rebound Hammer Test")
                data.value || "N/A",
                data.quality || "N/A",
                data.recommendation || "N/A",
              ]);
            } catch (error) {
              ndtTable.rows.push([
                key.replace(/_/g, " "),
                "Invalid Data",
                "Invalid Data",
                "Invalid Data",
              ]);
            }
          }
        });
      });

      // Function to draw table
      const drawTable1 = (doc, table, startX, startY, rowHeight = 25, colWidths = [150, 100, 100, 200]) => {
        let y = startY;

        // Draw headers
        doc.font("Helvetica-Bold").fontSize(12);
        colWidths.forEach((width, index) => {
          doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
          doc.text(table.headers[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 7);
        });
        y += rowHeight;

        // Draw rows
        doc.font("Helvetica").fontSize(11);
        table.rows.forEach((row) => {
          colWidths.forEach((width, index) => {
            doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
            doc.text(row[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 7);
          });
          y += rowHeight;
        });
      };

      // Draw the NDT Test Table at position (50, 150)
      drawTable1(doc, ndtTable, 50, 150);
    }

    // 📌 Proforma (Page 4)
    doc.addPage();
    doc.fontSize(16).text("Proforma", { underline: true });
    doc.moveDown(1);

    const table = {
      headers: ["#", "Details"],
      rows: [
        ["Subject", `Structural Audit of ${audit.name} at ${audit.location}`],
        ["Date of Audit", audit.date_of_audit],
        ["1. Name of the Project", audit.name],
        ["   a. Location", audit.location],
        ["   b. Area of Building", audit.area],
        ["   c. Type of Structure", audit.structure_type],
        ["   d. Number of Stories", audit.number_of_stories],
        ["2. Year of Construction", audit.year_of_construction],
        ["3. Use of the Building", ""],
        ["   a. Designed Use", audit.designed_use],
        ["   b. Present Use", audit.present_use],
        ["   c. Changes in Building", audit.changes_in_building],
        ["4. History of Structure", ""],
        ["   a. carrying out Repairs", structuralChanges[0]?.date_of_change || "Data Not Availble"],
        ["   b. Type of Repairs", structuralChanges[0]?.repair_type || "Data Not Availble"],
        ["   c. Efficacy of Repairs", structuralChanges[0]?.repair_efficacy || "Data Not Availble"],
        ["   d. Cost of Repairs", structuralChanges[0]?.repair_cost || "Data Not Availble"],
        ["5. Type of Cement Used", audit.cement_type],
        ["6. Type of Steel ", audit.steel_type],
        ["7. Observations", conclusion[0]?.conclusion || "Data Not Availble"],
        ["8. Areas of Immediate Concern", immediateConcerns[0]?.description || "Data Not Availble"],
      ],
    };

    // Function to draw a table
    const drawTable = (doc, table, startX, startY, rowHeight = 20, colWidths = [150, 350]) => {
      let y = startY;

      // Draw headers
      doc.font("Helvetica-Bold").fontSize(12);
      doc.rect(startX, y, colWidths[0], rowHeight).stroke();
      doc.rect(startX + colWidths[0], y, colWidths[1], rowHeight).stroke();
      doc.text(table.headers[0], startX + 5, y + 5);
      doc.text(table.headers[1], startX + colWidths[0] + 5, y + 5);
      y += rowHeight;

      // Draw rows
      doc.font("Helvetica").fontSize(11);
      table.rows.forEach((row) => {
        doc.rect(startX, y, colWidths[0], rowHeight).stroke();
        doc.rect(startX + colWidths[0], y, colWidths[1], rowHeight).stroke();
        doc.text(row[0], startX + 5, y + 5);
        doc.text(row[1], startX + colWidths[0] + 5, y + 5);
        y += rowHeight;
      });
    };

    // Draw the table at position (50, 150)
    drawTable(doc, table, 50, 150);

    /// 📌 NDT Test Results Table
    if (ndtTests.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("NDT Test Results", { underline: true });
      doc.moveDown(1);

      const ndtTable = {
        headers: ["Test Type", "Value", "Quality", "Recommendation", "Conclusion"],
        rows: [],
      };

      // Loop through all tests and parse JSON data
      ndtTests.forEach((ndt) => {
        Object.keys(ndt).forEach((key) => {
          if (key !== "id" && ndt[key]) {
            try {
              const data = JSON.parse(ndt[key]); // Parse stored JSON test results
              ndtTable.rows.push([
                key.replace(/_/g, " "), // Format test type name
                data.value || "N/A",
                data.quality || "N/A",
                data.recommendation || "N/A",
                ndt.conclusion || "N/A",
              ]);
            } catch (error) {
              ndtTable.rows.push([
                key.replace(/_/g, " "),
                "Invalid Data",
                "Invalid Data",
                "Invalid Data",
                ndt.conclusion || "N/A",
              ]);
            }
          }
        });
      });

      // Function to draw table
      const drawTable3 = (doc, table, startX, startY, rowHeight = 25, colWidths = [150, 80, 100, 200, 120]) => {
        let y = startY;

        // Draw headers
        doc.font("Helvetica-Bold").fontSize(12);
        colWidths.forEach((width, index) => {
          doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
          doc.text(table.headers[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 7);
        });
        y += rowHeight;

        // Draw rows
        doc.font("Helvetica").fontSize(11);
        table.rows.forEach((row) => {
          colWidths.forEach((width, index) => {
            doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
            doc.text(row[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 7);
          });
          y += rowHeight;
        });
      };

      // Draw the NDT Test Table at position (50, 150)
      drawTable3(doc, ndtTable, 50, 150);
    }


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
