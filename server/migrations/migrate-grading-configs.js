const mongoose = require('mongoose');
const GradingConfig = require('../models/GradingConfig');

require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function migrateGradingConfigs() {
  try {
    console.log('🔄 Starting grading config migration...');
    
    // Find all existing grading configs
    const allConfigs = await mongoose.connection.db.collection('gradingconfigs').find({}).toArray();
    console.log(`📊 Found ${allConfigs.length} grading configurations to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const config of allConfigs) {
      console.log(`\n📋 Processing: ${config.name} (${config._id})`);
      
      // Check if already migrated (has boolean isActive and required collegeId)
      if (typeof config.isActive === 'boolean' && config.collegeId) {
        console.log(`   ⏭️  Already migrated - skipping`);
        skipped++;
        continue;
      }
      
      let newIsActive = false;
      let collegeId = config.collegeId;
      
      // Handle old array format for isActive
      if (Array.isArray(config.isActive)) {
        // If there are colleges in the array, activate for the first one
        if (config.isActive.length > 0) {
          newIsActive = true;
          if (!collegeId) {
            collegeId = config.isActive[0]; // Use first college in the array
          }
        }
        console.log(`   🔄 Array isActive: [${config.isActive.join(', ')}] -> ${newIsActive}`);
      } else if (typeof config.isActive === 'boolean') {
        newIsActive = config.isActive;
        console.log(`   ✅ Boolean isActive: ${config.isActive} -> ${newIsActive}`);
      }
      
      // Ensure collegeId exists
      if (!collegeId) {
        // Try to find first college from database as fallback
        const firstCollege = await mongoose.connection.db.collection('colleges').findOne({});
        if (firstCollege) {
          collegeId = firstCollege._id;
          console.log(`   🏫 Using first college as fallback: ${collegeId}`);
        } else {
          console.log(`   ⚠️  No college ID available - skipping this config`);
          continue;
        }
      }
      
      // Update the document
      const updateResult = await mongoose.connection.db.collection('gradingconfigs').updateOne(
        { _id: config._id },
        {
          $set: {
            isActive: newIsActive,
            collegeId: collegeId
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`   ✅ Updated: isActive=${newIsActive}, collegeId=${collegeId}`);
        migrated++;
      } else {
        console.log(`   ❌ Failed to update`);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${allConfigs.length}`);
    
    // Verify migration
    console.log('\n🔍 Verification:');
    const verifyConfigs = await mongoose.connection.db.collection('gradingconfigs').find({}).toArray();
    const correctFormat = verifyConfigs.filter(c => 
      typeof c.isActive === 'boolean' && 
      c.collegeId && 
      mongoose.Types.ObjectId.isValid(c.collegeId)
    ).length;
    
    console.log(`   📊 Configs in correct format: ${correctFormat}/${verifyConfigs.length}`);
    
    if (correctFormat === verifyConfigs.length) {
      console.log('   ✅ All grading configurations are now in the correct format!');
    } else {
      console.log('   ⚠️  Some configurations may need manual attention');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateGradingConfigs();
  await mongoose.connection.close();
  console.log('🏁 Migration completed and database connection closed');
};

// Run if this script is executed directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateGradingConfigs };