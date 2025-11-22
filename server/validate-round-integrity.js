const mongoose = require("mongoose");
require('dotenv').config({ path: '../.env' });

// Import models
const Rounds = require("../models/Rounds");
const Students = require("../models/Students");

// Get MongoDB URL from environment
const MONGODB_URL = process.env.MONGODB_URL;

async function validateRoundCollegeIntegrity() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URL, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log("Connected to MongoDB");
    console.log("Starting round college integrity validation...\n");

    // Fetch all rounds
    const rounds = await Rounds.find({});
    console.log(`Found ${rounds.length} rounds to validate`);

    let issuesFound = 0;
    let totalStudentsChecked = 0;

    for (const round of rounds) {
      const { _id, collegeId, studentsNotAsked, studentsAsked, subject, class: classNum } = round;
      
      // Combine all student IDs from the round
      const allStudentIds = [...(studentsNotAsked || []), ...(studentsAsked || [])];
      
      if (allStudentIds.length === 0) {
        console.log(`⚠️  Round ${_id} has no students`);
        continue;
      }

      totalStudentsChecked += allStudentIds.length;

      // Find all students in this round
      const students = await Students.find({
        _id: { $in: allStudentIds }
      });

      // Check if all students belong to the same college as the round
      const studentsFromWrongCollege = students.filter(student => 
        !student.collegeId.equals(collegeId)
      );

      if (studentsFromWrongCollege.length > 0) {
        issuesFound++;
        console.log(`\n🚨 ISSUE FOUND in Round ${_id}:`);
        console.log(`   Subject: ${subject}, Class: ${classNum}`);
        console.log(`   Round College: ${collegeId}`);
        console.log(`   Students from wrong colleges:`);
        
        for (const student of studentsFromWrongCollege) {
          console.log(`     - ${student.name} (ID: ${student._id}) belongs to college ${student.collegeId}`);
        }
        
        console.log(`   Total students in round: ${allStudentIds.length}`);
        console.log(`   Students from wrong college: ${studentsFromWrongCollege.length}`);
        console.log(`   Students from correct college: ${students.length - studentsFromWrongCollege.length}`);
      } else {
        console.log(`✅ Round ${_id} - All ${students.length} students belong to correct college`);
      }
    }

    console.log(`\n📊 VALIDATION SUMMARY:`);
    console.log(`   Total rounds checked: ${rounds.length}`);
    console.log(`   Total student entries checked: ${totalStudentsChecked}`);
    console.log(`   Rounds with college integrity issues: ${issuesFound}`);
    
    if (issuesFound === 0) {
      console.log(`\n🎉 SUCCESS: No college integrity issues found!`);
    } else {
      console.log(`\n⚠️  WARNING: ${issuesFound} rounds have students from other colleges`);
      console.log(`   This could indicate a security issue where students from different colleges`);
      console.log(`   are being included in rounds they shouldn't have access to.`);
    }

  } catch (error) {
    console.error("Error during validation:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
}

// Run the validation
validateRoundCollegeIntegrity();