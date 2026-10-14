const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Student = require("../models/Students");
const DvtMarks = require("../models/DvtMarks");
const Rounds = require("../models/Rounds");
const { authenticateToken, addCollegeFilter } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');

/**
 * Remove an inactive student from studentsNotAsked across all active rounds
 * to ensure their ID is never used again in rounds.
 */
async function removeStudentFromAllActiveRounds(studentId, collegeId) {
  try {
    const studentIdStr = studentId.toString();
    const query = {
      studentsNotAsked: studentIdStr,
    };
    if (collegeId) {
      query.collegeId = collegeId;
    }

    const rounds = await Rounds.find(query);
    for (const round of rounds) {
      round.studentsNotAsked = (round.studentsNotAsked || []).filter(
        (id) => id !== studentIdStr
      );
      round.totalStudents = Math.max(
        0,
        (round.studentsAsked?.length || 0) + round.studentsNotAsked.length
      );
      await round.save();
    }
    if (rounds.length > 0) {
      console.log(`Cleaned up student ${studentIdStr} from ${rounds.length} round(s).`);
    }
  } catch (err) {
    console.error("Error removing student from rounds:", err);
  }
}

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
      active: req.body.active !== undefined ? Boolean(req.body.active) : true,
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
    const query = { ...(req.collegeFilter || {}) };
    if (req.query.status === "active") {
      query.active = { $ne: false };
    } else if (req.query.status === "inactive") {
      query.active = false;
    }
    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get students by class (All authenticated users can view)
// By default returns only active students to ensure dropped students are never used in rounds/viva
router.get("/class/:class", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const query = { ...req.collegeFilter, class: req.params.class };
    if (req.query.includeInactive !== "true" && req.query.status !== "all") {
      if (req.query.status === "inactive") {
        query.active = false;
      } else {
        query.active = { $ne: false };
      }
    }
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

    const { name, fullName, rollNumber, adNumber, class: studentClass, dateOfBirth, active } = req.body;
    
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
      updatedAt: new Date(),
    };

    // Only add dateOfBirth if it's provided
    if (dateOfBirth) {
      updateData.dateOfBirth = dateOfBirth;
    }

    if (typeof active === "boolean") {
      updateData.active = active;
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

    // If student is set to inactive, ensure they are removed from all active rounds
    if (updatedStudent.active === false) {
      await removeStudentFromAllActiveRounds(updatedStudent._id, updatedStudent.collegeId);
    }
    
    console.log("Updated student:", updatedStudent);
    res.json(updatedStudent);
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ message: err.message });
  }
});

