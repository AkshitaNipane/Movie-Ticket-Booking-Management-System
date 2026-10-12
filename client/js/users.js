/* User Management View Controller (Admin Only) */

const Users = {
  usersList: [],

  async render() {
    if (!Auth.isAdmin()) {
      Toast.show('Access denied. User management is restricted to Admins.', 'error');
      App.showView('dashboard');
      return;
    }
    await this.fetchUsers();
  },

  async fetchUsers() {
    try {
      const res = await API.get('/api/users');
      this.usersList = res.data || [];
      this.renderTable(this.usersList);
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  renderTable(users) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;

    const search = document.getElementById('user-search-input')?.value.toLowerCase() || '';
    const filtered = users.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.phone.includes(search)
    );

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">No users found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const isSelf = u.id === Auth.currentUser.id;
      const roleBadge = u.role === 'Admin'
        ? `<span class="role-badge admin"><i class="ri-shield-user-fill"></i> Admin</span>`
        : `<span class="role-badge"><i class="ri-user-3-line"></i> Customer</span>`;

      const formattedDate = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';

      return `
        <tr>
          <td><strong>#${u.id}</strong></td>
          <td>
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div class="avatar" style="width:32px; height:32px; font-size:0.9rem;">${u.name.charAt(0)}</div>
              <strong>${u.name}</strong> ${isSelf ? '<span style="font-size:0.75rem; color:var(--accent-primary);">(You)</span>' : ''}
            </div>
          </td>
          <td>${u.email}</td>
          <td>${u.phone}</td>
          <td>${roleBadge}</td>
          <td>${formattedDate}</td>
          <td>
            <div style="display:flex; gap:0.35rem;">
              <button class="btn btn-secondary btn-sm" onclick="Users.openEditModal('${u.id}')" title="Edit User">
                <i class="ri-edit-line"></i>
              </button>
              ${!isSelf ? `
                <button class="btn btn-danger btn-sm" onclick="Users.confirmDelete('${u.id}', '${u.name.replace(/'/g, "\\'")}')" title="Delete User">
                  <i class="ri-delete-bin-line"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  openAddModal() {
    document.getElementById('user-modal-title').innerText = 'Add New User';
    document.getElementById('user-form').reset();
    document.getElementById('user-id-input').value = '';
    document.getElementById('user-password-group').style.display = 'block';
    document.getElementById('user-password-input').required = true;
    document.getElementById('user-modal').classList.add('active');
  },

  openEditModal(userId) {
    const user = this.usersList.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('user-modal-title').innerText = 'Edit User Details';
    document.getElementById('user-id-input').value = user.id;
    document.getElementById('user-name-input').value = user.name;
    document.getElementById('user-email-input').value = user.email;
    document.getElementById('user-phone-input').value = user.phone;
    document.getElementById('user-role-select').value = user.role;
    
    // Hide mandatory password requirement on edit
    document.getElementById('user-password-group').style.display = 'none';
    document.getElementById('user-password-input').required = false;

    document.getElementById('user-modal').classList.add('active');
  },

  closeModal() {
    document.getElementById('user-modal').classList.remove('active');
  },

  async handleFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('user-id-input').value;

    const payload = {
      name: document.getElementById('user-name-input').value,
      email: document.getElementById('user-email-input').value,
      phone: document.getElementById('user-phone-input').value,
      role: document.getElementById('user-role-select').value
    };

    const passwordVal = document.getElementById('user-password-input').value;
    if (passwordVal) {
      payload.password = passwordVal;
      payload.newPassword = passwordVal;
    }

    try {
      if (id) {
        await API.put(`/api/users/${id}`, payload);
        Toast.show('User updated successfully!', 'success');
      } else {
        await API.post('/api/users', payload);
        Toast.show('User created successfully!', 'success');
      }
      this.closeModal();
      this.fetchUsers();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  confirmDelete(userId, userName) {
    ConfirmModal.open({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user "${userName}"?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await API.delete(`/api/users/${userId}`);
          Toast.show('User deleted successfully.', 'success');
          this.fetchUsers();
        } catch (err) {
          Toast.show(err.message, 'error');
        }
      }
    });
  }
};

window.Users = Users;
