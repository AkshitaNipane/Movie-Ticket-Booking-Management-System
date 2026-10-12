/* User Profile & Password Management Controller */

const Profile = {
  render() {
    const user = Auth.currentUser;
    if (!user) return;

    document.getElementById('profile-name-input').value = user.name || '';
    document.getElementById('profile-email-input').value = user.email || '';
    document.getElementById('profile-phone-input').value = user.phone || '';
    document.getElementById('profile-role-display').innerText = user.role || 'Customer';
    document.getElementById('profile-avatar-initial').innerText = (user.name || 'U').charAt(0).toUpperCase();
  },

  async updateProfile(e) {
    e.preventDefault();
    const user = Auth.currentUser;
    if (!user) return;

    const payload = {
      name: document.getElementById('profile-name-input').value,
      email: document.getElementById('profile-email-input').value,
      phone: document.getElementById('profile-phone-input').value
    };

    try {
      const res = await API.put(`/api/users/${user.id}`, payload);
      Auth.currentUser = res.data;
      localStorage.setItem('cinebook_user', JSON.stringify(res.data));
      Toast.show('Profile updated successfully!', 'success');
      App.updateUserBadge();
      this.render();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  async changePassword(e) {
    e.preventDefault();
    const user = Auth.currentUser;
    if (!user) return;

    const currentPassword = document.getElementById('pass-current-input').value;
    const newPassword = document.getElementById('pass-new-input').value;
    const confirmNewPassword = document.getElementById('pass-confirm-input').value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Toast.show('Please fill in all password fields.', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      Toast.show('New password must be at least 8 characters long.', 'warning');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Toast.show('New passwords do not match.', 'warning');
      return;
    }

    try {
      await API.put(`/api/users/${user.id}`, { currentPassword, newPassword });
      Toast.show('Password changed successfully!', 'success');
      document.getElementById('change-password-form').reset();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }
};

window.Profile = Profile;
