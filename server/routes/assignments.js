const express = require("express");
const mongoose = require("mongoose");
const Assignment = require("../models/Assignments");
const Student = require("../models/Students");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");

const router = express.Router();

const normalizeCollegeId = (collegeId) => {
  if (typeof collegeId === "string" && mongoose.Types.ObjectId.isValid(collegeId)) {
    return new mongoose.Types.ObjectId(collegeId);
  }
  return collegeId;
};

// Get assignments, optionally filtered by subject and class.
router.get("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { subject, class: classNumber } = req.query;

    const query = {
      ...(req.collegeFilter || {}),
      teacherId: req.user.id,
    };

    if (subject) {
      query.subject = String(subject);
    }

    if (classNumber) {
      query.class = parseInt(String(classNumber), 10);
    }

    const assignments = await Assignment.find(query).sort({ createdAt: -1 }).lean();
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
});

// Create assignment
router.post("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { name, detail, subject, class: classNumber, maxMarks } = req.body;

    if (!name || !subject || !classNumber) {
      return res.status(400).json({ message: "Name, subject and class are required" });
    }

    const collegeId = normalizeCollegeId(req.user.collegeId || req.collegeId);
    if (!collegeId) {
      return res.status(400).json({ message: "College ID is required" });
    }

    const assignment = new Assignment({
      name: String(name).trim(),
      detail: detail ? String(detail).trim() : "",
      subject: String(subject).trim(),
      class: parseInt(String(classNumber), 10),
      maxMarks: maxMarks ? Number(maxMarks) : 100,
      teacherId: req.user.id,
      collegeId,
      marks: [],
    });

    const saved = await assignment.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ message: "Failed to create assignment" });
  }
});

// Update assignment metadata
router.put("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, detail, maxMarks } = req.body;

    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (detail !== undefined) update.detail = String(detail).trim();
    if (maxMarks !== undefined) update.maxMarks = Number(maxMarks);

    const assignment = await Assignment.findOneAndUpdate(
      { _id: id, teacherId: req.user.id, ...(req.collegeFilter || {}) },
      { $set: update },
      { new: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json(assignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Failed to update assignment" });
  }
});

// Delete assignment
router.delete("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Assignment.findOneAndDelete({
      _id: id,
      teacherId: req.user.id,
      ...(req.collegeFilter || {}),
    });

    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
});

// Get assignment marks with student details
router.get("/:id/marks", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findOne({
      _id: id,
      teacherId: req.user.id,
      ...(req.collegeFilter || {}),
    }).lean();

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const students = await Student.find({
      ...(req.collegeFilter || {}),
      class: assignment.class,
    }).lean();

    const marksMap = new Map((assignment.marks || []).map((entry) => [String(entry.studentId), entry.mark]));

    const rows = students.map((student) => ({
      studentId: String(student._id),
      studentName: student.name,
      rollNumber: student.rollNumber,
      adNumber: student.adNumber,
      mark: marksMap.has(String(student._id)) ? marksMap.get(String(student._id)) : null,
    }));

    res.json({
      assignment: {
        _id: assignment._id,
        name: assignment.name,
        detail: assignment.detail,
        subject: assignment.subject,
        class: assignment.class,
        maxMarks: assignment.maxMarks,
      },
      rows,
    });
  } catch (error) {
    console.error("Error fetching assignment marks:", error);
    res.status(500).json({ message: "Failed to fetch assignment marks" });
  }
});

// Save assignment marks in bulk
router.put("/:id/marks", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { id } = req.params;
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: "entries must be an array" });
    }

    const assignment = await Assignment.findOne({
      _id: id,
      teacherId: req.user.id,
      ...(req.collegeFilter || {}),
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const filteredEntries = entries
      .filter((entry) => entry && entry.studentId && entry.mark !== "" && entry.mark !== null && entry.mark !== undefined)
      .map((entry) => ({
        studentId: entry.studentId,
        mark: Math.min(Number(entry.mark), assignment.maxMarks),
        updatedAt: new Date(),
      }))
      .filter((entry) => !Number.isNaN(entry.mark) && entry.mark >= 0);

    assignment.marks = filteredEntries;
    await assignment.save();

    res.json({ message: "Assignment marks saved successfully" });
  } catch (error) {
    console.error("Error saving assignment marks:", error);
    res.status(500).json({ message: "Failed to save assignment marks" });
  }
});

module.exports = router;
