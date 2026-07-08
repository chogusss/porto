<?php
/**
 * Transaction History Page
 */
require_once __DIR__ . '/../includes/auth_check.php';

$pageTitle    = 'Riwayat Transaksi — KasirKu';
$pageSubtitle = 'Lacak Semua Transaksi';

require_once __DIR__ . '/../includes/header.php';
?>

<!-- Toolbar -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
  <div style="display:flex;gap:10px;flex:1;flex-wrap:wrap">
    <div class="search-wrapper" style="min-width:200px">
      <span class="search-icon">🔍</span>
      <input type="text" id="histSearch" class="form-control" placeholder="Cari no. invoice / kasir..." oninput="debounceLoad()">
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <input type="date" id="dateFrom" class="form-control" onchange="loadHistory()" style="width:150px">
      <span style="color:var(--text-muted);font-size:13px">s/d</span>
      <input type="date" id="dateTo" class="form-control" onchange="loadHistory()" style="width:150px">
    </div>
    <button class="btn btn-secondary btn-sm" onclick="resetFilter()">Reset</button>
  </div>
</div>

<!-- History Table -->
<div class="card">
  <div class="card-header">
    <div class="card-title">🧾 Semua Transaksi</div>
    <span class="badge badge-primary" id="histTotal">—</span>
  </div>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>No. Invoice</th>
          <th>Kasir</th>
          <th>Total Bayar</th>
          <th>Uang Diterima</th>
          <th>Kembalian</th>
          <th>Tanggal & Waktu</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="histTableBody">
        <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">Memuat data...</td></tr>
      </tbody>
    </table>
  </div>
  <div class="pagination" id="histPagination" style="padding:16px"></div>
</div>

<!-- ===== DETAIL MODAL ===== -->
<div class="modal-overlay" id="detailModal">
  <div class="modal modal-lg">
    <div class="modal-header">
      <div class="modal-title">🧾 Detail Transaksi</div>
      <button class="modal-close" onclick="closeModal('detailModal')">✕</button>
    </div>
    <div class="modal-body" id="detailContent">
      <div class="loading"><div class="spinner"></div></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('detailModal')">Tutup</button>
      <button class="btn btn-primary" onclick="reprintReceipt()">🖨️ Cetak Ulang Struk</button>
    </div>
  </div>
</div>

<!-- Print area -->
<div id="reprintReceiptArea" style="display:none"></div>
<link rel="stylesheet" href="/kasirku/assets/css/print.css" media="print">
<script src="/kasirku/assets/js/history.js"></script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
