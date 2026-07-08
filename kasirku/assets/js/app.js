/**
 * app.js - POS (Point of Sale) Logic
 * KasirKu UMKM
 */

// ===== STATE =====
let cart = [];
let allProducts = [];
let filteredProducts = [];
let selectedCategory = 0;
let currentReceipt = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadProducts();
});

// ===== LOAD CATEGORIES =====
async function loadCategories() {
  try {
    const res = await fetch('/kasirku/api/products.php?action=categories');
    const json = await res.json();
    if (!json.success) return;

    const pills = document.getElementById('categoryPills');
    json.data.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'category-pill';
      btn.dataset.id = cat.id;
      btn.textContent = cat.name;
      btn.onclick = () => selectCategory(btn, parseInt(cat.id));
      pills.appendChild(btn);
    });
  } catch (e) {
    console.error('Failed to load categories', e);
  }
}

// ===== SELECT CATEGORY =====
function selectCategory(btn, catId) {
  document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  selectedCategory = catId;
  filterProducts();
}

// ===== LOAD PRODUCTS =====
async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  try {
    const res = await fetch('/kasirku/api/products.php?per_page=200');
    const json = await res.json();

    if (!json.success) {
      grid.innerHTML = '<div class="no-data"><div class="no-data-icon">❌</div><div>Gagal memuat produk</div></div>';
      return;
    }

    allProducts = json.data;
    filterProducts();
  } catch (e) {
    grid.innerHTML = '<div class="no-data"><div class="no-data-icon">❌</div><div>Koneksi bermasalah</div></div>';
    console.error(e);
  }
}

// ===== FILTER PRODUCTS =====
function filterProducts() {
  const search = document.getElementById('productSearch').value.toLowerCase().trim();

  filteredProducts = allProducts.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search);
    const matchCat    = selectedCategory === 0 || parseInt(p.category_id) === selectedCategory;
    return matchSearch && matchCat;
  });

  renderProducts();
}

// ===== PRODUCT EMOJIS =====
const categoryEmojis = {
  'makanan': '🍽️',
  'minuman': '🥤',
  'snack':   '🍿',
  'rokok':   '🚬',
  'sembako': '🛒',
  'lainnya': '📦',
};

