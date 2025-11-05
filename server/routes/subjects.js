const express = require("express");
const router = express.Router();
const Subjects = require("../models/Subjects");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");

// Get all subjects (college-filtered)
router.get("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const subjects = await Subjects.find(req.collegeFilter || {}).sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// Get ALL subjects from ALL colleges (for lesson management)
router.get("/all", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 /api/subjects/all called by user:", req.user?.email, "Role:", req.user?.role);
    
    // Fetch all subjects without college filtering
    const subjects = await Subjects.find({}).sort({ name: 1 });
    
    console.log("📚 Found", subjects.length, "total subjects across all colleges:");
    console.log("Subjects:", subjects.map(s => `${s.name} (College: ${s.collegeId})`));
    
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching all subjects:", error);
    res.status(500).json({ error: "Failed to fetch all subjects" });
  }
});

// Create a new subject
router.post("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: "Subject name is required" });
    }

    // Check if subject already exists within this college
    const existingSubject = await Subjects.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      ...(req.collegeFilter || {})
    });
    if (existingSubject) {
      return res.status(400).json({ error: "Subject with this name already exists" });
    }

    const subject = new Subjects({
      name,
      description: description || "",
      collegeId: req.user.collegeId, // Add college ID from authenticated user
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
});

// Update subject
router.put("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const subject = await Subjects.findOneAndUpdate(
      { _id: req.params.id, ...(req.collegeFilter || {}) },
      { name, description, isActive },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(subject);
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ error: "Failed to update subject" });
  }
});

// Delete subject
router.delete("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const subject = await Subjects.findOneAndDelete({ 
      _id: req.params.id, 
      ...(req.collegeFilter || {}) 
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
});

// Toggle subject active status
router.put("/:id/toggle", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const subject = await Subjects.findOne({ 
      _id: req.params.id, 
      ...(req.collegeFilter || {}) 
    });

    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }

    subject.isActive = !subject.isActive;
    await subject.save();

    res.json(subject);
  } catch (error) {
    console.error("Error toggling subject status:", error);
    res.status(500).json({ error: "Failed to toggle subject status" });
  }
});

module.exports = router;


