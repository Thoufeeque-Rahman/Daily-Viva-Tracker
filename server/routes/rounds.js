const express = require("express");
const router = express.Router();
const Rounds = require("../models/Rounds");
const Student = require("../models/Students");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");

// Add a new round
router.post("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { studentsNotAsked, class: classNum, subject } = req.body;
    const studentIds = studentsNotAsked || [];
    const collegeId = req.user.collegeId || req.collegeId;
    
    // Validate that only ACTIVE students belonging to the teacher's college are included
    const activeStudents = await Student.find({
      _id: { $in: studentIds },
      collegeId: collegeId,
      active: { $ne: false },
    }).select("_id");
    
    const activeStudentIds = activeStudents.map((s) => s._id.toString());
    console.log(`Creating round with ${activeStudentIds.length} active students out of ${studentIds.length} requested`);

    const round = new Rounds({
      class: classNum,
      subject: subject,
      studentsNotAsked: activeStudentIds,
      totalStudents: activeStudentIds.length,
      startedAt: new Date(),
      collegeId: collegeId,
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
  try {
    const rounds = await Rounds.find({
      class: classNumber,
      subject: subject,
      ...(req.collegeFilter || {}),
    });

    if (rounds.length === 0) {
      return res.status(404).json(rounds);
    }

    // Sanitize rounds: ensure no inactive or dropped students remain in studentsNotAsked
    for (const round of rounds) {
      if (round.studentsNotAsked && round.studentsNotAsked.length > 0) {
        const activeStudents = await Student.find({
          _id: { $in: round.studentsNotAsked },
          active: { $ne: false },
        }).select("_id");

        const activeIdSet = new Set(activeStudents.map((s) => s._id.toString()));
        const cleanedNotAsked = round.studentsNotAsked.filter((id) => activeIdSet.has(String(id)));

        if (cleanedNotAsked.length !== round.studentsNotAsked.length) {
          const prunedCount = round.studentsNotAsked.length - cleanedNotAsked.length;
          console.log(`Pruned ${prunedCount} inactive student(s) from round ${round._id}`);
          round.studentsNotAsked = cleanedNotAsked;
          round.totalStudents = Math.max(0, (round.studentsAsked?.length || 0) + cleanedNotAsked.length);
          await round.save();
        }
      }
    }

    res.status(200).json(rounds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// remove Student from round 
router.post("/:id/students/:studentId", authenticateToken, addCollegeFilter, async (req, res) => {
  const { id, studentId } = req.params;
  try {
    const round = await Rounds.findOne({ _id: id, ...(req.collegeFilter || {}) });
    if (!round) return res.status(404).json({ message: "Round not found" });

    const student = await Student.findById(studentId);

    // Remove the student from the studentsNotAsked array
    round.studentsNotAsked = (round.studentsNotAsked || []).filter(
      (student) => student !== studentId
    );

    // If active, record in studentsAsked. If inactive (dropped), do not record as asked and adjust totalStudents
    if (!student || student.active !== false) {
      if (!round.studentsAsked) {
        round.studentsAsked = [];
      }
      if (!round.studentsAsked.includes(studentId)) {
        round.studentsAsked.push(studentId);
      }
    } else {
      round.totalStudents = Math.max(0, (round.studentsAsked?.length || 0) + round.studentsNotAsked.length);
    }

    await round.save();
    const rounds = await Rounds.find({
      class: round.class,
      subject: round.subject,
      ...(req.collegeFilter || {}),
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
    const collegeId = req.user.collegeId || req.collegeId;

    // Filter to ONLY active students
    let activeStudentIds = [];
    if (studentIds.length > 0) {
      const activeStudents = await Student.find({
        _id: { $in: studentIds },
        collegeId: collegeId,
        active: { $ne: false },
      }).select("_id");
      activeStudentIds = activeStudents.map((s) => s._id.toString());
    } else {
      const activeStudents = await Student.find({
        class: round.class,
        collegeId: collegeId,
        active: { $ne: false },
      }).select("_id");
      activeStudentIds = activeStudents.map((s) => s._id.toString());
    }

    console.log(`Increasing round ${round.roundNumber} with ${activeStudentIds.length} active students`);

    round.roundNumber += 1;
    round.studentsNotAsked = activeStudentIds;
    round.totalStudents = activeStudentIds.length;
    round.studentsAsked = [];
    round.startedAt = new Date();
    round.endedAt = null;
    
    await round.save();
    const rounds = await Rounds.find({
      class: round.class,
      subject: round.subject,
      ...(req.collegeFilter || {}),
    });
    res.status(200).json(rounds);
  } catch (err) {
    console.error("Error increasing round:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
