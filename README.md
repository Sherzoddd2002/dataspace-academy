# 🚀 DataSpace Academy

**14–18 yoshdagi boshlovchilar uchun Python, Pandas, SQL va Excel'ni o'yin orqali o'rganish platformasi.**

DataSpace Academy 18 haftalik, 54 darslik o'quv dasturini kosmik sarguzasht formatida olib boradi. O'quvchi 9 ta olamni ketma-ket ochadi, interaktiv mashqlarni bajaradi, XP va nishonlar yig'adi, so'ng yakuniy Data Analytics loyihasini himoya qiladi.

## Nimalar bor?

- 9 ta olam, 18 hafta va **54 ta dars** — kurs mundarijasi berilgan tartibda.
- Har darsda hikoya, maqsad, nazariya, topshiriq va hint.
- **🧊 3D olam (Roblox mode)** — haqiqiy Three.js dunyosi: boshqariladigan blokli qahramon, 9 ta tematik orol, NPC mentor BYTE, bilim kristallari va 54 ta 3D missiya maydoni.
- Python 3 — Pyodide orqali brauzerda kodni haqiqiy bajarish; Pandas va Matplotlib paketlari kerakli darsda yuklanadi.
- SQL — SQLite sandbox (sql.js) va mashq uchun tayyor `students`, `courses`, `movies` jadvallari.
- Excel — kataklar, formulalar, saralash, pivot ko'rinishi, diagramma va CSV eksport mini-laboratoriyasi.
- Progress, XP, darajalar, nishonlar va yakuniy sertifikat.
- Akkaunt (Neon Auth), global o‘quvchilar reytingi, mentor paneli va **mehmon rejimi**.
- Akkaunt bilan progress serverda, mehmon rejimida `localStorage` da saqlanadi; JSON eksport/import ham mavjud.
- Responsive interfeys: kompyuter, planshet va telefon (3D olamda sensorli joystik).

## Kurs xaritasi

| Olam | Haftalar | Mavzu |
|---|---:|---|
| 🛰️ DataPort | 1 | Data tushunchasi, kompyuter savodxonligi, Python start |
| 🐍 Pythonia | 2 | Sonlar, matn, input, if/else, list |
| 🧩 Logicara | 3 | for/while, dict, funksiyalar |
| 🗂️ FileForge | 4–5 | Fayllar, mini-o'yin, Pandas, CSV, ustun/qator, filtrlash |
| 📊 Pandoria | 6–7 | Data cleaning, yangi ustun, groupby, statistika, grafiklar |
| 🛸 SQL-Base | 8–10 | Database, SELECT, WHERE, shartlar, saralash, mini-mashqlar |
| 🔗 Queryon | 11–13 | Agregatlar, GROUP BY, HAVING, JOIN, CASE, kino bazasi |
| 🧮 Excelia | 14–16 | Kataklar, formulalar, sort/filter, IF, lookup, Pivot, diagramma, eksport |
| 🌌 Project Nebula | 17–18 | Loyiha rejalash, data cleaning, tahlil, taqdimot, sertifikat |

## Har bir 2 soatlik dars ritmi

| Qism | Vaqt |
|---|---:|
| Takrorlash | 15 daqiqa |
| Yangi mavzu | 45 daqiqa |
| Tanaffus | 10 daqiqa |
| Amaliy mashq | 40 daqiqa |
| Xulosa va uy vazifasi | 10 daqiqa |

## 🧊 3D olam — Roblox uslubidagi o‘quv dunyosi

`3D olam` menyusi (yoki bosh sahifadagi **3D olamda o‘yna** tugmasi) Three.js asosidagi haqiqiy 3D dunyoni ochadi. Bu klassik darslarning o‘rnini bosmaydi, balki **xuddi shu 54 ta darsni o‘yin shaklida** taqdim etadi: 3D missiyani tugatgan o‘quvchi +20 XP oladi, dars bajarilgan deb belgilanadi va nishon ochiladi.

