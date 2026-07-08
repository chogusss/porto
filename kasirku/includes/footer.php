<?php
/**
 * Footer Component
 * Include di akhir setiap halaman
 */
?>
    </div><!-- /.page-content -->
  </div><!-- /.main-content -->
</div><!-- /.app-wrapper -->

<!-- Toast Container -->
<div class="toast-container" id="toastContainer"></div>

<!-- Global Scripts -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script>
// ===== Clock =====
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}
updateClock();
setInterval(updateClock, 1000);

// ===== Sidebar Toggle =====
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainContent');
  sidebar.classList.toggle('collapsed');
  if (sidebar.classList.contains('collapsed')) {
    main.style.marginLeft = '0px';
  } else {
    main.style.marginLeft = '';
  }
}

// ===== Toast =====
function showToast(message, type = 'success', duration = 3000) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span> ${message}`;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ===== Format Rupiah (JS) =====
function formatRupiah(amount) {
  return 'Rp ' + parseInt(amount || 0).toLocaleString('id-ID');
}

// ===== Number input: format with dots =====
function formatNumberInput(input) {
  let value = input.value.replace(/\D/g, '');
  input.dataset.rawValue = value;
  input.value = value ? parseInt(value).toLocaleString('id-ID') : '';
}

// ===== Confirm delete =====
function confirmDelete(message, callback) {
  if (confirm(message || 'Yakin ingin menghapus data ini?')) callback();
}

// ===== Modal helpers =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}
// Close modal on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});
// Close modal on ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
});
</script>
<?= $extraScripts ?? '' ?>
</body>
</html>
