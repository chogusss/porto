/* ============================================================
   TEMPLATE UNDANGAN DIGITAL PERNIKAHAN
   JavaScript — Semua Logika Interaktif
   Author: chogus
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- CONFIG: Ubah tanggal target countdown di sini ----
  const WEDDING_DATE = '2026-12-20T08:00:00';

  // ============================================================
  // 1. COVER — Buka Undangan
  // ============================================================
  const cover       = document.getElementById('cover');
  const btnOpen     = document.getElementById('btn-open');
  const body        = document.body;
  const audioBtn    = document.getElementById('audio-btn');
  const mainContent = document.getElementById('main-content');

  // Lock scroll awal
  body.classList.add('locked');

  btnOpen.addEventListener('click', () => {
    // Buka cover
    cover.classList.add('opened');

    // Unlock scroll
    body.classList.remove('locked');

    // Tampilkan floating audio button
    audioBtn.classList.add('visible');

    // Mulai putar musik
    playAudio();

    // Scroll ke seksi pertama
    setTimeout(() => {
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }, 300);

    // Inisialisasi AOS setelah cover terbuka
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        offset: 80,
        once: true,
        easing: 'ease-out-cubic'
      });
    }
  });


  // ============================================================
  // 2. AUDIO CONTROLLER
  // ============================================================
  const bgMusic = new Audio('assets/audio/music.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.5;

  let isPlaying = false;

  function playAudio() {
    bgMusic.play()
      .then(() => {
        isPlaying = true;
        audioBtn.classList.add('playing');
      })
      .catch((err) => {
        console.log('Autoplay dicegah browser:', err);
        isPlaying = false;
        audioBtn.classList.remove('playing');
      });
  }

  function toggleAudio() {
    if (isPlaying) {
      bgMusic.pause();
      isPlaying = false;
      audioBtn.classList.remove('playing');
    } else {
      playAudio();
    }
  }

  audioBtn.addEventListener('click', toggleAudio);


  // ============================================================
  // 3. COUNTDOWN TIMER
  // ============================================================
  const daysEl   = document.getElementById('countdown-days');
  const hoursEl  = document.getElementById('countdown-hours');
  const minsEl   = document.getElementById('countdown-mins');
  const secsEl   = document.getElementById('countdown-secs');

  function updateCountdown() {
    const now    = new Date().getTime();
    const target = new Date(WEDDING_DATE).getTime();
    const diff   = target - now;

    if (diff <= 0) {
      daysEl.textContent  = '0';
      hoursEl.textContent = '0';
      minsEl.textContent  = '0';
      secsEl.textContent  = '0';
      return;
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent  = days;
    hoursEl.textContent = String(hours).padStart(2, '0');
    minsEl.textContent  = String(mins).padStart(2, '0');
    secsEl.textContent  = String(secs).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);


  // ============================================================
  // 4. RSVP & GUESTBOOK (localStorage)
  // ============================================================
  const rsvpForm    = document.getElementById('rsvp-form');
  const wishesList  = document.getElementById('wishes-list');
  const STORAGE_KEY = 'wedding_wishes';

  // Load existing wishes
  function loadWishes() {
    const wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    renderWishes(wishes);
  }

  function renderWishes(wishes) {
    if (wishes.length === 0) {
      wishesList.innerHTML = '<p class="wishes-empty">Belum ada ucapan. Jadilah yang pertama! 💐</p>';
      return;
    }

    // Tampilkan yang terbaru di atas
    wishesList.innerHTML = wishes
      .slice()
      .reverse()
      .map(w => {
        const statusClass = w.status === 'Hadir' ? 'hadir' : w.status === 'Tidak Hadir' ? 'tidak' : 'ragu';
        const statusEmoji = w.status === 'Hadir' ? '✓' : w.status === 'Tidak Hadir' ? '✗' : '?';
        return `
          <div class="wish-card">
            <div class="wish-header">
              <span class="wish-name">${escapeHtml(w.name)}</span>
              <span class="wish-time">${w.time}</span>
            </div>
            <span class="wish-status ${statusClass}">${statusEmoji} ${w.status}</span>
            ${w.message ? `<p class="wish-text">${escapeHtml(w.message)}</p>` : ''}
          </div>
        `;
      })
      .join('');
  }

  // Sanitasi HTML
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Format waktu
  function formatTime(date) {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Submit form
  rsvpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('rsvp-name').value.trim();
    const guests  = document.getElementById('rsvp-guests').value;
    const status  = document.getElementById('rsvp-status').value;
    const message = document.getElementById('rsvp-message').value.trim();

    if (!name) return;

    const wish = {
      name,
      guests,
      status,
      message,
      time: formatTime(new Date())
    };

    const wishes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    wishes.push(wish);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));

    renderWishes(wishes);
    rsvpForm.reset();

    // Scroll ke daftar ucapan
    wishesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  loadWishes();


  // ============================================================
  // 5. CLIPBOARD — Salin Nomor Rekening
  // ============================================================
  const copyButtons = document.querySelectorAll('.btn-copy');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showCopyFeedback(btn);
          showToast('Nomor rekening berhasil disalin! 📋');
        });
      } else {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showCopyFeedback(btn);
        showToast('Nomor rekening berhasil disalin! 📋');
      }
    });
  });

  function showCopyFeedback(btn) {
    const originalText = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Tersalin!`;

    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = originalText;
    }, 2000);
  }


  // ============================================================
  // 6. TOAST NOTIFICATION
  // ============================================================
  const toastEl = document.getElementById('toast');

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');

    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2500);
  }


  // ============================================================
  // 7. GOOGLE MAPS BUTTON
  // ============================================================
  const mapButtons = document.querySelectorAll('.btn-maps');

  mapButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const coords = btn.getAttribute('data-coords');
      if (coords) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${coords}`, '_blank');
      }
    });
  });


  // ============================================================
  // 8. GLIGHTBOX INIT
  // ============================================================
  if (typeof GLightbox !== 'undefined') {
    GLightbox({
      selector: '.gallery-link',
      touchNavigation: true,
      loop: true,
      closeOnOutsideClick: true
    });
  }

});
