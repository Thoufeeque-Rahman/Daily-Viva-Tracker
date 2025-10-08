const express = require("express");
const router = express.Router();
const Semesters = require("../models/Semesters");
const { authenticateToken } = require("../middleware/auth");

// Get all semesters
router.get("/", authenticateToken, async (req, res) => {
  try {
    const semesters = await Semesters.find().sort({ createdAt: -1 });
    res.json(semesters);
  } catch (error) {
    console.error("Error fetching semesters:", error);
    res.status(500).json({ error: "Failed to fetch semesters" });
  }
});

// Create a new semester
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    // Validate input
    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: "Name, start date, and end date are required" });
    }

    // Check if there's already an active semester
    const activeSemester = await Semesters.findOne({ isActive: true });
    if (activeSemester) {
      return res.status(400).json({ error: "There is already an active semester. Please deactivate it first." });
    }

    const semester = new Semesters({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: false
    });

    await semester.save();
    res.status(201).json(semester);
  } catch (error) {
    console.error("Error creating semester:", error);
    res.status(500).json({ error: "Failed to create semester" });
  }
});

// Activate a semester
router.put("/:id/activate", authenticateToken, async (req, res) => {
  try {
    // First, deactivate all other semesters
    await Semesters.updateMany({}, { isActive: false });

    // Then activate the selected semester
    const semester = await Semesters.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!semester) {
      return res.status(404).json({ error: "Semester not found" });
    }

    res.json(semester);
  } catch (error) {
    console.error("Error activating semester:", error);
    res.status(500).json({ error: "Failed to activate semester" });
  }
});

// Deactivate a semester
router.put("/:id/deactivate", authenticateToken, async (req, res) => {
  try {
    const semester = await Semesters.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!semester) {
      return res.status(404).json({ error: "Semester not found" });
    }

    res.json(semester);
  } catch (error) {
    console.error("Error deactivating semester:", error);
    res.status(500).json({ error: "Failed to deactivate semester" });
  }
});

// Get active semester
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const activeSemester = await Semesters.findOne({ isActive: true });
    res.json(activeSemester);
  } catch (error) {
    console.error("Error fetching active semester:", error);
    res.status(500).json({ error: "Failed to fetch active semester" });
  }
});

// Update semester
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    const semester = await Semesters.findByIdAndUpdate(
      req.params.id,
      { name, startDate: new Date(startDate), endDate: new Date(endDate) },
      { new: true }
    );

    if (!semester) {
      return res.status(404).json({ error: "Semester not found" });
    }

    res.json(semester);
  } catch (error) {
    console.error("Error updating semester:", error);
    res.status(500).json({ error: "Failed to update semester" });
  }
});

// Delete semester
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const semester = await Semesters.findByIdAndDelete(req.params.id);

    if (!semester) {
      return res.status(404).json({ error: "Semester not found" });
    }

    res.json({ message: "Semester deleted successfully" });
  } catch (error) {
    console.error("Error deleting semester:", error);
    res.status(500).json({ error: "Failed to delete semester" });
  }
});

module.exports = router;


