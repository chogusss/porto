<?php
/**
 * Logout Handler
 */
if (session_status() === PHP_SESSION_NONE) session_start();
$_SESSION = [];
session_destroy();
header('Location: /kasirku/login.php');
exit;
