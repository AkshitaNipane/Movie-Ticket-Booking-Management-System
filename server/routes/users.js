const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readDB, writeDB } = require('../utils/dbHelper');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /users (Admin Only)
router.get('/', verifyToken, requireRole('Admin'), (req, res) => {
  const db = readDB();
  const safeUsers = db.users.map(({ password, ...u }) => u);
  return res.json({ success: true, count: safeUsers.length, data: safeUsers });
});

// POST /users (Admin Only - Add User)
router.post('/', verifyToken, requireRole('Admin'), async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, phone, and password are required.' });
    }

    const db = readDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashedPassword,
      role: role === 'Admin' ? 'Admin' : 'Customer',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    const { password: _, ...safeUser } = newUser;
    return res.status(201).json({ success: true, message: 'User created successfully.', data: safeUser });

  } catch (err) {
    console.error('Error adding user:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating user.' });
  }
});

// PUT /users/:id (Admin or User updating profile)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const db = readDB();
    const index = db.users.findIndex(u => u.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Permission check: Admin or the user updating themselves
    if (req.user.role !== 'Admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const targetUser = db.users[index];
    const { name, phone, email, role, currentPassword, newPassword } = req.body;

    // Email change uniqueness check
    if (email && email.toLowerCase() !== targetUser.email) {
      const emailConflict = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== targetUser.id);
      if (emailConflict) {
        return res.status(400).json({ success: false, message: 'Email address is already in use.' });
      }
      targetUser.email = email.trim().toLowerCase();
    }

    if (name) targetUser.name = name.trim();
    if (phone) targetUser.phone = phone.trim();

    // Role change (Admin only)
    if (role && req.user.role === 'Admin') {
      targetUser.role = role === 'Admin' ? 'Admin' : 'Customer';
    }

    // Password update flow
    if (newPassword) {
      if (req.user.role !== 'Admin') {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
        }
        const isMatch = await bcrypt.compare(currentPassword, targetUser.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
      }

      const salt = await bcrypt.genSalt(10);
      targetUser.password = await bcrypt.hash(newPassword, salt);
    }

    db.users[index] = targetUser;
    writeDB(db);

    const { password: _, ...safeUser } = targetUser;
    return res.json({ success: true, message: 'Profile updated successfully.', data: safeUser });

  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating user.' });
  }
});

// DELETE /users/:id (Admin Only)
router.delete('/:id', verifyToken, requireRole('Admin'), (req, res) => {
  try {
    const db = readDB();
    const index = db.users.findIndex(u => u.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent admin from deleting themselves
    if (db.users[index].id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    db.users.splice(index, 1);
    writeDB(db);

    return res.json({ success: true, message: 'User deleted successfully.' });

  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting user.' });
  }
});

module.exports = router;
