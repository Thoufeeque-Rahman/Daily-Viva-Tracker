const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const College = require('../models/College');
const Teacher = require('../models/Teachers');
const RegistrationToken = require('../models/RegistrationToken');

// Generate one-time registration URL (Super Admin only can create these)
router.post('/generate-registration-url', async (req, res) => {
  try {
    // For now, we'll allow this without auth for initial setup
    // In production, this should require existing super admin authentication
    
    const { expiryHours = 24, maxUses = 1 } = req.body;
    
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token in database with expiry and usage limits
    const registrationToken = new RegistrationToken({
      token,
      expiresAt: new Date(Date.now() + (expiryHours * 60 * 60 * 1000)),
      maxUses,
      usedCount: 0,
      isActive: true
    });
    
    await registrationToken.save();
    console.log('Token saved to database:', token);
    
    // Generate the registration URL
    // Determine frontend URL based on environment
    let frontendUrl;
    
    // Check if we're running on Vercel (production) by looking at host header
    const isVercelProduction = req.headers.host && req.headers.host.includes('vercel.app');
    
    if (process.env.NODE_ENV === 'production' || isVercelProduction) {
      frontendUrl = process.env.VITE_FRONT_URL_PRODUCTION || 'https://daily-viva-tracker.vercel.app';
    } else {
      frontendUrl = process.env.VITE_FRONT_URL || 'http://localhost:5174';
    }
    const registrationUrl = `${frontendUrl}/super-admin-registration/${token}`;
    
    res.json({
      success: true,
      message: 'One-time registration URL generated successfully',
      registrationUrl,
      token,
      expiresAt: registrationToken.expiresAt,
      maxUses: registrationToken.maxUses
    });
    
  } catch (error) {
    console.error('Error generating registration URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate registration URL'
    });
  }
});

// Validate one-time token
router.get('/validate-token/:token', async (req, res) => {
  try {
    console.log('Token validation request received for token:', req.params.token);
    const { token } = req.params;
    
    const tokenData = await RegistrationToken.findOne({ 
      token: token,
      isActive: true
    });
    
    console.log('Token found in database:', tokenData ? 'Yes' : 'No');
    
    if (!tokenData) {
      return res.status(404).json({
        valid: false,
        error: 'Registration token not found'
      });
    }
    
    if (!tokenData.isActive) {
      return res.status(400).json({
        valid: false,
        error: 'Registration token has been deactivated'
      });
    }
    
    if (new Date() > tokenData.expiresAt) {
      return res.status(400).json({
        valid: false,
        error: 'Registration token has expired'
      });
    }
    
    if (tokenData.usedCount >= tokenData.maxUses) {
      return res.status(400).json({
        valid: false,
        error: 'Registration token has been fully used'
      });
    }
    
    res.json({
      valid: true,
      message: 'Registration token is valid',
      expiresAt: tokenData.expiresAt,
      usesRemaining: tokenData.maxUses - tokenData.usedCount
    });
    
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({
      valid: false,
      error: 'Failed to validate token'
    });
  }
});

