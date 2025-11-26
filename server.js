const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();


// CORS FIX
app.use(cors({
  origin: "*",   // allow all for testing
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/profit-loss', require('./routes/profitLoss'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://zenith01yt_db_user:Zenith1912@cluster0.xku74ke.mongodb.net/?appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

// IMPORTANT: HOST = 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
