/**
 * history.js - Transaction History Logic
 * KasirKu UMKM
 */

let histPage = 1;
let histTimer = null;
let currentTxnDetail = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Set default date range: last 30 days
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  document.getElementById('dateTo').value   = toDateInput(today);
  document.getElementById('dateFrom').value = toDateInput(monthAgo);

  loadHistory();
});

function toDateInput(d) {
  return d.toISOString().split('T')[0];
}

// ===== DEBOUNCE =====
function debounceLoad() {
  clearTimeout(histTimer);
  histTimer = setTimeout(loadHistory, 350);
}

// ===== RESET FILTER =====
function resetFilter() {
  document.getElementById('histSearch').value = '';
  document.getElementById('dateFrom').value = '';
  document.getElementById('dateTo').value = '';
  histPage = 1;
  loadHistory();
}

// ===== LOAD HISTORY =====
async function loadHistory() {
  const search   = document.getElementById('histSearch').value.trim();
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo   = document.getElementById('dateTo').value;
  const tbody    = document.getElementById('histTableBody');
  const totalEl  = document.getElementById('histTotal');

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:36px">
    <div class="spinner" style="margin:0 auto"></div>
  </td></tr>`;

  try {
    const params = new URLSearchParams({
      search,
      date_from: dateFrom,
      date_to:   dateTo,
      page:      histPage,
      per_page:  15,
    });

    const res = await fetch(`/kasirku/api/transactions.php?${params}`);
    const json = await res.json();

    if (!json.success) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:30px">Gagal memuat data</td></tr>`;
      return;
    }

    totalEl.textContent = json.total + ' transaksi';

    if (json.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px">
        <div>
          <div style="font-size:40px;opacity:.35;margin-bottom:12px">🧾</div>
          <div style="font-size:15px;font-weight:600;color:var(--text-muted)">Belum ada transaksi</div>
          <div style="font-size:13px;color:var(--text-muted)">Coba ubah filter tanggal atau kata pencarian</div>
        </div>
      </td></tr>`;
      renderHistPagination(json);
      return;
    }

    tbody.innerHTML = json.data.map((t, i) => {
      const rowNum = ((histPage - 1) * 15) + i + 1;
      const dt = new Date(t.created_at);
      const dateStr = dt.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
      const timeStr = dt.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

      return `
        <tr style="cursor:pointer" onclick="viewDetail(${t.id})" title="Klik untuk detail">
          <td class="text-muted">${rowNum}</td>
          <td><span class="badge badge-primary">${t.invoice_no}</span></td>
          <td style="font-weight:500">${t.cashier_name || '—'}</td>
          <td class="font-bold text-primary">${formatRupiah(t.total_amount)}</td>
          <td style="color:var(--text-secondary)">${formatRupiah(t.payment_amount)}</td>
          <td style="color:var(--success);font-weight:600">${formatRupiah(t.change_amount)}</td>
          <td class="text-muted" style="font-size:12px">${dateStr} <span style="color:var(--text-muted)">${timeStr}</span></td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();viewDetail(${t.id})">🔍 Detail</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    renderHistPagination(json);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:30px">Koneksi bermasalah</td></tr>`;
    console.error(e);
  }
}

// ===== PAGINATION =====
function renderHistPagination(json) {
  const pages = json.pages || 1;
  const paginationEl = document.getElementById('histPagination');

  if (pages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = '';
  if (histPage > 1) html += `<button class="page-btn" onclick="goHistPage(${histPage - 1})">‹</button>`;

  for (let p = Math.max(1, histPage - 2); p <= Math.min(pages, histPage + 2); p++) {
    html += `<button class="page-btn ${p === histPage ? 'active' : ''}" onclick="goHistPage(${p})">${p}</button>`;
  }

  if (histPage < pages) html += `<button class="page-btn" onclick="goHistPage(${histPage + 1})">›</button>`;

  paginationEl.innerHTML = html;
}

function goHistPage(page) {
  histPage = page;
  loadHistory();
}

// ===== VIEW DETAIL =====
async function viewDetail(txnId) {
  const content = document.getElementById('detailContent');
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  openModal('detailModal');

  try {
    const res = await fetch(`/kasirku/api/transactions.php?action=detail&id=${txnId}`);
    const json = await res.json();

    if (!json.success) {
      content.innerHTML = `<div class="text-center text-danger" style="padding:30px">${json.message}</div>`;
      return;
    }

    currentTxnDetail = json;
    const t = json.transaction;
    const items = json.items;

    const dt = new Date(t.created_at);
    const dateStr = dt.toLocaleDateString('id-ID', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
    const timeStr = dt.toLocaleTimeString('id-ID');

    const itemRows = items.map(item => `
      <tr>
        <td style="font-weight:600;color:var(--text-primary)">${item.product_name}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">${formatRupiah(item.price)}</td>
        <td class="text-right font-bold text-primary">${formatRupiah(item.subtotal)}</td>
      </tr>
    `).join('');

    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:14px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:700;text-transform:uppercase">No. Invoice</div>
          <div style="font-size:15px;font-weight:800;color:var(--primary)">${t.invoice_no}</div>
        </div>
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:14px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:700;text-transform:uppercase">Kasir</div>
          <div style="font-size:14px;font-weight:700">${t.cashier_name || '—'}</div>
        </div>
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:14px;grid-column:1/-1">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:700;text-transform:uppercase">Tanggal & Waktu</div>
          <div style="font-size:13px;font-weight:600">${dateStr} · ${timeStr}</div>
        </div>
      </div>

      <div class="table-wrapper" style="border-radius:8px;overflow:hidden;border:1px solid var(--border)">
        <table class="table">
          <thead>
            <tr>
              <th>Produk</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Harga</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div style="margin-top:16px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">
          <span>Total Belanja</span>
          <span style="font-weight:700">${formatRupiah(t.total_amount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:var(--text-secondary)">
          <span>Uang Diterima</span>
          <span style="font-weight:700">${formatRupiah(t.payment_amount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--success);padding-top:8px;border-top:1px solid var(--border)">
          <span>Kembalian</span>
          <span>${formatRupiah(t.change_amount)}</span>
        </div>
        ${t.notes ? `<div style="margin-top:10px;font-size:12px;color:var(--text-muted)">📝 ${t.notes}</div>` : ''}
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<div class="text-center text-danger" style="padding:30px">Koneksi bermasalah</div>`;
    console.error(e);
  }
}

