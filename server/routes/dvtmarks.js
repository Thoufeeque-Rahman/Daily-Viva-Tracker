const express = require("express");
const DvtMarks = require("../models/DvtMarks");
const Student = require("../models/Students");
const { authenticateToken, addCollegeFilter } = require("../middleware/auth");
const router = express.Router();

// Get all DvtMarks
router.get("/", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    console.log("Fetching DvtMarks with college filter:", req.collegeFilter);
    const dvtMarks = await DvtMarks.find(req.collegeFilter || {}).sort({ date: -1 }); // Sort by date descending

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
router.get("/student/:studentId/:subject/:class", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { studentId, subject, class: classNumber } = req.params;
    
    console.log("Fetching student marks history:", {
      studentId,
      subject, 
      class: classNumber,
    });

    const queryConditions = {
      studentId: studentId,
      subject: subject,
      class: parseInt(classNumber),
      ...(req.collegeFilter || {})
    };

    const dvtMarks = await DvtMarks.find(queryConditions).sort({ date: -1 }).limit(10); // Get last 10 records

    console.log(`Found ${dvtMarks.length} marks for student ${studentId} in ${subject} class ${classNumber}`);
    
    res.json(dvtMarks);
  } catch (error) {
    console.error("Error fetching student marks history:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get DvtMarks by subject and class
router.get("/:subject/:class", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    console.log("Fetching DvtMarks by subject and class:", {
      subject: req.params.subject,
      class: req.params.class,
    });

    const queryConditions = {
      subject: req.params.subject,
      class: parseInt(req.params.class),
      ...(req.collegeFilter || {})
    };

    const dvtMarks = await DvtMarks.find(queryConditions).sort({ date: -1 });

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
async function getDvtMarksTable(startDate, endDate, collegeFilter = {}) {
  try {
    // Ensure proper date range - include full end date
    const startDateTime = new Date(startDate + 'T00:00:00.000Z');
    const endDateTime = new Date(endDate + 'T23:59:59.999Z');
    
    const matchConditions = {
      date: {
        $gte: startDateTime,
        $lte: endDateTime
      },
      ...collegeFilter
    };

    console.log("getDvtMarksTable - Match conditions:", JSON.stringify(matchConditions, null, 2));

    const result = await DvtMarks.aggregate([
      {
        $match: matchConditions
      },
      // Group by date, class, and subject first
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
    
    // Initialize all classes with empty data matching frontend expectations
    classes.forEach(classNum => {
      row.classes[classNum] = { 
        count: 0,
        totalMarks: 0,
        questionCount: 0,
        subjects: [] // Frontend expects this subjects array
      };
    });
    
    // Fill in actual data
    dayData.classes.forEach(classData => {
      // Use the subjects array from the new aggregation structure
      const subjects = classData.subjects || [];
      
      // Calculate totals from all subjects for this class
      const totalMarks = subjects.reduce((sum, subj) => sum + subj.totalMarks, 0);
      const questionCount = subjects.reduce((sum, subj) => sum + subj.questionCount, 0);
      
      row.classes[classData.class] = {
        count: questionCount, // Number of questions asked
        totalMarks: totalMarks,
        questionCount: questionCount,
        subjects: subjects // Use the actual subjects array from aggregation
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

// Simple test route
router.get("/test", (req, res) => {
  res.json({ 
    message: "DVT marks route is working", 
    timestamp: new Date().toISOString() 
  });
});

// Debug route to check DVT marks without authentication
router.get("/debug/dvt-data", async (req, res) => {
  try {
    // Check total documents in collection
    const totalCount = await DvtMarks.countDocuments();
    
    // Check how many have collegeId
    const withCollegeId = await DvtMarks.countDocuments({ collegeId: { $exists: true, $ne: null } });
    const withoutCollegeId = await DvtMarks.countDocuments({ 
      $or: [
        { collegeId: { $exists: false } },
        { collegeId: null }
      ]
    });
    
    // Get sample documents
    const sampleDocs = await DvtMarks.find().limit(5).sort({ date: -1 });
    
    // Get unique colleges
    const colleges = await DvtMarks.distinct('collegeId');
    
    // Get date range
    const [oldest] = await DvtMarks.find().sort({ date: 1 }).limit(1);
    const [newest] = await DvtMarks.find().sort({ date: -1 }).limit(1);
    
    res.json({
      totalDocuments: totalCount,
      withCollegeId: withCollegeId,
      withoutCollegeId: withoutCollegeId,
      dateRange: {
        oldest: oldest?.date,
        newest: newest?.date
      },
      uniqueColleges: colleges,
      sampleDocuments: sampleDocs.map(doc => ({
        _id: doc._id,
        studentId: doc.studentId,
        collegeId: doc.collegeId,
        date: doc.date,
        subject: doc.subject,
        class: doc.class
      }))
    });
  } catch (error) {
    console.error("Debug route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Migration route to add collegeId to DVT marks that don't have it
router.post("/migrate/add-college-ids", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can run migrations' });
    }

    // Find DVT marks without collegeId
    const dvtMarksWithoutCollegeId = await DvtMarks.find({
      $or: [
        { collegeId: { $exists: false } },
        { collegeId: null }
      ]
    }).populate('studentId');

    console.log(`Found ${dvtMarksWithoutCollegeId.length} DVT marks without collegeId`);

    let migrated = 0;
    let errors = 0;

    for (const dvtMark of dvtMarksWithoutCollegeId) {
      try {
        if (dvtMark.studentId && dvtMark.studentId.collegeId) {
          dvtMark.collegeId = dvtMark.studentId.collegeId;
          await dvtMark.save();
          migrated++;
        } else {
          console.log(`Cannot migrate DVT mark ${dvtMark._id}: student not found or no collegeId`);
          errors++;
        }
      } catch (error) {
        console.error(`Error migrating DVT mark ${dvtMark._id}:`, error);
        errors++;
      }
    }

    res.json({
      success: true,
      message: `Migration completed. ${migrated} DVT marks updated, ${errors} errors.`,
      migrated,
      errors,
      totalFound: dvtMarksWithoutCollegeId.length
    });

  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Express.js route example
router.get("/dvtmarksbydate", authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set default date range - last 90 days to today (extended for more data)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 90);
    
    const actualStartDate = startDate || defaultStartDate.toISOString().split('T')[0];
    const actualEndDate = endDate || defaultEndDate.toISOString().split('T')[0];
    
    console.log("=== DVT MARKS BY DATE DEBUG ===");
    console.log("User:", req.user?.email, "Role:", req.user?.role);
    console.log("User CollegeId:", req.user?.collegeId, typeof req.user?.collegeId);
    console.log("College filter:", JSON.stringify(req.collegeFilter));
    console.log("Date range:", actualStartDate, "to", actualEndDate);
    
    // Check if user's collegeId matches any in database
    if (req.user?.collegeId) {
      const userCollegeMatches = await DvtMarks.countDocuments({ 
        collegeId: req.user.collegeId 
      });
      console.log(`DVT marks matching user's collegeId (${req.user.collegeId}): ${userCollegeMatches}`);
      
      // Also check with string comparison in case of type mismatch
      const userCollegeMatchesStr = await DvtMarks.countDocuments({ 
        collegeId: req.user.collegeId.toString() 
      });
      console.log(`DVT marks matching user's collegeId as string: ${userCollegeMatchesStr}`);
    }
    
    // Get unique collegeIds in database to compare
    const uniqueCollegeIds = await DvtMarks.distinct('collegeId');
    console.log(`Unique collegeIds in database:`, uniqueCollegeIds.map(id => id ? id.toString() : 'null'));
    
    // Total DVT marks in database
    const totalInDb = await DvtMarks.countDocuments();
    console.log(`Total DVT marks in database: ${totalInDb}`);
    
    // First, let's check if there's any data in the date range without college filter
    const totalCount = await DvtMarks.countDocuments({
      date: {
        $gte: new Date(actualStartDate),
        $lte: new Date(actualEndDate + 'T23:59:59.999Z')
      }
    });
    console.log(`Total DVT marks in date range (all colleges): ${totalCount}`);
    
    // Check with college filter
    const collegeFilteredCount = await DvtMarks.countDocuments({
      date: {
        $gte: new Date(actualStartDate),
        $lte: new Date(actualEndDate + 'T23:59:59.999Z')
      },
      ...(req.collegeFilter || {})
    });
    console.log(`DVT marks with college filter: ${collegeFilteredCount}`);
    
    // Check if DVT marks actually have collegeId field
    const sampleWithCollegeId = await DvtMarks.findOne({ collegeId: { $exists: true } });
    const sampleWithoutCollegeId = await DvtMarks.findOne({ collegeId: { $exists: false } });
    
    console.log("Sample with collegeId:", sampleWithCollegeId ? "exists" : "none found");
    console.log("Sample without collegeId:", sampleWithoutCollegeId ? "exists" : "none found");
    
    // Check if DVT marks have collegeId field at all
    const totalDocsWithCollegeId = await DvtMarks.countDocuments({ collegeId: { $exists: true, $ne: null } });
    const totalDocsWithoutCollegeId = await DvtMarks.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    
    console.log(`DVT marks with collegeId: ${totalDocsWithCollegeId}`);
    console.log(`DVT marks without collegeId: ${totalDocsWithoutCollegeId}`);
    
    // Determine which filter to use
    let collegeFilterToUse = req.collegeFilter || {};
    
    // If most/all DVT marks don't have collegeId, temporarily disable filtering
    if (totalDocsWithoutCollegeId > 0 && collegeFilteredCount === 0) {
      console.log("WARNING: DVT marks in database don't have collegeId field");
      console.log("TEMPORARILY DISABLING COLLEGE FILTER to retrieve data");
      collegeFilterToUse = {};
      
      // Log this for attention
      console.log("⚠️  MIGRATION NEEDED: Run POST /api/dvtmarks/migrate/add-college-ids to fix this");
    }
    
    const aggregatedData = await getDvtMarksTable(
      actualStartDate, 
      actualEndDate,
      collegeFilterToUse
    );
    
    const tableData = formatToTable(aggregatedData);
    
    console.log(`Aggregated data length: ${aggregatedData.length}`);
    console.log(`Formatted table data length: ${tableData.length}`);
    console.log("Sample aggregated data:", JSON.stringify(aggregatedData.slice(0, 2), null, 2));
    console.log("===============================");
    
    res.json({
      success: true,
      data: tableData,
      summary: {
        totalDays: tableData.length,
        dateRange: { startDate: actualStartDate, endDate: actualEndDate }
      }
    });
    
  } catch (error) {
    console.error("Error in dvtmarksbydate route:", error);
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
