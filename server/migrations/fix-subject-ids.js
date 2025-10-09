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

        // Using the aggregation pipeline to update all teachers
        const result = await Teachers.collection.updateMany(
            {}, // match all documents
            [{
                $set: {
                    subjectsTaught: {
                        $map: {
                            input: "$subjectsTaught",
                            as: "subject",
                            in: {
                                $mergeObjects: [
                                    "$$subject",
                                    {
                                        _id: { $cond: [
                                            { $eq: [{ $type: "$$subject._id" }, "missing"] },
                                            new mongoose.Types.ObjectId(),
                                            "$$subject._id"
                                        ]}
                                    }
                                ]
                            }
                        }
                    }
                }
            }]
        );

        console.log('Migration completed successfully');
        console.log(`Modified ${result.modifiedCount} teachers`);

        // Verify the changes
        const teachers = await Teachers.find({});
        for (const teacher of teachers) {
            console.log(`\nTeacher: ${teacher.name}`);
            console.log('Subjects:');
            teacher.subjectsTaught.forEach(subject => {
                console.log(`- Class ${subject.class}, ${subject.subject}, ID: ${subject._id}`);
            });
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
fixSubjectIds();