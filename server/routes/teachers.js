const express = require('express');
const jwt = require('jsonwebtoken');
const Teachers = require('../models/Teachers');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');

// Public routes
// Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, qualification } = req.body;
    
    // Check if teacher already exists
    const existingTeacher = await Teachers.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new teacher
    const teacher = new Teachers({
      email,
      password,
      name,
      phone,
      qualification,
      active: true,
      joinedAt: new Date()
    });

    await teacher.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: teacher._id, 
        email: teacher.email,
        role: teacher.role // Include role in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
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
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find teacher
    const teacher = await Teachers.findOne({ email });
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
        role: teacher.role // Include role in token
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Always use secure in production
      sameSite: 'none', // Allow cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return teacher data (excluding password)
    const teacherData = teacher.toObject();
    delete teacherData.password;

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
  // Clear the token cookie
  res.clearCookie('token');
  
  // Clear session if it exists
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  } else {
    res.json({ message: 'Logged out successfully' });
  }
});

// Protected routes - require authentication
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    teacher.password = hashedPassword;
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

    res.json(teacher);
  } catch (error) {
    console.error('Fetch current teacher error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher data' });
  }
});

// Get all teachers (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const teachers = await Teachers.find().select('-password');
    res.json(teachers);
  } catch (error) {
    console.error('Fetch teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get teacher by ID
router.get('/:teacherId', authenticateToken, async (req, res) => {
  try {
    const teacher = await Teachers.findById(req.params.teacherId).select('-password');
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

    const { name, email, phone, qualification } = req.body;

    const teacher = await Teachers.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, qualification },
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
    const { class: classNum, subject, periodsInSemester } = req.body;
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
      periodsInSemester
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

    teacher.subjectsTaught = teacher.subjectsTaught.filter(
      subject => subject._id.toString() !== subjectId
    );

    await teacher.save();
    res.json(teacher);
  } catch (error) {
    console.error('Remove subject error:', error);
    res.status(500).json({ error: 'Failed to remove subject' });
  }
});

// Super admin: Create teacher (admin only)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    // Check if current user is super admin
    const currentUser = await Teachers.findById(req.user.id);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }

    const { name, email, password, phone, qualification } = req.body;
    
    // Check if teacher already exists
    const existingTeacher = await Teachers.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new teacher
    const teacher = new Teachers({
      email,
      password,
      name,
      phone,
      qualification,
      role: 'teacher',
      active: true,
      joinedAt: new Date()
    });

    await teacher.save();

    // Return teacher data (excluding password)
    const teacherData = teacher.toObject();
    delete teacherData.password;

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: teacherData
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Super admin: Update teacher
router.put('/:teacherId', authenticateToken, async (req, res) => {
  try {
    // Check if current user is super admin
    const currentUser = await Teachers.findById(req.user.id);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }

    const { name, email, phone, qualification, role, active } = req.body;

    const teacher = await Teachers.findByIdAndUpdate(
      req.params.teacherId,
      { name, email, phone, qualification, role, active },
      { new: true }
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

// Super admin: Delete teacher
router.delete('/:teacherId', authenticateToken, async (req, res) => {
  try {
    // Check if current user is super admin
    const currentUser = await Teachers.findById(req.user.id);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
    }

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
