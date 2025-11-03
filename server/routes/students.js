const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Student = require("../models/Students");
const DvtMarks = require("../models/DvtMarks");

// Add a new student
router.post("/", async (req, res) => {
  try {
    const { name, fullName, rollNumber, adNumber, class: studentClass, dateOfBirth } = req.body;
    
    // Validate required fields
    if (!name || !rollNumber || !adNumber || !studentClass) {
      return res.status(400).json({ message: "Missing required fields: name, rollNumber, adNumber, and class are required" });
    }

    const studentData = {
      name,
      fullName: fullName || name,
      rollNumber,
      adNumber,
      class: studentClass,
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

// Get all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get students by class
router.get("/class/:class", async (req, res) => {
  try {
    const students = await Student.find({ class: req.params.class });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single student by adNumber
router.get("/adNumber/:adNumber", async (req, res) => {
  try {
    const student = await Student.findOne({ adNumber: req.params.adNumber });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a student by Id
router.get("/:id", async (req, res) => {
  try {
    console.log("Fetching student with ID:", req.params.id);
    
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const student = await Student.findById(req.params.id);
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

// Update a student
router.put("/:id", async (req, res) => {
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

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
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
router.delete("/:id", async (req, res) => {
  try {
    console.log("Deleting student with ID:", req.params.id);
    
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

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