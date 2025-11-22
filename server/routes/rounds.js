const express = require("express");
const router = express.Router();
const Rounds = require("../models/Rounds");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");

// Add a new round
router.post("/", authenticateToken, addCollegeFilter, async (req, res) => {
    console.log(req.body);
  
  try {
    const { studentsNotAsked, class: classNum, subject, totalStudents } = req.body;
    const studentIds = studentsNotAsked || [];
    
    // Validate that all student IDs belong to the teacher's college
    if (studentIds.length > 0) {
      const Student = require("../models/Students");
      
      // Check if all students belong to the same college as the teacher
      const studentCount = await Student.countDocuments({
        _id: { $in: studentIds },
        collegeId: req.user.collegeId
      });
      
      if (studentCount !== studentIds.length) {
        return res.status(403).json({ 
          message: "Access denied: Some students do not belong to your college",
          details: `Expected ${studentIds.length} students from your college, found ${studentCount}`
        });
      }
      
      console.log(`Validated ${studentCount} students belong to college ${req.user.collegeId}`);
    }

    const round = new Rounds({
      class: classNum,
      subject: subject,
      studentsNotAsked: studentIds,
      totalStudents: totalStudents,
      startedAt: new Date(),
      collegeId: req.user.collegeId, // Add college ID from authenticated user
    });

    const newRound = await round.save();
    res.status(201).json(newRound);
  } catch (err) {
    console.error("Error creating round:", err);
    res.status(400).json({ message: err.message });
  }
});

// fetch rounds by class and subject
router.get("/:subject/:class", authenticateToken, addCollegeFilter, async (req, res) => {
  const { class: classNumber, subject } = req.params;
    console.log(classNumber, subject);
    
  try {
    const rounds = await Rounds.find({
      class: classNumber,
      subject: subject,
      ...(req.collegeFilter || {}), // Add college filtering
    });
    if (rounds.length === 0) res.status(404).json(rounds); else res.status(200).json(rounds);
    // res.status(200).json(rounds);
    console.log(rounds);
    console.log(new Date())
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// remove Student from round 
router.post("/:id/students/:studentId", authenticateToken, addCollegeFilter, async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.params;
  try {
    const round = await Rounds.findOne({ _id: id, ...(req.collegeFilter || {}) });
    if (!round) return res.status(404).json({ message: "Round not found" });

    // Remove the student from the studentsNotAsked array
    round.studentsNotAsked = round.studentsNotAsked.filter(
      (student) => student !== studentId
    );

    // Add the student to the studentsAsked array
    if (!round.studentsAsked) {
      round.studentsAsked = [];
    }
    round.studentsAsked.push(studentId);

    await round.save();
    console.log(round);
    const rounds = await Rounds.find({
      class: round.class,
      subject: round.subject,
      ...(req.collegeFilter || {}), // Add college filtering
    });
    
    res.status(200).json(rounds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Increase round number
router.post("/:id/increaseRound", authenticateToken, addCollegeFilter, async (req, res) => {
  const { id } = req.params;
  try {
    const round = await Rounds.findOne({ _id: id, ...(req.collegeFilter || {}) });
    if (!round) return res.status(404).json({ message: "Round not found" });

    const studentIds = req.body.studentsNotAsked || [];
    
    // Validate that all student IDs belong to the teacher's college
    if (studentIds.length > 0) {
      const Student = require("../models/Students");
      
      // Check if all students belong to the same college as the teacher
      const studentCount = await Student.countDocuments({
        _id: { $in: studentIds },
        collegeId: req.user.collegeId
      });
      
      if (studentCount !== studentIds.length) {
        return res.status(403).json({ 
          message: "Access denied: Some students do not belong to your college",
          details: `Expected ${studentIds.length} students from your college, found ${studentCount}`
        });
      }
      
      console.log(`Validated ${studentCount} students belong to college ${req.user.collegeId} for round increase`);
    }

    round.roundNumber += 1;
    round.studentsNotAsked = studentIds;
    round.studentsAsked = [];
    round.startedAt = new Date();
    round.endedAt = null;
    
    await round.save();
    const rounds = await Rounds.find({
      class: round.class,
      subject: round.subject,
      ...(req.collegeFilter || {}), // Add college filtering
    });
    res.status(200).json(rounds);
  } catch (err) {
    console.error("Error increasing round:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
