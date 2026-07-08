<?php
/**
 * Stock Management Page - Owner Only
 */
require_once __DIR__ . '/../includes/auth_check.php';
requireOwner();

$pageTitle    = 'Stok & Produk — KasirKu';
$pageSubtitle = 'Manajemen Produk & Inventaris';

require_once __DIR__ . '/../includes/header.php';
?>

<!-- Toolbar -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
  <div style="display:flex;gap:10px;flex:1;flex-wrap:wrap">
    <div class="search-wrapper" style="min-width:220px">
      <span class="search-icon">🔍</span>
      <input type="text" id="stockSearch" class="form-control" placeholder="Cari produk..." oninput="debounceLoad()">
    </div>
    <select id="stockCategoryFilter" class="form-control" style="width:170px" onchange="loadStock()">
      <option value="0">Semua Kategori</option>
    </select>
  </div>
  <button class="btn btn-primary" onclick="openAddModal()">
    ➕ Tambah Produk
  </button>
</div>

<!-- Stock Table -->
<div class="card">
  <div class="card-header">
    <div class="card-title">📦 Daftar Produk</div>
    <span class="badge badge-primary" id="stockTotal">— produk</span>
  </div>
  <div class="table-wrapper">
    <table class="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Nama Produk</th>
          <th>Kategori</th>
          <th>Harga</th>
          <th>Stok</th>
          <th>Satuan</th>
          <th>Diperbarui</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody id="stockTableBody">
        <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted)">Memuat data...</td></tr>
      </tbody>
    </table>
  </div>
  <!-- Pagination -->
  <div class="pagination" id="stockPagination" style="padding:16px"></div>
</div>

<!-- ===== ADD PRODUCT MODAL ===== -->
<div class="modal-overlay" id="addProductModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">➕ Tambah Produk</div>
      <button class="modal-close" onclick="closeModal('addProductModal')">✕</button>
    </div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nama Produk *</label>
          <input type="text" id="addName" class="form-control" placeholder="Cth: Nasi Goreng">
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select id="addCategory" class="form-control">
            <option value="">Pilih Kategori</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Harga Jual (Rp) *</label>
          <input type="text" id="addPrice" class="form-control" placeholder="Cth: 15.000" oninput="formatNumberInput(this)">
        </div>
        <div class="form-group">
          <label class="form-label">Stok Awal</label>
          <input type="number" id="addStock" class="form-control" placeholder="0" min="0" value="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Satuan</label>
        <select id="addUnit" class="form-control">
          <option value="pcs">pcs</option>
          <option value="porsi">porsi</option>
          <option value="gelas">gelas</option>
          <option value="botol">botol</option>
          <option value="bungkus">bungkus</option>
          <option value="kg">kg</option>
          <option value="liter">liter</option>
          <option value="lusin">lusin</option>
          <option value="sachet">sachet</option>
          <option value="butir">butir</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('addProductModal')">Batal</button>
      <button class="btn btn-primary" onclick="saveProduct()">💾 Simpan Produk</button>
    </div>
  </div>
</div>

<!-- ===== EDIT PRODUCT MODAL ===== -->
<div class="modal-overlay" id="editProductModal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">✏️ Edit Produk</div>
      <button class="modal-close" onclick="closeModal('editProductModal')">✕</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="editId">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nama Produk *</label>
          <input type="text" id="editName" class="form-control">
        </div>
        <div class="form-group">
          <label class="form-label">Kategori</label>
          <select id="editCategory" class="form-control">
            <option value="">Pilih Kategori</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Harga Jual (Rp) *</label>
          <input type="text" id="editPrice" class="form-control" oninput="formatNumberInput(this)">
        </div>
        <div class="form-group">
          <label class="form-label">Stok</label>
          <input type="number" id="editStock" class="form-control" min="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Satuan</label>
        <select id="editUnit" class="form-control">
          <option value="pcs">pcs</option>
          <option value="porsi">porsi</option>
          <option value="gelas">gelas</option>
          <option value="botol">botol</option>
          <option value="bungkus">bungkus</option>
          <option value="kg">kg</option>
          <option value="liter">liter</option>
          <option value="lusin">lusin</option>
          <option value="sachet">sachet</option>
          <option value="butir">butir</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('editProductModal')">Batal</button>
      <button class="btn btn-primary" onclick="updateProduct()">💾 Perbarui Produk</button>
    </div>
  </div>
</div>

<script src="/kasirku/assets/js/stock.js"></script>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
