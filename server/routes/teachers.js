const express = require('express');
const jwt = require('jsonwebtoken');
const Teachers = require('../models/Teachers');
const LoginHistory = require('../models/LoginHistory');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken, addCollegeFilter } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Public routes
// Registration - Disabled, use /api/registration/register-college instead (Super Admin Only for creating new teachers)
router.post('/register', authenticateToken, isSuperAdmin, async (req, res) => {
  return res.status(403).json({ 
    error: 'Public registration is disabled. Please use the college registration system or contact an administrator.' 
  });
  
  // Original registration code commented out
  /*
  try {
    const { email, password, name, phone, qualification, dateOfBirth } = req.body;
    
    // Check if teacher already exists
    const existingTeacher = await Teachers.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create teacher data
    const newTeacherData = {
      email,
      password,
      name,
      phone,
      qualification,
      active: true,
      joinedAt: new Date()
    };

    // Only add dateOfBirth if it's provided
    if (dateOfBirth) {
      newTeacherData.dateOfBirth = dateOfBirth;
    }

    // Create new teacher
    const teacher = new Teachers(newTeacherData);

    await teacher.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: teacher._id, 
        email: teacher.email,
        role: teacher.role, // Include role in token
        collegeId: teacher.collegeId // Include college ID in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Always use secure
      sameSite: process.env.VERCEL_ENV ? 'lax' : 'none', // Use lax for first-party (Vercel proxy), none for cross-site
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return teacher data (excluding password)
    const teacherData = teacher.toObject();
    delete teacherData.password;

    res.status(201).json({
      message: 'Registration successful',
      teacher: teacherData,
      token // Include token in response for client storage
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
  */
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const rawIdentifier = (req.body.identifier || req.body.email || req.body.username || '').trim();

    // Validate input
    if (!rawIdentifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const normalizedIdentifier = rawIdentifier.toLowerCase();
    const escapedIdentifier = escapeRegex(normalizedIdentifier);

    // Find teacher by email or username (case-insensitive)
    const teacher = await Teachers.findOne({
      $or: [
        { email: { $regex: `^${escapedIdentifier}$`, $options: 'i' } },
        { username: { $regex: `^${escapedIdentifier}$`, $options: 'i' } }
      ]
    });
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: teacher._id, 
        email: teacher.email,
        role: teacher.role, // Include role in token
        collegeId: teacher.collegeId // Include college ID in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // none for cross-site (prod), lax for same-site (dev)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined // Let browser handle domain
    });

    // Return teacher data (excluding password)
    const teacherData = teacher.toObject();
    delete teacherData.password;
    teacherData.mustUpdateCredentials = Boolean(teacher.mustUpdateCredentials || !teacher.username);
    
    // Add tId field for frontend compatibility
    teacherData.tId = teacherData._id.toString();

    // Save login event for future login history and active session reporting
    await LoginHistory.create({
      teacherId: teacher._id,
      loginAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
      authMethod: 'email_or_username',
      isActive: true
    });

    res.json({ 
      teacher: teacherData,
      token // Include token in response for client storage
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Clear the token cookie with same settings as when it was set
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  
  const finishLogout = () => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
      });
      return;
    }

    res.json({ message: 'Logged out successfully' });
  };

  // Try to close active login history entry for this user.
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      return finishLogout();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    LoginHistory.findOneAndUpdate(
      { teacherId: decoded.id, isActive: true },
      { isActive: false, logoutAt: new Date() },
      { sort: { loginAt: -1 } }
    )
      .finally(() => finishLogout());
  } catch (error) {
    console.error('Logout history update skipped:', error.message);
    finishLogout();
  }
});

// Protected routes - require authentication

