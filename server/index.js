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

    // Fetch related data (using simple queries for brevity)
    const [structuralChanges] = await db.execute(`SELECT * FROM StructuralChanges WHERE audit_id = ?`, [auditId]);
    const [observations] = await db.execute(`SELECT * FROM Observations WHERE audit_id = ?`, [auditId]);
    const [immediateConcerns] = await db.execute(`SELECT * FROM ImmediateConcerns WHERE audit_id = ?`, [auditId]);
    const [ndtTests] = await db.execute(`SELECT * FROM NDTTests WHERE audit_id = ?`, [auditId]);
    const [conclusion] = await db.execute(`SELECT * FROM AuditConclusions WHERE audit_id = ?`, [auditId]);
    const [damageEntries] = await db.execute(`SELECT * FROM DamageEntries WHERE audit_id = ?`, [auditId]);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Audit_Report_${auditId}.pdf`);
    doc.pipe(res);

    // ─── COVER PAGE ─────────────────────────────────────────────────────────────
    // Use a large title and display building name & location (similar to your sample)
    doc.fontSize(28).text("Structural Audit Report", { align: "center", underline: true });
    doc.moveDown(2);
    doc.fontSize(22).text(audit.name || "Building Name Not Available", { align: "center" });
    doc.moveDown();
    doc.fontSize(18).text(audit.location || "Location Not Available", { align: "center" });
    doc.addPage();

    // ─── TABLE OF CONTENTS ─────────────────────────────────────────────────────────
    doc.fontSize(20).text("Table of Contents", { underline: true });
    doc.moveDown();
    const contents = [
      "Introduction",
      "Scope of Work",
      "Purpose of Investigation",
      "History / Salient Features",
      "Proforma-B",
      "Visual Observations",
      "Damage Observations",
      "Non-Destructive Testing (NDT) Results",
      "Conclusion & Recommendations"
    ];
    contents.forEach((item, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${item}`);
    });
    doc.addPage();

    // ─── INTRODUCTION ─────────────────────────────────────────────────────────────
    doc.fontSize(16).text("1. INTRODUCTION", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      `M/s ${auditor.firm_name} has been appointed to inspect and assess the condition of “${audit.name}” located at ${audit.location}.`
    );
    doc.moveDown();
    doc.text(
      "A comprehensive visual inspection was conducted along with non-destructive testing to evaluate the structure’s integrity and identify any areas of concern."
    );
    doc.addPage();

    // ─── SCOPE & PURPOSE & HISTORY ────────────────────────────────────────────────
    // Scope of Work
    doc.fontSize(16).text("2. SCOPE OF WORK", { underline: true });
    doc.moveDown();
    if (structuralChanges.length > 0) {
      structuralChanges.forEach((change, index) => {
        doc.fontSize(12).text(`${index + 1}. ${change.scope_of_work || "Data Not Available"}`, { paragraphGap: 5 });
      });
    } else {
      doc.fontSize(12).text("Data Not Available");
    }
    doc.addPage();

    // Purpose of Investigation
    doc.fontSize(16).text("3. PURPOSE OF INVESTIGATION", { underline: true });
    doc.moveDown();
    if (structuralChanges.length > 0) {
      structuralChanges.forEach((change, index) => {
        doc.fontSize(12).text(`${index + 1}. ${change.purpose_of_investigation || "Data Not Available"}`);
      });
    } else {
      doc.fontSize(12).text("Data Not Available");
    }
    doc.addPage();

    // History / Salient Features
    doc.fontSize(16).text("4. HISTORY / SALIENT FEATURES", { underline: true });
    doc.moveDown();
    if (structuralChanges.length > 0) {
      structuralChanges.forEach((change, index) => {
        doc.fontSize(12).text(`${index + 1}. ${change.brief_history_details || "Data Not Available"}`);
      });
    } else {
      doc.fontSize(12).text("Data Not Available");
    }
    doc.addPage();

    // ─── HELPER FUNCTIONS FOR DYNAMIC TABLE DRAWING ──────────────────────────────
    function wrapText(doc, text, maxWidth) {
      const words = text.split(" ");
      let line = "";
      const lines = [];
      words.forEach(word => {
        const testLine = line + word + " ";
        if (doc.widthOfString(testLine) > maxWidth) {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      });
      if (line) lines.push(line.trim());
      return lines;
    }

    function drawDynamicTableWithImages(doc, table, startX, startY, colWidths, options = {}) {
      const {
        headerFont = "Helvetica-Bold",
        headerFontSize = 12,
        rowFont = "Helvetica",
        rowFontSize = 10,
        cellPadding = 5,
        // You can set a default image height if you like
        defaultImageHeight = 80,
      } = options;

      // Helper: measure text height
      const measureTextHeight = (text, width) => {
        return doc.heightOfString(text, { width }) + 2 * cellPadding;
      };

      // Helper: measure image height (a simple fixed approach)
      const measureImageHeight = (buffer, maxWidth) => {
        // For a quick approach, just return a fixed height:
        return defaultImageHeight + 2 * cellPadding;

        // (Optional) For a more accurate approach, you'd decode the image dimensions
        // (using 'image-size' library or similar) and scale it to fit maxWidth.
      };

      let y = startY;

      // 1) Draw headers and compute header height
      doc.font(headerFont).fontSize(headerFontSize);
      let headerHeight = 0;
      table.headers.forEach((header, i) => {
        const textHeight = measureTextHeight(header, colWidths[i] - 2 * cellPadding);
        headerHeight = Math.max(headerHeight, textHeight);
      });
      // Render header cells
      table.headers.forEach((header, i) => {
        const x = startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
        doc.rect(x, y, colWidths[i], headerHeight).stroke();
        doc.text(header, x + cellPadding, y + cellPadding, {
          width: colWidths[i] - 2 * cellPadding,
        });
      });
      y += headerHeight;

      // 2) Draw each row with dynamic height
      doc.font(rowFont).fontSize(rowFontSize);

      table.rows.forEach((row) => {
        // For each cell, measure either text or image
        const cellHeights = row.map((cell, i) => {
          if (cell && Buffer.isBuffer(cell)) {
            // It's an image
            return measureImageHeight(cell, colWidths[i] - 2 * cellPadding);
          } else {
            // It's text
            return measureTextHeight(cell?.toString() ?? "", colWidths[i] - 2 * cellPadding);
          }
        });

        const rowHeight = Math.max(...cellHeights);

        // Page break if needed
        if (y + rowHeight > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }

        // Now draw each cell
        row.forEach((cell, i) => {
          const x = startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
          doc.rect(x, y, colWidths[i], rowHeight).stroke();

          // If cell is an image buffer
          if (cell && Buffer.isBuffer(cell)) {
            // Fit the image in the cell minus padding
            const imageX = x + cellPadding;
            const imageY = y + cellPadding;
            const imageWidth = colWidths[i] - 2 * cellPadding;
            const imageHeight = rowHeight - 2 * cellPadding;

            // Render the image
            doc.image(cell, imageX, imageY, {
              fit: [imageWidth, imageHeight],
              align: "center",
              valign: "center",
            });
          } else {
            // Render text
            doc.text(cell?.toString() ?? "N/A", x + cellPadding, y + cellPadding, {
              width: colWidths[i] - 2 * cellPadding,
              align: "left",
            });
          }
        });

        // Move to the next row
        y += rowHeight;
      });
    }

    function drawDynamicTable(doc, table, startX, startY, colWidths, options = {}) {
      const {
        headerFont = "Helvetica-Bold",
        headerFontSize = 12,
        rowFont = "Helvetica",
        rowFontSize = 10,
        cellPadding = 5,
      } = options;

      let y = startY;

      // Draw headers and compute header height
      doc.font(headerFont).fontSize(headerFontSize);
      let headerHeight = 0;
      table.headers.forEach((header, i) => {
        const h = doc.heightOfString(header, { width: colWidths[i] - 2 * cellPadding });
        headerHeight = Math.max(headerHeight, h + 2 * cellPadding);
      });
      table.headers.forEach((header, i) => {
        const x = startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
        doc.rect(x, y, colWidths[i], headerHeight).stroke();
        doc.text(header, x + cellPadding, y + cellPadding, { width: colWidths[i] - 2 * cellPadding });
      });
      y += headerHeight;

      // Draw each row with dynamic height
      doc.font(rowFont).fontSize(rowFontSize);
      table.rows.forEach(row => {
        const cellHeights = row.map((cell, i) => {
          return doc.heightOfString(cell.toString(), { width: colWidths[i] - 2 * cellPadding }) + 2 * cellPadding;
        });
        const rowHeight = Math.max(...cellHeights);

        // New page if overflow
        if (y + rowHeight > doc.page.height - 50) {
          doc.addPage();
          y = 50;
        }

        row.forEach((cell, i) => {
          const x = startX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
          doc.rect(x, y, colWidths[i], rowHeight).stroke();
          doc.text(cell.toString(), x + cellPadding, y + cellPadding, { width: colWidths[i] - 2 * cellPadding });
        });
        y += rowHeight;
      });
    }

    // ─── PROFORMA-B ───────────────────────────────────────────────────────────────
    doc.addPage();
    doc.fontSize(16).text("5. PROFORMA-B", { underline: true });
    const proformaB = {
      headers: ["Item", "Details"],
      rows: [
        ["1. Name of Building", audit.name || "No data available"],
        ["a. Location", audit.location || "No data available"],
        ["b. Area Of Building", audit.area || "No data available"],
        ["c. Types Of Structure", audit.structure_type || "No data available"],
        ["d. Number of Stories", audit.number_of_stories || "No data available"],
        ["2. Year of Construction", audit.year_of_construction || "No data available"],
        ["3. Uses Of Building", ""],
        ["a. Designed Use", audit.designed_use || "No data available"],
        ["b. Present Use", audit.present_use || "No data available"],
        ["c. Any change in use", audit.changes_in_building || "No data available"],
        ["4. History of Structure", ""],
        [
          "a. Year of repairs:",
          (structuralChanges[0] && structuralChanges[0].date_of_change)
            ? new Date(structuralChanges[0].date_of_change).toLocaleDateString("en-GB")
            : "No data available"
        ],
        [
          "5. Type of Cement (OPC/PPC/SRC etc.)",
          audit.cement_type || "No data available"
        ],
        [
          "6. Type of Steel Reinforcement",
          audit.steel_type || "No data available"
        ],
        [
          "7. Visual Observations Conclusion",
          (damageEntries[0] && damageEntries[0].description) || "No data available"
        ],
        [
          "8. Areas of Immediate Concern",
          (immediateConcerns[0] && immediateConcerns[0].concern_description) || "No data available"
        ]
      ]
    };
    const proformaColWidths = [200, 300];
    drawDynamicTable(doc, proformaB, 50, 150, proformaColWidths, { headerFontSize: 12, rowFontSize: 10 });

    // ─── VISUAL OBSERVATIONS ─────────────────────────────────────────────────────
    if (observations.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("6. VISUAL OBSERVATIONS", { underline: true });
      const obsTable = {
        headers: ["Observation", "Status"],
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
      const obsColWidths = [300, 100];
      drawDynamicTable(doc, obsTable, 50, 150, obsColWidths, { headerFontSize: 10, rowFontSize: 10 });
    }

    // ─── DAMAGE OBSERVATIONS ─────────────────────────────────────────────────────
    // ─── DAMAGE OBSERVATIONS ─────────────────────────────────────────────────────
    if (damageEntries.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("7. DAMAGE OBSERVATIONS", { underline: true });

      // Create a table definition with 5 columns: 4 for text + 1 for the photo
      const damageTable = {
        headers: ["Description", "Location", "Cause", "Classification", "Photo"],
        rows: damageEntries.map((damage) => [
          damage.description || "N/A",
          damage.location || "N/A",
          damage.cause || "N/A",
          damage.classification || "N/A",
          damage.damage_photos || null // The LONGBLOB from DB
        ]),
      };

      // Adjust your column widths (5 columns now)
      const damageColWidths = [100, 100, 100, 100, 100]; // total ~500px for example

      // Draw the table (we'll define an enhanced drawDynamicTable below)
      drawDynamicTableWithImages(doc, damageTable, 50, 150, damageColWidths, {
        headerFontSize: 10,
        rowFontSize: 9,
      });
    }
    // ─── NDT TEST RESULTS ─────────────────────────────────────────────────────────
    if (ndtTests.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("8. NON-DESTRUCTIVE TESTING (NDT) RESULTS", { underline: true });
      const ndtTable = { headers: ["Test Type", "Value", "Quality", "Recommendation"], rows: [] };
      ndtTests.forEach(ndt => {
        Object.keys(ndt).forEach(key => {
          if (key !== "id" && ndt[key]) {
            try {
              const data = JSON.parse(ndt[key]);
              ndtTable.rows.push([
                key.replace(/_/g, " "),
                data.value || "N/A",
                data.quality || "N/A",
                data.recommendation || "N/A"
              ]);
            } catch (error) {
              ndtTable.rows.push([
                key.replace(/_/g, " "),
                "Invalid Data",
                "Invalid Data",
                "Invalid Data"
              ]);
            }
          }
        });
      });
      const pageWidth = doc.page.width - 100;
      const ndtColWidths = [pageWidth * 0.25, pageWidth * 0.2, pageWidth * 0.2, pageWidth * 0.35];
      drawDynamicTable(doc, ndtTable, 50, 150, ndtColWidths, { headerFontSize: 12, rowFontSize: 11 });
    }

    // ─── CONCLUSION & RECOMMENDATIONS ─────────────────────────────────────────────
    if (conclusion.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("9. CONCLUSION & RECOMMENDATIONS", { underline: true });
      doc.moveDown();
      doc.fontSize(12)
        .text("Conclusion:", { continued: true })
        .font("Helvetica-Bold")
        .text(` ${conclusion[0].conclusion || "N/A"}`);
      doc.font("Helvetica")
        .text("\nRecommendations:", { continued: true })
        .font("Helvetica-Bold")
        .text(` ${conclusion[0].recommendations || "N/A"}`);
      doc.font("Helvetica")
        .text("\nTechnical Comments:", { continued: true })
        .font("Helvetica-Bold")
        .text(` ${conclusion[0].technical_comments || "N/A"}`);
      doc.font("Helvetica")
        .text("\n\nApproved By:")
        .text(`\nExecutive Engineers: ${conclusion[0].executive_engineers || "___________________"}`)
        .text(`\nSuperintending Engineers: ${conclusion[0].superintending_engineers || "___________________"}`)
        .text(`\nChief Engineers: ${conclusion[0].chief_engineers || "___________________"}`);
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
