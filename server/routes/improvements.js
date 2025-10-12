const express = require('express');
const router = express.Router();
const Improvement = require('../models/Improvements');
const Student = require('../models/Students');
const { authenticateToken } = require('../middleware/auth');

// Get improvements for a specific subject and class
router.get('/subject/:subject/class/:class', authenticateToken, async (req, res) => {
  try {
    const { subject, class: classNumber } = req.params;
    
    const improvements = await Improvement.find({
      subject,
      class: parseInt(classNumber),
      teacher: req.user.id
    })
    .populate('student', 'name rollNumber adNumber')
    .sort({ assignedAt: -1 });

    res.json(improvements);
  } catch (error) {
    console.error('Error fetching improvements:', error);
    res.status(500).json({ error: 'Failed to fetch improvements' });
  }
});

// Get improvements for a specific student in a subject and class
router.get('/student/:studentId/subject/:subject/class/:class', authenticateToken, async (req, res) => {
  try {
    const { studentId, subject, class: classNumber } = req.params;
    
    const improvements = await Improvement.find({
      student: studentId,
      subject,
      class: parseInt(classNumber),
      teacher: req.user.id
    })
    .populate('student', 'name rollNumber adNumber')
    .sort({ assignedAt: -1 });

    res.json(improvements);
  } catch (error) {
    console.error('Error fetching student improvements:', error);
    res.status(500).json({ error: 'Failed to fetch student improvements' });
  }
});

// Create a new improvement/punishment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { studentId, subject, class: classNumber, description, dueDate } = req.body;

    // Validate required fields
    if (!studentId || !subject || !classNumber || !description || !dueDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const improvement = new Improvement({
      student: studentId,
      teacher: req.user.id,
      subject,
      class: parseInt(classNumber),
      description,
      dueDate: new Date(dueDate)
    });

    await improvement.save();
    
    // Populate student data for response
    await improvement.populate('student', 'name rollNumber adNumber');

    res.status(201).json(improvement);
  } catch (error) {
    console.error('Error creating improvement:', error);
    res.status(500).json({ error: 'Failed to create improvement' });
  }
});

// Toggle improvement status
router.patch('/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const improvement = await Improvement.findOne({
      _id: id,
      teacher: req.user.id
    });

    if (!improvement) {
      return res.status(404).json({ error: 'Improvement not found' });
    }

    // Toggle status
    improvement.status = improvement.status === 'given' ? 'done' : 'given';
    
    // Set completedAt timestamp when marking as done
    if (improvement.status === 'done') {
      improvement.completedAt = new Date();
    } else {
      improvement.completedAt = null;
    }

    await improvement.save();
    await improvement.populate('student', 'name rollNumber adNumber');

    res.json(improvement);
  } catch (error) {
    console.error('Error toggling improvement status:', error);
    res.status(500).json({ error: 'Failed to toggle improvement status' });
  }
});

// Update improvement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, dueDate } = req.body;

    const improvement = await Improvement.findOneAndUpdate(
      { _id: id, teacher: req.user.id },
      { description, dueDate: new Date(dueDate) },
      { new: true }
    ).populate('student', 'name rollNumber adNumber');

    if (!improvement) {
      return res.status(404).json({ error: 'Improvement not found' });
    }

    res.json(improvement);
  } catch (error) {
    console.error('Error updating improvement:', error);
    res.status(500).json({ error: 'Failed to update improvement' });
  }
});

// Delete improvement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const improvement = await Improvement.findOneAndDelete({
      _id: id,
      teacher: req.user.id
    });

    if (!improvement) {
      return res.status(404).json({ error: 'Improvement not found' });
    }

    res.json({ message: 'Improvement deleted successfully' });
  } catch (error) {
    console.error('Error deleting improvement:', error);
    res.status(500).json({ error: 'Failed to delete improvement' });
  }
});

module.exports = router;