// Create new teacher (for admins)
router.post('/create', authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const { name, email, phone, password, qualification, role, dateOfBirth } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone, and password are required' });
    }

    // Check if teacher already exists
    const existingTeacher = await Teachers.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Get college ID - only admins from same college or super admins can create teachers
    let collegeId;
    if (req.user.role === 'super_admin') {
      // Super admin can create teachers for any college, but must specify college ID
      collegeId = req.body.collegeId;
      if (!collegeId) {
        return res.status(400).json({ error: 'College ID is required when creating teachers as super admin' });
      }
    } else {
      // Regular admin creates teachers for their own college
      collegeId = req.collegeId;
      if (!collegeId) {
        return res.status(400).json({ error: 'College ID not found in your account' });
      }
    }

    // Create teacher data
    const teacherData = {
      name,
      email,
      phone,
      password, // Will be hashed by pre-save middleware
      qualification,
      role: role && ['teacher'].includes(role) ? role : 'teacher', // Prevent creating super_admin via this route
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      collegeId,
      active: true,
      joinedAt: new Date()
    };

    const teacher = new Teachers(teacherData);
    await teacher.save();

    // Return teacher data (excluding password)
    const teacherResponse = teacher.toObject();
    delete teacherResponse.password;
    teacherResponse.tId = teacherResponse._id.toString();

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: teacherResponse
    });
  } catch (error) {
    console.error('Teacher creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Change Password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const teacher = await Teachers.findById(req.user.id);

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, teacher.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Set the new password - let the pre-save middleware handle the hashing
    teacher.password = newPassword;
    await teacher.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Get current teacher
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const teacher = await Teachers.findById(req.user.id).select('-password');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Transform teacher data to include tId for frontend compatibility
    const teacherData = teacher.toObject();
    teacherData.tId = teacherData._id.toString();
    teacherData.mustUpdateCredentials = Boolean(teacher.mustUpdateCredentials || !teacher.username);

    res.json(teacherData);
  } catch (error) {
    console.error('Fetch current teacher error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher data' });
  }
});

