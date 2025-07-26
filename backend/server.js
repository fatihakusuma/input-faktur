require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});