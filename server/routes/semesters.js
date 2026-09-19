const express = require("express");
const router = express.Router();
const Semesters = require("../models/Semesters");
const DvtMarks = require("../models/DvtMarks");
const { authenticateToken } = require("../middleware/auth");

// Get all semesters (scoped to college)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    const filter = collegeId ? { collegeId } : {};
    const semesters = await Semesters.find(filter).sort({ createdAt: -1 });
    res.json(semesters);
  } catch (error) {
    console.error("Error fetching semesters:", error);
    res.status(500).json({ error: "Failed to fetch semesters" });
  }
});

// Get active semester (scoped to college)
router.get("/active", authenticateToken, async (req, res) => {
  try {
    const collegeId = req.user.collegeId;
    const filter = { isActive: true, ...(collegeId ? { collegeId } : {}) };
    const activeSemester = await Semesters.findOne(filter);
    res.json(activeSemester);
  } catch (error) {
    console.error("Error fetching active semester:", error);
    res.status(500).json({ error: "Failed to fetch active semester" });
  }
});

// Create a new semester
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;
    const collegeId = req.user.collegeId;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: "Name, start date, and end date are required" });
    }

    // Only one active semester per college at a time
    const activeFilter = { isActive: true, ...(collegeId ? { collegeId } : {}) };
    const activeSemester = await Semesters.findOne(activeFilter);
    if (activeSemester) {
      return res.status(400).json({
        error: "There is already an active semester. Please start a new semester from the active one to transition."
      });
    }

    const semester = new Semesters({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      collegeId: collegeId || null,
      isActive: false
    });

    await semester.save();
    res.status(201).json(semester);
  } catch (error) {
    console.error("Error creating semester:", error);
    res.status(500).json({ error: "Failed to create semester" });
  }
});

// Activate a semester (simple activate, no mark sealing — use /start for semester transitions)
router.put("/:id/activate", authenticateToken, async (req, res) => {
  try {
    const collegeId = req.user.collegeId;

    // Deactivate all other semesters in the same college
    await Semesters.updateMany(
      { ...(collegeId ? { collegeId } : {}) },
      { isActive: false }
    );

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

/**
 * POST /:id/start — "Start New Semester"
 *
 * This is the core semester transition endpoint.
 * It:
 *   1. Finds the currently active semester (outgoing).
 *   2. Seals all DvtMarks that belong to the outgoing semester (marks without a
 *      semesterId are treated as belonging to the currently active semester).
 *   3. Deactivates the outgoing semester.
 *   4. Activates the requested semester (:id).
 *
 * Only super_admin can perform this action.
 */
router.post("/:id/start", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can start a new semester" });
    }

    const collegeId = req.user.collegeId;
    const incomingSemesterId = req.params.id;

    // Find the incoming semester
    const incomingSemester = await Semesters.findById(incomingSemesterId);
    if (!incomingSemester) {
      return res.status(404).json({ error: "Semester not found" });
    }
    if (incomingSemester.isActive) {
      return res.status(400).json({ error: "This semester is already active" });
    }

    // Find the current active semester (if any)
    const activeFilter = { isActive: true, ...(collegeId ? { collegeId } : {}) };
    const outgoingSemester = await Semesters.findOne(activeFilter);

    let marksSealed = 0;

    if (outgoingSemester) {
      // Seal all DvtMarks that belong to the outgoing semester:
      // - marks explicitly tagged with the outgoing semesterId
      // - marks with no semesterId at all (legacy / from before this feature)
      const collegeFilter = collegeId ? { collegeId } : {};
      const sealResult = await DvtMarks.updateMany(
        {
          ...collegeFilter,
          $or: [
            { semesterId: outgoingSemester._id },
            { semesterId: null },
            { semesterId: { $exists: false } }
          ]
        },
        { $set: { semesterId: outgoingSemester._id } }
      );
      marksSealed = sealResult.modifiedCount;
      console.log(`Sealed ${marksSealed} DvtMarks with semesterId ${outgoingSemester._id}`);

      // Deactivate the outgoing semester
      outgoingSemester.isActive = false;
      await outgoingSemester.save();
    }

    // Activate the incoming semester
    incomingSemester.isActive = true;
    await incomingSemester.save();

    res.json({
      success: true,
      message: `Semester "${incomingSemester.name}" is now active. ${marksSealed} previous marks have been sealed.`,
      activeSemester: incomingSemester,
      outgoingSemester: outgoingSemester || null,
      marksSealed
    });
  } catch (error) {
    console.error("Error starting new semester:", error);
    res.status(500).json({ error: "Failed to start new semester" });
  }
});

// Update semester details
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

// Delete semester (only if inactive)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const semester = await Semesters.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({ error: "Semester not found" });
    }
    if (semester.isActive) {
      return res.status(400).json({ error: "Cannot delete an active semester. Deactivate it first." });
    }

    await Semesters.findByIdAndDelete(req.params.id);
    res.json({ message: "Semester deleted successfully" });
  } catch (error) {
    console.error("Error deleting semester:", error);
    res.status(500).json({ error: "Failed to delete semester" });
  }
});

module.exports = router;
