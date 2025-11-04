const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Student = require("../models/Students");
const DvtMarks = require("../models/DvtMarks");
const { authenticateToken, addCollegeFilter } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');

// Add a new student
router.post("/", addCollegeFilter, async (req, res) => {
  try {
    const { name, fullName, rollNumber, adNumber, class: studentClass, dateOfBirth } = req.body;
    
    // Validate required fields
    if (!name || !rollNumber || !adNumber || !studentClass) {
      return res.status(400).json({ message: "Missing required fields: name, rollNumber, adNumber, and class are required" });
    }

    // For regular teachers, use their college ID; for super admin, require college ID in request
    let collegeId;
    if (req.user.role === 'super_admin') {
      collegeId = req.body.collegeId;
      if (!collegeId) {
        return res.status(400).json({ message: "College ID is required" });
      }
    } else {
      collegeId = req.collegeId;
    }

    const studentData = {
      name,
      fullName: fullName || name,
      rollNumber,
      adNumber,
      class: studentClass,
      collegeId,
    };

    // Only add dateOfBirth if it's provided
    if (dateOfBirth) {
      studentData.dateOfBirth = dateOfBirth;
    }

    const student = new Student(studentData);
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(400).json({ message: err.message });
  }
});

// Get all students (All authenticated users can view)
router.get("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    console.log("Fetching students with college filter:", req.collegeFilter);
    const students = await Student.find(req.collegeFilter || {});
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get students by class (All authenticated users can view)
router.get("/class/:class", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const query = { ...req.collegeFilter, class: req.params.class };
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single student by adNumber (All authenticated users can view)
router.get("/adNumber/:adNumber", authenticateToken, async (req, res) => {
  try {
    const query = { ...req.collegeFilter, adNumber: req.params.adNumber };
    const student = await Student.findOne(query);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a student by Id (All authenticated users can view)
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching student with ID:", req.params.id);
    
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const query = { ...req.collegeFilter, _id: req.params.id };
    const student = await Student.findOne(query);
    if (!student) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("Found student:", student);
    res.json(student);
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ message: err.message });
  }
});

// Update a student (Super Admin Only)
router.put("/:id", authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    console.log("Updating student with ID:", req.params.id);
    
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const { name, fullName, rollNumber, adNumber, class: studentClass, dateOfBirth } = req.body;
    
    // Validate required fields
    if (!name || !rollNumber || !adNumber || !studentClass) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updateData = {
      name,
      fullName: fullName || name, 
      rollNumber,
      adNumber,
      class: studentClass,
    };

    // Only add dateOfBirth if it's provided
    if (dateOfBirth) {
      updateData.dateOfBirth = dateOfBirth;
    }

    // Find with college filter and update
    const query = { ...req.collegeFilter, _id: req.params.id };
    const updatedStudent = await Student.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("Updated student:", updatedStudent);
    res.json(updatedStudent);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a student
router.delete("/:id", addCollegeFilter, async (req, res) => {
  try {
    console.log("Deleting student with ID:", req.params.id);
    
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    // Find with college filter and delete
    const query = { ...req.collegeFilter, _id: req.params.id };
    const deletedStudent = await Student.findOneAndDelete(query);

    if (!deletedStudent) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }
    
    console.log("Deleted student:", deletedStudent);
    res.json({ message: "Student deleted successfully", student: deletedStudent });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: err.message });
  }
});

// Updated with CRUD operations
module.exports = router;