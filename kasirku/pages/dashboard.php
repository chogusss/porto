<?php
/**
 * Dashboard - Owner Only
 */
require_once __DIR__ . '/../includes/auth_check.php';
requireOwner();

$pageTitle    = 'Dashboard — KasirKu';
$pageSubtitle = 'Ringkasan Bisnis Anda';

require_once __DIR__ . '/../includes/header.php';
?>

<!-- Stats Grid -->
<div class="stats-grid" id="statsGrid">
  <div class="stat-card cyan">
    <div class="stat-icon">💰</div>
    <div class="stat-value" id="todayRevenue">—</div>
    <div class="stat-label">Pendapatan Hari Ini</div>
  </div>
  <div class="stat-card violet">
    <div class="stat-icon">🧾</div>
    <div class="stat-value" id="todayTxn">—</div>
    <div class="stat-label">Transaksi Hari Ini</div>
  </div>
  <div class="stat-card green">
    <div class="stat-icon">📦</div>
    <div class="stat-value" id="totalProducts">—</div>
    <div class="stat-label">Total Produk</div>
  </div>
  <div class="stat-card amber">
    <div class="stat-icon">⚠️</div>
    <div class="stat-value" id="lowStockCount">—</div>
    <div class="stat-label">Stok Hampir Habis</div>
  </div>
</div>

<!-- Main Dashboard Grid -->
<div class="dashboard-grid">
  <!-- Chart -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">📊 Pendapatan 7 Hari Terakhir</div>
    </div>
    <div class="card-body">
      <div class="chart-container">
        <canvas id="revenueChart"></canvas>
      </div>
    </div>
  </div>

  <!-- Low Stock -->
  <div class="card">
    <div class="card-header">
      <div class="card-title">⚠️ Stok Menipis</div>
      <a href="/kasirku/pages/stock.php" class="btn btn-sm btn-secondary">Kelola</a>
    </div>
    <div class="card-body" style="padding:0">
      <div id="lowStockList">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  </div>
</div>

<!-- Recent Transactions -->
<div class="card mt-3">
  <div class="card-header">
    <div class="card-title">🧾 Transaksi Terbaru</div>
    <a href="/kasirku/pages/history.php" class="btn btn-sm btn-secondary">Lihat Semua</a>
  </div>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>No. Invoice</th>
          <th>Kasir</th>
          <th>Total</th>
          <th>Waktu</th>
        </tr>
      </thead>
      <tbody id="recentTxnTable">
        <tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-muted)">Memuat data...</td></tr>
      </tbody>
    </table>
  </div>
</div>

<script>
let revenueChart = null;

async function loadDashboard() {
  try {
    const res = await fetch('/kasirku/api/reports.php?action=dashboard');
    const json = await res.json();
    if (!json.success) return;

    // Stats
    document.getElementById('todayRevenue').textContent = formatRupiah(json.today.revenue);
    document.getElementById('todayTxn').textContent = json.today.txn_count;
    document.getElementById('totalProducts').textContent = json.products;
    document.getElementById('lowStockCount').textContent = json.low_stock;

    // Chart
    const labels = [], revenues = [];
    const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

    // Fill last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()] + ' ' + d.getDate();
      const found = json.chart.find(c => c.date === dateStr);
      labels.push(dayLabel);
      revenues.push(found ? parseFloat(found.revenue) : 0);
    }

    if (revenueChart) revenueChart.destroy();
    const ctx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Pendapatan',
          data: revenues,
          backgroundColor: 'rgba(6, 182, 212, 0.3)',
          borderColor: '#06B6D4',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => formatRupiah(ctx.raw)
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94A3B8' } },
          y: {
            grid: { color: 'rgba(148,163,184,0.08)' },
            ticks: {
              color: '#94A3B8',
              callback: val => 'Rp ' + (val/1000).toLocaleString('id-ID') + 'k'
            }
          }
        }
      }
    });

    // Low stock list
    const lowEl = document.getElementById('lowStockList');
    if (json.low_stock_list.length === 0) {
      lowEl.innerHTML = '<div class="no-data"><div class="no-data-icon">✅</div><div class="no-data-text">Stok aman!</div></div>';
    } else {
      lowEl.innerHTML = json.low_stock_list.map(p => {
        const colorClass = p.stock <= 5 ? 'badge-danger' : 'badge-warning';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border)">
          <span style="font-size:13px;font-weight:500">${p.name}</span>
          <span class="badge ${colorClass}">${p.stock} ${p.unit}</span>
        </div>`;
      }).join('');
    }

    // Recent transactions
    const tbody = document.getElementById('recentTxnTable');
    if (json.recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted" style="padding:30px">Belum ada transaksi</td></tr>';
    } else {
      tbody.innerHTML = json.recent.map(t => `
        <tr>
          <td><span class="badge badge-primary">${t.invoice_no}</span></td>
          <td>${t.cashier_name || '—'}</td>
          <td class="font-bold text-primary">${formatRupiah(t.total_amount)}</td>
          <td class="text-muted">${new Date(t.created_at).toLocaleString('id-ID')}</td>
        </tr>
      `).join('');
    }

  } catch (e) {
    console.error(e);
    showToast('Gagal memuat data dashboard', 'error');
  }
}

loadDashboard();
</script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
