const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const sessionConfig = require("../config/session");
const cookieParser = require('cookie-parser');
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set');
  process.env.JWT_SECRET = 'b2e3c059f1cc407f24c4fdfc926d3b33b426888d1b6c55e506cc277098ae5e79'; // Fallback for development
}

const app = express();
 
// Middleware 
app.use(
  cors({
    origin: [
      process.env.VITE_FRONT_URL,
      'http://localhost:5173', // Vite dev server default port
      'http://localhost:5174', // Vite dev server default port
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'https://daily-viva-tracker.onrender.com', // Add Render deployment URL
      'https://daily-viva-tracker.vercel.app', // Frontend Vercel deployment URL
      'https://daily-viva-tracker-3p9w.vercel.app', // Backend Vercel deployment URL
      'https://v6xrx50k-5000.inc1.devtunnels.ms',
      'https://daily-viva-tracker-frontend-2.vercel.app', 
      // Allow any vercel.app subdomain for flexibility
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/daily-viva-tracker.*\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
  })
);
app.use(express.json());
app.use(cookieParser());

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Configure cookie settings
app.use((req, res, next) => {
  res.cookie('token', req.cookies.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  next();
});

// Session middleware
app.use(session(sessionConfig));

// Session check middleware
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.user = req.session.userId;
  }
  next();
});

// Define routes
app.get("/api/test", (req, res) => {
  res.json({ message: "API is running with CORS fixes!", timestamp: new Date().toISOString() });
});

// Import routes
const studentRoutes = require("../routes/students");
const teachersRoutes = require("../routes/teachers");
const roundsRoutes = require("../routes/rounds");
const dvtMarksRoutes = require("../routes/dvtmarks");
const semestersRoutes = require("../routes/semesters");
const subjectsRoutes = require("../routes/subjects");
const gradingConfigsRoutes = require("../routes/gradingConfigs");
const exportsRoutes = require("../routes/exports");
const superadminRoutes = require("../routes/superadmin");
const improvementsRoutes = require("../routes/improvements");
const adminStatsRoutes = require("../routes/adminStats");
const bulkImportRoutes = require("../routes/bulkImport");
const collegesRoutes = require("../routes/colleges");
const registrationRoutes = require("../routes/registration");
const superAdminRegistrationRoutes = require("../routes/super-admin-registration");

// Import auth middleware
const { authenticateToken } = require('../middleware/auth');

// Public routes
app.use("/api/teachers", teachersRoutes); // Keep this public for login/register
app.use("/api/registration", registrationRoutes); // College registration system
app.use("/api/super-admin-registration", superAdminRegistrationRoutes); // One-time super admin registration

// URL Generator Page (for initial setup)
const { generateUrlHtml } = require('../generate-url-page');
app.get('/generate-super-admin-url', (req, res) => {
  res.send(generateUrlHtml);
});

// Protected routes - require JWT authentication
app.use("/api/students", authenticateToken, studentRoutes);
app.use("/api/rounds", authenticateToken, roundsRoutes);
app.use("/api/dvtmarks", authenticateToken, dvtMarksRoutes);
app.use("/api/semesters", authenticateToken, semestersRoutes);
app.use("/api/subjects", authenticateToken, subjectsRoutes);
app.use("/api/grading-configs", authenticateToken, gradingConfigsRoutes);
app.use("/api/exports", authenticateToken, exportsRoutes);
app.use("/api/superadmin", authenticateToken, superadminRoutes); // This route also has isSuperAdmin middleware inside
app.use("/api/improvements", authenticateToken, improvementsRoutes);
app.use("/api/admin", authenticateToken, adminStatsRoutes); // Admin statistics routes
app.use("/api/bulk-import", authenticateToken, bulkImportRoutes); // Bulk import routes
app.use("/api/colleges", authenticateToken, collegesRoutes); // College management routes

app.use(express.static(path.join(__dirname, 'public')));

// Get MongoDB URL from config to ensure consistency
const MONGODB_URL = process.env.MONGODB_URL;
console.log(MONGODB_URL);
// Connect to MongoDB with updated options
mongoose
  .connect(MONGODB_URL, {
    serverSelectionTimeoutMS: 30000, // Increased timeout
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority',
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log("Please check:");
    console.log("1. Your internet connection");
    console.log("2. MongoDB Atlas cluster status");
    console.log("3. IP whitelist in MongoDB Atlas");
    console.log("4. Connection string validity");
  });

// Then static files
app.use(express.static(path.join(__dirname, '../client/dist')));

const staticPath = path.join(__dirname, '../client/dist/index.html');
console.log('Serving static files from:', staticPath);

// THEN catch-all route (for SPA routing)
app.get('*', (req, res) => {
  // Don't handle API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// module.exports = app;
 