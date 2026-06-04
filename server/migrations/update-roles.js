const mongoose = require('mongoose');
const Teacher = require('../models/Teachers');
require('dotenv').config();

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://rahmanam90:9946337540@cluster0.8sxy4wx.mongodb.net/my_dvt_db';

async function updateRoles() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Update all superadmin roles to super_admin
        const result = await Teacher.updateMany(
            { role: 'superadmin' },
            { $set: { role: 'super_admin' } }
        );

        console.log(`Updated ${result.modifiedCount} documents`);
        console.log('Role migration completed successfully');
    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
updateRoles();