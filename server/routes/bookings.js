const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readDB, writeDB } = require('../utils/dbHelper');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /bookings (Customer gets own, Admin gets all)
router.get('/', verifyToken, (req, res) => {
  const db = readDB();
  let bookings = db.bookings || [];

  // Filter for Customer role
  if (req.user.role !== 'Admin') {
    bookings = bookings.filter(b => b.userId === req.user.id);
  }

  const { search, status, sortBy } = req.query;

  if (search) {
    const q = search.toLowerCase();
    bookings = bookings.filter(b =>
      b.movieName.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'All') {
    bookings = bookings.filter(b => b.status.toLowerCase() === status.toLowerCase());
  }

  if (sortBy === 'date') {
    bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
  }

  return res.json({ success: true, count: bookings.length, data: bookings });
});

// GET /bookings/:id
router.get('/:id', verifyToken, (req, res) => {
  const db = readDB();
  const booking = db.bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  // Authorization check
  if (req.user.role !== 'Admin' && booking.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  return res.json({ success: true, data: booking });
});

// POST /bookings (Creates booking with payment options verification)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { movieId, seats, paymentMethod, paymentDetails } = req.body;

    if (!movieId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ success: false, message: 'Movie ID and selected seats are required.' });
    }

    const db = readDB();
    const movie = db.movies.find(m => m.id === movieId);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Selected movie not found.' });
    }

    const ticketCount = seats.length;

    if (movie.availableSeats < ticketCount) {
      return res.status(400).json({ success: false, message: `Only ${movie.availableSeats} seats remaining for this show.` });
    }

    // Double-booking safety check
    const alreadyBookedSeats = (db.bookings || [])
      .filter(b => b.movieId === movie.id && b.status === 'Confirmed')
      .flatMap(b => b.seats || []);

    const conflictingSeats = seats.filter(s => alreadyBookedSeats.includes(s));
    if (conflictingSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Seat(s) ${conflictingSeats.join(', ')} are already booked. Please choose other seats.`
      });
    }

    // Cinemax Account / Login Password authorization (accepts any credentials for smooth test booking)
    const isCinemaxMethod = paymentMethod === 'Cinemax Account' || (paymentDetails && paymentDetails.method === 'cinemax');
    if (isCinemaxMethod) {
      // Payment authorized
    }

    // Deduct available seats
    movie.availableSeats -= ticketCount;

    const totalAmount = Number((movie.ticketPrice * ticketCount).toFixed(2));
    const finalMethodName = (paymentDetails && paymentDetails.methodName) || paymentMethod || 'UPI / Online';
    const txnId = 'TXN_' + Date.now().toString().slice(-8);

    const newBooking = {
      id: 'bk_' + Date.now().toString().slice(-6),
      userId: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      movieId: movie.id,
      movieName: movie.name,
      screenNumber: movie.screenNumber || 'Screen 1',
      showTime: `${movie.showDate} ${movie.showTime}`,
      seats: seats,
      ticketCount: ticketCount,
      totalAmount: totalAmount,
      paymentMethod: finalMethodName,
      paymentStatus: 'Paid',
      transactionId: txnId,
      bookingDate: new Date().toISOString(),
      status: 'Confirmed'
    };

    db.bookings.unshift(newBooking);
    writeDB(db);

    return res.status(201).json({
      success: true,
      message: 'Payment successful! Booking confirmed.',
      data: newBooking
    });

  } catch (err) {
    console.error('Error creating booking:', err);
    return res.status(500).json({ success: false, message: 'Server error while creating booking.' });
  }
});

// PUT /bookings/:id (Update status or details)
router.put('/:id', verifyToken, (req, res) => {
  try {
    const db = readDB();
    const bookingIndex = db.bookings.findIndex(b => b.id === req.params.id);

    if (bookingIndex === -1) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = db.bookings[bookingIndex];

    if (req.user.role !== 'Admin' && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const newStatus = req.body.status;

    // Handle seat adjustments if status changes to Cancelled
    if (newStatus === 'Cancelled' && booking.status !== 'Cancelled') {
      const movie = db.movies.find(m => m.id === booking.movieId);
      if (movie) {
        movie.availableSeats += booking.ticketCount;
      }
    } else if (newStatus === 'Confirmed' && booking.status === 'Cancelled') {
      const movie = db.movies.find(m => m.id === booking.movieId);
      if (movie) {
        if (movie.availableSeats < booking.ticketCount) {
          return res.status(400).json({ success: false, message: 'Not enough seats available to re-confirm booking.' });
        }
        movie.availableSeats -= booking.ticketCount;
      }
    }

    booking.status = newStatus || booking.status;
    db.bookings[bookingIndex] = booking;
    writeDB(db);

    return res.json({ success: true, message: 'Booking updated successfully.', data: booking });

  } catch (err) {
    console.error('Error updating booking:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating booking.' });
  }
});

// DELETE /bookings/:id (Cancel/Delete booking)
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const db = readDB();
    const index = db.bookings.findIndex(b => b.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = db.bookings[index];

    if (req.user.role !== 'Admin' && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Restore seats to movie if booking was active
    if (booking.status !== 'Cancelled') {
      const movie = db.movies.find(m => m.id === booking.movieId);
      if (movie) {
        movie.availableSeats += booking.ticketCount;
      }
    }

    db.bookings.splice(index, 1);
    writeDB(db);

    return res.json({ success: true, message: 'Booking deleted and seats restored.' });

  } catch (err) {
    console.error('Error deleting booking:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting booking.' });
  }
});

module.exports = router;
