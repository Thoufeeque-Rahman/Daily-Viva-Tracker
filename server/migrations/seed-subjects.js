const mongoose = require('mongoose');
require('dotenv').config();

// Import the Subjects model
const Subjects = require('../models/Subjects');

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Use environment variable or fallback to a default (you should replace this with your actual URI)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/my_dvt_db';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Predefined subjects to seed
const predefinedSubjects = [
  "THAREEQ", "THAKASUS", "Hadith", "IT", "SOCIAL", "URDU", "T&C", "THAKHASUS", 
  "ENGLISH", "MALAYALAM", "TAFSEER", "ALFIYYA", "NAHV", "BALAGHA", 
  "THAFSEER", "SWARF", "THAMADDUN", "AQEEDA", "POLITICS", "MANTHIQ", "TASAWUF", 
  "HIFZ", "SOCIOLOGY", "HADITH", "ECONOMICS", "BALAGA", "ULUMUL QURAN", "Tasawuf", 
  "MATHS", "PHILOSOPHY", "FIQH", "TAREEQ", "HINDI", "USL FIQH", "ADAB", "Tafseer", "HISTORY"
];

// Seed subjects
const seedSubjects = async () => {
  try {
    console.log('Starting subjects migration...');

    // Check if subjects already exist
    const existingSubjects = await Subjects.find({});
    console.log(`Found ${existingSubjects.length} existing subjects`);

    // Create subjects that don't exist
    const subjectsToCreate = [];
    
    for (const subjectName of predefinedSubjects) {
      const exists = existingSubjects.some(
        subject => subject.name.toLowerCase() === subjectName.toLowerCase()
      );
      
      if (!exists) {
        subjectsToCreate.push({
          name: subjectName,
          description: `${subjectName} lesson`,
          isActive: true,
          createdAt: new Date()
        });
      }
    }

    if (subjectsToCreate.length > 0) {
      await Subjects.insertMany(subjectsToCreate);
      console.log(`✅ Successfully added ${subjectsToCreate.length} new subjects`);
      
      // List the new subjects
      console.log('New subjects added:');
      subjectsToCreate.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name}`);
      });
    } else {
      console.log('✅ All predefined subjects already exist in the database');
    }

    // Display final count
    const totalSubjects = await Subjects.countDocuments({});
    console.log(`📚 Total subjects in database: ${totalSubjects}`);
    
    console.log('Subjects migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during subjects migration:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await seedSubjects();
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the migration
main();