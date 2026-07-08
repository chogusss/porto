<?php
/**
 * Login Page - KasirKu UMKM
 */
if (session_status() === PHP_SESSION_NONE) session_start();

// Already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: /kasirku/index.php');
    exit;
}

require_once __DIR__ . '/config/db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        $error = 'Username dan password wajib diisi.';
    } else {
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name']    = $user['name'];
            $_SESSION['username']= $user['username'];
            $_SESSION['role']    = $user['role'];
            session_regenerate_id(true);

            if ($user['role'] === 'owner') {
                header('Location: /kasirku/pages/dashboard.php');
            } else {
                header('Location: /kasirku/pages/pos.php');
            }
            exit;
        } else {
            $error = 'Username atau password salah.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="KasirKu - Login Aplikasi Kasir UMKM">
  <title>Login — KasirKu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0F172A;
      --card: #1E293B;
      --primary: #06B6D4;
      --primary-dark: #0891B2;
      --secondary: #8B5CF6;
      --text: #F1F5F9;
      --muted: #94A3B8;
      --border: rgba(148,163,184,0.12);
      --danger: #EF4444;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    /* Animated background blobs */
    body::before, body::after {
      content: '';
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
      pointer-events: none;
      animation: float 8s ease-in-out infinite alternate;
    }
    body::before {
      width: 500px; height: 500px;
      background: var(--primary);
      top: -150px; left: -150px;
    }
    body::after {
      width: 400px; height: 400px;
      background: var(--secondary);
      bottom: -100px; right: -100px;
      animation-delay: -4s;
    }

    @keyframes float {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(30px, 30px) scale(1.1); }
    }

    .login-container {
      width: 100%;
      max-width: 420px;
      position: relative;
      z-index: 1;
      animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .app-logo {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 30px;
      margin: 0 auto 16px;
      box-shadow: 0 8px 32px rgba(6, 182, 212, 0.3);
    }

    .app-name {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 4px;
    }

    .app-tagline {
      font-size: 13px;
      color: var(--muted);
    }

    .login-card {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }

    .card-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    .card-sub {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 24px;
    }

    .form-group { margin-bottom: 18px; }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 8px;
    }

    .input-wrapper { position: relative; }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      opacity: 0.5;
    }

    .form-control {
      width: 100%;
      padding: 12px 14px 12px 42px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text);
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: all 0.3s;
    }

    .form-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.12);
    }

    .form-control::placeholder { color: rgba(148,163,184,0.5); }

    .error-msg {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: var(--danger);
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-login {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(6, 182, 212, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-login:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(6, 182, 212, 0.5);
    }

    .btn-login:active { transform: translateY(0); }

    .demo-info {
      margin-top: 20px;
      padding: 14px;
      background: rgba(6, 182, 212, 0.05);
      border: 1px solid rgba(6, 182, 212, 0.15);
      border-radius: 10px;
    }

    .demo-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary);
      margin-bottom: 8px;
    }

    .demo-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 4px;
    }

    .demo-row code {
      font-family: 'Courier New', monospace;
      color: var(--text);
      font-size: 12px;
    }

    .login-footer {
      text-align: center;
      margin-top: 20px;
      font-size: 12px;
      color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="login-container">
    <!-- Header -->
    <div class="login-header">
      <div class="app-logo">🧾</div>
      <div class="app-name">KasirKu</div>
      <div class="app-tagline">Aplikasi Kasir & Manajemen Toko untuk UMKM</div>
    </div>

    <!-- Card -->
    <div class="login-card">
      <h1 class="card-title">Selamat Datang 👋</h1>
      <p class="card-sub">Masuk untuk melanjutkan ke aplikasi</p>

      <?php if ($error): ?>
      <div class="error-msg">❌ <?= htmlspecialchars($error) ?></div>
      <?php endif; ?>

      <form method="POST" autocomplete="on">
        <div class="form-group">
          <label class="form-label" for="username">Username</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              id="username"
              name="username"
              type="text"
              class="form-control"
              placeholder="Masukkan username"
              value="<?= htmlspecialchars($_POST['username'] ?? '') ?>"
              required
              autofocus
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              id="password"
              name="password"
              type="password"
              class="form-control"
              placeholder="Masukkan password"
              required
            >
          </div>
        </div>

        <button type="submit" class="btn-login" id="loginBtn">
          🚀 Masuk Sekarang
        </button>
      </form>

      <!-- Demo Credentials -->
      <div class="demo-info">
        <div class="demo-title">🔑 Akun Demo</div>
        <div class="demo-row">
          <span>👑 Owner:</span>
          <code>admin / admin123</code>
        </div>
        <div class="demo-row">
          <span>👷 Staff:</span>
          <code>staff / staff123</code>
        </div>
      </div>
    </div>

    <div class="login-footer">
      © <?= date('Y') ?> <?= APP_NAME ?> — <?= STORE_NAME ?>
    </div>
  </div>

  <script>
    document.querySelector('form').addEventListener('submit', function() {
      const btn = document.getElementById('loginBtn');
      btn.innerHTML = '⏳ Memproses...';
      btn.disabled = true;
    });
  </script>
</body>
</html>
