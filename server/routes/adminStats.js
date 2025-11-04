const express = require("express");
const router = express.Router();
const DvtMarks = require("../models/DvtMarks");
const Students = require("../models/Students");
const Teachers = require("../models/Teachers");
const Subjects = require("../models/Subjects");
const Improvements = require("../models/Improvements");
const { addCollegeFilter } = require("../middleware/auth");
const { isSuperAdmin } = require("../middleware/isSuperAdmin");

// Helper function to get date range filter
const getDateRangeFilter = (range) => {
  const now = new Date();
  let startDate;

  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1);
      break;
    default:
      return {};
  }

  return {
    createdAt: { $gte: startDate }
  };
};

// Helper function to calculate grade percentage from mark
const calculateGradePercentage = (mark) => {
  // Mark mapping: 0: Poor (~30%), 1: Good (~65%), 2: Great (~90%)
  const markMapping = {
    0: 30,  // Poor
    1: 65,  // Good  
    2: 90   // Great
  };
  return markMapping[mark] || 0;
};

// Get overall system statistics
router.get("/stats/overall", isSuperAdmin, addCollegeFilter, async (req, res) => {
  try {
    const { range = "all" } = req.query;
    const dateFilter = getDateRangeFilter(range);
    const collegeFilter = req.collegeFilter || {};

    console.log("Admin stats college filter:", collegeFilter);

    // Get basic counts with college filter
    const [totalStudents, totalTeachers, totalSubjects] = await Promise.all([
      Students.countDocuments(collegeFilter),
      Teachers.countDocuments(collegeFilter),
      Subjects.countDocuments(collegeFilter)
    ]);

    // Get evaluation counts with college and date filters
    const totalEvaluations = await DvtMarks.countDocuments({ ...dateFilter, ...collegeFilter });

    // Get evaluations for different time periods
    const todayFilter = getDateRangeFilter("today");
    const weekFilter = getDateRangeFilter("week");
    const monthFilter = getDateRangeFilter("month");

    const [evaluationsToday, evaluationsThisWeek, evaluationsThisMonth] = await Promise.all([
      DvtMarks.countDocuments(todayFilter),
      DvtMarks.countDocuments(weekFilter),
      DvtMarks.countDocuments(monthFilter)
    ]);

    // Calculate average score
    const evaluations = await DvtMarks.find(dateFilter, "mark");
    const averageScore = evaluations.length > 0 
      ? evaluations.reduce((sum, eval) => sum + calculateGradePercentage(eval.mark), 0) / evaluations.length
      : 0;

    res.json({
      totalEvaluations,
      totalStudents,
      totalTeachers,
      totalSubjects,
      averageScore,
      evaluationsToday,
      evaluationsThisWeek,
      evaluationsThisMonth,
    });
  } catch (error) {
    console.error("Error fetching overall stats:", error);
    res.status(500).json({ message: "Failed to fetch overall statistics" });
  }
});

// Get class-wise statistics
router.get("/stats/classes", isSuperAdmin, addCollegeFilter, async (req, res) => {
  try {
    const { range = "all" } = req.query;
    const dateFilter = getDateRangeFilter(range);
    const collegeFilter = req.collegeFilter || {};

    console.log("Class stats college filter:", collegeFilter);

    // Get all students grouped by class from user's college only
    const studentsByClass = await Students.aggregate([
      { $match: collegeFilter },
      {
        $group: {
          _id: "$class",
          students: { $push: "$$ROOT" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const classStats = [];

    for (const classGroup of studentsByClass) {
      const classNumber = classGroup._id;
      const studentIds = classGroup.students.map(s => s._id);

      // Get all subjects taught in this class (from DvtMarks)
      const subjectsInClass = await DvtMarks.distinct("subject", {
        class: classNumber,
        ...dateFilter
      });

      const subjectStats = [];

      for (const subjectName of subjectsInClass) {
        // Get evaluations for this class and subject
        const evaluations = await DvtMarks.find({
          ...dateFilter,
          class: classNumber,
          subject: subjectName
        });

        const totalQuestions = evaluations.length;
        const totalStudents = new Set(evaluations.map(e => e.studentId.toString())).size;
        const averageScore = evaluations.length > 0 
          ? evaluations.reduce((sum, eval) => sum + calculateGradePercentage(eval.mark), 0) / evaluations.length
          : 0;

        subjectStats.push({
          subject: subjectName,
          totalQuestions,
          totalStudents,
          averageScore,
          evaluations: evaluations.length
        });
      }

      classStats.push({
        class: classNumber,
        subjects: subjectStats
      });
    }

    res.json(classStats);
  } catch (error) {
    console.error("Error fetching class stats:", error);
    res.status(500).json({ message: "Failed to fetch class statistics" });
  }
});

// Get teacher-wise statistics
router.get("/stats/teachers", isSuperAdmin, addCollegeFilter, async (req, res) => {
  try {
    const { range = "all" } = req.query;
    const dateFilter = getDateRangeFilter(range);
    const collegeFilter = req.collegeFilter || {};

    console.log("Teacher stats college filter:", collegeFilter);

    // Get all teachers from user's college only
    const teachers = await Teachers.find(collegeFilter).select("name email _id");

    const teacherStats = [];

    for (const teacher of teachers) {
      // Get evaluations by this teacher
      const evaluations = await DvtMarks.find({
        ...dateFilter,
        tId: teacher.tId
      });

      // Get subjects taught by this teacher from DvtMarks
      const subjectClassPairs = await DvtMarks.aggregate([
        { 
          $match: { 
            tId: teacher.tId,
            ...dateFilter
          } 
        },
        {
          $group: {
            _id: { subject: "$subject", class: "$class" },
          }
        },
        {
          $project: {
            _id: 0,
            subject: "$_id.subject",
            class: "$_id.class"
          }
        }
      ]);

      const subjectsWithClasses = subjectClassPairs;

      // Calculate statistics
      const totalEvaluations = evaluations.length;
      const totalQuestions = totalEvaluations; // Each evaluation is one question
      const studentsEvaluated = new Set(evaluations.map(e => e.studentId.toString())).size;
      const averageGrade = evaluations.length > 0 
        ? evaluations.reduce((sum, eval) => sum + calculateGradePercentage(eval.mark), 0) / evaluations.length
        : 0;

      // Get last activity
      const lastEvaluation = await DvtMarks.findOne(
        { tId: teacher.tId },
        {},
        { sort: { createdAt: -1 } }
      );

      teacherStats.push({
        teacherId: teacher.tId,
        teacherName: teacher.name,
        email: teacher.email,
        subjectsTaught: subjectsWithClasses,
        totalEvaluations,
        totalQuestions,
        studentsEvaluated,
        averageGrade,
        lastActivity: lastEvaluation ? lastEvaluation.createdAt : teacher.createdAt || new Date()
      });
    }

    // Sort by total evaluations (most active first)
    teacherStats.sort((a, b) => b.totalEvaluations - a.totalEvaluations);

    res.json(teacherStats);
  } catch (error) {
    console.error("Error fetching teacher stats:", error);
    res.status(500).json({ message: "Failed to fetch teacher statistics" });
  }
});

// Get detailed analytics (placeholder for future implementation)
router.get("/stats/analytics", isSuperAdmin, addCollegeFilter, async (req, res) => {
  try {
    const collegeFilter = req.collegeFilter || {};
    console.log("Analytics stats college filter:", collegeFilter);
    
    // Placeholder for advanced analytics
    // This can include trends, performance over time, etc.
    res.json({
      message: "Advanced analytics coming soon",
      data: {}
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

module.exports = router;