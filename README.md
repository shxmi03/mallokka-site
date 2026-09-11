# Mallokka — web stranica

Statična višestranična stranica. Nema baze, nema buildanja, nema ovisnosti o Node-u.
Sve što treba je poslužiti ovaj folder kao obične datoteke.

## Sadržaj

```
index.html      Naslovnica
usluge.html     Usluge (6 glavnih + 4 dodatne)
paketi.html     Paketi i cijene
proces.html     Proces u 5 koraka
radovi.html     Projekti i klijenti
faq.html        Česta pitanja
kontakt.html    Kontakt i forma
404.html        Prilagođena 404 stranica (nepostojeći URL-ovi)
robots.txt      Dozvola za indeksiranje + put do sitemapa
sitemap.xml     Popis svih 7 stranica za Google
assets/
  style.css     Svi stilovi
  site.js       Tema, three.js animacija, kontakt forma
  logo.jpg      Logo
  favicon.png, apple-touch-icon.png
  og-image.jpg  Slika za preview na društvenim mrežama (1200×630)
  v1–v4.mp4     Video pozadine
  v1–v4.jpg     Poster sličice za video
```

## PRIJE OBJAVE — obavezno

Stranica je izgrađena s **`https://mallokka.hr`** kao adresom. Ako ide na drugu domenu,
zamijeni taj tekst u svim datotekama:

```bash
grep -rl "https://mallokka.hr" . | xargs sed -i '' 's|https://mallokka.hr|https://TVOJA-DOMENA|g'
```

(na Linuxu izbaci `''` iza `-i`)

Adresa se pojavljuje u: `<link rel="canonical">`, Open Graph tagovima,
structured data (JSON-LD), `sitemap.xml` i `robots.txt`.

## Objava

**Najlakše — Netlify Drop:** otvori [app.netlify.com/drop](https://app.netlify.com/drop)
i povuci cijeli `mallokka-site` folder u prozor. Stranica je online za par sekundi.
Domenu se poslije doda u postavkama.

**Klasični hosting (cPanel, FTP):** prebaci sadržaj foldera u `public_html/`.
Ništa se ne konfigurira, `index.html` se otvara sam.

**Vercel / GitHub Pages:** rade jednako, folder je već u finalnom obliku.

Jedino što treba na hostingu je **HTTPS** — bez njega Google rangira lošije.
Svi navedeni hostinzi ga daju besplatno.

## Nakon objave — SEO koraci

1. **Google Search Console** — dodaj domenu i pošalji `sitemap.xml`.
   Bez toga Google ne zna da stranica postoji.
2. **Google Business Profile** — otvori profil za Mallokku (Zadar).
   Za lokalnu pretragu ("marketing agencija Zadar") to nosi više od same stranice.
3. Stavi link na stranicu u **Instagram bio** i **linktree** — to su prvi backlinkovi.
4. Provjeri kako izgleda preview linka na
   [opengraph.xyz](https://www.opengraph.xyz) ili u Facebook Sharing Debuggeru.

## Što je ugrađeno za SEO

- Zaseban `<title>`, meta opis i canonical po stranici
- Open Graph i Twitter Card tagovi + preview slika
- JSON-LD structured data:
  - `ProfessionalService` na naslovnici — naziv, kontakt, područje, sva tri paketa s cijenama
  - `FAQPage` na FAQ stranici — 8 pitanja, može se prikazati direktno u Google rezultatima
  - `BreadcrumbList` na podstranicama
- `robots.txt` i `sitemap.xml`
- `lang="hr"`, semantični naslovi, alt tekstovi

## Održavanje

- **Cijene i paketi:** `paketi.html` + blok `hasOfferCatalog` u `index.html`
  (JSON-LD, pri vrhu). Mijenjaj oboje da se ne raziđu.
- **Kontakt:** `kontakt.html`, footer u svim datotekama, i `site.js` (mailto adresa).
- **Boje i tipografija:** varijable na vrhu `assets/style.css`.

## Napomene

- Videi su **AI-generirani** (Seedance 2.0) i služe kao privremeni vizuali.
  Za agenciju koja prodaje produkciju sadržaja vrijedi ih zamijeniti pravim
  snimkama s terena — samo prepiši `assets/v1–v4.mp4` i pripadajuće `.jpg` postere.
- Kontakt forma otvara mail program posjetitelja (`mailto:`). Ako želiš da upiti
  stižu u inbox bez otvaranja maila, treba servis tipa Formspree ili Netlify Forms.
- three.js i Google Fonts se učitavaju s CDN-a, pa stranica traži internet.
