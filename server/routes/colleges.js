const express = require('express');
const router = express.Router();
const College = require('../models/College');
const { authenticateToken, addCollegeFilter } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');

// Get user's college (super admin can only see their own college)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user.collegeId) {
      return res.status(400).json({ error: 'No college associated with this user' });
    }
    
    // User can only see their own college
    const college = await College.findById(req.user.collegeId);
    if (!college || !college.isActive) {
      return res.status(404).json({ error: 'College not found' });
    }
    
    // Return as array for compatibility with existing frontend code
    res.json([college]);
  } catch (error) {
    console.error('Error fetching college:', error);
    res.status(500).json({ error: 'Failed to fetch college' });
  }
});

// Get specific college by ID (user can only access their own college)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is trying to access their own college
    if (req.params.id !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: 'Access denied: You can only access your own college' });
    }
    
    const college = await College.findById(req.params.id);
    if (!college || !college.isActive) {
      return res.status(404).json({ error: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    console.error('Error fetching college:', error);
    res.status(500).json({ error: 'Failed to fetch college' });
  }
});

// Create new college (super admin only)
router.post('/', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      email,
      establishedYear,
      principalName,
      website
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    // Check if college with same name already exists
    const existingCollege = await College.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      isActive: true 
    });
    
    if (existingCollege) {
      return res.status(400).json({ error: 'College with this name already exists' });
    }

    const college = new College({
      name,
      address,
      phone,
      email,
      establishedYear,
      principalName,
      website
    });

    const savedCollege = await college.save();
    res.status(201).json(savedCollege);
  } catch (error) {
    console.error('Error creating college:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'College with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create college' });
    }
  }
});

// Update college (super admin can only update their own college)
router.put('/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    // Check if user is trying to update their own college
    if (req.params.id !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: 'Access denied: You can only update your own college' });
    }
    const {
      name,
      address,
      phone,
      email,
      establishedYear,
      principalName,
      website
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }

    // Check if another college with same name exists (excluding current college)
    const existingCollege = await College.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      _id: { $ne: req.params.id },
      isActive: true 
    });
    
    if (existingCollege) {
      return res.status(400).json({ error: 'Another college with this name already exists' });
    }

    const college = await College.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address,
        phone,
        email,
        establishedYear,
        principalName,
        website,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!college || !college.isActive) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json(college);
  } catch (error) {
    console.error('Error updating college:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'College with this name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update college' });
    }
  }
});

// Soft delete college (super admin only)
router.delete('/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({ message: 'College deleted successfully' });
  } catch (error) {
    console.error('Error deleting college:', error);
    res.status(500).json({ error: 'Failed to delete college' });
  }
});

// Get college stats (super admin can only see their own college stats)
router.get('/:id/stats', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const collegeId = req.params.id;
    
    // Check if user is trying to access their own college stats
    if (collegeId !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: 'Access denied: You can only access your own college statistics' });
    }
    
    // Import models here to avoid circular dependencies
    const Student = require('../models/Students');
    const Teacher = require('../models/Teachers');
    const DvtMark = require('../models/DvtMarks');

    const [
      totalStudents,
      totalTeachers,
      totalEvaluations,
      college
    ] = await Promise.all([
      Student.countDocuments({ collegeId }),
      Teacher.countDocuments({ collegeId, active: true }),
      DvtMark.countDocuments({ collegeId }),
      College.findById(collegeId)
    ]);

    if (!college || !college.isActive) {
      return res.status(404).json({ error: 'College not found' });
    }

    res.json({
      college: college.name,
      totalStudents,
      totalTeachers,
      totalEvaluations
    });
  } catch (error) {
    console.error('Error fetching college stats:', error);
    res.status(500).json({ error: 'Failed to fetch college statistics' });
  }
});

module.exports = router;