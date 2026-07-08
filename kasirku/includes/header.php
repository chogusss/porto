<?php
/**
 * Header / Sidebar Component
 * Include di setiap halaman
 */
if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../config/db.php';

$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$currentDir  = basename(dirname($_SERVER['PHP_SELF']));

function navActive(string $page): string {
    global $currentPage;
    return $currentPage === $page ? 'active' : '';
}

$userName  = $_SESSION['name']  ?? 'User';
$userRole  = $_SESSION['role']  ?? 'staff';
$userInitial = strtoupper(substr($userName, 0, 1));
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="KasirKu - Aplikasi Kasir & Manajemen Toko untuk UMKM">
  <title><?= $pageTitle ?? APP_NAME ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/kasirku/assets/css/main.css">
  <?= $extraHead ?? '' ?>
</head>
<body>
<div class="app-wrapper">

  <!-- ===== SIDEBAR ===== -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">🧾</div>
      <div class="logo-text">
        <?= APP_NAME ?>
        <span><?= STORE_NAME ?></span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <?php if ($userRole === 'owner'): ?>
      <div class="nav-section">Utama</div>
      <a href="/kasirku/pages/dashboard.php" class="nav-item <?= navActive('dashboard') ?>">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Dashboard</span>
      </a>
      <?php endif; ?>

      <div class="nav-section">Kasir</div>
      <a href="/kasirku/pages/pos.php" class="nav-item <?= navActive('pos') ?>">
        <span class="nav-icon">🛒</span>
        <span class="nav-label">Point of Sale</span>
      </a>
      <a href="/kasirku/pages/history.php" class="nav-item <?= navActive('history') ?>">
        <span class="nav-icon">🧾</span>
        <span class="nav-label">Riwayat Transaksi</span>
      </a>

      <?php if ($userRole === 'owner'): ?>
      <div class="nav-section">Manajemen</div>
      <a href="/kasirku/pages/stock.php" class="nav-item <?= navActive('stock') ?>">
        <span class="nav-icon">📦</span>
        <span class="nav-label">Stok & Produk</span>
      </a>
      <a href="/kasirku/pages/report.php" class="nav-item <?= navActive('report') ?>">
        <span class="nav-icon">📈</span>
        <span class="nav-label">Laporan Pendapatan</span>
      </a>
      <?php endif; ?>

      <div class="nav-section">Akun</div>
      <a href="/kasirku/pages/settings.php" class="nav-item <?= navActive('settings') ?>">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Pengaturan</span>
      </a>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar"><?= $userInitial ?></div>
        <div class="user-details">
          <div class="user-name"><?= htmlspecialchars($userName) ?></div>
          <div class="user-role"><?= $userRole ?></div>
        </div>
      </div>
    </div>
  </aside>

  <!-- ===== MAIN CONTENT ===== -->
  <div class="main-content" id="mainContent">
    <!-- TOP BAR -->
    <header class="topbar">
      <div class="topbar-left">
        <button class="btn-menu" id="menuToggle" onclick="toggleSidebar()" style="background:none;border:none;color:var(--text-secondary);font-size:20px;cursor:pointer;padding:4px 8px;border-radius:6px;" title="Toggle Menu">☰</button>
        <div>
          <div class="page-title"><?= $pageTitle ?? APP_NAME ?></div>
          <div class="page-subtitle"><?= $pageSubtitle ?? date('l, d F Y') ?></div>
        </div>
      </div>
      <div class="topbar-right">
        <div class="topbar-time" id="clock"></div>
        <a href="/kasirku/logout.php" class="btn-logout" onclick="return confirm('Yakin ingin keluar?')">
          🚪 Keluar
        </a>
      </div>
    </header>

    <!-- PAGE CONTENT starts in individual files -->
    <div class="page-content page-enter">
