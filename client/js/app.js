/* Core SPA Router & Application Initializer */

const App = {
  currentView: 'dashboard',

  init() {
    Auth.init();
    this.initTheme();
    this.bindEvents();

    if (Auth.isLoggedIn()) {
      this.showMainLayout();
      this.showView('dashboard');
    } else {
      this.showAuthView('login');
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem('cinebook_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.className = savedTheme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cinebook_theme', next);
    
    const themeIcon = document.getElementById('theme-toggle-icon');
    if (themeIcon) {
      themeIcon.className = next === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
    }
  },

  bindEvents() {
    // Password Visibility Toggles
    document.querySelectorAll('.toggle-password').forEach(icon => {
      icon.addEventListener('click', (e) => {
        const input = e.target.previousElementSibling;
        if (input.type === 'password') {
          input.type = 'text';
          e.target.classList.replace('ri-eye-off-line', 'ri-eye-line');
        } else {
          input.type = 'password';
          e.target.classList.replace('ri-eye-line', 'ri-eye-off-line');
        }
      });
    });

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password')?.value || 'Customer@123';
        const rememberMe = document.getElementById('login-remember')?.checked;

        try {
          await Auth.login(email, password, rememberMe);
          this.showMainLayout();
          this.showView('dashboard');
        } catch (err) {
          // Handled in Auth.login
        }
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const phone = document.getElementById('reg-phone').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const role = document.getElementById('reg-role').value;

        try {
          await Auth.register({ name, email, phone, password, confirmPassword, role });
          this.showMainLayout();
          this.showView('dashboard');
        } catch (err) {
          // Handled in Auth.register
        }
      });
    }
  },

  showAuthView(viewName = 'login') {
    document.getElementById('app-main-layout').style.display = 'none';
    document.getElementById('auth-section').style.display = 'flex';

    if (viewName === 'login') {
      document.getElementById('login-card').style.display = 'block';
      document.getElementById('register-card').style.display = 'none';
    } else {
      document.getElementById('login-card').style.display = 'none';
      document.getElementById('register-card').style.display = 'block';
    }
  },

  showMainLayout() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('app-main-layout').style.display = 'flex';
    this.updateUserBadge();
  },

  updateUserBadge() {
    const user = Auth.currentUser;
    if (!user) return;

    document.querySelectorAll('.user-name-display').forEach(el => el.innerText = user.name);
    document.querySelectorAll('.user-avatar-display').forEach(el => el.innerText = user.name.charAt(0).toUpperCase());
    
    const roleBadge = document.getElementById('sidebar-role-badge');
    if (roleBadge) {
      roleBadge.innerText = user.role;
      roleBadge.className = `role-badge ${user.role === 'Admin' ? 'admin' : ''}`;
    }

    // Admin link visibility in sidebar
    const usersMenuItem = document.getElementById('sidebar-menu-users');
    if (usersMenuItem) {
      usersMenuItem.style.display = Auth.isAdmin() ? 'block' : 'none';
    }
  },

  showView(viewName) {
    this.currentView = viewName;

    // Update active state in sidebar
    document.querySelectorAll('.sidebar .menu-item').forEach(item => {
      item.classList.remove('active');
    });

    const targetMenuItem = document.getElementById(`nav-item-${viewName}`);
    if (targetMenuItem) targetMenuItem.classList.add('active');

    // Hide all view pages
    document.querySelectorAll('.view-page').forEach(page => {
      page.style.display = 'none';
    });

    // Show target view page
    const targetPage = document.getElementById(`page-view-${viewName}`);
    if (targetPage) {
      targetPage.style.display = 'block';
    }

    // Close mobile sidebar if open
    document.getElementById('sidebar')?.classList.remove('show');

    // Initialize/Render controller for the target view
    if (viewName === 'dashboard' && typeof Dashboard !== 'undefined') {
      Dashboard.render();
    } else if (viewName === 'movies' && typeof Movies !== 'undefined') {
      Movies.render();
    } else if (viewName === 'bookings' && typeof Bookings !== 'undefined') {
      Bookings.render();
    } else if (viewName === 'users' && typeof Users !== 'undefined') {
      Users.render();
    } else if (viewName === 'profile' && typeof Profile !== 'undefined') {
      Profile.render();
    }
  },

  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('show');
  },

  showForgotPasswordModal() {
    Toast.show('Password reset link sent to your registered email address (Demo).', 'info', 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
