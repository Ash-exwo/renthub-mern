// app.js = configure application
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const listingRoutes = require('./routes/listingRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Parses incoming JSON requests with high-res photos
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler (guarantees clean JSON response instead of HTML error pages)
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    message: err.message || "An unexpected server error occurred.",
  });
});

module.exports = app;
