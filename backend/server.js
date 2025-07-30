require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

const cors = require('cors');
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'http://localhost:3000' // untuk development
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

module.exports = app;
