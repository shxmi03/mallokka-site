/* ==========================================================================
   MALLOKKA — interaktivni moduli (bez vanjskih biblioteka)
   MODUL A: sezonski graf interesa gostiju  → ruta /sezona   (inline SVG)
   MODUL B: kalkulator paketa               → ruta /kalkulator
   Graf je vektor (SVG) pa je oštar na svakoj rezoluciji, boje dolaze iz CSS
   varijabli (prati svijetlu/tamnu temu), a geometrija se računa iz stvarne
   veličine okvira — bez razvlačenja i bez praznog dna.
   ========================================================================== */
(function () {
  "use strict";

  var SEASON = [
    { m: "Sij", l: "Siječanj", v: 22, n: "Analiza prošle sezone, plan sadržaja za godinu i postavljanje temelja profila." },
    { m: "Velj", l: "Veljača", v: 26, n: "Strategija i kalendar objava za sezonu; priprema vizualnog smjera i ton komunikacije." },
    { m: "Ožu", l: "Ožujak", v: 33, n: "Produkcija sadržaja — snimanja, fotografije jela i prostora prije gužve." },
    { m: "Tra", l: "Travanj", v: 44, n: "Najava sezone, uređivanje Google profila i TripAdvisora, prve kampanje." },
    { m: "Svi", l: "Svibanj", v: 59, n: "Meta kampanje za predsezonu i rezervacije; dnevni ritam objava počinje." },
    { m: "Lip", l: "Lipanj", v: 79, n: "Reels i story sadržaj uživo, oglasi za dolaske, komunikacija s gostima u inboxu." },
    { m: "Srp", l: "Srpanj", v: 96, n: "Vrhunac sezone: svakodnevne objave, eventi, oglašavanje na lokaciji i okolici." },
    { m: "Kol", l: "Kolovoz", v: 100, n: "Pun intenzitet uz live sadržaj; reakcija na recenzije i upravljanje reputacijom." },
    { m: "Ruj", l: "Rujan", v: 84, n: "Produžetak sezone: last minute kampanje, sadržaj za domaće i goste vikendom." },
    { m: "Lis", l: "Listopad", v: 61, n: "Analiza sezone, zahvale gostima, prikupljanje recenzija i UGC materijala." },
    { m: "Stu", l: "Studeni", v: 39, n: "Blagdanski i zimski sadržaj, priprema ponuda za iduću godinu." },
    { m: "Pro", l: "Prosinac", v: 29, n: "Retencija gostiju, newsletter, plan i budžet kampanja za novu sezonu." }
  ];
  var SEZONA_OD = 50;   /* od kojeg indeksa mjesec nosi oznaku sezone */

  var PKG = {
    growth: {
      nm: "Growth", pr: "520 €", sel: "Growth — 520 €/mj.",
      desc: "Za male biznise koji tek kreću i trebaju profesionalnu prisutnost.",
      inc: ["8 objava mjesečno", "10 storyja mjesečno", "Plan sadržaja", "Osnovni dizajn vizuala", "Mjesečni izvještaj o rezultatima"]
    },
    pro: {
      nm: "Pro", pr: "790 €", sel: "Pro — 790 €/mj.",
      desc: "Za aktivne profile koji žele kontinuirani rast i veću vidljivost.",
      inc: ["12–16 objava mjesečno", "15 storyja mjesečno", "Vođenje 2 društvene mreže", "Osnovno vođenje oglašavanja", "Analiza rezultata i prijedlozi"]
    },
    premium: {
      nm: "Premium", pr: "1.250 €", sel: "Premium — 1.250 €/mj.",
      desc: "Kompletna marketinška podrška i prepuštanje brige o mrežama stručnjacima.",
      inc: ["20+ objava mjesečno", "Svakodnevni story sadržaj", "Postavljanje i vođenje oglasa", "Izrada mjesečne strategije", "Mjesečne konzultacije", "Detaljno izvještavanje"]
    }
  };

  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) { e.setAttribute(k, attrs[k]); }
    return e;
  }
  function txt(s) { var t = document.createElementNS(NS, "text"); t.textContent = s; return t; }

  /* ===================== MODUL A: sezonski graf (SVG) ===================== */
  var chart = (function () {
    var host, tip, tipM, tipV, tipN, svg = null, built = false, geo = null;

    /* glatka krivulja (Cardinal spline -> kubične Bézier) */
    function smooth(pts) {
      if (pts.length < 3) { return "M" + pts.map(function (p) { return p.x + "," + p.y; }).join(" L"); }
      var d = "M" + pts[0].x + "," + pts[0].y, t = 0.22;
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        var c1x = p1.x + (p2.x - p0.x) * t, c1y = p1.y + (p2.y - p0.y) * t;
        var c2x = p2.x - (p3.x - p1.x) * t, c2y = p2.y - (p3.y - p1.y) * t;
        d += " C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " + c2x.toFixed(1) + "," + c2y.toFixed(1) +
             " " + p2.x.toFixed(1) + "," + p2.y.toFixed(1);
      }
      return d;
    }

    function fillTable() {
      var tb = document.querySelector("#season-table tbody");
      if (!tb || tb.children.length) { return; }
      SEASON.forEach(function (s) {
        var tr = document.createElement("tr");
        [s.l, String(s.v), s.n].forEach(function (c) {
          var td = document.createElement("td");
          td.textContent = c;
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
    }

    function show(i, x, y) {
      var s = SEASON[i];
      tipM.textContent = s.l;
      tipV.textContent = "indeks interesa: " + s.v + " / 100";
      tipN.textContent = s.n;
      tip.classList.add("on");
      var half = (tip.offsetWidth || 240) / 2;
      tip.style.left = Math.max(half + 2, Math.min(geo.W - half - 2, x)) + "px";
      tip.style.top = Math.max((tip.offsetHeight || 90) + 6, y - 14) + "px";
    }
    function hide() { if (tip) { tip.classList.remove("on"); } }

    function render() {
      if (!host || !host.clientWidth || !host.clientHeight) { return; }
      var W = Math.round(host.clientWidth), H = Math.round(host.clientHeight);
      if (W < 140 || H < 140) { return; }
      if (svg && svg.parentNode) { svg.parentNode.removeChild(svg); }

      var narrow = W < 560;
      var padL = narrow ? 32 : 54, padR = narrow ? 16 : 30;
      var padT = Math.round(H * 0.16), padB = Math.round(H * 0.20);
      var baseY = H - padB, topY = padT;
      var step = (W - padL - padR) / (SEASON.length - 1);
      var yAt = function (v) { return baseY - (v / 100) * (baseY - topY); };
      var pts = SEASON.map(function (s, i) { return { x: padL + step * i, y: yAt(s.v) }; });
      geo = { W: W, H: H, step: step, padL: padL };

      svg = el("svg", {
        viewBox: "0 0 " + W + " " + H, width: "100%", height: "100%", "class": "mk-svg",
        role: "img", "aria-label": "Sezonski graf interesa gostiju kroz 12 mjeseci; podaci su u tablici ispod grafa."
      });

      var defs = el("defs", {});
      var grad = el("linearGradient", { id: "mkArea", x1: "0", y1: "0", x2: "0", y2: "1" });
      grad.appendChild(el("stop", { offset: "0%", "stop-color": "var(--blue-solid)", "stop-opacity": ".5" }));
      grad.appendChild(el("stop", { offset: "100%", "stop-color": "var(--blue-solid)", "stop-opacity": ".05" }));
      defs.appendChild(grad);
      svg.appendChild(defs);

      [25, 50, 75, 100].forEach(function (v) {
        svg.appendChild(el("line", { x1: padL, y1: yAt(v), x2: W - padR, y2: yAt(v), "class": "mk-grid" }));
        var t = txt(String(v));
        t.setAttribute("x", padL - (narrow ? 7 : 11));
        t.setAttribute("y", yAt(v) + 3.5);
        t.setAttribute("class", "mk-axis");
        t.setAttribute("text-anchor", "end");
        svg.appendChild(t);
      });

      var d = smooth(pts);
      svg.appendChild(el("path", { d: d + " L" + pts[pts.length - 1].x + "," + baseY + " L" + pts[0].x + "," + baseY + " Z", fill: "url(#mkArea)", "class": "mk-area" }));
      svg.appendChild(el("line", { x1: padL, y1: baseY, x2: W - padR, y2: baseY, "class": "mk-base" }));
      svg.appendChild(el("path", { d: d, fill: "none", "class": "mk-curve" }));

      SEASON.forEach(function (s, i) {
        var cx = pts[i].x, cy = pts[i].y, season = s.v >= SEZONA_OD;

        var guide = el("line", { x1: cx, y1: topY, x2: cx, y2: baseY, "class": "mk-guide" });
        svg.appendChild(guide);

        var lab = txt(s.m);
        lab.setAttribute("x", cx);
        lab.setAttribute("y", baseY + (narrow ? 17 : 21));
        lab.setAttribute("text-anchor", "middle");
        lab.setAttribute("class", "mk-month" + (season ? " mk-month-on" : ""));
        svg.appendChild(lab);

        svg.appendChild(el("circle", { cx: cx, cy: cy, r: narrow ? 3.6 : 4.4, "class": "mk-dot " + (season ? "mk-dot-on" : "mk-dot-off") }));

        var hit = el("rect", { x: cx - step / 2, y: topY * 0.4, width: step, height: baseY - topY * 0.4 + padB * 0.55, "class": "mk-hit", tabindex: "0", role: "button", "aria-label": s.l + ", indeks " + s.v });
        hit.addEventListener("mouseenter", function () { guide.classList.add("on"); show(i, cx, cy); });
        hit.addEventListener("mouseleave", function () { guide.classList.remove("on"); hide(); });
        hit.addEventListener("focus", function () { guide.classList.add("on"); show(i, cx, cy); });
        hit.addEventListener("blur", function () { guide.classList.remove("on"); hide(); });
        svg.appendChild(hit);
      });

      var ax = txt("indeks interesa gostiju (0–100)");
      ax.setAttribute("x", W - padR);
      ax.setAttribute("y", Math.max(13, topY - 12));
      ax.setAttribute("class", "mk-axis");
      ax.setAttribute("text-anchor", "end");
      svg.appendChild(ax);

      host.appendChild(svg);
      built = true;
    }

    function init() {
      host = document.getElementById("season-plot");
      if (!host) { return false; }
      tip = document.getElementById("season-tip");
      tipM = document.getElementById("tip-m");
      tipV = document.getElementById("tip-v");
      tipN = document.getElementById("tip-n");
      fillTable();
      render();
      var t = null;
      window.addEventListener("resize", function () {
        if (t) { clearTimeout(t); }
        t = setTimeout(render, 160);
      });
      return true;
    }

    return { init: init, render: render, ready: function () { return built; } };
  })();

  /* ===================== MODUL B: kalkulator paketa ===================== */
  var calc = (function () {
    var root, out;

    function lvl(name) {
      var c = root.querySelector('input[name="' + name + '"]:checked');
      return c ? parseInt(c.value, 10) : 0;
    }

    function update() {
      if (!out) { return; }
      var a = lvl("q1"), b = lvl("q2"), c = lvl("q3");
      if (!a || !b || !c) {
        out.innerHTML = '<p class="mk-calc-empty">Odgovorite na tri pitanja i predložit ću paket.</p>';
        return;
      }
      var total = a + b + c;
      var key = total <= 4 ? "growth" : (total <= 7 ? "pro" : "premium");
      var p = PKG[key];
      var spread = Math.max(a, b, c) - Math.min(a, b, c);
      out.innerHTML =
        '<span class="eyebrow">Predloženi paket</span>' +
        '<div class="mk-calc-pick"><strong>' + p.nm + '</strong>' +
        '<span class="mk-calc-price">' + p.pr + ' <small>/ mj.</small></span></div>' +
        '<p class="body" style="margin:6px 0 12px">' + p.desc + '</p>' +
        '<ul class="mk-calc-inc">' + p.inc.map(function (i) { return "<li>" + i + "</li>"; }).join("") + '</ul>' +
        (spread >= 2 ? '<p class="mk-calc-note">Odgovori se razlikuju u opsegu — možda je bolji <strong>custom paket</strong>; javite se za procjenu.</p>' : '') +
        '<div class="mk-calc-cta"><a class="btn btn-p" href="#/kontakt" data-pkg="' + p.sel + '">Zatraži ponudu za ' + p.nm + '</a>' +
        '<span class="mk-calc-hint">Polje „paket“ u obrascu se ispuni automatski.</span></div>';
    }

    function init() {
      root = document.getElementById("calc");
      if (!root) { return false; }
      out = document.getElementById("calcOut");
      root.addEventListener("change", function (e) {
        if (e.target && /^q[123]$/.test(e.target.name || "")) { update(); }
      });
      root.addEventListener("click", function (e) {
        var a = e.target && e.target.closest ? e.target.closest("a[data-pkg]") : null;
        if (!a) { return; }
        var sel = document.getElementById("f3");
        if (!sel) { return; }
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].text === a.getAttribute("data-pkg")) { sel.selectedIndex = i; break; }
        }
      });
      update();
      return true;
    }

    return { init: init };
  })();

  /* ===================== pokretanje pri promjeni rute ===================== */
  var chartUp = false, calcUp = false;
  window.MKX = {
    onRoute: function (route) {
      if (route === "/sezona") {
        if (!chartUp) { chartUp = chart.init(); }
        if (chartUp) { chart.render(); }
      }
      if (route === "/kalkulator" && !calcUp) { calcUp = calc.init(); }
    }
  };
})();
