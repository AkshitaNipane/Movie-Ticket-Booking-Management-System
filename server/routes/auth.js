const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../utils/dbHelper');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

// Email regex helper
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, role } = req.body;

    // Required fields validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Email format validation
    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Password length validation
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Password match validation
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const db = readDB();

    // Check duplicate email
    const existingUser = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default role is Customer unless specified as Admin
    const userRole = role === 'Admin' ? 'Admin' : 'Customer';

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      role: userRole,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Omit password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: userWithoutPassword
    });

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// POST /login
// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const db = readDB();
    let user = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      // Auto-register new customer account seamlessly so any email can log in
      const defaultName = email.split('@')[0] || 'Customer';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Customer@123', salt);
      user = {
        id: 'usr_' + Date.now(),
        name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
        email: email.trim().toLowerCase(),
        phone: '9892929666',
        password: hashedPassword,
        role: 'Customer',
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      writeDB(db);
    } else if (password && user.role === 'Admin') {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid admin password.' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: userWithoutPassword
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// GET /me (Protected)
router.get('/me', verifyToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }
  const { password: _, ...userWithoutPassword } = user;
  return res.json({ success: true, user: userWithoutPassword });
});

module.exports = router;