**Dunyo tuzilishi**

- Markaziy `MISSION ARENA` va aylana bo‘ylab joylashgan 9 ta tematik orol (DataPort → Project Nebula). Olamlar ketma-ket ochiladi.
- Blokli (Roblox-style) qahramon: 4 ta kasb rangi, ism yorlig‘i, yurish/sakrash animatsiyasi, uchinchi shaxs kamerasi.
- Har orolda NPC **BYTE** (mavzu tushuntiradi), portal (missiyani boshlaydi) va 3 ta **bilim kristali** (jami 27 ta). Kristal yig‘ilganda shu olam darsining asosiy tushunchasi va misoli ochiladi.
- Radar, ovozli effektlar, to‘liq ekran rejimi va real vaqt rejimida HUD.

**Boshqaruv**

| Tugma | Amal |
|---|---|
| `W A S D` / strelkalar | yurish |
| `SPACE` | sakrash |
| `E` | NPC / portal / kristal / 3D obyekt bilan ta’sir |
| `SHIFT` | yugurish |
| Sichqoncha bilan sudrash | kamerani aylantirish |
| G‘ildirak | yaqinlashtirish |
| `ESC` | muloqot/missiyadan chiqish |
| Telefon | joystik + `JUMP` / `TALK` tugmalari |

**Mavzuga mos 6 ta 3D mini-o‘yin** — barchasi `data/mission-games.json` dagi ma’lumotlardan avtomatik quriladi:

| Mexanika | 3D harakat | O‘rgatadigan mavzu |
|---|---|---|
| `sort` | Signallarni olib, to‘g‘ri rangli qutiga olib borish | Data turlari, fayl kengaytmalari, kategoriyalash |
| `sequence` | Kod platformalariga to‘g‘ri tartibda sakrab chiqish | Kodning yuqoridan pastga bajarilishi, query tartibi |
| `choose` / `formula` / `chart` / `forecast` | To‘g‘ri javob podiumiga chiqish | Statistika, formula, grafik tanlash, trend |
| `clean` | Shubhali qator tabletkalarini belgilash | Bo‘sh katak, dublikat, noto‘g‘ri tur |
| `filter` | Slayder bilan darvoza chegarasini sozlash, yashil qatorlarni o‘tkazish | `WHERE`, boolean filter, shartlar |
| `survey` | Anonim o‘quvchilardan javob yig‘ish | Ma’lumot yig‘ish, maxfiylik, taqsimot |

Har bir missiya: qisqa hikoya → 3D o‘yin → noto‘g‘ri javobda yo‘naltiruvchi hint → to‘g‘ri javobda **«Aha!» izohi** + dars konsepti va kodi → +20 XP → keyingi missiya. Ya’ni o‘yin bezak emas, o‘qitishning asosiy qismi.

**Mehmon rejimi:** birinchi kirish oynasidagi *Mehmon sifatida o‘yna* tugmasi akkauntsiz 3D olamni ochadi. Bu holda XP va bajarilgan missiyalar faqat shu brauzerda saqlanadi; akkauntga kirilganda serverdagi profil ustun turadi.

## Lokal ishga tushirish (Windows)

Python o'rnatilgan bo'lishi shart emas. Papkani ochib, terminalda:

```powershell
cd dataspace-academy
py -m http.server 8000
```

Brauzerda `http://localhost:8000` manzilini oching. `index.html` faylini to'g'ridan-to'g'ri `file://` bilan ochmang — brauzer kurs JSON faylini yuklashni cheklashi mumkin.

## GitHub Pages'ga joylash

Agar bu papka `dataspace-academy/` nomi bilan boshqa repozitoriy ichiga joylashtirilsa, repozitoriy ildizidagi `.github/workflows/deploy-dataspace.yml` workflow shu papkani Pages'ga chiqarishi mumkin. Ushbu mustaqil loyiha papkasi ichida esa `.github/workflows/deploy.yml` alohida repo sifatida joylashtirish uchun berilgan.

