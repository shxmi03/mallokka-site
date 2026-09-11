/* Mallokka — site.js
   Jedan fajl za sve stranice. Sve je omotano u DOMContentLoaded i svaki
   dio se feature-detektira, pa isti skriptu radi bez grešaka na svakoj stranici.
   Čisti ES6, bez build koraka. Jedina vanjska ovisnost je three.js (CDN, samo hero). */

// Formspree endpoint — zamijeniti 'REPLACE_ME' pravim ID-om kad bude spreman.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/REPLACE_ME';

// Kontakt e-mail za mailto fallback.
const CONTACT_EMAIL = 'mallokka.agency@gmail.com';

// Ključ u localStorage za spremanje izbora teme.
const THEME_KEY = 'mallokka-theme';

// Boje pozadine za <meta name="theme-color"> po temi.
const THEME_COLORS = { light: '#FBF2DE', dark: '#17140E' };

document.addEventListener('DOMContentLoaded', function () {

  /* ========================================================================
     a) THEME TOGGLE
     CSS koristi :root[data-theme="dark"] / :root[data-theme="light"], a bez
     atributa prati @media (prefers-color-scheme). Zato: spremljeni izbor
     postavlja atribut; ako izbora nema, NE diramo atribut (pusti sustav).
     ======================================================================== */
  (function theme() {
    const root = document.documentElement;

    // Postavi ili osvježi upravljani <meta name="theme-color"> bez media atributa
    // kako bi eksplicitno odabrana tema dobila ispravnu boju trake preglednika.
    function setThemeColor(mode) {
      let meta = document.querySelector('meta[name="theme-color"][data-managed]');
      if (!mode) {
        // Nema eksplicitne teme — maknemo upravljani meta, pusti postojeće media-meta.
        if (meta) meta.remove();
        return;
      }
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        meta.setAttribute('data-managed', '');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', THEME_COLORS[mode] || THEME_COLORS.light);
    }

    // Koja je tema trenutno stvarno aktivna (za ikonu) — uzmi atribut ili sustav.
    function activeMode() {
      const attr = root.getAttribute('data-theme');
      if (attr === 'dark' || attr === 'light') return attr;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark' : 'light';
    }

    // Ikone (inline SVG — bez ovisnosti o fontovima; glyph ☾☀ zna ispasti "tofu").
    const ICON_SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M5.2 18.8l1.7-1.7M17.1 6.9l1.7-1.7"/></svg>';
    const ICON_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.7 13.1A8.5 8.5 0 1 1 10.9 3.3a6.6 6.6 0 0 0 9.8 9.8z"/></svg>';

    // Osvježi ikonu dugmeta prema aktivnoj temi (sunce = svijetlo / mjesec = tamno).
    function updateIcon(btn) {
      if (!btn) return;
      btn.innerHTML = activeMode() === 'dark' ? ICON_MOON : ICON_SUN;
    }

    // Primijeni spremljenu temu na učitavanju (ako postoji).
    const saved = (function () {
      try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
    })();
    if (saved === 'dark' || saved === 'light') {
      root.setAttribute('data-theme', saved);
      setThemeColor(saved);
    }

    const btn = document.getElementById('themeBtn');
    if (!btn) return; // dugme ne postoji — ništa dalje
    updateIcon(btn);

    // Klik: cikliraj svijetlo <-> tamno, spremi izbor i osvježi meta/ikonu.
    btn.addEventListener('click', function () {
      const next = activeMode() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      setThemeColor(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* no-op */ }
      updateIcon(btn);
    });
  })();

  /* ========================================================================
     b) THREE.JS HERO — suptilne čestice u brand tonovima.
     Postoji samo na index.html (<canvas id="three-hero">). Guard: ako nema
     THREE, nema canvasa ili korisnik traži smanjeno kretanje — preskoči.
     ======================================================================== */
  (function hero() {
    const canvas = document.getElementById('three-hero');
    if (!canvas) return;
    if (typeof THREE === 'undefined') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let renderer, scene, camera, points, rafId = null, running = false;

    function size() {
      // Dimenzije uzmi iz roditelja (hero sekcija), s razumnim fallbackom.
      const host = canvas.parentElement || canvas;
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || 480;
      return { w: w, h: h };
    }

    try {
      const dim = size();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // ograniči DPR zbog performansi

      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(dpr);
      renderer.setSize(dim.w, dim.h, false);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, dim.w / dim.h, 0.1, 100);
      camera.position.z = 28;

      // Oblak čestica — lagano lebdi. Brand plava za točke.
      const COUNT = 140;
      const positions = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 34;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.PointsMaterial({
        color: 0x6E9BC8,     // --dot, suptilna plava
        size: 0.55,
        transparent: true,
        opacity: 0.55,
        depthWrite: false
      });
      points = new THREE.Points(geom, mat);
      scene.add(points);

      const clock = new THREE.Clock();

      function frame() {
        if (!running) return;
        const t = clock.getElapsedTime();
        // Spora rotacija cijelog oblaka — jeftino i nenametljivo.
        points.rotation.y = t * 0.05;
        points.rotation.x = Math.sin(t * 0.12) * 0.08;
        renderer.render(scene, camera);
        rafId = requestAnimationFrame(frame);
      }

      function start() {
        if (running) return;
        running = true;
        clock.start();
        rafId = requestAnimationFrame(frame);
      }
      function stop() {
        running = false;
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      }

      // Pauza kad je tab skriven — štedi bateriju/CPU.
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else start();
      });

      // Reagiraj na promjenu veličine prozora.
      window.addEventListener('resize', function () {
        const d = size();
        camera.aspect = d.w / d.h;
        camera.updateProjectionMatrix();
        renderer.setSize(d.w, d.h, false);
      });

      start();
    } catch (err) {
      // WebGL nedostupan ili bilo koja greška — tiho odustani, hero radi i bez animacije.
      if (rafId !== null) cancelAnimationFrame(rafId);
    }
  })();

  /* ========================================================================
     c) KONTAKT FORMA — validacija + Formspree POST, s mailto fallbackom.
     Postoji samo na kontakt.html (<form id="contactForm">).
     ======================================================================== */
  (function contact() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const fName = document.getElementById('f1'); // ime (required)
    const fMail = document.getElementById('f2'); // mail (required, email)
    const fPak  = document.getElementById('f3'); // paket (select)
    const fMsg  = document.getElementById('f4'); // poruka (textarea)
    const submitBtn = form.querySelector('button[type="submit"]');

    // Jednostavan, robustan email regex.
    const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Dinamički div za poruke ispod forme (ne alert).
    let note = document.createElement('div');
    note.id = 'formNote';
    note.setAttribute('role', 'status');
    note.setAttribute('aria-live', 'polite');
    note.style.cssText = 'font-size:14px;margin-top:4px;padding:11px 14px;border-radius:11px;display:none';
    form.appendChild(note);

    function showNote(msg, ok) {
      note.textContent = msg;
      note.style.display = 'block';
      note.style.background = ok ? 'var(--blue-tint)' : 'var(--surface-2)';
      note.style.color = 'var(--ink)';
      note.style.border = '1px solid ' + (ok ? 'var(--blue-solid)' : 'var(--line-2)');
    }

    function setBusy(busy) {
      if (!submitBtn) return;
      submitBtn.disabled = busy;
      submitBtn.style.opacity = busy ? '0.6' : '';
      submitBtn.style.cursor = busy ? 'wait' : 'pointer';
    }

    // Sastavi mailto: link iz polja i otvori ga (fallback put).
    function openMailto(data) {
      const subject = 'Upit s web stranice — ' + (data.ime || 'Mallokka');
      const bodyLines = [
        'Ime i objekt: ' + (data.ime || ''),
        'E-mail: ' + (data.mail || ''),
        'Paket: ' + (data.paket || ''),
        '',
        'Poruka:',
        (data.poruka || '')
      ];
      const href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));
      window.location.href = href;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const data = {
        ime: fName ? fName.value.trim() : '',
        mail: fMail ? fMail.value.trim() : '',
        paket: fPak ? fPak.value : '',
        poruka: fMsg ? fMsg.value.trim() : ''
      };

      // Client-side validacija: ime i mail obavezni, mail mora proći regex.
      if (!data.ime) {
        showNote('Molimo upišite ime i objekt.', false);
        if (fName) fName.focus();
        return;
      }
      if (!data.mail || !MAIL_RE.test(data.mail)) {
        showNote('Molimo upišite ispravnu e-mail adresu.', false);
        if (fMail) fMail.focus();
        return;
      }

      // Ako endpoint još nije postavljen — odmah mailto fallback.
      if (FORMSPREE_ENDPOINT.indexOf('REPLACE_ME') !== -1) {
        showNote('Otvaramo vaš mail program s pripremljenom porukom…', true);
        openMailto(data);
        return;
      }

      // Inače pokušaj poslati preko Formspree.
      setBusy(true);
      showNote('Šaljemo vaš upit…', true);

      fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          showNote('Hvala! Vaš upit je poslan. Javljamo se uskoro.', true);
          form.reset();
          // Poruka je uklonjena resetom — vrati je ispod (reset miče samo polja).
          form.appendChild(note);
        })
        .catch(function () {
          // Mreža/endpoint faila — fallback na mailto.
          showNote('Slanje nije uspjelo — otvaramo vaš mail program…', false);
          openMailto(data);
        })
        .finally(function () {
          setBusy(false);
        });
    });
  })();

});
