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
    
    // Make college ID available in requests (except for super admins)
    if (user.role !== 'super_admin' && user.collegeId) {
      req.collegeId = user.collegeId;
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to add college filter to queries
const addCollegeFilter = (req, res, next) => {
  // If user is super admin, don't add college filter unless specified
  if (req.user && req.user.role === 'super_admin') {
    // Super admin can access all data or specify college in query params
    if (req.query.collegeId) {
      req.collegeFilter = { collegeId: req.query.collegeId };
    } else {
      req.collegeFilter = {}; // No filter for super admin by default
    }
  } else if (req.collegeId) {
    // Regular users only see their college data
    req.collegeFilter = { collegeId: req.collegeId };
  } else {
    req.collegeFilter = {};
  }
  next();
};

module.exports = { authenticateToken, addCollegeFilter };