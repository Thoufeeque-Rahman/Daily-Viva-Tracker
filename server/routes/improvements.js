const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Improvement = require('../models/Improvements');
const Student = require('../models/Students');
const Teacher = require('../models/Teachers');
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

    console.log('Creating improvement - User:', JSON.stringify(req.user));
    console.log('Creating improvement - req.collegeId:', req.collegeId);

    // Validate required fields
    if (!studentId || !subject || !classNumber || !description || !dueDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get collegeId from authenticated user or fetch from database
    let collegeId = req.user.collegeId || req.collegeId;
    console.log("determined collegeId: ", collegeId);
    
    // If collegeId not in token, fetch from teacher record
    if (!collegeId) {
      const teacher = await Teacher.findById(req.user.id);
      console.log("Fetched teacher from DB:", teacher);
      if (teacher && teacher.collegeId) {
        collegeId = teacher.collegeId;
      }
    }
    
    // Also try getting collegeId from the student if teacher doesn't have it
    if (!collegeId && student.collegeId) {
      collegeId = student.collegeId;
      console.log("Using student's collegeId:", collegeId);
    }
    
    if (!collegeId) {
      console.error('No collegeId found for user:', req.user.id);
      return res.status(400).json({ error: 'College ID is required. Please log out and log in again.' });
    }

    // Convert to ObjectId if it's a string
    if (typeof collegeId === 'string' && mongoose.Types.ObjectId.isValid(collegeId)) {
      collegeId = new mongoose.Types.ObjectId(collegeId);
    }
    
    console.log("Final collegeId to use:", collegeId);

    const improvement = new Improvement({
      student: studentId,
      teacher: req.user.id,
      subject,
      class: parseInt(classNumber),
      collegeId,
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