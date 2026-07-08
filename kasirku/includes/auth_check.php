<?php
/**
 * Auth Check Middleware
 * Include di setiap halaman yang butuh login
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    header('Location: /kasirku/login.php');
    exit;
}

// Helper: cek apakah owner
function isOwner(): bool {
    return isset($_SESSION['role']) && $_SESSION['role'] === 'owner';
}

// Helper: cek role (owner only pages)
function requireOwner(): void {
    if (!isOwner()) {
        header('Location: /kasirku/pages/pos.php');
        exit;
    }
}
