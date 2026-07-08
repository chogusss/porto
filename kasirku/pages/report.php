<?php
/**
 * Revenue Reports - Owner Only
 */
require_once __DIR__ . '/../includes/auth_check.php';
requireOwner();

$pageTitle    = 'Laporan Pendapatan — KasirKu';
$pageSubtitle = 'Ringkasan Omset per Bulan & Tahun';

require_once __DIR__ . '/../includes/header.php';
?>

<!-- Toolbar -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
  <div style="display:flex;gap:10px;align-items:center">
    <label style="color:var(--text-muted);font-size:13px">Tahun:</label>
    <select id="reportYear" class="form-control" style="width:120px" onchange="loadReport()">
    </select>
  </div>
  <button class="btn btn-secondary" onclick="window.print()">🖨️ Cetak Laporan</button>
</div>

<!-- Annual Total -->
<div class="report-total-card" id="annualCard">
  <div class="report-total-label">Total Pendapatan Tahunan</div>
  <div class="report-total-value" id="annualRevenue">—</div>
  <div class="report-total-year" id="annualLabel">Memuat...</div>
</div>

<!-- Chart -->
<div class="card mb-3">
  <div class="card-header">
    <div class="card-title">📊 Grafik Pendapatan Bulanan</div>
  </div>
  <div class="card-body">
    <div class="chart-container">
      <canvas id="monthlyChart"></canvas>
    </div>
  </div>
</div>

<!-- Monthly Table -->
<div class="card">
  <div class="card-header">
    <div class="card-title">📋 Rincian Per Bulan</div>
  </div>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>Bulan</th>
          <th class="text-right">Jumlah Transaksi</th>
          <th class="text-right">Total Pendapatan</th>
          <th class="text-right">Rata-rata/Transaksi</th>
          <th>Grafik Bar</th>
        </tr>
      </thead>
      <tbody id="monthlyTableBody">
        <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">Memuat data...</td></tr>
      </tbody>
      <tfoot id="monthlyTableFoot"></tfoot>
    </table>
  </div>
</div>

<script src="/kasirku/assets/js/report.js"></script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
