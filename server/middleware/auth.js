const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Check for token in cookies first
  let token = req.cookies.token;
  
  // If not in cookies, check Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (!user || !user.id) {
      console.log('Invalid token payload:', user);
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    
    // Make college ID available in requests for ALL users (including super admins)
    if (user.collegeId) {
      req.collegeId = user.collegeId;
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const mongoose = require('mongoose');

// Middleware to add college filter to queries
const addCollegeFilter = (req, res, next) => {
  // ALL users (including super admins) should be restricted to their college data
  if (req.user && req.user.collegeId) {
    // Convert collegeId to proper ObjectId if it's a string
    let collegeId = req.user.collegeId;
    
    // If it's a string that looks like an ObjectId, convert it
    if (typeof collegeId === 'string' && mongoose.Types.ObjectId.isValid(collegeId)) {
      collegeId = new mongoose.Types.ObjectId(collegeId);
    }
    
    req.collegeFilter = { collegeId: collegeId };
    console.log('College filter applied:', req.collegeFilter, 'Type:', typeof collegeId);
  } else if (req.collegeId) {
    // Fallback to legacy collegeId from middleware
    let collegeId = req.collegeId;
    
    if (typeof collegeId === 'string' && mongoose.Types.ObjectId.isValid(collegeId)) {
      collegeId = new mongoose.Types.ObjectId(collegeId);
    }
    
    req.collegeFilter = { collegeId: collegeId };
    console.log('College filter applied (fallback):', req.collegeFilter, 'Type:', typeof collegeId);
  } else {
    // If no college ID is available, this might be an error state
    console.warn('No college ID available for user:', req.user?.id);
    req.collegeFilter = {};
  }
  next();
};

module.exports = { authenticateToken, addCollegeFilter };