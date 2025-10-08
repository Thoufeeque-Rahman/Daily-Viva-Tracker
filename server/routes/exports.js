const express = require("express");
const router = express.Router();
const DvtMarks = require("../models/DvtMarks");
const Student = require("../models/Students");
const Teachers = require("../models/Teachers");
const { authenticateToken } = require("../middleware/auth");

// Helper function to convert data to CSV
function convertToCSV(data, headers) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

// Export marks by student
router.get("/student-wise", authenticateToken, async (req, res) => {
  try {
    const { studentId, startDate, endDate, subject, class: classNum } = req.query;

    let query = {};
    
    if (studentId) query.studentId = studentId;
    if (subject) query.subject = subject;
    if (classNum) query.class = parseInt(classNum);
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const marks = await DvtMarks.find(query)
      .populate('studentId', 'name rollNumber adNumber')
      .sort({ date: -1 });

    const csvData = marks.map(mark => ({
      'Student Name': mark.studentId?.name || 'N/A',
      'Roll Number': mark.studentId?.rollNumber || 'N/A',
      'Admission Number': mark.studentId?.adNumber || 'N/A',
      'Subject': mark.subject,
      'Class': mark.class,
      'Mark': mark.mark,
      'Grade': mark.mark === 2 ? 'Great' : mark.mark === 1 ? 'Good' : 'Poor',
      'Date': new Date(mark.date).toLocaleDateString(),
      'Teacher ID': mark.tId || 'N/A',
      'Punishment': mark.punishment || 'N/A'
    }));

    const csv = convertToCSV(csvData, [
      'Student Name', 'Roll Number', 'Admission Number', 'Subject', 'Class', 
      'Mark', 'Grade', 'Date', 'Teacher ID', 'Punishment'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="student-marks.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting student-wise marks:", error);
    res.status(500).json({ error: "Failed to export student-wise marks" });
  }
});

// Export marks by class
router.get("/class-wise", authenticateToken, async (req, res) => {
  try {
    const { class: classNum, startDate, endDate, subject } = req.query;

    let query = { class: parseInt(classNum) };
    
    if (subject) query.subject = subject;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const marks = await DvtMarks.find(query)
      .populate('studentId', 'name rollNumber adNumber')
      .sort({ date: -1 });

    // Group by student
    const studentMarks = {};
    marks.forEach(mark => {
      const studentId = mark.studentId._id;
      if (!studentMarks[studentId]) {
        studentMarks[studentId] = {
          student: mark.studentId,
          marks: [],
          totalMarks: 0,
          totalQuestions: 0
        };
      }
      studentMarks[studentId].marks.push(mark);
      studentMarks[studentId].totalMarks += mark.mark;
      studentMarks[studentId].totalQuestions += 1;
    });

    const csvData = Object.values(studentMarks).map(studentData => {
      const percentage = studentData.totalQuestions > 0 
        ? ((studentData.totalMarks / (studentData.totalQuestions * 2)) * 100).toFixed(2)
        : 0;
      
      return {
        'Student Name': studentData.student.name,
        'Roll Number': studentData.student.rollNumber,
        'Admission Number': studentData.student.adNumber,
        'Class': classNum,
        'Total Questions': studentData.totalQuestions,
        'Total Marks': studentData.totalMarks,
        'Percentage': percentage + '%',
        'Average Grade': studentData.totalQuestions > 0 
          ? (studentData.totalMarks / studentData.totalQuestions >= 1.5 ? 'Great' 
            : studentData.totalMarks / studentData.totalQuestions >= 0.5 ? 'Good' : 'Poor')
          : 'N/A'
      };
    });

    const csv = convertToCSV(csvData, [
      'Student Name', 'Roll Number', 'Admission Number', 'Class', 
      'Total Questions', 'Total Marks', 'Percentage', 'Average Grade'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="class-marks.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting class-wise marks:", error);
    res.status(500).json({ error: "Failed to export class-wise marks" });
  }
});

// Export marks by subject
router.get("/subject-wise", authenticateToken, async (req, res) => {
  try {
    const { subject, startDate, endDate, class: classNum } = req.query;

    let query = { subject };
    
    if (classNum) query.class = parseInt(classNum);
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const marks = await DvtMarks.find(query)
      .populate('studentId', 'name rollNumber adNumber')
      .sort({ date: -1 });

    // Group by student
    const studentMarks = {};
    marks.forEach(mark => {
      const studentId = mark.studentId._id;
      if (!studentMarks[studentId]) {
        studentMarks[studentId] = {
          student: mark.studentId,
          marks: [],
          totalMarks: 0,
          totalQuestions: 0
        };
      }
      studentMarks[studentId].marks.push(mark);
      studentMarks[studentId].totalMarks += mark.mark;
      studentMarks[studentId].totalQuestions += 1;
    });

    const csvData = Object.values(studentMarks).map(studentData => {
      const percentage = studentData.totalQuestions > 0 
        ? ((studentData.totalMarks / (studentData.totalQuestions * 2)) * 100).toFixed(2)
        : 0;
      
      return {
        'Student Name': studentData.student.name,
        'Roll Number': studentData.student.rollNumber,
        'Admission Number': studentData.student.adNumber,
        'Subject': subject,
        'Class': studentData.marks[0]?.class || 'N/A',
        'Total Questions': studentData.totalQuestions,
        'Total Marks': studentData.totalMarks,
        'Percentage': percentage + '%',
        'Average Grade': studentData.totalQuestions > 0 
          ? (studentData.totalMarks / studentData.totalQuestions >= 1.5 ? 'Great' 
            : studentData.totalMarks / studentData.totalQuestions >= 0.5 ? 'Good' : 'Poor')
          : 'N/A'
      };
    });

    const csv = convertToCSV(csvData, [
      'Student Name', 'Roll Number', 'Admission Number', 'Subject', 'Class', 
      'Total Questions', 'Total Marks', 'Percentage', 'Average Grade'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="subject-marks.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting subject-wise marks:", error);
    res.status(500).json({ error: "Failed to export subject-wise marks" });
  }
});

// Export marks by date range
router.get("/date-wise", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, subject, class: classNum } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Start date and end date are required" });
    }

    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (subject) query.subject = subject;
    if (classNum) query.class = parseInt(classNum);

    const marks = await DvtMarks.find(query)
      .populate('studentId', 'name rollNumber adNumber')
      .sort({ date: -1 });

    const csvData = marks.map(mark => ({
      'Student Name': mark.studentId?.name || 'N/A',
      'Roll Number': mark.studentId?.rollNumber || 'N/A',
      'Admission Number': mark.studentId?.adNumber || 'N/A',
      'Subject': mark.subject,
      'Class': mark.class,
      'Mark': mark.mark,
      'Grade': mark.mark === 2 ? 'Great' : mark.mark === 1 ? 'Good' : 'Poor',
      'Date': new Date(mark.date).toLocaleDateString(),
      'Time': new Date(mark.date).toLocaleTimeString(),
      'Teacher ID': mark.tId || 'N/A',
      'Punishment': mark.punishment || 'N/A'
    }));

    const csv = convertToCSV(csvData, [
      'Student Name', 'Roll Number', 'Admission Number', 'Subject', 'Class', 
      'Mark', 'Grade', 'Date', 'Time', 'Teacher ID', 'Punishment'
    ]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="date-wise-marks.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting date-wise marks:", error);
    res.status(500).json({ error: "Failed to export date-wise marks" });
  }
});

// Get export options (available subjects, classes, etc.)
router.get("/options", authenticateToken, async (req, res) => {
  try {
    const subjects = await DvtMarks.distinct('subject');
    const classes = await DvtMarks.distinct('class');
    const students = await Student.find({}, 'name rollNumber adNumber class').sort({ rollNumber: 1 });

    res.json({
      subjects,
      classes,
      students: students.map(student => ({
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        adNumber: student.adNumber,
        class: student.class
      }))
    });
  } catch (error) {
    console.error("Error fetching export options:", error);
    res.status(500).json({ error: "Failed to fetch export options" });
  }
});

module.exports = router;


