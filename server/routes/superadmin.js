const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teachers');
const { authenticateToken } = require('../middleware/auth');
const { isSuperAdmin } = require('../middleware/isSuperAdmin');

// Get all teachers
router.get('/teachers', authenticateToken, isSuperAdmin, async (req, res) => {
    try {
        const teachers = await Teacher.find({}).select('-password');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single teacher
router.get('/teachers/:id', authenticateToken, isSuperAdmin, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).select('-password');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update teacher
router.put('/teachers/:id', authenticateToken, isSuperAdmin, async (req, res) => {
    try {
        const { name, email, phone, qualification, subjectsTaught } = req.body;
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, qualification, subjectsTaught },
            { new: true }
        ).select('-password');
        
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add subject to teacher
router.post('/teachers/:id/subjects', authenticateToken, isSuperAdmin, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        // Validate required fields
        const { class: classNum, subject } = req.body;
        if (!classNum || !subject === undefined) {
            return res.status(400).json({ 
                message: 'Missing required fields. Class and subject are required.' 
            });
        }

        // Validate data types
        if (typeof classNum !== 'number' || typeof subject !== 'string') {
            return res.status(400).json({ 
                message: 'Invalid data types. Class must be a number, subject must be a string.' 
            });
        }

        // Check if subject already exists for this class
        const existingSubject = teacher.subjectsTaught.find(
            s => s.class === classNum && s.subject === subject
        );
        if (existingSubject) {
            return res.status(400).json({ 
                message: 'This subject is already assigned to this class for this teacher.' 
            });
        }

        // Add new subject
        teacher.subjectsTaught.push({
            class: classNum,
            subject,
        });

        const updatedTeacher = await teacher.save();
        
        // Return the teacher data without password
        const teacherData = updatedTeacher.toObject();
        delete teacherData.password;
        res.json(teacherData);
 
    } catch (error) {
        console.error('Error adding subject:', error);
        res.status(500).json({ 
            message: 'Failed to add subject',
            error: error.message 
        });
    }
});

// Remove subject from teacher
router.delete('/teachers/:id/subjects/:subjectId', authenticateToken, isSuperAdmin, async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        teacher.subjectsTaught = teacher.subjectsTaught.filter(
            subject => subject._id.toString() !== req.params.subjectId
        );
        await teacher.save();
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;