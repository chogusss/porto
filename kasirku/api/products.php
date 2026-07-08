<?php
/**
 * API: Products CRUD
 * Endpoint: /kasir/api/products.php
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
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            if ($action === 'categories') {
                // Get all categories
                $cats = $pdo->query("SELECT * FROM categories ORDER BY name")->fetchAll();
                echo json_encode(['success' => true, 'data' => $cats]);
            } else {
                // Get products (with optional search & category filter)
                $search   = trim($_GET['search'] ?? '');
                $catId    = intval($_GET['category_id'] ?? 0);
                $page     = max(1, intval($_GET['page'] ?? 1));
                $perPage  = intval($_GET['per_page'] ?? 20);
                $offset   = ($page - 1) * $perPage;

                $where = ['1=1'];
                $params = [];

                if ($search !== '') {
                    $where[] = 'p.name LIKE ?';
                    $params[] = "%$search%";
                }
                if ($catId > 0) {
                    $where[] = 'p.category_id = ?';
                    $params[] = $catId;
                }

                $whereStr = implode(' AND ', $where);

                // Count
                $countStmt = $pdo->prepare("SELECT COUNT(*) FROM products p WHERE $whereStr");
                $countStmt->execute($params);
                $total = $countStmt->fetchColumn();

                // Data
                $params[] = $perPage;
                $params[] = $offset;
                $stmt = $pdo->prepare("
                    SELECT p.*, c.name AS category_name
                    FROM products p
                    LEFT JOIN categories c ON c.id = p.category_id
                    WHERE $whereStr
                    ORDER BY p.name
                    LIMIT ? OFFSET ?
                ");
                $stmt->execute($params);
                $products = $stmt->fetchAll();

                echo json_encode([
                    'success' => true,
                    'data'    => $products,
                    'total'   => $total,
                    'page'    => $page,
                    'per_page'=> $perPage,
                    'pages'   => ceil($total / $perPage),
                ]);
            }
            break;

        case 'POST':
            // Only owner can add/edit/delete
            if ($_SESSION['role'] !== 'owner') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Akses ditolak']);
                exit;
            }

            $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $action2 = $data['action'] ?? $action;

            if ($action2 === 'add') {
                $name     = trim($data['name'] ?? '');
                $catId    = intval($data['category_id'] ?? 0);
                $price    = floatval(str_replace(['.', ','], ['', '.'], $data['price'] ?? 0));
                $stock    = intval($data['stock'] ?? 0);
                $unit     = trim($data['unit'] ?? 'pcs');

                if (empty($name) || $price <= 0) {
                    echo json_encode(['success' => false, 'message' => 'Nama dan harga wajib diisi']);
                    exit;
                }

                $stmt = $pdo->prepare("INSERT INTO products (category_id, name, price, stock, unit) VALUES (?,?,?,?,?)");
                $stmt->execute([$catId ?: null, $name, $price, $stock, $unit]);
                echo json_encode(['success' => true, 'message' => 'Produk berhasil ditambahkan', 'id' => $pdo->lastInsertId()]);

            } elseif ($action2 === 'edit') {
                $id    = intval($data['id'] ?? 0);
                $name  = trim($data['name'] ?? '');
                $catId = intval($data['category_id'] ?? 0);
                $price = floatval(str_replace(['.', ','], ['', '.'], $data['price'] ?? 0));
                $stock = intval($data['stock'] ?? 0);
                $unit  = trim($data['unit'] ?? 'pcs');

                if (!$id || empty($name) || $price <= 0) {
                    echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
                    exit;
                }

                $stmt = $pdo->prepare("UPDATE products SET category_id=?, name=?, price=?, stock=?, unit=?, updated_at=NOW() WHERE id=?");
                $stmt->execute([$catId ?: null, $name, $price, $stock, $unit, $id]);
                echo json_encode(['success' => true, 'message' => 'Produk berhasil diperbarui']);

            } elseif ($action2 === 'delete') {
                $id = intval($data['id'] ?? 0);
                if (!$id) {
                    echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
                    exit;
                }
                $pdo->prepare("DELETE FROM products WHERE id = ?")->execute([$id]);
                echo json_encode(['success' => true, 'message' => 'Produk berhasil dihapus']);

            } else {
                echo json_encode(['success' => false, 'message' => 'Action tidak dikenal']);
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
