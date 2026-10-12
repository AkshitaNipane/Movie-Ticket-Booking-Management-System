/* Movies View Controller & Interactive Booking Modal */

const Movies = {
  moviesList: [],
  selectedMovieForBooking: null,
  selectedSeats: [],

  async render() {
    await this.fetchMovies();
    this.renderAdminControls();
  },

  renderAdminControls() {
    const addMovieBtn = document.getElementById('add-movie-trigger-btn');
    if (addMovieBtn) {
      addMovieBtn.style.display = Auth.isAdmin() ? 'inline-flex' : 'none';
    }
  },

  async fetchMovies() {
    const search = document.getElementById('movie-search-input')?.value || '';
    const genre = document.getElementById('movie-genre-filter')?.value || 'All';
    const sortBy = document.getElementById('movie-sort-filter')?.value || 'date';

    try {
      const query = new URLSearchParams({ search, genre, sortBy }).toString();
      const res = await API.get(`/api/movies?${query}`);
      this.moviesList = res.data || [];
      this.renderGrid(this.moviesList);
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  renderGrid(movies) {
    const grid = document.getElementById('movies-grid-container');
    if (!grid) return;

    if (movies.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 4rem 1rem; color: var(--text-muted);">
          <i class="ri-film-line" style="font-size: 3rem; opacity:0.5; margin-bottom:1rem; display:block;"></i>
          <h3>No Movies Found</h3>
          <p>Try clearing your search filters or check back later.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = movies.map(m => {
      const isAdmin = Auth.isAdmin();
      const adminActions = isAdmin ? `
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-secondary btn-sm" onclick="Movies.openEditModal('${m.id}')" title="Edit Movie">
            <i class="ri-edit-line"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="Movies.confirmDelete('${m.id}', '${m.name.replace(/'/g, "\\'")}')" title="Delete Movie">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>
      ` : '';

      return `
        <div class="movie-card">
          <div class="movie-poster-wrap">
            <img src="${m.posterUrl}" alt="${m.name}" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'">
            <span class="movie-badge-lang">${m.language}</span>
          </div>
          <div class="movie-body">
            <div>
              <h4 class="movie-title">${m.name}</h4>
              <div class="movie-genre">${m.genre}</div>
              <div class="movie-meta">
                <div><i class="ri-time-line"></i> ${m.duration}</div>
                <div><i class="ri-calendar-event-line"></i> ${m.showDate} • ${m.showTime}</div>
                <div><i class="ri-tv-line"></i> ${m.screenNumber}</div>
                <div><i class="ri-armchair-line"></i> ${m.availableSeats} Seats Available</div>
              </div>
            </div>
            <div class="movie-footer">
              <div class="movie-price">₹${m.ticketPrice.toFixed(2)}</div>
              <div style="display:flex; gap:0.5rem; align-items:center;">
                ${adminActions}
                <button class="btn btn-primary btn-sm" onclick="Movies.openBookSeatsModal('${m.id}')" ${m.availableSeats <= 0 ? 'disabled' : ''}>
                  <i class="ri-ticket-2-line"></i> ${m.availableSeats > 0 ? 'Book Ticket' : 'Sold Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Add Movie Modal
  openAddModal() {
    document.getElementById('movie-modal-title').innerText = 'Add New Movie';
    document.getElementById('movie-form').reset();
    document.getElementById('movie-id-input').value = '';
    document.getElementById('movie-modal').classList.add('active');
  },

  // Edit Movie Modal
  openEditModal(movieId) {
    const movie = this.moviesList.find(m => m.id === movieId);
    if (!movie) return;

    document.getElementById('movie-modal-title').innerText = 'Edit Movie';
    document.getElementById('movie-id-input').value = movie.id;
    document.getElementById('movie-name-input').value = movie.name;
    document.getElementById('movie-genre-input').value = movie.genre;
    document.getElementById('movie-language-input').value = movie.language;
    document.getElementById('movie-duration-input').value = movie.duration;
    document.getElementById('movie-date-input').value = movie.showDate;
    document.getElementById('movie-time-input').value = movie.showTime;
    document.getElementById('movie-screen-input').value = movie.screenNumber;
    document.getElementById('movie-seats-input').value = movie.availableSeats;
    document.getElementById('movie-price-input').value = movie.ticketPrice;
    document.getElementById('movie-poster-input').value = movie.posterUrl;

    document.getElementById('movie-modal').classList.add('active');
  },

  closeModal() {
    document.getElementById('movie-modal').classList.remove('active');
  },

  async handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('movie-id-input').value;

    const payload = {
      name: document.getElementById('movie-name-input').value,
      genre: document.getElementById('movie-genre-input').value,
      language: document.getElementById('movie-language-input').value,
      duration: document.getElementById('movie-duration-input').value,
      showDate: document.getElementById('movie-date-input').value,
      showTime: document.getElementById('movie-time-input').value,
      screenNumber: document.getElementById('movie-screen-input').value,
      availableSeats: document.getElementById('movie-seats-input').value,
      ticketPrice: document.getElementById('movie-price-input').value,
      posterUrl: document.getElementById('movie-poster-input').value
    };

    try {
      if (id) {
        await API.put(`/api/movies/${id}`, payload);
        Toast.show('Movie updated successfully!', 'success');
      } else {
        await API.post('/api/movies', payload);
        Toast.show('Movie created successfully!', 'success');
      }
      this.closeModal();
      this.fetchMovies();
      if (typeof Dashboard !== 'undefined') Dashboard.render();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  confirmDelete(movieId, movieName) {
    ConfirmModal.open({
      title: 'Delete Movie',
      message: `Are you sure you want to delete "${movieName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await API.delete(`/api/movies/${movieId}`);
          Toast.show('Movie deleted successfully.', 'success');
          this.fetchMovies();
          if (typeof Dashboard !== 'undefined') Dashboard.render();
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      }
    });
  },

  /* Interactive Seat Selector Modal */
  async openBookSeatsModal(movieId) {
    if (!Auth.isLoggedIn()) {
      Toast.show('Please log in to book movie tickets.', 'warning');
      App.showAuthView('login');
      return;
    }

    try {
      const res = await API.get(`/api/movies/${movieId}`);
      this.selectedMovieForBooking = res.data;
      this.selectedSeats = [];

      document.getElementById('booking-movie-title').innerText = this.selectedMovieForBooking.name;
      document.getElementById('booking-show-meta').innerText = `${this.selectedMovieForBooking.screenNumber} • ${this.selectedMovieForBooking.showDate} at ${this.selectedMovieForBooking.showTime}`;

      this.renderSeatsMatrix();
      this.updateBookingSummary();

      document.getElementById('seat-booking-modal').classList.add('active');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  closeBookingModal() {
    document.getElementById('seat-booking-modal').classList.remove('active');
  },

  renderSeatsMatrix() {
    const container = document.getElementById('seat-matrix-container');
    if (!container) return;

    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatsPerRow = 10;
    
    // Take real occupied seats from the backend (confirmed bookings)
    const occupiedSeats = (this.selectedMovieForBooking && Array.isArray(this.selectedMovieForBooking.occupiedSeats))
      ? this.selectedMovieForBooking.occupiedSeats
      : ['A3', 'A4', 'B7', 'C2', 'C3', 'C4', 'D8', 'E9'];

    let html = '';
    rows.forEach(r => {
      for (let i = 1; i <= seatsPerRow; i++) {
        const seatId = `${r}${i}`;
        const isOccupied = occupiedSeats.includes(seatId);
        html += `
          <div class="seat ${isOccupied ? 'occupied' : ''}" data-seat="${seatId}" onclick="Movies.toggleSeatSelection('${seatId}', this)">
            ${seatId}
          </div>
        `;
      }
    });

    container.innerHTML = html;
  },

  toggleSeatSelection(seatId, el) {
    if (el.classList.contains('occupied')) return;

    if (this.selectedSeats.includes(seatId)) {
      this.selectedSeats = this.selectedSeats.filter(s => s !== seatId);
      el.classList.remove('selected');
    } else {
      if (this.selectedSeats.length >= 6) {
        Toast.show('Maximum 6 seats can be selected per booking.', 'warning');
        return;
      }
      this.selectedSeats.push(seatId);
      el.classList.add('selected');
    }

    this.updateBookingSummary();
  },

  updateBookingSummary() {
    const count = this.selectedSeats.length;
    const pricePerTicket = this.selectedMovieForBooking ? this.selectedMovieForBooking.ticketPrice : 0;
    const total = count * pricePerTicket;

    const seatsText = count > 0 ? this.selectedSeats.join(', ') : 'None';
    const totalText = `₹${total.toFixed(2)}`;

    const seatsEl = document.getElementById('selected-seats-list');
    if (seatsEl) seatsEl.innerText = seatsText;

    const countEl = document.getElementById('selected-tickets-count');
    if (countEl) countEl.innerText = count;

    const priceEl = document.getElementById('booking-total-price');
    if (priceEl) priceEl.innerText = totalText;

    const btnPriceEl = document.getElementById('btn-total-amount');
    if (btnPriceEl) btnPriceEl.innerText = totalText;

    const confirmBtn = document.getElementById('submit-booking-btn');
    if (confirmBtn) {
      confirmBtn.disabled = count === 0;
    }
  },

  /* Payment Flow */
  openPaymentModal() {
    if (this.selectedSeats.length === 0) {
      Toast.show('Please select at least one seat before proceeding to payment.', 'warning');
      return;
    }

    // Close seat modal
    this.closeBookingModal();

    const count = this.selectedSeats.length;
    const pricePerTicket = this.selectedMovieForBooking ? this.selectedMovieForBooking.ticketPrice : 0;
    const total = (count * pricePerTicket).toFixed(2);

    // Populate order summary in payment modal
    const titleEl = document.getElementById('pay-summary-movie-title');
    if (titleEl) titleEl.innerText = this.selectedMovieForBooking.name;

    const metaEl = document.getElementById('pay-summary-meta');
    if (metaEl) metaEl.innerText = `${this.selectedMovieForBooking.screenNumber} • ${this.selectedMovieForBooking.showDate} at ${this.selectedMovieForBooking.showTime}`;

    const seatsEl = document.getElementById('pay-summary-seats');
    if (seatsEl) seatsEl.innerText = this.selectedSeats.join(', ');

    const countEl = document.getElementById('pay-summary-count');
    if (countEl) countEl.innerText = count;

    const amountEl = document.getElementById('pay-summary-amount');
    if (amountEl) amountEl.innerText = `₹${total}`;

    const btnAmountEl = document.getElementById('pay-btn-amount');
    if (btnAmountEl) btnAmountEl.innerText = `₹${total}`;

    // Fill Cinemax Account Email from Auth session
    const user = Auth.currentUser;
    const cinemaxEmailEl = document.getElementById('pay-cinemax-email');
    if (user && cinemaxEmailEl) {
      cinemaxEmailEl.innerText = user.email;
    }
    const cinemaxEmailInput = document.getElementById('pay-cinemax-email-input');
    if (cinemaxEmailInput) {
      cinemaxEmailInput.value = user ? user.email : 'user@gmail.com';
    }

    // Reset QR code area
    this.qrVisible = false;
    const qrArea = document.getElementById('qr-code-display-area');
    if (qrArea) qrArea.style.display = 'none';
    const badge = document.getElementById('qr-toggle-badge');
    if (badge) badge.innerHTML = '<i class="ri-qr-scan-line"></i> Click to Show QR';

    // Switch to chosen tab (default upi)
    this.switchPaymentMethod(this.currentPaymentMethod || 'upi');

    // Show Payment Modal
    document.getElementById('payment-modal').classList.add('active');
  },

  closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.classList.remove('active');
  },

  backToSeatSelection() {
    this.closePaymentModal();
    const seatModal = document.getElementById('seat-booking-modal');
    if (seatModal) seatModal.classList.add('active');
  },

  switchPaymentMethod(method) {
    this.currentPaymentMethod = method;

    // Update tab buttons
    document.querySelectorAll('.pay-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`tab-btn-${method}`);
    if (activeBtn) activeBtn.classList.add('active');

    // Update panels
    document.querySelectorAll('.pay-panel').forEach(panel => panel.classList.remove('active'));
    const activePanel = document.getElementById(`pay-panel-${method}`);
    if (activePanel) activePanel.classList.add('active');
  },

  selectUpiApp(appName) {
    document.querySelectorAll('.upi-app-badge').forEach(b => b.classList.remove('active'));
    if (window.event && window.event.currentTarget) {
      window.event.currentTarget.classList.add('active');
    }

    const upiInput = document.getElementById('pay-upi-id');
    if (upiInput) {
      const handles = {
        'Google Pay': 'user@okhdfcbank',
        'PhonePe': 'user@ybl',
        'Paytm': '9876543210@paytm',
        'BHIM': 'user@upi'
      };
      upiInput.value = handles[appName] || 'user@upi';
    }
  },

  qrVisible: false,

  toggleQrCode() {
    this.qrVisible = !this.qrVisible;
    const qrArea = document.getElementById('qr-code-display-area');
    const badge = document.getElementById('qr-toggle-badge');
    const qrImg = document.getElementById('qr-image-element');

    const count = this.selectedSeats ? this.selectedSeats.length : 1;
    const price = this.selectedMovieForBooking ? this.selectedMovieForBooking.ticketPrice : 250;
    const total = (count * price).toFixed(2);

    const qrDispAmount = document.getElementById('qr-display-amount');
    if (qrDispAmount) qrDispAmount.innerText = total;
    const qrConfAmount = document.getElementById('qr-confirm-amount');
    if (qrConfAmount) qrConfAmount.innerText = total;

    if (this.qrVisible) {
      if (qrArea) qrArea.style.display = 'block';
      if (badge) badge.innerHTML = '<i class="ri-eye-off-line"></i> Hide QR';
      if (qrImg) {
        // High-res UPI QR code image with amount & movie info
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('upi://pay?pa=cinebook@okhdfcbank&pn=Cinebook%20Cinemas&am=' + total + '&cu=INR')}`;
      }
    } else {
      if (qrArea) qrArea.style.display = 'none';
      if (badge) badge.innerHTML = '<i class="ri-qr-scan-line"></i> Click to Show QR';
    }
  },

  handleQrFallback(img) {
    // High-fidelity fallback SVG QR if offline
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="170" height="170">
      <rect width="100" height="100" fill="#ffffff"/>
      <rect x="5" y="5" width="28" height="28" fill="#000000" rx="4"/>
      <rect x="9" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
      <rect x="13" y="13" width="12" height="12" fill="#6366f1" rx="2"/>
      <rect x="67" y="5" width="28" height="28" fill="#000000" rx="4"/>
      <rect x="71" y="9" width="20" height="20" fill="#ffffff" rx="2"/>
      <rect x="75" y="13" width="12" height="12" fill="#6366f1" rx="2"/>
      <rect x="5" y="67" width="28" height="28" fill="#000000" rx="4"/>
      <rect x="9" y="71" width="20" height="20" fill="#ffffff" rx="2"/>
      <rect x="13" y="75" width="12" height="12" fill="#6366f1" rx="2"/>
      <rect x="38" y="10" width="6" height="6" fill="#000000"/>
      <rect x="48" y="10" width="6" height="6" fill="#000000"/>
      <rect x="58" y="10" width="6" height="6" fill="#000000"/>
      <rect x="38" y="22" width="16" height="6" fill="#000000"/>
      <rect x="42" y="38" width="16" height="16" fill="#6366f1" rx="4"/>
      <circle cx="50" cy="46" r="4" fill="#ffffff"/>
      <rect x="10" y="38" width="8" height="8" fill="#000000"/>
      <rect x="22" y="42" width="6" height="6" fill="#000000"/>
      <rect x="68" y="38" width="8" height="8" fill="#000000"/>
      <rect x="80" y="42" width="12" height="6" fill="#000000"/>
      <rect x="38" y="68" width="8" height="8" fill="#000000"/>
      <rect x="50" y="74" width="8" height="8" fill="#000000"/>
      <rect x="68" y="68" width="24" height="6" fill="#000000"/>
      <rect x="74" y="78" width="16" height="14" fill="#000000"/>
    </svg>`;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  },

  async processPaymentAndBook() {
    if (!this.selectedMovieForBooking || this.selectedSeats.length === 0) {
      Toast.show('No seats selected.', 'error');
      return;
    }

    const payBtn = document.getElementById('pay-now-btn');
    const originalBtnHtml = payBtn ? payBtn.innerHTML : '';

    let paymentMethodName = 'UPI / Online';
    let paymentDetails = { method: this.currentPaymentMethod };

    // Accept ANY fake number, fake UPI ID, fake card or credentials entered by user!
    if (this.currentPaymentMethod === 'upi') {
      const upiId = document.getElementById('pay-upi-id')?.value.trim() || '9892929666@paytm';
      paymentMethodName = `UPI (${upiId})`;
      paymentDetails.upiId = upiId;
      paymentDetails.methodName = 'UPI / GPay';
    } else if (this.currentPaymentMethod === 'card') {
      const cardNum = document.getElementById('pay-card-number')?.value.trim() || '4532 8920 1142 8892';
      paymentMethodName = `Card (•••• ${cardNum.slice(-4) || '8892'})`;
      paymentDetails.last4 = cardNum.slice(-4) || '8892';
      paymentDetails.methodName = 'Credit/Debit Card';
    } else if (this.currentPaymentMethod === 'cinemax') {
      const emailVal = document.getElementById('pay-cinemax-email-input')?.value.trim() || (Auth.currentUser ? Auth.currentUser.email : 'user@gmail.com');
      paymentMethodName = `Email Pay (${emailVal})`;
      paymentDetails.email = emailVal;
      paymentDetails.methodName = 'Email Pay';
    } else if (this.currentPaymentMethod === 'netbanking') {
      const bank = document.getElementById('pay-bank-select')?.value || 'HDFC Bank';
      paymentMethodName = `Net Banking (${bank})`;
      paymentDetails.bank = bank;
      paymentDetails.methodName = `Net Banking (${bank})`;
    }

    try {
      if (payBtn) {
        payBtn.disabled = true;
        payBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Processing Payment...';
      }

      const userEmail = (Auth.currentUser && Auth.currentUser.email) ? Auth.currentUser.email : 'akshitanipane26@gmail.com';
      const payload = {
        movieId: this.selectedMovieForBooking.id,
        seats: this.selectedSeats,
        paymentMethod: paymentMethodName,
        paymentDetails: paymentDetails,
        userEmail: userEmail
      };

      const res = await API.post('/api/bookings', payload);
      this.lastConfirmedBooking = res.data;

      // Close payment modal
      this.closePaymentModal();

      // Show Booking Success & Ticket Modal
      this.openSuccessModal(res.data);

      // Real-time system state updates
      this.fetchMovies();
      if (typeof Dashboard !== 'undefined') Dashboard.render();
      if (typeof Bookings !== 'undefined') Bookings.fetchBookings();

      Toast.show('Payment confirmed! Ticket booked successfully.', 'success');

    } catch (err) {
      Toast.show(err.message, 'error');
    } finally {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = originalBtnHtml;
      }
    }
  },

  openSuccessModal(booking) {
    document.getElementById('success-movie-name').innerText = booking.movieName;
    document.getElementById('success-booking-id').innerText = `#${booking.id}`;
    document.getElementById('success-showtime').innerText = booking.showTime;
    document.getElementById('success-screen').innerText = booking.screenNumber || 'Screen 1';
    document.getElementById('success-seats').innerText = booking.seats.join(', ');
    document.getElementById('success-count').innerText = `${booking.ticketCount} Ticket(s)`;
    document.getElementById('success-pay-method').innerText = booking.paymentMethod || 'Paid Online';
    document.getElementById('success-amount').innerText = `₹${Number(booking.totalAmount).toFixed(2)}`;

    document.getElementById('booking-success-modal').classList.add('active');
  },

  closeSuccessModal() {
    const modal = document.getElementById('booking-success-modal');
    if (modal) modal.classList.remove('active');
  },

  downloadCurrentTicket() {
    if (this.lastConfirmedBooking && typeof Bookings !== 'undefined') {
      Bookings.exportSinglePDF(this.lastConfirmedBooking);
    } else {
      Toast.show('No ticket details available for download.', 'warning');
    }
  },

  saveTicketFile() {
    if (!this.lastConfirmedBooking) {
      Toast.show('No ticket available to download.', 'warning');
      return;
    }
    const b = this.lastConfirmedBooking;
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CINEBOOK Ticket - #${b.id}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; padding: 40px; margin: 0; }
    .ticket { max-width: 500px; margin: 0 auto; background: #ffffff; border: 2px dashed #6366f1; border-radius: 16px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    h1 { color: #6366f1; text-align: center; margin: 0 0 5px 0; }
    .sub { text-align: center; color: #64748b; font-size: 13px; margin-bottom: 20px; }
    .movie { font-size: 20px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #0f172a; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .item strong { color: #64748b; text-transform: uppercase; font-size: 12px; }
    .item span { font-weight: 600; color: #1e293b; }
    .barcode { margin-top: 25px; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; padding: 12px; font-weight: bold; font-size: 12px; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="ticket">
    <h1>🎬 CINEBOOK CINEMAS</h1>
    <div class="sub">Official Movie Booking Ticket • Confirmed</div>
    <div class="movie">${b.movieName}</div>
    <div class="item"><strong>Booking ID</strong><span>#${b.id}</span></div>
    <div class="item"><strong>Customer Name</strong><span>${b.customerName}</span></div>
    <div class="item"><strong>Show Time</strong><span>${b.showTime}</span></div>
    <div class="item"><strong>Screen</strong><span>${b.screenNumber || 'Screen 1'}</span></div>
    <div class="item"><strong>Seats Reserved</strong><span style="color:#6366f1;">${b.seats.join(', ')}</span></div>
    <div class="item"><strong>Total Tickets</strong><span>${b.ticketCount}</span></div>
    <div class="item"><strong>Payment Mode</strong><span>${b.paymentMethod || 'Online'}</span></div>
    <div class="item"><strong>Total Paid</strong><span style="color:#10b981; font-size:16px;">₹${Number(b.totalAmount).toFixed(2)}</span></div>
    <div class="item"><strong>Status</strong><span style="color:#10b981;">Confirmed ✅</span></div>
    <div class="barcode">[ TICKET BARCODE: ${b.id} ]</div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cinebook-Ticket-${b.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.show('Ticket downloaded successfully!', 'success');
  },

  viewInBookings() {
    this.closeSuccessModal();
    App.showView('bookings');
    if (typeof Bookings !== 'undefined') Bookings.render();
  }
};

window.Movies = Movies;
