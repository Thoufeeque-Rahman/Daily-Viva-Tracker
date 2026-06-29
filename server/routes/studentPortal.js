const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Student = require("../models/Students");
const DvtMarks = require("../models/DvtMarks");
const College = require("../models/College");
const Assignment = require("../models/Assignments");
const Improvement = require("../models/Improvements");
const { authenticateStudent } = require("../middleware/auth");

const router = express.Router();

// =========================================================================
// PUBLIC ENDPOINTS
// =========================================================================

/**
 * @route   GET /api/student-portal/colleges
 * @desc    Get names and IDs of all active colleges (for developer reference or login configuration)
 * @access  Public
 */
router.get("/colleges", async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true }, "name address establishedYear website");
    res.json({
      success: true,
      count: colleges.length,
      colleges
    });
  } catch (error) {
    console.error("Error fetching colleges for student portal:", error);
    res.status(500).json({ success: false, error: "Failed to fetch colleges" });
  }
});

/**
 * @route   POST /api/student-portal/login
 * @desc    Log in a student using adNumber as both username and password, scoped to a collegeId
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password, collegeId } = req.body;

    // Validate inputs
    if (!username || !password || !collegeId) {
      return res.status(400).json({ 
        success: false, 
        error: "Username (adNumber), password (adNumber), and collegeId are required" 
      });
    }

    // Verify username and password are identical
    if (String(username).trim() !== String(password).trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "Authentication credentials mismatch. Username and password must be identical (adNumber)" 
      });
    }

    const adNumberVal = Number(username);
    if (isNaN(adNumberVal)) {
      return res.status(400).json({ 
        success: false, 
        error: "Admission Number (adNumber) must be a numeric value" 
      });
    }

    // Validate collegeId format
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid College ID format" 
      });
    }

    // Lookup student in database
    const student = await Student.findOne({ 
      adNumber: adNumberVal, 
      collegeId: new mongoose.Types.ObjectId(collegeId) 
    }).populate("collegeId");

    if (!student) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials. Student not found in the specified college." 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: student._id.toString(),
        adNumber: student.adNumber,
        role: "student",
        collegeId: student.collegeId._id.toString(),
        name: student.name,
        class: student.class
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set JWT token in httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Strip password/confidential data, return student info and token
    const studentProfile = {
      _id: student._id,
      name: student.name,
      fullName: student.fullName,
      rollNumber: student.rollNumber,
      adNumber: student.adNumber,
      class: student.class,
      college: {
        _id: student.collegeId._id,
        name: student.collegeId.name,
        address: student.collegeId.address,
        website: student.collegeId.website
      }
    };

    res.json({
      success: true,
      message: "Student logged in successfully",
      student: studentProfile,
      token
    });

  } catch (error) {
    console.error("Student login error:", error);
    res.status(500).json({ success: false, error: "An unexpected error occurred during login" });
  }
});

/**
 * @route   POST /api/student-portal/logout
 * @desc    Log out the student and clear authentication cookies
 * @access  Public
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });
  
  res.json({ success: true, message: "Logged out successfully" });
});

// =========================================================================
// PROTECTED ENDPOINTS (STUDENTS ONLY)
// =========================================================================

/**
 * @route   GET /api/student-portal/profile
 * @desc    Get the logged-in student's profile details
 * @access  Protected (Student)
 */
router.get("/profile", authenticateStudent, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate("collegeId");
    if (!student) {
      return res.status(404).json({ success: false, error: "Student profile not found" });
    }

    const studentProfile = {
      _id: student._id,
      name: student.name,
      fullName: student.fullName,
      rollNumber: student.rollNumber,
      adNumber: student.adNumber,
      class: student.class,
      college: student.collegeId ? {
        _id: student.collegeId._id,
        name: student.collegeId.name,
        address: student.collegeId.address,
        phone: student.collegeId.phone,
        email: student.collegeId.email,
        website: student.collegeId.website
      } : null
    };

    res.json({ success: true, student: studentProfile });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ success: false, error: "Failed to fetch profile details" });
  }
});

