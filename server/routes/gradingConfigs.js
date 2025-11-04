const express = require("express");
const router = express.Router();
const GradingConfig = require("../models/GradingConfig");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");

// Debug route to check current state of all configs
router.get("/debug", authenticateToken, async (req, res) => {
  try {
    const userCollegeId = req.user.collegeId;
    const allConfigs = await GradingConfig.find();
    
    const debugInfo = allConfigs.map(config => ({
      id: config._id.toString(),
      name: config.name,
      collegeId: config.collegeId?.toString() || 'global',
      isActive: config.isActive.map(id => id.toString()),
      isActiveForUser: Array.isArray(config.isActive) && 
        config.isActive.some(id => id.toString() === userCollegeId.toString())
    }));
    
    res.json({
      userCollegeId: userCollegeId.toString(),
      configs: debugInfo
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: "Debug failed" });
  }
});

// Migration route to convert old boolean isActive to new array format
router.post("/migrate", authenticateToken, async (req, res) => {
  try {
    console.log("Starting migration of grading configs from boolean to array format...");
    
    const allConfigs = await GradingConfig.find();
    let migratedCount = 0;
    
    for (const config of allConfigs) {
      if (!Array.isArray(config.isActive)) {
        console.log(`Migrating config: ${config.name} (${config._id})`);
        
        // Convert boolean to array
        let newIsActive = [];
        if (config.isActive === true) {
          // If it was active, make it active for its own college (or first college if no collegeId)
          newIsActive = config.collegeId ? [config.collegeId] : [];
        }
        
        config.isActive = newIsActive;
        await config.save();
        migratedCount++;
        
        console.log(`  -> Converted to array:`, newIsActive);
      }
    }
    
    console.log(`Migration completed. Migrated ${migratedCount} configs.`);
    res.json({ 
      success: true, 
      message: `Migration completed. Migrated ${migratedCount} grading configurations.`,
      migratedCount 
    });
  } catch (error) {
    console.error("Error during migration:", error);
    res.status(500).json({ error: "Migration failed" });
  }
});

// Get grading configurations (global configs + configs active for user's college)
router.get("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const userCollegeId = req.user.collegeId;
    console.log("Fetching grading configs for college:", userCollegeId);
    
    // Get all configs first, then filter programmatically to handle migration
    const allConfigs = await GradingConfig.find().sort({ createdAt: -1 });
    
    const accessibleConfigs = [];
    
    for (const config of allConfigs) {
      // Handle migration from old boolean schema
      if (!Array.isArray(config.isActive)) {
        console.log("Migrating config:", config.name, "from boolean to array format");
        const newIsActive = config.isActive === true ? [config.collegeId || userCollegeId] : [];
        config.isActive = newIsActive;
        await config.save();
      }
      
      // Check if config is accessible:
      // 1. Global configs (no collegeId)
      // 2. Configs where user's college ID is in the isActive array
      const isGlobal = !config.collegeId;
      const userCollegeIdStr = userCollegeId.toString();
      const isActiveForCollege = Array.isArray(config.isActive) && 
        config.isActive.some(id => id.toString() === userCollegeIdStr);
      
      if (isGlobal || isActiveForCollege) {
        accessibleConfigs.push(config);
      }
    }
    
    console.log(`Found ${accessibleConfigs.length} accessible grading configs`);
    res.json(accessibleConfigs);
  } catch (error) {
    console.error("Error fetching grading configurations:", error);
    res.status(500).json({ error: "Failed to fetch grading configurations" });
  }
});

// Create a new grading configuration
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, emoji, description, levels, isGlobal } = req.body;
    const userCollegeId = req.user.collegeId;

    // Validate input
    if (!name || !levels || !Array.isArray(levels) || levels.length === 0) {
      return res.status(400).json({ error: "Name and at least one level are required" });
    }

    // Validate each level has required fields
    const invalidLevel = levels.find(
      level => !level.name || level.mark === undefined || !level.color || !level.emoji
    );
    if (invalidLevel) {
      return res.status(400).json({ 
        error: 'Each level must have a name, mark, color, and emoji' 
      });
    }

    // Check if configuration with this name already exists for this college
    const existingConfig = await GradingConfig.findOne({ 
      name,
      $or: [
        { collegeId: userCollegeId },
        { collegeId: { $exists: false } },
        { collegeId: null }
      ]
    });
    if (existingConfig) {
      return res.status(400).json({ error: "Configuration with this name already exists" });
    }

    const config = new GradingConfig({
      name,
      emoji,
      description,
      levels,
      collegeId: isGlobal ? null : userCollegeId,
      isActive: isGlobal ? [] : [userCollegeId] // Auto-activate for creating college
    });

    await config.save();
    console.log("Created grading config:", config.name, "for college:", userCollegeId);
    res.status(201).json(config);
  } catch (error) {
    console.error("Error creating grading configuration:", error);
    res.status(500).json({ error: "Failed to create grading configuration" });
  }
});

