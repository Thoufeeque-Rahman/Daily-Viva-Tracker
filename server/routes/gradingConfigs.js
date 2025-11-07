const express = require("express");
const router = express.Router();
const GradingConfig = require("../models/GradingConfig");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");

// Get grading configurations filtered by college
router.get("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    console.log("Fetching grading configs with college filter:", req.collegeFilter);
    const configs = await GradingConfig.find(req.collegeFilter || {}).sort({ createdAt: -1 });
    res.json(configs);
  } catch (error) {
    console.error("Error fetching grading configurations:", error);
    res.status(500).json({ error: "Failed to fetch grading configurations" });
  }
});

// Create a new grading configuration
router.post("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { name, description, levels } = req.body;

    // Validate input
    if (!name || !levels || !Array.isArray(levels) || levels.length === 0) {
      return res.status(400).json({ error: "Name and at least one level are required" });
    }

    // Validate each level has required fields
    const invalidLevel = levels.find(
      level => !level.name || level.mark === undefined || !level.color
    );
    if (invalidLevel) {
      return res.status(400).json({ 
        error: 'Each level must have a name, mark, and color' 
      });
    }

    // For regular teachers, use their college ID; for super admin, require college ID in request
    let collegeId;
    if (req.user.role === 'super_admin') {
      collegeId = req.body.collegeId;
      if (!collegeId) {
        return res.status(400).json({ error: "College ID is required" });
      }
    } else {
      collegeId = req.collegeId;
    }

    // Check if configuration with this name already exists for this college
    const existingConfig = await GradingConfig.findOne({ 
      name,
      collegeId
    });
    if (existingConfig) {
      return res.status(400).json({ error: "Configuration with this name already exists" });
    }

    const config = new GradingConfig({
      name,
      description,
      levels,
      collegeId,
      isActive: false // Default to inactive
    });

    await config.save();
    console.log("Created grading config:", config.name, "for college:", collegeId);
    res.status(201).json(config);
  } catch (error) {
    console.error("Error creating grading configuration:", error);
    res.status(500).json({ error: "Failed to create grading configuration" });
  }
});

// Toggle activation of a grading configuration
router.put("/:id/activate", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const config = await GradingConfig.findOne({
      ...req.collegeFilter,
      _id: req.params.id
    });

    if (!config) {
      return res.status(404).json({ error: "Grading configuration not found" });
    }

    if (config.isActive) {
      // Check if this is the only grading config for this college
      const totalConfigs = await GradingConfig.countDocuments(req.collegeFilter);
      const activeConfigs = await GradingConfig.countDocuments({
        ...req.collegeFilter,
        isActive: true
      });

      // Prevent deactivating if this is the only config or the only active config
      if (totalConfigs === 1) {
        return res.status(400).json({ 
          error: "Cannot deactivate the only grading configuration. At least one grading configuration must remain active." 
        });
      }

      if (activeConfigs === 1) {
        return res.status(400).json({ 
          error: "Cannot deactivate the last active grading configuration. At least one grading configuration must remain active." 
        });
      }

      // Deactivate this config
      config.isActive = false;
      await config.save();
      console.log("DEACTIVATED config:", config.name);
    } else {
      // Activate this config and deactivate all others for this college
      await GradingConfig.updateMany(
        { 
          ...req.collegeFilter,
          _id: { $ne: req.params.id } 
        },
        { isActive: false }
      );
      
      config.isActive = true;
      await config.save();
      console.log("ACTIVATED config:", config.name);
    }

    res.json(config);
  } catch (error) {
    console.error("Error toggling grading configuration:", error);
    res.status(500).json({ error: "Failed to toggle grading configuration" });
  }
});

// Get active grading configuration for user's college
router.get("/active", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    console.log("Fetching active grading config with college filter:", req.collegeFilter);
    const activeConfig = await GradingConfig.findOne({
      ...req.collegeFilter,
      isActive: true
    });
    
    console.log("Active grading config:", activeConfig?.name || "none");
    res.json(activeConfig);
  } catch (error) {
    console.error("Error fetching active grading configuration:", error);
    res.status(500).json({ error: "Failed to fetch active grading configuration" });
  }
});

// Update grading configuration
router.put("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { name, description, levels, isActive } = req.body;

    if (!name || !levels || !Array.isArray(levels) || levels.length === 0) {
      return res.status(400).json({ error: "Name and at least one level are required" });
    }

    // Validate each level has required fields
    const invalidLevel = levels.find(
      level => !level.name || level.mark === undefined || !level.color
    );
    if (invalidLevel) {
      return res.status(400).json({ 
        error: 'Each level must have a name, mark, and color' 
      });
    }

    // If this template is being set as active, deactivate all others for this college
    if (isActive) {
      await GradingConfig.updateMany(
        { 
          ...req.collegeFilter,
          _id: { $ne: req.params.id } 
        },
        { isActive: false }
      );
    }

    const config = await GradingConfig.findOneAndUpdate(
      {
        ...req.collegeFilter,
        _id: req.params.id
      },
      { name, description, levels, isActive },
      { new: true, runValidators: true }
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
router.delete("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    // Check if this is the only grading config for this college
    const totalConfigs = await GradingConfig.countDocuments(req.collegeFilter);
    
    if (totalConfigs === 1) {
      return res.status(400).json({ 
        error: "Cannot delete the only grading configuration. At least one grading configuration must exist." 
      });
    }

    const configToDelete = await GradingConfig.findOne({
      ...req.collegeFilter,
      _id: req.params.id
    });

    if (!configToDelete) {
      return res.status(404).json({ error: "Grading configuration not found" });
    }

    // If deleting an active config, activate another one
    if (configToDelete.isActive) {
      const otherConfig = await GradingConfig.findOne({
        ...req.collegeFilter,
        _id: { $ne: req.params.id }
      });

      if (otherConfig) {
        otherConfig.isActive = true;
        await otherConfig.save();
        console.log("Activated config:", otherConfig.name, "as replacement");
      }
    }

    // Now delete the config
    await GradingConfig.findOneAndDelete({
      ...req.collegeFilter,
      _id: req.params.id
    });

    res.json({ message: "Grading configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting grading configuration:", error);
    res.status(500).json({ error: "Failed to delete grading configuration" });
  }
});

module.exports = router;


