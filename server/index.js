const express = require('express');
const cors = require('cors');
const path = require('path');
const { ensureHashedPasswords } = require('./utils/dbHelper');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'client' folder
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);

// Direct compatibility endpoints for SRS spec compliance:
// /register -> /api/auth/register
app.post('/register', (req, res, next) => {
  req.url = '/register';
  authRoutes(req, res, next);
});
// /login -> /api/auth/login
app.post('/login', (req, res, next) => {
  req.url = '/login';
  authRoutes(req, res, next);
});
// /movies
app.use('/movies', movieRoutes);
// /bookings
app.use('/bookings', bookingRoutes);
// /users
app.use('/users', userRoutes);

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start Server
app.listen(PORT, async () => {
  await ensureHashedPasswords();
  console.log(`===================================================`);
  console.log(`🎬 Movie Ticket Booking Management Server Running!`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
