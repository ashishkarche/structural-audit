# 🏗️ Structural Audit Management System

This is a full-featured web-based application built using **React** and **Node.js** that streamlines the process of conducting and managing structural audits. It allows auditors to upload drawings, record structural changes, observations, immediate concerns, conduct NDT tests, and generate detailed reports with embedded media and dynamic data tables.

---

## 📁 Features

### ✅ Authentication
- JWT-based protected routes
- Session storage via `localStorage`

### 📋 Audit Workflow (Step-by-Step Submission)
- **Upload Drawings:** Upload structural & architectural drawings as PDFs
- **Structural Changes:** Enter background history, past changes, investigation details & upload investigation reports
- **Observations:** Record general visual issues, cracks, structural distress, etc.
- **Damage Entries:** Add multiple damages with description, location, cause, classification & multiple images
- **Immediate Concerns:** Log serious structural issues with location, effect, and image
- **NDT Tests:** Submit results for various tests (Rebound, Ultrasonic, Core Sampling, Carbonation, etc.) with optional images
- **Conclusion:** Final recommendation and signatures from engineers

---

## 📊 Dashboard

- Displays total audits
- Lists all recent audits (now fully fetched, not limited to 5)
- Includes a filter by date
- Uses skeleton loaders while fetching data

---

## 📷 Media Handling

- Support for **multiple images** per damage entry
- PDF & image previews using base64 encoding
- Modal viewer for image previews
- Upload previews shown before submission
- Damage entries shown side-by-side in report layout with location and cause

---

## 📄 PDF Report Generation

- Generates a structured, paginated PDF report using `PDFKit`
- Features:
  - Section-wise content: drawings, structural changes, observations, damage tables, test results
  - Dynamic tables for NDT, observations, damages
  - Embedded images from uploaded files
  - Auto-wrap & page breaks
  - Image layout: two side-by-side with labeled rows (location & cause)

---

## 🛠 Tech Stack

| Frontend        | Backend           | Database     |
|-----------------|-------------------|--------------|
| React.js        | Node.js (Express) | MySQL        |
| React Router    | JWT Auth          |              |
| Axios           | PDFKit            |              |
| date-fns        | Multer (for files)|              |

---

## 🔐 Role-Based History Logging

- Every form submission logs user action into an `AuditHistory` table
- Audit history page shows action, timestamp, and auditor name (joined from `Auditors` table)

---

## ✅ Reusability Features

- All major form components are reusable and maintain `isSubmitted` state via `localStorage`
- Form disable state and conditional rendering handled globally
- Reusable `FormSubmissionNotification` logic (built but not included in this snippet)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/ashishkarche/structural-audit-system.git
cd structural-audit-system
