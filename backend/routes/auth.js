const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ ONLY ONE AUTH ROUTE
app.use('/api/auth', require('./routes/authRoutes'));

app.use('/api/products',  require('./routes/products'));
app.use('/api/voice',     require('./routes/voice'));
app.use('/api/bill',      require('./routes/bill'));
app.use('/api/invoice',   require('./routes/invoice'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/employees', require('./routes/employees'));

// Static
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));
app.use('/uploads',  express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voice_billing')
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

module.exports = app;