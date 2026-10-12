/* User Authentication & Session Controller */

const Auth = {
  currentUser: null,

  init() {
    const savedUser = localStorage.getItem('cinebook_user');
    const token = localStorage.getItem('cinebook_jwt_token');

    if (savedUser && token) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch (e) {
        this.clearSession();
      }
    }
  },

  async login(email, password, rememberMe = false) {
    try {
      const res = await API.post('/api/auth/login', { email, password });
      if (res.success && res.token) {
        this.setSession(res.token, res.user, rememberMe);
        Toast.show('Login successful! Welcome back.', 'success');
        return res.user;
      }
    } catch (err) {
      Toast.show(err.message, 'error');
      throw err;
    }
  },

  async register(data) {
    try {
      const res = await API.post('/api/auth/register', data);
      if (res.success && res.token) {
        this.setSession(res.token, res.user, true);
        Toast.show('Registration successful! Welcome to CINEBOOK.', 'success');
        return res.user;
      }
    } catch (err) {
      Toast.show(err.message, 'error');
      throw err;
    }
  },

  setSession(token, user, remember = true) {
    this.currentUser = user;
    localStorage.setItem('cinebook_jwt_token', token);
    localStorage.setItem('cinebook_user', JSON.stringify(user));
  },

  clearSession() {
    this.currentUser = null;
    localStorage.removeItem('cinebook_jwt_token');
    localStorage.removeItem('cinebook_user');
  },

  logout() {
    this.clearSession();
    Toast.show('Logged out successfully.', 'info');
    App.showAuthView('login');
  },

  isLoggedIn() {
    return !!this.currentUser && !!localStorage.getItem('cinebook_jwt_token');
  },

  isAdmin() {
    return this.isLoggedIn() && this.currentUser.role === 'Admin';
  }
};

window.Auth = Auth;