// Super Admin + College Registration (using one-time token)
router.post('/register-super-admin/:token', async (req, res) => {
  try {
    console.log('Registration request received for token:', req.params.token);
    const { token } = req.params;
    
    const tokenData = await RegistrationToken.findOne({ 
      token: token,
      isActive: true
    });
    
    console.log('Token data found:', tokenData ? 'Yes' : 'No');
    if (tokenData) {
      console.log('Token details:', {
        isActive: tokenData.isActive,
        expiresAt: tokenData.expiresAt,
        currentTime: new Date(),
        expired: new Date() > tokenData.expiresAt,
        usedCount: tokenData.usedCount,
        maxUses: tokenData.maxUses,
        fullyUsed: tokenData.usedCount >= tokenData.maxUses
      });
    }
    
    // Validate token
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        error: 'Registration token not found'
      });
    }
    
    if (!tokenData.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Registration token has been deactivated'
      });
    }
    
    if (new Date() > tokenData.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Registration token has expired'
      });
    }
    
    if (tokenData.usedCount >= tokenData.maxUses) {
      return res.status(400).json({
        success: false,
        error: 'Registration token has been fully used'
      });
    }
    
    const {
      // Super Admin information
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
      adminQualification,
      adminDateOfBirth,
      
      // College information
      collegeName,
      collegeAddress,
      collegePhone,
      collegeEmail,
      establishedYear,
      principalName,
      website
    } = req.body;

    // Validate required fields
    if (!adminName || !adminEmail || !adminPassword || !collegeName || !collegeAddress) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: admin name, email, password, college name, and address'
      });
    }

    // Check if admin email already exists
    const existingAdmin = await Teacher.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Check if college name already exists
    const existingCollege = await College.findOne({ 
      name: { $regex: new RegExp('^' + collegeName + '$', 'i') },
      isActive: true 
    });
    if (existingCollege) {
      return res.status(400).json({
        success: false,
        error: 'A college with this name already exists'
      });
    }

    // Validate password
    if (adminPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    try {
      // Create college first
      const college = new College({
        name: collegeName,
        address: collegeAddress,
        phone: collegePhone,
        email: collegeEmail,
        establishedYear: establishedYear ? parseInt(establishedYear) : undefined,
        principalName: principalName || adminName,
        website,
        isActive: true
      });

      const savedCollege = await college.save();
      console.log(`Created college: ${savedCollege.name} (ID: ${savedCollege._id})`);

      // Create super admin user for this college
      const superAdminData = {
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword, // Will be hashed by pre-save middleware
        qualification: adminQualification,
        role: 'super_admin', // This is the key difference - super_admin role
        dateOfBirth: adminDateOfBirth ? new Date(adminDateOfBirth) : undefined,
        collegeId: savedCollege._id,
        active: true
      };

      const superAdmin = new Teacher(superAdminData);
      const savedAdmin = await superAdmin.save();
      console.log(`Created super admin: ${savedAdmin.name} (ID: ${savedAdmin._id})`);

      // Mark token as used in database
      tokenData.usedCount += 1;
      if (tokenData.usedCount >= tokenData.maxUses) {
        tokenData.isActive = false;
      }
      await tokenData.save();
      console.log('Token usage updated in database. Used count:', tokenData.usedCount);

      // Generate JWT token for immediate login
      const jwtToken = jwt.sign(
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
      res.cookie('token', jwtToken, {
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
        success: true,
        message: 'Super admin and college created successfully',
        college: {
          _id: savedCollege._id,
          name: savedCollege.name,
          address: savedCollege.address
        },
        admin: adminResponse,
        token: jwtToken,
        tokenUsed: true
      });

    } catch (creationError) {
      console.error('Error during super admin/college creation:', creationError);
      
      // Rollback college if admin creation fails
      if (savedCollege && savedCollege._id) {
        try {
          await College.findByIdAndDelete(savedCollege._id);
          console.log('Rolled back college creation due to admin creation failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup college after error:', cleanupError);
        }
      }
      
      throw creationError;
    }

  } catch (error) {
    console.error('Super admin registration error:', error);
    
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ 
          success: false,
          error: 'Email already exists' 
        });
      } else if (error.keyPattern && error.keyPattern.name) {
        return res.status(400).json({ 
          success: false,
          error: 'College name already exists' 
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// List active tokens (for admin management)
router.get('/active-tokens', async (req, res) => {
  try {
    const activeTokens = await RegistrationToken.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).select('-__v');
    
    const formattedTokens = activeTokens.map(token => ({
      token: token.token,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      usedCount: token.usedCount,
      maxUses: token.maxUses,
      usesRemaining: token.maxUses - token.usedCount
    }));
    
    res.json({
      success: true,
      activeTokens: formattedTokens,
      count: formattedTokens.length
    });
  } catch (error) {
    console.error('Error listing active tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list active tokens'
    });
  }
});

// Deactivate a token
router.delete('/deactivate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const tokenData = await RegistrationToken.findOne({ token: token });
    
    if (!tokenData) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }
    
    tokenData.isActive = false;
    await tokenData.save();
    
    res.json({
      success: true,
      message: 'Token deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate token'
    });
  }
});

module.exports = router;