function getProductEmoji(product) {
  const catName = (product.category_name || '').toLowerCase();
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (catName.includes(key)) return emoji;
  }
  return '🛍️';
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  const grid = document.getElementById('productsGrid');

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="no-data" style="grid-column:1/-1">
        <span class="no-data-icon">🔍</span>
        <div class="no-data-text">Produk tidak ditemukan</div>
        <div class="no-data-sub">Coba kata kunci lain</div>
      </div>`;
    return;
  }

  grid.innerHTML = filteredProducts.map(p => {
    const outOfStock = parseInt(p.stock) <= 0;
    const emoji = getProductEmoji(p);
    const stockClass = parseInt(p.stock) <= 5 ? 'stock-low' :
                       parseInt(p.stock) <= 10 ? 'stock-medium' : 'stock-ok';

    return `
      <div class="product-card ${outOfStock ? 'out-of-stock' : ''}"
           onclick="${outOfStock ? '' : `addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})`}"
           title="${p.name} - ${formatRupiah(p.price)}">
        <span class="product-emoji">${emoji}</span>
        <div class="product-name">${p.name}</div>
        <div class="product-price">${formatRupiah(p.price)}</div>
        <div class="product-stock ${stockClass}">Stok: ${p.stock} ${p.unit}</div>
        ${outOfStock ? '<div style="font-size:10px;color:var(--danger);font-weight:700;margin-top:3px">HABIS</div>' : ''}
      </div>`;
  }).join('');
}

// ===== CART OPERATIONS =====
function addToCart(product) {
  const productId = parseInt(product.id);

  // Check stock limit
  const maxStock = parseInt(product.stock);
  const existing = cart.find(i => i.id === productId);

  if (existing) {
    if (existing.qty >= maxStock) {
      showToast(`Stok ${product.name} hanya ${maxStock} ${product.unit}`, 'warning');
      return;
    }
    existing.qty++;
  } else {
    if (maxStock <= 0) return;
    cart.push({
      id:    productId,
      name:  product.name,
      price: parseFloat(product.price),
      qty:   1,
      stock: maxStock,
      unit:  product.unit,
    });
  }

  renderCart();
  updateQuickPayButtons();
}

function updateQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  } else if (item.qty > item.stock) {
    item.qty = item.stock;
    showToast(`Maksimal stok ${item.stock} ${item.unit}`, 'warning');
  }

  renderCart();
  updateQuickPayButtons();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  renderCart();
  updateQuickPayButtons();
}

function clearCart() {
  if (cart.length === 0) return;
  if (!confirm('Kosongkan keranjang?')) return;
  cart = [];
  document.getElementById('paymentInput').value = '';
  document.getElementById('txnNotes').value = '';
  renderCart();
  updateQuickPayButtons();
}

// ===== RENDER CART =====
function renderCart() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartCountEl = document.getElementById('cartCount');
  const subtotalEl  = document.getElementById('cartSubtotal');
  const totalEl     = document.getElementById('cartTotal');
  const processBtn  = document.getElementById('processTxnBtn');

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);

  // Update count badge
  if (totalQty > 0) {
    cartCountEl.textContent = totalQty + ' item';
    cartCountEl.style.display = '';
  } else {
    cartCountEl.style.display = 'none';
  }

  // Update totals
  subtotalEl.textContent = formatRupiah(total);
  totalEl.textContent    = formatRupiah(total);

  // Enable/disable process button
  const payment = parseRawValue(document.getElementById('paymentInput'));
  processBtn.disabled = cart.length === 0 || payment < total;

  // Render items
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="empty-icon">🛒</span>
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">Keranjang Kosong</div>
        <div style="font-size:12px;color:var(--text-muted)">Klik produk untuk menambahkan</div>
      </div>`;
    return;
  }

  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" id="cartItem_${item.id}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${formatRupiah(item.price)} / ${item.unit}</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
      </div>
      <div class="cart-item-subtotal">${formatRupiah(item.price * item.qty)}</div>
      <button class="btn-remove" onclick="removeFromCart(${item.id})" title="Hapus">🗑</button>
    </div>
  `).join('');
}

// ===== PAYMENT =====
function onPaymentInput(input) {
  formatNumberInput(input);
  updateChange();
}

function parseRawValue(input) {
  const raw = (input.dataset.rawValue || input.value).replace(/\D/g, '');
  return raw ? parseInt(raw) : 0;
}

function updateChange() {
  const total   = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const payment = parseRawValue(document.getElementById('paymentInput'));
  const change  = payment - total;

  const changeDisplay = document.getElementById('changeDisplay');
  const changeAmount  = document.getElementById('changeAmount');
  const processBtn    = document.getElementById('processTxnBtn');

  if (payment >= total && total > 0) {
    changeDisplay.style.display = 'flex';
    changeAmount.textContent = formatRupiah(change);
    processBtn.disabled = false;
  } else {
    changeDisplay.style.display = 'none';
    processBtn.disabled = true;
  }
}

function updateQuickPayButtons() {
  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const container = document.getElementById('quickPayBtns');

  if (total === 0) { container.innerHTML = ''; return; }

  // Generate quick payment amounts
  const amounts = [];
  const roundUps = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

  for (const round of roundUps) {
    const amt = Math.ceil(total / round) * round;
    if (!amounts.includes(amt) && amt >= total && amounts.length < 4) {
      amounts.push(amt);
    }
  }

  container.innerHTML = amounts.map(amt => `
    <button class="quick-pay-btn" onclick="setPayment(${amt})">
      ${formatRupiah(amt)}
    </button>
  `).join('');
}

function setPayment(amount) {
  const input = document.getElementById('paymentInput');
  input.dataset.rawValue = amount;
  input.value = amount.toLocaleString('id-ID');
  updateChange();
}

// ===== PROCESS TRANSACTION =====
async function processTransaction() {
  if (cart.length === 0) { showToast('Keranjang kosong!', 'warning'); return; }

  const total   = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const payment = parseRawValue(document.getElementById('paymentInput'));
  const notes   = document.getElementById('txnNotes').value.trim();

  if (payment < total) {
    showToast('Nominal bayar kurang dari total!', 'error');
    return;
  }

  const btn = document.getElementById('processTxnBtn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Memproses...';

  try {
    const res = await fetch('/kasirku/api/transactions.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({
          id:       i.id,
          name:     i.name,
          price:    i.price,
          quantity: i.qty,
        })),
        payment_amount: payment,
        notes: notes,
      })
    });

    const json = await res.json();

    if (json.success) {
      showToast('Transaksi berhasil! 🎉', 'success');

      // Build receipt
      currentReceipt = {
        invoice:  json.invoice_no,
        items:    [...cart],
        total:    json.total,
        payment:  json.payment,
        change:   json.change,
        date:     new Date().toLocaleString('id-ID'),
        notes:    notes,
      };

      showReceipt(currentReceipt);

      // Reset cart & reload products
      cart = [];
      document.getElementById('paymentInput').value = '';
      document.getElementById('paymentInput').dataset.rawValue = '';
      document.getElementById('txnNotes').value = '';
      renderCart();
      updateQuickPayButtons();
      loadProducts(); // refresh stock
    } else {
      showToast(json.message || 'Transaksi gagal', 'error');
      btn.disabled = false;
      btn.innerHTML = '✅ Proses Transaksi';
    }
  } catch (e) {
    showToast('Koneksi bermasalah. Coba lagi.', 'error');
    btn.disabled = false;
    btn.innerHTML = '✅ Proses Transaksi';
    console.error(e);
  }
}

// ===== RECEIPT =====
function showReceipt(data) {
  const content = buildReceiptHTML(data);
  document.getElementById('receiptContent').innerHTML = content;
  openModal('receiptModal');
}

function buildReceiptHTML(data) {
  const itemRows = data.items.map(item => `
    <div class="receipt-item">
      <span class="receipt-item-name">${item.name}</span>
      <div class="receipt-item-detail">
        <span>${item.qty} x ${formatRupiah(item.price)}</span>
        <span>${formatRupiah(item.price * item.qty)}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="receipt" id="receiptPreview">
      <div class="receipt-store-name">TOKO SERBA ADA</div>
      <div class="receipt-store-sub">
        Jl. Raya No. 1, Jakarta<br>
        Telp: 0812-3456-7890
      </div>

      <hr class="receipt-divider">

      <div class="receipt-info">
        <div class="row"><span>No. Invoice</span><span>${data.invoice}</span></div>
        <div class="row"><span>Tanggal</span><span>${data.date}</span></div>
        ${data.notes ? `<div class="row"><span>Catatan</span><span>${data.notes}</span></div>` : ''}
      </div>

      <hr class="receipt-divider">
      <div class="receipt-title">— DETAIL PESANAN —</div>

      ${itemRows}

      <hr class="receipt-divider">

      <div class="receipt-totals">
        <div class="row"><span>Subtotal</span><span>${formatRupiah(data.total)}</span></div>
        <div class="grand"><span>TOTAL</span><span>${formatRupiah(data.total)}</span></div>
        <div class="row" style="margin-top:6px"><span>Bayar</span><span>${formatRupiah(data.payment)}</span></div>
        <div class="row"><span>Kembali</span><span>${formatRupiah(data.change)}</span></div>
      </div>

      <hr class="receipt-divider">

      <div class="receipt-footer">
        Terima kasih telah berbelanja!<br>
        Barang yang sudah dibeli<br>
        tidak dapat dikembalikan.
      </div>
    </div>
  `;
}

function printReceipt() {
  const receiptEl = document.getElementById('receiptPreview');
  if (!receiptEl) return;

  // Create print area
  let printArea = document.getElementById('printArea');
  if (!printArea) {
    printArea = document.createElement('div');
    printArea.id = 'printArea';
    document.body.appendChild(printArea);
  }

  printArea.innerHTML = receiptEl.innerHTML;
  window.print();
}

// Listen for payment input changes
document.addEventListener('input', function(e) {
  if (e.target.id === 'paymentInput') updateChange();
});
