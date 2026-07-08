<?php
/**
 * API: Transactions
 * Endpoint: /kasir/api/transactions.php
 */
if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? 'list';

            if ($action === 'detail') {
                // Get single transaction detail
                $id = intval($_GET['id'] ?? 0);
                if (!$id) {
                    echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
                    exit;
                }

                $stmt = $pdo->prepare("
                    SELECT t.*, u.name AS cashier_name
                    FROM transactions t
                    LEFT JOIN users u ON u.id = t.user_id
                    WHERE t.id = ?
                ");
                $stmt->execute([$id]);
                $transaction = $stmt->fetch();

                if (!$transaction) {
                    echo json_encode(['success' => false, 'message' => 'Transaksi tidak ditemukan']);
                    exit;
                }

                $itemsStmt = $pdo->prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
                $itemsStmt->execute([$id]);
                $items = $itemsStmt->fetchAll();

                echo json_encode(['success' => true, 'transaction' => $transaction, 'items' => $items]);

            } elseif ($action === 'today_stats') {
                // Today's summary
                $today = date('Y-m-d');
                $stmt = $pdo->prepare("
                    SELECT
                        COUNT(*) AS total_transactions,
                        COALESCE(SUM(total_amount), 0) AS total_revenue
                    FROM transactions
                    WHERE DATE(created_at) = ?
                ");
                $stmt->execute([$today]);
                $stats = $stmt->fetch();

                // Last 7 days chart
                $chartStmt = $pdo->prepare("
                    SELECT
                        DATE(created_at) AS date,
                        COUNT(*) AS transactions,
                        COALESCE(SUM(total_amount), 0) AS revenue
                    FROM transactions
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    GROUP BY DATE(created_at)
                    ORDER BY date ASC
                ");
                $chartStmt->execute();
                $chartData = $chartStmt->fetchAll();

                echo json_encode([
                    'success'   => true,
                    'stats'     => $stats,
                    'chart'     => $chartData,
                ]);

            } else {
                // List transactions with filters
                $search   = trim($_GET['search'] ?? '');
                $dateFrom = $_GET['date_from'] ?? '';
                $dateTo   = $_GET['date_to']   ?? '';
                $page     = max(1, intval($_GET['page'] ?? 1));
                $perPage  = intval($_GET['per_page'] ?? 15);
                $offset   = ($page - 1) * $perPage;

                $where  = ['1=1'];
                $params = [];

                if ($search !== '') {
                    $where[] = '(t.invoice_no LIKE ? OR u.name LIKE ?)';
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                if ($dateFrom !== '') {
                    $where[] = 'DATE(t.created_at) >= ?';
                    $params[] = $dateFrom;
                }
                if ($dateTo !== '') {
                    $where[] = 'DATE(t.created_at) <= ?';
                    $params[] = $dateTo;
                }

                $whereStr = implode(' AND ', $where);

                $countStmt = $pdo->prepare("
                    SELECT COUNT(*) FROM transactions t
                    LEFT JOIN users u ON u.id = t.user_id
                    WHERE $whereStr
                ");
                $countStmt->execute($params);
                $total = $countStmt->fetchColumn();

                $params[] = $perPage;
                $params[] = $offset;
                $stmt = $pdo->prepare("
                    SELECT t.*, u.name AS cashier_name
                    FROM transactions t
                    LEFT JOIN users u ON u.id = t.user_id
                    WHERE $whereStr
                    ORDER BY t.created_at DESC
                    LIMIT ? OFFSET ?
                ");
                $stmt->execute($params);
                $transactions = $stmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'data'    => $transactions,
                    'total'   => $total,
                    'page'    => $page,
                    'per_page'=> $perPage,
                    'pages'   => ceil($total / $perPage),
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (empty($data['items']) || !is_array($data['items'])) {
                echo json_encode(['success' => false, 'message' => 'Tidak ada item dalam transaksi']);
                exit;
            }

            $items       = $data['items'];
            $payment     = floatval($data['payment_amount'] ?? 0);
            $notes       = trim($data['notes'] ?? '');

            // Calculate total
            $total = 0;
            foreach ($items as $item) {
                $total += floatval($item['price']) * intval($item['quantity']);
            }

            if ($payment < $total) {
                echo json_encode(['success' => false, 'message' => 'Nominal bayar kurang dari total']);
                exit;
            }

            $change = $payment - $total;

            // Generate unique invoice
            $invoice = 'INV-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            // Ensure uniqueness
            while ($pdo->prepare("SELECT id FROM transactions WHERE invoice_no = ?")->execute([$invoice]) &&
                   $pdo->prepare("SELECT id FROM transactions WHERE invoice_no = ?")->execute([$invoice])) {
                // recheck
                $check = $pdo->prepare("SELECT id FROM transactions WHERE invoice_no = ?");
                $check->execute([$invoice]);
                if (!$check->fetch()) break;
                $invoice = 'INV-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            }

            $pdo->beginTransaction();

            try {
                // Insert transaction
                $trStmt = $pdo->prepare("
                    INSERT INTO transactions (invoice_no, user_id, total_amount, payment_amount, change_amount, notes)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $trStmt->execute([$invoice, $_SESSION['user_id'], $total, $payment, $change, $notes]);
                $transactionId = $pdo->lastInsertId();

                // Insert items & reduce stock
                $itemStmt = $pdo->prepare("
                    INSERT INTO transaction_items (transaction_id, product_id, product_name, price, quantity, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stockStmt = $pdo->prepare("
                    UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?
                ");

                foreach ($items as $item) {
                    $productId = intval($item['id']);
                    $qty       = intval($item['quantity']);
                    $price     = floatval($item['price']);
                    $name      = trim($item['name']);
                    $subtotal  = $price * $qty;

                    $itemStmt->execute([$transactionId, $productId, $name, $price, $qty, $subtotal]);

                    $stockStmt->execute([$qty, $productId, $qty]);
                    if ($stockStmt->rowCount() === 0) {
                        $pdo->rollBack();
                        echo json_encode(['success' => false, 'message' => "Stok $name tidak mencukupi"]);
                        exit;
                    }
                }

                $pdo->commit();

                echo json_encode([
                    'success'       => true,
                    'message'       => 'Transaksi berhasil!',
                    'transaction_id'=> $transactionId,
                    'invoice_no'    => $invoice,
                    'total'         => $total,
                    'payment'       => $payment,
                    'change'        => $change,
                ]);

            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
