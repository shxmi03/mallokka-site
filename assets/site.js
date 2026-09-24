/* ============================================================
   MALLOKKA — assets/site.js
   Kontakt forma · privola-vođena analitika · lijeno učitavanje videa

   1) FORM_ENDPOINT — endpoint servisa za slanje forme.
      Formspree : "https://formspree.io/f/xxxxxxxx"
      FormSubmit: "https://formsubmit.co/ajax/mallokka.agency@gmail.com"
      Ako je prazno → forma otvara posjetiteljev mail program (fallback).
   2) GA_MEASUREMENT_ID — GA4 ID, npr. "G-XXXXXXXXXX".
      Ako je prazno → analitika se ne učitava. Učitava se SAMO ako je
      posjetitelj prihvatio kolačiće (localStorage "mk-cookie-consent" = "all").
   ============================================================ */
var FORM_ENDPOINT = "";
var GA_MEASUREMENT_ID = "";
var CONTACT_EMAIL = "mallokka.agency@gmail.com";

/* ---------- kontakt forma ---------- */
(function () {
  var form = document.getElementById("contactForm");
  if (!form) return;
  var status = document.getElementById("formStatus");
  var hint = document.getElementById("formHint");
  var btn = form.querySelector('button[type="submit"]');

  function setStatus(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.style.color = ok ? "var(--ink-2)" : "#B4553F";
  }
  function mailtoFallback() {
    var d = new FormData(form);
    var body = "Ime i objekt: " + (d.get("ime") || "") + "\n" +
               "E-mail: " + (d.get("mail") || "") + "\n" +
               "Paket: " + (d.get("paket") || "") + "\n\n" + (d.get("poruka") || "");
    window.location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Upit s web stranice") +
      "&body=" + encodeURIComponent(body);
  }
  if (FORM_ENDPOINT && hint) {
    hint.textContent = "Podaci se šalju izravno — bez otvaranja mail programa.";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!FORM_ENDPOINT) { mailtoFallback(); return; }

    if (btn) { btn.disabled = true; }
    setStatus("Šaljem upit…", true);
    fetch(FORM_ENDPOINT, {
      method: "POST",
      body: new FormData(form),
      headers: { "Accept": "application/json" }
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json().catch(function () { return {}; });
    }).then(function () {
      form.reset();
      setStatus("Hvala! Upit je poslan — javljamo se u roku od 24 sata.", true);
    }).catch(function () {
      setStatus("Slanje nije uspjelo. Otvaram vaš mail program…", false);
      mailtoFallback();
    }).then(function () {
      if (btn) { btn.disabled = false; }
    });
  });
})();

/* ---------- GA4, vezan na privolu ---------- */
(function () {
  if (!GA_MEASUREMENT_ID) return;
  function consent() {
    try { return localStorage.getItem("mk-cookie-consent"); } catch (e) { return null; }
  }
  function load() {
    if (window.__mkGA) return;
    window.__mkGA = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
  }
  if (consent() === "all") load();
  var acc = document.getElementById("ckAcc");
  if (acc) acc.addEventListener("click", function () { if (consent() === "all") load(); });
})();

/* ---------- video: učitaj/pusti samo kad je u vidnom polju ---------- */
(function () {
  var vids = [].slice.call(document.querySelectorAll("video"));
  if (!vids.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function play(v) { if (reduce) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function stop(v) { try { v.pause(); } catch (e) {} }
  if (!("IntersectionObserver" in window)) { vids.forEach(play); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var visible = en.isIntersecting && !!en.target.closest(".route.active");
      if (visible) play(en.target); else stop(en.target);
    });
  }, { rootMargin: "150px", threshold: 0.25 });
  vids.forEach(function (v) { io.observe(v); });
})();

/* ---------- medij: ulazak u kadar (jedan namjerni pokret sekcije) ----------
   Zamjena za autoplay video. Klasa koja skriva medij (html.mk-reveal) postavlja
   se SAMO ovdje: ako JS ne radi, IntersectionObserver ne postoji ili je ukljucen
   prefers-reduced-motion, sve je vidljivo odmah i nista se ne skriva. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  var blocks = [].slice.call(document.querySelectorAll(".media"));
  if (!blocks.length) return;
  document.documentElement.classList.add("mk-reveal");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      // is-in i kad je element u kadru, i kad ga je brzi skrol vec prosao
      // (top < 0) — inace bi brzi "fling" na mobitelu mogao ostaviti medij skriven
      if (en.isIntersecting || en.boundingClientRect.top < 0) {
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.12 });
  blocks.forEach(function (b) { io.observe(b); });
})();
