const express = require("express");
const router = express.Router();
const Subjects = require("../models/Subjects");
const { authenticateToken } = require("../middleware/auth");

// Get all subjects
router.get("/", authenticateToken, async (req, res) => {
  try {
    const subjects = await Subjects.find().sort({ name: 1 });
    res.json(subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// Create a new subject
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ error: "Subject name is required" });
    }

    // Check if subject already exists
    const existingSubject = await Subjects.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingSubject) {
      return res.status(400).json({ error: "Subject with this name already exists" });
    }

    const subject = new Subjects({
      name,
      description: description || ""
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    console.error("Error creating subject:", error);
    res.status(500).json({ error: "Failed to create subject" });
  }
});

// Update subject
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const subject = await Subjects.findByIdAndUpdate(
      req.params.id,
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
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const subject = await Subjects.findByIdAndDelete(req.params.id);

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
router.put("/:id/toggle", authenticateToken, async (req, res) => {
  try {
    const subject = await Subjects.findById(req.params.id);

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


