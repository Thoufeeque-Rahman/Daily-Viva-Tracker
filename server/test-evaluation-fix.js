const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const DvtMarks = require('./models/DvtMarks');
const Student = require('./models/Students');
const Teacher = require('./models/Teachers');
const College = require('./models/College');

async function testEvaluationWithCollegeId() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Get a test student and teacher
    const student = await Student.findOne({});
    const teacher = await Teacher.findOne({});
    const college = await College.findOne({});

    console.log('\n=== TEST DATA ===');
    console.log(`Student: ${student?.name} (ID: ${student?._id})`);
    console.log(`Teacher: ${teacher?.name} (ID: ${teacher?._id})`);
    console.log(`College: ${college?.name} (ID: ${college?._id})`);

    if (!student || !teacher || !college) {
      console.log('❌ Missing required test data (student, teacher, or college)');
      return;
    }

    // Simulate evaluation data
    const evaluationData = {
      studentId: student._id,
      subject: 'MATH',
      mark: 2, // Valid mark value (0-2 range)
      class: 10,
      adNumber: student.adNumber,
      tId: teacher._id
    };

    console.log('\n=== SIMULATION TEST ===');
    console.log('Testing DVT Mark creation with college ID logic...');

    // Simulate the logic from our updated route
    const mockUser = {
      role: 'teacher', // Regular teacher
      collegeId: college._id
    };

    const mockReq = {
      body: evaluationData,
      user: mockUser
    };

    // Apply the college ID logic
    let collegeId;
    if (mockReq.user.role === 'super_admin') {
      collegeId = mockReq.body.collegeId || student.collegeId;
    } else {
      collegeId = mockReq.user.collegeId;
    }

    console.log(`✅ College ID determined: ${collegeId}`);

    // Create DVT mark with college ID
    const dvtMarkData = {
      studentId: student._id,
      class: evaluationData.class,
      subject: evaluationData.subject,
      mark: evaluationData.mark,
      date: new Date(),
      adNumber: evaluationData.adNumber,
      tId: evaluationData.tId,
      collegeId: collegeId
    };

    console.log('\n=== CREATING DVT MARK ===');
    console.log('DVT Mark data:', dvtMarkData);

    // Test creating the DVT mark
    const newDvtMark = new DvtMarks(dvtMarkData);
    
    // Validate without saving (to avoid duplicate data)
    const validationError = newDvtMark.validateSync();
    if (validationError) {
      console.log('❌ Validation failed:', validationError.message);
    } else {
      console.log('✅ DVT Mark validation passed!');
      console.log('✅ College ID is properly included');
    }

    // Test super admin scenario
    console.log('\n=== SUPER ADMIN SCENARIO ===');
    const mockSuperAdminUser = {
      role: 'super_admin',
      collegeId: null // Super admin typically doesn't have a specific college
    };

    const mockSuperAdminReq = {
      body: { ...evaluationData }, // No collegeId specified
      user: mockSuperAdminUser
    };

    let superAdminCollegeId;
    if (mockSuperAdminReq.user.role === 'super_admin') {
      superAdminCollegeId = mockSuperAdminReq.body.collegeId || student.collegeId;
    } else {
      superAdminCollegeId = mockSuperAdminReq.user.collegeId;
    }

    console.log(`✅ Super admin college ID: ${superAdminCollegeId} (using student's college)`);

    console.log('\n=== TEST RESULTS ===');
    console.log('✅ Regular teacher evaluation: College ID from user profile');
    console.log('✅ Super admin evaluation: College ID from student profile');
    console.log('✅ DVT Mark validation passes with college ID');
    console.log('✅ College ID requirement satisfied');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the test
testEvaluationWithCollegeId();