// Get all teachers (admin only)
router.get('/', authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    console.log("Fetching teachers with college filter:", req.collegeFilter);
    const teachers = await Teachers.find(req.collegeFilter || {}).select('-password');
    res.json(teachers);
  } catch (error) {
    console.error('Fetch teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get current teacher login history
router.get('/login-history/me', authenticateToken, async (req, res) => {
  try {
    const history = await LoginHistory.find({ teacherId: req.user.id })
      .sort({ loginAt: -1 })
      .limit(50)
      .lean();

    res.json(history);
  } catch (error) {
    console.error('Fetch own login history error:', error);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

// Super admin: currently active logins
router.get('/active-logins', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const activeLogins = await LoginHistory.find({ isActive: true })
      .sort({ loginAt: -1 })
      .populate('teacherId', 'name email username role collegeId')
      .lean();

    res.json(activeLogins);
  } catch (error) {
    console.error('Fetch active logins error:', error);
    res.status(500).json({ error: 'Failed to fetch active logins' });
  }
});

// Force profile completion after first login from seeded/fake accounts
router.put('/complete-profile', authenticateToken, async (req, res) => {
  try {
    const { email, username } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim().toLowerCase();

    if (normalizedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const usernameTaken = await Teachers.findOne({
      _id: { $ne: req.user.id },
      username: normalizedUsername
    });
    if (usernameTaken) {
      return res.status(400).json({ error: 'Username already in use' });
    }

    const emailTaken = await Teachers.findOne({
      _id: { $ne: req.user.id },
      email: normalizedEmail
    });
    if (emailTaken) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const teacher = await Teachers.findByIdAndUpdate(
      req.user.id,
      {
        email: normalizedEmail,
        username: normalizedUsername,
        mustUpdateCredentials: false,
        emailVerified: false
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacherData = teacher.toObject();
    teacherData.tId = teacherData._id.toString();

    res.json({
      message: 'Profile updated successfully',
      teacher: teacherData
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Email or username already in use' });
    }

    console.error('Complete profile error:', error);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
});

// Get teacher by ID
router.get('/:teacherId', authenticateToken, addCollegeFilter, async (req, res) => {
  try {
    const query = { ...req.collegeFilter, _id: req.params.teacherId };
    const teacher = await Teachers.findOne(query).select('-password');
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    res.json(teacher);
  } catch (error) {
    console.error('Fetch teacher error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// Update teacher profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { name, email, username, phone, qualification } = req.body;

    const teacher = await Teachers.findByIdAndUpdate(
      req.user.id,
      { name, email, username, phone, qualification },
      { new: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add subject to teacher
router.post('/:teacherId/subjects', authenticateToken, async (req, res) => {
  try {
    const { class: classNum, subject } = req.body;
    const teacherId = req.params.teacherId;

    // Check if the user is updating their own profile or is a super admin
    if (req.user.id !== teacherId && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to modify this profile' });
    }

    const teacher = await Teachers.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    teacher.subjectsTaught = teacher.subjectsTaught || [];
    teacher.subjectsTaught.push({
      class: classNum,
      subject,
    });
 
    await teacher.save();
    res.json(teacher);
  } catch (error) {
    console.error('Add subject error:', error);
    res.status(500).json({ error: 'Failed to add subject' });
  }
});

// Remove subject from teacher
router.delete('/:teacherId/subjects/:subjectId', authenticateToken, async (req, res) => {
  try {
    const { teacherId, subjectId } = req.params;

    // Check if the user is updating their own profile or is a super admin
    if (req.user.id !== teacherId && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to modify this profile' });
    }

    const teacher = await Teachers.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Remove subject based on subject ID
    teacher.subjectsTaught = teacher.subjectsTaught.filter(
      s => !s._id.equals(subjectId)
    );

    await teacher.save();
    res.json(teacher);
  } catch (error) {
    console.error('Remove subject error:', error);
    res.status(500).json({ error: 'Failed to remove subject' });
  }
});



// Super admin: Update teacher
router.put('/:teacherId', authenticateToken, isSuperAdmin, async (req, res) => {
  try {

    const { name, email, phone, qualification, role, active, dateOfBirth } = req.body;

    const updateData = { name, email, phone, qualification, role, active };
    
    // Only add dateOfBirth if it's provided
    if (dateOfBirth) {
      updateData.dateOfBirth = dateOfBirth;
    }

    const teacher = await Teachers.findByIdAndUpdate(
      req.params.teacherId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Super admin: Bulk delete teachers
router.delete('/bulk', authenticateToken, isSuperAdmin, addCollegeFilter, async (req, res) => {
  try {
    const { teacherIds } = req.body;
    
    // Validate input
    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({ error: 'Teacher IDs array is required' });
    }
    
    // Validate all IDs are valid ObjectIds
    const mongoose = require('mongoose');
    const invalidIds = teacherIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid teacher ID format', 
        invalidIds 
      });
    }
    
    console.log(`Bulk deleting ${teacherIds.length} teachers:`, teacherIds);
    
    // Find teachers to be deleted (for logging and verification)
    const teachersToDelete = await Teachers.find({
      ...req.collegeFilter,
      _id: { $in: teacherIds }
    }).select('-password');
    
    if (teachersToDelete.length === 0) {
      return res.status(404).json({ error: 'No teachers found to delete' });
    }
    
    // Prevent deletion of super admin accounts
    const superAdmins = teachersToDelete.filter(teacher => teacher.role === 'super_admin');
    if (superAdmins.length > 0) {
      return res.status(403).json({ 
        error: 'Cannot delete super admin accounts',
        superAdminIds: superAdmins.map(admin => admin._id)
      });
    }
    
    // Delete the teachers
    const deleteResult = await Teachers.deleteMany({
      ...req.collegeFilter,
      _id: { $in: teacherIds },
      role: { $ne: 'super_admin' } // Additional safety check
    });
    
    console.log(`Successfully deleted ${deleteResult.deletedCount} teachers`);
    
    res.json({ 
      message: `Successfully deleted ${deleteResult.deletedCount} teachers`,
      deletedCount: deleteResult.deletedCount,
      requestedCount: teacherIds.length
    });
  } catch (error) {
    console.error('Bulk delete teachers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Super admin: Delete teacher
router.delete('/:teacherId', authenticateToken, isSuperAdmin, async (req, res) => {
  try {

    const teacher = await Teachers.findByIdAndDelete(req.params.teacherId);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

module.exports = router;
