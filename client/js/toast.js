/* Toast Notification & Modal Utilities */

const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconClass = 'ri-information-line';
    if (type === 'success') iconClass = 'ri-checkbox-circle-line';
    if (type === 'error') iconClass = 'ri-error-warning-line';
    if (type === 'warning') iconClass = 'ri-alert-line';

    toast.innerHTML = `
      <i class="${iconClass} toast-icon"></i>
      <div style="flex:1; font-size:0.9rem;">${message}</div>
      <i class="ri-close-line" style="cursor:pointer; opacity:0.6;" onclick="this.parentElement.remove()"></i>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
};

const ConfirmModal = {
  open({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm }) {
    const modalOverlay = document.getElementById('confirm-modal');
    if (!modalOverlay) return;

    document.getElementById('confirm-modal-title').innerText = title;
    document.getElementById('confirm-modal-message').innerText = message;
    
    const confirmBtn = document.getElementById('confirm-modal-btn');
    confirmBtn.innerText = confirmText;

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
      this.close();
      if (typeof onConfirm === 'function') onConfirm();
    });

    modalOverlay.classList.add('active');
  },

  close() {
    const modalOverlay = document.getElementById('confirm-modal');
    if (modalOverlay) modalOverlay.classList.remove('active');
  }
};

window.Toast = Toast;
window.ConfirmModal = ConfirmModal;
