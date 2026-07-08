/**
 * stock.js - Stock Management Logic
 * KasirKu UMKM
 */

let stockPage = 1;
let stockTimer = null;
let categories = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadCategoriesForStock();
  loadStock();
});

// ===== DEBOUNCE =====
function debounceLoad() {
  clearTimeout(stockTimer);
  stockTimer = setTimeout(loadStock, 350);
}

// ===== LOAD CATEGORIES =====
async function loadCategoriesForStock() {
  try {
    const res = await fetch('/kasirku/api/products.php?action=categories');
    const json = await res.json();
    if (!json.success) return;
    categories = json.data;

    // Fill filter select
    const filterSel = document.getElementById('stockCategoryFilter');
    categories.forEach(c => {
      filterSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    // Fill add modal select
    const addSel = document.getElementById('addCategory');
    const editSel = document.getElementById('editCategory');
    categories.forEach(c => {
      const opt = `<option value="${c.id}">${c.name}</option>`;
      addSel.innerHTML += opt;
      editSel.innerHTML += opt;
    });
  } catch (e) {
    console.error(e);
  }
}

// ===== LOAD STOCK TABLE =====
async function loadStock() {
  const search = document.getElementById('stockSearch').value.trim();
  const catId  = document.getElementById('stockCategoryFilter').value;
  const tbody  = document.getElementById('stockTableBody');
  const totalEl = document.getElementById('stockTotal');

  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:36px">
    <div class="spinner" style="margin:0 auto"></div>
  </td></tr>`;

  try {
    const params = new URLSearchParams({
      search,
      category_id: catId,
      page: stockPage,
      per_page: 15,
    });

    const res = await fetch(`/kasirku/api/products.php?${params}`);
    const json = await res.json();

    if (!json.success) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:30px">Gagal memuat data</td></tr>`;
      return;
    }

    totalEl.textContent = json.total + ' produk';

    if (json.data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px">
        <div class="no-data-icon">📦</div>
        <div class="no-data-text">Produk tidak ditemukan</div>
      </td></tr>`;
      renderStockPagination(json);
      return;
    }

    tbody.innerHTML = json.data.map((p, i) => {
      const stockVal  = parseInt(p.stock);
      const stockClass = stockVal <= 5 ? 'badge-danger' : stockVal <= 10 ? 'badge-warning' : 'badge-success';
      const stockLabel = stockVal <= 5 ? 'Kritis' : stockVal <= 10 ? 'Menipis' : 'Aman';
      const rowNum = ((stockPage - 1) * 15) + i + 1;
      const updatedAt = p.updated_at ? new Date(p.updated_at).toLocaleDateString('id-ID') : '—';

      return `
        <tr>
          <td class="text-muted">${rowNum}</td>
          <td style="font-weight:600;color:var(--text-primary)">${p.name}</td>
          <td>${p.category_name ? `<span class="badge badge-info">${p.category_name}</span>` : '<span class="text-muted">—</span>'}</td>
          <td class="font-bold text-primary">${formatRupiah(p.price)}</td>
          <td>
            <span class="badge ${stockClass}">${stockVal} ${p.unit}</span>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${stockLabel}</div>
          </td>
          <td class="text-muted">${p.unit}</td>
          <td class="text-muted" style="font-size:12px">${updatedAt}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn btn-warning btn-sm" onclick="openEditModal(${p.id})" title="Edit">✏️ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')" title="Hapus">🗑️</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    renderStockPagination(json);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding:30px">Koneksi bermasalah</td></tr>`;
    console.error(e);
  }
}

// ===== PAGINATION =====
function renderStockPagination(json) {
  const pages = json.pages || 1;
  const paginationEl = document.getElementById('stockPagination');

  if (pages <= 1) { paginationEl.innerHTML = ''; return; }

  let html = '';
  if (stockPage > 1) html += `<button class="page-btn" onclick="goStockPage(${stockPage - 1})">‹</button>`;

  for (let p = Math.max(1, stockPage - 2); p <= Math.min(pages, stockPage + 2); p++) {
    html += `<button class="page-btn ${p === stockPage ? 'active' : ''}" onclick="goStockPage(${p})">${p}</button>`;
  }

  if (stockPage < pages) html += `<button class="page-btn" onclick="goStockPage(${stockPage + 1})">›</button>`;

  paginationEl.innerHTML = html;
}

function goStockPage(page) {
  stockPage = page;
  loadStock();
}

// ===== ADD PRODUCT =====
function openAddModal() {
  document.getElementById('addName').value = '';
  document.getElementById('addPrice').value = '';
  document.getElementById('addPrice').dataset.rawValue = '';
  document.getElementById('addStock').value = '0';
  document.getElementById('addCategory').value = '';
  document.getElementById('addUnit').value = 'pcs';
  openModal('addProductModal');
}

async function saveProduct() {
  const name     = document.getElementById('addName').value.trim();
  const price    = document.getElementById('addPrice').dataset.rawValue || document.getElementById('addPrice').value.replace(/\./g, '');
  const stock    = document.getElementById('addStock').value;
  const catId    = document.getElementById('addCategory').value;
  const unit     = document.getElementById('addUnit').value;

  if (!name) { showToast('Nama produk wajib diisi', 'warning'); return; }
  if (!price || parseFloat(price) <= 0) { showToast('Harga harus lebih dari 0', 'warning'); return; }

  try {
    const res = await fetch('/kasirku/api/products.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', name, price: parseFloat(price), stock: parseInt(stock), category_id: catId, unit })
    });
    const json = await res.json();

    if (json.success) {
      showToast(json.message, 'success');
      closeModal('addProductModal');
      stockPage = 1;
      loadStock();
    } else {
      showToast(json.message, 'error');
    }
  } catch (e) {
    showToast('Koneksi bermasalah', 'error');
    console.error(e);
  }
}

