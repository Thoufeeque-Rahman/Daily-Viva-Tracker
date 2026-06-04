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

async function ensureCollegeIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Get or create default college
    let defaultCollege = await College.findOne({ name: 'Default College' });
    if (!defaultCollege) {
      console.log('Creating default college...');
      defaultCollege = await College.create({
        name: 'Default College',
        address: 'Default Street, Default City, Default State - 000000, India',
        phone: '0000000000',
        email: 'default@college.edu',
        website: 'www.defaultcollege.edu'
      });
      console.log(`Created default college with ID: ${defaultCollege._id}`);
    } else {
      console.log(`Using existing default college with ID: ${defaultCollege._id}`);
    }

    const defaultCollegeId = defaultCollege._id;
    let totalUpdated = 0;

    // Check and update Students
    console.log('\n--- Checking Students ---');
    const studentsWithoutCollege = await Student.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`Students without college ID: ${studentsWithoutCollege}`);
    
    if (studentsWithoutCollege > 0) {
      const studentResult = await Student.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${studentResult.modifiedCount} students with college ID`);
      totalUpdated += studentResult.modifiedCount;
    }

    // Check and update Teachers
    console.log('\n--- Checking Teachers ---');
    const teachersWithoutCollege = await Teacher.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`Teachers without college ID: ${teachersWithoutCollege}`);
    
    if (teachersWithoutCollege > 0) {
      const teacherResult = await Teacher.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${teacherResult.modifiedCount} teachers with college ID`);
      totalUpdated += teacherResult.modifiedCount;
    }

    // Check and update DvtMarks
    console.log('\n--- Checking DVT Marks ---');
    const dvtMarksWithoutCollege = await DvtMarks.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`DVT Marks without college ID: ${dvtMarksWithoutCollege}`);
    
    if (dvtMarksWithoutCollege > 0) {
      const dvtMarksResult = await DvtMarks.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${dvtMarksResult.modifiedCount} DVT marks with college ID`);
      totalUpdated += dvtMarksResult.modifiedCount;
    }

    // Check and update Improvements
    console.log('\n--- Checking Improvements ---');
    const improvementsWithoutCollege = await Improvements.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`Improvements without college ID: ${improvementsWithoutCollege}`);
    
    if (improvementsWithoutCollege > 0) {
      const improvementsResult = await Improvements.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${improvementsResult.modifiedCount} improvements with college ID`);
      totalUpdated += improvementsResult.modifiedCount;
    }

    // Check and update Rounds
    console.log('\n--- Checking Rounds ---');
    const roundsWithoutCollege = await Rounds.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`Rounds without college ID: ${roundsWithoutCollege}`);
    
    if (roundsWithoutCollege > 0) {
      const roundsResult = await Rounds.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${roundsResult.modifiedCount} rounds with college ID`);
      totalUpdated += roundsResult.modifiedCount;
    }

    // Check and update Subjects
    console.log('\n--- Checking Subjects ---');
    const subjectsWithoutCollege = await Subjects.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`Subjects without college ID: ${subjectsWithoutCollege}`);
    
    if (subjectsWithoutCollege > 0) {
      const subjectsResult = await Subjects.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${subjectsResult.modifiedCount} subjects with college ID`);
      totalUpdated += subjectsResult.modifiedCount;
    }

    // Check and update GradingConfig
    console.log('\n--- Checking Grading Configs ---');
    const gradingConfigsWithoutCollege = await GradingConfig.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`Grading configs without college ID: ${gradingConfigsWithoutCollege}`);
    
    if (gradingConfigsWithoutCollege > 0) {
      const gradingConfigResult = await GradingConfig.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${gradingConfigResult.modifiedCount} grading configs with college ID`);
      totalUpdated += gradingConfigResult.modifiedCount;
    }

    // Check and update Semesters
    console.log('\n--- Checking Semesters ---');
    const semestersWithoutCollege = await Semesters.countDocuments({ 
      $or: [{ collegeId: { $exists: false } }, { collegeId: null }] 
    });
    console.log(`Semesters without college ID: ${semestersWithoutCollege}`);
    
    if (semestersWithoutCollege > 0) {
      const semestersResult = await Semesters.updateMany(
        { $or: [{ collegeId: { $exists: false } }, { collegeId: null }] },
        { $set: { collegeId: defaultCollegeId } }
      );
      console.log(`Updated ${semestersResult.modifiedCount} semesters with college ID`);
      totalUpdated += semestersResult.modifiedCount;
    }

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total records updated: ${totalUpdated}`);
    console.log(`Default College ID used: ${defaultCollegeId}`);

    // Final verification - count records without college ID
    console.log('\n=== FINAL VERIFICATION ===');
    const finalCounts = {
      students: await Student.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }),
      teachers: await Teacher.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }),
      dvtMarks: await DvtMarks.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }),
      improvements: await Improvements.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }),
      rounds: await Rounds.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }),
      subjects: await Subjects.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }),
      gradingConfigs: await GradingConfig.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] }),
      semesters: await Semesters.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] })
    };

    console.log('Records still without college ID:');
    Object.entries(finalCounts).forEach(([model, count]) => {
      console.log(`  ${model}: ${count}`);
    });

    const totalWithoutCollegeId = Object.values(finalCounts).reduce((sum, count) => sum + count, 0);
    
    if (totalWithoutCollegeId === 0) {
      console.log('\n✅ SUCCESS: All records now have college IDs!');
    } else {
      console.log(`\n⚠️  WARNING: ${totalWithoutCollegeId} records still missing college IDs`);
    }

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the migration
ensureCollegeIds();