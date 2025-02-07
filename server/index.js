const express = require('express');
const mysql = require('mysql2/promise'); // Use promise-based MySQL for async/await
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET;

app.use(cors({ origin: 'https://structural-audit-6xw4.vercel.app', credentials: true }));
app.use(express.json()); // Replaces body-parser

// Database connection (using Pool for better efficiency)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { ca: fs.readFileSync(__dirname + '/isrgrootx1.pem') },
  connectionLimit: 10,
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Middleware for authentication
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

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

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute(`SELECT * FROM Auditors WHERE email = ?`, [email]);

    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to log in' });
  }
});

// Submit audit report
app.post('/submit-audit', authenticate, upload.fields([{ name: 'architecturalDrawing' }, { name: 'structuralDrawing' }]), async (req, res) => {
  try {
    const { name, location, yearOfConstruction, dateOfAudit, area, use, structuralChanges, distressYear, distressNature, previousReports } = req.body;

    const architecturalDrawing = req.files['architecturalDrawing'] ? req.files['architecturalDrawing'][0].path : null;
    const structuralDrawing = req.files['structuralDrawing'] ? req.files['structuralDrawing'][0].path : null;

    const formatDate = (date) => (date ? new Date(date).toISOString().split('T')[0] : null);
    const formattedDate = formatDate(dateOfAudit);
    const formattedDistressYear = distressYear ? parseInt(distressYear, 10) : null;

    if (!formattedDate) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const sql = `INSERT INTO Audits (auditor_id, name, location, year_of_construction, date_of_audit, area, use, structural_changes, distress_year, distress_nature, previous_reports, architectural_drawing, structural_drawing) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await db.execute(sql, [req.user.id, name, location, yearOfConstruction, formattedDate, area, use, structuralChanges, formattedDistressYear, distressNature, previousReports, architecturalDrawing, structuralDrawing]);
    res.json({ message: 'Audit submitted successfully' });
  } catch (error) {
    console.error('Error submitting audit:', error);
    res.status(500).json({ message: 'Failed to submit audit' });
  }
});

app.delete('/api/audits/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM Audits WHERE id = ? AND auditor_id = ?`;
    const [result] = await db.execute(sql, [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Audit not found or unauthorized" });
    }
    res.json({ message: "Audit deleted successfully" });
  } catch (error) {
    console.error("Error deleting audit:", error);
    res.status(500).json({ message: "Failed to delete audit" });
  }
});

// Fetch audit statistics
app.get('/api/audits/stats', authenticate, async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT COUNT(*) AS totalAudits,
             SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS inProgress,
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
      SELECT id, name, location, date_of_audit, COALESCE(status, 'In Progress') AS status 
      FROM Audits WHERE auditor_id = ? ORDER BY date_of_audit DESC LIMIT 5`, [req.user.id]);

    res.json(results);
  } catch (error) {
    console.error('Error fetching recent audits:', error);
    res.status(500).json({ message: 'Failed to fetch recent audits' });
  }
});

app.get('/api/auditors/me', authenticate, async (req, res) => {
  try {
    const [result] = await db.execute(
      `SELECT name, qualification, specialization, firm_name, general_experience, 
              specialized_experience, employment_period, email 
       FROM Auditors WHERE id = ?`,
      [req.user.id]
    );

    if (result.length === 0) return res.status(404).json({ message: "Auditor not found" });

    res.json(result[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

app.put('/api/auditors/me', authenticate, async (req, res) => {
  try {
    let { name, qualification, specialization, firmName, generalExperience, specializedExperience, employmentPeriod, email } = req.body;

    // Ensure all fields have a valid value (replace undefined with null)
    const sanitizedData = {
      name: name || null,
      qualification: qualification || null,
      specialization: specialization || null,
      firmName: firmName || null,
      generalExperience: generalExperience || 0,
      specializedExperience: specializedExperience || 0,
      employmentPeriod: employmentPeriod || 0,
      email: email || null,
    };

    // Ensure email is unique (except for the current user)
    const [existingUser] = await db.execute(
      `SELECT id FROM Auditors WHERE email = ? AND id != ?`,
      [sanitizedData.email, req.user.id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email is already in use by another auditor." });
    }

    // Update profile query
    const sql = `UPDATE Auditors 
                 SET name = ?, qualification = ?, specialization = ?, firm_name = ?, 
                     general_experience = ?, specialized_experience = ?, employment_period = ?, email = ? 
                 WHERE id = ?`;

    const [updateResult] = await db.execute(sql, [
      sanitizedData.name,
      sanitizedData.qualification,
      sanitizedData.specialization,
      sanitizedData.firmName,
      sanitizedData.generalExperience,
      sanitizedData.specializedExperience,
      sanitizedData.employmentPeriod,
      sanitizedData.email,
      req.user.id
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: "Profile not found or no changes made." });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
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

// Update audit
app.put('/api/audits/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, date_of_audit, structural_changes, status } = req.body;

    const sql = `UPDATE Audits SET name = ?, location = ?, date_of_audit = ?, structural_changes = ?, status = ? WHERE id = ? AND auditor_id = ?`;
    await db.execute(sql, [name, location, date_of_audit, structural_changes, status, id, req.user.id]);

    res.json({ message: "Audit updated successfully" });
  } catch (error) {
    console.error("Error updating audit:", error);
    res.status(500).json({ message: "Failed to update audit" });
  }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
