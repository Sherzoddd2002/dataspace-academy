# 🚀 DataSpace Academy

**14–18 yoshdagi boshlovchilar uchun Python, Pandas, SQL va Excel'ni o'yin orqali o'rganish platformasi.**

DataSpace Academy 18 haftalik, 54 darslik o'quv dasturini kosmik sarguzasht formatida olib boradi. O'quvchi 9 ta olamni ketma-ket ochadi, interaktiv mashqlarni bajaradi, XP va nishonlar yig'adi, so'ng yakuniy Data Analytics loyihasini himoya qiladi.

## Nimalar bor?

- 9 ta olam, 18 hafta va **54 ta dars** — kurs mundarijasi berilgan tartibda.
- Har darsda hikoya, maqsad, nazariya, topshiriq va hint.
- Python 3 — Pyodide orqali brauzerda kodni haqiqiy bajarish; Pandas va Matplotlib paketlari kerakli darsda yuklanadi.
- SQL — SQLite sandbox (sql.js) va mashq uchun tayyor `students`, `courses`, `movies` jadvallari.
- Excel — kataklar, formulalar, saralash, pivot ko'rinishi, diagramma va CSV eksport mini-laboratoriyasi.
- Progress, XP, darajalar, nishonlar va yakuniy sertifikat.
- Profil va progress `localStorage` da saqlanadi; JSON eksport/import orqali boshqa qurilmaga ko'chiriladi.
- Responsive interfeys: kompyuter, planshet va telefon.

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

## Lokal ishga tushirish (Windows)

Python o'rnatilgan bo'lishi shart emas. Papkani ochib, terminalda:

```powershell
cd dataspace-academy
py -m http.server 8000
```

Brauzerda `http://localhost:8000` manzilini oching. `index.html` faylini to'g'ridan-to'g'ri `file://` bilan ochmang — brauzer kurs JSON faylini yuklashni cheklashi mumkin.

## GitHub Pages'ga joylash

Repo sozlamalari → **Settings → Pages** bo'limida **Build and deployment → Source** uchun **GitHub Actions** ni tanlang. `main` branch'ga push qiling. `Deploy DataSpace Academy` workflow avtomatik ishga tushadi. Deploy muvaffaqiyatli tugagach, sayt:
`https://sherzoddd2002.github.io/dataspace-academy/`

## Texnik arxitektura

- Static site: HTML, CSS, Vanilla JavaScript; build step talab qilmaydi.
- Kurs mundarijasi: `data/curriculum.json`.
- Python runtime: Pyodide CDN (`v314.0.7`).
- SQL runtime: sql.js CDN (`1.14.2`).
- Excel: brauzer ichidagi mini-workbook; ma'lumot CSV ko'rinishida eksport qilinadi.
- Progress: brauzer `localStorage`.

**Internet talabi:** birinchi Python yoki SQL ishga tushishida runtime CDN'dan yuklanadi. Shu sababli o'quvchining brauzerida internet bo'lishi kerak. Python/Pandas/Matplotlib paketlari ilk yuklanishda vaqt olishi mumkin.

## Muhim cheklovlar

- Login, markaziy server, barcha o'quvchilar uchun umumiy leaderboard va mentorning masofadan ko'radigan real-time paneli bu GitHub Pages versiyasiga kiritilmagan. Progress har bir brauzerda alohida saqlanadi.
- Excel laboratoriyasi o'quv maqsadidagi mini-simulyator; bu Microsoft Excel'ning to'liq o'rnini bosmaydi.
- Sertifikat — platforma ichida yaratiladigan kursni tugatganlik sertifikati; rasmiy akkreditatsiya hujjati emas.
- O'quvchi yozgan kod brauzer ichidagi runtime'da bajariladi; serverga yuborilmaydi.

## Loyihani moslashtirish

- Dars matni, topshiriq va tartib: `data/curriculum.json`.
- Interfeys va o'yin mexanikasi: `js/app.js`.
- Dizayn: `assets/styles.css`.

Loyiha Coding Fantasy'dagi amaliy o'rganish, hikoya va darajalar yondashuvidan ilhom olgan, lekin interfeys, syujet, matn va mashqlar DataSpace Academy uchun yangidan yaratilgan.
