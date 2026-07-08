<?php
/**
 * Entry Point - Redirect berdasarkan session
 */
if (session_status() === PHP_SESSION_NONE) session_start();

if (isset($_SESSION['user_id'])) {
    if ($_SESSION['role'] === 'owner') {
        header('Location: /kasirku/pages/dashboard.php');
    } else {
        header('Location: /kasirku/pages/pos.php');
    }
} else {
    header('Location: /kasirku/login.php');
}
exit;
