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

app.post("/register", async (req, res) => {
  try {
    const {
      name,
      qualification,
      specialization,
      firmName,
      generalExperience,
      specializedExperience,
      employmentPeriod,
      email,
      password,
      termsAccepted,
    } = req.body;

    // ✅ Ensure Terms are Accepted
    if (!termsAccepted) {
      return res.status(400).json({ message: "You must accept the terms and conditions." });
    }

    // ✅ Email Format Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // ✅ Check if Email Already Exists
    const [existingUser] = await db.execute(`SELECT email FROM Auditors WHERE email = ?`, [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // ✅ Password Validation
    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-zA-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters, include 1 number & 1 special character.",
      });
    }

    // ✅ Hash Password Before Storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert Data into DB
    const sql = `
      INSERT INTO Auditors 
      (name, qualification, specialization, firm_name, general_experience, specialized_experience, employment_period, email, password, terms_accepted) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await db.execute(sql, [
      name,
      qualification,
      specialization,
      firmName,
      generalExperience,
      specializedExperience,
      employmentPeriod,
      email,
      hashedPassword,
      termsAccepted,
    ]);

    res.status(201).json({ message: "Auditor registered successfully." });
  } catch (error) {
    console.error("Error registering:", error);
    res.status(500).json({ message: "Failed to register auditor. Please try again later." });
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

// ✅ Check if email is registered
app.post("/api/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await db.execute("SELECT * FROM Auditors WHERE email = ?", [email]);
    res.json({ exists: rows.length > 0 });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update Password
app.post("/api/update-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE Auditors SET password = ? WHERE email = ?", [hashedPassword, email]);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
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
      FROM Audits WHERE auditor_id = ? ORDER BY date_of_audit DESC`,
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

app.get("/api/audits/:auditId/full", async (req, res) => {
  try {
    const { auditId } = req.params;

    // Fetch audit details
    const [auditResult] = await db.execute(`SELECT * FROM Audits WHERE id = ?`, [auditId]);
    if (auditResult.length === 0) {
      return res.status(404).json({ message: "Audit not found" });
    }
    const audit = auditResult[0];

    // Fetch related tables
    const [observations] = await db.execute(`SELECT * FROM Observations WHERE audit_id = ?`, [auditId]);
    let [dataEntries] = await db.execute(`SELECT * FROM DamageEntries WHERE audit_id = ?`, [auditId]);

    // 🔹 Convert `damage_photos` BLOB to Base64
    dataEntries = dataEntries.map((entry) => ({
      ...entry,
      damage_photos: entry.damage_photos ? entry.damage_photos.toString("base64") : null,
    }));

    const [ndtTests] = await db.execute(`SELECT * FROM NDTTests WHERE audit_id = ?`, [auditId]);

    // 🔹 Return full audit details
    res.json({ audit, observations, ndtTests, dataEntries });
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
      SELECT concern_description, location, effect_description, recommended_measures, 
             TO_BASE64(damage_photo) AS damage_photo 
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

app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      `SELECT id, message, is_read, type, 
       DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') AS timestamp
       FROM Notifications WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});


app.delete('/api/notifications/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute(
      `DELETE FROM Notifications WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

app.delete('/api/notifications/clear', authenticate, async (req, res) => {
  try {
    await db.execute(
      `DELETE FROM Notifications WHERE user_id = ? AND is_read = TRUE`,
      [req.user.id]
    );
    res.json({ message: "All read notifications cleared successfully" });
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
    doc.fontSize(16).text(`${audit.name}`, { align: "center" });
    doc.fontSize(14).text(`${audit.location}`, { align: "center" });
    doc.addPage()

    // ===== Page 2: Table of Contents =====
    doc.fontSize(16).text("CONTENTS", { underline: true });
    const contents = [
      "1. Introduction ....................................... 3",
      "2. Scope of Work ..................................... 4",
      "3. Purpose of Investigation .......................... 4",
      "4. History/Salient Features .......................... 5",
      "5. Limitations ........................................ 6",
      "6. Proforma-B ......................................... 7",
      "7. Detailed Observations ............................. 13",
      "8. Non-Destructive Testing .......................... 31",
      "9. Recommendations .................................. 39",
      "10. Conclusion ....................................... 40"
    ];
    contents.forEach(item => doc.fontSize(12).text(item));
    doc.addPage();

    // ===== Page 3: Introduction =====
    doc.fontSize(16).text("1. INTRODUCTION", { underline: true });
    doc.fontSize(12).text(
      `M/s ${auditor.firm_name} was appointed to inspect and analyze the condition of "${audit.name}" situated at ${audit.location} and subsequently submit an audit report.`,
      { paragraphGap: 5 }
    );
    doc.fontSize(12).text("Accordingly, a team of expert and engineers carried out a series of detailed visual inspection. Besides the inspection, material testing by adopting specialized 'Non Destructive Testing' techniques was also carried out in a proper sequence. In line with this, Non-Destructive Tests (N.D.T) like Ultrasonic Pulse Velocity (USPV), Cover Meter, Carbonation, Concrete Core Strength, Rebound Hammer, Half-Cell Potential, Chemical Analysis etc. were conducted.", { paragraphGap: 5 });
    doc.fontSize(12).text("This was done mainly to identify distresses; if any, and their effects on the structural stability and serviceability of the structure.", { paragraphGap: 5 });
    doc.fontSize(12).text("The Inspection Report' comprising of Observations, Non Destructive Testing Reports, Inference of NDT, Photographs of distresses and Emerging Recommendations etc. is attached herewith.", { paragraphGap: 5 });

    // ===== Page 4: Scope & Purpose ===== 
    doc.addPage();
    doc.fontSize(16).text("2. SCOPE OF WORK", { underline: true });
    doc.fontSize(12).text(`${structuralChanges.scope_of_work}`, { paragraphGap: 5 });

    doc.fontSize(16).text("3. PURPOSE OF INVESTIGATION", { underline: true });
    doc.fontSize(12).text(`${structuralChanges.purpose_of_investigation}`);

    doc.fontSize(16).text("3. HISTORY/SALIENT FEATURES OF THE STRUCTURE", { underline: true });
    doc.fontSize(12).text(`${structuralChanges.brief_history_details}`);


     // ===== Proforma-B =====
     doc.addPage();
     doc.fontSize(16).text("6. PROFORMA-B", { underline: true });
     const proformaB = {
       headers: ["Item", "Details"],
       rows: [
         ["1. Name of Building", audit.name || "No data availble."],
         ["a. Location", audit.location || "No data availble."],
         ["b. Area Of Building", audit.area || "No data availble."],
         ["c. Types Of Structure", audit.structure_type || "No data availble."],
         ["d. Number of Stories", audit.number_of_stories || "No data availble."],
         ["2. Year of Construction", audit.year_of_construction || "No data availble."],
         ["3. Uses Of Building"],
         ["a. Designed Use", audit.designed_use || "No data availble."],
         ["b. Present Use", audit.present_use || "No data availble."],
         ["c. Any other change in building use", audit.changes_in_building || "No data availble."],
         ["4. History of structure"],
         ["a. Year of carrying out repairs:", structuralChanges.date_of_change || "No data availble."],

         ["5. Type of cement used (OPC/PPC)/ SRC/ any other in original construction):",audit.cement_type || "No data availble."],
         ["6. Type of steel reinforcement (Mild steel/Cold twisted steel/TMT/any other steel",audit.steel_type || "No data availble."],
         ["7. Visual observations Conclusion:",damageEntries.description || "No data availble."],
         ["8. Areas of immediate concern: ",immediateConcerns.concern_description || "No data availble."],

       ]
     };
     drawProformaTable(doc, proformaB);
     

    const formatDate = (dateString) => {
      if (!dateString) return "Data Not Available";
      const date = new Date(dateString);
      return isNaN(date) ? "Invalid Date" : date.toLocaleDateString("en-GB"); // Formats as DD/MM/YYYY
    };

    if (observations.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("Visual Observations", { underline: true });
      doc.moveDown(1);

      // Define headers & rows dynamically
      const obsTable = {
        headers: ["Observation Name", "Status"],
        rows: [
          ["Unexpected Load", observations[0].unexpected_load ? "Yes" : "No"],
          ["Unapproved Changes", observations[0].unapproved_changes ? "Yes" : "No"],
          ["Additional Floor", observations[0].additional_floor ? "Yes" : "No"],
          ["Vegetation Growth", observations[0].vegetation_growth ? "Yes" : "No"],
          ["Leakage", observations[0].leakage ? "Yes" : "No"],
          ["Cracks in Beams", observations[0].cracks_beams ? "Yes" : "No"],
          ["Cracks in Columns", observations[0].cracks_columns ? "Yes" : "No"],
          ["Cracks in Flooring", observations[0].cracks_flooring ? "Yes" : "No"],
          ["Floor Sagging", observations[0].floor_sagging ? "Yes" : "No"],
          ["Bulging Walls", observations[0].bulging_walls ? "Yes" : "No"],
          ["Window Problems", observations[0].window_problems ? "Yes" : "No"],
          ["Heaving Floor", observations[0].heaving_floor ? "Yes" : "No"],
          ["Concrete Texture", observations[0].concrete_texture ? "Yes" : "No"],
          ["Algae Growth", observations[0].algae_growth ? "Yes" : "No"]
        ]
      };

      // Function to draw a responsive table
      const drawTable = (doc, table, startX, startY, rowHeight = 25, colWidths = [300, 100]) => {
        let y = startY;

        // Draw headers
        doc.font("Helvetica-Bold").fontSize(10);
        colWidths.forEach((width, index) => {
          doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
          doc.text(table.headers[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 7);
        });
        y += rowHeight;

        // Draw rows
        doc.font("Helvetica").fontSize(10);
        table.rows.forEach((row) => {
          colWidths.forEach((width, index) => {
            doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
            doc.text(row[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 7);
          });
          y += rowHeight;
        });
      };

      // Draw the table at (50, 150) position
      drawTable(doc, obsTable, 50, 150);
    }


    if (damageEntries.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("Damage Observations", { underline: true });
      doc.moveDown(1);

      // Define table headers & rows dynamically
      const damageTable = {
        headers: ["Description", "Location", "Cause", "Classification"],
        rows: damageEntries.map((damage) => [
          damage.description || "N/A",
          damage.location || "N/A",
          damage.cause || "N/A",
          damage.classification || "N/A"
        ])
      };

      // Function to draw a responsive table
      const drawTable4 = (doc, table, startX, startY, rowHeight = 25, colWidths = []) => {
        let y = startY;

        // Auto-assign column widths if not provided
        if (colWidths.length === 0) {
          const totalWidth = 500; // Max table width
          const numCols = table.headers.length;
          colWidths = new Array(numCols).fill(totalWidth / numCols);
        }

        // Draw headers
        doc.font("Helvetica-Bold").fontSize(10);
        colWidths.forEach((width, index) => {
          doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
          doc.text(table.headers[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 2, y + 7, { width: width - 4, align: "center" });
        });
        y += rowHeight;

        // Draw rows
        doc.font("Helvetica").fontSize(9);
        table.rows.forEach((row) => {
          colWidths.forEach((width, index) => {
            doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
            doc.text(row[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 2, y + 7, { width: width - 4, align: "center" });
          });
          y += rowHeight;
        });
      };

      // Draw the Damage Observations table at (50, 150) position
      drawTable4(doc, damageTable, 50, 150);
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
                key.replace(/_/g, " "), // Format test type name
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

      // 📌 Function to Wrap Text Manually
      const wrapText = (doc, text, maxWidth) => {
        const words = text.split(" ");
        let line = "";
        const lines = [];

        words.forEach((word) => {
          const testLine = line + word + " ";
          const testWidth = doc.widthOfString(testLine);

          if (testWidth > maxWidth) {
            lines.push(line.trim());
            line = word + " ";
          } else {
            line = testLine;
          }
        });

        lines.push(line.trim()); // Push the last line
        return lines;
      };

      // 📌 Function to Draw a Dynamic Table
      const drawTable1 = (doc, table, startX, startY, colWidths) => {
        let y = startY;
        const rowHeight = 20; // Default row height

        const pageHeight = doc.page.height - 50; // Adjust for footer/margins
        let maxRowHeight = rowHeight; // Keep track of the largest row height

        // 📌 Draw Headers
        doc.font("Helvetica-Bold").fontSize(12);
        colWidths.forEach((width, index) => {
          doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, width, rowHeight).stroke();
          doc.text(table.headers[index], startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 7);
        });
        y += maxRowHeight;

        // 📌 Draw Rows
        doc.font("Helvetica").fontSize(11);
        table.rows.forEach((row) => {
          maxRowHeight = rowHeight; // Reset maxRowHeight for each row

          // Determine row height dynamically
          const cellHeights = row.map((text, index) => wrapText(doc, text, colWidths[index] - 10).length * 12 + 8);
          maxRowHeight = Math.max(...cellHeights);

          // Check if we need a new page
          if (y + maxRowHeight > pageHeight) {
            doc.addPage();
            y = 50; // Reset Y position for new page
          }

          // Draw each cell with wrapped text
          row.forEach((text, index) => {
            const textLines = wrapText(doc, text, colWidths[index] - 10);
            doc.rect(startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y, colWidths[index], maxRowHeight).stroke();
            textLines.forEach((line, i) => {
              doc.text(line, startX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 5, y + 5 + i * 12);
            });
          });

          y += maxRowHeight;
        });
      };

      // 📌 Define Column Widths (Adjustable for Responsive Layout)
      const pageWidth = doc.page.width - 100;
      const colWidths = [pageWidth * 0.25, pageWidth * 0.2, pageWidth * 0.2, pageWidth * 0.35];

      // 📌 Draw the NDT Test Table at position (50, 150)
      drawTable1(doc, ndtTable, 50, 150, colWidths);
    }

    doc.addPage();
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

function drawProformaTable(doc, table) {
  const startX = 50, startY = 150, colWidths = [200, 300];
  let y = startY;

  // Headers
  doc.font("Helvetica-Bold")
     .rect(startX, y, colWidths[0], 20).stroke()
     .text(table.headers[0], startX + 5, y + 5)
     .rect(startX + colWidths[0], y, colWidths[1], 20).stroke()
     .text(table.headers[1], startX + colWidths[0] + 5, y + 5);
  y += 20;

  // Rows
  doc.font("Helvetica");
  table.rows.forEach(row => {
    doc.rect(startX, y, colWidths[0], 20).stroke()
       .text(row[0], startX + 5, y + 5)
       .rect(startX + colWidths[0], y, colWidths[1], 20).stroke()
       .text(row[1], startX + colWidths[0] + 5, y + 5);
    y += 20;
  });
}
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
