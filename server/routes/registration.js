const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const College = require('../models/College');
const Teacher = require('../models/Teachers');
const { authenticateToken } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');

// Check if registration is enabled
const REGISTRATION_ENABLED = process.env.REGISTRATION_ENABLED === 'true' || false;

// College + Admin registration endpoint
router.post('/register-college', async (req, res) => {
  try {
    // Check if registration is enabled
    if (!REGISTRATION_ENABLED) {
      return res.status(403).json({ 
        error: 'Registration is currently disabled. Please contact support for access.' 
      });
    }

    const {
      // College information
      collegeName,
      collegeAddress,
      collegePhone,
      collegeEmail,
      establishedYear,
      principalName,
      website,
      
      // Admin information
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      adminQualification,
      adminDateOfBirth
    } = req.body;

    // Validate required fields
    if (!collegeName || !collegeAddress || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ 
        error: 'Required fields: college name, address, admin name, email, and password' 
      });
    }

    // Check if college name already exists
    const existingCollege = await College.findOne({ 
      name: { $regex: new RegExp('^' + collegeName + '$', 'i') },
      isActive: true 
    });
    
    if (existingCollege) {
      return res.status(400).json({ 
        error: 'A college with this name already exists' 
      });
    }

    // Check if admin email already exists
    const existingAdmin = await Teacher.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.status(400).json({ 
        error: 'An account with this email already exists' 
      });
    }

    // Validate password strength
    if (adminPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Start transaction (simulate with try-catch for now)
    try {
      // Create college first
      const college = new College({
        name: collegeName,
        address: collegeAddress,
        phone: collegePhone,
        email: collegeEmail,
        establishedYear: establishedYear ? parseInt(establishedYear) : undefined,
        principalName,
        website,
        isActive: true
      });

      const savedCollege = await college.save();

      // Create admin user for this college
      const adminData = {
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword, // Will be hashed by pre-save middleware
        qualification: adminQualification,
        role: 'teacher', // College admin, not super admin
        dateOfBirth: adminDateOfBirth ? new Date(adminDateOfBirth) : undefined,
        collegeId: savedCollege._id,
        active: true
      };

      const admin = new Teacher(adminData);
      const savedAdmin = await admin.save();

      // Generate JWT token for immediate login
      const token = jwt.sign(
        { 
          id: savedAdmin._id, 
          email: savedAdmin.email,
          role: savedAdmin.role,
          collegeId: savedAdmin.collegeId
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Always use secure
        sameSite: 'none',
        // sameSite: process.env.VERCEL_ENV ? 'lax' : 'none', // Use lax for first-party (Vercel proxy), none for cross-site
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Return success response
      const adminResponse = savedAdmin.toObject();
      delete adminResponse.password;
      adminResponse.tId = adminResponse._id.toString();

      res.status(201).json({
        message: 'College and admin account created successfully',
        college: {
          _id: savedCollege._id,
          name: savedCollege.name,
          address: savedCollege.address
        },
        admin: adminResponse,
        token
      });

    } catch (creationError) {
      // If admin creation fails, we should ideally rollback college creation
      console.error('Error during college/admin creation:', creationError);
      
      // Try to clean up college if it was created
      if (savedCollege && savedCollege._id) {
        try {
          await College.findByIdAndDelete(savedCollege._id);
        } catch (cleanupError) {
          console.error('Failed to cleanup college after error:', cleanupError);
        }
      }
      
      throw creationError;
    }

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ error: 'Email already exists' });
      } else if (error.keyPattern && error.keyPattern.name) {
        return res.status(400).json({ error: 'College name already exists' });
      }
    }
    
    res.status(500).json({ 
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Check registration status
router.get('/registration-status', (req, res) => {
  res.json({
    enabled: REGISTRATION_ENABLED,
    message: REGISTRATION_ENABLED 
      ? 'Registration is currently open' 
      : 'Registration is currently disabled. Contact support for access.'
  });
});

// Enable/disable registration (super admin only)
router.post('/toggle-registration', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    // In a real production environment, you'd update a database setting
    // For now, we'll create a dynamic toggle system
    process.env.REGISTRATION_ENABLED = enabled ? 'true' : 'false';
    
    res.json({
      success: true,
      message: `Registration ${enabled ? 'enabled' : 'disabled'} successfully`,
      registrationEnabled: enabled
    });
  } catch (error) {
    console.error('Error toggling registration:', error);
    res.status(500).json({ error: 'Failed to toggle registration status' });
  }
});

module.exports = router;