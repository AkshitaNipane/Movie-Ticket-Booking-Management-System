const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../utils/dbHelper');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /movies - List all movies (Public or authenticated)
router.get('/', (req, res) => {
  const db = readDB();
  let movies = db.movies || [];

  const { search, genre, date, sortBy } = req.query;

  // Search filter
  if (search) {
    const q = search.toLowerCase();
    movies = movies.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.genre.toLowerCase().includes(q) ||
      m.language.toLowerCase().includes(q)
    );
  }

  // Genre filter
  if (genre && genre !== 'All') {
    movies = movies.filter(m => m.genre.toLowerCase().includes(genre.toLowerCase()));
  }

  // Date filter
  if (date) {
    movies = movies.filter(m => m.showDate === date);
  }

  // Sorting
  if (sortBy === 'name') {
    movies.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'price') {
    movies.sort((a, b) => a.ticketPrice - b.ticketPrice);
  } else if (sortBy === 'date') {
    movies.sort((a, b) => new Date(a.showDate) - new Date(b.showDate));
  }

  return res.json({ success: true, count: movies.length, data: movies });
});

// GET /movies/:id
router.get('/:id', (req, res) => {
  const db = readDB();
  const movie = db.movies.find(m => m.id === req.params.id);
  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }

  const occupiedSeats = (db.bookings || [])
    .filter(b => b.movieId === movie.id && b.status === 'Confirmed')
    .flatMap(b => b.seats || []);

  return res.json({ success: true, data: { ...movie, occupiedSeats } });
});

// POST /movies (Admin Only)
router.post('/', verifyToken, requireRole('Admin'), (req, res) => {
  try {
    const { name, genre, language, duration, showDate, showTime, screenNumber, availableSeats, ticketPrice, posterUrl } = req.body;

    if (!name || !genre || !language || !showDate || !showTime || !ticketPrice) {
      return res.status(400).json({ success: false, message: 'Movie name, genre, language, show date, show time, and price are required.' });
    }

    const db = readDB();

    const newMovie = {
      id: 'mov_' + Date.now(),
      name: name.trim(),
      genre: genre.trim(),
      language: language.trim(),
      duration: duration || '120 min',
      showDate,
      showTime,
      screenNumber: screenNumber || 'Screen 1',
      availableSeats: Number(availableSeats) || 100,
      ticketPrice: Number(ticketPrice),
      posterUrl: posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'
    };

    db.movies.unshift(newMovie);
    writeDB(db);

    return res.status(201).json({ success: true, message: 'Movie created successfully!', data: newMovie });

  } catch (err) {
    console.error('Error adding movie:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating movie.' });
  }
});

// PUT /movies/:id (Admin Only)
router.put('/:id', verifyToken, requireRole('Admin'), (req, res) => {
  try {
    const db = readDB();
    const index = db.movies.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    const currentMovie = db.movies[index];

    const updatedMovie = {
      ...currentMovie,
      name: req.body.name !== undefined ? req.body.name.trim() : currentMovie.name,
      genre: req.body.genre !== undefined ? req.body.genre.trim() : currentMovie.genre,
      language: req.body.language !== undefined ? req.body.language.trim() : currentMovie.language,
      duration: req.body.duration !== undefined ? req.body.duration : currentMovie.duration,
      showDate: req.body.showDate !== undefined ? req.body.showDate : currentMovie.showDate,
      showTime: req.body.showTime !== undefined ? req.body.showTime : currentMovie.showTime,
      screenNumber: req.body.screenNumber !== undefined ? req.body.screenNumber : currentMovie.screenNumber,
      availableSeats: req.body.availableSeats !== undefined ? Number(req.body.availableSeats) : currentMovie.availableSeats,
      ticketPrice: req.body.ticketPrice !== undefined ? Number(req.body.ticketPrice) : currentMovie.ticketPrice,
      posterUrl: req.body.posterUrl !== undefined ? req.body.posterUrl : currentMovie.posterUrl
    };

    db.movies[index] = updatedMovie;
    writeDB(db);

    return res.json({ success: true, message: 'Movie updated successfully!', data: updatedMovie });

  } catch (err) {
    console.error('Error updating movie:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating movie.' });
  }
});

// DELETE /movies/:id (Admin Only)
router.delete('/:id', verifyToken, requireRole('Admin'), (req, res) => {
  try {
    const db = readDB();
    const index = db.movies.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Movie not found.' });
    }

    db.movies.splice(index, 1);
    writeDB(db);

    return res.json({ success: true, message: 'Movie deleted successfully.' });

  } catch (err) {
    console.error('Error deleting movie:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting movie.' });
  }
});

module.exports = router;
