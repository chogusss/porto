<?php
/**
 * API: Reports
 * Endpoint: /kasir/api/reports.php
 */
if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'owner') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

try {
    $year   = intval($_GET['year'] ?? date('Y'));
    $action = $_GET['action'] ?? 'monthly';

    if ($action === 'years') {
        // Get available years
        $stmt = $pdo->query("SELECT DISTINCT YEAR(created_at) AS year FROM transactions ORDER BY year DESC");
        $years = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array(date('Y'), $years)) array_unshift($years, (int)date('Y'));
        echo json_encode(['success' => true, 'data' => $years]);
        exit;
    }

    if ($action === 'dashboard') {
        // Dashboard stats
        $today = date('Y-m-d');

        // Today revenue
        $todayStmt = $pdo->prepare("
            SELECT COUNT(*) AS txn_count, COALESCE(SUM(total_amount), 0) AS revenue
            FROM transactions WHERE DATE(created_at) = ?
        ");
        $todayStmt->execute([$today]);
        $todayStats = $todayStmt->fetch();

        // Total products
        $prodCount = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();

        // Low stock products (stock <= 5)
        $lowStock = $pdo->query("SELECT COUNT(*) FROM products WHERE stock <= 5")->fetchColumn();

        // Last 7 days chart
        $chartStmt = $pdo->query("
            SELECT
                DATE(created_at) AS date,
                COUNT(*) AS transactions,
                COALESCE(SUM(total_amount), 0) AS revenue
            FROM transactions
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        ");
        $chartData = $chartStmt->fetchAll();

        // Recent transactions (5)
        $recentStmt = $pdo->query("
            SELECT t.invoice_no, t.total_amount, t.created_at, u.name AS cashier_name
            FROM transactions t
            LEFT JOIN users u ON u.id = t.user_id
            ORDER BY t.created_at DESC LIMIT 5
        ");
        $recent = $recentStmt->fetchAll();

        // Low stock products list
        $lowStockList = $pdo->query("
            SELECT name, stock, unit FROM products WHERE stock <= 10 ORDER BY stock ASC LIMIT 5
        ")->fetchAll();

        echo json_encode([
            'success'       => true,
            'today'         => $todayStats,
            'products'      => $prodCount,
            'low_stock'     => $lowStock,
            'chart'         => $chartData,
            'recent'        => $recent,
            'low_stock_list'=> $lowStockList,
        ]);
        exit;
    }

    // Monthly report
    $stmt = $pdo->prepare("
        SELECT
            MONTH(created_at)  AS month,
            MONTHNAME(created_at) AS month_name,
            COUNT(*)           AS total_transactions,
            COALESCE(SUM(total_amount), 0) AS total_revenue,
            COALESCE(AVG(total_amount), 0) AS avg_per_transaction
        FROM transactions
        WHERE YEAR(created_at) = ?
        GROUP BY MONTH(created_at), MONTHNAME(created_at)
        ORDER BY month ASC
    ");
    $stmt->execute([$year]);
    $monthly = $stmt->fetchAll();

    // Fill missing months with zeros
    $monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                   'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    $fullData = [];
    $monthlyByNum = [];
    foreach ($monthly as $m) $monthlyByNum[$m['month']] = $m;

    for ($i = 1; $i <= 12; $i++) {
        if (isset($monthlyByNum[$i])) {
            $fullData[] = $monthlyByNum[$i];
        } else {
            $fullData[] = [
                'month'              => $i,
                'month_name'         => $monthNames[$i],
                'total_transactions' => 0,
                'total_revenue'      => 0,
                'avg_per_transaction'=> 0,
            ];
        }
    }

    // Annual total
    $totalStmt = $pdo->prepare("
        SELECT
            COUNT(*) AS total_transactions,
            COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM transactions WHERE YEAR(created_at) = ?
    ");
    $totalStmt->execute([$year]);
    $annual = $totalStmt->fetch();

    echo json_encode([
        'success'  => true,
        'year'     => $year,
        'data'     => $fullData,
        'annual'   => $annual,
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
