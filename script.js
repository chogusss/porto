(() => {
    'use strict';

    const doc = document;
    const root = doc.documentElement;
    const body = doc.body;
    const qs = (selector, scope = doc) => scope.querySelector(selector);
    const qsa = (selector, scope = doc) => Array.from(scope.querySelectorAll(selector));

    const state = {
        theme: 'dark',
        recruiter: false,
        recruiterOrderApplied: false,
        mobileMenuOpen: false,
        originalMainOrder: [],
        toastTimer: 0,
        developerTimer: 0
    };

    const systemDarkQuery = window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : { matches: true };
    const reducedMotionQuery = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : { matches: false };
    const finePointerQuery = window.matchMedia
        ? window.matchMedia('(pointer: fine)')
        : { matches: false };

    function safeInit(initializer) {
        try {
            initializer();
        } catch (_) {
            // Every enhancement is optional; core links and content remain usable.
        }
    }

    function readStorage(key, fallback) {
        try {
            return window.localStorage.getItem(key) ?? fallback;
        } catch (_) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (_) {
            // Storage can be unavailable in private or restricted browsing contexts.
        }
    }

    function listenToMediaQuery(query, handler) {
        if (!query) return;
        if (typeof query.addEventListener === 'function') query.addEventListener('change', handler);
        else if (typeof query.addListener === 'function') query.addListener(handler);
    }

    function motionIsReduced() {
        return Boolean(reducedMotionQuery.matches || state.recruiter);
    }

    function pointerEffectsAllowed() {
        return Boolean(finePointerQuery.matches && !motionIsReduced());
    }

    function dispatch(name, detail = {}) {
        try {
            doc.dispatchEvent(new CustomEvent(name, { detail }));
        } catch (_) {
            // CustomEvent is supported by target browsers; this is a legacy fallback.
        }
    }

    function syncMotionState() {
        const reduced = motionIsReduced();
        root.classList.toggle('reduce-motion', reduced);
        dispatch('portfolio:motionchange', { reduced });
    }

    function showToast(message, duration = 2200) {
        const toast = qs('#toast');
        if (!toast) return;
        window.clearTimeout(state.toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        state.toastTimer = window.setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    function initLoader() {
        const loader = qs('#loading-intro');
        const status = qs('#loading-status');
        if (!loader) return;

        if (motionIsReduced() || window.matchMedia('(max-width: 767px)').matches) {
            return;
        }

        const startedAt = performance.now();
        let finished = false;
        const statusTimers = [];

        if (status) {
            statusTimers.push(window.setTimeout(() => {
                status.textContent = 'Loading projects...';
            }, 140));
            statusTimers.push(window.setTimeout(() => {
                status.textContent = 'Loading skills...';
            }, 310));
            statusTimers.push(window.setTimeout(() => {
                status.textContent = 'Ready.';
            }, 500));
        }

        const finish = () => {
            if (finished) return;
            finished = true;
            statusTimers.forEach(window.clearTimeout);
            if (status) status.textContent = 'Ready.';
            loader.classList.add('is-loaded', 'is-complete');
            loader.setAttribute('aria-hidden', 'true');
            window.setTimeout(() => {
                loader.hidden = true;
            }, motionIsReduced() ? 0 : 160);
        };

        const finishAfterMinimum = () => {
            const minimum = motionIsReduced() ? 0 : 520;
            const remaining = Math.max(0, minimum - (performance.now() - startedAt));
            window.setTimeout(finish, remaining);
        };

        if (doc.readyState === 'complete') finishAfterMinimum();
        else window.addEventListener('load', finishAfterMinimum, { once: true });

        // Hard upper bound: the intro never blocks the page for one second.
        window.setTimeout(finish, motionIsReduced() ? 80 : 820);
    }

    function initTheme() {
        const select = qs('#theme-select');
        const themeMeta = qs('#theme-color-meta');
        const allowed = new Set(['dark', 'light', 'system']);
        const stored = readStorage('agus-theme', 'dark');

        function applyTheme(preference, persist = true) {
            const validPreference = allowed.has(preference) ? preference : 'dark';
            const resolved = validPreference === 'system'
                ? (systemDarkQuery.matches ? 'dark' : 'light')
                : validPreference;

            state.theme = validPreference;
            root.dataset.theme = resolved;
            root.dataset.themePreference = validPreference;
            root.style.colorScheme = resolved;
            if (select) select.value = validPreference;
            if (themeMeta) themeMeta.setAttribute('content', resolved === 'dark' ? '#070707' : '#f3ead8');
            if (persist) writeStorage('agus-theme', validPreference);
            dispatch('portfolio:themechange', { preference: validPreference, resolved });
        }

        applyTheme(stored, false);
        if (select) {
            select.addEventListener('change', () => applyTheme(select.value));
        }
        listenToMediaQuery(systemDarkQuery, () => {
            if (state.theme === 'system') applyTheme('system', false);
        });
    }

    function initRecruiterMode() {
        const toggle = qs('#recruiter-toggle');
        const summary = qs('#recruiter-summary');
        const main = qs('#main-content');
        if (main) state.originalMainOrder = Array.from(main.children);

        function reorderSections(enabled) {
            if (!main || !state.originalMainOrder.length) return;
            if (!enabled) {
                if (!state.recruiterOrderApplied) return;
                state.originalMainOrder.forEach((node) => main.appendChild(node));
                state.recruiterOrderApplied = false;
                return;
            }

            const priority = [
                'home',
                'recruiter-summary',
                'experience',
                'stack',
                'projects',
                'about',
                'cv',
                'contact'
            ];
            const moved = new Set();
            priority.forEach((id) => {
                const section = doc.getElementById(id);
                if (section && section.parentElement === main) {
                    main.appendChild(section);
                    moved.add(section);
                }
            });
            state.originalMainOrder.forEach((node) => {
                if (!moved.has(node)) main.appendChild(node);
            });
            state.recruiterOrderApplied = true;
        }

        function applyRecruiterMode(enabled, persist = true) {
            state.recruiter = Boolean(enabled);
            root.classList.toggle('recruiter-mode', state.recruiter);
            if (toggle) {
                toggle.setAttribute('aria-pressed', String(state.recruiter));
                toggle.classList.toggle('is-active', state.recruiter);
                toggle.title = state.recruiter
                    ? 'Matikan mode recruiter'
                    : 'Prioritaskan informasi untuk recruiter';
            }
            if (summary) summary.hidden = !state.recruiter;
            reorderSections(state.recruiter);
            syncMotionState();
            if (persist) writeStorage('agus-recruiter-mode', state.recruiter ? 'true' : 'false');
            dispatch('portfolio:recruitermode', { enabled: state.recruiter });
        }

        applyRecruiterMode(readStorage('agus-recruiter-mode', 'false') === 'true', false);
        if (toggle) {
            toggle.addEventListener('click', () => {
                applyRecruiterMode(!state.recruiter);
                showToast(state.recruiter ? 'Recruiter mode aktif.' : 'Recruiter mode nonaktif.');
            });
        }

        listenToMediaQuery(reducedMotionQuery, syncMotionState);
    }

    function openDialogs() {
        return qsa('dialog[open]');
    }

    function syncBodyLock() {
        body.classList.toggle('menu-open', state.mobileMenuOpen);
        body.classList.toggle('dialog-open', openDialogs().length > 0);
    }

    function focusableElements(container) {
        if (!container) return [];
        return qsa(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            container
        ).filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
    }

    function initMobileMenu() {
        const button = qs('#menu-toggle');
        const menu = qs('#mobile-menu');
        const commandTrigger = qs('#mobile-command-trigger');
        if (!button || !menu) return;

        function openMenu() {
            if (state.mobileMenuOpen) return;
            state.mobileMenuOpen = true;
            menu.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            button.setAttribute('aria-label', 'Tutup menu');
            button.classList.add('is-active');
            window.requestAnimationFrame(() => menu.classList.add('is-open'));
            syncBodyLock();
            const first = focusableElements(menu)[0];
            if (first) window.setTimeout(() => first.focus(), 0);
        }

        function closeMenu(returnFocus = false) {
            if (!state.mobileMenuOpen) return;
            state.mobileMenuOpen = false;
            menu.classList.remove('is-open');
            menu.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            button.setAttribute('aria-label', 'Buka menu');
            button.classList.remove('is-active');
            syncBodyLock();
            if (returnFocus) button.focus();
        }

        button.addEventListener('click', () => {
            if (state.mobileMenuOpen) closeMenu(true);
            else openMenu();
        });

        qsa('[data-mobile-link]', menu).forEach((link) => {
            link.addEventListener('click', () => closeMenu(false));
        });

        if (commandTrigger) {
            commandTrigger.addEventListener('click', () => {
                closeMenu(false);
                openCommandPalette(button);
            });
        }

        doc.addEventListener('pointerdown', (event) => {
            if (!state.mobileMenuOpen) return;
            const header = qs('#site-header');
            if (header && !header.contains(event.target)) closeMenu(false);
        });

        doc.addEventListener('keydown', (event) => {
            if (!state.mobileMenuOpen) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeMenu(true);
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = focusableElements(menu);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && doc.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && doc.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        if (window.matchMedia) {
            const desktopQuery = window.matchMedia('(min-width: 901px)');
            listenToMediaQuery(desktopQuery, (event) => {
                if (event.matches) closeMenu(false);
            });
        }

        doc.addEventListener('portfolio:closemenu', () => closeMenu(false));
    }

    function targetFromHash(hash) {
        if (!hash || hash === '#') return null;
        try {
            return doc.getElementById(decodeURIComponent(hash.slice(1)));
        } catch (_) {
            return null;
        }
    }

    function scrollToTarget(target, options = {}) {
        if (!target) return;
        const behavior = motionIsReduced() ? 'auto' : 'smooth';
        try {
            target.scrollIntoView({ behavior, block: 'start' });
        } catch (_) {
            target.scrollIntoView();
        }

        if (options.updateHash && target.id) {
            const hash = `#${target.id}`;
            if (window.location.hash !== hash) {
                try {
                    window.history.pushState(null, '', hash);
                } catch (_) {
                    // Hash updates are non-essential when history is restricted.
                }
            }
        }

        if (options.focus) {
            const naturallyFocusable = target.matches('a,button,input,select,textarea,[tabindex]');
            if (!naturallyFocusable) target.setAttribute('tabindex', '-1');
            try {
                target.focus({ preventScroll: true });
            } catch (_) {
                target.focus();
            }
            if (!naturallyFocusable) {
                target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
            }
        }
        dispatch('portfolio:navigate', { id: target.id });
    }

    function initSafeAnchorNavigation() {
        doc.addEventListener('click', (event) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const anchor = event.target.closest('a[href^="#"]');
            if (!anchor) return;
            const href = anchor.getAttribute('href');
            const target = targetFromHash(href);
            if (!target) return;
            event.preventDefault();
            dispatch('portfolio:closemenu');
            scrollToTarget(target, {
                updateHash: true,
                focus: anchor.classList.contains('skip-link')
            });
        });
    }

    function initScrollUI() {
        const progress = qs('#scroll-progress-bar');
        const header = qs('#site-header');
        let frame = 0;

        function update() {
            frame = 0;
            const scrollTop = window.scrollY || root.scrollTop || 0;
            let value = 0;
            if (scrollTop > 0) {
                const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
                value = Math.min(1, Math.max(0, scrollTop / maxScroll));
            }
            if (progress) {
                progress.style.transform = `scaleX(${value})`;
            }
            if (header) header.classList.toggle('is-scrolled', scrollTop > 12);
        }

        function schedule() {
            if (!frame) frame = window.requestAnimationFrame(update);
        }

        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule, { passive: true });
    }

    function initActiveNavigation() {
        const links = qsa('[data-nav-link], .mobile-bottom-nav a');
        const sectionIds = new Set(links
            .map((link) => link.getAttribute('href'))
            .filter((href) => href && href.startsWith('#'))
            .map((href) => href.slice(1)));
        const sections = Array.from(sectionIds)
            .map((id) => doc.getElementById(id))
            .filter(Boolean);
        if (!links.length || !sections.length) return;
        const ratios = new Map();
        let trackingStarted = false;

        function activate(id) {
            links.forEach((link) => {
                const active = link.getAttribute('href') === `#${id}`;
                link.classList.toggle('is-active', active);
                if (active) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
        }

        function startTracking() {
            if (trackingStarted) return;
            trackingStarted = true;
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
                    });
                    const visible = Array.from(ratios.entries())
                        .sort((a, b) => b[1] - a[1])
                        .find((entry) => entry[1] > 0);
                    if (visible) activate(visible[0]);
                }, {
                    rootMargin: '-18% 0px -58% 0px',
                    threshold: [0, 0.1, 0.25, 0.5, 0.75]
                });
                sections.forEach((section) => observer.observe(section));
                return;
            }

            let ticking = false;
            const update = () => {
                ticking = false;
                const marker = window.scrollY + window.innerHeight * 0.35;
                let current = sections[0];
                sections.forEach((section) => {
                    if (section.offsetTop <= marker) current = section;
                });
                activate(current.id);
            };
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    ticking = true;
                    window.requestAnimationFrame(update);
                }
            }, { passive: true });
            window.requestAnimationFrame(update);
        }

        const initial = targetFromHash(window.location.hash);
        if (initial && initial.id) activate(initial.id);
        window.addEventListener('scroll', startTracking, { once: true, passive: true });
        window.addEventListener('pointerdown', startTracking, { once: true, passive: true });
        window.addEventListener('keydown', startTracking, { once: true });
        doc.addEventListener('portfolio:navigate', (event) => {
            if (event.detail && event.detail.id) activate(event.detail.id);
        });
    }

    function initRevealAnimations() {
        if (window.matchMedia('(max-width: 767px)').matches) return;
        const elements = qsa('.reveal').filter((element) => !element.closest('.hero'));
        if (!elements.length) return;

        let observer = null;
        const revealAll = () => {
            elements.forEach((element) => element.classList.add('is-visible'));
            if (observer) observer.disconnect();
        };

        if (motionIsReduced() || !('IntersectionObserver' in window)) {
            revealAll();
            return;
        }

        const groups = new Map();
        elements.forEach((element) => {
            const group = element.closest('main > section, .site-footer') || element;
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group).push(element);
        });

        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const groupElements = groups.get(entry.target) || [entry.target];
                groupElements.forEach((element) => {
                    const delay = Math.min(600, Math.max(0, Number(element.dataset.delay) || 0));
                    element.style.setProperty('--reveal-delay', `${delay}ms`);
                    element.classList.add('is-visible');
                });
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        groups.forEach((_, group) => observer.observe(group));

        doc.addEventListener('portfolio:motionchange', (event) => {
            if (event.detail && event.detail.reduced) revealAll();
        });
    }

    function initPointerEffects() {
        if (!finePointerQuery.matches) return;
        const spotlight = qs('.page-spotlight');
        const cursor = qs('#custom-cursor');
        const parallaxItems = qsa('[data-parallax]');
        const magneticItems = qsa('.magnetic');
        const spotlightCards = qsa('.spotlight-card');
        let pointerFrame = 0;
        let latestX = window.innerWidth / 2;
        let latestY = window.innerHeight / 2;

        function resetEffects() {
            root.classList.toggle('cursor-ready', pointerEffectsAllowed());
            if (cursor) {
                cursor.classList.remove('is-visible', 'is-active', 'is-moving');
            }
            parallaxItems.forEach((item) => {
                item.style.setProperty('--parallax-x', '0px');
                item.style.setProperty('--parallax-y', '0px');
            });
            magneticItems.forEach((item) => {
                item.style.setProperty('--magnetic-x', '0px');
                item.style.setProperty('--magnetic-y', '0px');
            });
        }

        function updatePointer() {
            pointerFrame = 0;
            if (!pointerEffectsAllowed()) {
                resetEffects();
                return;
            }
            root.style.setProperty('--spotlight-x', `${latestX}px`);
            root.style.setProperty('--spotlight-y', `${latestY}px`);
            if (spotlight) {
                spotlight.style.setProperty('--spotlight-x', `${latestX}px`);
                spotlight.style.setProperty('--spotlight-y', `${latestY}px`);
            }
            if (cursor) {
                cursor.style.transform = `translate3d(${latestX}px, ${latestY}px, 0) translate(-50%, -50%)`;
                cursor.classList.add('is-visible');
            }
            const normalizedX = (latestX / Math.max(1, window.innerWidth) - 0.5) * 2;
            const normalizedY = (latestY / Math.max(1, window.innerHeight) - 0.5) * 2;
            parallaxItems.forEach((item) => {
                const amount = Math.max(0, Math.min(1, Number(item.dataset.parallax) || 0.2)) * 24;
                const x = normalizedX * amount;
                const y = normalizedY * amount;
                item.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
                item.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
            });
        }

        doc.addEventListener('pointermove', (event) => {
            latestX = event.clientX;
            latestY = event.clientY;
            if (cursor) {
                const interactive = event.target.closest('a, button, input, select, textarea, [role="button"]');
                cursor.classList.toggle('is-active', Boolean(interactive && pointerEffectsAllowed()));
            }
            if (!pointerFrame) pointerFrame = window.requestAnimationFrame(updatePointer);
        }, { passive: true });

        doc.addEventListener('pointerdown', () => {
            if (cursor && pointerEffectsAllowed()) cursor.classList.add('is-moving');
        }, { passive: true });
        doc.addEventListener('pointerup', () => {
            if (cursor) cursor.classList.remove('is-moving');
        }, { passive: true });
        doc.addEventListener('pointerleave', () => {
            if (cursor) cursor.classList.remove('is-visible');
        });

        spotlightCards.forEach((card) => {
            card.addEventListener('pointermove', (event) => {
                if (!pointerEffectsAllowed()) return;
                const rect = card.getBoundingClientRect();
                card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
                card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
            }, { passive: true });
        });

        magneticItems.forEach((item) => {
            item.addEventListener('pointermove', (event) => {
                if (!pointerEffectsAllowed()) return;
                const rect = item.getBoundingClientRect();
                const x = (event.clientX - rect.left - rect.width / 2) * 0.13;
                const y = (event.clientY - rect.top - rect.height / 2) * 0.13;
                item.style.setProperty('--magnetic-x', `${x.toFixed(2)}px`);
                item.style.setProperty('--magnetic-y', `${y.toFixed(2)}px`);
            });
            item.addEventListener('pointerleave', () => {
                item.style.setProperty('--magnetic-x', '0px');
                item.style.setProperty('--magnetic-y', '0px');
            });
        });

        doc.addEventListener('portfolio:motionchange', resetEffects);
        listenToMediaQuery(finePointerQuery, resetEffects);
        root.classList.toggle('cursor-ready', pointerEffectsAllowed());
    }

    function openNativeDialog(dialog, trigger, focusTarget) {
        if (!dialog) return false;
        const existing = openDialogs().find((item) => item !== dialog);
        if (existing) closeNativeDialog(existing, false);
        dialog.__returnFocus = trigger instanceof HTMLElement ? trigger : doc.activeElement;
        try {
            if (typeof dialog.showModal === 'function') {
                if (!dialog.open) dialog.showModal();
            } else {
                dialog.setAttribute('open', '');
            }
        } catch (_) {
            dialog.setAttribute('open', '');
        }
        dialog.classList.add('is-open');
        syncBodyLock();
        window.requestAnimationFrame(() => {
            const target = focusTarget || focusableElements(dialog)[0];
            if (target) target.focus();
        });
        return true;
    }

    function closeNativeDialog(dialog, restoreFocus = true) {
        if (!dialog || !dialog.hasAttribute('open')) return;
        const returnFocus = dialog.__returnFocus;
        dialog.__restoreFocus = restoreFocus;
        try {
            if (typeof dialog.close === 'function') dialog.close();
            else {
                dialog.removeAttribute('open');
                dialog.dispatchEvent(new Event('close'));
            }
        } catch (_) {
            dialog.removeAttribute('open');
            dialog.dispatchEvent(new Event('close'));
        }
        if (restoreFocus && returnFocus && returnFocus.isConnected && !returnFocus.closest('[hidden]')) {
            window.setTimeout(() => returnFocus.focus(), 0);
        }
    }

    function registerDialog(dialog) {
        if (!dialog || dialog.dataset.registered === 'true') return;
        dialog.dataset.registered = 'true';
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeNativeDialog(dialog);
        });
        dialog.addEventListener('close', () => {
            dialog.classList.remove('is-open');
            syncBodyLock();
        });
        dialog.addEventListener('cancel', () => {
            // Native dialog handles Escape; the close event performs cleanup.
        });
    }

    const CASE_STUDIES = {
        brainbox: {
            number: '01',
            category: 'Academic Management System',
            title: 'BrainBox Learning',
            gallery: [
                'images/academic 1.png',
                'images/academic 2.png',
                'images/academic 3.png',
                'images/academic 4.png',
                'images/academic 5.png'
            ],
            details: [
                { title: 'Project overview', text: 'Sistem akademik berbasis web untuk mengelola siswa, aktivitas pembelajaran, assessment, tryout, dan progress akademik.' },
                { title: 'Problem', text: 'Data dan aktivitas akademik membutuhkan alur pengelolaan terpusat agar operasional dan penelusuran progress lebih mudah dilakukan.' },
                { title: 'Solution', text: 'Aplikasi menggabungkan pengelolaan data akademik, fitur pembelajaran, dan endpoint integrasi dalam satu sistem berbasis PHP dan MySQL.' },
                { title: 'Technology', items: ['PHP', 'MySQL', 'JavaScript', 'REST API', 'Linux', 'Apache'] },
                { title: 'Features', items: ['Student management', 'Learning activities', 'Assessment', 'Tryout', 'Academic progress'] },
                { title: 'My contribution', items: ['Backend Development', 'Database Management', 'REST API', 'Debugging', 'Deployment', 'Server Maintenance'] },
                { title: 'Challenges', text: 'Menjaga konsistensi alur data, menelusuri masalah lintas fitur, dan menyiapkan aplikasi agar stabil saat dijalankan pada Linux dan Apache.' },
                { title: 'Result', text: 'Sistem digunakan untuk mendukung pengelolaan aktivitas dan data akademik dalam satu aplikasi web.' }
            ],
            actions: [
                { label: 'Live website', href: 'https://www.brainboxlearning.id/', external: true }
            ],
            note: 'Source repository is not listed on this portfolio.'
        },
        helpdesk: {
            number: '02',
            category: 'Ticket Management System',
            title: 'Laravel Helpdesk System',
            gallery: ['helpdesk_preview.jpg'],
            details: [
                { title: 'Project overview', text: 'Aplikasi helpdesk berbasis Laravel untuk mencatat, mengelola, dan memantau alur penyelesaian tiket.' },
                { title: 'Problem', text: 'Permintaan bantuan membutuhkan status, kepemilikan, dan akses yang jelas agar tidak tercecer selama proses penanganan.' },
                { title: 'Solution', text: 'Workflow tiket dilengkapi autentikasi, status, role management, dan dashboard admin.' },
                { title: 'Technology', items: ['Laravel', 'PHP', 'MySQL', 'Bootstrap'] },
                { title: 'Features', items: ['User Authentication', 'Ticket Management', 'Ticket Status', 'Admin Dashboard', 'Role Management'] },
                { title: 'My contribution', items: ['Application flow', 'Authentication', 'Ticket workflow', 'Database integration', 'Admin interface'] },
                { title: 'Challenges', text: 'Menyusun hak akses dan perubahan status tiket agar tetap konsisten untuk setiap peran pengguna.' },
                { title: 'Result', text: 'Project ini menunjukkan implementasi alur helpdesk end-to-end menggunakan Laravel dan MySQL.' }
            ],
            actions: [],
            note: 'Source code is not publicly available.'
        },
        netcrft: {
            number: '03',
            category: 'Digital Agency Website',
            title: 'NetCrft Digital Agency',
            gallery: ['agency_preview.jpg'],
            details: [
                { title: 'Project overview', text: 'Website agency digital yang memperkenalkan layanan dan karya melalui layout responsif dengan identitas visual neo-brutalist.' },
                { title: 'Problem', text: 'Informasi layanan perlu disampaikan dengan hierarchy yang cepat dipahami tanpa mengorbankan karakter visual brand.' },
                { title: 'Solution', text: 'Struktur halaman dibuat tegas, responsif, dan dilengkapi interaksi ringan untuk mengarahkan pengunjung ke layanan utama.' },
                { title: 'Technology', items: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'] },
                { title: 'Features', items: ['Responsive layout', 'Service presentation', 'Project showcase', 'Contact calls to action'] },
                { title: 'My contribution', items: ['Interface development', 'Responsive implementation', 'Interaction', 'Deployment'] },
                { title: 'Challenges', text: 'Menjaga tampilan ekspresif tetap nyaman digunakan pada layar desktop dan mobile.' },
                { title: 'Result', text: 'Website dapat diakses secara publik sebagai presentasi layanan NetCrft.' }
            ],
            actions: [
                { label: 'Live website', href: 'https://netcrft.vercel.app/', external: true }
            ]
        }
    };

    const ARCHIVE_GALLERIES = {
        petshop: {
            number: 'A1',
            category: 'Web App Gallery',
            title: 'Pet Shop Website',
            gallery: [
                'images/hewan_Screenshot 2026-07-12 043905.png',
                'images/hewan_Screenshot 2026-07-12 043957.png',
                'images/hewan_Screenshot 2026-07-12 044044.png',
                'images/hewan_Screenshot 2026-07-12 044116.png',
                'images/hewan_Screenshot 2026-07-12 044202.png',
                'images/hewan_Screenshot 2026-07-12 044237.png',
                'images/hewan_Screenshot 2026-07-12 044306.png',
                'images/hewan_Screenshot 2026-07-12 044336.png'
            ],
            details: [
                { title: 'Gallery overview', text: 'Kumpulan tampilan Pet Shop Website dari project archive.' },
                { title: 'Technology', items: ['PHP', 'MySQL', 'JavaScript', 'Responsive Design'] }
            ],
            actions: []
        },
        coffee: {
            number: 'A2',
            category: 'Landing Page Gallery',
            title: 'Coffee Shop Website',
            gallery: [
                'images/kopi_Screenshot 2026-07-12 045543.png',
                'images/kopi_Screenshot 2026-07-12 045945.png',
                'images/kopi_Screenshot 2026-07-12 050004.png',
                'images/kopi_Screenshot 2026-07-12 050026.png',
                'images/kopi_Screenshot 2026-07-12 050054.png',
                'images/kopi_Screenshot 2026-07-12 050129.png',
                'images/kopi_Screenshot 2026-07-12 050152.png'
            ],
            details: [
                { title: 'Gallery overview', text: 'Kumpulan tampilan Coffee Shop Landing Page dari project archive.' },
                { title: 'Technology', items: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'] }
            ],
            actions: []
        },
        property: {
            number: 'A3',
            category: 'Landing Page Gallery',
            title: 'Property Website',
            gallery: [
                'images/hunian_Screenshot 2026-07-12 044811.png',
                'images/hunian_Screenshot 2026-07-12 044957.png',
                'images/hunian_Screenshot 2026-07-12 045129.png',
                'images/hunian_Screenshot 2026-07-12 045155.png',
                'images/hunian_Screenshot 2026-07-12 045218.png',
                'images/hunian_Screenshot 2026-07-12 045243.png',
                'images/hunian_vfyf.png'
            ],
            details: [
                { title: 'Gallery overview', text: 'Kumpulan tampilan Property Landing Page dari project archive.' },
                { title: 'Technology', items: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'] }
            ],
            actions: []
        }
    };

    function createElement(tag, className, text) {
        const element = doc.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    function initCaseStudyDialog() {
        const dialog = qs('#case-modal');
        const closeButton = qs('#case-modal-close');
        const number = qs('#case-modal-number');
        const category = qs('#case-modal-category');
        const title = qs('#case-modal-title');
        const gallery = qs('#case-modal-gallery');
        const content = qs('#case-modal-content');
        const actions = qs('#case-modal-actions');
        if (!dialog || !gallery || !content || !actions) return;
        registerDialog(dialog);

        function renderProject(project) {
            if (!project) return false;
            if (number) number.textContent = project.number || '';
            if (category) category.textContent = project.category || '';
            if (title) title.textContent = project.title || '';

            gallery.replaceChildren();
            (project.gallery || []).forEach((source, index) => {
                const figure = createElement('figure', 'case-gallery__item');
                const image = createElement('img');
                image.src = source;
                image.alt = `${project.title} screenshot ${index + 1}`;
                image.loading = index === 0 ? 'eager' : 'lazy';
                image.decoding = 'async';
                figure.appendChild(image);
                gallery.appendChild(figure);
            });

            content.replaceChildren();
            (project.details || []).forEach((detail) => {
                const section = createElement('section', 'case-detail');
                section.appendChild(createElement('h3', '', detail.title));
                if (detail.text) section.appendChild(createElement('p', '', detail.text));
                if (Array.isArray(detail.items)) {
                    const list = createElement('ul', 'case-detail__list');
                    detail.items.forEach((item) => list.appendChild(createElement('li', '', item)));
                    section.appendChild(list);
                }
                content.appendChild(section);
            });

            actions.replaceChildren();
            (project.actions || []).forEach((action) => {
                const link = createElement('a', 'button button--acid case-action', action.label);
                link.href = action.href;
                if (action.external) {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
                if (action.download) link.setAttribute('download', '');
                actions.appendChild(link);
            });
            if (project.note) actions.appendChild(createElement('p', 'private-note', project.note));
            return true;
        }

        function openProject(project, trigger) {
            if (!renderProject(project)) return;
            openNativeDialog(dialog, trigger, closeButton);
        }

        qsa('[data-case-study]').forEach((trigger) => {
            trigger.addEventListener('click', () => {
                openProject(CASE_STUDIES[trigger.dataset.caseStudy], trigger);
            });
        });

        qsa('[data-gallery]').forEach((trigger) => {
            trigger.addEventListener('click', () => {
                openProject(ARCHIVE_GALLERIES[trigger.dataset.gallery], trigger);
            });
        });

        if (closeButton) closeButton.addEventListener('click', () => closeNativeDialog(dialog));
    }

    function openCommandPalette(trigger) {
        const dialog = qs('#command-palette');
        const search = qs('#command-search');
        if (!dialog) return;
        openNativeDialog(dialog, trigger, search);
        dispatch('portfolio:paletteopen');
    }

    function initCommandPalette() {
        const dialog = qs('#command-palette');
        const search = qs('#command-search');
        const list = qs('#command-list');
        const empty = qs('#command-empty');
        if (!dialog || !search || !list) return;
        registerDialog(dialog);
        const buttons = qsa('button[role="option"]', list);
        let visible = buttons.slice();
        let activeIndex = 0;

        buttons.forEach((button, index) => {
            if (!button.id) button.id = `command-option-${index + 1}`;
            button.setAttribute('aria-selected', 'false');
            button.addEventListener('pointerenter', () => {
                const indexInVisible = visible.indexOf(button);
                if (indexInVisible >= 0) setActive(indexInVisible, false);
            });
        });
        search.setAttribute('aria-controls', list.id);

        function setActive(index, scroll = true) {
            if (!visible.length) {
                activeIndex = -1;
                search.removeAttribute('aria-activedescendant');
                buttons.forEach((button) => {
                    button.classList.remove('is-active');
                    button.setAttribute('aria-selected', 'false');
                });
                return;
            }
            activeIndex = (index + visible.length) % visible.length;
            buttons.forEach((button) => {
                const active = button === visible[activeIndex];
                button.classList.toggle('is-active', active);
                button.setAttribute('aria-selected', String(active));
            });
            const active = visible[activeIndex];
            search.setAttribute('aria-activedescendant', active.id);
            if (scroll) active.scrollIntoView({ block: 'nearest' });
        }

        function filterCommands() {
            const query = search.value.trim().toLocaleLowerCase('id-ID');
            visible = buttons.filter((button) => {
                const matches = !query || button.textContent.toLocaleLowerCase('id-ID').includes(query);
                button.hidden = !matches;
                return matches;
            });
            if (empty) empty.hidden = visible.length > 0;
            setActive(0, false);
        }

        function followCommand(button) {
            if (!button) return;
            const targetSelector = button.dataset.commandTarget;
            const url = button.dataset.commandUrl;
            closeNativeDialog(dialog, false);

            if (targetSelector) {
                const target = targetFromHash(targetSelector);
                window.setTimeout(() => scrollToTarget(target, { updateHash: true }), 0);
                return;
            }

            if (url) {
                try {
                    const parsed = new URL(url, window.location.href);
                    if (parsed.origin !== window.location.origin) {
                        window.open(parsed.href, '_blank', 'noopener,noreferrer');
                    } else {
                        const anchor = createElement('a');
                        anchor.href = parsed.href;
                        anchor.download = '';
                        anchor.hidden = true;
                        body.appendChild(anchor);
                        anchor.click();
                        anchor.remove();
                    }
                } catch (_) {
                    // Invalid command URLs are ignored without breaking the palette.
                }
            }
        }

        search.addEventListener('input', filterCommands);
        list.addEventListener('click', (event) => {
            const button = event.target.closest('button[role="option"]');
            if (button && !button.hidden) followCommand(button);
        });
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActive(activeIndex + 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActive(activeIndex - 1);
            } else if (event.key === 'Enter' && doc.activeElement === search) {
                event.preventDefault();
                followCommand(visible[activeIndex]);
            }
        });
        dialog.addEventListener('close', () => {
            search.value = '';
            filterCommands();
        });
        doc.addEventListener('portfolio:paletteopen', () => {
            search.value = '';
            filterCommands();
        });
        doc.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
                event.preventDefault();
                if (dialog.open) closeNativeDialog(dialog);
                else openCommandPalette(doc.activeElement);
            }
        });
        filterCommands();
    }

    function initProjectFiltering() {
        const search = qs('#project-search');
        const buttons = qsa('[data-project-filter]');
        const cards = qsa('#archive-grid .archive-card');
        const noResults = qs('#no-results');
        if (!cards.length || (!search && !buttons.length)) return;
        let selectedFilter = 'all';
        let filteringStarted = false;
        const hideTimers = new WeakMap();

        function normalize(value) {
            return String(value || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLocaleLowerCase('id-ID');
        }

        function setCardVisibility(card, visible) {
            const oldTimer = hideTimers.get(card);
            if (oldTimer) window.clearTimeout(oldTimer);
            if (visible) {
                card.hidden = false;
                if (filteringStarted) window.requestAnimationFrame(() => card.classList.add('is-visible'));
                return;
            }
            card.classList.remove('is-visible');
            if (motionIsReduced()) {
                card.hidden = true;
            } else {
                const timer = window.setTimeout(() => {
                    card.hidden = true;
                }, 180);
                hideTimers.set(card, timer);
            }
        }

        function applyFilter() {
            const query = normalize(search ? search.value.trim() : '');
            let visibleCount = 0;
            cards.forEach((card) => {
                const haystack = normalize(`${card.dataset.name || ''} ${card.dataset.tags || ''} ${card.textContent || ''}`);
                const matchesText = !query || haystack.includes(query);
                const matchesFilter = selectedFilter === 'all' || normalize(card.dataset.tags).split(/\s+/).includes(selectedFilter);
                const visible = matchesText && matchesFilter;
                if (visible) visibleCount += 1;
                setCardVisibility(card, visible);
            });
            if (noResults) noResults.hidden = visibleCount > 0;
        }

        if (search) search.addEventListener('input', () => {
            filteringStarted = true;
            applyFilter();
        });
        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                filteringStarted = true;
                selectedFilter = normalize(button.dataset.projectFilter || 'all');
                buttons.forEach((item) => {
                    const active = item === button;
                    item.classList.toggle('is-active', active);
                    item.setAttribute('aria-pressed', String(active));
                });
                applyFilter();
            });
        });
    }

    function initGitHubSection() {
        const container = qs('#github-repos');
        const chart = qs('#github-chart');
        const chartFallback = qs('#github-chart-fallback');

        function showChartFallback() {
            if (chart) chart.hidden = true;
            if (chartFallback) chartFallback.hidden = false;
        }

        if (chart) {
            chart.addEventListener('error', showChartFallback, { once: true });
            chart.addEventListener('load', () => {
                if (chart.naturalWidth < 2) showChartFallback();
            }, { once: true });
            if (chart.complete && chart.naturalWidth < 2) showChartFallback();
        }

        if (!container) return;

        function addMeta(card, values) {
            const meta = createElement('div', 'repo-card__meta');
            values.filter(Boolean).forEach((value) => meta.appendChild(createElement('span', '', value)));
            card.appendChild(meta);
        }

        function renderFallback() {
            container.replaceChildren();
            const items = [
                {
                    title: 'Public repositories',
                    description: 'Lihat repository publik, eksperimen, dan project terbaru langsung pada profil GitHub.',
                    meta: ['GitHub profile'],
                    href: 'https://github.com/AgusHidayahtulloh333'
                },
                {
                    title: 'Project source availability',
                    description: 'Sebagian source code belum dipublikasikan. Portfolio ini tetap menampilkan bukti visual dan live project yang tersedia.',
                    meta: ['Public project overview'],
                    href: 'https://github.com/AgusHidayahtulloh333?tab=repositories'
                }
            ];
            items.forEach((item) => {
                const card = createElement('article', 'repo-card repo-card--fallback');
                card.appendChild(createElement('h3', '', item.title));
                card.appendChild(createElement('p', '', item.description));
                addMeta(card, item.meta);
                const link = createElement('a', '', 'Open GitHub profile ->');
                link.href = item.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                card.appendChild(link);
                container.appendChild(card);
            });
            container.dataset.source = 'fallback';
        }

        function renderRepositories(repositories) {
            container.replaceChildren();
            repositories.forEach((repository) => {
                const card = createElement('article', 'repo-card');
                const title = createElement('h3');
                const link = createElement('a', '', repository.name || 'Repository');
                link.href = repository.html_url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                title.appendChild(link);
                card.appendChild(title);
                card.appendChild(createElement('p', '', repository.description || 'Public repository on GitHub.'));

                let updated = '';
                try {
                    updated = new Intl.DateTimeFormat('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }).format(new Date(repository.updated_at));
                } catch (_) {
                    updated = '';
                }
                addMeta(card, [
                    repository.language || 'Code',
                    `Stars ${Number(repository.stargazers_count) || 0}`,
                    updated ? `Updated ${updated}` : ''
                ]);
                container.appendChild(card);
            });
            container.dataset.source = 'api';
        }

        async function loadRepositories() {
            if (typeof window.fetch !== 'function') {
                renderFallback();
                return;
            }
            const controller = typeof AbortController === 'function' ? new AbortController() : null;
            const timeout = window.setTimeout(() => {
                if (controller) controller.abort();
            }, 5000);
            try {
                const response = await window.fetch(
                    'https://api.github.com/users/AgusHidayahtulloh333/repos?sort=updated&per_page=8&type=owner',
                    {
                        headers: { Accept: 'application/vnd.github+json' },
                        signal: controller ? controller.signal : undefined
                    }
                );
                if (!response.ok) throw new Error('GitHub response was not successful.');
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error('GitHub response was not a list.');
                const repositories = data
                    .filter((repository) => {
                        if (!repository || repository.fork || !repository.html_url) return false;
                        try {
                            return new URL(repository.html_url).hostname === 'github.com';
                        } catch (_) {
                            return false;
                        }
                    })
                    .slice(0, 4);
                if (!repositories.length) throw new Error('No public repositories were returned.');
                renderRepositories(repositories);
            } catch (_) {
                renderFallback();
            } finally {
                window.clearTimeout(timeout);
            }
        }

        const githubSection = qs('#github');
        if ('IntersectionObserver' in window && githubSection) {
            const startObserver = () => {
                const observer = new IntersectionObserver((entries) => {
                    if (!entries.some((entry) => entry.isIntersecting)) return;
                    observer.disconnect();
                    loadRepositories();
                }, { rootMargin: '500px 0px', threshold: 0.01 });
                observer.observe(githubSection);
            };
            if (window.location.hash === '#github') loadRepositories();
            else window.addEventListener('scroll', startObserver, { once: true, passive: true });
        } else {
            container.addEventListener('pointerenter', loadRepositories, { once: true });
            container.addEventListener('focusin', loadRepositories, { once: true });
        }
    }

    function initTerminal() {
        const form = qs('#terminal-form');
        const input = qs('#terminal-input');
        const output = qs('#terminal-output');
        if (!form || !input || !output) return;
        const history = [];
        let historyIndex = 0;

        function appendLine(text, className = '') {
            const paragraph = createElement('p', className, text);
            output.appendChild(paragraph);
            while (output.children.length > 45) output.firstElementChild.remove();
            output.scrollTop = output.scrollHeight;
        }

        function appendPrompt(command) {
            const paragraph = createElement('p');
            const prompt = createElement('span', '', 'agus@portfolio:~$ ');
            paragraph.appendChild(prompt);
            paragraph.appendChild(doc.createTextNode(command));
            output.appendChild(paragraph);
        }

        function navigate(id) {
            const target = doc.getElementById(id);
            if (target) window.setTimeout(() => scrollToTarget(target, { updateHash: true }), 100);
        }

        function execute(rawCommand) {
            const command = rawCommand.trim().toLocaleLowerCase('en-US');
            if (!command) return;
            appendPrompt(rawCommand.trim());

            switch (command) {
                case 'help':
                    appendLine('Commands: about, skills, projects, experience, contact, github, whoami, status, clear');
                    break;
                case 'about':
                    appendLine('Agus Hidayahtulloh - Informatics student focused on backend web development.');
                    navigate('about');
                    break;
                case 'skills':
                    appendLine('PHP | Laravel | MySQL | JavaScript | REST API | Linux | Git');
                    navigate('stack');
                    break;
                case 'projects':
                    appendLine('Opening featured projects...');
                    navigate('projects');
                    break;
                case 'experience':
                    appendLine('Opening professional experience...');
                    navigate('experience');
                    break;
                case 'contact':
                    appendLine('Opening contact options...');
                    navigate('contact');
                    break;
                case 'github':
                    appendLine('Opening GitHub activity...');
                    navigate('github');
                    break;
                case 'whoami':
                    appendLine('Agus Hidayahtulloh | Web Developer | Backend Enthusiast');
                    break;
                case 'status':
                case 'developer --status':
                    appendLine('Open to internship and junior developer opportunities.');
                    break;
                case 'developer --skills':
                    appendLine('PHP | Laravel | MySQL | REST API | Linux');
                    break;
                case 'iddqd':
                    appendLine('Developer Mode Activated.');
                    dispatch('portfolio:developermode');
                    break;
                case 'clear':
                    output.replaceChildren();
                    break;
                default:
                    appendLine(`Command not found: ${command}. Type "help".`, 'terminal-error');
            }
            output.scrollTop = output.scrollHeight;
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const command = input.value;
            if (command.trim()) {
                history.push(command);
                historyIndex = history.length;
                execute(command);
            }
            input.value = '';
            input.focus();
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowUp' && history.length) {
                event.preventDefault();
                historyIndex = Math.max(0, historyIndex - 1);
                input.value = history[historyIndex] || '';
            } else if (event.key === 'ArrowDown' && history.length) {
                event.preventDefault();
                historyIndex = Math.min(history.length, historyIndex + 1);
                input.value = history[historyIndex] || '';
            }
        });
    }

    function initCopyEmail() {
        const button = qs('#copy-email');
        if (!button) return;

        async function copyText(value) {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(value);
                return true;
            }
            const textarea = createElement('textarea');
            textarea.value = value;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            body.appendChild(textarea);
            textarea.select();
            let copied = false;
            try {
                copied = doc.execCommand('copy');
            } catch (_) {
                copied = false;
            }
            textarea.remove();
            return copied;
        }

        button.addEventListener('click', async () => {
            const email = button.dataset.email || 'agushidayahtulloh3@gmail.com';
            try {
                const copied = await copyText(email);
                if (!copied) throw new Error('Clipboard operation failed.');
                button.classList.add('is-active');
                showToast('Copied!');
                window.setTimeout(() => button.classList.remove('is-active'), 1400);
            } catch (_) {
                showToast(`Email: ${email}`, 3200);
            }
        });
    }

    function initPrint() {
        const button = qs('#print-portfolio');
        if (button) button.addEventListener('click', () => window.print());
    }

    function initHoverPreview() {
        if (!finePointerQuery.matches) return;
        const preview = qs('#hover-preview');
        const image = preview ? qs('img', preview) : null;
        const projects = qsa('.project-feature[data-preview]');
        if (!preview || !image || !projects.length) return;
        let frame = 0;
        let x = 0;
        let y = 0;

        function position() {
            frame = 0;
            const width = preview.offsetWidth || 280;
            const height = preview.offsetHeight || 180;
            const left = Math.min(window.innerWidth - width - 12, x + 22);
            const top = Math.min(window.innerHeight - height - 12, y + 22);
            preview.style.transform = `translate3d(${Math.max(12, left)}px, ${Math.max(12, top)}px, 0)`;
        }

        function hide() {
            preview.classList.remove('is-visible', 'show');
        }

        projects.forEach((project) => {
            project.addEventListener('pointerenter', () => {
                if (!pointerEffectsAllowed()) return;
                image.src = project.dataset.preview;
                image.alt = '';
                preview.classList.add('is-visible', 'show');
            });
            project.addEventListener('pointermove', (event) => {
                if (!pointerEffectsAllowed()) return;
                x = event.clientX;
                y = event.clientY;
                if (!frame) frame = window.requestAnimationFrame(position);
            }, { passive: true });
            project.addEventListener('pointerleave', hide);
        });
        doc.addEventListener('portfolio:motionchange', hide);
    }

    function initEasterEgg() {
        const overlay = qs('#developer-mode');
        const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;
        let wordBuffer = '';

        function activate() {
            window.clearTimeout(state.developerTimer);
            root.classList.add('developer-mode-active');
            if (overlay) overlay.classList.add('show');
            showToast('Developer Mode Activated \u{1F680}', 2800);
            state.developerTimer = window.setTimeout(() => {
                root.classList.remove('developer-mode-active');
                if (overlay) overlay.classList.remove('show');
            }, 3400);
        }

        doc.addEventListener('portfolio:developermode', activate);

        doc.addEventListener('keydown', (event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            const key = event.key.length === 1 ? event.key.toLocaleLowerCase('en-US') : event.key;

            if (/^[a-z]$/.test(key)) {
                wordBuffer = `${wordBuffer}${key}`.slice(-5);
                if (wordBuffer === 'iddqd') {
                    wordBuffer = '';
                    activate();
                }
            }

            if (key === konami[konamiIndex]) {
                konamiIndex += 1;
                if (konamiIndex === konami.length) {
                    konamiIndex = 0;
                    activate();
                }
            } else {
                konamiIndex = key === konami[0] ? 1 : 0;
            }
        });
    }

    function init() {
        [
            initTheme,
            initRecruiterMode,
            initLoader,
            initMobileMenu,
            initSafeAnchorNavigation
        ].forEach(safeInit);

        const enhancements = [
            initRevealAnimations,
            initScrollUI,
            initActiveNavigation,
            initPointerEffects,
            initCaseStudyDialog,
            initCommandPalette,
            initProjectFiltering,
            initGitHubSection,
            initTerminal,
            initCopyEmail,
            initPrint,
            initHoverPreview,
            initEasterEgg
        ];

        let enhancementIndex = 0;
        const scheduleNext = (callback) => {
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(callback, { timeout: 700 });
            } else {
                window.setTimeout(callback, 16);
            }
        };
        const initializeNext = () => {
            if (enhancementIndex >= enhancements.length) return;
            safeInit(enhancements[enhancementIndex]);
            enhancementIndex += 1;
            if (enhancementIndex < enhancements.length) scheduleNext(initializeNext);
        };
        scheduleNext(initializeNext);
    }

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
