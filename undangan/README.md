# 💍 Template Undangan Pernikahan Digital — by chogus

Template undangan pernikahan berbasis web yang elegan, responsif, dan siap pakai.  
Tema: **Dark Botanical — Sage Green & Gold**

---

## 🖥️ Cara Penggunaan

### 1. Buka Template
Cukup buka file `index.html` di browser (Google Chrome / Safari).  
Tidak perlu server khusus — bisa langsung digunakan secara offline.

### 2. Kustomisasi Data Mempelai
Buka file `index.html` dan ubah bagian berikut:

| Data | Lokasi di HTML |
|------|---------------|
| Nama Mempelai | Cari teks `Arkan` dan `Devina`, ganti dengan nama Anda |
| Tanggal Acara | Ubah teks `20 · 12 · 2026` dan tanggal di detail acara |
| Foto Pasangan | Ganti file gambar di folder `assets/images/` |
| Nama Orang Tua | Edit di seksi "Profil Mempelai" |
| Lokasi Acara | Edit alamat dan koordinat Google Maps |
| No. Rekening | Edit di seksi "Kado Digital" |
| Alamat Kado | Edit alamat di bagian bawah seksi Kado |

### 3. Kustomisasi Countdown
Buka file `js/script.js` dan ubah variabel:
```javascript
const WEDDING_DATE = '2026-12-20T08:00:00';
```
Ganti dengan tanggal dan waktu acara Anda (format: `YYYY-MM-DDTHH:MM:SS`).

### 4. Ganti Musik Latar
Letakkan file `.mp3` di folder `assets/audio/` dengan nama `music.mp3`.

### 5. Ganti Foto
Ganti file gambar di `assets/images/` dengan foto Anda sendiri:
- `hero.png` — Foto cover utama
- `groom.png` — Foto mempelai pria
- `bride.png` — Foto mempelai wanita
- `gallery1.png` — Foto galeri 1
- `gallery2.png` — Foto galeri 2
- `gallery3.png` — Foto galeri 3

> 💡 **Tips:** Kompres foto ke format `.webp` menggunakan [squoosh.app](https://squoosh.app) untuk kecepatan loading optimal.

---

## 📁 Struktur Folder

```
undangan/
├── index.html              ← Halaman utama
├── css/
│   └── style.css           ← Styling (warna, font, layout)
├── js/
│   └── script.js           ← Logika interaktif
├── assets/
│   ├── images/             ← Foto-foto
│   └── audio/              ← Musik latar (.mp3)
└── README.md               ← Dokumentasi ini
```

---

## ✨ Fitur Lengkap

- ✅ Cover animasi dengan tombol "Buka Undangan"
- ✅ Musik latar otomatis dengan tombol Play/Pause
- ✅ Profil mempelai pria & wanita dengan foto
- ✅ Countdown timer dinamis
- ✅ Detail acara Akad & Resepsi
- ✅ Tombol navigasi Google Maps
- ✅ Galeri foto dengan Lightbox interaktif
- ✅ Timeline Love Story
- ✅ RSVP & Guestbook (data tersimpan di browser)
- ✅ Kado Digital — Salin No. Rekening
- ✅ 100% Responsif Mobile-First
- ✅ Animasi scroll (AOS)
- ✅ SEO-friendly

---

## 🎨 Kustomisasi Warna

Buka file `css/style.css` dan ubah variabel warna di bagian `:root`:

```css
:root {
  --clr-bg-dark:    hsl(150, 30%, 8%);   /* Warna background utama */
  --clr-gold:       hsl(42, 75%, 55%);   /* Warna aksen emas */
  --clr-sage:       hsl(150, 25%, 35%);  /* Warna hijau sage */
  --clr-ivory:      hsl(40, 40%, 95%);   /* Warna teks terang */
}
```

---

## 🌐 Deployment

Template ini bersifat statis (tanpa backend). Anda bisa hosting di:
- **Netlify** (gratis) — drag & drop folder
- **Vercel** (gratis)
- **GitHub Pages** (gratis)
- **Niagahoster / Hostinger** (berbayar)

---

## 📝 Lisensi

Template ini dibuat oleh **chogus** untuk dijual kembali sebagai produk digital.
Pembeli diperbolehkan mengedit dan menggunakan untuk keperluan pribadi maupun klien.

---

Terima kasih telah menggunakan template ini! 🤍