// Bulk delete or deactivate students (Super Admin Only)
// Soft delete (active: false) by default to prevent evaluation history loss.
// Pass ?permanent=true for hard delete.
router.delete("/bulk", authenticateToken, isSuperAdmin, addCollegeFilter, async (req, res) => {
  try {
    const { studentIds } = req.body;
    const permanent = req.query.permanent === "true";
    
    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Student IDs array is required" });
    }
    
    // Validate all IDs are valid ObjectIds
    const invalidIds = studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        message: "Invalid student ID format", 
        invalidIds 
      });
    }

    const collegeId = req.user?.collegeId || req.collegeId;

    if (!permanent) {
      console.log(`Bulk deactivating (soft delete) ${studentIds.length} students:`, studentIds);
      const updateResult = await Student.updateMany(
        { ...req.collegeFilter, _id: { $in: studentIds } },
        { $set: { active: false, updatedAt: new Date() } }
      );

      for (const studentId of studentIds) {
        await removeStudentFromAllActiveRounds(studentId, collegeId);
      }

      return res.json({
        message: `Successfully deactivated ${updateResult.modifiedCount} students`,
        deactivatedCount: updateResult.modifiedCount,
        requestedCount: studentIds.length,
        isDeactivated: true
      });
    }
    
    console.log(`Bulk permanently deleting ${studentIds.length} students:`, studentIds);
    
    // Find students to be deleted (for logging and verification)
    const studentsToDelete = await Student.find({
      ...req.collegeFilter,
      _id: { $in: studentIds }
    });
    
    if (studentsToDelete.length === 0) {
      return res.status(404).json({ message: "No students found to delete" });
    }
    
    // Delete associated DVT marks first
    const marksDeleteResult = await DvtMarks.deleteMany({
      ...req.collegeFilter,
      studentId: { $in: studentIds }
    });
    
    console.log(`Deleted ${marksDeleteResult.deletedCount} associated DVT marks`);
    
    // Delete the students
    const deleteResult = await Student.deleteMany({
      ...req.collegeFilter,
      _id: { $in: studentIds }
    });

    for (const studentId of studentIds) {
      await removeStudentFromAllActiveRounds(studentId, collegeId);
    }
    
    console.log(`Successfully deleted ${deleteResult.deletedCount} students`);
    
    res.json({ 
      message: `Successfully deleted ${deleteResult.deletedCount} students`,
      deletedCount: deleteResult.deletedCount,
      deletedMarks: marksDeleteResult.deletedCount,
      requestedCount: studentIds.length
    });
  } catch (err) {
    console.error("Error in bulk delete students:", err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a student (Super Admin / Admin)
// Soft-deactivates by default (active: false) to preserve evaluation marks and history.
// Pass ?permanent=true for hard delete.
router.delete("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    console.log("Deleting/deactivating student with ID:", req.params.id);
    
    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log("Invalid ObjectId format");
      return res.status(400).json({ message: "Invalid student ID format" });
    }

    const permanent = req.query.permanent === "true";
    const query = { ...req.collegeFilter, _id: req.params.id };

    if (!permanent) {
      const student = await Student.findOneAndUpdate(
        query,
        { $set: { active: false, updatedAt: new Date() } },
        { new: true }
      );

      if (!student) {
        console.log("Student not found");
        return res.status(404).json({ message: "Student not found" });
      }

      await removeStudentFromAllActiveRounds(student._id, student.collegeId);
      console.log("Deactivated student (dropped):", student);
      return res.json({
        message: "Student marked as inactive (dropped) successfully",
        student,
        isDeactivated: true
      });
    }

    const deletedStudent = await Student.findOneAndDelete(query);

    if (!deletedStudent) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    await removeStudentFromAllActiveRounds(deletedStudent._id, deletedStudent.collegeId);
    console.log("Permanently deleted student:", deletedStudent);
    res.json({ message: "Student deleted successfully", student: deletedStudent });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── Bulk Promote ──────────────────────────────────────────────────────────────
// POST /api/students/bulk-promote
// Body: { studentIds: string[] }
// class < 10 → class += 1 | class == 10 → status="completed", batchNumber=random 4-digit, active=false
router.post("/bulk-promote", authenticateToken, isSuperAdmin, addCollegeFilter, async (req, res) => {
  try {
    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds array is required" });
    }

    const students = await Student.find({
      ...req.collegeFilter,
      _id: { $in: studentIds },
    });

    if (students.length === 0) {
      return res.status(404).json({ message: "No matching students found" });
    }

    let promoted = 0;
    let completed = 0;

    await Promise.all(
      students.map(async (s) => {
        if (s.class >= 10) {
          s.status = "completed";
          s.active = false;
          s.batchNumber = Math.floor(1000 + Math.random() * 9000);
          await removeStudentFromAllActiveRounds(s._id, s.collegeId);
        } else {
          s.class = s.class + 1;
          promoted++;
        }
        s.updatedAt = new Date();
        await s.save();
        if (s.status === "completed") completed++;
      })
    );

    res.json({
      message: `Promoted ${promoted} student(s); ${completed} graduated to completed.`,
      promoted,
      completed,
    });
  } catch (err) {
    console.error("Bulk promote error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ── Bulk Toggle Active ────────────────────────────────────────────────────────
// PATCH /api/students/bulk-toggle-active
// Body: { studentIds: string[], active: boolean }
const handleBulkToggle = async (req, res) => {
  try {
    const { studentIds, active } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds array is required" });
    }
    if (typeof active !== "boolean") {
      return res.status(400).json({ message: "active (boolean) is required" });
    }

    const collegeId = req.user?.collegeId || req.collegeId;

    const result = await Student.updateMany(
      { ...req.collegeFilter, _id: { $in: studentIds } },
      { $set: { active, updatedAt: new Date() } }
    );

    if (active === false) {
      for (const studentId of studentIds) {
        await removeStudentFromAllActiveRounds(studentId, collegeId);
      }
    }

    res.json({
      message: `Updated ${result.modifiedCount} student(s) to ${active ? "active" : "inactive"}.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Bulk toggle active error:", err);
    res.status(500).json({ message: err.message });
  }
};

router.patch("/bulk-toggle-active", authenticateToken, isSuperAdmin, addCollegeFilter, handleBulkToggle);
router.post("/bulk-status", authenticateToken, isSuperAdmin, addCollegeFilter, handleBulkToggle);
router.patch("/bulk-status", authenticateToken, isSuperAdmin, addCollegeFilter, handleBulkToggle);

// ── Single Student Toggle Active ──────────────────────────────────────────────
// PATCH /api/students/:id/toggle-active or PATCH /api/students/:id/status
const handleSingleToggle = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID" });
    }
    const { active } = req.body;
    if (typeof active !== "boolean") {
      return res.status(400).json({ message: "active (boolean) is required" });
    }

    const student = await Student.findOneAndUpdate(
      { ...req.collegeFilter, _id: req.params.id },
      { $set: { active, updatedAt: new Date() } },
      { new: true }
    );

    if (!student) return res.status(404).json({ message: "Student not found" });

    if (active === false) {
      await removeStudentFromAllActiveRounds(student._id, student.collegeId);
    }

    res.json(student);
  } catch (err) {
    console.error("Toggle active error:", err);
    res.status(500).json({ message: err.message });
  }
};

router.patch("/:id/toggle-active", authenticateToken, isSuperAdmin, addCollegeFilter, handleSingleToggle);
router.patch("/:id/status", authenticateToken, isSuperAdmin, addCollegeFilter, handleSingleToggle);
router.put("/:id/status", authenticateToken, isSuperAdmin, addCollegeFilter, handleSingleToggle);

module.exports = router;
