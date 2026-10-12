const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../../db.json');

// Ensure DB file exists and pre-hashes any plain text passwords
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database file not found at ${DB_PATH}`);
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(data);

    // Initialize default collections if missing
    if (!parsed.users) parsed.users = [];
    if (!parsed.movies) parsed.movies = [];
    if (!parsed.bookings) parsed.bookings = [];

    return parsed;
  } catch (err) {
    console.error('Error reading db.json:', err.message);
    return { users: [], movies: [], bookings: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json:', err.message);
    return false;
  }
}

// Pre-seed passwords setup helper
async function ensureHashedPasswords() {
  const db = readDB();
  let updated = false;

  for (const user of db.users) {
    // If password doesn't look like a bcrypt hash (standard length/prefix check), hash it
    if (!user.password || (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$'))) {
      const defaultPass = user.role === 'Admin' ? 'Admin@123' : 'Customer@123';
      const hash = await bcrypt.hash(user.password || defaultPass, 10);
      user.password = hash;
      updated = true;
    }
  }

  if (updated) {
    writeDB(db);
    console.log('✔ Updated db.json with bcrypt hashed passwords.');
  }
}

module.exports = {
  readDB,
  writeDB,
  ensureHashedPasswords
};
