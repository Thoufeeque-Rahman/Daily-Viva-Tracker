const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const sessionConfig = require("./config/session");
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
      'https://daily-viva-tracker.onrender.com', // Add Render deployment URL
      'https://daily-viva-tracker.vercel.app', // Add Vercel deployment URL
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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
  res.send("API is running...");
});

// Import routes
const studentRoutes = require("./routes/students");
const teachersRoutes = require("./routes/teachers");
const roundsRoutes = require("./routes/rounds");
const dvtMarksRoutes = require("./routes/dvtmarks");

// Use routes
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teachersRoutes);
app.use("/api/rounds", roundsRoutes);
app.use("/api/dvtmarks", dvtMarksRoutes);

app.use(express.static(path.join(__dirname, 'public')));

// Get MongoDB URL from config to ensure consistency
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb+srv://rahmanam90:9946337540@cluster0.8sxy4wx.mongodb.net/my_dvt_db';

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

// THEN catch-all route
app.get(/^(?!\/?api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