// ===== EDIT PRODUCT =====
let editingProduct = null;

async function openEditModal(productId) {
  // Find in table via API
  try {
    const res = await fetch(`/kasirku/api/products.php?search=&per_page=200`);
    const json = await res.json();
    const product = json.data.find(p => parseInt(p.id) === productId);

    if (!product) { showToast('Produk tidak ditemukan', 'error'); return; }

    editingProduct = product;
    document.getElementById('editId').value = product.id;
    document.getElementById('editName').value = product.name;

    const priceInput = document.getElementById('editPrice');
    priceInput.value = parseInt(product.price).toLocaleString('id-ID');
    priceInput.dataset.rawValue = product.price;

    document.getElementById('editStock').value = product.stock;
    document.getElementById('editCategory').value = product.category_id || '';
    document.getElementById('editUnit').value = product.unit;

    openModal('editProductModal');
  } catch (e) {
    showToast('Gagal memuat data produk', 'error');
    console.error(e);
  }
}

async function updateProduct() {
  const id    = document.getElementById('editId').value;
  const name  = document.getElementById('editName').value.trim();
  const price = document.getElementById('editPrice').dataset.rawValue || document.getElementById('editPrice').value.replace(/\./g, '');
  const stock = document.getElementById('editStock').value;
  const catId = document.getElementById('editCategory').value;
  const unit  = document.getElementById('editUnit').value;

  if (!name) { showToast('Nama produk wajib diisi', 'warning'); return; }
  if (!price || parseFloat(price) <= 0) { showToast('Harga harus lebih dari 0', 'warning'); return; }

  try {
    const res = await fetch('/kasirku/api/products.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', id: parseInt(id), name, price: parseFloat(price), stock: parseInt(stock), category_id: catId, unit })
    });
    const json = await res.json();

    if (json.success) {
      showToast(json.message, 'success');
      closeModal('editProductModal');
      loadStock();
    } else {
      showToast(json.message, 'error');
    }
  } catch (e) {
    showToast('Koneksi bermasalah', 'error');
    console.error(e);
  }
}

// ===== DELETE PRODUCT =====
async function deleteProduct(id, name) {
  if (!confirm(`Hapus produk "${name}"?\n\nProduk yang terhapus tidak dapat dikembalikan.`)) return;

  try {
    const res = await fetch('/kasirku/api/products.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const json = await res.json();

    if (json.success) {
      showToast(json.message, 'success');
      loadStock();
    } else {
      showToast(json.message, 'error');
    }
  } catch (e) {
    showToast('Koneksi bermasalah', 'error');
    console.error(e);
  }
}