1. GitHub repo → **Settings → Pages** ga kiring.
2. **Build and deployment → Source** bo'limida **GitHub Actions** ni tanlang.
3. `main` branch'ga push qiling. Workflow avtomatik ishga tushadi.
4. Actions'dagi `Deploy DataSpace Academy` job muvaffaqiyatli tugagach, Pages URL'ini repo → Settings → Pages bo'limidan oling. GitHub Pages sozlamasini birinchi marta qo'lda yoqish talab qilinadi.

## Texnik arxitektura

- Static site: HTML, CSS, Vanilla JavaScript; build step talab qilmaydi.
- Kurs mundarijasi: `data/curriculum.json`; 54 ta mini-o‘yin ta’rifi: `data/mission-games.json`.
- Klassik interfeys: `js/app.js`; akkaunt/reyting: `js/cloud.js` (Neon Auth + Data API).
- 3D olam: `js/world3d.js` (ES modul) + `assets/world3d.css`. Three.js `r160.1` **repo ichida** `assets/vendor/three.module.min.js` sifatida saqlanadi — 3D uchun tashqi CDN kerak emas, oflayn ham ishlaydi.
- 3D dunyo va klassik darslar `window.DataSpace` ko‘prigi orqali bitta progress/XP tizimiga ulangan.
- Python runtime: Pyodide CDN (`v314.0.7`); SQL runtime: sql.js CDN (`1.14.2`).
- Excel: brauzer ichidagi mini-workbook; ma'lumot CSV ko'rinishida eksport qilinadi.
- Progress: akkaunt bilan serverda (Neon), mehmon rejimida brauzer `localStorage` da.

**Internet talabi:** 3D olam, kurs matnlari, reyting va akkaunt uchun CDN kutubxonasi talab qilinmaydi (reyting/akkaunt serverga ulanadi). Birinchi Python yoki SQL ishga tushishida runtime CDN'dan yuklanadi, shu sababli o'sha darslar uchun internet kerak. Python/Pandas/Matplotlib to'liq paketlari ilk yuklanishda vaqt olishi mumkin. 3D olam WebGL qo'llab-quvvatlanmaydigan brauzerda klassik darslarga yo'naltiruvchi xabar ko'rsatadi.

## Muhim cheklovlar

- Akkaunt (username + parol), serverdagi profil va global reyting mavjud. Mentor paneli esa real-time emas — ro'yxat qo'lda «Yangilash» bosilganda olinadi.
- Mehmon rejimida progress faqat shu brauzerda saqlanadi; keyin akkauntga kirilganda serverdagi profil ustun turadi.
- 3D olam WebGL talab qiladi; juda eski qurilmalarda ishlamasligi mumkin. Klassik darslar bundan mustasno.
- Excel laboratoriyasi o'quv maqsadidagi mini-simulyator; bu Microsoft Excel'ning to'liq o'rnini bosmaydi.
- Sertifikat — platforma ichida yaratiladigan kursni tugatganlik sertifikati; rasmiy akkreditatsiya hujjati emas.
- O'quvchi yozgan kod brauzer ichidagi runtime'da bajariladi; serverga yuborilmaydi.

## Loyihani moslashtirish

- Dars matni, topshiriq va tartib: `data/curriculum.json`.
- Klassik mini-o'yinlar mazmuni: `data/mission-games.json` (3D olam ham shu fayldan o'qiydi).
- Klassik interfeys va o'yin mexanikasi: `js/app.js`.
- 3D olam mantig'i: `js/world3d.js`; 3D HUD dizayni: `assets/world3d.css`.
- Olamlarning nomi/chegaralari: `js/app.js` dagi `WORLDS` va `GAME_ZONES`.
- Dizayn: `assets/styles.css`.

Loyiha Coding Fantasy'dagi amaliy o'rganish, hikoya va darajalar yondashuvidan ilhom olgan, lekin interfeys, syujet, matn va mashqlar DataSpace Academy uchun yangidan yaratilgan.