// Activate/Deactivate a grading configuration for user's college
router.put("/:id/activate", authenticateToken, async (req, res) => {
  try {
    const userCollegeId = req.user.collegeId;
    const config = await GradingConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({ error: "Grading configuration not found" });
    }

    // Handle migration from old boolean schema to new array schema
    if (!Array.isArray(config.isActive)) {
      console.log("Migrating old grading config format to new array format");
      // If it's not an array (old schema), convert it
      const newIsActive = config.isActive === true ? [userCollegeId] : [];
      config.isActive = newIsActive;
      await config.save();
    }
    
    // Refresh config to get latest state
    const freshConfig = await GradingConfig.findById(req.params.id);
    
    // Check if college ID is in isActive array (convert to strings for comparison)
    const userCollegeIdStr = userCollegeId.toString();
    const isCurrentlyActive = Array.isArray(freshConfig.isActive) && 
      freshConfig.isActive.some(id => id.toString() === userCollegeIdStr);
    
    console.log("=== TOGGLE DEBUG ===");
    console.log("Config name:", freshConfig.name);
    console.log("User College ID:", userCollegeIdStr);
    console.log("Config active array:", freshConfig.isActive.map(id => id.toString()));
    console.log("Is currently active:", isCurrentlyActive);
    console.log("===================");
    
    let updatedConfig;
    if (isCurrentlyActive) {
      // Deactivate: Remove college ID from isActive array
      console.log("DEACTIVATING config:", freshConfig.name, "for college:", userCollegeIdStr);
      updatedConfig = await GradingConfig.findByIdAndUpdate(
        req.params.id,
        { $pull: { isActive: userCollegeId } },
        { new: true }
      );
      console.log("DEACTIVATED - New active array:", updatedConfig.isActive.map(id => id.toString()));
    } else {
      // Activate: First deactivate all other configs for this college, then activate this one
      console.log("ACTIVATING config:", freshConfig.name, "for college:", userCollegeIdStr);
      
      // Step 1: Remove this college ID from ALL other configs
      await GradingConfig.updateMany(
        { 
          _id: { $ne: req.params.id }, // Exclude current config
          isActive: userCollegeId 
        },
        { $pull: { isActive: userCollegeId } }
      );
      
      console.log("Deactivated all other configs for this college");
      
      // Step 2: Activate this config for the college
      updatedConfig = await GradingConfig.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { isActive: userCollegeId } },
        { new: true }
      );
      console.log("ACTIVATED - New active array:", updatedConfig.isActive.map(id => id.toString()));
    }

    res.json(updatedConfig);
  } catch (error) {
    console.error("Error toggling grading configuration:", error);
    res.status(500).json({ error: "Failed to toggle grading configuration" });
  }
});

// Get active grading configurations for user's college
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const userCollegeId = req.user.collegeId;
    
    // Get all configs and find ones active for this college
    const allConfigs = await GradingConfig.find();
    let activeConfig = null;
    
    for (const config of allConfigs) {
      // Handle migration from old boolean schema
      if (!Array.isArray(config.isActive)) {
        console.log("Migrating active config:", config.name, "from boolean to array format");
        const newIsActive = config.isActive === true ? [config.collegeId || userCollegeId] : [];
        config.isActive = newIsActive;
        await config.save();
      }
      
      // Check if this config is active for the user's college
      const userCollegeIdStr = userCollegeId.toString();
      const isActiveForThisCollege = Array.isArray(config.isActive) && 
        config.isActive.some(id => id.toString() === userCollegeIdStr);
        
      if (isActiveForThisCollege) {
        activeConfig = config;
        break; // Use the first active one found
      }
    }
    
    console.log("Active grading config for college:", userCollegeId, "->", activeConfig?.name || "none");
    res.json(activeConfig);
  } catch (error) {
    console.error("Error fetching active grading configuration:", error);
    res.status(500).json({ error: "Failed to fetch active grading configuration" });
  }
});

// Update grading configuration
router.put("/:id", authenticateToken, async (req, res) => {
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

    // If this template is being set as active, deactivate all others
    if (isActive) {
      await GradingConfig.updateMany(
        { _id: { $ne: req.params.id } },
        { isActive: false }
      );
    }

    const config = await GradingConfig.findByIdAndUpdate(
      req.params.id,
      { name, description, levels, isActive },
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


