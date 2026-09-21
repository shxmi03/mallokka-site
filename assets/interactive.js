/* ==========================================================================
   MALLOKKA — interaktivni moduli (preuzeto iz interaktivno.html, 16.09.2026)
   MODUL A: studio za generativne vizuale   (ruta /studio)
   MODUL B: sezonski graf interesa gostiju  (ruta /sezona)
   p5.js se učitava LIJENO — samo kad se otvori jedna od tih ruta, tako da
   naslovnica ostaje bez dodatnih biblioteka. Sketchevi se pauziraju kad ruta
   nije aktivna, a uz prefers-reduced-motion animacija se zaustavlja.
   ========================================================================== */
(function () {
  "use strict";
  var MLK = window.MLK = window.MLK || { hero: null, lab: null, season: null, ready: false, errors: [] };
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var loading = false, queue = [], bootedStudio = false, bootedSeason = false;

  function loadP5(cb) {
    if (window.p5) { try { cb(); } catch (e) { MLK.errors.push(String(e)); } return; }
    queue.push(cb);
    if (loading) return;
    loading = true;
    var sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/p5.min.js";
    sc.async = true;
    sc.onload = function () {
      try { if (window.p5) p5.disableFriendlyErrors = true; } catch (e) {}
      queue.splice(0).forEach(function (f) { try { f(); } catch (e) { MLK.errors.push(String(e)); } });
      if (REDUCED) setTimeout(function () {
        [MLK.lab && MLK.lab.sketch, MLK.season && MLK.season.sketch].forEach(function (sk) { if (sk) sk.noLoop(); });
      }, 1400);
    };
    sc.onerror = function () { MLK.errors.push("p5.js nije učitan"); };
    document.head.appendChild(sc);
  }

  function bootStudio() {
    if (bootedStudio) return;
    bootedStudio = true;

  /* pomoćna funkcija koju dijele moduli (u originalu je bila uz MODUL 1) */
  function makeFbm(p) {
    return function (x, y, z, oct) {
      var v = 0, a = 1, f = 1, s = 0;
      oct = oct || 3;
      for (var i = 0; i < oct; i++) { v += p.noise(x * f + 11.3, y * f + 7.1, z * f) * a; s += a; a *= .5; f *= 2; }
      return v / s;
    };
  }
    try {
        /* ================================================================
           p5.js — MODUL 2: studio za generativne vizuale
           Koncept: 9 čvrstih točaka („stupovi sadržaja") raspoređenih u
           prsten; čestice putuju noise-poljem i gravitiraju sljedećem
           čvoru, tvoreći svilenkaste trake. Pokazivač gradi negativni
           prostor (odbija čestice), klik stvara nalet + udarni val.
           ================================================================ */
        var LAB = { density: 1.6, structure: 1, tempo: 1, warmth: .35, seed: 1234, paused: false, reseed: null, saveNow: null, particles: function () { return 0; } };

        if (window.p5) {
          new p5(function (p) {
            var W = 1, H = 1, host, stage, trail, parts = [], nodes = [], t = 0, fbm, ro,
                N = 9, seed = LAB.seed, mx = -9999, my = -9999, down = false, waves = [], P = LAB;

            function nodesetup() {
              nodes = [];
              var cx = W / 2, cy = H / 2, R = Math.min(W, H) * .33;
              for (var i = 0; i < N; i++) {
                var a = (i / N) * p.TWO_PI - p.HALF_PI;
                nodes.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a: a, pulse: 0 });
              }
            }

            function spawnOne() {
              var i = (p.random(N)) | 0, n = nodes[i] || { x: W / 2, y: H / 2 };
              var a = p.random(p.TWO_PI), r = p.random(2, 26);
              return {
                x: n.x + Math.cos(a) * r, y: n.y + Math.sin(a) * r, px: 0, py: 0,
                vx: 0, vy: 0, node: i, sp: p.random(.6, 1.7), hue: p.random(), life: p.random(120, 520), heat: 0
              };
            }

            function build() {
              var area = Math.max(1, W * H);
              var n = Math.round(Math.min(4200, area / 620 * LAB.density));
              n = Math.max(180, n);
              parts = [];
              for (var i = 0; i < n; i++) parts.push(spawnOne());
              LAB.particles = function () { return parts.length; };
            }

            function setupCanvas(force) {
              var r = stage.getBoundingClientRect();
              var nw = Math.max(300, Math.round(r.width)), nh = Math.max(220, Math.round(r.height));
              if (!force && trail && nw === W && nh === H) return;
              W = nw; H = nh;
              p.resizeCanvas(W, H, false);
              if (!trail) trail = p.createGraphics(W, H);
              else { trail.remove(); trail = p.createGraphics(W, H); }
              trail.noStroke(); trail.fill(8, 10, 14, 255); trail.rect(0, 0, W, H);
              p.randomSeed(seed); p.noiseSeed(seed);
              nodesetup(); build();
            }

            p.setup = function () {
              host = document.getElementById("lab-canvas");
              stage = document.getElementById("lab-stage");
              var r = stage.getBoundingClientRect();
              W = Math.max(300, Math.round(r.width)); H = Math.max(220, Math.round(r.height));
              var c = p.createCanvas(W, H); c.parent(host);
              p.pixelDensity(1);
              fbm = makeFbm(p);
              setupCanvas(true);
              p.frameRate(60);

              MLK.lab = {
                sketch: p,
                params: function () { return { density: LAB.density, structure: LAB.structure, tempo: LAB.tempo, warmth: LAB.warmth, seed: seed, paused: LAB.paused }; },
                particles: function () { return parts.length; },
                rebuild: function () { build(); },
                setSeed: function (s) { seed = s; p.randomSeed(s); p.noiseSeed(s); nodesetup(); build(); badge(); },
                clear: function () { trail.noStroke(); trail.fill(8, 10, 14, 255); trail.rect(0, 0, W, H); },
                burst: function () { burstAt(W / 2, H / 2); }
              };

              document.getElementById("lab-save").addEventListener("click", function () { p.saveCanvas("mallokka-vizual-" + seed, "png"); });
              document.getElementById("lab-new").addEventListener("click", function () { MLK.lab.setSeed(Math.floor(p.random(99999))); });
              badge();

              ro = new ResizeObserver(function () { setupCanvas(); });
              ro.observe(stage);
            };

            function badge() { document.getElementById("lab-badge").textContent = "seed " + seed; }

            p.mouseMoved = function () { if (p.mouseX > 0 && p.mouseX < W) { mx = p.mouseX; my = p.mouseY; } };
            p.mouseDragged = function () { down = true; mx = p.mouseX; my = p.mouseY; };
            p.mouseReleased = function () { down = false; };
            p.mouseOut = function () { mx = my = -9999; };
            p.mousePressed = function () {
              if (p.mouseX < 0 || p.mouseX > W || p.mouseY < 0 || p.mouseY > H) return;
              burstAt(p.mouseX, p.mouseY);
            };
            p.touchStarted = function () { p.mousePressed(); return true; };  // true = ne blokiraj skrol (mobitel)
            p.touchMoved = function () { mx = p.mouseX; my = p.mouseY; return true; };  // true = dopusti skrol

            function burstAt(x, y) {
              waves.push({ x: x, y: y, r: 4 });
              for (var i = 0; i < 260; i++) {
                var q = spawnOne();
                q.x = x; q.y = y; q.px = x; q.py = y;
                q.vx = p.random(-6, 6); q.vy = p.random(-6, 6); q.life = p.random(40, 160); q.sp = p.random(1.4, 3);
                parts.push(q);
              }
              while (parts.length > 4400) parts.shift();
              p.noiseSeed(seed + p.frameCount % 997);
            }

            function step() {
              var spdBase = .55 * LAB.tempo, sc = LAB.structure * .0019;
              for (var i = 0; i < parts.length; i++) {
                var q = parts[i];
                var a = fbm(q.x * sc, q.y * sc, t * .03, 3) * Math.PI * 4.2;
                var tx = Math.cos(a), ty = Math.sin(a);
                // privlačenje sljedećem čvoru → trake kruže prstenom
                var n2 = nodes[(q.node + 1) % N];
                if (n2) {
                  var rx = n2.x - q.x, ry = n2.y - q.y, rd = Math.sqrt(rx * rx + ry * ry) + .001;
                  var pull = .035 * Math.min(1, rd / 90);
                  tx += (rx / rd) * pull; ty += (ry / rd) * pull;
                  if (rd < 26) { q.node = (q.node + 1) % N; n2.pulse = Math.min(1, n2.pulse + .25); }
                }
                // pokazivač: negativni prostor
                var ddx = q.x - mx, ddy = q.y - my, d2 = ddx * ddx + ddy * ddy, R = down ? 200 : 140;
                if (d2 < R * R && mx > -9000) {
                  var d = Math.sqrt(d2) + .001, f = 1 - d / R;
                  tx += (ddx / d) * f * (down ? 3.4 : 1.9);
                  ty += (ddy / d) * f * (down ? 3.4 : 1.9);
                  q.heat = Math.min(1, q.heat + f * .12);
                }
                q.vx = q.vx * .82 + tx * spdBase * q.sp * .55;
                q.vy = q.vy * .82 + ty * spdBase * q.sp * .55;
                q.px = q.x; q.py = q.y;
                q.x += q.vx; q.y += q.vy;
                q.heat *= .955;
                q.life -= 1;
                if (q.x < -20 || q.x > W + 20 || q.y < -20 || q.y > H + 20 || q.life < 0) {
                  var nq = spawnOne(); q.x = nq.x; q.y = nq.y; q.px = nq.x; q.py = nq.y; q.node = nq.node; q.life = nq.life; q.vx = q.vy = 0; q.heat = 0;
                }
              }
              t += 1;
            }

            function warmCol(k, b) { // toplina palete: 0 = brend plava, 1 = pijesak/amber
              var cool = [149, 187, 234], amb = [250, 208, 217], sand = [254, 243, 213];
              var mixv = LAB.warmth;
              var c1 = [cool[0] + (amb[0] - cool[0]) * mixv, cool[1] + (amb[1] - cool[1]) * mixv, cool[2] + (amb[2] - cool[2]) * mixv];
              var f = k;
              var r = c1[0] + (sand[0] - c1[0]) * f * .55, g = c1[1] + (sand[1] - c1[1]) * f * .55, bl = c1[2] + (sand[2] - c1[2]) * f * .55;
              return [r * b, g * b, bl * b];
            }

            p.draw = function () {
              if (LAB.paused) return;
              step();

              trail.noStroke();
              trail.fill(8, 10, 14, 15);
              trail.rect(0, 0, W, H);

              // prsten vodilja
              trail.noFill(); trail.strokeWeight(.6);
              trail.stroke(149, 187, 234, 16);
              trail.beginShape();
              for (var i = 0; i <= 96; i++) {
                var a = i / 96 * p.TWO_PI - p.HALF_PI, R2 = Math.min(W, H) * .33;
                trail.vertex(W / 2 + Math.cos(a) * R2, H / 2 + Math.sin(a) * R2);
              }
              trail.endShape();

              trail.strokeWeight(1);
              for (var j = 0; j < parts.length; j++) {
                var q = parts[j];
                var k = .5 + .5 * Math.sin(q.x / W * 2.7 + q.y / H * 1.9 - t * .012 + q.hue * 4);
                var b = .55 + .75 * k + q.heat * 1.9;
                var col = warmCol(k, b);
                trail.stroke(col[0], col[1], col[2], 74 + q.heat * 150);
                trail.line(q.px, q.py, q.x, q.y);
              }

              // čvorovi + udarni valovi
              for (var n = 0; n < nodes.length; n++) {
                var nd = nodes[n];
                nd.pulse *= .94;
                var pr = 2.4 + nd.pulse * 9;
                trail.noStroke(); trail.fill(254, 243, 213, 90 + nd.pulse * 150);
                trail.circle(nd.x, nd.y, pr);
                trail.fill(254, 243, 213, 22 + nd.pulse * 60);
                trail.circle(nd.x, nd.y, pr * 4);
              }
              for (var w = waves.length - 1; w >= 0; w--) {
                var wv = waves[w];
                wv.r += 5.5;
                trail.noFill(); trail.strokeWeight(1.2);
                trail.stroke(250, 208, 217, Math.max(0, 150 - wv.r * 1.4));
                trail.circle(wv.x, wv.y, wv.r * 2);
                if (wv.r > 130) waves.splice(w, 1);
              }

              p.background(8, 10, 14);
              p.blendMode(p.ADD);
              p.image(trail, 0, 0);
              p.blendMode(p.BLEND);
              // vignette da vizual sjeda u kadar
              var g = p.drawingContext;
              var grd = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .28, W / 2, H / 2, Math.max(W, H) * .72);
              grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(0,0,0,0.55)");
              g.fillStyle = grd; g.fillRect(0, 0, W, H);
            };
          });
        }
        /* ------------------------------------------------ lab kontrole (DOM) */
        var ctrls = {
          density: function (v) {
            LAB.density = v;
            if (MLK.lab) {
              MLK.lab.rebuild();
              document.getElementById("v-density").textContent = (MLK.lab.particles() / 1000).toFixed(1) + "k";
            } else {
              document.getElementById("v-density").textContent = (Math.round(Math.min(4200, 1300 * v)) / 1000).toFixed(1) + "k";
            }
          },
          structure: function (v) { LAB.structure = v; document.getElementById("v-structure").textContent = v.toFixed(2); },
          tempo: function (v) { LAB.tempo = v; document.getElementById("v-tempo").textContent = v.toFixed(2); },
          warmth: function (v) { LAB.warmth = v; document.getElementById("v-warmth").textContent = Math.round(v * 100) + "%"; }
        };
        document.querySelectorAll("[data-lab]").forEach(function (el) {
          el.addEventListener("input", function () {
            var k = el.getAttribute("data-lab"), raw = parseFloat(el.value);
            ctrls[k](raw / 100);
          });
        });
        ctrls.density(LAB.density); ctrls.structure(LAB.structure); ctrls.tempo(LAB.tempo); ctrls.warmth(LAB.warmth);
        /* -------------------------------------------- tipkovnica + vidljivost */
        document.addEventListener("keydown", function (e) {
          var tag = (e.target.tagName || "").toLowerCase();
          if (tag === "input" || tag === "textarea" || tag === "select") return;
          if (!MLK.lab) return;
          if (e.key === "n" || e.key === "N") { MLK.lab.setSeed(Math.floor(Math.random() * 99999)); }
          if (e.key === "s" || e.key === "S") { MLK.lab.sketch.saveCanvas("mallokka-vizual-" + MLK.lab.params().seed, "png"); }
          if (e.key === " ") { e.preventDefault(); LAB.paused = !LAB.paused; }
        });
    } catch (e) { MLK.errors.push('boot: ' + (e && e.message ? e.message : String(e))); if (window.console) console.error(e); }
  }

  function bootSeason() {
    if (bootedSeason) return;
    bootedSeason = true;
    try {
        /* ================================================================
           p5.js — MODUL 3: sezonski graf
           Koncept: interaktivna krivulja interesa gostiju kroz 12 mjeseci,
           koja se iscrtava s ulaskom u kadar. Ispod krivulje lebdi čestica
           „rada" — sadržaj se priprema prije sezone, ne tijekom nje.
           ================================================================ */
        var SEASON = [
          { m: "Sij", l: "Siječanj", v: 22, n: "Analiza prošle sezone, plan sadržaja za godinu i postavljanje temelja profila." },
          { m: "Velj", l: "Veljača", v: 26, n: "Strategija i kalendar objava za sezonu; priprema vizualnog smjera i ton komunikacije." },
          { m: "Ožu", l: "Ožujak", v: 33, n: "Produkcija sadržaja — snimanja, fotografije jela i prostora prije gužve." },
          { m: "Tra", l: "Travanj", v: 44, n: "Najava sezone, uređivanje Google profila i TripAdvisora, prve kampanje." },
          { m: "Svi", l: "Svibanj", v: 59, n: "Meta kampanje za predsezonu i rezervacije; dnevni ritam objava počinje." },
          { m: "Lip", l: "Lipanj", v: 79, n: "Reels i story sadržaj uživo, oglasi za dolaske, komunikacija s gostima u inboxu." },
          { m: "Srp", l: "Srpanj", v: 96, n: "Vrhunac sezone: svakodnevne objave, eventi, oglašavanje na lokaciji i okolici." },
          { m: "Kol", l: "Kolovoz", v: 100, n: "Pun intenzitet uz live sadržaj; reakcija na recenzije i upravljanje reputacijom." },
          { m: "Ruj", l: "Rujan", v: 84, n: "Produžetak sezone: last minute kampanje, sadržaj za domaće goste i vikend goste." },
          { m: "Lis", l: "Listopad", v: 61, n: "Analiza sezone, zahvale gostima, prikupljanje recenzija i UGC materijala." },
          { m: "Stu", l: "Studeni", v: 39, n: "Blagdanski i zimski sadržaj, priprema ponuda za iduću godinu." },
          { m: "Pro", l: "Prosinac", v: 29, n: "Retencija gostiju, newsletter, plan i budžet kampanja za novu sezonu." }
        ];

        if (window.p5) {
          new p5(function (p) {
            var W = 1, H = 1, host, ro, prog = 0, progTarget = 0, hover = -1, dust = [], t = 0;
            var tipEl, tipM, tipV, tipN;

            function setupCanvas() {
              var r = host.getBoundingClientRect();
              W = Math.max(280, Math.round(r.width)); H = Math.max(200, Math.round(r.height));
              p.resizeCanvas(W, H, false);
              dust = [];
              var dn = Math.round(Math.min(160, W * H / 9000));
              for (var i = 0; i < dn; i++) dust.push({ x: p.random(W), y: p.random(H), s: p.random(.4, 1.6), a: p.random(10, 46), sp: p.random(.1, .5) });
            }

            p.setup = function () {
              host = document.getElementById("season-plot");
              var r = host.getBoundingClientRect();
              W = Math.max(280, Math.round(r.width)); H = Math.max(200, Math.round(r.height));
              var c = p.createCanvas(W, H); c.parent(document.getElementById("season-canvas"));
              p.pixelDensity(1);
              p.frameRate(60);
              setupCanvas(true);
              tipEl = document.getElementById("season-tip");
              tipM = document.getElementById("tip-m"); tipV = document.getElementById("tip-v"); tipN = document.getElementById("tip-n");

              // podaci u tablici za čitače ekrana
              var tb = document.querySelector("#season-table tbody");
              tb.innerHTML = SEASON.map(function (d) { return "<tr><th>" + d.l + "</th><td>" + d.v + "</td><td>" + d.n + "</td></tr>"; }).join("");

              MLK.season = {
                sketch: p,
                progress: function () { return prog; },
                hoverIndex: function () { return hover; },
                setProgress: function (x) { progTarget = Math.max(0, Math.min(1, x)); }
              };
              ro = new ResizeObserver(function () { setupCanvas(); });
              ro.observe(host);
            };

            function updateHover(x) {
              if (x < 0 || x > W) { hover = -1; tipEl.classList.remove("on"); return; }
              var pad = padL(), inner = innerW();
              var i = Math.round(((x - pad) / inner) * (SEASON.length - 1));
              i = Math.max(0, Math.min(SEASON.length - 1, i));
              var hit = Math.abs(x - (pad + (i / (SEASON.length - 1)) * inner)) < inner / (SEASON.length - 1) * .62;
              if (hit) {
                hover = i;
                tipM.textContent = SEASON[i].l;
                tipV.textContent = "indeks interesa: " + SEASON[i].v + " / 100";
                tipN.textContent = SEASON[i].n;
                var xh = pad + (i / (SEASON.length - 1)) * inner;
                tipEl.style.left = Math.round(Math.max(126, Math.min(W - 126, xh))) + "px";
                tipEl.style.top = Math.round(dataY(SEASON[i].v) - 10) + "px";
                tipEl.classList.add("on");
              } else { hover = -1; tipEl.classList.remove("on"); }
            }

            p.mouseMoved = function () { updateHover(p.mouseX); };
            p.mouseOut = function () { hover = -1; tipEl.classList.remove("on"); };
            p.touchStarted = function () { updateHover(p.mouseX); return true; };  // true = ne blokiraj skrol (mobitel)
            p.touchMoved = function () { updateHover(p.mouseX); return true; };   // true = dopusti skrol stranice
            p.touchEnded = function () { return true; };

            function padL() { return W < 520 ? 26 : 44; }
            function padR() { return W < 520 ? 18 : 30; }
            function innerW() { return W - padL() - padR(); }
            function baseY() { return H - (W < 520 ? 52 : 58); }
            function topY() { return 34; }
            function dataY(v) { return baseY() - (v / 100) * (baseY() - topY()); }

            p.draw = function () {
              t += 1;
              prog += (progTarget - prog) * .06;
              p.background(11, 13, 16);

              var small = W < 520;

              // prašina u pozadini (tekstura, nikad prazna pozadina)
              p.noStroke();
              for (var d = 0; d < dust.length; d++) {
                var q = dust[d];
                q.y -= q.sp * .35; q.x += Math.sin((t + d * 30) * .006) * .18;
                if (q.y < -4) { q.y = H + 4; q.x = p.random(W); }
                p.fill(149, 187, 234, q.a * (.6 + .4 * Math.sin((t + d * 17) * .01)));
                p.circle(q.x, q.y, q.s);
              }

              // mreža + skala
              p.strokeWeight(1);
              p.stroke(255, 255, 255, 16);
              for (var g = 0; g <= 4; g++) {
                var y = topY() + (g / 4) * (baseY() - topY());
                p.line(padL(), y, W - padR(), y);
              }
              p.noStroke(); p.fill(255, 255, 255, 72); p.textSize(small ? 9 : 11); p.textAlign(p.RIGHT, p.CENTER);
              for (var g2 = 0; g2 <= 4; g2++) {
                p.text(String(100 - g2 * 25), padL() - 9, topY() + (g2 / 4) * (baseY() - topY()));
              }

              var pad = padL(), inner = innerW(), n = SEASON.length, lastX = pad + inner * prog;

              // ispun ispod krivulje
              var dc = p.drawingContext;
              var grd = dc.createLinearGradient(0, topY(), 0, baseY());
              grd.addColorStop(0, "rgba(149,187,234,0.30)");
              grd.addColorStop(.65, "rgba(149,187,234,0.08)");
              grd.addColorStop(1, "rgba(149,187,234,0)");
              p.noStroke(); p.fill(0, 0);
              dc.save();
              dc.beginPath();
              dc.rect(pad, 0, inner * prog, H);
              dc.clip();
              dc.beginPath();
              dc.moveTo(pad, baseY());
              for (var i2 = 0; i2 < n; i2++) dc.lineTo(pad + (i2 / (n - 1)) * inner, dataY(SEASON[i2].v));
              dc.lineTo(pad + inner, baseY());
              dc.closePath();
              dc.fillStyle = grd; dc.fill();
              dc.restore();

              // krivulja (Catmull-Rom)
              p.noFill(); p.stroke(149, 187, 234, 255); p.strokeWeight(2.4);
              p.beginShape();
              for (var i3 = 0; i3 < n; i3++) {
                var x3 = pad + (i3 / (n - 1)) * inner * prog, y3 = dataY(SEASON[i3].v);
                if (i3 === 0) p.curveVertex(x3, y3);
                p.curveVertex(x3, y3);
                if (i3 === n - 1) p.curveVertex(x3, y3);
              }
              p.endShape();

              // oznake mjeseci: amber prsten = priprema/analiza izvan sezone, plavi halo = sezona
              for (var i4 = 0; i4 < n; i4++) {
                var d4 = SEASON[i4];
                var x4 = pad + (i4 / (n - 1)) * inner * prog, y4 = dataY(d4.v);
                if (x4 > lastX + 1) break;
                var isH = i4 === hover;
                var wob = isH ? 1 + Math.sin(t * .12) * .16 : 1;
                p.noStroke();
                if (d4.v < 55) {                            // prsten = priprema/analiza izvan sezone
                  p.noFill(); p.stroke(250, 208, 217, isH ? 255 : 215); p.strokeWeight(2);
                  p.circle(x4, y4, (isH ? 25 : 18) * wob);
                  p.noStroke();
                }
                p.fill(149, 187, 234, isH ? 210 : 90);      // plavi halo = sezona
                p.circle(x4, y4, (isH ? 17 : 12) * wob);
                p.fill(254, 243, 213, isH ? 255 : 218);
                p.circle(x4, y4, isH ? 8.5 : 5.6);
                if (!small || isH || i4 % 2 === 0) {
                  p.fill(255, 255, 255, isH ? 255 : 130);
                  p.textAlign(p.CENTER, p.TOP);
                  p.textSize(small ? 10 : 12);
                  p.text(d4.m, x4, baseY() + 12);
                }
              }

              // hover vodilica
              if (hover >= 0) {
                var hx = pad + (hover / (n - 1)) * inner * prog, hy = dataY(SEASON[hover].v);
                p.stroke(255, 255, 255, 70); p.strokeWeight(1);
                p.line(hx, hy + 12, hx, baseY());
                // shimmer čestice u stupcu mjeseca (inventirani detalj)
                for (var s2 = 0; s2 < 16; s2++) {
                  var yy = baseY() - ((t * 2.2 + s2 * 40) % (baseY() - topY()));
                  p.noStroke();
                  p.fill(149, 187, 234, 90 * (1 - s2 / 16));
                  p.circle(hx + Math.sin((t + s2 * 12) * .05) * 7, yy, 2.2);
                }
              }

              // os
              p.stroke(255, 255, 255, 40); p.strokeWeight(1);
              p.line(padL(), baseY(), W - padR(), baseY());
              p.noStroke(); p.fill(255, 255, 255, 90);
              p.textSize(small ? 10 : 12); p.textAlign(p.RIGHT, p.BOTTOM);
              p.text("indeks interesa gostiju", W - padR(), topY() - 8);
            };
          });
        }
    } catch (e) { MLK.errors.push('boot: ' + (e && e.message ? e.message : String(e))); if (window.console) console.error(e); }
  }

  function runSeasonProgress() {
    if (!MLK.season) return;
    var t0 = performance.now();
    function step() {
      var k = Math.min(1, (performance.now() - t0) / 900);
      MLK.season.setProgress(k);
      if (k < 1) requestAnimationFrame(step);
    }
    step();
  }

  window.MKX = {
    /* poziva se iz render() pri svakoj promjeni rute */
    onRoute: function (route) {
      if (route === "/studio") loadP5(bootStudio);
      if (route === "/sezona") loadP5(function () { bootSeason(); runSeasonProgress(); });
      [[MLK.lab && MLK.lab.sketch, route === "/studio"],
       [MLK.season && MLK.season.sketch, route === "/sezona"]].forEach(function (pr) {
        var sk = pr[0];
        if (!sk || REDUCED) return;
        if (pr[1]) { sk.loop && sk.loop(); } else { sk.noLoop && sk.noLoop(); }
      });
    }
  };
})();
