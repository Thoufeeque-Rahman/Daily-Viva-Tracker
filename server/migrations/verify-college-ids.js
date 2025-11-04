const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const College = require('../models/College');
const Student = require('../models/Students');
const Teacher = require('../models/Teachers');
const DvtMarks = require('../models/DvtMarks');
const Improvements = require('../models/Improvements');
const Rounds = require('../models/Rounds');
const Subjects = require('../models/Subjects');
const GradingConfig = require('../models/GradingConfig');
const Semesters = require('../models/Semesters');

async function verifyCollegeIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Get all colleges
    const colleges = await College.find({});
    console.log(`\n=== COLLEGES IN DATABASE ===`);
    colleges.forEach((college, index) => {
      console.log(`${index + 1}. ${college.name} (ID: ${college._id})`);
      console.log(`   Address: ${college.address}`);
      console.log(`   Email: ${college.email || 'Not set'}`);
      console.log(`   Phone: ${college.phone || 'Not set'}`);
      console.log(`   Active: ${college.isActive}`);
      console.log('');
    });

    // Check all models for college ID coverage
    console.log('=== DATA VERIFICATION REPORT ===');

    // Students
    const totalStudents = await Student.countDocuments({});
    const studentsWithCollegeId = await Student.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n📚 STUDENTS:`);
    console.log(`   Total: ${totalStudents}`);
    console.log(`   With College ID: ${studentsWithCollegeId}`);
    console.log(`   Coverage: ${totalStudents > 0 ? ((studentsWithCollegeId / totalStudents) * 100).toFixed(1) : 0}%`);

    // Teachers
    const totalTeachers = await Teacher.countDocuments({});
    const teachersWithCollegeId = await Teacher.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n👨‍🏫 TEACHERS:`);
    console.log(`   Total: ${totalTeachers}`);
    console.log(`   With College ID: ${teachersWithCollegeId}`);
    console.log(`   Coverage: ${totalTeachers > 0 ? ((teachersWithCollegeId / totalTeachers) * 100).toFixed(1) : 0}%`);

    // DVT Marks
    const totalDvtMarks = await DvtMarks.countDocuments({});
    const dvtMarksWithCollegeId = await DvtMarks.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n📊 DVT MARKS:`);
    console.log(`   Total: ${totalDvtMarks}`);
    console.log(`   With College ID: ${dvtMarksWithCollegeId}`);
    console.log(`   Coverage: ${totalDvtMarks > 0 ? ((dvtMarksWithCollegeId / totalDvtMarks) * 100).toFixed(1) : 0}%`);

    // Improvements
    const totalImprovements = await Improvements.countDocuments({});
    const improvementsWithCollegeId = await Improvements.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n📈 IMPROVEMENTS:`);
    console.log(`   Total: ${totalImprovements}`);
    console.log(`   With College ID: ${improvementsWithCollegeId}`);
    console.log(`   Coverage: ${totalImprovements > 0 ? ((improvementsWithCollegeId / totalImprovements) * 100).toFixed(1) : 0}%`);

    // Rounds
    const totalRounds = await Rounds.countDocuments({});
    const roundsWithCollegeId = await Rounds.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n🔄 ROUNDS:`);
    console.log(`   Total: ${totalRounds}`);
    console.log(`   With College ID: ${roundsWithCollegeId}`);
    console.log(`   Coverage: ${totalRounds > 0 ? ((roundsWithCollegeId / totalRounds) * 100).toFixed(1) : 0}%`);

    // Subjects
    const totalSubjects = await Subjects.countDocuments({});
    const subjectsWithCollegeId = await Subjects.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n📖 SUBJECTS:`);
    console.log(`   Total: ${totalSubjects}`);
    console.log(`   With College ID: ${subjectsWithCollegeId}`);
    console.log(`   Coverage: ${totalSubjects > 0 ? ((subjectsWithCollegeId / totalSubjects) * 100).toFixed(1) : 0}%`);

    // Grading Configs
    const totalGradingConfigs = await GradingConfig.countDocuments({});
    const gradingConfigsWithCollegeId = await GradingConfig.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n⚙️  GRADING CONFIGS:`);
    console.log(`   Total: ${totalGradingConfigs}`);
    console.log(`   With College ID: ${gradingConfigsWithCollegeId}`);
    console.log(`   Coverage: ${totalGradingConfigs > 0 ? ((gradingConfigsWithCollegeId / totalGradingConfigs) * 100).toFixed(1) : 0}%`);

    // Semesters
    const totalSemesters = await Semesters.countDocuments({});
    const semestersWithCollegeId = await Semesters.countDocuments({ collegeId: { $exists: true, $ne: null } });
    console.log(`\n📅 SEMESTERS:`);
    console.log(`   Total: ${totalSemesters}`);
    console.log(`   With College ID: ${semestersWithCollegeId}`);
    console.log(`   Coverage: ${totalSemesters > 0 ? ((semestersWithCollegeId / totalSemesters) * 100).toFixed(1) : 0}%`);

    // Summary
    const totalRecords = totalStudents + totalTeachers + totalDvtMarks + totalImprovements + 
                        totalRounds + totalSubjects + totalGradingConfigs + totalSemesters;
    const recordsWithCollegeId = studentsWithCollegeId + teachersWithCollegeId + dvtMarksWithCollegeId + 
                                improvementsWithCollegeId + roundsWithCollegeId + subjectsWithCollegeId + 
                                gradingConfigsWithCollegeId + semestersWithCollegeId;

    console.log(`\n=== OVERALL SUMMARY ===`);
    console.log(`Total Records: ${totalRecords}`);
    console.log(`Records with College ID: ${recordsWithCollegeId}`);
    console.log(`Overall Coverage: ${totalRecords > 0 ? ((recordsWithCollegeId / totalRecords) * 100).toFixed(1) : 0}%`);
    console.log(`Total Colleges: ${colleges.length}`);

    if (recordsWithCollegeId === totalRecords && totalRecords > 0) {
      console.log(`\n✅ PERFECT! All ${totalRecords} records have college IDs assigned.`);
    } else {
      console.log(`\n⚠️  ${totalRecords - recordsWithCollegeId} records are missing college IDs.`);
    }

    // College distribution
    if (colleges.length > 0) {
      console.log(`\n=== COLLEGE DATA DISTRIBUTION ===`);
      for (const college of colleges) {
        const collegeStudents = await Student.countDocuments({ collegeId: college._id });
        const collegeTeachers = await Teacher.countDocuments({ collegeId: college._id });
        const collegeDvtMarks = await DvtMarks.countDocuments({ collegeId: college._id });
        const collegeImprovements = await Improvements.countDocuments({ collegeId: college._id });
        const collegeRounds = await Rounds.countDocuments({ collegeId: college._id });
        const collegeSubjects = await Subjects.countDocuments({ collegeId: college._id });

        console.log(`\n🏛️  ${college.name}:`);
        console.log(`   Students: ${collegeStudents}`);
        console.log(`   Teachers: ${collegeTeachers}`);
        console.log(`   DVT Marks: ${collegeDvtMarks}`);
        console.log(`   Improvements: ${collegeImprovements}`);
        console.log(`   Rounds: ${collegeRounds}`);
        console.log(`   Subjects: ${collegeSubjects}`);
      }
    }

  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the verification
verifyCollegeIds();