const mongoose = require('mongoose');
const Teachers = require('../models/Teachers');
require('dotenv').config({ path: require('path').resolve(__dirname, "../../.env") });

async function fixSubjectIds() {
    try {
        // Get MongoDB URL from config to ensure consistency
        const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://rahmanam90:9946337540@cluster0.8sxy4wx.mongodb.net/my_dvt_db';
        
        // Connect to MongoDB with updated options
        await mongoose.connect(MONGODB_URL, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
            retryWrites: true,
            w: 'majority'
        });
        console.log('Connected to MongoDB');

        // Get all teachers
        const teachers = await Teachers.find({});
        let updateCount = 0;

        // Update each teacher's subjects with unique IDs
        for (const teacher of teachers) {
            // Map each subject to include a new unique ID
            teacher.subjectsTaught = teacher.subjectsTaught.map(subject => ({
                ...subject.toObject(),
                _id: new mongoose.Types.ObjectId() // Generate new unique ID for each subject
            }));

            // Save the updated teacher document
            await teacher.save();
            updateCount++;

            // Log the changes
            console.log(`\nUpdated Teacher: ${teacher.name}`);
            console.log('New Subject IDs:');
            teacher.subjectsTaught.forEach(subject => {
                console.log(`- Class ${subject.class}, ${subject.subject}, ID: ${subject._id}`);
            });
        }

        console.log('\nMigration completed successfully');
        console.log(`Updated ${updateCount} teachers with unique subject IDs`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
fixSubjectIds();