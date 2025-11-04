const express = require("express");
const DvtMarks = require("../models/DvtMarks");
const Student = require("../models/Students");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");
const router = express.Router();

// Get all DvtMarks
router.get("/", async (req, res) => {
  try {
    // console.log("Fetching all DvtMarks...");
    const dvtMarks = await DvtMarks.find({}).sort({ date: -1 }); // Sort by date descending

    // console.log(`Found ${dvtMarks.length} DvtMarks documents`);
    if (dvtMarks.length > 0) {
      // console.log("Sample document:", JSON.stringify(dvtMarks[0], null, 2));
    }

    res.json(dvtMarks);
  } catch (error) {
    console.error("Error fetching DvtMarks:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new DvtMark
router.post("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { studentId, subject, mark, class: classNumber, adNumber, tId } = req.body;
    console.log(req.body);
    // Find the student
    const student = await Student.findOne({ _id: studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get college ID from authenticated user
    let collegeId;
    if (req.user.role === 'super_admin') {
      // For super admin, use the student's college or the provided college ID
      collegeId = req.body.collegeId || student.collegeId;
    } else {
      // For regular users, use their college ID
      collegeId = req.user.collegeId;
    }

    // Create the mark object
    const dvtMark = {
      subject,
      mark,
      date: new Date(),
      class: classNumber,
      studentId: student._id,
      adNumber,
      tId,
      collegeId,
    }; 

    // Create a new DvtMarks document
    const newDvtMark = new DvtMarks({
      studentId: student._id,
      class: classNumber,
      subject,
      mark,
      date: new Date(),
      adNumber,
      tId,
      collegeId,
    });

    // Save the new DvtMarks document
    const savedDvtMark = await newDvtMark.save();
    console.log(savedDvtMark);
    res.status(201).json({ success: true, message: "Evaluation saved successfully" });
  } catch (error) {
    console.error("Error creating DvtMark:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get DvtMarks by student ID, subject, and class for student history
router.get("/student/:studentId/:subject/:class", async (req, res) => {
  try {
    const { studentId, subject, class: classNumber } = req.params;
    
    console.log("Fetching student marks history:", {
      studentId,
      subject, 
      class: classNumber,
    });

    const dvtMarks = await DvtMarks.find({
      studentId: studentId,
      subject: subject,
      class: parseInt(classNumber),
    }).sort({ date: -1 }).limit(10); // Get last 10 records

    console.log(`Found ${dvtMarks.length} marks for student ${studentId} in ${subject} class ${classNumber}`);
    
    res.json(dvtMarks);
  } catch (error) {
    console.error("Error fetching student marks history:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get DvtMarks by subject and class
router.get("/:subject/:class", async (req, res) => {
  try {
    console.log("Fetching DvtMarks by subject and class:", {
      subject: req.params.subject,
      class: req.params.class,
    });

    const dvtMarks = await DvtMarks.find({
      subject: req.params.subject,
      class: parseInt(req.params.class),
    }).sort({ date: -1 });

    console.log(`Found ${dvtMarks.length} matching documents`);
    if (dvtMarks.length > 0) {
      console.log(
        "Sample filtered document:",
        JSON.stringify(dvtMarks[0], null, 2)
      );
    }

    res.json(dvtMarks);
  } catch (error) {
    console.error("Error fetching DvtMarks by subject and class:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete a DvtMark
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const result = await DvtMarks.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    res.json({ message: "Evaluation deleted successfully" });
  } catch (error) {
    console.error("Error deleting evaluation:", error);
    res.status(500).json({ message: "Error deleting evaluation" });
  }
});

// Update a DvtMark
router.put("/:id", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { mark } = req.body;

    // Update in DvtMarks collection
    const updatedMark = await DvtMarks.findByIdAndUpdate(
      req.params.id,
      { mark },
      { new: true }
    );

    if (!updatedMark) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    res.json(updatedMark);
  } catch (error) {
    console.error("Error updating evaluation:", error);
    res.status(500).json({ message: "Error updating evaluation" });
  }
});


// Function to get DVT marks count per day per class
async function getDvtMarksTable(startDate, endDate) {
  try {
    const result = await DvtMarks.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      // Group by date, class, and subject
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            class: "$class",
            subject: "$subject"
          },
          totalMarks: { $sum: "$mark" },
          questionCount: { $sum: 1 }
        }
      },
      // Group by date and class, collect subjects
      {
        $group: {
          _id: { date: "$_id.date", class: "$_id.class" },
          subjects: {
            $push: {
              subject: "$_id.subject",
              totalMarks: "$totalMarks",
              questionCount: "$questionCount"
            }
          }
        }
      },
      // Group by date, collect classes
      {
        $group: {
          _id: "$_id.date",
          classes: {
            $push: {
              class: "$_id.class",
              subjects: "$subjects"
            }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    return result;
  } catch (error) {
    console.error('Error fetching DVT marks:', error);
    throw error;
  }
}

// Function to format data into table structure
function formatToTable(aggregatedData, classes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const tableData = [];
  aggregatedData.forEach(dayData => {
    const row = {
      date: dayData._id,
      classes: {}
    };
    // Initialize all classes with empty subject array
    classes.forEach(classNum => {
      row.classes[classNum] = { subjects: [] };
    });
    // Fill in actual data
    dayData.classes.forEach(classData => {
      row.classes[classData.class] = {
        subjects: classData.subjects
      };
    });
    tableData.push(row);
  });
  return tableData;
}

// Usage example
async function getDvtTable() {
  try {
    const startDate = '2025-06-01'; // Adjust dates as needed
    const endDate = '2025-06-30';
    
    const aggregatedData = await getDvtMarksTable(startDate, endDate);
    const tableData = formatToTable(aggregatedData);
    
    console.log('DVT Marks Table:');
    console.log('Date\t\t1\t2\t3\t4\t5\t6\t7\t8\t9\t10');
    
    tableData.forEach(row => {
      const dateStr = row.date.padEnd(12);
      const classValues = [1,2,3,4,5,6,7,8,9,10].map(c => row.classes[c]).join('\t');
      console.log(`${dateStr}\t${classValues}`);
    });
    
    return tableData;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Alternative: Get data for specific dates (Today, Yesterday)
async function getTodayYesterdayData() {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const result = await DvtMarks.aggregate([
      {
        $match: {
          date: {
            $gte: yesterday,
            $lte: today
          }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date"
              }
            },
            class: "$class"
          },
          subjectCount: { $addToSet: "$subject" }
        }
      },
      {
        $project: {
          _id: 1,
          subjectCount: { $size: "$subjectCount" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          classes: {
            $push: {
              class: "$_id.class",
              count: "$subjectCount"
            }
          }
        }
      }
    ]);
    
    const formattedData = formatToTable(result);
    
    return {
      today: formattedData.find(row => row.date === todayStr) || { date: todayStr, classes: {} },
      yesterday: formattedData.find(row => row.date === yesterdayStr) || { date: yesterdayStr, classes: {} }
    };
    
  } catch (error) {
    console.error('Error fetching today/yesterday data:', error);
    throw error;
  }
}

// Express.js route example
router.get("/dvtmarksbydate", authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const aggregatedData = await getDvtMarksTable(
      startDate || '2025-06-17', 
      endDate || new Date(),
    );
    
    const tableData = formatToTable(aggregatedData);
    
    res.json({
      success: true,
      data: tableData,
      summary: {
        totalDays: tableData.length,
        dateRange: { startDate, endDate }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk Evaluation - Batch Mode (save multiple students at once)
router.post("/bulk-batch", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { evaluations, subject, class: classNumber, tId } = req.body;
    
    // Validate input
    if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Evaluations array is required and must not be empty" 
      });
    }

    const savedEvaluations = [];
    const errors = [];

    // Process each evaluation
    for (const evaluation of evaluations) {
      try {
        const { studentId, evaluation: evalName, mark } = evaluation;
        
        // Find the student
        const student = await Student.findOne({ _id: studentId });
        if (!student) {
          errors.push({ studentId, error: "Student not found" });
          continue;
        }

        // Get college ID from authenticated user or student
        let collegeId;
        if (req.user.role === 'super_admin') {
          // For super admin, use the student's college or the provided college ID
          collegeId = req.body.collegeId || student.collegeId;
        } else {
          // For regular users, use their college ID
          collegeId = req.user.collegeId;
        }

        // Create a new DvtMarks document
        const newDvtMark = new DvtMarks({
          studentId: student._id,
          class: classNumber,
          subject,
          mark,
          date: new Date(),
          adNumber: student.adNumber,
          tId,
          collegeId,
        });

        const savedMark = await newDvtMark.save();
        savedEvaluations.push({
          studentId,
          studentName: student.name,
          rollNumber: student.rollNumber,
          evaluation: evalName,
          mark,
          savedId: savedMark._id
        });

      } catch (error) {
        console.error(`Error saving evaluation for student ${evaluation.studentId}:`, error);
        errors.push({ 
          studentId: evaluation.studentId, 
          error: error.message 
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully saved ${savedEvaluations.length} evaluations`,
      data: {
        saved: savedEvaluations,
        errors: errors,
        summary: {
          total: evaluations.length,
          successful: savedEvaluations.length,
          failed: errors.length
        }
      }
    });

  } catch (error) {
    console.error("Bulk batch evaluation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save bulk evaluations",
      error: error.message
    });
  }
});

// Bulk Evaluation - Individual Mode (save single student immediately)
router.post("/bulk-individual", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { studentId, evaluation, mark, subject, class: classNumber, tId } = req.body;
    
    // Validate input
    if (!studentId || !evaluation || mark === undefined || !subject || !classNumber) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required: studentId, evaluation, mark, subject, class" 
      });
    }

    // Find the student
    const student = await Student.findOne({ _id: studentId });
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }

    // Get college ID from authenticated user or student
    let collegeId;
    if (req.user.role === 'super_admin') {
      // For super admin, use the student's college or the provided college ID
      collegeId = req.body.collegeId || student.collegeId;
    } else {
      // For regular users, use their college ID
      collegeId = req.user.collegeId;
    }

    // Create a new DvtMarks document
    const newDvtMark = new DvtMarks({
      studentId: student._id,
      class: classNumber,
      subject,
      mark,
      date: new Date(),
      adNumber: student.adNumber,
      tId,
      collegeId,
    });

    const savedMark = await newDvtMark.save();

    res.json({
      success: true,
      message: "Evaluation saved successfully",
      data: {
        studentId,
        studentName: student.name,
        rollNumber: student.rollNumber,
        evaluation,
        mark,
        savedId: savedMark._id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Individual evaluation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save evaluation",
      error: error.message
    });
  }
});

module.exports = router;
