/* Bookings View Controller & PDF Export Handler */

const Bookings = {
  bookingsList: [],

  async render() {
    await this.fetchBookings();
  },

  async fetchBookings() {
    const search = document.getElementById('booking-search-input')?.value || '';
    const status = document.getElementById('booking-status-filter')?.value || 'All';

    try {
      const query = new URLSearchParams({ search, status, sortBy: 'date' }).toString();
      const res = await API.get(`/api/bookings?${query}`);
      this.bookingsList = res.data || [];
      this.renderTable(this.bookingsList);
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  renderTable(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;

    if (bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:3rem; color:var(--text-muted);">No bookings found.</td></tr>`;
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      let statusBadge = `<span class="badge badge-success"><i class="ri-checkbox-circle-fill"></i> ${b.status}</span>`;
      if (b.status === 'Cancelled') {
        statusBadge = `<span class="badge badge-danger"><i class="ri-close-circle-fill"></i> Cancelled</span>`;
      }

      const formattedDate = new Date(b.bookingDate).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const canCancel = b.status !== 'Cancelled';
      const isAdmin = Auth.isAdmin();

      return `
        <tr>
          <td><strong>#${b.id}</strong></td>
          <td>${b.customerName}</td>
          <td><strong>${b.movieName}</strong></td>
          <td>${b.showTime}</td>
          <td>${b.seats.join(', ')}</td>
          <td>${b.ticketCount}</td>
          <td><strong>₹${b.totalAmount.toFixed(2)}</strong></td>
          <td><span style="font-size:0.8rem; color:var(--text-muted);">${formattedDate}</span></td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="Bookings.exportSinglePDF('${b.id}')" title="Download Ticket PDF">
                <i class="ri-file-pdf-2-line"></i>
              </button>
              ${canCancel ? `
                <button class="btn btn-danger btn-sm" onclick="Bookings.cancelBooking('${b.id}')" title="Cancel Booking">
                  <i class="ri-close-circle-line"></i> Cancel
                </button>
              ` : ''}
              ${isAdmin ? `
                <button class="btn btn-danger btn-sm" onclick="Bookings.deleteBooking('${b.id}')" title="Delete Booking Record">
                  <i class="ri-delete-bin-line"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  cancelBooking(bookingId) {
    ConfirmModal.open({
      title: 'Cancel Ticket Booking',
      message: 'Are you sure you want to cancel this booking? The seat count will be released back to the movie.',
      confirmText: 'Cancel Booking',
      onConfirm: async () => {
        try {
          await API.put(`/api/bookings/${bookingId}`, { status: 'Cancelled' });
          Toast.show('Booking cancelled successfully.', 'info');
          this.fetchBookings();
          if (typeof Dashboard !== 'undefined') Dashboard.render();
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      }
    });
  },

  deleteBooking(bookingId) {
    ConfirmModal.open({
      title: 'Delete Booking Record',
      message: 'Permanently remove this booking record from the system database?',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await API.delete(`/api/bookings/${bookingId}`);
          Toast.show('Booking deleted.', 'success');
          this.fetchBookings();
          if (typeof Dashboard !== 'undefined') Dashboard.render();
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      }
    });
  },

  /* Export Bookings to PDF */
  exportAllPDF() {
    if (this.bookingsList.length === 0) {
      Toast.show('No bookings available to export.', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    const rowsHtml = this.bookingsList.map(b => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">#${b.id}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${b.customerName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${b.movieName}</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${b.showTime}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${b.seats.join(', ')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">₹${b.totalAmount.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${b.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CINEBOOK - Bookings Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
          h2 { color: #6366f1; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f1f5f9; text-align: left; padding: 10px 8px; font-size: 13px; border-bottom: 2px solid #ccc; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: right; }
        </style>
      </head>
      <body>
        <h2>🎬 CINEBOOK - Movie Ticket Bookings Report</h2>
        <p>Generated on: ${new Date().toLocaleString()} | Total Bookings: ${this.bookingsList.length}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Movie</th>
              <th>Showtime</th>
              <th>Seats</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="footer">Confidential System Document • Movie Ticket Booking Management System</div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  },

  exportSinglePDF(bookingOrId) {
    let booking = null;
    if (typeof bookingOrId === 'object' && bookingOrId !== null) {
      booking = bookingOrId;
    } else {
      booking = (this.bookingsList || []).find(b => b.id === bookingOrId) ||
                (window.Movies && window.Movies.lastConfirmedBooking && window.Movies.lastConfirmedBooking.id === bookingOrId ? window.Movies.lastConfirmedBooking : null);
    }
    if (!booking) {
      if (typeof Toast !== 'undefined') Toast.show('Booking details not found for ticket download.', 'warning');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (typeof Toast !== 'undefined') Toast.show('Pop-up window blocked. Please allow pop-ups for localhost.', 'warning');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket-${booking.id}-${booking.movieName.replace(/[^a-zA-Z0-9]/g, '_')}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; padding: 30px; margin: 0; color: #1e293b; }
          .print-bar { max-width: 520px; margin: 0 auto 15px auto; display: flex; justify-content: space-between; align-items: center; }
          .btn-save-pdf { background: #6366f1; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
          .btn-save-pdf:hover { background: #4f46e5; }
          .btn-close { background: #e2e8f0; color: #475569; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; }
          .ticket { max-width: 520px; margin: 0 auto; background: #ffffff; border: 2px dashed #6366f1; border-radius: 18px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
          .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 18px; }
          .header h1 { margin: 0; color: #6366f1; letter-spacing: 2px; font-size: 24px; }
          .movie-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 8px; text-align: center; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; font-size: 14px; }
          .meta-item strong { display: block; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; }
          .meta-item span { font-weight: 700; color: #0f172a; font-size: 14px; }
          .qr-placeholder { margin-top: 24px; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; padding: 14px; border-radius: 8px; font-size: 12px; font-weight: bold; letter-spacing: 2px; color: #475569; }
          @media print {
            .no-print { display: none !important; }
            body { background: #ffffff !important; padding: 0 !important; }
            .ticket { box-shadow: none !important; border: 2px dashed #6366f1 !important; margin: 0 auto !important; }
            @page { size: auto; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="print-bar no-print">
          <button class="btn-save-pdf" onclick="window.print()">
            📥 Click to Save as PDF / Print
          </button>
          <button class="btn-close" onclick="window.close()">Close</button>
        </div>

        <div class="ticket">
          <div class="header">
            <h1>🎬 CINEBOOK CINEMAS</h1>
            <p style="margin:5px 0 0 0; color:#64748b; font-size:12px;">Official Movie Ticket • #${booking.id}</p>
          </div>
          <div class="movie-title">${booking.movieName}</div>
          <div class="meta-grid">
            <div class="meta-item"><strong>Customer Name</strong><span>${booking.customerName}</span></div>
            <div class="meta-item"><strong>Booking Status</strong><span style="color:${booking.status === 'Confirmed' ? '#10b981' : '#ef4444'};">${booking.status} ✅</span></div>
            <div class="meta-item"><strong>Show Time</strong><span>${booking.showTime}</span></div>
            <div class="meta-item"><strong>Screen</strong><span>${booking.screenNumber || 'Screen 1'}</span></div>
            <div class="meta-item"><strong>Seats Reserved</strong><span style="color:#6366f1;">${booking.seats.join(', ')}</span></div>
            <div class="meta-item"><strong>Total Tickets</strong><span>${booking.ticketCount} Ticket(s)</span></div>
            <div class="meta-item"><strong>Payment Method</strong><span>${booking.paymentMethod || 'Online Paid'}</span></div>
            <div class="meta-item"><strong>Total Amount</strong><span style="color:#10b981; font-size:16px;">₹${booking.totalAmount.toFixed(2)}</span></div>
          </div>
          <div class="qr-placeholder">
            [ TICKET PASS BARCODE: ${booking.id}-${Date.now().toString().slice(-4)} ]
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
};

window.Bookings = Bookings;
