const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load secure environment variables from hidden configuration manager
dotenv.config();

// IMPORT ROUTES HERE (Above database connection)
const authRoutes = require('./routes/authRoutes');
const consignmentRoutes = require('./routes/consignmentRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const byproductRoutes = require('./routes/byproductRoutes');

const app = express();

// 1. Secure Middleware Layers
app.use(express.json()); // Parses incoming transaction entries JSON bodies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Restricts access only to your trusted frontend app
  optionsSuccessStatus: 200
}));

// MOUNT ROUTES HERE (Directly below middleware configurations)
app.use('/api/auth', authRoutes);
app.use('/api/consignments', consignmentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/byproducts', byproductRoutes);

// 2. Database Connection Handling Engine
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ets_besvid_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('🛡️  MongoDB Secure Framework Connection Established Successfully.'))
  .catch(err => {
    console.error('🚨 Database Connection Breakdown Error:', err.message);
    process.exit(1); // Shuts down system if connection is unsafe or broken
  });

// 3. Health Check Verification Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "online", message: "ETS Besvid secure multi-currency server core running successfully." });
});

// 4. Global Error Catch Gate (Prevents server crashes on bad inputs)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Gateway Error: Data validation variance detected." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ETS Besvid Server running securely on structural port ${PORT}`);
});