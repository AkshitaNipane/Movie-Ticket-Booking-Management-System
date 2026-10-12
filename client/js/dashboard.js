/* Dashboard View Controller */

const Dashboard = {
  async render() {
    try {
      // Fetch movies and bookings
      const moviesRes = await API.get('/api/movies');
      const bookingsRes = await API.get('/api/bookings');

      const movies = moviesRes.data || [];
      const bookings = bookingsRes.data || [];

      // Stat 1: Total Movies
      document.getElementById('stat-total-movies').innerText = movies.length;

      // Stat 2: Total Bookings
      document.getElementById('stat-total-bookings').innerText = bookings.length;

      // Stat 3: Available Seats
      const totalAvailableSeats = movies.reduce((sum, m) => sum + (m.availableSeats || 0), 0);
      document.getElementById('stat-available-seats').innerText = totalAvailableSeats;

      // Stat 4: Users (Admin can fetch /api/users, else calculate from customer names)
      if (Auth.isAdmin()) {
        try {
          const usersRes = await API.get('/api/users');
          document.getElementById('stat-total-users').innerText = (usersRes.data || []).length;
        } catch (e) {
          document.getElementById('stat-total-users').innerText = '5+';
        }
      } else {
        document.getElementById('stat-total-users').innerText = 'N/A';
      }

      // Render Recent Bookings Table (Top 5)
      this.renderRecentBookings(bookings.slice(0, 5));

      // Render Upcoming Movies (Top 4)
      this.renderUpcomingMovies(movies.slice(0, 4));

    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  },

  renderRecentBookings(recentBookings) {
    const tbody = document.getElementById('recent-bookings-tbody');
    if (!tbody) return;

    if (recentBookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No recent bookings found.</td></tr>`;
      return;
    }

    tbody.innerHTML = recentBookings.map(b => {
      let statusBadge = `<span class="badge badge-success"><i class="ri-checkbox-circle-fill"></i> ${b.status}</span>`;
      if (b.status === 'Cancelled') {
        statusBadge = `<span class="badge badge-danger"><i class="ri-close-circle-fill"></i> Cancelled</span>`;
      }

      return `
        <tr>
          <td><strong>#${b.id}</strong></td>
          <td>${b.customerName}</td>
          <td><strong>${b.movieName}</strong></td>
          <td>${b.seats.join(', ')}</td>
          <td>₹${b.totalAmount.toFixed(2)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  },

  renderUpcomingMovies(movies) {
    const container = document.getElementById('dashboard-movies-grid');
    if (!container) return;

    if (movies.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);">No movies currently showing.</p>`;
      return;
    }

    container.innerHTML = movies.map(m => `
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
              <div><i class="ri-calendar-event-line"></i> ${m.showDate} ${m.showTime}</div>
              <div><i class="ri-armchair-line"></i> ${m.availableSeats} Seats Left</div>
            </div>
          </div>
          <div class="movie-footer">
            <div class="movie-price">₹${m.ticketPrice.toFixed(2)}</div>
            <button class="btn btn-primary btn-sm" onclick="Movies.openBookSeatsModal('${m.id}')">
              <i class="ri-ticket-2-line"></i> Book
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }
};

window.Dashboard = Dashboard;
