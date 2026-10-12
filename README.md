# Movie Ticket Booking Management System

A full-stack, responsive web application for managing movie ticket bookings, built with Node.js, Express, JWT Authentication, bcrypt, and vanilla HTML/CSS/JavaScript.

---

## 🌟 Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Design System, HSL themes, animations), Modern ES6 JavaScript (Single-Page Application Architecture).
- **Backend**: Node.js, Express.js.
- **Database**: `db.json` (Thread-safe atomic JSON database engine with seed data).
- **Security**: JWT (JSON Web Tokens) for session authorization, `bcryptjs` for password hashing, Role-Based Access Control (Admin vs. Customer).

---

## 🚀 Key Features

1. **User Authentication & Authorization**:
   - Registration with input validation (Email format, Min 8 chars password, confirm match, duplicate email check).
   - Login with email & password, JWT token generation, "Remember Me", and password visibility toggle.
   - Password encryption using `bcryptjs`.
   - LocalStorage session persistence.
   - Role-Based Access Control (Admin and Customer views).

2. **Login & Register UI**:
   - Modern Glassmorphism layout with background image & animated glow effects.
   - Responsive sidebar drawer for mobile view.
   - Dark & Light mode toggle.

3. **Dashboard**:
   - Real-time Top Stats Cards (Total Movies, Total Bookings, Available Seats, Users).
   - Recent Bookings Table with live status tags.
   - Currently Showing Movies grid.

4. **Movie CRUD Module**:
   - View, Create, Edit, and Delete movies (Admin restricted).
   - Filter by genre, search by title, and sort by date/title/price.
   - Interactive Seat Matrix Modal (Seats A1-E10, ticket count calculation, live total price).

5. **Booking CRUD Module**:
   - View customer bookings (Customers view their own; Admins view all).
   - Filter by booking status (`Confirmed`, `Cancelled`) and search query.
   - Cancel booking (releases seat count back to movie).
   - **Export Bookings to PDF** (Individual ticket PDF download & full report print).

6. **User CRUD Module (Admin Only)**:
   - View, Add, Edit, and Delete system users.
   - Assign roles (`Admin` or `Customer`).

7. **Profile Management**:
   - View profile info.
   - Update name, email, phone.
   - Secure Change Password form with old password verification.

8. **Bonus Features**:
   - Toast notification popups.
   - Custom Confirmation Modal Dialog before destructive delete actions.
   - Dark/Light Theme Switcher.
   - Export to PDF generator.

---

## 🔑 Default Credentials (Seed Data)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@movie.com` | `Admin@123` |
| **Customer** | `john@example.com` | `Customer@123` |
| **Customer** | `jane@example.com` | `Customer@123` |
| **Customer** | `mike@example.com` | `Customer@123` |
| **Customer** | `sarah@example.com` | `Customer@123` |

---

## 📦 Installation & Setup

1. **Navigate to the Project Root Directory**:
   ```bash
   cd "c:/Users/Akshita/Downloads/SEQA 7TH"
   ```

2. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Application Server**:
   ```bash
   npm start
   ```

4. **Access the Web Application**:
   Open your browser and visit:
   `http://localhost:3000`

---

## 🌐 REST API Endpoints

### Authentication
- `POST /api/auth/register` (or `/register`) - Register new account
- `POST /api/auth/login` (or `/login`) - Login and receive JWT
- `GET /api/auth/me` - Get current user profile

### Movies
- `GET /api/movies` (or `/movies`) - Get all movies (supports `?search=`, `?genre=`, `?sortBy=`)
- `GET /api/movies/:id` - Get single movie
- `POST /api/movies` - Create movie (Admin protected)
- `PUT /api/movies/:id` - Update movie (Admin protected)
- `DELETE /api/movies/:id` - Delete movie (Admin protected)

### Bookings
- `GET /api/bookings` (or `/bookings`) - Get bookings
- `GET /api/bookings/:id` - Get single booking
- `POST /api/bookings` - Create new ticket booking
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Delete/cancel booking

### Users
- `GET /api/users` (or `/users`) - Get all users (Admin protected)
- `POST /api/users` - Add user (Admin protected)
- `PUT /api/users/:id` - Update user / profile
- `DELETE /api/users/:id` - Delete user (Admin protected)
