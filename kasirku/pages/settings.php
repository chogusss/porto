<?php
/**
 * Settings / Change Password
 */
require_once __DIR__ . '/../includes/auth_check.php';

$pageTitle    = 'Pengaturan — KasirKu';
$pageSubtitle = 'Kelola Akun Anda';

require_once __DIR__ . '/../includes/header.php';
?>

<div style="max-width:520px">

  <!-- Profile Card -->
  <div class="card mb-3">
    <div class="card-header">
      <div class="card-title">👤 Profil Akun</div>
    </div>
    <div class="card-body">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700">
          <?= strtoupper(substr($_SESSION['name'], 0, 1)) ?>
        </div>
        <div>
          <div style="font-size:18px;font-weight:700"><?= htmlspecialchars($_SESSION['name']) ?></div>
          <div style="font-size:13px;color:var(--text-muted)">@<?= htmlspecialchars($_SESSION['username']) ?></div>
          <span class="badge <?= $_SESSION['role'] === 'owner' ? 'badge-primary' : 'badge-info' ?>" style="margin-top:6px">
            <?= $_SESSION['role'] === 'owner' ? '👑 Owner' : '👷 Staff' ?>
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Change Password -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">🔒 Ganti Password</div>
    </div>
    <div class="card-body">
      <div class="form-group">
        <label class="form-label">Password Lama *</label>
        <div style="position:relative">
          <input type="password" id="oldPassword" class="form-control" placeholder="Masukkan password lama">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Password Baru *</label>
        <input type="password" id="newPassword" class="form-control" placeholder="Minimal 6 karakter">
      </div>

      <div class="form-group">
        <label class="form-label">Konfirmasi Password Baru *</label>
        <input type="password" id="confirmPassword" class="form-control" placeholder="Ulangi password baru">
      </div>

      <div id="pwdFeedback" style="margin-bottom:12px;display:none"></div>

      <button class="btn btn-primary btn-block" id="changePwdBtn" onclick="changePassword()">
        🔒 Simpan Password Baru
      </button>
    </div>
  </div>

  <!-- App Info -->
  <div class="card mt-3">
    <div class="card-header">
      <div class="card-title">ℹ️ Informasi Aplikasi</div>
    </div>
    <div class="card-body" style="font-size:13px;color:var(--text-secondary)">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Nama Aplikasi</span><span style="font-weight:600">KasirKu</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Nama Toko</span><span style="font-weight:600">Toko Serba Ada</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Versi</span><span style="font-weight:600">1.0.0</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>Stack</span><span style="font-weight:600">PHP + MySQL (XAMPP)</span>
      </div>
    </div>
  </div>
</div>

<script>
async function changePassword() {
  const oldPwd  = document.getElementById('oldPassword').value;
  const newPwd  = document.getElementById('newPassword').value;
  const confPwd = document.getElementById('confirmPassword').value;
  const feedback = document.getElementById('pwdFeedback');
  const btn = document.getElementById('changePwdBtn');

  // Client validation
  if (!oldPwd || !newPwd || !confPwd) {
    showFeedback('Semua field wajib diisi', 'error');
    return;
  }
  if (newPwd.length < 6) {
    showFeedback('Password baru minimal 6 karakter', 'error');
    return;
  }
  if (newPwd !== confPwd) {
    showFeedback('Konfirmasi password tidak cocok', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Memproses...';

  try {
    const res = await fetch('/kasirku/api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'change_password',
        old_password: oldPwd,
        new_password: newPwd,
        confirm_password: confPwd,
      })
    });
    const json = await res.json();

    if (json.success) {
      showFeedback(json.message, 'success');
      document.getElementById('oldPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      showToast('Password berhasil diperbarui!', 'success');
    } else {
      showFeedback(json.message, 'error');
    }
  } catch (e) {
    showFeedback('Terjadi kesalahan koneksi', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '🔒 Simpan Password Baru';
}

function showFeedback(msg, type) {
  const el = document.getElementById('pwdFeedback');
  el.style.display = 'block';
  const colors = {
    success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#10B981' },
    error:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)',  text: '#EF4444' },
  };
  const c = colors[type];
  el.style.cssText = `display:block;background:${c.bg};border:1px solid ${c.border};border-radius:8px;padding:10px 14px;font-size:13px;color:${c.text}`;
  el.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
}
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
