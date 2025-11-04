const express = require("express");
const router = express.Router();
const multer = require("multer");
const xlsx = require("xlsx");
const Teachers = require("../models/Teachers");
const Students = require("../models/Students");
const College = require("../models/College");
const { isSuperAdmin } = require("../middleware/isSuperAdmin");
const { addCollegeFilter } = require("../middleware/auth");
const { authenticateToken } = require("../middleware/auth");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Get available colleges for bulk import (Super Admin only)
router.get("/colleges-for-import", authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true })
      .select('_id name address')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      colleges: colleges,
      message: `Found ${colleges.length} active colleges`
    });
  } catch (error) {
    console.error('Error fetching colleges for import:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching colleges",
      error: error.message
    });
  }
});

// Generate Excel template for Teachers
router.get("/template/teachers", async (req, res) => {
  try {
    // Create sample data for template
    const sampleData = [
      {
        name: "John Doe",
        email: "john.doe@school.com",
        phone: "1234567890",
        password: "password123",
        qualification: "M.Sc. Mathematics, B.Ed.",
        dateOfBirth: "1985-06-15",
        role: "teacher"
      },
      {
        name: "Jane Smith", 
        email: "jane.smith@school.com",
        phone: "0987654321",
        password: "password456",
        qualification: "M.A. English, B.Ed.",
        dateOfBirth: "1987-03-22",
        role: "teacher"
      }
    ];

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(sampleData);

    // Add headers with styling information
    const headers = ['name', 'email', 'phone', 'password', 'qualification', 'dateOfBirth', 'role'];
    const headerDescriptions = [
      'Full name of the teacher (Required)',
      'Email address (Required, must be unique)',
      'Phone number (Required)',
      'Password for login (Required)',
      'Educational qualifications (Optional)',
      'Date of birth in YYYY-MM-DD format (Optional)',
      'Role: teacher or super_admin (Optional, defaults to teacher)'
    ];

    // Add description row
    const wsWithDesc = [
      Object.fromEntries(headers.map((header, i) => [header, headerDescriptions[i]])),
      ...sampleData
    ];
    
    const finalWs = xlsx.utils.json_to_sheet(wsWithDesc);
    
    // Set column widths
    finalWs['!cols'] = [
      { wch: 20 }, // name
      { wch: 30 }, // email
      { wch: 15 }, // phone
      { wch: 15 }, // password
      { wch: 40 }, // qualification
      { wch: 15 }, // dateOfBirth
      { wch: 15 }  // role
    ];

    xlsx.utils.book_append_sheet(wb, finalWs, "Teachers");

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="teachers_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error("Error generating teachers template:", error);
    res.status(500).json({ message: "Failed to generate template" });
  }
});

// Generate Excel template for Students
router.get("/template/students", async (req, res) => {
  try {
    // Create sample data for template
    const sampleData = [
      {
        name: "Alice Johnson",
        fullName: "Alice Marie Johnson",
        rollNumber: 1,
        adNumber: 1001,
        class: 10,
        dateOfBirth: "2008-04-15"
      },
      {
        name: "Bob Wilson",
        fullName: "Robert James Wilson",
        rollNumber: 2,
        adNumber: 1002,
        class: 10,
        dateOfBirth: "2008-07-22"
      }
    ];

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    
    // Add headers with descriptions
    const headers = ['name', 'fullName', 'rollNumber', 'adNumber', 'class', 'dateOfBirth'];
    const headerDescriptions = [
      'Short name of the student (Required)',
      'Full name of the student (Optional)',
      'Roll number (Required, must be unique per class)',
      'Admission number (Required, must be unique)',
      'Class number (Required)',
      'Date of birth in YYYY-MM-DD format (Optional)'
    ];

    // Add description row
    const wsWithDesc = [
      Object.fromEntries(headers.map((header, i) => [header, headerDescriptions[i]])),
      ...sampleData
    ];
    
    const finalWs = xlsx.utils.json_to_sheet(wsWithDesc);
    
    // Set column widths
    finalWs['!cols'] = [
      { wch: 20 }, // name
      { wch: 30 }, // fullName
      { wch: 12 }, // rollNumber
      { wch: 12 }, // adNumber
      { wch: 8 },  // class
      { wch: 15 }  // dateOfBirth
    ];

    xlsx.utils.book_append_sheet(wb, finalWs, "Students");

    // Generate buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="students_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error("Error generating students template:", error);
    res.status(500).json({ message: "Failed to generate template" });
  }
});

