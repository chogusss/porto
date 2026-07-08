<?php
/**
 * POS - Point of Sale
 */
require_once __DIR__ . '/../includes/auth_check.php';

$pageTitle    = 'Point of Sale — KasirKu';
$pageSubtitle = 'Kasir & Transaksi';

require_once __DIR__ . '/../includes/header.php';
?>

<style>
  .pos-layout {
    display: grid;
    grid-template-columns: 1fr 390px;
    gap: 20px;
    height: calc(100vh - 64px - 48px);
  }
  @media(max-width:1100px) { .pos-layout { grid-template-columns:1fr; height:auto; } }
</style>

<div class="pos-layout">
  <!-- LEFT: Products -->
  <div class="pos-products">
    <!-- Toolbar -->
    <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      <div class="search-wrapper" style="flex:1;min-width:200px">
        <span class="search-icon">🔍</span>
        <input type="text" id="productSearch" class="form-control" placeholder="Cari produk..." oninput="filterProducts()">
      </div>
    </div>

    <!-- Category pills -->
    <div class="category-pills" id="categoryPills">
      <button class="category-pill active" data-id="0" onclick="selectCategory(this, 0)">Semua</button>
    </div>

    <!-- Products grid -->
    <div class="products-grid" id="productsGrid">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  </div>

  <!-- RIGHT: Cart -->
  <div class="pos-cart" id="cartPanel">
    <div class="cart-header">
      <span>🛒 Keranjang</span>
      <span id="cartCount" class="badge badge-primary" style="display:none">0 item</span>
    </div>

    <div class="cart-items" id="cartItems">
      <div class="cart-empty">
        <div class="empty-icon">🛒</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:4px">Keranjang Kosong</div>
        <div style="font-size:12px;color:var(--text-muted)">Klik produk untuk menambahkan</div>
      </div>
    </div>

    <div class="cart-footer">
      <!-- Summary -->
      <div class="cart-summary">
        <div class="summary-row">
          <span>Subtotal</span>
          <span id="cartSubtotal">Rp 0</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span class="amount" id="cartTotal">Rp 0</span>
        </div>
      </div>

      <!-- Payment -->
      <div class="payment-section">
        <label class="form-label">💵 Nominal Bayar</label>
        <div class="payment-input-wrapper">
          <span class="currency-prefix">Rp</span>
          <input type="text" id="paymentInput" class="form-control" placeholder="0"
                 oninput="onPaymentInput(this)" style="font-size:16px;font-weight:700">
        </div>

        <!-- Quick amount buttons -->
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap" id="quickPayBtns"></div>
      </div>

      <!-- Change -->
      <div class="change-display" id="changeDisplay" style="display:none">
        <span class="change-label">💚 Kembalian</span>
        <span class="change-amount" id="changeAmount">Rp 0</span>
      </div>

      <!-- Notes -->
      <div style="margin-top:10px">
        <input type="text" id="txnNotes" class="form-control" placeholder="Catatan (opsional)" style="font-size:12px">
      </div>

      <!-- Process Button -->
      <button id="processTxnBtn" class="btn btn-success btn-block btn-lg mt-2" onclick="processTransaction()" disabled>
        ✅ Proses Transaksi
      </button>

      <!-- Clear Cart -->
      <button class="btn btn-secondary btn-block mt-1" onclick="clearCart()" style="font-size:12px">
        🗑️ Bersihkan Keranjang
      </button>
    </div>
  </div>
</div>

<!-- ===== RECEIPT MODAL ===== -->
<div class="modal-overlay" id="receiptModal">
  <div class="modal modal-sm">
    <div class="modal-header">
      <div class="modal-title">🧾 Struk Transaksi</div>
      <button class="modal-close" onclick="closeModal('receiptModal')">✕</button>
    </div>
    <div class="modal-body">
      <div id="receiptContent"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('receiptModal')">Tutup</button>
      <button class="btn btn-primary" onclick="printReceipt()">🖨️ Cetak Struk</button>
    </div>
  </div>
</div>

<link rel="stylesheet" href="/kasirku/assets/css/print.css" media="print">
<script src="/kasirku/assets/js/app.js"></script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
