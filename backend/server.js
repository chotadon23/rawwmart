// ─────────────────────────────────────────
//  RAWWMART - Main Server File
//  This is the "heart" of your backend.
//  It starts a web server on your computer.
// ─────────────────────────────────────────

const express  = require('express');   // web server library
const mongoose = require('mongoose');  // database library
const cors     = require('cors');      // allows frontend to talk to backend
const dotenv   = require('dotenv');    // reads your .env secret file
const path     = require('path');      // helps with file paths

dotenv.config(); // load .env variables

const app = express(); // create the server

// ── MIDDLEWARE (things that run on every request) ──
app.use(cors());                           // allow cross-origin requests
app.use(express.json());                   // read JSON from requests
app.use(express.static(path.join(__dirname, '../frontend'))); // serve HTML files

// ── ROUTES (URL endpoints) ──
const authRoutes  = require('./routes/auth');
const orderRoutes = require('./routes/orders');

app.use('/api/auth',   authRoutes);   // e.g. POST /api/auth/register
app.use('/api/orders', orderRoutes);  // e.g. POST /api/orders/place

// ── HOME ROUTE ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── CONNECT TO DATABASE & START SERVER ──
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rawwmart';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB database');
    app.listen(PORT, () => {
      console.log(`🚀 RAWWMART server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
  });