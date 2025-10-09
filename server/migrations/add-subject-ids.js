const mongoose = require('mongoose');
const Teachers = require('../models/Teachers');
require('dotenv').config({ path: require('path').resolve(__dirname, "../../.env") });

async function migrateDatabaseForSubjectIds() {
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
            w: 'majority',
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Get all teachers
        const teachers = await Teachers.find({});
        console.log(`Found ${teachers.length} teachers to update`);

        // Update each teacher
        for (const teacher of teachers) {
            // Skip if teacher has no subjects
            if (!teacher.subjectsTaught || teacher.subjectsTaught.length === 0) {
                console.log(`Teacher ${teacher.name} has no subjects to update`);
                continue;
            }

            // Add _id to each subject if it doesn't exist
            let needsUpdate = false;
            teacher.subjectsTaught = teacher.subjectsTaught.map(subject => {
                if (!subject._id) {
                    needsUpdate = true;
                    return {
                        ...subject.toObject(),
                        _id: new mongoose.Types.ObjectId()
                    };
                }
                return subject;
            });

            // Save only if updates were needed
            if (needsUpdate) {
                await teacher.save();
                console.log(`Updated subjects for teacher: ${teacher.name}`);
            } else {
                console.log(`No updates needed for teacher: ${teacher.name}`);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        // Close the MongoDB connection
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
migrateDatabaseForSubjectIds();