/**
 * @route   GET /api/student-portal/marks
 * @desc    Get student's daily viva marks (DvtMarks) with comprehensive filtering options and performance stats
 * @access  Protected (Student)
 */
router.get("/marks", authenticateStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject, mark, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;

    // 1. Build Query Conditions
    const queryConditions = { studentId: new mongoose.Types.ObjectId(studentId) };

    if (subject) {
      // Allow case-insensitive partial match
      queryConditions.subject = { $regex: new RegExp(subject, "i") };
    }

    if (mark !== undefined && mark !== "") {
      const markVal = parseInt(mark);
      if (!isNaN(markVal)) {
        queryConditions.mark = markVal;
      }
    }

    if (startDate || endDate) {
      queryConditions.date = {};
      if (startDate) {
        queryConditions.date.$gte = new Date(startDate);
      }
      if (endDate) {
        queryConditions.date.$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    // 2. Setup Pagination & Sorting
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skipNum = (pageNum - 1) * limitNum;

    // Validate sort fields
    const validSortFields = ["date", "mark"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "date";
    const order = sortOrder === "asc" ? 1 : -1;

    // 3. Compile Statistics (Calculated on ALL marks matching this query, ignoring pagination)
    const allMatchingMarks = await DvtMarks.find(queryConditions);
    const totalMatchingCount = allMatchingMarks.length;

    let poorCount = 0;
    let goodCount = 0;
    let greatCount = 0;
    let punishmentsCount = 0;
    let marksSum = 0;

    allMatchingMarks.forEach(m => {
      if (m.mark === 0) poorCount++;
      else if (m.mark === 1) goodCount++;
      else if (m.mark === 2) greatCount++;

      if (m.punishment && m.punishment.trim() !== "") {
        punishmentsCount++;
      }
      marksSum += m.mark;
    });

    const averageMark = totalMatchingCount > 0 ? parseFloat((marksSum / totalMatchingCount).toFixed(2)) : 0;

    // 4. Fetch Paginated Marks
    const paginatedMarks = await DvtMarks.find(queryConditions)
      .sort({ [sortField]: order })
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      success: true,
      pagination: {
        totalRecords: totalMatchingCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalMatchingCount / limitNum),
        limit: limitNum
      },
      summary: {
        averageMark, // Score scale: 0 to 2
        totalVivas: totalMatchingCount,
        distribution: {
          poor: poorCount,
          good: goodCount,
          great: greatCount
        },
        punishmentsCount
      },
      marks: paginatedMarks.map(m => ({
        _id: m._id,
        subject: m.subject,
        mark: m.mark, // 0 = Poor, 1 = Good, 2 = Great
        date: m.date,
        punishment: m.punishment || null,
        teacherId: m.tId || null,
        createdAt: m.createdAt
      }))
    });

  } catch (error) {
    console.error("Error fetching student marks:", error);
    res.status(500).json({ success: false, error: "Failed to retrieve marks history" });
  }
});

/**
 * @route   GET /api/student-portal/marks/subject-wise
 * @desc    Get aggregated marks metrics grouped by subject
 * @access  Protected (Student)
 */
router.get("/marks/subject-wise", authenticateStudent, async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.id);
    const { startDate, endDate } = req.query;

    // Match conditions
    const matchStage = { studentId };
    
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        matchStage.date.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.date.$lte = new Date(endDate + "T23:59:59.999Z");
      }
    }

    const subjectStats = await DvtMarks.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$subject",
          totalVivas: { $sum: 1 },
          averageMark: { $avg: "$mark" },
          poorCount: { $sum: { $cond: [{ $eq: ["$mark", 0] }, 1, 0] } },
          goodCount: { $sum: { $cond: [{ $eq: ["$mark", 1] }, 1, 0] } },
          greatCount: { $sum: { $cond: [{ $eq: ["$mark", 2] }, 1, 0] } },
          punishmentsCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$punishment", null] },
                    { $ne: ["$punishment", ""] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lastEvaluated: { $max: "$date" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const stats = subjectStats.map(stat => ({
      subject: stat._id || "Unknown Subject",
      totalVivas: stat.totalVivas,
      averageMark: parseFloat(stat.averageMark.toFixed(2)),
      distribution: {
        poor: stat.poorCount,
        good: stat.goodCount,
        great: stat.greatCount
      },
      punishmentsCount: stat.punishmentsCount,
      lastEvaluated: stat.lastEvaluated
    }));

    res.json({
      success: true,
      count: stats.length,
      subjects: stats
    });

  } catch (error) {
    console.error("Error aggregating subject-wise marks:", error);
    res.status(500).json({ success: false, error: "Failed to generate subject-wise metrics" });
  }
});

