# Dokumentasi Fitur AGUS.DEV

Dokumen ini menjelaskan kemampuan yang benar-benar tersedia pada redesign portfolio. Situs ditujukan untuk dua alur utama: recruiter yang ingin memindai profil dengan cepat dan pengunjung yang ingin menelusuri pengalaman serta proyek secara lebih mendalam.

## Arah visual

Desain mempertahankan neo-brutalism dengan pendekatan yang lebih premium dan terkontrol:

- tipografi display berukuran besar dengan hierarki yang jelas;
- border tegas dan hard shadow sebagai bahasa visual utama;
- palet hitam, putih, dan acid green dengan warna aksen yang dibatasi;
- kartu modular, label monospace, dan elemen bergaya terminal;
- layout responsif untuk desktop, tablet, dan mobile;
- tema `dark`, `light`, dan `system` melalui pemilih tema.

## Struktur konten

### Hero

- Posisi utama sebagai Web Developer dan Backend Enthusiast.
- Ringkasan stack: PHP, Laravel, MySQL, JavaScript, REST API, Linux, dan Git.
- Status ketersediaan untuk internship serta posisi junior.
- CTA ke proyek, CV, GitHub, dan kontak.
- Foto profil dengan lokasi dan ringkasan kompetensi, tanpa angka statistik yang tidak terverifikasi.

### Recruiter mode

Tombol Recruiter mode menampilkan quick profile yang memprioritaskan stack utama, fokus pengalaman, lokasi, availability, serta akses langsung ke CV, email, dan LinkedIn.

### About, pendidikan, dan pengalaman

- Ringkasan fokus backend development, REST API, database, Linux deployment, dan problem solving.
- Informasi pendidikan S1 Teknik Informatika.
- Timeline pengalaman di NetCrft.id dan BrainBox Learning.
- Deskripsi tanggung jawab menggunakan informasi konkret, tanpa klaim jumlah proyek atau persentase keberhasilan.

### Tech stack

Kemampuan dikelompokkan menjadi Backend, Database, Frontend, Tools, dan Server. Setiap teknologi memiliki tooltip singkat untuk memberi konteks, bukan sekadar menampilkan daftar logo.

### Featured projects

Tiga proyek utama memperoleh ruang khusus:

1. BrainBox Learning — sistem akademik berbasis PHP, MySQL, JavaScript, REST API, Linux, dan Apache.
2. Laravel Helpdesk System — aplikasi pengelolaan tiket, status, pengguna, role, dan dashboard admin. Live project tersedia, sedangkan source code ditandai tidak publik.
3. NetCrft Digital Agency — website agency responsif berbasis HTML, CSS, dan JavaScript.

Setiap proyek menampilkan kontribusi atau fokus teknis yang relevan. Tautan live hanya ditampilkan jika memang tersedia. Tombol case study membuka dialog berisi detail proyek dan media terkait.

### Project archive

- Pencarian proyek berdasarkan nama dan metadata.
- Filter All, PHP, Laravel, JavaScript, MySQL, Frontend, dan Backend.
- Galeri screenshot untuk Pet Shop, Coffee Shop, dan Property Website.
- Empty state ketika pencarian atau filter tidak menghasilkan proyek.
- Item tanpa demo publik dijelaskan sebagai arsip yang detailnya dapat diminta, bukan diberi tautan palsu.

### GitHub

- Tautan langsung ke profil `@AgusHidayahtulloh333`.
- Repository publik dimuat dari GitHub ketika API tersedia.
- Grafik kontribusi dimuat dari layanan visualisasi publik.
- Loading state dan fallback mempertahankan akses ke profil jika request eksternal gagal atau dibatasi.

### Development process

Bagian How I Build merangkum alur Understand, Design, Build, Test, Deploy, dan Improve tanpa mengklaim metodologi atau sertifikasi yang tidak disebutkan.

### CV dan kontak

- CV ATS yang nyata dapat diunduh sebagai PDF.
- Creative CV diberi status “in preparation” dan tidak memiliki tombol unduh palsu.
- Portfolio dapat dicetak melalui print view.
- Kontak melalui email, WhatsApp, LinkedIn, dan GitHub.
- Tombol Copy email menggunakan Clipboard API dengan feedback berbentuk toast.

## Interaksi

### Navigasi

- Header responsif dan menu mobile.
- Mobile bottom navigation untuk akses cepat ke bagian utama.
- Active section mengikuti posisi scroll.
- Scroll progress memberi indikasi posisi baca.
- Skip link membawa pengguna keyboard langsung ke konten utama.

