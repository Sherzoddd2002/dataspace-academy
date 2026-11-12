(() => {
  'use strict';
  const STORAGE_KEY = 'dataspace-academy-v1';
  const AVATARS = ['🚀','🧑‍🚀','🦊','🐼','🐸','🐯','🦄','🐙'];
  const WORLDS = [
    {name:'DataPort',emoji:'🛰️',subtitle:'Ma’lumotlar olamiga kirish',weeks:'1-hafta',from:0,to:2,theme:'Birinchi signalni tut'},
    {name:'Pythonia',emoji:'🐍',subtitle:'Python asoslari',weeks:'2-hafta',from:3,to:5,theme:'Kodning ilk kuchi'},
    {name:'Logicara',emoji:'🧩',subtitle:'Sikllar, lug‘atlar va funksiyalar',weeks:'3-hafta',from:6,to:8,theme:'Mantiqni ishga tushir'},
    {name:'FileForge',emoji:'🗂️',subtitle:'Fayllar va Pandasga kirish',weeks:'4–5-haftalar',from:9,to:14,theme:'Ma’lumotni tartibga sol'},
    {name:'Pandoria',emoji:'📊',subtitle:'Data cleaning va vizualizatsiya',weeks:'6–7-haftalar',from:15,to:20,theme:'Jadvaldan xulosa top'},
    {name:'SQL-Base',emoji:'🛸',subtitle:'SQL so‘rovlari asoslari',weeks:'8–10-haftalar',from:21,to:29,theme:'Ma’lumotlar bazasini boshqar'},
    {name:'Queryon',emoji:'🔗',subtitle:'Agregatsiya va JOIN',weeks:'11–13-haftalar',from:30,to:38,theme:'Murakkab so‘rovlar'},
    {name:'Excelia',emoji:'🧮',subtitle:'Excel formulalari va dashboard',weeks:'14–16-haftalar',from:39,to:47,theme:'Hisobotni jonlantir'},
    {name:'Project Nebula',emoji:'🌌',subtitle:'Yakuniy Data Analytics loyihasi',weeks:'17–18-haftalar',from:48,to:53,theme:'O‘z loyihangni himoya qil'}
  ];
  const TYPE_LABEL = {quiz:'Bilim sinovi',python:'Python laboratoriyasi',sql:'SQL laboratoriyasi',excel:'Excel laboratoriyasi',project:'Yakuniy loyiha'};
  const TYPE_ICON = {quiz:'✦',python:'🐍',sql:'⌘',excel:'▦',project:'🚀'};
  const TYPE_TAG = {quiz:'violet',python:'cyan',sql:'gold',excel:'green',project:'violet'};
  let lessons = [];
  let profile = loadProfile();
  let activeView = 'dashboard';
  let activeLessonIndex = null;
  let selectedQuiz = null;
  let pyodide = null;
  let pyodidePromise = null;
  let sqlDb = null;
  let sqlPromise = null;
  let sqlEngine = null;
  let editorDirty = false;
  let excelSelected = 'E2';
  let excelCells = {};
  let excelActions = {};
  let currentSqlResults = [];
  const ARCADE_QUESTIONS = [
    {emoji:'🗂️',topic:'DATA SAVODXONLIGI',prompt:'Qaysi variant strukturali data hisoblanadi?',options:['Tartibli ustunli jadval','Tasodifiy ovoz yozuvi','Bitta bezak rasmi','Ranglar palitrasi'],answer:0,why:'Jadvaldagi qatorlar va ustunlar strukturali ma’lumotni ifodalaydi.'},
    {emoji:'🐍',topic:'PYTHON',prompt:'Python’da matnni ekranga chiqarish uchun qaysi buyruq ishlatiladi?',options:['show("Salom")','print("Salom")','echo("Salom")','display.text("Salom")'],answer:1,why:'print() qiymatni konsolga chiqaradi.'},
    {emoji:'🛸',topic:'SQL',prompt:'students jadvalidagi barcha ustunlarni olish uchun qaysi so‘rov to‘g‘ri?',options:['GET ALL students;','SELECT * FROM students;','OPEN students;','SHOW ROWS students;'],answer:1,why:'SELECT * FROM jadval barcha ustun va qatorlarni tanlaydi.'},
    {emoji:'🐼',topic:'PANDAS',prompt:'score qiymati 80 dan katta yoki teng qatorlarni qanday filtrlaysan?',options:['df.sort(80)','df["score"] = 80','df[df["score"] >= 80]','df.remove(80)'],answer:2,why:'Boolean filter shartni qanoatlantirgan qatorlarni qaytaradi.'},
    {emoji:'📈',topic:'VIZUALIZATSIYA',prompt:'Vaqt bo‘yicha o‘zgarish va trendni ko‘rsatish uchun qaysi grafik qulay?',options:['Doiraviy diagramma','Chiziqli grafik','Faqat jadval sarlavhasi','Tasodifiy shakl'],answer:1,why:'Chiziqli grafik vaqt bo‘yicha o‘zgarishlarni ko‘rishga yordam beradi.'},
    {emoji:'🧮',topic:'EXCEL',prompt:'B2 dan B5 gacha kataklardagi sonlarni qo‘shish formulasi qaysi?',options:['=ADD(B2:B5)','=SUM(B2:B5)','=PLUS(B2-B5)','=TOTAL(B2:B5)'],answer:1,why:'SUM diapazondagi qiymatlarni yig‘adi.'},
    {emoji:'🔗',topic:'SQL ANALYTICS',prompt:'Har bir shahar bo‘yicha nechta o‘quvchi borligini hisoblashda qaysi juftlik kerak?',options:['GROUP BY city va COUNT(*)','ORDER BY city va DROP(*)','LIMIT city va SUM(*)','DISTINCT city va DELETE'],answer:0,why:'GROUP BY shaharlar bo‘yicha guruhlaydi, COUNT(*) esa yozuvlarni sanaydi.'}
  ];
  let arcadeState = {phase:'ready',round:0,score:0,streak:0,selected:null,questions:[],reward:''};

  function defaultProfile() {
    return {name:'',avatar:'🚀',xp:0,streak:0,lastActive:'',completed:[],createdAt:new Date().toISOString(),projectChoice:'',projectNotes:'',projectChecks:{},preferences:{},arcadeBest:0,arcadeDailyReward:''};
  }
  function loadProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      return saved && typeof saved === 'object' ? {...defaultProfile(),...saved} : defaultProfile();
    } catch (_) { return defaultProfile(); }
  }
  function saveProfile() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch (e) { console.warn('Progress could not be saved', e); }
    updateChrome();
  }
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function updateStreak() {
    const today = todayKey();
    if (!profile.lastActive) profile.streak = 0;
    else if (profile.lastActive !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
      const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
      profile.streak = profile.lastActive === y ? (profile.streak || 0) + 1 : 0;
    }
    profile.lastActive = today;
    saveProfile();
  }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function percent(done,total) { return total ? Math.round(done/total*100) : 0; }
  function completedCount() { return profile.completed.length; }
  function isDone(index) { return profile.completed.includes(index); }
  function currentLevel() { return Math.floor((profile.xp || 0)/100)+1; }
  function levelTitle() {
    const lv = currentLevel();
    return lv >= 10 ? 'Galaktika ustasi' : lv >= 6 ? 'Data tadqiqotchisi' : lv >= 3 ? 'Kod sayyohi' : 'Yangi sayyoh';
  }
  function getNextLesson() {
    for (let i=0;i<lessons.length;i++) if (!isDone(i)) return i;
    return null;
  }
  function isWorldUnlocked(worldIndex) {
    if (worldIndex === 0) return true;
    const previous = WORLDS[worldIndex-1];
    const range = previous.to-previous.from+1;
    const done = profile.completed.filter(i => i>=previous.from && i<=previous.to).length;
    return done === range;
  }
  function worldProgress(world) {
    const total = world.to-world.from+1;
    const done = profile.completed.filter(i => i>=world.from && i<=world.to).length;
    return {done,total,pct:percent(done,total)};
  }
  function updateChrome() {
    const done = completedCount();
    const pct = percent(done,54);
    const set = (id,value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
    set('side-progress-percent',`${pct}%`); set('side-completed',done); set('xp-count',profile.xp||0); set('streak-count',profile.streak||0);
    set('sidebar-name',profile.name || 'Explorer'); set('sidebar-level',`${currentLevel()}-daraja · ${levelTitle()}`);
    set('sidebar-avatar',profile.avatar || '🚀'); set('side-progress-bar','');
    const bar=document.getElementById('side-progress-bar'); if(bar) bar.style.width=`${pct}%`;
    const topAvatar=document.getElementById('top-profile'); if(topAvatar) topAvatar.textContent=profile.avatar || '🚀';
  }
  function toast(message,type='') {
    const stack=document.getElementById('toast-stack');
    const node=document.createElement('div'); node.className=`toast ${type}`; node.textContent=message; stack.appendChild(node);
    setTimeout(()=>node.remove(),3600);
  }
  function setView(view) {
    activeView=view; activeLessonIndex=null;
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    const labels={dashboard:'Bosh sahifa',map:'Galaktika xaritasi',course:'54 ta dars',arena:'Musobaqa maydoni',achievements:'Mukofotlarim',teacher:'Mentor paneli'};
    const crumb=document.getElementById('breadcrumb-current'); if(crumb) crumb.textContent=labels[view]||'Bosh sahifa';
    document.getElementById('sidebar').classList.remove('open');
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function openProfileModal(first=false) {
    const modal=document.getElementById('modal-card');
    const picked=profile.avatar || '🚀';
    modal.innerHTML=`<div class="eyebrow">${first?'SAYOHATNI BOSHLASH':'PROFIL SOZLAMALARI'}</div>
      <h2 id="modal-title">${first?'Kim Data Explorer bo‘ladi?':'Profilingni sozla'}</h2>
      <p>Ism yoki taxallus yoz. Bu profil faqat shu brauzerda saqlanadi — parol va elektron pochta talab qilinmaydi.</p>
      <label for="profile-name-input">Ism yoki taxallus</label><input id="profile-name-input" maxlength="24" placeholder="Masalan: Ali" value="${esc(profile.name)}">
      <label>Qahramoningni tanla</label><div class="avatar-picker">${AVATARS.map(a=>`<button class="avatar-choice ${a===picked?'selected':''}" type="button" data-avatar-choice="${a}">${a}</button>`).join('')}</div>
      <div class="modal-actions">${first?'':'<button class="btn btn-ghost" data-close-modal>Bekor qilish</button>'}<button class="btn btn-primary" id="save-profile">${first?'Galaktikaga kirish':'Saqlash'} <span>→</span></button></div>`;
    document.getElementById('modal-backdrop').classList.remove('hidden');
    let avatar=picked;
    modal.querySelectorAll('[data-avatar-choice]').forEach(btn=>btn.addEventListener('click',()=>{avatar=btn.dataset.avatarChoice;modal.querySelectorAll('[data-avatar-choice]').forEach(x=>x.classList.toggle('selected',x===btn));}));
    modal.querySelector('#save-profile').addEventListener('click',()=>{
      const name=modal.querySelector('#profile-name-input').value.trim();
      if(!name){toast('Ism yoki taxallus kiriting.','warning');return;}
      profile.name=name;profile.avatar=avatar;saveProfile();closeModal();render();if(first)toast(`Xush kelibsan, ${name}! Birinchi missiyang tayyor.`,'success');
    });
    modal.querySelector('#profile-name-input').addEventListener('keydown',e=>{if(e.key==='Enter')modal.querySelector('#save-profile').click();});
  }
  function closeModal(){document.getElementById('modal-backdrop').classList.add('hidden');}
  function render() {
    updateChrome();
    const root=document.getElementById('app-content');
    if(activeView==='dashboard') root.innerHTML=renderDashboard();
    else if(activeView==='map') root.innerHTML=renderMap();
    else if(activeView==='course') root.innerHTML=renderCourse();
    else if(activeView==='arena') root.innerHTML=renderArena();
    else if(activeView==='achievements') root.innerHTML=renderAchievements();
    else if(activeView==='teacher') root.innerHTML=renderTeacher();
    else root.innerHTML=renderDashboard();
  }
  function renderJourneyTrack() {
    const stops=WORLDS.map((w,i)=>{
      const p=worldProgress(w),unlocked=isWorldUnlocked(i),finished=p.done===p.total;
      const state=finished?'complete':unlocked?'active':'locked';
      return '<button class="journey-stop '+state+'" data-world="'+i+'" aria-label="'+esc(w.name)+' — '+p.done+' / '+p.total+' missiya"><span class="journey-planet">'+w.emoji+'</span><strong>'+(i+1)+'. '+esc(w.name)+'</strong><small>'+p.done+'/'+p.total+' missiya</small></button>';
    }).join('');
    return '<section class="orbit-journey card"><div class="journey-heading"><div><span class="eyebrow">LIVE GALAXY MAP</span><h2>Galaktika bo‘ylab yo‘ling</h2><p>Sayyorani tanla — keyingi missiyang shu yerda kutmoqda.</p></div><span class="tag cyan">'+WORLDS.filter((w,i)=>isWorldUnlocked(i)).length+'/9 olam ochiq</span></div><div class="journey-route">'+stops+'</div></section>';
  }
  function renderDashboard() {
    const done=completedCount(), pct=percent(done,54), next=getNextLesson();
    const wCards=WORLDS.slice(0,6).map((w,i)=>{
      const p=worldProgress(w),unlocked=isWorldUnlocked(i);
      return `<article class="world-mini card ${unlocked?'':'locked'}" data-world="${i}"><span class="world-emoji">${w.emoji}</span><strong>${w.name}</strong><small>${p.done}/${p.total} missiya · ${w.weeks}</small><div class="mini-progress"><i style="width:${p.pct}%"></i></div></article>`;
    }).join('');
    const nextText=next===null?'Barcha missiyalar tugadi!':`#${next+1} · ${lessons[next].title}`;
    return `<section class="hero-panel"><div class="hero-copy"><span class="eyebrow">YANGI AVLOD DATA ANALYTICS AKADEMIYASI</span><h1>Ma’lumotlar olamiga<br><span>xush kelibsan, ${esc(profile.name||'Explorer')}!</span></h1><p>54 ta missiya. 9 ta olam. Python, Pandas, SQL va Excel. Har bir kod — yangi kuch, har bir tahlil — yangi kashfiyot.</p><div class="hero-buttons"><button class="btn btn-primary" data-open-next>${done?'Davom etish':'Sayohatni boshlash'} <span>→</span></button><button class="btn btn-secondary" data-view="map">Galaktikani ko‘r</button></div></div><div class="hero-art"><div class="planet-orb"><span class="planet-moon"></span></div></div></section>
      <section class="hero-stats"><div class="stat-card card"><span class="stat-icon">🎯</span><div><strong>${done}<small style="display:inline;color:#8b9ab7;font-size:10px"> / 54</small></strong><small>Tugallangan missiya</small></div></div><div class="stat-card card"><span class="stat-icon cyan">⚡</span><div><strong>${profile.xp||0}</strong><small>Yig‘ilgan XP</small></div></div><div class="stat-card card"><span class="stat-icon gold">🏅</span><div><strong>${currentLevel()}</strong><small>Explorer darajasi</small></div></div><div class="stat-card card"><span class="stat-icon green">🔥</span><div><strong>${profile.streak||0}</strong><small>Kunlik seriya</small></div></div></section>
      ${renderJourneyTrack()}
      <div class="section-heading"><div><span class="eyebrow">PLAY ZONE · MINI O‘YIN</span><h2>Data Signal Hunt</h2><p>Hozir o‘ynab ko‘r — 5 raund, kamida 3 ta to‘g‘ri javob uchun kunlik 15 XP.</p></div><span class="tag gold">🎮 ARCADE</span></div>
      ${renderSignalGame()}
      <div class="section-heading"><div><span class="eyebrow">SENING MISSIYANG</span><h2>Sayohatni davom ettir</h2><p>${next===null?'Barcha darslarni muvaffaqiyatli yakunlading.':`Keyingi topshiriq: ${esc(nextText)}`}</p></div><button class="text-link" data-view="course">Barcha darslar →</button></div>
      <div class="dashboard-grid"><section><div class="continue-card card"><div class="continue-icon">${next===null?'🏆':TYPE_ICON[lessons[next].kind]}</div><div><strong>${next===null?'Akademiya yakunlandi':esc(nextText)}</strong><small>${next===null?'Sertifikatingni ko‘r':'2 soatlik dars · Kichik missiyalar bilan'}</small></div><button class="btn btn-primary" data-open-next>${next===null?'Sertifikat':'Boshlash'} →</button></div>
      <div class="section-heading"><div><span class="eyebrow">KOSMIK XARITA</span><h2>O‘rganish olamlari</h2></div><button class="text-link" data-view="map">To‘liq xarita →</button></div><div class="world-preview">${wCards}</div></section>
      <aside class="daily-card card"><div class="daily-top"><span class="tag gold">✦ KUNLIK VAZIFA</span><span class="muted" style="font-size:9px">+20 XP</span></div><h3>${done===0?'Birinchi qadamni tashla!':'Bugun bitta missiya zabt et'}</h3><p>Har kuni ozgina amaliyot katta natijaga olib keladi. Bugun navbatdagi darsni yakunlab, galaktikadagi izlaringni qoldir.</p><div class="daily-reward"><span>✧</span> Tajriba +20 XP <span>·</span> Yangi bilim</div><button class="btn btn-secondary" data-open-next style="width:100%">${done===54?'Sertifikatni ko‘r':'Missiyaga kirish'} →</button></aside></div>
      <div class="section-heading"><div><span class="eyebrow">KURSDAGI TARAQQIYOT</span><h2>18 haftalik yo‘l xaritasi</h2><p>Python → Pandas → SQL → Excel → Yakuniy loyiha</p></div><span class="tag cyan">${pct}% bajarildi</span></div><div class="card" style="padding:17px"><div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;margin-bottom:9px"><strong>Umumiy kurs</strong><span class="muted">${done}/54 dars</span></div><div class="progress-track" style="height:8px"><i style="width:${pct}%"></i></div></div><div class="section-heading"><div><h2>Har bir dars qanday o‘tadi?</h2><p>2 soatlik darsning bir xil, qulay ritmi.</p></div><span class="tag cyan">120 daqiqa</span></div><div class="hero-stats"><div class="stat-card card"><span class="stat-icon">↻</span><div><strong>15 <small style="display:inline;font-size:9px;color:#91a0ba">daq</small></strong><small>Takrorlash</small></div></div><div class="stat-card card"><span class="stat-icon cyan">📘</span><div><strong>45 <small style="display:inline;font-size:9px;color:#91a0ba">daq</small></strong><small>Yangi mavzu</small></div></div><div class="stat-card card"><span class="stat-icon gold">☕</span><div><strong>10 <small style="display:inline;font-size:9px;color:#91a0ba">daq</small></strong><small>Tanaffus</small></div></div><div class="stat-card card"><span class="stat-icon green">⌨</span><div><strong>40 <small style="display:inline;font-size:9px;color:#91a0ba">daq</small></strong><small>Amaliy mashq + 10 daq xulosa</small></div></div></div>`;
  }
  function renderMap() {
    return `<section class="map-banner card"><div><span class="eyebrow">GALAKTIKA XARITASI</span><h1>9 olam. Bitta katta kashfiyot.</h1><p>Har bir olam avvalgisini zabt etganingdan keyin ochiladi. Yo‘lingni bosqichma-bosqich qur.</p></div><div class="map-banner-art">🌠</div></section>
      <div class="section-heading"><div><h2>Olamlar xaritasi</h2><p>Olamni tanla va missiyalarga kir.</p></div><span class="tag violet">${WORLDS.filter((w,i)=>isWorldUnlocked(i)).length} / 9 ochiq</span></div>
      <section class="world-grid">${WORLDS.map((w,i)=>{const p=worldProgress(w),unlocked=isWorldUnlocked(i);return `<article class="world-card card ${unlocked?'':'locked'}" data-world="${i}"><div class="world-card-top"><div class="world-illustration">${w.emoji}</div><span class="lock-indicator">${unlocked?'✦':'🔒'}</span></div><h3>${i+1}. ${w.name}</h3><p>${w.subtitle}<br>${w.theme}.</p><div class="world-meta"><span>${w.weeks}</span><strong>${p.done}/${p.total} missiya</strong></div><div class="progress-track"><i style="width:${p.pct}%"></i></div></article>`;}).join('')}</section>`;
  }
  function renderCourse() {
    const weeks=Array.from({length:18},(_,i)=>i+1);
    const activeFilter=window.__courseFilter || 'all';
    const weekHtml=weeks.map(week=>{
      const items=lessons.map((l,i)=>({...l,index:i})).filter(l=>l.week===week && (activeFilter==='all'||l.kind===activeFilter));
      if(!items.length)return '';
      const all=lessons.map((l,i)=>({...l,index:i})).filter(l=>l.week===week);
      const n=all.filter(l=>isDone(l.index)).length;
      return `<section class="week-block card"><div class="week-title"><span class="week-number">${String(week).padStart(2,'0')}</span><div><strong>${week}-hafta</strong><small>${esc(weekTheme(week))}</small></div><div class="week-progress">${n}/3 dars<div class="progress-track" style="width:75px;margin-top:6px"><i style="width:${percent(n,3)}%"></i></div></div></div>${items.map(l=>lessonRow(l.index,l)).join('')}</section>`;
    }).join('');
    return `<div class="section-heading" style="margin-top:0"><div><span class="eyebrow">TO‘LIQ O‘QUV DASTURI</span><h2>54 ta missiya, 18 hafta</h2><p>Siz belgilagan mundarija tartibi to‘liq saqlangan.</p></div><span class="tag cyan">${completedCount()}/54 tugadi</span></div>
      <div class="course-layout"><aside class="course-filter card"><h3>Fan bo‘yicha filter</h3>${[['all','Barchasi','54'],['python','Python + Pandas','19'],['sql','SQL','16'],['excel','Excel','8'],['quiz','Nazariy sinov','5'],['project','Yakuniy loyiha','6']].map(([v,label,n])=>`<button class="filter-btn ${activeFilter===v?'active':''}" data-course-filter="${v}">${label}<small>${n}</small></button>`).join('')}</aside><div>${weekHtml||'<div class="card empty-state">Bu filter uchun dars topilmadi.</div>'}</div></div>`;
  }
  function weekTheme(w) {
    const themes={1:'Data bilan tanishuv va Python start',2:'Python asoslari: qiymat, shart va ro‘yxat',3:'Sikllar, lug‘atlar va funksiyalar',4:'Fayllar, mini-o‘yin va Pandas',5:'CSV, ustunlar, qatorlar va filtrlash',6:'Data cleaning va guruhlash',7:'Statistika va vizualizatsiya',8:'Ma’lumotlar bazasi va SELECT',9:'WHERE va saralash',10:'SQL qidiruv va mini-topshiriqlar',11:'Agregat funksiyalar',12:'HAVING va INNER JOIN',13:'JOIN, CASE va mini-loyiha',14:'Excel bilan tanishuv va formulalar',15:'Excel shartlari va qidiruv',16:'Pivot, diagramma va eksport',17:'Loyiha tanlash va ma’lumot tayyorlash',18:'Yakunlash, himoya va sertifikat'};
    return themes[w]||'';
  }
  function lessonRow(index,l) {
    const done=isDone(index),prev=index===0||isDone(index-1),locked=!prev&&!done;
    const weekdays=['Dushanba','Chorshanba','Juma'];
    return `<div class="lesson-row ${done?'done':''}" data-lesson="${index}" ${locked?'aria-disabled="true"':''}><span class="lesson-status">${done?'✓':locked?'🔒':String(index+1).padStart(2,'0')}</span><div><strong>${esc(l.title)}</strong><small>${weekdays[index%3]} · ${TYPE_LABEL[l.kind]} · 2 soat</small></div><span class="lesson-type tag ${TYPE_TAG[l.kind]}">${TYPE_ICON[l.kind]}</span></div>`;
  }
  function renderSignalGame() {
    if(arcadeState.phase==='ready'){
      return '<section class="signal-game card"><div class="signal-art"><span class="signal-orbit orbit-one"></span><span class="signal-orbit orbit-two"></span><span class="signal-core">⚡</span><i class="signal-dot dot-one">✦</i><i class="signal-dot dot-two">✧</i></div><div class="signal-copy"><span class="eyebrow">ARCADE · TEZKOR SINOV</span><h2>DATA SIGNAL HUNT</h2><p>7 ta mavzudan tasodifiy 5 ta savol. To‘g‘ri javoblarni top, combo yig‘ va kunlik XP mukofotini qo‘lga kirit.</p><div class="signal-stats"><span>🏆 Rekord: <b>'+Number(profile.arcadeBest||0)+'/5</b></span><span>⏱ 5 raund</span><span>💎 3+ javob = XP</span></div><button class="btn btn-primary" data-arcade-start>O‘yinni boshlash <span>→</span></button></div></section>';
    }
    if(arcadeState.phase==='done'){
      const perfect=arcadeState.score===arcadeState.questions.length;
      return '<section class="signal-game card signal-result"><div class="result-emblem">'+(perfect?'🏆':'🚀')+'</div><span class="eyebrow">RUN COMPLETE</span><h2>'+(perfect?'PERFECT RUN!':'YAXSHI URINISH!')+'</h2><div class="result-score">'+arcadeState.score+'<small>/'+arcadeState.questions.length+'</small></div><p>'+(perfect?'Barcha signallarni to‘g‘ri topding. Sen haqiqiy Data Explorer!':'Natijangni yaxshilash uchun yana bir raund o‘yna.')+'</p><div class="signal-reward">'+esc(arcadeState.reward||'Yangi rekordlar sari!')+'</div><button class="btn btn-primary" data-arcade-start>Yana o‘ynash ↻</button></section>';
    }
    const q=arcadeState.questions[arcadeState.round];
    const pct=Math.round((arcadeState.round/arcadeState.questions.length)*100);
    const options=q.options.map((option,i)=>{
      let cls='signal-option';
      if(arcadeState.phase==='answered'&&i===q.answer)cls+=' is-correct';
      if(arcadeState.phase==='answered'&&i===arcadeState.selected&&i!==q.answer)cls+=' is-wrong';
      return '<button class="'+cls+'" data-arcade-answer="'+i+'" '+(arcadeState.phase==='answered'?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span>'+esc(option)+'</button>';
    }).join('');
    const feedback=arcadeState.phase==='answered'
      ? '<div class="signal-feedback '+(arcadeState.selected===q.answer?'good':'bad')+'"><strong>'+(arcadeState.selected===q.answer?'✦ To‘g‘ri signal!':'↻ Signalni o‘tkazib yubording')+'</strong><p>'+esc(q.why)+'</p><button class="btn btn-primary" data-arcade-next>'+(arcadeState.round===arcadeState.questions.length-1?'Natijani ko‘r':'Keyingi savol →')+'</button></div>'
      : '';
    return '<section class="signal-game card"><div class="signal-game-top"><div><span class="eyebrow">DATA SIGNAL HUNT</span><h2>Signalni tut!</h2></div><div class="signal-score"><b>'+arcadeState.score+'</b><small> / 5 ball</small></div></div><div class="signal-progress"><i style="width:'+pct+'%"></i></div><div class="signal-question"><div class="signal-question-icon">'+q.emoji+'</div><div><small>'+esc(q.topic)+' · RAUND '+(arcadeState.round+1)+'/5</small><h3>'+esc(q.prompt)+'</h3></div></div><div class="signal-options">'+options+'</div>'+feedback+'<div class="signal-foot"><span>🔥 Combo: <b>'+arcadeState.streak+'</b></span><span>Eng yaxshi natija: <b>'+Number(profile.arcadeBest||0)+'/5</b></span></div></section>';
  }
  function startSignalGame() {
    const pool=ARCADE_QUESTIONS.slice().sort(()=>Math.random()-.5);
    arcadeState={phase:'playing',round:0,score:0,streak:0,selected:null,questions:pool.slice(0,5),reward:''};
    render();
  }
  function answerSignal(index) {
    if(arcadeState.phase!=='playing'||arcadeState.selected!==null)return;
    const q=arcadeState.questions[arcadeState.round];
    arcadeState.selected=index;
    if(index===q.answer){arcadeState.score++;arcadeState.streak++;}
    else arcadeState.streak=0;
    arcadeState.phase='answered';
    render();
  }
  function nextSignalQuestion() {
    if(arcadeState.phase!=='answered')return;
    if(arcadeState.round<arcadeState.questions.length-1){
      arcadeState.round++;arcadeState.selected=null;arcadeState.phase='playing';render();return;
    }
    arcadeState.phase='done';
    profile.arcadeBest=Math.max(Number(profile.arcadeBest||0),arcadeState.score);
    if(arcadeState.score>=3&&profile.arcadeDailyReward!==todayKey()){
      profile.arcadeDailyReward=todayKey();profile.xp=(profile.xp||0)+15;arcadeState.reward='🎁 +15 XP — bugungi arcade mukofoti olindi!';
    }else{
      arcadeState.reward=arcadeState.score>=3?'Bugungi XP mukofoti allaqachon olingan. Rekording yangilandi!':'3 ta to‘g‘ri javob topsang, kunlik XP olasan.';
    }
    saveProfile();
    if(arcadeState.score>=3)toast(arcadeState.reward,'success');
    render();
  }
  function renderArena() {
    const bosses=WORLDS.map((w,i)=>{const p=worldProgress(w),unlocked=isWorldUnlocked(i),boss=w.to;return `<article class="arena-card card"><div class="arena-icon">${unlocked?'👾':'🔒'}</div><h3>${w.name} ${i===8?'· Final boss':'· Boss sinovi'}</h3><p>${unlocked?`Olam missiyalari: ${p.done}/${p.total}. Yakuniy sinov — ${lessons[boss].title}.`:'Oldingi olam missiyalarini bajarib, ushbu sinovni och.'}</p><div class="progress-track"><i style="width:${p.pct}%"></i></div><button class="btn ${unlocked?'btn-secondary':'btn-ghost'}" style="margin-top:14px;width:100%" data-lesson="${boss}" ${unlocked?'':'disabled'}>${isDone(boss)?'Qayta ko‘rish':'Bossga chiqish'} →</button></article>`;}).join('');
    return `<section class="arena-hero card"><span class="eyebrow">CHALLENGE ARENA</span><h1>Sinov maydoniga xush kelibsan!</h1><p>Har bir olamning oxirida boss missiya bor. Bu yerda o‘rganganlaringni birlashtirib, yangi darajaga chiqasan. Avval olamning oddiy missiyalarini bajar, keyin bossni chaqir.</p><span class="tag gold">🏆 Har bir boss uchun qo‘shimcha tajriba</span></section>${renderSignalGame()}<div class="section-heading"><div><h2>9 ta boss sinovi</h2><p>Har bir olamning yakuniy vazifasi.</p></div></div><section class="arena-grid">${bosses}</section>`;
  }
  function renderAchievements() {
    const badgeDefs=[
      {name:'Birinchi signal',desc:'Birinchi missiyani tugat',emoji:'📡',ok:()=>completedCount()>=1},
      {name:'Python Explorer',desc:'Python asoslarini zabt et',emoji:'🐍',ok:()=>[2,3,4,5,6,7,8,9,10,11].every(i=>isDone(i))},
      {name:'Data Cleaner',desc:'Pandas laboratoriyasini yakunla',emoji:'🧹',ok:()=>[11,12,13,14,15,16,17,18,19,20].every(i=>isDone(i))},
      {name:'SQL Navigator',desc:'SQL olamlarini tugat',emoji:'🗄️',ok:()=>[22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38].every(i=>isDone(i))},
      {name:'Excel Master',desc:'Excel missiyalarini bajar',emoji:'📈',ok:()=>[39,40,41,42,43,44,45,46,47].every(i=>isDone(i))},
      {name:'Galaktika sayyohi',desc:'Barcha 9 olamni och',emoji:'🌌',ok:()=>WORLDS.every((w,i)=>isWorldUnlocked(i))},
      {name:'XP yig‘uvchi',desc:'500 XP to‘pla',emoji:'💎',ok:()=>profile.xp>=500},
      {name:'DataSpace bitiruvchisi',desc:'54 ta missiyani yakunla',emoji:'🎓',ok:()=>completedCount()===54}
    ];
    const badges=badgeDefs.map(b=>{const ok=b.ok();return `<article class="badge-card card ${ok?'unlocked':''}"><div class="badge-symbol">${b.emoji}</div><strong>${b.name}</strong><small>${b.desc}</small><div style="margin-top:9px"><span class="tag ${ok?'gold':''}">${ok?'Ochildi':'Qulflangan'}</span></div></article>`;}).join('');
    return `<div class="section-heading" style="margin-top:0"><div><span class="eyebrow">TROPHY ROOM</span><h2>Mukofotlarim</h2><p>Har bir kichik g‘alaba — katta maqsad sari qadam.</p></div><span class="tag gold">${badgeDefs.filter(b=>b.ok()).length}/${badgeDefs.length} nishon</span></div><section class="achievement-grid">${badges}</section><div class="section-heading"><div><h2>Sertifikat</h2><p>54 ta missiya tugagandan keyin ochiladi.</p></div></div><section class="card" style="padding:20px;display:flex;align-items:center;gap:15px"><span style="font-size:35px">🎓</span><div style="flex:1"><strong style="font-size:12px">DataSpace Academy — Data Analytics</strong><small style="display:block;color:var(--muted);font-size:10px;margin-top:5px">${completedCount()===54?'Sertifikating tayyor!':'Hali '+(54-completedCount())+' ta missiya qoldi.'}</small></div><button class="btn ${completedCount()===54?'btn-gold':'btn-ghost'}" data-certificate ${completedCount()===54?'':'disabled'}>Sertifikatni ochish →</button></section>`;
  }
  function renderTeacher() {
    const p=percent(completedCount(),54);
    return `<div class="section-heading" style="margin-top:0"><div><span class="eyebrow">MENTOR UCHUN</span><h2>Mentor paneli</h2><p>Ushbu brauzerda saqlangan o‘quvchi progressini boshqarish.</p></div><span class="tag violet">Local classroom mode</span></div>
      <div class="teacher-grid"><div class="teacher-metric card"><strong>${completedCount()}/54</strong><small>Tugallangan missiyalar</small></div><div class="teacher-metric card"><strong>${p}%</strong><small>Kurs taraqqiyoti</small></div><div class="teacher-metric card"><strong>${profile.xp||0}</strong><small>Jami XP</small></div></div>
      <section class="card" style="padding:19px"><h3 style="font-size:14px">O‘quvchi profili</h3><p class="muted" style="font-size:10px">${esc(profile.name||'Profil yaratilmagan')} · ${profile.avatar||'🚀'} · ${currentLevel()}-daraja</p><div class="progress-track" style="height:8px"><i style="width:${p}%"></i></div><div class="teacher-tools"><button class="btn btn-primary" data-export-progress>Progressni eksport qilish (.json)</button><button class="btn btn-secondary" data-import-progress>Progressni import qilish</button><input type="file" id="import-progress-file" accept="application/json,.json" class="hidden"><button class="btn btn-ghost" data-edit-profile>Profilni o‘zgartirish</button></div><div class="teacher-note"><strong>Saqlash haqida:</strong> bu versiyada login, server va umumiy sinf reytingi yo‘q. Progress faqat o‘quvchining o‘z brauzerida saqlanadi. O‘quvchi qurilmasi almashtirilsa, JSON eksport/import orqali progressni ko‘chirish mumkin. Butun sinf bo‘yicha umumiy reyting va mentorning markaziy paneli uchun keyingi bosqichda backend kerak bo‘ladi.</div><div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:10px;color:var(--muted)">Xavfli amal: barcha lokal progressni o‘chirish</span><button class="btn btn-ghost" data-reset-progress>Progressni tiklash</button></div></section>`;
  }
  function openLesson(index) {
    if(index<0||index>=lessons.length)return;
    if(index>0&&!isDone(index-1)&&!isDone(index)) { toast('Avval oldingi missiyani tugat. Har bir daraja ketma-ket ochiladi.','warning');return; }
    const worldIndex=WORLDS.findIndex(w=>index>=w.from&&index<=w.to);
    if(!isWorldUnlocked(worldIndex)){toast('Bu olam hali qulflangan. Avval oldingi olamdagi missiyalarni bajar.','warning');return;}
    activeLessonIndex=index;activeView='lesson';selectedQuiz=null;editorDirty=false;excelSelected='E2';excelActions={};excelCells=makeExcelCells();
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',false));
    const crumb=document.getElementById('breadcrumb-current');if(crumb)crumb.textContent=`Missiya ${index+1}`;
    renderLesson();window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderLesson() {
    const index=activeLessonIndex,l=lessons[index],worldIndex=WORLDS.findIndex(w=>index>=w.from&&index<=w.to),world=WORLDS[worldIndex];
    const done=isDone(index),next=index<53?index+1:null;
    const codeArea=(runtime)=>`<div class="lab-header"><div><strong>${runtime==='python'?'Python Editor':'SQL Query Editor'}</strong><small style="display:block;margin-top:3px">${runtime==='python'?'Brauzerda Python 3 · Pyodide':'SQLite · SQL sandbox'}</small></div><div class="lab-toolbar"><span class="tag ${runtime==='python'?'cyan':'gold'}">${runtime==='python'?'PY':'SQL'}</span></div></div><div class="editor-wrap"><div class="editor-top"><i class="editor-dot"></i><i class="editor-dot"></i><i class="editor-dot"></i><span class="editor-file">${runtime==='python'?'mission.py':'query.sql'}</span></div><textarea id="code-editor" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off">${esc(l.starter||'')}</textarea></div><div class="lab-actions"><button class="btn btn-secondary" id="run-code">▶ Kodni ishga tushir</button><button class="btn btn-primary" id="check-code">✓ Missiyani tekshir</button><button class="btn btn-ghost" id="reset-code">Qayta tiklash</button><small>${runtime==='python'?'Birinchi ishga tushirishda Python yuklanadi.':'So‘rov lokal SQLite bazasida bajariladi.'}</small></div><div class="console-panel"><div class="console-head"><span>▸ NATIJA / CONSOLE</span><span id="runtime-status">Kutmoqda</span></div><div class="console-output" id="console-output"><span class="placeholder">Natija shu yerda ko‘rinadi. Kodni ishga tushir.</span></div><div id="plot-preview" class="plot-preview hidden"></div><div id="sql-results" class="sql-table-wrap hidden"></div></div>`;
    let lab='';
    if(l.kind==='python') lab=codeArea('python');
    else if(l.kind==='sql') lab=codeArea('sql');
    else if(l.kind==='quiz') lab=renderQuiz(l);
    else if(l.kind==='excel') lab=renderExcelLab(l);
    else if(l.kind==='project') lab=renderProjectLab(l,index);
    document.getElementById('app-content').innerHTML=`<div class="lesson-top"><button class="back-button" data-view="course">← Darslar</button><div class="lesson-top-copy"><small>${world.emoji} ${world.name.toUpperCase()} · ${l.week}-HAFTA · MISSIYA ${index+1}/54</small><h1>${esc(l.title)}</h1></div><div class="lesson-top-progress"><strong>${completedCount()}/54</strong><div class="progress-track"><i style="width:${percent(completedCount(),54)}%"></i></div></div></div>
      <section class="lesson-schedule card" aria-label="Ikki soatlik dars rejasi"><div class="schedule-heading"><strong>Bugungi dars rejasi</strong><span>120 daqiqa</span></div><div class="schedule-steps"><div><b>15 daq.</b><span>Takrorlash</span></div><div><b>45 daq.</b><span>Yangi mavzu</span></div><div class="break-step"><b>10 daq.</b><span>Tanaffus</span></div><div><b>40 daq.</b><span>Amaliy mashq</span></div><div><b>10 daq.</b><span>Xulosa + uyga vazifa</span></div></div></section>
      <div class="lesson-layout"><aside class="mission-panel card"><div class="mission-world">${world.emoji} ${world.name.toUpperCase()} <span class="tag ${TYPE_TAG[l.kind]}">${TYPE_LABEL[l.kind]}</span></div><h2>${esc(l.title)}</h2><p>${esc(l.story||'')}</p><h4>🎯 Missiya maqsadi</h4><p>${esc(l.objective||'')}</p><h4>📘 O‘rganamiz</h4><div class="concept-box">${esc(l.concept||'')}</div>${l.example?`<h4>Misol</h4><div class="example-box">${esc(l.example)}</div>`:''}<h4>⚡ Topshiriq</h4><p>${esc(l.challenge||'')}</p><button class="btn btn-ghost" id="show-hint" style="width:100%;margin-top:7px">💡 Yordam / hint</button><div id="hint-panel" class="hint-panel hidden">${esc(l.hint||'Avval nazariyani qayta ko‘rib, topshiriqni kichik qadamlarga bo‘l.')}</div><div class="mission-footer"><span>⏱ 2 soatlik dars</span><span>✧ +20 XP</span></div></aside>
      <section class="lab-panel card">${lab}${done?`<div class="complete-card" style="margin:0 14px 14px"><h3>✓ Bu missiya bajarilgan!</h3><p>Bilimni mustahkamlash uchun mashqni qayta bajarishing mumkin.</p>${next!==null?`<button class="btn btn-primary" data-next-lesson="${next}">Keyingi missiya →</button>`:'<button class="btn btn-gold" data-certificate>Sertifikatni ko‘rish →</button>'}</div>`:''}</section></div>`;
    wireLesson(l,index);
  }
  function renderQuiz(l) {
    return `<div class="lab-header"><div><strong>Bilim sinovi</strong><small style="display:block;margin-top:3px">Javobni tanla va tekshir.</small></div><span class="tag violet">QUIZ</span></div><div class="quiz-panel"><p class="quiz-question">${esc(l.challenge)}</p><div class="quiz-options">${(l.options||[]).map((o,i)=>`<button class="quiz-option" data-quiz-answer="${i}"><span class="option-letter">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}</div><div id="quiz-feedback"></div><div class="challenge-row"><button class="btn btn-primary" id="check-quiz">Javobni tekshir</button><small>To‘g‘ri javob uchun +20 XP</small></div></div>`;
  }
  function makeExcelCells() {
    return {A1:'O‘quvchi',B1:'Math',C1:'Science',D1:'Shahar',E1:'Jami',F1:'Kod',G1:'Kurs',H1:'Kod',I1:'Kurs',A2:'Ali',B2:'80',C2:'75',D2:'Qarshi',E2:'',F2:'C01',G2:'',H2:'C01',I2:'Python',A3:'Madina',B3:'95',C3:'92',D3:'Toshkent',E3:'',F3:'C02',G3:'',H3:'C02',I3:'SQL',A4:'Bobur',B4:'72',C4:'88',D4:'Qarshi',E4:'',F4:'C03',G4:'',H4:'C03',I4:'Excel',A5:'Zarina',B5:'89',C5:'91',D5:'Samarqand',E5:'',F5:'',G5:'',H6:'',I6:''};
  }
  function renderExcelLab(l) {
    const cols=['A','B','C','D','E','F','G','H','I'];
    const rows=Array.from({length:5},(_,r)=>{const n=r+1;return `<tr><td class="row-label">${n}</td>${cols.map(c=>`<td class="${c==='E'?'formula-cell':''}"><input data-cell="${c}${n}" aria-label="${c}${n}" value="${esc(excelCells[c+n]||'')}" ${n===1?'readonly':''}></td>`).join('')}</tr>`;}).join('');
    const extraButtons=`<button class="btn btn-secondary" data-excel-action="sort">↕ Ball bo‘yicha saralash</button><button class="btn btn-secondary" data-excel-action="pivot">▦ Pivot yaratish</button><button class="btn btn-secondary" data-excel-action="chart">▥ Diagramma chizish</button><button class="btn btn-ghost" data-excel-action="export">↓ CSV eksport</button>`;
    return `<div class="lab-header"><div><strong>Excel mini-laboratoriya</strong><small style="display:block;margin-top:3px">Katakni tanla, qiymat yoki formula kirit.</small></div><span class="tag green">WORKBOOK</span></div><div class="lab-visual"><div class="excel-toolbar">${extraButtons}</div><div class="excel-formula"><div class="cell-address" id="cell-address">${excelSelected}</div><input class="formula-input" id="formula-input" placeholder="Qiymat yoki =SUM(B2:B5) formula" value="${esc(excelCells[excelSelected]||'')}"><button class="btn btn-primary" id="apply-formula">Kiritish</button></div><div class="excel-grid-wrap"><table class="excel-grid"><thead><tr><th>#</th>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><div class="excel-result" id="excel-result">Formula va amallar natijasi shu yerda ko‘rinadi. Tanlangan katak: <b>${excelSelected}</b>.</div><div id="excel-output"></div><div class="challenge-row"><button class="btn btn-primary" id="check-excel">Missiyani tekshir</button><small>${esc(l.challenge||'')}</small></div></div>`;
  }
  function renderProjectLab(l,index) {
    const checks=(l.checklist||[]).map((c,i)=>`<label class="project-check"><input type="checkbox" data-project-check="${i}" ${profile.projectChecks?.[`${index}-${i}`]?'checked':''}> <span>${esc(c)}</span></label>`).join('');
    const options=l.projectOptions||[];
    return `<div class="lab-header"><div><strong>Project Nebula · loyiha studiyasi</strong><small style="display:block;margin-top:3px">O‘zingning Data Analytics loyihangni rejalashtir.</small></div><span class="tag violet">PROJECT</span></div><div class="project-panel"><h3>${esc(l.challenge)}</h3><p>${esc(l.concept)}</p>${options.length?`<label style="display:block;font-size:10px;color:#aab8d0;margin:13px 0 6px">Tanlov</label><select class="project-select" id="project-choice"><option value="">Tanlang...</option>${options.map(o=>`<option ${profile.projectChoice===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`:''}${checks?`<div class="project-checklist">${checks}</div>`:''}<label style="display:block;font-size:10px;color:#aab8d0;margin:13px 0 6px">Mentor uchun qayd / loyiha izohi</label><textarea class="project-notes" id="project-notes" placeholder="Savoling, ma'lumot manbasi yoki xulosangni yoz...">${esc(profile.projectNotes||'')}</textarea><div class="challenge-row"><button class="btn btn-primary" id="check-project">Missiyani yakunlash</button><small>Belgilar saqlanadi.</small></div></div>`;
  }
  function wireLesson(l,index) {
    const hint=document.getElementById('show-hint');if(hint)hint.addEventListener('click',()=>document.getElementById('hint-panel').classList.toggle('hidden'));
    if(l.kind==='quiz') wireQuiz(l,index);
    if(l.kind==='python'||l.kind==='sql') wireCode(l,index);
    if(l.kind==='excel') wireExcel(l,index);
    if(l.kind==='project') wireProject(l,index);
  }
  function wireQuiz(l,index) {
    document.querySelectorAll('[data-quiz-answer]').forEach(btn=>btn.addEventListener('click',()=>{selectedQuiz=Number(btn.dataset.quizAnswer);document.querySelectorAll('[data-quiz-answer]').forEach(x=>x.classList.toggle('selected',x===btn));}));
    document.getElementById('check-quiz').addEventListener('click',()=>{
      if(selectedQuiz===null){toast('Avval javob variantini tanla.','warning');return;}
      const ok=selectedQuiz===l.correct;
      document.querySelectorAll('[data-quiz-answer]').forEach((b,i)=>{b.classList.remove('selected');if(i===l.correct)b.classList.add('correct');else if(i===selectedQuiz)b.classList.add('wrong');});
      document.getElementById('quiz-feedback').innerHTML=`<div class="quiz-feedback ${ok?'good':'bad'}"><strong>${ok?'Ajoyib! To‘g‘ri javob.':'Yana bir bor urinib ko‘r.'}</strong><br>${esc(l.explanation||'')}</div>`;
      if(ok) completeLesson(index);else toast('Yordamni ochib, tushunchani yana bir marta o‘qi.','warning');
    });
  }
  function setConsole(text,type='') {
    const box=document.getElementById('console-output');if(!box)return;
    box.className=`console-output ${type}`;box.textContent=text||'Kod bajarildi, natija chiqarilmadi.';
  }
  function setRuntimeStatus(text){const el=document.getElementById('runtime-status');if(el)el.textContent=text;}
  function loadScript(url) {
    return new Promise((resolve,reject)=>{const existing=[...document.scripts].find(s=>s.src===url);if(existing){if(existing.dataset.loaded==='1')return resolve();existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return;}const s=document.createElement('script');s.src=url;s.async=true;s.onload=()=>{s.dataset.loaded='1';resolve();};s.onerror=()=>reject(new Error('Kutubxonani yuklab bo‘lmadi. Internetni tekshir.'));document.head.appendChild(s);});
  }
  async function getPyodide(needMatplotlib=false) {
    if(!pyodidePromise){pyodidePromise=(async()=>{setRuntimeStatus('Python yuklanmoqda...');await loadScript('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.js');pyodide=await window.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/'});return pyodide;})().catch(e=>{pyodidePromise=null;throw e;});}
    const engine=await pyodidePromise;
    if(lessons[activeLessonIndex]?.runtime==='pandas' || (document.getElementById('code-editor')?.value||'').includes('pandas')) {
      if(!engine.__dsPandas){setRuntimeStatus('Pandas yuklanmoqda...');await engine.loadPackage('pandas');engine.__dsPandas=true;}
    }
    const code=document.getElementById('code-editor')?.value||'';
    if(needMatplotlib||code.includes('matplotlib')){
      if(!engine.__dsMpl){setRuntimeStatus('Matplotlib yuklanmoqda...');await engine.loadPackage('matplotlib');engine.__dsMpl=true;}
    }
    return engine;
  }
  async function runPython(check=false) {
    const l=lessons[activeLessonIndex];const code=document.getElementById('code-editor').value;
    const runBtn=document.getElementById('run-code'),checkBtn=document.getElementById('check-code');
    runBtn.disabled=true;checkBtn.disabled=true;setRuntimeStatus('Ishlayapti...');setConsole('Python muhiti tayyorlanmoqda...');
    let output='';
    try {
      const engine=await getPyodide(code.includes('matplotlib'));
      engine.setStdout({batched:(msg)=>{output+=msg+'\n';}});
      engine.setStderr({batched:(msg)=>{output+=msg+'\n';}});
      await engine.runPythonAsync(code);
      setConsole(output.trim()||'Kod muvaffaqiyatli bajarildi.');
      const svgBox=document.getElementById('plot-preview');
      if(engine.FS.analyzePath('/home/pyodide/plot.svg').exists){
        const svg=engine.FS.readFile('/home/pyodide/plot.svg',{encoding:'utf8'});
        svgBox.innerHTML=svg;svgBox.classList.remove('hidden');
      }
      if(check){
        if(!l.testCode) throw new Error('Bu missiya uchun test qoidasi topilmadi.');
        await engine.runPythonAsync(l.testCode);
        if(l.title==="Python o'rnatish, print() va o'zgaruvchilar"){
          const student=engine.globals.get('student');
          const expected='Salom, '+String(student);
          const printed=output.includes(expected);
          if(!printed) throw new Error(`Ekranga "${expected}" natijasini print() orqali chiqar. O'zgaruvchi ichida faqat ism bo'lishi kerak.`);
        }
        setRuntimeStatus('Testlar muvaffaqiyatli ✓');setConsole((output.trim()?output.trim()+'\n\n':'')+'✓ Barcha tekshiruvlardan o‘tdi. Missiya bajarildi.');completeLesson(activeLessonIndex);
      } else setRuntimeStatus('Tayyor ✓');
    } catch(e) {
      const msg=e?.message||String(e);setRuntimeStatus('Xatolik');setConsole(output+(output?'\n':'')+msg,'error');
      if(check)toast('Tekshiruvdan o‘tmadi. Xatoni tuzatib, yana urin.','warning');
    } finally {runBtn.disabled=false;checkBtn.disabled=false;}
  }
  function getSqlEngine() {
    if(!sqlPromise){sqlPromise=(async()=>{
      setRuntimeStatus('SQL muhiti yuklanmoqda...');
      await loadScript('https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/sql-wasm.js');
      sqlEngine=await window.initSqlJs({locateFile:file=>`https://cdn.jsdelivr.net/npm/sql.js@1.14.2/dist/${file}`});
      sqlDb=new sqlEngine.Database();
      sqlDb.run(`CREATE TABLE students(id INTEGER PRIMARY KEY, name TEXT, age INTEGER, city TEXT, score INTEGER, course_id INTEGER);
        INSERT INTO students VALUES (1,'Ali',15,'Qarshi',78,1),(2,'Madina',17,'Toshkent',95,1),(3,'Bobur',16,'Qarshi',88,2),(4,'Zarina',18,'Samarqand',92,3),(5,'Jasur',17,'Toshkent',84,2),(6,'Dilnoza',15,'Buxoro',73,NULL);
        CREATE TABLE courses(id INTEGER PRIMARY KEY,title TEXT,fee INTEGER);
        INSERT INTO courses VALUES(1,'Python',350),(2,'SQL',300),(3,'Excel',250);
        CREATE TABLE movies(id INTEGER PRIMARY KEY,title TEXT,genre TEXT,year INTEGER,rating REAL);
        INSERT INTO movies VALUES(1,'Interstellar','Sci-Fi',2014,8.7),(2,'Coco','Animation',2017,8.4),(3,'Inception','Sci-Fi',2010,8.8),(4,'The Martian','Sci-Fi',2015,8.0),(5,'Soul','Animation',2020,8.0),(6,'Parasite','Drama',2019,8.5);`);
      return sqlDb;
    })().catch(e=>{sqlPromise=null;throw e;});}
    return sqlPromise;
  }
  function resultsTable(results) {
    if(!results?.length)return '<div class="muted" style="padding:12px;font-size:10px">So‘rov natija qatorlarini qaytarmadi.</div>';
    const r=results[0];return `<table class="data-table"><thead><tr>${r.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${r.values.slice(0,60).map(row=>`<tr>${row.map(v=>`<td>${esc(v===null?'NULL':v)}</td>`).join('')}</tr>`).join('')}</tbody></table><div style="font-size:9px;color:#8d9bb8;margin-top:7px">${r.values.length} ta qator ko‘rsatildi</div>`;
  }
  function validateSql(results,check) {
    if(!results?.length)return {ok:false,message:'Natija to‘plami topilmadi. SELECT so‘rovi yoz.'};
    const first=results[0],rows=first.values,cols=first.columns.map(x=>x.toLowerCase());
    if(check.minRows!==undefined&&rows.length<check.minRows)return {ok:false,message:`Kamida ${check.minRows} qator kutilgan, ${rows.length} ta qaytdi.`};
    if(check.exactRows!==undefined&&rows.length!==check.exactRows)return {ok:false,message:`Aynan ${check.exactRows} qator kutilgan, ${rows.length} ta qaytdi.`};
    if(check.columns&&!check.columns.every(c=>cols.includes(c.toLowerCase())))return {ok:false,message:`Ustunlar yetarli emas. Kerakli ustunlar: ${check.columns.join(', ')}.`};
    const flat=rows.flat().map(x=>String(x).toLowerCase());
    if(check.contains&&!check.contains.every(s=>flat.some(v=>v.includes(String(s).toLowerCase()))))return {ok:false,message:`Natijada quyidagi qiymat topilmadi: ${check.contains.join(', ')}.`};
    if(check.firstContains&&!check.firstContains.every(s=>String(rows[0]?.[0]??'').toLowerCase().includes(String(s).toLowerCase())))return {ok:false,message:`Birinchi natija kutilgan qiymatga mos emas: ${check.firstContains.join(', ')}.`};
    if(check.minValue!==undefined&&!rows.flat().some(v=>Number(v)>=check.minValue))return {ok:false,message:`Natijada ${check.minValue} yoki undan katta son topilmadi.`};
    return {ok:true,message:`✓ SQL tekshiruvi o'tdi: ${rows.length} qator, ${first.columns.length} ustun.`};
  }
  async function runSql(check=false) {
    const l=lessons[activeLessonIndex],query=document.getElementById('code-editor').value;
    const runBtn=document.getElementById('run-code'),checkBtn=document.getElementById('check-code');runBtn.disabled=true;checkBtn.disabled=true;
    setRuntimeStatus('SQLite ishga tushmoqda...');setConsole('SQL so‘rovi bajarilmoqda...');
    try {
      const db=await getSqlEngine();
      const results=db.exec(query);currentSqlResults=results;
      document.getElementById('sql-results').innerHTML=resultsTable(results);document.getElementById('sql-results').classList.remove('hidden');
      const count=results.reduce((n,r)=>n+r.values.length,0);setConsole(`So‘rov bajarildi. Natija qatorlari: ${count}`);
      if(check){const verdict=validateSql(results,l.sqlCheck||{});if(!verdict.ok)throw new Error(verdict.message);setConsole(verdict.message);setRuntimeStatus('Testlar muvaffaqiyatli ✓');completeLesson(activeLessonIndex);}else setRuntimeStatus('Tayyor ✓');
    }catch(e){setRuntimeStatus('Xatolik');setConsole(e.message||String(e),'error');if(check)toast('SQL missiyasi bajarilmadi. So‘rovni tekshir.','warning');}
    finally{runBtn.disabled=false;checkBtn.disabled=false;}
  }
  function wireCode(l,index) {
    document.getElementById('run-code').addEventListener('click',()=>l.kind==='python'?runPython(false):runSql(false));
    document.getElementById('check-code').addEventListener('click',()=>l.kind==='python'?runPython(true):runSql(true));
    document.getElementById('reset-code').addEventListener('click',()=>{document.getElementById('code-editor').value=l.starter||'';setConsole('Boshlang‘ich kod tiklandi.');setRuntimeStatus('Kutmoqda');document.getElementById('plot-preview').classList.add('hidden');document.getElementById('sql-results').classList.add('hidden');});
    document.getElementById('code-editor').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const t=e.target,s=t.selectionStart,en=t.selectionEnd;t.value=t.value.substring(0,s)+'    '+t.value.substring(en);t.selectionStart=t.selectionEnd=s+4;}});
  }
  function cellValue(addr) {
    const v=excelCells[addr]??'';if(typeof v==='string'&&v.startsWith('='))return evaluateFormula(v);return v;
  }
  function parseCellRange(range) {
    const m=range.match(/^\$?([A-I])\$?(\d+):\$?([A-I])\$?(\d+)$/i);if(!m)return [];
    const c1=m[1].toUpperCase().charCodeAt(0),r1=Number(m[2]),c2=m[3].toUpperCase().charCodeAt(0),r2=Number(m[4]),out=[];
    for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)out.push(String.fromCharCode(c)+r);return out;
  }
  function evaluateFormula(formula) {
    const s=formula.trim();
    let m=s.match(/^=SUM\(([^)]+)\)$/i);if(m)return parseCellRange(m[1]).reduce((a,c)=>a+(Number(excelCells[c])||0),0);
    m=s.match(/^=AVERAGE\(([^)]+)\)$/i);if(m){const a=parseCellRange(m[1]).map(c=>Number(excelCells[c])).filter(Number.isFinite);return a.length?a.reduce((x,y)=>x+y,0)/a.length:0;}
    m=s.match(/^=MIN\(([^)]+)\)$/i);if(m)return Math.min(...parseCellRange(m[1]).map(c=>Number(excelCells[c])||0));
    m=s.match(/^=MAX\(([^)]+)\)$/i);if(m)return Math.max(...parseCellRange(m[1]).map(c=>Number(excelCells[c])||0));
    m=s.match(/^=IF\(([A-I]\d+)>?=?(\d+),"([^"]*)","([^"]*)"\)$/i);if(m)return Number(excelCells[m[1]])>=Number(m[2])?m[3]:m[4];
    m=s.match(/^=([A-I]\d+)\+([A-I]\d+)$/i);if(m)return (Number(cellValue(m[1]))||0)+(Number(cellValue(m[2]))||0);
    m=s.match(/^=XLOOKUP\(([A-I]\d+),\$?([A-I]\$?\d+:\$?[A-I]\$?\d+),\$?([A-I]\$?\d+:\$?[A-I]\$?\d+)\)$/i);if(m){const key=excelCells[m[1]],keys=parseCellRange(m[2]),values=parseCellRange(m[3]),i=keys.findIndex(k=>excelCells[k]===key);return i>=0?excelCells[values[i]]:'#N/A';}
    return 'Formula';
  }
  function formulaSummary(formula) {const value=evaluateFormula(formula);return `Formula natijasi: ${value}`;}
  function applyExcelFormula() {
    const input=document.getElementById('formula-input'),addr=excelSelected,formula=input.value.trim();
    excelCells[addr]=formula;const target=document.querySelector(`[data-cell="${addr}"]`);if(target)target.value=formula;
    document.getElementById('excel-result').textContent=formula.startsWith('=')?formulaSummary(formula):`${addr} katagiga “${formula}” qiymati kiritildi.`;
  }
  function sortExcelRows() {
    const rows=[2,3,4,5].map(r=>({row:r,score:Number(excelCells['B'+r])||0})).sort((a,b)=>b.score-a.score);
    const base=makeExcelCells();
    rows.forEach((entry,i)=>{const dest=i+2;['A','B','C','D','F'].forEach(c=>{excelCells[c+dest]=base[c+entry.row];});});
    excelActions.sort=true;refreshExcelGrid();
    document.getElementById('excel-result').textContent='Qatorlar Math balli bo‘yicha kamayish tartibida saralandi.';
  }
  function buildPivot() {
    const cities={};for(let r=2;r<=5;r++){const city=excelCells['D'+r];cities[city]=(cities[city]||0)+(Number(excelCells['B'+r])||0)+(Number(excelCells['C'+r])||0);}
    excelActions.pivot=true;
    document.getElementById('excel-output').innerHTML=`<div class="pivot-output"><h4>▦ Pivot Table · Shahar kesimida jami ball</h4>${Object.entries(cities).map(([city,value])=>`<div class="bar-row"><span>${esc(city)}</span><div class="bar-line"><i style="width:${Math.min(100,value/2)}%"></i></div><b>${value}</b></div>`).join('')}</div>`;
    document.getElementById('excel-result').textContent='Pivot jadval yaratildi: shahar bo‘yicha jami Math + Science ballari.';
  }
  function buildChart() {
    const rows=[];for(let r=2;r<=5;r++)rows.push({name:excelCells['A'+r],value:(Number(excelCells['B'+r])||0)+(Number(excelCells['C'+r])||0)});
    const max=Math.max(...rows.map(x=>x.value),1);excelActions.chart=true;
    document.getElementById('excel-output').innerHTML=`<div class="chart-output"><h4>▥ O‘quvchi natijalari · ustunli diagramma</h4>${rows.map(x=>`<div class="bar-row"><span>${esc(x.name)}</span><div class="bar-line"><i style="width:${x.value/max*100}%"></i></div><b>${x.value}</b></div>`).join('')}</div>`;
    document.getElementById('excel-result').textContent='Diagramma yaratildi. Baland ustun — yuqori jami natija.';
  }
  function refreshExcelGrid() {
    document.querySelectorAll('[data-cell]').forEach(input=>{const a=input.dataset.cell;input.value=excelCells[a]??'';});
    const formula=document.getElementById('formula-input');if(formula)formula.value=excelCells[excelSelected]||'';
  }
  function exportExcelCsv() {
    const cols=['A','B','C','D','E','F','G','H','I'];const rows=[];
    for(let r=1;r<=5;r++)rows.push(cols.map(c=>String(excelCells[c+r]||'').replace(/"/g,'""')).map(v=>`"${v}"`).join(','));
    const blob=new Blob(['\uFEFF'+rows.join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='dataspace-practice.csv';a.click();URL.revokeObjectURL(url);excelActions.export=true;toast('CSV fayli yuklab olindi.','success');
  }
  function wireExcel(l,index) {
    document.querySelectorAll('[data-cell]').forEach(input=>{
      input.addEventListener('focus',()=>{excelSelected=input.dataset.cell;excelActions.cell=true;document.getElementById('cell-address').textContent=excelSelected;document.getElementById('formula-input').value=excelCells[excelSelected]||'';});
      input.addEventListener('change',()=>{excelCells[input.dataset.cell]=input.value;});
    });
    document.getElementById('formula-input').addEventListener('keydown',e=>{if(e.key==='Enter')applyExcelFormula();});
    document.getElementById('apply-formula').addEventListener('click',applyExcelFormula);
    document.querySelectorAll('[data-excel-action]').forEach(btn=>btn.addEventListener('click',()=>{
      const action=btn.dataset.excelAction;
      if(action==='sort')sortExcelRows();else if(action==='pivot')buildPivot();else if(action==='chart')buildChart();else if(action==='export')exportExcelCsv();
    }));
    document.getElementById('check-excel').addEventListener('click',()=>{
      let ok=false,msg='';
      if(l.excelAction==='formula'){const actual=String(excelCells.E2||'').replace(/\s+/g,'').toUpperCase(),expected=String(l.expectedFormula||'').replace(/\s+/g,'').toUpperCase();ok=actual===expected;msg=ok?'Kiritilgan formula topshiriqqa mos.':`E2 katagiga aynan ${l.expectedFormula} formulasini yoz.`;}
      else if(l.excelAction==='sort'){ok=!!excelActions.sort;msg='Saralash tugmasini bosib, qatorlar tartibini o‘zgartir.';}
      else if(l.excelAction==='pivot'){ok=!!excelActions.pivot;msg='Pivot yaratish tugmasini bos.';}
      else if(l.excelAction==='chart'){ok=!!excelActions.chart;msg='Diagramma chizish tugmasini bos.';}
      else {ok=!!excelActions.cell;msg='Jadvaldagi biror katakni tanla.';}
      if(ok){document.getElementById('excel-result').textContent='✓ '+(l.explanation||'Excel topshirig‘i bajarildi.');completeLesson(index);}else{document.getElementById('excel-result').textContent=msg;toast(msg,'warning');}
    });
  }
  function wireProject(l,index) {
    const sel=document.getElementById('project-choice');if(sel)sel.addEventListener('change',()=>{profile.projectChoice=sel.value;saveProfile();});
    document.querySelectorAll('[data-project-check]').forEach(ch=>ch.addEventListener('change',()=>{profile.projectChecks[`${index}-${ch.dataset.projectCheck}`]=ch.checked;saveProfile();}));
    const notes=document.getElementById('project-notes');if(notes)notes.addEventListener('input',()=>{profile.projectNotes=notes.value;saveProfile();});
    document.getElementById('check-project').addEventListener('click',()=>{
      let ok=false;
      if(l.projectOptions)ok=!!(document.getElementById('project-choice')?.value);
      if(l.checklist)ok=l.checklist.every((_,i)=>!!profile.projectChecks[`${index}-${i}`]);
      if(!l.projectOptions&&!l.checklist)ok=true;
      if(ok){completeLesson(index);}else toast(l.projectOptions?'Avval bitta variantni tanla.':'Barcha bandlarni bajarib belgila.','warning');
    });
  }
  function celebrateMission() {
    const layer=document.createElement('div');layer.className='celebration-layer';layer.setAttribute('aria-hidden','true');
    for(let i=0;i<44;i++){
      const bit=document.createElement('i');bit.className='confetti-piece';
      bit.style.left=(Math.random()*100)+'%';
      bit.style.setProperty('--fall',(70+Math.random()*50)+'vh');
      bit.style.setProperty('--delay',(Math.random()*.35)+'s');
      bit.style.setProperty('--spin',(Math.random()*720-360)+'deg');
      bit.style.setProperty('--hue',Math.floor(Math.random()*360));
      layer.appendChild(bit);
    }
    document.body.appendChild(layer);
    setTimeout(()=>layer.remove(),2200);
  }
  function completeLesson(index) {
    if(isDone(index)){toast('Bu missiya avval bajarilgan. Davom et!','success');return;}
    profile.completed.push(index);profile.completed.sort((a,b)=>a-b);profile.xp=(profile.xp||0)+20;profile.lastActive=todayKey();profile.streak=Math.max(1,profile.streak||0);saveProfile();celebrateMission();
    const newBadges=[];if(profile.completed.length===1)newBadges.push('Birinchi signal nishoni ochildi!');if(profile.completed.length===54)newBadges.push('Barcha missiyalar tugadi — sertifikating tayyor!');
    toast(`Missiya bajarildi! +20 XP · Jami ${profile.xp} XP`,'success');
    renderLesson();
  }
  function showCertificate() {
    if(completedCount()!==54){toast(`Sertifikat uchun yana ${54-completedCount()} ta missiya qoldi.`,'warning');return;}
    const print=document.createElement('div');print.id='print-certificate';print.innerHTML=`<div class="certificate"><div class="cert-seal">✦ 🎓 ✦</div><div style="letter-spacing:4px;font-size:11px;color:#777199">DATASPACE ACADEMY</div><h1>MUVAFFAQIYAT SERTIFIKATI</h1><p>Ushbu sertifikat</p><div class="cert-name">${esc(profile.name)}</div><p>18 haftalik, 54 darsdan iborat Data Analytics o‘quv yo‘lini muvaffaqiyatli tamomlaganini tasdiqlaydi.</p><h2>Python · Pandas · SQL · Excel</h2><p>DataSpace Explorer · ${new Date().toLocaleDateString('uz-UZ')}</p><div style="margin-top:30px;display:flex;justify-content:space-around;font-size:10px;color:#6b6985"><span>Mentor imzosi __________________</span><span>DataSpace Academy ✦</span></div></div>`;
    document.body.appendChild(print);window.print();setTimeout(()=>print.remove(),1000);
  }
  function exportProgress() {
    const payload={app:'DataSpace Academy',version:1,exportedAt:new Date().toISOString(),profile};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`dataspace-progress-${(profile.name||'student').replace(/[^a-z0-9_-]/gi,'_')}.json`;a.click();URL.revokeObjectURL(url);toast('Progress fayli tayyor.','success');
  }
  function importProgress(file) {
    const reader=new FileReader();reader.onload=()=>{try{const data=JSON.parse(reader.result);if(data.app!=='DataSpace Academy'||!data.profile||!Array.isArray(data.profile.completed))throw new Error('DataSpace progress fayli emas.');profile={...defaultProfile(),...data.profile};profile.completed=profile.completed.filter(n=>Number.isInteger(n)&&n>=0&&n<54);saveProfile();render();toast('Progress muvaffaqiyatli import qilindi.','success');}catch(e){toast(e.message||'JSON faylni o‘qib bo‘lmadi.','warning');}};reader.readAsText(file);
  }
  function bindGlobalEvents() {
    document.addEventListener('click',e=>{
      const arcadeStart=e.target.closest('[data-arcade-start]');if(arcadeStart){startSignalGame();return;}
      const arcadeAnswer=e.target.closest('[data-arcade-answer]');if(arcadeAnswer){answerSignal(Number(arcadeAnswer.dataset.arcadeAnswer));return;}
      const arcadeNext=e.target.closest('[data-arcade-next]');if(arcadeNext){nextSignalQuestion();return;}
      const view=e.target.closest('[data-view]');if(view){setView(view.dataset.view);return;}
      const world=e.target.closest('[data-world]');if(world){const i=Number(world.dataset.world);if(!isWorldUnlocked(i)){toast('Bu olam qulflangan. Oldingi olamni yakunla.','warning');return;}const first=WORLDS[i].from;const next=Array.from({length:WORLDS[i].to-first+1},(_,n)=>first+n).find(n=>!isDone(n));openLesson(next===undefined?WORLDS[i].to:next);return;}
      const lesson=e.target.closest('[data-lesson]');if(lesson){const n=Number(lesson.dataset.lesson);if(lesson.hasAttribute('disabled'))return;openLesson(n);return;}
      const openNext=e.target.closest('[data-open-next]');if(openNext){const n=getNextLesson();if(n===null)showCertificate();else openLesson(n);return;}
      const next=e.target.closest('[data-next-lesson]');if(next){openLesson(Number(next.dataset.nextLesson));return;}
      const filter=e.target.closest('[data-course-filter]');if(filter){window.__courseFilter=filter.dataset.courseFilter;renderCourseIntoPage();return;}
      if(e.target.closest('[data-certificate]')){showCertificate();return;}
      if(e.target.closest('[data-export-progress]')){exportProgress();return;}
      if(e.target.closest('[data-import-progress]')){document.getElementById('import-progress-file')?.click();return;}
      if(e.target.closest('[data-edit-profile]')){openProfileModal(false);return;}
      if(e.target.closest('[data-reset-progress]')){if(confirm('Shu brauzerdagi barcha DataSpace progressini o‘chirishni xohlaysanmi?')){profile=defaultProfile();saveProfile();render();toast('Lokal progress qayta tiklandi.','warning');}return;}
      if(e.target.closest('[data-close-modal]')){closeModal();return;}
    });
    document.getElementById('profile-button').addEventListener('click',()=>openProfileModal(false));
    document.getElementById('top-profile').addEventListener('click',()=>openProfileModal(false));
    document.getElementById('mobile-menu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
    document.getElementById('modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop')closeModal();});
    document.addEventListener('change',e=>{if(e.target.id==='import-progress-file'&&e.target.files[0])importProgress(e.target.files[0]);});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
  }
  function renderCourseIntoPage() {
    const root=document.getElementById('app-content');root.innerHTML=renderCourse();
  }
  async function init() {
    bindGlobalEvents();
    try {
      const res=await fetch('data/curriculum.json');if(!res.ok)throw new Error(`Kurs fayli yuklanmadi: ${res.status}`);lessons=await res.json();
      if(lessons.length!==54)throw new Error(`Kurs 54 dars bo‘lishi kerak, hozir ${lessons.length}.`);
      updateStreak();render();
      if(!profile.name)openProfileModal(true);
    } catch(e) {
      document.getElementById('app-content').innerHTML=`<div class="card empty-state"><h2>Akademiyani yuklab bo‘lmadi</h2><p>${esc(e.message)}</p><p>Saytni lokal server yoki GitHub Pages orqali och. index.html ni to‘g‘ridan-to‘g‘ri file:// rejimida ochish JSON fetch'ni cheklashi mumkin.</p></div>`;
    }
  }
  init();
})();
