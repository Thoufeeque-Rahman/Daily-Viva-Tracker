const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {  // Changed from 'superadmin' to 'super_admin'
        next();
    } else {
        console.log('Access denied. User role:', req.user?.role); // Add logging
        res.status(403).json({ message: 'Access denied. Super admin rights required.' });
    }
};

module.exports = { isSuperAdmin };