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
      otherCementType,
      steelType,
      otherSteelType,
      numberOfStories,
      designedUse,
      presentUse,
      changesInBuilding,
      distressYear,
      distressNature,
    } = req.body;

    // Required fields validation
    const requiredFields = [
      { key: "name", value: name },
      { key: "location", value: location },
      { key: "yearOfConstruction", value: yearOfConstruction },
      { key: "dateOfAudit", value: dateOfAudit },
      { key: "area", value: area },
      { key: "structureType", value: structureType },
      { key: "cementType", value: cementType },
      { key: "steelType", value: steelType },
      { key: "numberOfStories", value: numberOfStories },
      { key: "designedUse", value: designedUse },
      { key: "presentUse", value: presentUse },
    ];

    const missingFields = requiredFields
      .filter((field) => !field.value)
      .map((field) => field.key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Function to safely format dates
    const formatDate = (date) => {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString().split("T")[0];
    };

    // Format date fields
    const formattedDate = formatDate(dateOfAudit);
    const formattedDistressYear = distressYear ? parseInt(distressYear, 10) : null;

    if (!formattedDate) {
      return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
    }

    // Handle "Other" selections
    const finalCementType = cementType === "Other" ? "Other" : cementType.trim();
    const finalSteelType = steelType === "Other" ? "Other" : steelType.trim();
    const storedOtherCementType = cementType === "Other" ? otherCementType?.trim() || null : null;
    const storedOtherSteelType = steelType === "Other" ? otherSteelType?.trim() || null : null;

    // Ensure numerical fields are valid
    const parsedYearOfConstruction = parseInt(yearOfConstruction, 10);
    const parsedArea = parseFloat(area);
    const parsedNumberOfStories = parseInt(numberOfStories, 10);

    if (isNaN(parsedYearOfConstruction) || parsedYearOfConstruction < 1800) {
      return res.status(400).json({ message: "Invalid year of construction." });
    }
    if (isNaN(parsedArea) || parsedArea <= 0) {
      return res.status(400).json({ message: "Invalid area value." });
    }
    if (isNaN(parsedNumberOfStories) || parsedNumberOfStories <= 0) {
      return res.status(400).json({ message: "Number of stories must be a positive number." });
    }

    // Insert audit into database
    const sql = `
      INSERT INTO Audits (
        auditor_id, name, location, year_of_construction, date_of_audit, area, structure_type,
        cement_type, other_cement_type, steel_type, other_steel_type, number_of_stories, 
        designed_use, present_use, changes_in_building, distress_year, distress_nature
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const [result] = await db.execute(sql, [
      req.user.id,
      name.trim(),
      location.trim(),
      parsedYearOfConstruction,
      formattedDate,
      parsedArea,
      structureType.trim(),
      finalCementType,
      storedOtherCementType,
      finalSteelType,
      storedOtherSteelType,
      parsedNumberOfStories,
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

    // Fetch NDT test results
    const [ndtTests] = await db.execute(`SELECT * FROM NDTTests WHERE audit_id = ?`, [auditId]);

    // 🔹 Ensure all fields exist but only show filled values
    const formattedNdtTests = ndtTests.map((test) => {
      return {
        rebound_index: test.rebound_index || "N/A",
        rebound_quality: test.rebound_quality || "N/A",
        rebound_recommendation: test.rebound_recommendation || "N/A",
        rebound_hammer_image: test.rebound_hammer_image ? test.rebound_hammer_image.toString("base64") : null,

        ultrasonic_pulse_velocity: test.ultrasonic_pulse_velocity || "N/A",
        ultrasonic_concrete_quality: test.ultrasonic_concrete_quality || "N/A",
        ultrasonic_recommendation: test.ultrasonic_recommendation || "N/A",
        ultrasonic_image: test.ultrasonic_image ? test.ultrasonic_image.toString("base64") : null,

        core_diameter: test.core_diameter || "N/A",
        core_length: test.core_length || "N/A",
        lD_Ratio: test.lD_Ratio || "N/A",
        measured_strength: test.measured_strength || "N/A",
        corrected_strength: test.corrected_strength || "N/A",
        density: test.density || "N/A",
        core_sampling_recommendation: test.core_sampling_recommendation || "N/A",
        core_sampling_image: test.core_sampling_image ? test.core_sampling_image.toString("base64") : null,

        carbonation_depth: test.carbonation_depth || "N/A",
        carbonation_ph_level: test.carbonation_ph_level || "N/A",
        carbonation_recommendation: test.carbonation_recommendation || "N/A",
        carbonation_image: test.carbonation_image ? test.carbonation_image.toString("base64") : null,

        chloride_content: test.chloride_content || "N/A",
        chloride_corrosion_risk: test.chloride_corrosion_risk || "N/A",
        chloride_recommendation: test.chloride_recommendation || "N/A",
        chloride_image: test.chloride_image ? test.chloride_image.toString("base64") : null,

        sulfate_content: test.sulfate_content || "N/A",
        sulfate_deterioration_risk: test.sulfate_deterioration_risk || "N/A",
        sulfate_recommendation: test.sulfate_recommendation || "N/A",
        sulfate_image: test.sulfate_image ? test.sulfate_image.toString("base64") : null,

        half_cell_potential_value: test.half_cell_potential_value || "N/A",
        corrosion_probability: test.corrosion_probability || "N/A",
        half_cell_potential_recommendation: test.half_cell_potential_recommendation || "N/A",
        half_cell_potential_image: test.half_cell_potential_image ? test.half_cell_potential_image.toString("base64") : null,

        concrete_cover_required: test.concrete_cover_required || "N/A",
        concrete_cover_measured: test.concrete_cover_measured || "N/A",
        concrete_cover_deficiency: test.concrete_cover_deficiency || "N/A",
        concrete_cover_structural_risk: test.concrete_cover_structural_risk || "N/A",
        concrete_cover_recommendation: test.concrete_cover_recommendation || "N/A",
        concrete_cover_image: test.concrete_cover_image ? test.concrete_cover_image.toString("base64") : null,

        original_rebar_diameter: test.original_rebar_diameter || "N/A",
        measured_rebar_diameter: test.measured_rebar_diameter || "N/A",
        rebar_reduction: test.rebar_reduction || "N/A",
        rebar_impact: test.rebar_impact || "N/A",
        rebar_recommendation: test.rebar_recommendation || "N/A",
        rebar_diameter_image: test.rebar_diameter_image ? test.rebar_diameter_image.toString("base64") : null,

        crushing_strength: test.crushing_strength || "N/A",
        crushing_strength_classification: test.crushing_strength_classification || "N/A",
        crushing_strength_recommendation: test.crushing_strength_recommendation || "N/A",
        crushing_strength_image: test.crushing_strength_image ? test.crushing_strength_image.toString("base64") : null,
      };
    });

    // 🔹 Return full audit details
    res.json({ audit, observations, ndtTests: formattedNdtTests, dataEntries });
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



// Fetch Audit History with Auditor Name
app.get('/api/audits/:auditId/history', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;
    const [history] = await db.execute(
      `SELECT AuditHistory.id, AuditHistory.audit_id, AuditHistory.action, 
              AuditHistory.timestamp, Auditors.name AS auditor_name
       FROM AuditHistory
       JOIN Auditors ON AuditHistory.user_id = Auditors.id
       WHERE AuditHistory.audit_id = ? 
       ORDER BY AuditHistory.timestamp DESC`,
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
             structural_changes, change_details, previous_investigation, previous_investigation_reports 
      FROM StructuralChanges 
      WHERE audit_id = ?`;

    const [structuralChanges] = await db.execute(sql, [auditId]);

    if (structuralChanges.length === 0) {
      return res.status(404).json({ message: "No structural changes found for this audit." });
    }

    // Convert BLOB to Base64
    const structuralWithBase64 = structuralChanges.map((item) => ({
      ...item,
      previous_investigation_reports: item.previous_investigation_reports ? item.previous_investigation_reports.toString('base64') : null
    }));

    res.json(structuralWithBase64);
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
  { name: "ultrasonicImage", maxCount: 1 }, // ✅ Ultrasonic Test Image
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

    // ✅ Extract and Validate Ultrasonic Test Data
    const testData = {
      rebound_index: req.body.rebound_index || null,
      rebound_quality: req.body.rebound_quality || null,
      rebound_recommendation: req.body.rebound_recommendation || null,

      // ✅ Updated Ultrasonic Test Fields (Matches Frontend)
      ultrasonic_pulse_velocity: req.body.ultrasonic_pulse_velocity || null,
      ultrasonic_concrete_quality: req.body.ultrasonic_concrete_quality || null,
      ultrasonic_recommendation: req.body.ultrasonic_recommendation || null,

      core_diameter: req.body.core_diameter || null,
      core_length: req.body.core_length || null,
      lD_Ratio: req.body.lD_Ratio || null,
      measured_strength: req.body.measured_strength || null,
      corrected_strength: req.body.corrected_strength || null,
      density: req.body.density || null,
      core_sampling_recommendation: req.body.core_sampling_recommendation || null,

      carbonation_depth: req.body.carbonation_depth || null,
      carbonation_ph_level: req.body.carbonation_ph_level || null,
      carbonation_recommendation: req.body.carbonation_recommendation || null,

      chloride_content: req.body.chloride_content || null,
      chloride_corrosion_risk: req.body.chloride_corrosion_risk || null,
      chloride_recommendation: req.body.chloride_recommendation || null,

      sulfate_content: req.body.sulfate_content || null,
      sulfate_deterioration_risk: req.body.sulfate_deterioration_risk || null,
      sulfate_recommendation: req.body.sulfate_recommendation || null,

      concrete_cover_required: req.body.concrete_cover_required || null,
      concrete_cover_measured: req.body.concrete_cover_measured || null,
      concrete_cover_deficiency: req.body.concrete_cover_deficiency || null,
      concrete_cover_structural_risk: req.body.concrete_cover_structural_risk || null,
      concrete_cover_recommendation: req.body.concrete_cover_recommendation || null,

      original_rebar_diameter: req.body.originalRebarDiameter || null,
      measured_rebar_diameter: req.body.measuredRebarDiameter || null,
      rebar_reduction: req.body.rebar_reduction || null,
      rebar_impact: req.body.rebar_impact || null,
      rebar_recommendation: req.body.rebar_recommendation || null,

      crushing_strength: req.body.crushing_strength || null,
      crushing_strength_classification: req.body.crushing_strength_classification || null,
      crushing_strength_recommendation: req.body.crushing_strength_recommendation || null,

      half_cell_potential_value: req.body.halfCellPotential || null,
      corrosion_probability: req.body.corrosion_probability || null,
      half_cell_potential_recommendation: req.body.half_cell_recommendation || null
    };

    // ✅ Updated Image Mapping
    const imageData = {
      rebound_hammer_image: req.files?.reboundHammerImage?.[0]?.buffer || null,
      ultrasonic_image: req.files?.ultrasonicImage?.[0]?.buffer || null, // ✅ Ultrasonic Test Image
      core_sampling_image: req.files?.coreSamplingImage?.[0]?.buffer || null,
      carbonation_image: req.files?.carbonationImage?.[0]?.buffer || null,
      chloride_image: req.files?.chlorideImage?.[0]?.buffer || null,
      sulfate_image: req.files?.sulfateImage?.[0]?.buffer || null,
      half_cell_potential_image: req.files?.halfCellPotentialImage?.[0]?.buffer || null,
      concrete_cover_image: req.files?.concreteCoverImage?.[0]?.buffer || null,
      rebar_diameter_image: req.files?.rebarDiameterImage?.[0]?.buffer || null,
      crushing_strength_image: req.files?.crushingStrengthImage?.[0]?.buffer || null
    };

    // ✅ Construct SQL Query Dynamically
    let columns = ["audit_id", ...Object.keys(testData), ...Object.keys(imageData)];
    let values = [auditId, ...Object.values(testData), ...Object.values(imageData)];
    let placeholders = columns.map(() => "?").join(", ");

    const sql = `INSERT INTO NDTTests (${columns.join(", ")}) VALUES (${placeholders})`;


    await db.execute(sql, values);

    // ✅ Log Audit History
    await logAuditHistory(auditId, "NDT Results submitted", req.user.id);

    res.json({ message: "✅ NDT results submitted successfully" });
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



app.get('/api/audits/:auditId/report', authenticate, async (req, res) => {
  try {
    const { auditId } = req.params;

    // 1) Fetch auditor details
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

    // 2) Fetch audit details
    const [auditResult] = await db.execute(
      `SELECT * FROM Audits WHERE id = ? AND auditor_id = ?`,
      [auditId, req.user.id]
    );
    if (auditResult.length === 0) {
      return res.status(404).json({ message: "Audit not found" });
    }
    const audit = auditResult[0];

    // 3) Fetch related data
    const [structuralChanges] = await db.execute(`SELECT * FROM StructuralChanges WHERE audit_id = ?`, [auditId]);
    const [observations] = await db.execute(`SELECT * FROM Observations WHERE audit_id = ?`, [auditId]);
    const [ndtTests] = await db.execute(`SELECT * FROM NDTTests WHERE audit_id = ?`, [auditId]);
    const [conclusion] = await db.execute(`SELECT * FROM AuditConclusions WHERE audit_id = ?`, [auditId]);
    const [damageEntries] = await db.execute(`SELECT * FROM DamageEntries WHERE audit_id = ?`, [auditId]);

    // 4) Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Audit_Report_${auditId}.pdf`);
    doc.pipe(res);

    /****************************************************************
     * HELPER FUNCTION: Draw a single TOC line with dotted fill
     ****************************************************************/
    function drawTOCLine(doc, label, page, x, y, maxWidth, options = {}) {
      const { font = 'Helvetica', fontSize = 12, dotLeader = '.', gapSize = 10 } = options;
      doc.font(font).fontSize(fontSize);
      const labelWidth = doc.widthOfString(label);
      const pageWidth = doc.widthOfString(page.toString());
      const dotsWidth = maxWidth - labelWidth - pageWidth - gapSize;
      if (dotsWidth < 0) {
        doc.text(`${label} ${page}`, x, y);
        return;
      }
      const dotSingleWidth = doc.widthOfString(dotLeader);
      const dotCount = Math.floor(dotsWidth / dotSingleWidth);
      const dots = dotLeader.repeat(dotCount);
      const line = `${label}${dots}${page}`;
      doc.text(line, x, y);
    }

    /****************************************************************
     * HELPER FUNCTION: Draw dynamic text table (text-only)
     ****************************************************************/
    function drawDynamicTable(doc, table, startX, startY, colWidths, options = {}) {
      const { headerFont = "Helvetica-Bold", headerFontSize = 12, rowFont = "Helvetica", rowFontSize = 10, cellPadding = 5 } = options;
      let y = startY;

      // 1) Draw headers
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

      // 2) Draw rows
      doc.font(rowFont).fontSize(rowFontSize);
      table.rows.forEach(row => {
        const cellHeights = row.map((cell, i) =>
          doc.heightOfString(cell.toString(), { width: colWidths[i] - 2 * cellPadding }) + 2 * cellPadding
        );
        const rowHeight = Math.max(...cellHeights);

        // Page break if needed
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

    /****************************************************************
     * HELPER FUNCTION: Show two images side by side (if possible),
     * plus a mini-table with "Location" & "Distress" from the first entry.
     ****************************************************************/
    // Helper function: Draw external observation table with images and a mini table
    function drawExternalObservationTable(doc, damageEntries, startX, startY) {
      let y = startY;
      const imageWidth = 180; // Fixed width for images
      const imageHeight = 140; // Fixed height for images
      const gap = 20; // Space between images
      const cellHeight = 30; // Height for text cells
      const rowHeight = imageHeight + cellHeight * 2 + 10; // Total row height (image + 2 text rows)
      const pageHeight = doc.page.height - doc.page.margins.bottom - doc.page.margins.top; // Usable page height
    
      for (let i = 0; i < damageEntries.length; i += 2) {
        // If not enough space, move to a new page
        if (y + rowHeight > pageHeight) {
          doc.addPage();
          y = doc.y;
        }
    
        const first = damageEntries[i];
        const second = damageEntries[i + 1] || null; // Second entry may not exist
    
        // Draw images side by side with fixed size
        if (first.damage_photos) {
          doc.image(first.damage_photos, startX, y, { width: imageWidth, height: imageHeight });
        }
        if (second && second.damage_photos) {
          doc.image(second.damage_photos, startX + imageWidth + gap, y, { width: imageWidth, height: imageHeight });
        }
    
        y += imageHeight + 5; // Move down after images
    
        // Draw table headers
        doc.font("Helvetica-Bold").fontSize(12);
        doc.rect(startX, y, imageWidth, cellHeight).stroke();
        doc.text("Location:", startX + 5, y + 8);
        doc.rect(startX + imageWidth + gap, y, imageWidth, cellHeight).stroke();
        doc.text("Location:", startX + imageWidth + gap + 5, y + 8);
    
        y += cellHeight; // Move down for next row
    
        // Draw table content
        doc.font("Helvetica").fontSize(10);
        doc.rect(startX, y, imageWidth, cellHeight).stroke();
        doc.text(first.location || "N/A", startX + 5, y + 8, { width: imageWidth - 10 });
    
        doc.rect(startX + imageWidth + gap, y, imageWidth, cellHeight).stroke();
        doc.text(second ? second.location : "N/A", startX + imageWidth + gap + 5, y + 8, { width: imageWidth - 10 });
    
        y += cellHeight; // Move down for next row
    
        doc.font("Helvetica-Bold").fontSize(12);
        doc.rect(startX, y, imageWidth, cellHeight).stroke();
        doc.text("Cause:", startX + 5, y + 8);
        doc.rect(startX + imageWidth + gap, y, imageWidth, cellHeight).stroke();
        doc.text("Cause:", startX + imageWidth + gap + 5, y + 8);
    
        y += cellHeight; // Move down for next row
    
        doc.font("Helvetica").fontSize(10);
        doc.rect(startX, y, imageWidth, cellHeight).stroke();
        doc.text(first.cause || "N/A", startX + 5, y + 8, { width: imageWidth - 10 });
    
        doc.rect(startX + imageWidth + gap, y, imageWidth, cellHeight).stroke();
        doc.text(second ? second.cause : "N/A", startX + imageWidth + gap + 5, y + 8, { width: imageWidth - 10 });
    
        y += cellHeight + 10; // Move down for next row
      }
    
      return y; // Return updated Y position
    }
    


    // ───────────────────────────────────────────────────────────────
    // 5) COVER PAGE
    // ───────────────────────────────────────────────────────────────
    doc.fontSize(28).text("Structural Audit Report", { align: "center", underline: true });
    doc.moveDown(2);
    doc.fontSize(22).text(audit.name || "Building Name Not Available", { align: "center" });
    doc.moveDown();
    doc.fontSize(18).text(audit.location || "Location Not Available", { align: "center" });
    if (damageEntries.length > 0 && damageEntries[0].damage_photos) {
      doc.moveDown(2);
      doc.image(damageEntries[0].damage_photos, { fit: [300, 300], align: 'center', valign: 'center' });
    }
    doc.addPage();

    /****************************************************************
     * 6) TABLE OF CONTENTS
     ****************************************************************/
    doc.fontSize(20).text("Table of Contents", { underline: true });
    doc.moveDown();
    const tocData = [
      { label: "Introduction", page: "3" },
      { label: "Scope of Work", page: "4" },
      { label: "Purpose of Investigation", page: "5" },
      { label: "History / Salient Features", page: "6" },
      { label: "Performa-B", page: "7" },
      { label: "Detailed Observations", page: "8" },
      { label: "Non-Destructive Testing (NDT)", page: "9" },
      { label: "Conclusion & Recommendations", page: "10" }
    ];
    let currentY = doc.y;
    const tocStartX = 50;
    const lineHeight = 18;
    const maxLineWidth = 500;
    tocData.forEach((item, idx) => {
      drawTOCLine(doc, `${idx + 1}. ${item.label}`, item.page, tocStartX, currentY, maxLineWidth, {
        fontSize: 12, dotLeader: '.', gapSize: 10
      });
      currentY += lineHeight;
      if (currentY > doc.page.height - 50) {
        doc.addPage();
        currentY = doc.y;
      }
    });
    doc.addPage();

    // ─── (1) INTRODUCTION ─────────────────────────────────────────
    doc.fontSize(16).text("1. INTRODUCTION", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      `M/s ${auditor.firm_name} has been appointed to inspect and assess the condition of “${audit.name}” situated at ${audit.location} and subsequently submit an audit reprt.`
    );
    doc.moveDown();
    doc.text("Accordingly, a team of expert and engineers carried out a series of detailed visual inspection. Besides the inspection, material testing by adopting specialized Non Destructive Testing' techniques was also carried out in a proper sequence. In line with this, Non-Destructive Tests (N.D.T) like Ultrasonic Pulse Velocity (USPV), Cover Meter, Carbonation, Concrete Core Strength, Rebound Hammer, Half-Cell Potential, Chemical Analysis etc. were conducted.");
    doc.moveDown();
    doc.text("This was done mainly to identify distresses; if any, and their effects on the structural stability and serviceability of the structure.");
    doc.moveDown();
    doc.text("The Inspection Report' comprising of Observations, Non Destructive Testing Reports, Inference of NDT, Photographs of distresses and Emerging Recommendations etc. is attached herewith.");
    doc.addPage();

    // ─── (2) SCOPE OF WORK ────────────────────────────────────────
    doc.fontSize(16).text("2. SCOPE OF WORK", { underline: true });
    doc.moveDown();
    if (structuralChanges.length > 0) {
      structuralChanges.forEach(change => {
        doc.fontSize(12).text(change.scope_of_work || "Data Not Available", { paragraphGap: 5 });
      });
    } else {
      doc.fontSize(12).text("Data Not Available");
    }
    doc.addPage();

    // ─── (3) PURPOSE OF INVESTIGATION ─────────────────────────────
    doc.fontSize(16).text("3. PURPOSE OF INVESTIGATION", { underline: true });
    doc.moveDown();
    if (structuralChanges.length > 0) {
      structuralChanges.forEach(change => {
        doc.fontSize(12).text(change.purpose_of_investigation || "Data Not Available");
      });
    } else {
      doc.fontSize(12).text("Data Not Available");
    }
    doc.addPage();

    // ─── (4) HISTORY / SALIENT FEATURES ───────────────────────────
    doc.fontSize(16).text("4. HISTORY / SALIENT FEATURES", { underline: true });
    doc.moveDown();
    if (structuralChanges.length > 0) {
      structuralChanges.forEach(change => {
        doc.fontSize(12).text(change.brief_history_details || "Data Not Available");
      });
    } else {
      doc.fontSize(12).text("Data Not Available");
    }

    /****************************************************************
     * (5) MERGED COMBINED REPORT
     * Merge Proforma-B, Visual Observations, and NDT Test Results into one table.
     ****************************************************************/
    // Build Proforma-B table (2 columns)
    const proformaB = {
      headers: ["Item", "Detail"],
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
        ]
      ]
    };

    // Build Visual Observations table (2 columns)
    const visualObs = { headers: ["Observation", "Status"], rows: [] };
    if (observations.length > 0) {
      // Use the first Observations record for example
      visualObs.rows.push(["Unexpected Load", observations[0].unexpected_load ? "Yes" : "No"]);
      visualObs.rows.push(["Unapproved Changes", observations[0].unapproved_changes ? "Yes" : "No"]);
      visualObs.rows.push(["Additional Floor", observations[0].additional_floor ? "Yes" : "No"]);
      visualObs.rows.push(["Vegetation Growth", observations[0].vegetation_growth ? "Yes" : "No"]);
      visualObs.rows.push(["Leakage", observations[0].leakage ? "Yes" : "No"]);
      visualObs.rows.push(["Cracks in Beams", observations[0].cracks_beams ? "Yes" : "No"]);
      visualObs.rows.push(["Cracks in Columns", observations[0].cracks_columns ? "Yes" : "No"]);
      visualObs.rows.push(["Cracks in Flooring", observations[0].cracks_flooring ? "Yes" : "No"]);
      visualObs.rows.push(["Floor Sagging", observations[0].floor_sagging ? "Yes" : "No"]);
      visualObs.rows.push(["Bulging Walls", observations[0].bulging_walls ? "Yes" : "No"]);
      visualObs.rows.push(["Window Problems", observations[0].window_problems ? "Yes" : "No"]);
      visualObs.rows.push(["Heaving Floor", observations[0].heaving_floor ? "Yes" : "No"]);
      visualObs.rows.push(["Concrete Texture", observations[0].concrete_texture ? "Yes" : "No"]);
      visualObs.rows.push(["Algae Growth", observations[0].algae_growth ? "Yes" : "No"]);
    }

    const testGroups = {
      "Rebound Hammer Test": ["rebound_index", "rebound_quality", "rebound_recommendation"],
      "Ultrasonic Test": ["ultrasonic_pulse_velocity", "ultrasonic_concrete_quality", "ultrasonic_recommendation"],
      "Core Sampling Test": ["core_diameter", "core_length", "lD_Ratio", "measured_strength", "corrected_strength", "density", "core_sampling_recommendation"],
      "Carbonation Test": ["carbonation_depth", "carbonation_ph_level", "carbonation_recommendation"],
      "Chloride Test": ["chloride_content", "chloride_corrosion_risk", "chloride_recommendation"],
      "Sulfate Test": ["sulfate_content", "sulfate_deterioration_risk", "sulfate_recommendation"],
      "Half-Cell Potential Test": ["half_cell_potential_value", "corrosion_probability", "half_cell_potential_recommendation"],
      "Concrete Cover Test": ["concrete_cover_required", "concrete_cover_measured", "concrete_cover_deficiency", "concrete_cover_structural_risk", "concrete_cover_recommendation"],
      "Rebar Diameter Test": ["original_rebar_diameter", "measured_rebar_diameter", "rebar_reduction", "rebar_impact", "rebar_recommendation"],
      "Crushing Strength Test": ["crushing_strength", "crushing_strength_classification", "crushing_strength_recommendation"]
    };

    // ✅ Function to Remove Emojis & Non-ASCII Characters
    const cleanText = (text) => {
      if (!text) return "N/A"; // Handle null/empty values
      return text.replace(/[^\x20-\x7E]/g, ""); // Removes emojis and special characters
    };

    // ✅ Initialize NDT Table
    const ndtTable = { headers: ["Test Type", "Value", "Quality", "Recommendation"], rows: [] };

    // ✅ Process Each Test Entry
    ndtTests.forEach((ndt, index) => {

      Object.entries(testGroups).forEach(([groupName, fields]) => {
        let value = "N/A";
        let quality = "N/A";
        let recommendation = "N/A";
        let dataFound = false;

        fields.forEach((fieldName, idx) => {
          if (ndt[fieldName] !== null && ndt[fieldName] !== "") {
            if (idx === 0) { value = cleanText(ndt[fieldName]); dataFound = true; }
            if (idx === 1) { quality = cleanText(ndt[fieldName]); dataFound = true; }
            if (idx === 2) { recommendation = cleanText(ndt[fieldName]); dataFound = true; }
          }
        });

        if (dataFound) {
          ndtTable.rows.push([groupName, value, quality, recommendation]);
        }
      });
    });


    // Merge all into one combined table (2 columns: "Item" and "Detail")
    const mergedTable = { headers: ["Item", "Detail"], rows: [] };

    // 1) Add Proforma-B rows
    proformaB.rows.forEach(row => mergedTable.rows.push(row));

    // 2) Insert a section header for Visual Observations
    mergedTable.rows.push(["-- Visual Observations --", ""]);
    visualObs.rows.forEach(row => mergedTable.rows.push(row));

    // 3) Insert a section header for NDT Results
    mergedTable.rows.push(["-- NDT Test Results --", ""]);
    ndtTable.rows.forEach(row => {
      // Merge the four columns into a single detail string
      const testType = row[0];
      const details = `Value: ${row[1]}, Quality: ${row[2]}, Recommendation: ${row[3]}`;
      mergedTable.rows.push([testType, details]);
    });

    // Draw the merged table
    const mergedColWidths = [200, 300];
    doc.addPage();
    doc.fontSize(16).text("5. Performa-B", { underline: true });
    doc.moveDown();
    drawDynamicTable(doc, mergedTable, 50, doc.y, mergedColWidths, { headerFontSize: 12, rowFontSize: 10 });

    // ─── (6) DETAILED OBSERVATIONS ─────────────────────────────────
    doc.addPage();
    doc.fontSize(16).text("6. DETAILED OBSERVATIONS", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      "A structural audit is an important technical requirement for any structure and has a series of parameters to be adequately investigated and assuredly complied with."
    );
    doc.moveDown();
    doc.text(
      "During this series, the structure was inspected thoroughly on several occasions to record, verify and study the distresses, level of malfunctioning, and corrosion leaks in the R.C.C. members."
    );
    doc.moveDown();
    doc.text(
      "In the period of approximately last 30 years of its existence, various defects have developed in the said structures and the same are incorporated in this compilation."
    );
    doc.moveDown();
    doc.text(
      "A detailed summary of the Structural assessment report is submitted herewith in this compilation."
    );
    doc.moveDown(2);
    doc.fontSize(14).text("Observation", { underline: true });
    doc.moveDown();

    // Call our helper function to draw the images and mini table
    // Pass current doc.x and doc.y as starting positions
    drawExternalObservationTable(doc, damageEntries, doc.x, doc.y);

    doc.addPage();
    doc.fontSize(16).text("7. Non-Destructive Testing (NDT)", { underline: true });
    doc.moveDown();

    // ✅ Introduction to NDT
    doc.fontSize(12).text(
      "Non-Destructive Testing (NDT) is used to assess the condition of concrete structures without causing damage. " +
      "The following tests were conducted to evaluate strength, durability, and overall structural performance."
    );

    // Build a summary table for NDT Tests using a group mapping approach.
    const ndtData = ndtTests[0] || {}; // Assume one NDT record per audit
    // Define your test groups and how to display them
    const groupMapping = [
      {
        label: "Rebound Hammer Test",
        value: ndtData.rebound_index,
        quality: ndtData.rebound_quality,
        recommendation: ndtData.rebound_recommendation
      },
      {
        label: "Ultrasonic Test",
        value: ndtData.ultrasonic_pulse_velocity,
        quality: ndtData.ultrasonic_concrete_quality,
        recommendation: ndtData.ultrasonic_recommendation
      },
      {
        label: "Core Sampling Test",
        value: `Diameter: ${ndtData.core_diameter || "N/A"}, Length: ${ndtData.core_length || "N/A"}, L/D Ratio: ${ndtData.lD_Ratio || "N/A"}`,
        quality: ndtData.measured_strength || "N/A",
        recommendation: ndtData.core_sampling_recommendation || "N/A"
      },
      {
        label: "Carbonation Test",
        value: ndtData.carbonation_depth,
        quality: ndtData.carbonation_ph_level,
        recommendation: ndtData.carbonation_recommendation
      },
      {
        label: "Chloride Test",
        value: ndtData.chloride_content,
        quality: ndtData.chloride_corrosion_risk,
        recommendation: ndtData.chloride_recommendation
      },
      {
        label: "Sulfate Test",
        value: ndtData.sulfate_content,
        quality: ndtData.sulfate_deterioration_risk,
        recommendation: ndtData.sulfate_recommendation
      },
      {
        label: "Half-Cell Potential Test",
        value: ndtData.half_cell_potential_value,
        quality: ndtData.corrosion_probability,
        recommendation: ndtData.half_cell_potential_recommendation
      },
      {
        label: "Concrete Cover Test",
        value: `Required: ${ndtData.concrete_cover_required || "N/A"}, Measured: ${ndtData.concrete_cover_measured || "N/A"}, Deficiency: ${ndtData.concrete_cover_deficiency || "N/A"}`,
        quality: ndtData.concrete_cover_structural_risk || "N/A",
        recommendation: ndtData.concrete_cover_recommendation || "N/A"
      },
      {
        label: "Rebar Diameter Test",
        value: `Original: ${ndtData.original_rebar_diameter || "N/A"}, Measured: ${ndtData.measured_rebar_diameter || "N/A"}`,
        quality: ndtData.rebar_reduction || "N/A",
        recommendation: ndtData.rebar_recommendation || "N/A"
      },
      {
        label: "Crushing Strength Test",
        value: ndtData.crushing_strength,
        quality: ndtData.crushing_strength_classification,
        recommendation: ndtData.crushing_strength_recommendation
      }
    ];

    // Detailed Findings Section for each test (if needed)
    // For each test group, you can add a detailed page if required.
    groupMapping.forEach((group) => {
      doc.addPage();
      doc.fontSize(14).text(group.label, { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Measured Value: ${group.value || "N/A"}`);
      doc.text(`Quality: ${group.quality || "N/A"}`);
      doc.text(`Recommendation: ${group.recommendation || "N/A"}`);
      doc.moveDown();
      // Optionally add any interpretation or additional details here.
    });

    /****************************************************************
     * (8) CONCLUSION & RECOMMENDATIONS
     ****************************************************************/
    if (conclusion.length > 0) {
      doc.addPage();
      doc.fontSize(16).text("8. CONCLUSION & RECOMMENDATIONS", { underline: true });
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

    // Finish the PDF
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
      download_url: `https://your-api/api/audits/${report.id}/report`,
    }));

    res.json(reportsWithLinks);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