// ===== REPRINT RECEIPT =====
function reprintReceipt() {
  if (!currentTxnDetail) return;

  const t = currentTxnDetail.transaction;
  const items = currentTxnDetail.items;
  const dt = new Date(t.created_at);

  const receiptHtml = `
    <div class="receipt" id="receiptReprint">
      <div class="receipt-store-name">TOKO SERBA ADA</div>
      <div class="receipt-store-sub">Jl. Raya No. 1, Jakarta<br>Telp: 0812-3456-7890</div>
      <hr class="receipt-divider">
      <div class="receipt-info">
        <div class="row"><span>Invoice</span><span>${t.invoice_no}</span></div>
        <div class="row"><span>Kasir</span><span>${t.cashier_name || '—'}</span></div>
        <div class="row"><span>Tgl</span><span>${dt.toLocaleString('id-ID')}</span></div>
      </div>
      <hr class="receipt-divider">
      <div class="receipt-title">— DETAIL PESANAN —</div>
      ${items.map(item => `
        <div class="receipt-item">
          <span class="receipt-item-name">${item.product_name}</span>
          <div class="receipt-item-detail">
            <span>${item.quantity} x ${formatRupiah(item.price)}</span>
            <span>${formatRupiah(item.subtotal)}</span>
          </div>
        </div>
      `).join('')}
      <hr class="receipt-divider">
      <div class="receipt-totals">
        <div class="grand"><span>TOTAL</span><span>${formatRupiah(t.total_amount)}</span></div>
        <div class="row" style="margin-top:5px"><span>Bayar</span><span>${formatRupiah(t.payment_amount)}</span></div>
        <div class="row"><span>Kembali</span><span>${formatRupiah(t.change_amount)}</span></div>
      </div>
      <hr class="receipt-divider">
      <div class="receipt-footer">Terima kasih telah berbelanja!<br>Barang yang sudah dibeli<br>tidak dapat dikembalikan.</div>
    </div>
  `;

  let printArea = document.getElementById('printArea');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'printArea';
    document.body.appendChild(printArea);
  }
  printArea.innerHTML = receiptHtml;
  window.print();
}
