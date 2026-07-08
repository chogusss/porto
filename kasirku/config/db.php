<?php
/**
 * Database Configuration
 * Kasir UMKM - Koneksi PDO ke MySQL
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'kasir_umkm');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

define('APP_NAME', 'KasirKu');
define('STORE_NAME', 'Toko Serba Ada');
define('STORE_ADDRESS', 'Jl. Raya No. 1, Jakarta');
define('STORE_PHONE', '0812-3456-7890');

$dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'Koneksi database gagal: ' . $e->getMessage()
    ]));
}

/**
 * Helper: format rupiah
 */
function formatRupiah(float $amount): string {
    return 'Rp ' . number_format($amount, 0, ',', '.');
}

/**
 * Helper: generate invoice number
 */
function generateInvoice(): string {
    return 'INV-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
}