/**
 * @route   GET /api/student-portal/subjects
 * @desc    Get all distinct subject names the student has received evaluations for
 * @access  Protected (Student)
 */
router.get("/subjects", authenticateStudent, async (req, res) => {
  try {
    const subjects = await DvtMarks.distinct("subject", {
      studentId: new mongoose.Types.ObjectId(req.user.id)
    });
    
    // Sort subject names alphabetically
    subjects.sort();

    res.json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    console.error("Error fetching student subjects list:", error);
    res.status(500).json({ success: false, error: "Failed to fetch student subjects" });
  }
});

/**
 * @route   GET /api/student-portal/assignments
 * @desc    Get assignments for the student's class, populated with the specific student's marks
 * @access  Protected (Student)
 */
router.get("/assignments", authenticateStudent, async (req, res) => {
  try {
    // Look up assignments assigned to the student's class and collegeId
    const assignments = await Assignment.find({
      class: req.user.class,
      collegeId: new mongoose.Types.ObjectId(req.user.collegeId)
    }).sort({ createdAt: -1 });

    const studentIdStr = req.user.id;

    // Filter/format assignment payload to return only the student's specific grades
    const formattedAssignments = assignments.map(assign => {
      const studentGrade = assign.marks.find(m => m.studentId.toString() === studentIdStr);
      
      return {
        _id: assign._id,
        name: assign.name,
        detail: assign.detail || "",
        subject: assign.subject,
        class: assign.class,
        maxMarks: assign.maxMarks,
        grade: studentGrade ? {
          markObtained: studentGrade.mark,
          percentage: parseFloat(((studentGrade.mark / assign.maxMarks) * 100).toFixed(2)),
          gradedAt: studentGrade.updatedAt
        } : null,
        createdAt: assign.createdAt
      };
    });

    res.json({
      success: true,
      count: formattedAssignments.length,
      assignments: formattedAssignments
    });

  } catch (error) {
    console.error("Error fetching student assignments:", error);
    res.status(500).json({ success: false, error: "Failed to fetch assignments" });
  }
});

/**
 * @route   GET /api/student-portal/improvements
 * @desc    Get improvement tasks assigned to the student, with filtering options
 * @access  Protected (Student)
 */
router.get("/improvements", authenticateStudent, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, subject } = req.query;

    const query = { student: new mongoose.Types.ObjectId(studentId) };

    if (status) {
      query.status = status; // 'given' or 'done'
    }

    if (subject) {
      query.subject = { $regex: new RegExp(subject, "i") };
    }

    const improvements = await Improvement.find(query)
      .populate("teacher", "name email phone")
      .sort({ dueDate: 1 });

    const formattedImprovements = improvements.map(imp => ({
      _id: imp._id,
      subject: imp.subject,
      class: imp.class,
      description: imp.description,
      dueDate: imp.dueDate,
      status: imp.status, // 'given' or 'done'
      assignedAt: imp.assignedAt,
      completedAt: imp.completedAt || null,
      teacher: imp.teacher ? {
        name: imp.teacher.name,
        email: imp.teacher.email,
        phone: imp.teacher.phone
      } : null
    }));

    res.json({
      success: true,
      count: formattedImprovements.length,
      improvements: formattedImprovements
    });

  } catch (error) {
    console.error("Error fetching student improvements:", error);
    res.status(500).json({ success: false, error: "Failed to fetch improvement tasks" });
  }
});

module.exports = router;
