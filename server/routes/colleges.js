const express = require('express');
const router = express.Router();
const College = require('../models/College');
const { authenticateToken } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');

// Get all colleges (super admin only)
router.get('/', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Get specific college by ID (super admin only)
router.get('/:id', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
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

// Update college (super admin only)
router.put('/:id', authenticateToken, isSuperAdmin, async (req, res) => {
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

// Get college stats (super admin only)
router.get('/:id/stats', authenticateToken, isSuperAdmin, async (req, res) => {
  try {
    const collegeId = req.params.id;
    
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