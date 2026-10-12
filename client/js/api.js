/* API Service Wrapper with JWT Authorization */

const API = {
  baseUrl: window.location.origin,

  getToken() {
    return localStorage.getItem('cinebook_jwt_token');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const currentUser = (window.Auth && window.Auth.currentUser) ? window.Auth.currentUser : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (currentUser && currentUser.email) {
      headers['x-user-email'] = currentUser.email;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        // Auto-heal on 401/403 by silent token re-issuance if user is logged in
        if ((response.status === 401 || response.status === 403) && !options._isRetry && currentUser && currentUser.email && !endpoint.includes('/login')) {
          try {
            const refreshRes = await fetch(`${this.baseUrl}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: currentUser.email })
            });
            const refreshData = await refreshRes.json();
            if (refreshData.success && refreshData.token) {
              localStorage.setItem('cinebook_jwt_token', refreshData.token);
              return this.request(endpoint, { ...options, _isRetry: true });
            }
          } catch (refreshErr) {
            console.warn('Silent token renewal failed:', refreshErr);
          }
        }
        throw new Error(data.message || 'An error occurred during network request.');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};

window.API = API;
