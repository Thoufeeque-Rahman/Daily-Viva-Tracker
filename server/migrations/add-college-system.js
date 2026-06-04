const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Import models
const College = require('../models/College');
const Student = require('../models/Students');
const Teacher = require('../models/Teachers');
const DvtMark = require('../models/DvtMarks');
const Improvement = require('../models/Improvements');
const GradingConfig = require('../models/GradingConfig');
const Round = require('../models/Rounds');
const Semester = require('../models/Semesters');
const Subject = require('../models/Subjects');

async function migrateToCollegeSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Create default college
    const defaultCollege = new College({
      name: 'Default College', // You can change this to the actual college name
      address: '123 Default Address, City, State', // You can change this
      phone: '+1234567890', // Optional
      email: 'admin@defaultcollege.edu', // Optional
      establishedYear: new Date().getFullYear(),
      principalName: 'Principal Name', // Optional
      isActive: true
    });

    const savedCollege = await defaultCollege.save();
    console.log('Created default college:', savedCollege.name, 'with ID:', savedCollege._id);

    // Update all existing records with the default college ID
    const collegeId = savedCollege._id;

    // Update Students
    const studentUpdateResult = await Student.updateMany(
      { collegeId: { $exists: false } },
      { $set: { collegeId } }
    );
    console.log(`Updated ${studentUpdateResult.modifiedCount} students with college ID`);

    // Update Teachers (except super admins)
    const teacherUpdateResult = await Teacher.updateMany(
      { 
        collegeId: { $exists: false },
        role: { $ne: 'super_admin' }
      },
      { $set: { collegeId } }
    );
    console.log(`Updated ${teacherUpdateResult.modifiedCount} teachers with college ID`);

    // Update DVT Marks
    const dvtMarksUpdateResult = await DvtMark.updateMany(
      { collegeId: { $exists: false } },
      { $set: { collegeId } }
    );
    console.log(`Updated ${dvtMarksUpdateResult.modifiedCount} DVT marks with college ID`);

    // Update Improvements
    const improvementsUpdateResult = await Improvement.updateMany(
      { collegeId: { $exists: false } },
      { $set: { collegeId } }
    );
    console.log(`Updated ${improvementsUpdateResult.modifiedCount} improvements with college ID`);

    // Update Grading Configs
    const gradingConfigUpdateResult = await GradingConfig.updateMany(
      { collegeId: { $exists: false } },
      { $set: { collegeId } }
    );
    console.log(`Updated ${gradingConfigUpdateResult.modifiedCount} grading configs with college ID`);

    // Update Rounds
    const roundsUpdateResult = await Round.updateMany(
      { collegeId: { $exists: false } },
      { $set: { collegeId } }
    );
    console.log(`Updated ${roundsUpdateResult.modifiedCount} rounds with college ID`);

    // Update Semesters
    const semestersUpdateResult = await Semester.updateMany(
      { collegeId: { $exists: false } },
      { $set: { collegeId } }
    );
    console.log(`Updated ${semestersUpdateResult.modifiedCount} semesters with college ID`);

    // Update Subjects
    const subjectsUpdateResult = await Subject.updateMany(
      { collegeId: { $exists: false } },
      { $set: { collegeId } }
    );
    console.log(`Updated ${subjectsUpdateResult.modifiedCount} subjects with college ID`);

    console.log('\n=== Migration Summary ===');
    console.log(`Default College Created: ${savedCollege.name} (ID: ${savedCollege._id})`);
    console.log(`Students Updated: ${studentUpdateResult.modifiedCount}`);
    console.log(`Teachers Updated: ${teacherUpdateResult.modifiedCount}`);
    console.log(`DVT Marks Updated: ${dvtMarksUpdateResult.modifiedCount}`);
    console.log(`Improvements Updated: ${improvementsUpdateResult.modifiedCount}`);
    console.log(`Grading Configs Updated: ${gradingConfigUpdateResult.modifiedCount}`);
    console.log(`Rounds Updated: ${roundsUpdateResult.modifiedCount}`);
    console.log(`Semesters Updated: ${semestersUpdateResult.modifiedCount}`);
    console.log(`Subjects Updated: ${subjectsUpdateResult.modifiedCount}`);
    console.log('=========================');

    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateToCollegeSystem();
}

module.exports = { migrateToCollegeSystem };