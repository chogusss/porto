/**
 * report.js - Revenue Report Logic
 * KasirKu UMKM
 */

let monthlyChart = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadYears();
});

// ===== LOAD YEARS =====
async function loadYears() {
  try {
    const res = await fetch('/kasirku/api/reports.php?action=years');
    const json = await res.json();
    if (!json.success) return;

    const select = document.getElementById('reportYear');
    select.innerHTML = '';

    const currentYear = new Date().getFullYear();
    const years = json.data;

    // Ensure current year is in list
    if (!years.includes(currentYear)) years.unshift(currentYear);

    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = 'Tahun ' + y;
      if (y === currentYear) opt.selected = true;
      select.appendChild(opt);
    });

    loadReport();
  } catch (e) {
    console.error(e);
    loadReport();
  }
}

// ===== LOAD REPORT =====
async function loadReport() {
  const year = document.getElementById('reportYear').value || new Date().getFullYear();
  const tbody = document.getElementById('monthlyTableBody');
  const tfoot = document.getElementById('monthlyTableFoot');

  document.getElementById('annualRevenue').textContent = '—';
  document.getElementById('annualLabel').textContent = `Memuat data tahun ${year}...`;
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:36px">
    <div class="spinner" style="margin:0 auto"></div>
  </td></tr>`;

  try {
    const res = await fetch(`/kasirku/api/reports.php?action=monthly&year=${year}`);
    const json = await res.json();

    if (!json.success) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:30px">Gagal memuat data</td></tr>`;
      return;
    }

    const data   = json.data;
    const annual = json.annual;

    // Annual total
    document.getElementById('annualRevenue').textContent = formatRupiah(annual.total_revenue);
    document.getElementById('annualLabel').textContent =
      `Total ${annual.total_transactions} transaksi sepanjang tahun ${year}`;

    // Chart
    const labels  = data.map(m => m.month_name.substring(0, 3));
    const revenues = data.map(m => parseFloat(m.total_revenue));
    const maxRev   = Math.max(...revenues, 1);

    if (monthlyChart) monthlyChart.destroy();
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pendapatan',
            data: revenues,
            backgroundColor: data.map((_, i) =>
              i === new Date().getMonth() && parseInt(year) === new Date().getFullYear()
                ? 'rgba(6, 182, 212, 0.7)'
                : 'rgba(6, 182, 212, 0.3)'
            ),
            borderColor: '#06B6D4',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          },
          {
            label: 'Transaksi',
            data: data.map(m => parseInt(m.total_transactions)),
            type: 'line',
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#8B5CF6',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            yAxisID: 'y2',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: '#94A3B8', font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                if (ctx.dataset.label === 'Pendapatan') return ' ' + formatRupiah(ctx.raw);
                return ' ' + ctx.raw + ' transaksi';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(148,163,184,0.07)' },
            ticks: { color: '#94A3B8', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(148,163,184,0.07)' },
            ticks: {
              color: '#94A3B8',
              font: { size: 11 },
              callback: val => {
                if (val >= 1000000) return 'Rp ' + (val/1000000).toFixed(1) + 'jt';
                if (val >= 1000)    return 'Rp ' + (val/1000).toFixed(0) + 'k';
                return 'Rp ' + val;
              }
            }
          },
          y2: {
            position: 'right',
            grid: { display: false },
            ticks: { color: '#8B5CF6', font: { size: 11 } }
          }
        }
      }
    });

    // Table
    if (data.every(m => parseFloat(m.total_revenue) === 0)) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:48px">
        <div>
          <div style="font-size:40px;opacity:.35;margin-bottom:12px">📈</div>
          <div style="font-size:15px;font-weight:600;color:var(--text-muted)">Belum ada data transaksi</div>
          <div style="font-size:13px;color:var(--text-muted)">untuk tahun ${year}</div>
        </div>
      </td></tr>`;
      tfoot.innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map((m, i) => {
      const isCurrentMonth = i === new Date().getMonth() && parseInt(year) === new Date().getFullYear();
      const pct = maxRev > 0 ? (parseFloat(m.total_revenue) / maxRev * 100) : 0;
      const hasData = parseInt(m.total_transactions) > 0;

      return `
        <tr style="${isCurrentMonth ? 'background:rgba(6,182,212,0.05)' : ''}">
          <td style="font-weight:${hasData ? '700' : '400'};color:${hasData ? 'var(--text-primary)' : 'var(--text-muted)'}">
            ${isCurrentMonth ? '📍 ' : ''}${m.month_name}
          </td>
          <td class="text-right">
            ${hasData
              ? `<span class="badge badge-info">${m.total_transactions} txn</span>`
              : '<span class="text-muted">—</span>'
            }
          </td>
          <td class="text-right font-bold ${hasData ? 'text-primary' : 'text-muted'}">
            ${hasData ? formatRupiah(m.total_revenue) : '—'}
          </td>
          <td class="text-right text-muted" style="font-size:12px">
            ${hasData ? formatRupiah(m.avg_per_transaction) : '—'}
          </td>
          <td style="min-width:120px;padding-right:20px">
            <div style="background:var(--bg-input);border-radius:4px;height:8px;overflow:hidden">
              <div class="mini-bar" style="width:${pct.toFixed(1)}%"></div>
            </div>
          </td>
        </tr>`;
    }).join('');

    // Footer total
    tfoot.innerHTML = `
      <tr style="background:rgba(6,182,212,0.08);border-top:2px solid rgba(6,182,212,0.3)">
        <td style="font-weight:800;color:var(--primary);font-size:14px">📊 TOTAL ${year}</td>
        <td class="text-right"><span class="badge badge-primary">${annual.total_transactions} txn</span></td>
        <td class="text-right font-bold text-primary" style="font-size:16px">${formatRupiah(annual.total_revenue)}</td>
        <td class="text-right text-muted" style="font-size:12px">
          ${annual.total_transactions > 0 ? formatRupiah(annual.total_revenue / annual.total_transactions) : '—'}
        </td>
        <td></td>
      </tr>`;

  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:30px">Koneksi bermasalah</td></tr>`;
    console.error(e);
  }
}
