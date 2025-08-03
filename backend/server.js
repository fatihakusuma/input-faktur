const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Import routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);  // Semua endpoint diawali dengan /api

// Handle production
if (process.env.NODE_ENV === 'production') {
  // Static folder
  app.use(express.static(__dirname + '/../frontend/build'));
  
  // Handle SPA
  app.get(/.*/, (req, res) => res.sendFile(__dirname + '/../frontend/build/index.html'));
}

// Ekspor untuk Vercel
module.exports = app;
