const express = require("express");
const router = express.Router();
const GradingConfig = require("../models/GradingConfig");
const { authenticateToken } = require("../middleware/auth");

// Get all grading configurations
router.get("/", authenticateToken, async (req, res) => {
  try {
    const configs = await GradingConfig.find().sort({ createdAt: -1 });
    res.json(configs);
  } catch (error) {
    console.error("Error fetching grading configurations:", error);
    res.status(500).json({ error: "Failed to fetch grading configurations" });
  }
});

// Create a new grading configuration
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, levels } = req.body;

    // Validate input
    if (!name || !levels || !Array.isArray(levels) || levels.length < 2) {
      return res.status(400).json({ error: "Name and at least 2 levels are required" });
    }

    // Check if configuration with this name already exists
    const existingConfig = await GradingConfig.findOne({ name });
    if (existingConfig) {
      return res.status(400).json({ error: "Configuration with this name already exists" });
    }

    const config = new GradingConfig({
      name,
      levels,
      isActive: false
    });

    await config.save();
    res.status(201).json(config);
  } catch (error) {
    console.error("Error creating grading configuration:", error);
    res.status(500).json({ error: "Failed to create grading configuration" });
  }
});

// Activate a grading configuration
router.put("/:id/activate", authenticateToken, async (req, res) => {
  try {
    // First, deactivate all other configurations
    await GradingConfig.updateMany({}, { isActive: false });

    // Then activate the selected configuration
    const config = await GradingConfig.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ error: "Grading configuration not found" });
    }

    res.json(config);
  } catch (error) {
    console.error("Error activating grading configuration:", error);
    res.status(500).json({ error: "Failed to activate grading configuration" });
  }
});

// Get active grading configuration
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const activeConfig = await GradingConfig.findOne({ isActive: true });
    res.json(activeConfig);
  } catch (error) {
    console.error("Error fetching active grading configuration:", error);
    res.status(500).json({ error: "Failed to fetch active grading configuration" });
  }
});

// Update grading configuration
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { name, levels } = req.body;

    if (!name || !levels || !Array.isArray(levels) || levels.length < 2) {
      return res.status(400).json({ error: "Name and at least 2 levels are required" });
    }

    const config = await GradingConfig.findByIdAndUpdate(
      req.params.id,
      { name, levels },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ error: "Grading configuration not found" });
    }

    res.json(config);
  } catch (error) {
    console.error("Error updating grading configuration:", error);
    res.status(500).json({ error: "Failed to update grading configuration" });
  }
});

// Delete grading configuration
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const config = await GradingConfig.findByIdAndDelete(req.params.id);

    if (!config) {
      return res.status(404).json({ error: "Grading configuration not found" });
    }

    res.json({ message: "Grading configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting grading configuration:", error);
    res.status(500).json({ error: "Failed to delete grading configuration" });
  }
});

module.exports = router;