### Command palette

Command palette menyediakan navigasi cepat ke Home, About, Experience, Projects, Contact, CV, dan GitHub. Daftar command dapat dicari dan dioperasikan melalui keyboard, termasuk tombol Escape untuk menutup.

### Terminal portfolio

Terminal menerima command `help`, `about`, `skills`, `projects`, `experience`, `contact`, `github`, dan `clear`. Fitur ini menjadi cara alternatif untuk menjelajahi konten; seluruh informasi penting tetap tersedia melalui navigasi biasa.

### Proyek dan media

- Search dan filter arsip diperbarui tanpa reload halaman.
- Case study menggunakan elemen dialog.
- Galeri screenshot ditampilkan sebagai rangkaian gambar di dalam dialog yang dapat digulir dan ditutup melalui tombol atau keyboard.
- Hover preview hanya menjadi enhancement visual dan tidak menggantikan konten teks atau tautan utama.

### Detail visual

Loading intro, reveal on scroll, spotlight card, parallax ringan, magnetic button, custom cursor, dan easter egg developer mode memperkaya presentasi. Semua efek dekoratif harus dinonaktifkan atau disederhanakan ketika pengguna memilih reduced motion atau perangkat tidak mendukung interaksinya.

## Aksesibilitas

- Bahasa dokumen dideklarasikan sebagai Bahasa Indonesia.
- Struktur memakai `header`, `nav`, `main`, `section`, `article`, `footer`, heading berurutan, dan landmark yang jelas.
- Gambar konten memiliki teks alternatif; dekorasi disembunyikan dari assistive technology.
- Skip link, label form, nama tombol, live region, dan status toast membantu pengguna screen reader.
- State menu, recruiter mode, dan filter dipaparkan melalui atribut ARIA yang sesuai.
- Dialog dapat ditutup, mengelola fokus, dan mendukung tombol Escape.
- Target interaksi dan focus-visible state dibuat jelas untuk keyboard dan layar sentuh.
- `prefers-reduced-motion` dihormati; konten tidak bergantung pada animasi agar dapat dibaca.
- Konten utama tetap tersedia saat JavaScript dinonaktifkan; loading intro disembunyikan melalui fallback `noscript`.

## Performa dan ketahanan

- Arsitektur statis menggunakan HTML, CSS, dan vanilla JavaScript tanpa framework runtime atau proses build.
- `script.js` dimuat dengan `defer` agar tidak memblokir parsing HTML.
- Foto hero diprioritaskan dan dipreload; gambar proyek non-kritis memakai `loading="lazy"` dan `decoding="async"`.
- Atribut `width` dan `height` pada gambar membantu mencegah cumulative layout shift.
- Efek visual menggunakan progressive enhancement dan tidak menjadi syarat untuk mengakses isi portfolio.
- Request GitHub dan grafik kontribusi mempunyai fallback; kegagalan layanan pihak ketiga tidak memblokir halaman.
- Vercel mengirim header keamanan dasar dan cache aset melalui `vercel.json`.

## SEO dan discovery

- Title dan meta description yang spesifik.
- Canonical URL.
- Open Graph dan Twitter Card.
- JSON-LD untuk `Person` dan `WebSite`.
- `robots.txt` dan `sitemap.xml`.
- Favicon SVG dan web app manifest.

Jika domain berubah, semua URL absolut pada metadata dan file discovery harus diperbarui bersama-sama.

## Batasan yang disengaja

- Situs ini adalah portfolio statis, bukan aplikasi dengan backend atau database internal.
- Tidak ada form kontak yang menyimpan data; komunikasi diarahkan ke kanal kontak nyata.
- Data GitHub membutuhkan koneksi internet dan tunduk pada ketersediaan serta rate limit layanan publik.
- Tidak ada statistik klien, persentase sukses, testimoni, harga layanan, atau klaim lain yang tidak dapat diverifikasi.
- File screenshot hanya menjadi bukti visual; status source privat dan ketersediaan live demo ditulis secara eksplisit.

## Struktur implementasi

- `index.html`: konten, semantic markup, metadata, dialog, dan fallback.
- `styles.css`: token desain, tema, responsivitas, animasi, state aksesibel, dan print styles.
- `script.js`: state UI dan progressive enhancement dengan vanilla JavaScript.
- `images/` serta file JPG di root: media proyek.
- `vercel.json`: konfigurasi hosting statis.

Cara menjalankan dan melakukan deployment tersedia di [README.md](README.md).