// Bulk import Teachers from Excel
router.post("/bulk-import/teachers", isSuperAdmin, addCollegeFilter, upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Remove description row if it exists
    const filteredData = jsonData.filter((row, index) => {
      // Skip first row if it contains descriptions
      if (index === 0 && typeof row.name === 'string' && row.name.includes('Required')) {
        return false;
      }
      return true;
    });

    if (filteredData.length === 0) {
      return res.status(400).json({ message: "No valid data found in Excel file" });
    }

    const results = {
      successful: [],
      failed: [],
      total: filteredData.length
    };

    // Process each row
    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];
      
      try {
        // Validate required fields
        if (!row.name || !row.email || !row.phone || !row.password) {
          results.failed.push({
            row: i + 2, // +2 because of header and 0-based index
            data: row,
            error: "Missing required fields (name, email, phone, password)"
          });
          continue;
        }

        // Check if email already exists
        const existingTeacher = await Teachers.findOne({ email: row.email });
        if (existingTeacher) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: "Email already exists"
          });
          continue;
        }

        // Get college ID from authenticated user
        let collegeId;
        if (req.user.role === 'super_admin') {
          // Super admin can specify college ID in request body, or we'll use default logic
          collegeId = req.body.collegeId;
          
          if (!collegeId) {
            // If no college ID specified, use the super admin's college (if they have one)
            // or find the first active college in the system
            if (req.user.collegeId) {
              collegeId = req.user.collegeId;
            } else {
              // Find the first active college
              const College = require('../models/College');
              const firstCollege = await College.findOne({ isActive: true }).sort({ createdAt: 1 });
              if (firstCollege) {
                collegeId = firstCollege._id;
              } else {
                results.failed.push({
                  row: i + 2,
                  data: row,
                  error: "No active college found in system. Please create a college first."
                });
                continue;
              }
            }
          }
        } else {
          // Regular admin uses their own college ID
          collegeId = req.collegeId || req.user.collegeId;
        }

        // Create teacher object
        const teacherData = {
          name: row.name.trim(),
          email: row.email.trim().toLowerCase(),
          phone: row.phone.toString().trim(),
          password: row.password.toString(),
          qualification: row.qualification ? row.qualification.trim() : undefined,
          role: row.role && ['teacher', 'super_admin'].includes(row.role) ? row.role : 'teacher',
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          collegeId: collegeId
        };

        // Validate dateOfBirth if provided
        if (teacherData.dateOfBirth && isNaN(teacherData.dateOfBirth.getTime())) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: "Invalid date format for dateOfBirth (use YYYY-MM-DD)"
          });
          continue;
        }

        // Create and save teacher
        const teacher = new Teachers(teacherData);
        await teacher.save();

        results.successful.push({
          row: i + 2,
          name: teacher.name,
          email: teacher.email,
          id: teacher._id
        });

      } catch (error) {
        results.failed.push({
          row: i + 2,
          data: row,
          error: error.message
        });
      }
    }

    res.json({
      message: `Import completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error("Error importing teachers:", error);
    res.status(500).json({ message: "Failed to import teachers", error: error.message });
  }
});

// Bulk import Students from Excel
router.post("/bulk-import/students", isSuperAdmin, addCollegeFilter, upload.single('excel'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    // Remove description row if it exists
    const filteredData = jsonData.filter((row, index) => {
      // Skip first row if it contains descriptions
      if (index === 0 && typeof row.name === 'string' && row.name.includes('Required')) {
        return false;
      }
      return true;
    });

    if (filteredData.length === 0) {
      return res.status(400).json({ message: "No valid data found in Excel file" });
    }

    const results = {
      successful: [],
      failed: [],
      total: filteredData.length
    };

    // Process each row
    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];
      
      try {
        // Validate required fields
        if (!row.name || row.rollNumber === undefined || row.adNumber === undefined || row.class === undefined) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: "Missing required fields (name, rollNumber, adNumber, class)"
          });
          continue;
        }

        // Check if adNumber already exists
        const existingStudent = await Students.findOne({ adNumber: parseInt(row.adNumber) });
        if (existingStudent) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: "Admission number already exists"
          });
          continue;
        }

        // Check if roll number exists in the same class
        const existingRollNumber = await Students.findOne({ 
          rollNumber: parseInt(row.rollNumber), 
          class: parseInt(row.class) 
        });
        if (existingRollNumber) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: "Roll number already exists in this class"
          });
          continue;
        }

        // Get college ID from authenticated user
        let collegeId;
        if (req.user.role === 'super_admin') {
          // Super admin can specify college ID in request body, or we'll use default logic
          collegeId = req.body.collegeId;
          
          if (!collegeId) {
            // If no college ID specified, use the super admin's college (if they have one)
            // or find the first active college in the system
            if (req.user.collegeId) {
              collegeId = req.user.collegeId;
            } else {
              // Find the first active college
              const College = require('../models/College');
              const firstCollege = await College.findOne({ isActive: true }).sort({ createdAt: 1 });
              if (firstCollege) {
                collegeId = firstCollege._id;
              } else {
                results.failed.push({
                  row: i + 2,
                  data: row,
                  error: "No active college found in system. Please create a college first."
                });
                continue;
              }
            }
          }
        } else {
          // Regular admin uses their own college ID
          collegeId = req.collegeId || req.user.collegeId;
        }

        // Create student object
        const studentData = {
          name: row.name.trim(),
          fullName: row.fullName ? row.fullName.trim() : row.name.trim(),
          rollNumber: parseInt(row.rollNumber),
          adNumber: parseInt(row.adNumber),
          class: parseInt(row.class),
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          collegeId: collegeId
        };

        // Validate dateOfBirth if provided
        if (studentData.dateOfBirth && isNaN(studentData.dateOfBirth.getTime())) {
          results.failed.push({
            row: i + 2,
            data: row,
            error: "Invalid date format for dateOfBirth (use YYYY-MM-DD)"
          });
          continue;
        }

        // Create and save student
        const student = new Students(studentData);
        await student.save();

        results.successful.push({
          row: i + 2,
          name: student.name,
          rollNumber: student.rollNumber,
          adNumber: student.adNumber,
          class: student.class,
          id: student._id
        });

      } catch (error) {
        results.failed.push({
          row: i + 2,
          data: row,
          error: error.message
        });
      }
    }

    res.json({
      message: `Import completed: ${results.successful.length} successful, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error("Error importing students:", error);
    res.status(500).json({ message: "Failed to import students", error: error.message });
  }
});

module.exports = router;