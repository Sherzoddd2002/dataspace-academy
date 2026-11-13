(() => {
  'use strict';
  const STORAGE_KEY = 'dataspace-academy-v1';
  const AVATARS = ['🚀','🧑‍🚀','🦊','🐼','🐸','🐯','🦄','🐙'];
  const CHARACTER_CLASSES = [
    {id:'navigator',name:'Kosmik navigator',icon:'🧭',short:'NAVIGATOR'},
    {id:'coder',name:'Kod sehrgari',icon:'💻',short:'CODE WIZARD'},
    {id:'scientist',name:'Data olimi',icon:'🧪',short:'DATA SCIENTIST'},
    {id:'detective',name:'SQL detektiv',icon:'🔎',short:'QUERY DETECTIVE'}
  ];
  const GAME_ZONES = [
    {name:'Signal Harbor',tag:'DATA PORT',props:['🛰️','💎','🪐'],npc:'Signalni tutib ol!'},
    {name:'Neon Code City',tag:'PYTHONIA',props:['🏙️','🧩','⚡'],npc:'Kod bloklarini ishga tushir!'},
    {name:'Logic Jungle',tag:'LOGICARA',props:['🌴','🦎','💠'],npc:'Mantiq yo‘lni ochadi!'},
    {name:'FileForge Factory',tag:'FILEFORGE',props:['⚙️','📦','🔥'],npc:'Fayllarni joyiga qo‘y!'},
    {name:'Pandoria Wilds',tag:'PANDORIA',props:['🌿','🧬','🪷'],npc:'Kerakli datani filtrlab ol!'},
    {name:'SQL Depths',tag:'SQL-BASE',props:['🌊','🛸','🐚'],npc:'To‘g‘ri query yoz!'},
    {name:'Queryon Towers',tag:'QUERYON',props:['🏰','🔗','💜'],npc:'Jadvallarni bog‘la!'},
    {name:'Excelia Vault',tag:'EXCELIA',props:['🏛️','💰','📊'],npc:'Xazina katakda yashiringan!'},
    {name:'Project Nebula',tag:'FINAL WORLD',props:['🌌','🚀','🏆'],npc:'O‘z loyihangni himoya qil!'}
  ];
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
  let missionGames = [];
  let missionGameState = null;
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
  let cloud = null;
  let cloudUser = null;
  let cloudError = null;
  let leaderboardCache = [];
  let authModalBusy = false;

  function defaultProfile() {
    return {name:'',username:'',cloudUserId:'',avatar:'🚀',characterClass:'navigator',xp:0,streak:0,lastActive:'',completed:[],createdAt:new Date().toISOString(),projectChoice:'',projectNotes:'',projectChecks:{},preferences:{},arcadeBest:0,arcadeDailyReward:''};
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
    const labels={dashboard:'Bosh sahifa',world3d:'3D olam',map:'Galaktika xaritasi',course:'54 ta dars',arena:'Musobaqa maydoni',leaderboard:'Reyting / O‘quvchilar',achievements:'Mukofotlarim',teacher:'Mentor paneli'};
    const crumb=document.getElementById('breadcrumb-current'); if(crumb) crumb.textContent=labels[view]||'Bosh sahifa';
    document.getElementById('sidebar').classList.remove('open');
    render();
    if(view==='leaderboard'||view==='teacher') refreshLeaderboard();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function getCharacterClass() {
    return CHARACTER_CLASSES.find(x=>x.id===profile.characterClass)||CHARACTER_CLASSES[0];
  }
  function renderVoxelCharacter(size='game',mood='idle',classId=profile.characterClass) {
    const role=CHARACTER_CLASSES.find(x=>x.id===classId)||CHARACTER_CLASSES[0];
    return '<div class="voxel-character voxel-'+size+' role-'+role.id+' mood-'+mood+' '+(mood==='win'?'player-win':'')+'" aria-label="'+esc(profile.name||'Data Explorer')+' qahramoni">'+
      '<div class="voxel-nameplate">'+esc(profile.name||'EXPLORER')+'</div>'+
      '<div class="voxel-head"><span class="voxel-cap">'+esc(profile.avatar||'🚀')+'</span><div class="voxel-face"><i></i><i></i><b></b></div></div>'+
      '<div class="voxel-neck"></div>'+
      '<div class="voxel-arm arm-left"><i></i></div><div class="voxel-arm arm-right"><i></i></div>'+
      '<div class="voxel-torso"><span class="voxel-emblem">'+role.icon+'</span><b>DS</b></div>'+
      '<div class="voxel-leg leg-left"><i></i></div><div class="voxel-leg leg-right"><i></i></div>'+
      '<div class="voxel-shadow"></div></div>';
  }
  function renderGameWorldStage(g,index,state) {
    const worldIndex=WORLDS.findIndex(w=>index>=w.from&&index<=w.to);
    const world=WORLDS[Math.max(0,worldIndex)];
    const zone=GAME_ZONES[Math.max(0,worldIndex)];
    const done=!!state.solved;
    const props=zone.props.map((p,i)=>'<span class="world-prop prop-'+(i+1)+'">'+p+'</span>').join('');
    const playerStep=Number(state.playerStep||0);
    const heroLeft=done?69:7+playerStep*18;
    const progress=done?100:Math.min(82,12+playerStep*22);
    return '<section class="game-world biome-'+worldIndex+' '+(done?'is-cleared':'')+'">'+
      '<div class="world-sky"><span class="world-moon"></span><i class="world-star star-a">✦</i><i class="world-star star-b">✧</i><i class="world-star star-c">·</i><span class="world-nebula"></span></div>'+
      '<div class="world-hud"><div><small>WORLD '+String(worldIndex+1).padStart(2,'0')+' / 09</small><strong>'+esc(zone.name)+'</strong></div><span class="world-level-tag">'+esc(zone.tag)+'</span><span class="world-mission-tag">MISSION '+String(index+1).padStart(2,'0')+'</span></div>'+
      '<div class="world-props">'+props+'</div>'+
      '<div class="obby-platform platform-back"></div><div class="obby-platform platform-mid"></div><div class="obby-platform platform-front"></div>'+
      '<div class="obby-route"><i class="route-node node-one '+(done||playerStep>=1?'lit':'')+'">1</i><i class="route-node node-two '+(done||playerStep>=2?'lit':'')+'">2</i><i class="route-node node-three '+(done||playerStep>=3?'lit':'')+'">3</i><span class="route-bridge"></span></div>'+
      '<div class="voxel-player" style="left:'+heroLeft+'%">'+renderVoxelCharacter('game',done?'win':'idle')+'</div>'+
      '<div class="world-companion"><div class="companion-cube"><i></i><i></i><b></b></div><strong>BYTE</strong></div>'+
      '<div class="npc-speech"><span>🤖 BYTE · MENTOR</span><p>'+(done?'Ajoyib, '+esc(profile.name||'Explorer')+'! Portal ochildi. Keyingi orolga tayyormisan?':esc(zone.npc)+' Avval vazifani bajar, portalni och!')+'</p></div>'+
      '<div class="world-portal '+(done?'portal-open':'')+'"><span>'+(done?'✦':'🔒')+'</span><b>'+(done?'PORTAL OPEN':'DATA PORTAL')+'</b><small>'+(done?'NEXT ISLAND':'CHECKPOINT')+'</small></div>'+
      '<div class="world-bottom-hud"><span>OBBY QUEST <b>'+Math.round(progress)+'%</b></span><div class="world-progress"><i style="width:'+progress+'%"></i></div><span class="world-xp">✦ +20 XP</span></div>'+
      '<div class="avatar-action-bar"><span>Qahramonni boshqar:</span><button data-player-action="back" title="←">◀ BACK</button><button data-player-action="forward" title="→">▶ WALK</button><button data-player-action="jump" title="Space">⤴ JUMP</button><button data-player-action="wave" title="W">👋 WAVE</button><button data-player-action="dance" title="D">✦ DANCE</button><small>← → SPACE W D</small></div>'+
    '</section>';
  }
  function triggerCharacterAction(action) {
    if(!missionGameState)return;
    if(action==='forward'||action==='back'){
      if(missionGameState.solved){toast('Portal allaqachon ochilgan! Keyingi missiyaga o‘t.','success');return;}
      const previousStep=Number(missionGameState.playerStep||0);
      missionGameState.playerStep=Math.max(0,Math.min(3,previousStep+(action==='forward'?1:-1)));
      const player=document.querySelector('.voxel-player');
      if(player)player.style.left=(7+missionGameState.playerStep*18)+'%';
      document.querySelectorAll('.route-node').forEach((node,i)=>node.classList.toggle('lit',missionGameState.playerStep>=i+1));
      const routeProgress=document.querySelector('.world-progress i');
      if(routeProgress)routeProgress.style.width=Math.min(82,12+missionGameState.playerStep*22)+'%';
      const routeLabel=document.querySelector('.world-bottom-hud>span:first-child b');
      if(routeLabel)routeLabel.textContent=Math.min(82,12+missionGameState.playerStep*22)+'%';
      if(action==='forward'&&player){
        const hero=player.querySelector('.voxel-character');
        hero?.classList.remove('action-jump');void hero?.offsetWidth;hero?.classList.add('action-jump');
        setTimeout(()=>hero?.classList.remove('action-jump'),760);
      }
      if(previousStep<3&&missionGameState.playerStep===3&&action==='forward')toast('Checkpointga yetding! Endi vazifani yechib portalni och.','success');
      return;
    }
    const character=document.querySelector('.voxel-player .voxel-character');
    if(!character)return;
    character.classList.remove('action-jump','action-wave','action-dance');
    void character.offsetWidth;
    character.classList.add('action-'+action);
    setTimeout(()=>character.classList.remove('action-'+action),900);
  }

  function openAuthModal(mode='signup',first=false) {
    const modal=document.getElementById('modal-card');
    const signup=mode==='signup';
    authModalBusy=false;
    modal.innerHTML=`<div class="eyebrow">DATASPACE ACCOUNT · GALAKTIKAGA KIRISH</div>
      <h2 id="modal-title">${signup?'Yangi Explorer yarat':'Akkauntingga kir'}</h2>
      <p class="auth-intro">Har bir o‘quvchining XP va missiyalari alohida saqlanadi. Email kerak emas.</p>
      <div class="auth-mode-switch"><button type="button" class="${signup?'active':''}" data-auth-mode="signup">Ro‘yxatdan o‘tish</button><button type="button" class="${!signup?'active':''}" data-auth-mode="signin">Kirish</button></div>
      <label for="auth-username">Username</label><input id="auth-username" maxlength="20" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Masalan: ali_data" value="${esc(profile.username||'')}">
      ${signup?'<label for="auth-display-name">Ko‘rinadigan ism</label><input id="auth-display-name" maxlength="24" autocomplete="nickname" placeholder="Masalan: Ali">':''}
      <label for="auth-password">Parol</label><input id="auth-password" type="password" minlength="8" maxlength="72" autocomplete="${signup?'new-password':'current-password'}" placeholder="${signup?'Kamida 8 belgi':'Parolingiz'}">
      ${signup?'<small class="auth-hint">Username 3–20 belgi: lotin harflari, raqamlar va pastki chiziq. Parolingizni eslab qoling — email orqali tiklash yo‘q.</small>':''}
      <p class="auth-error" id="auth-error" role="alert">${cloudError?esc(cloudError):''}</p>
      <div class="modal-actions">${first?'':'<button class="btn btn-ghost" data-close-modal>Bekor qilish</button>'}<button class="btn btn-ghost" data-guest-mode>🧊 Mehmon sifatida o‘yna</button><button class="btn btn-primary" id="auth-submit">${signup?'Akkaunt yaratish':'Kirish'} <span>→</span></button></div>`;
    document.getElementById('modal-backdrop').classList.remove('hidden');
    modal.querySelectorAll('[data-auth-mode]').forEach(btn=>btn.addEventListener('click',()=>openAuthModal(btn.dataset.authMode,first)));
    const submit=async()=>{
      if(authModalBusy)return;
      const username=modal.querySelector('#auth-username').value.trim().toLowerCase();
      const password=modal.querySelector('#auth-password').value;
      const displayName=modal.querySelector('#auth-display-name')?.value.trim()||username;
      const errorEl=modal.querySelector('#auth-error');
      const button=modal.querySelector('#auth-submit');
      if(!/^[a-z0-9_]{3,20}$/.test(username)){errorEl.textContent='Username 3–20 belgidan iborat bo‘lsin: a-z, 0-9 va _. ';return;}
      if(signup&&password.length<8){errorEl.textContent='Parol kamida 8 belgidan iborat bo‘lishi kerak.';return;}
      if(!password){errorEl.textContent='Parolni kiriting.';return;}
      if(!cloud){errorEl.textContent='Serverga ulanish tayyor emas. Sahifani yangilab ko‘ring.';return;}
      authModalBusy=true;button.disabled=true;button.textContent=signup?'Akkaunt yaratilmoqda...':'Tekshirilmoqda...';errorEl.textContent='';
      try{
        const result=signup
          ?await cloud.signUp({username,password,displayName,avatar:profile.avatar||'🚀',characterClass:profile.characterClass||'navigator'})
          :await cloud.signIn({username,password});
        cloudUser=result.user;
        applyCloudProfile(result.profile,result.user);
        closeModal();render();
        toast(signup?'Akkaunt yaratildi! Galaktikaga xush kelibsan.':'Xush kelibsan! Progressing tiklandi.','success');
      }catch(error){
        const detail=[error?.stage,error?.message,error?.code?('Kod: '+error.code):''].filter(Boolean).join(' · ');
        errorEl.textContent=detail||'Kirishda xatolik yuz berdi.';
        console.error('DataSpace account flow failed:',{stage:error?.stage,status:error?.status,code:error?.code,endpoint:error?.endpoint,message:error?.message});
        button.disabled=false;button.innerHTML=(signup?'Akkaunt yaratish':'Kirish')+' <span>→</span>';
        authModalBusy=false;
      }
    };
    modal.querySelector('#auth-submit').addEventListener('click',submit);
    modal.querySelector('#auth-password').addEventListener('keydown',e=>{if(e.key==='Enter')submit();});
    modal.querySelector('#auth-username').addEventListener('keydown',e=>{if(e.key==='Enter')modal.querySelector('#auth-password').focus();});
  }

  function applyCloudProfile(row,user=cloudUser) {
    if(!row)throw new Error('O‘quvchi profili topilmadi.');
    cloudUser=user||cloudUser;
    if(profile.name&&!profile.cloudUserId){
      try{localStorage.setItem(STORAGE_KEY+'-legacy-backup',JSON.stringify(profile));}catch(_){}
    }
    profile={
      ...defaultProfile(),
      username:String(row.username||''),
      name:String(row.display_name||row.username||'Explorer'),
      cloudUserId:String(row.user_id||cloudUser?.id||''),
      avatar:row.avatar||'🚀',
      characterClass:row.character_class||'navigator',
      xp:Number(row.xp||0),
      streak:Number(row.streak||0),
      lastActive:row.last_active||'',
      completed:Array.isArray(row.completed_lessons)?row.completed_lessons.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<54).sort((a,b)=>a-b):[],
      arcadeBest:Number(row.arcade_best||0),
      arcadeDailyReward:row.arcade_daily_reward||''
    };
    saveProfile();
  }

  function openProfileModal() {
    if(!cloudUser){openAuthModal('signup');return;}
    const modal=document.getElementById('modal-card');
    const picked=profile.avatar||'🚀';
    let characterClass=profile.characterClass||'navigator';
    modal.innerHTML=`<div class="eyebrow">DATASPACE ACCOUNT</div>
      <h2 id="modal-title">Explorer profiling</h2>
      <p class="auth-intro">Username: <strong>@${esc(profile.username)}</strong>. Natijalaring barcha qurilmalarda saqlanadi.</p>
      <label for="profile-name-input">Ko‘rinadigan ism</label><input id="profile-name-input" maxlength="24" placeholder="Masalan: Ali" value="${esc(profile.name)}">
      <label>Hamrohingni tanla</label><div class="avatar-picker">${AVATARS.map(a=>`<button class="avatar-choice ${a===picked?'selected':''}" type="button" data-avatar-choice="${a}">${a}</button>`).join('')}</div>
      <label class="character-class-label">O‘yin qahramoningning kasbi</label><div class="character-class-picker">${CHARACTER_CLASSES.map(c=>`<button class="character-class-option ${c.id===characterClass?'selected':''}" type="button" data-character-class="${c.id}"><span>${c.icon}</span><b>${c.name}</b><small>${c.short}</small></button>`).join('')}</div>
      <div class="character-preview-row"><span>Qahramoning:</span>${renderVoxelCharacter('preview','idle',characterClass)}</div>
      <div class="modal-actions"><button class="btn btn-ghost" data-cloud-signout>Chiqish</button><button class="btn btn-primary" id="save-profile">Saqlash <span>→</span></button></div>`;
    document.getElementById('modal-backdrop').classList.remove('hidden');
    let avatar=picked;
    modal.querySelectorAll('[data-avatar-choice]').forEach(btn=>btn.addEventListener('click',()=>{avatar=btn.dataset.avatarChoice;modal.querySelectorAll('[data-avatar-choice]').forEach(x=>x.classList.toggle('selected',x===btn));}));
    modal.querySelectorAll('[data-character-class]').forEach(btn=>btn.addEventListener('click',()=>{characterClass=btn.dataset.characterClass;modal.querySelectorAll('[data-character-class]').forEach(x=>x.classList.toggle('selected',x===btn));modal.querySelector('.character-preview-row').innerHTML='<span>Qahramoning:</span>'+renderVoxelCharacter('preview','idle',characterClass);}));
    modal.querySelector('#save-profile').addEventListener('click',async()=>{
      const name=modal.querySelector('#profile-name-input').value.trim();
      if(!name){toast('Ko‘rinadigan ism kiriting.','warning');return;}
      const button=modal.querySelector('#save-profile');button.disabled=true;button.textContent='Saqlanmoqda...';
      try{
        const row=await cloud.updateProfile({displayName:name,avatar,characterClass});
        applyCloudProfile(row,cloudUser);closeModal();render();toast('Profil yangilandi.','success');
      }catch(error){button.disabled=false;button.textContent='Saqlash';toast(error.message||'Profil saqlanmadi.','warning');}
    });
  }

  async function signOutFromApp() {
    if(!cloud)return;
    const lastUsername=profile.username||'';
    try{await cloud.signOut();}catch(error){toast(error.message||'Chiqishda xatolik.','warning');return;}
    cloudUser=null;profile=defaultProfile();profile.username=lastUsername;saveProfile();closeModal();render();openAuthModal('signin',true);
  }

  function closeModal(){document.getElementById('modal-backdrop').classList.add('hidden');}
  function render() {
    updateChrome();
    const root=document.getElementById('app-content');
    if(activeView!=='world3d')window.DataSpaceWorld?.unmount();
    if(activeView==='world3d'){
      root.innerHTML=renderWorld3DHost();
      if(window.DataSpaceWorld)window.DataSpaceWorld.mount(document.getElementById('world3d-root'),window.DataSpace);
      else{root.innerHTML='<div class="card empty-state"><strong>3D olam moduli yuklanmoqda...</strong><p>Bir necha soniya kutib turing.</p></div>';setTimeout(()=>{if(activeView==='world3d')render();},300);}
      return;
    }
    if(activeView==='dashboard') root.innerHTML=renderDashboard();
    else if(activeView==='map') root.innerHTML=renderMap();
    else if(activeView==='course') root.innerHTML=renderCourse();
    else if(activeView==='arena') root.innerHTML=renderArena();
    else if(activeView==='achievements') root.innerHTML=renderAchievements();
    else if(activeView==='leaderboard') root.innerHTML=renderLeaderboard();
    else if(activeView==='teacher') root.innerHTML=renderTeacher();
    else root.innerHTML=renderDashboard();
  }
  function renderWorld3DHost() {
    return '<div class="w3d-root" id="world3d-root"></div>';
  }
  function renderJourneyTrack() {
    const stops=WORLDS.map((w,i)=>{
      const p=worldProgress(w),unlocked=isWorldUnlocked(i),finished=p.done===p.total;
      const state=finished?'complete':unlocked?'active':'locked';
      return '<button class="journey-stop '+state+'" data-world="'+i+'" aria-label="'+esc(w.name)+' — '+p.done+' / '+p.total+' missiya"><span class="journey-planet">'+w.emoji+'</span><strong>'+(i+1)+'. '+esc(w.name)+'</strong><small>'+p.done+'/'+p.total+' missiya</small></button>';
    }).join('');
    return '<section class="orbit-journey card"><div class="journey-heading"><div><span class="eyebrow">LIVE GALAXY MAP</span><h2>Galaktika bo‘ylab yo‘ling</h2><p>Sayyorani tanla — keyingi missiyang shu yerda kutmoqda.</p></div><span class="tag cyan">'+WORLDS.filter((w,i)=>isWorldUnlocked(i)).length+'/9 olam ochiq</span></div><div class="journey-route">'+stops+'</div></section>';
  }
  function renderLeaderboard() {
    return `<div class="section-heading" style="margin-top:0"><div><span class="eyebrow">GLOBAL EXPLORER RANKING</span><h2>🏆 Galaktika reytingi</h2><p>Barcha Data Explorerlar bir maydonda. Kim ko‘proq XP to‘plaganini ko‘r!</p></div><button class="btn btn-secondary" data-refresh-leaderboard>↻ Yangilash</button></div>
      <section class="leaderboard-overview"><div class="leaderboard-overview-copy"><span class="eyebrow">DATASPACE COMMUNITY</span><h3>Eng kuchli Explorer kim?</h3><p>XP, tugallangan missiyalar va daraja bo‘yicha jonli reyting.</p></div><div class="leaderboard-total"><strong id="leaderboard-count">—</strong><span>RO‘YXATDAGI O‘QUVCHI</span></div></section>
      <section class="leaderboard-podium" id="leaderboard-podium"><div class="leaderboard-loading">Reyting yuklanmoqda...</div></section>
      <section class="card leaderboard-table-card"><div class="leaderboard-table-heading"><div><h3>O‘quvchilar ro‘yxati</h3><p>XP ko‘p bo‘lgan o‘quvchi yuqorida turadi.</p></div><span class="tag cyan" id="leaderboard-me-rank">Mening o‘rnim: —</span></div><div id="leaderboard-list" class="leaderboard-list"><div class="leaderboard-loading">Serverdan ma’lumot olinmoqda...</div></div></section>`;
  }

  function leaderboardRowMarkup(user,index,compact=false) {
    const isMe=String(user.username||'').toLowerCase()===String(profile.username||'').toLowerCase()&&!!profile.username;
    const xp=Number(user.xp||0), done=Number(user.completed_count||0);
    const role=CHARACTER_CLASSES.find(x=>x.id===user.character_class)||CHARACTER_CLASSES[0];
    return `<div class="leaderboard-row ${isMe?'is-me':''} ${index<3?'top-rank':''}">
      <span class="leaderboard-rank rank-${index+1}">${index===0?'🥇':index===1?'🥈':index===2?'🥉':'#'+(index+1)}</span>
      <span class="leaderboard-avatar">${esc(user.avatar||'🚀')}</span>
      <span class="leaderboard-player"><strong>${esc(user.display_name||user.username||'Explorer')}${isMe?'<i>SEN</i>':''}</strong><small>@${esc(user.username||'explorer')} · ${esc(role.name)}</small></span>
      <strong class="leaderboard-xp">${xp.toLocaleString('uz-UZ')} <small>XP</small></strong>
      ${compact?'':`<span class="leaderboard-stat"><b>${Math.floor(xp/100)+1}</b><small>daraja</small></span><span class="leaderboard-stat"><b>${done}/54</b><small>missiya</small></span><span class="leaderboard-stat"><b>🔥 ${Number(user.streak||0)}</b><small>streak</small></span>`}
    </div>`;
  }

  async function refreshLeaderboard() {
    const targets=['leaderboard-list','teacher-users-list'];
    targets.forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="leaderboard-loading">O‘quvchilar ro‘yxati yuklanmoqda...</div>';});
    try{
      if(!cloud)throw new Error(cloudError||'Reyting serveriga ulanish imkoni yo‘q.');
      const users=await cloud.getLeaderboard();
      leaderboardCache=users;
      const html=users.length?users.map((u,i)=>leaderboardRowMarkup(u,i)).join(''):'<div class="leaderboard-empty"><span>🪐</span><strong>Hozircha o‘quvchilar yo‘q</strong><small>Birinchi bo‘lib akkaunt yarat va reytingni boshlang!</small></div>';
      targets.forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html;});
      const count=document.getElementById('leaderboard-count');if(count)count.textContent=users.length.toLocaleString('uz-UZ');
      const rank=users.findIndex(u=>String(u.username||'').toLowerCase()===String(profile.username||'').toLowerCase());
      const rankLabel=document.getElementById('leaderboard-me-rank');if(rankLabel)rankLabel.textContent=rank>=0?'Mening o‘rnim: #'+(rank+1):'Hali reytingda yo‘q';
      const podium=document.getElementById('leaderboard-podium');
      if(podium){
        podium.innerHTML=users.length?users.slice(0,3).map((u,i)=>`<article class="podium-card podium-${i+1}">${leaderboardRowMarkup(u,i,true)}<span class="podium-caption">${i===0?'GALAKTIKA CHEMPIONI':i===1?'KUMUSH EXPLORER':'BRONZA EXPLORER'}</span></article>`).join(''):'<div class="leaderboard-empty">Birinchi o‘rinni sen egalla!</div>';
      }
      const teacherCount=document.getElementById('teacher-user-count');if(teacherCount)teacherCount.textContent=users.length+' ta';
    }catch(error){
      const msg=esc(error.message||'Reytingni yuklab bo‘lmadi.');
      targets.forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="leaderboard-error">'+msg+'</div>';});
      const podium=document.getElementById('leaderboard-podium');if(podium)podium.innerHTML='<div class="leaderboard-error">'+msg+'</div>';
    }
  }

  function renderDashboard() {
    const done=completedCount(), pct=percent(done,54), next=getNextLesson();
    const wCards=WORLDS.slice(0,6).map((w,i)=>{
      const p=worldProgress(w),unlocked=isWorldUnlocked(i);
      return `<article class="world-mini card ${unlocked?'':'locked'}" data-world="${i}"><span class="world-emoji">${w.emoji}</span><strong>${w.name}</strong><small>${p.done}/${p.total} missiya · ${w.weeks}</small><div class="mini-progress"><i style="width:${p.pct}%"></i></div></article>`;
    }).join('');
    const nextText=next===null?'Barcha missiyalar tugadi!':`#${next+1} · ${lessons[next].title}`;
    return `<section class="hero-panel"><div class="hero-copy"><span class="eyebrow">YANGI AVLOD DATA ANALYTICS AKADEMIYASI</span><h1>Ma’lumotlar olamiga<br><span>xush kelibsan, ${esc(profile.name||'Explorer')}!</span></h1><p>54 ta missiya. 9 ta olam. Python, Pandas, SQL va Excel. Har bir kod — yangi kuch, har bir tahlil — yangi kashfiyot.</p><div class="hero-buttons"><button class="btn btn-primary" data-open-next>${done?'Davom etish':'Sayohatni boshlash'} <span>→</span></button><button class="btn btn-gold" data-view="world3d">🧊 3D olamda o‘yna</button><button class="btn btn-secondary" data-view="map">Galaktikani ko‘r</button></div></div><div class="hero-art hero-character-showcase"><div class="planet-orb"><span class="planet-moon"></span></div><div class="hero-character-card">${renderVoxelCharacter('showcase','idle')}<span class="hero-character-caption">${esc(getCharacterClass().name)}</span></div></div></section>
      <section class="hero-stats"><div class="stat-card card"><span class="stat-icon">🎯</span><div><strong>${done}<small style="display:inline;color:#8b9ab7;font-size:10px"> / 54</small></strong><small>Tugallangan missiya</small></div></div><div class="stat-card card"><span class="stat-icon cyan">⚡</span><div><strong>${profile.xp||0}</strong><small>Yig‘ilgan XP</small></div></div><div class="stat-card card"><span class="stat-icon gold">🏅</span><div><strong>${currentLevel()}</strong><small>Explorer darajasi</small></div></div><div class="stat-card card"><span class="stat-icon green">🔥</span><div><strong>${profile.streak||0}</strong><small>Kunlik seriya</small></div></div></section>
      ${renderJourneyTrack()}
      <div class="section-heading"><div><span class="eyebrow">PLAY ZONE · MINI O‘YIN</span><h2>Data Signal Hunt</h2><p>Hozir o‘ynab ko‘r — 5 raund, kamida 3 ta to‘g‘ri javob uchun kunlik 15 XP.</p></div><span class="tag gold">🎮 ARCADE</span></div>
      ${renderSignalGame()}
      <div class="section-heading"><div><span class="eyebrow">SENING MISSIYANG</span><h2>Sayohatni davom ettir</h2><p>${next===null?'Barcha darslarni muvaffaqiyatli yakunlading.':`Keyingi topshiriq: ${esc(nextText)}`}</p></div><button class="text-link" data-view="course">Barcha darslar →</button></div>
      <div class="dashboard-grid"><section><div class="continue-card card"><div class="continue-icon">${next===null?'🏆':TYPE_ICON[lessons[next].kind]}</div><div><strong>${next===null?'Akademiya yakunlandi':esc(nextText)}</strong><small>${next===null?'Sertifikatingni ko‘r':'2–5 daqiqalik o‘yin · PRO LAB ixtiyoriy'}</small></div><button class="btn btn-primary" data-open-next>${next===null?'Sertifikat':'Boshlash'} →</button></div>
      <div class="section-heading"><div><span class="eyebrow">KOSMIK XARITA</span><h2>O‘rganish olamlari</h2></div><button class="text-link" data-view="map">To‘liq xarita →</button></div><div class="world-preview">${wCards}</div></section>
      <aside class="daily-card card"><div class="daily-top"><span class="tag gold">✦ KUNLIK VAZIFA</span><span class="muted" style="font-size:9px">+20 XP</span></div><h3>${done===0?'Birinchi qadamni tashla!':'Bugun bitta missiya zabt et'}</h3><p>Har kuni ozgina amaliyot katta natijaga olib keladi. Bugun navbatdagi darsni yakunlab, galaktikadagi izlaringni qoldir.</p><div class="daily-reward"><span>✧</span> Tajriba +20 XP <span>·</span> Yangi bilim</div><button class="btn btn-secondary" data-open-next style="width:100%">${done===54?'Sertifikatni ko‘r':'Missiyaga kirish'} →</button></aside></div>
      <div class="section-heading"><div><span class="eyebrow">KURSDAGI TARAQQIYOT</span><h2>18 haftalik yo‘l xaritasi</h2><p>Python → Pandas → SQL → Excel → Yakuniy loyiha</p></div><span class="tag cyan">${pct}% bajarildi</span></div><div class="card" style="padding:17px"><div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;margin-bottom:9px"><strong>Umumiy kurs</strong><span class="muted">${done}/54 dars</span></div><div class="progress-track" style="height:8px"><i style="width:${pct}%"></i></div></div><div class="section-heading"><div><h2>Har bir dars qanday o‘tadi?</h2><p>Avval o‘yna, keyin kashf et. Nazariya yechimdan keyin ochiladi.</p></div><span class="tag cyan">2–5 daqiqa o‘yin</span></div><div class="hero-stats"><div class="stat-card card"><span class="stat-icon">🎬</span><div><strong>30 <small style="display:inline;font-size:9px;color:#91a0ba">son</small></strong><small>Missiya hikoyasi</small></div></div><div class="stat-card card"><span class="stat-icon cyan">🎮</span><div><strong>2–5 <small style="display:inline;font-size:9px;color:#91a0ba">daq</small></strong><small>Interaktiv mini-o‘yin</small></div></div><div class="stat-card card"><span class="stat-icon gold">💡</span><div><strong>1–2 <small style="display:inline;font-size:9px;color:#91a0ba">daq</small></strong><small>Aha! izohi</small></div></div><div class="stat-card card"><span class="stat-icon green">🏅</span><div><strong>+20 XP</strong><small>Nishon va keyingi qadam</small></div></div></div>`;
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
    return `<div class="lesson-row ${done?'done':''}" data-lesson="${index}" ${locked?'aria-disabled="true"':''}><span class="lesson-status">${done?'✓':locked?'🔒':String(index+1).padStart(2,'0')}</span><div><strong>${esc(l.title)}</strong><small>${weekdays[index%3]} · ${TYPE_LABEL[l.kind]} · 2–5 daqiqa o‘yin</small></div><span class="lesson-type tag ${TYPE_TAG[l.kind]}">${TYPE_ICON[l.kind]}</span></div>`;
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
  async function nextSignalQuestion() {
    if(arcadeState.phase!=='answered')return;
    if(arcadeState.round<arcadeState.questions.length-1){
      arcadeState.round++;arcadeState.selected=null;arcadeState.phase='playing';render();return;
    }
    arcadeState.phase='done';
    if(!cloudUser){arcadeState.reward='Rekordni saqlash uchun akkauntingga kir.';render();return;}
    try{
      const row=await cloud.claimArcadeReward(arcadeState.score);
      if(row)applyCloudProfile(row,cloudUser);
      arcadeState.reward=arcadeState.score>=3?'🎁 Natijang saqlandi. Kunlik XP mukofoti tekshirildi!':'Natijang rekordingga saqlandi. 3+ javob uchun XP olasan.';
      if(arcadeState.score>=3)toast(arcadeState.reward,'success');
    }catch(error){arcadeState.reward=error.message||'Natijani saqlashda xatolik.';toast(arcadeState.reward,'warning');}
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
    const missionBadgeCards=missionGames.map((g,i)=>{const ok=isDone(i);return `<article class="mission-badge-card ${ok?'unlocked':''}"><span>${ok?'🏅':'🔒'}</span><div><strong>${String(i+1).padStart(2,'0')} · ${esc(g.badge||g.title)}</strong><small>${ok?'Ochildi':'Missiyani yakunla'}</small></div></article>`;}).join('');
    return `<div class="section-heading" style="margin-top:0"><div><span class="eyebrow">TROPHY ROOM</span><h2>Mukofotlarim</h2><p>Har bir kichik g‘alaba — katta maqsad sari qadam.</p></div><span class="tag gold">${badgeDefs.filter(b=>b.ok()).length}/${badgeDefs.length} nishon</span></div><section class="achievement-grid">${badges}</section><div class="section-heading"><div><h2>54 ta missiya nishoni</h2><p>Har bir mini-o‘yin uchun alohida nishon. Missiyani bajarganingda ochiladi.</p></div><span class="tag cyan">${completedCount()}/54 ochildi</span></div><section class="mission-badge-grid">${missionBadgeCards}</section><div class="section-heading"><div><h2>Sertifikat</h2><p>54 ta missiya tugagandan keyin ochiladi.</p></div></div><section class="card" style="padding:20px;display:flex;align-items:center;gap:15px"><span style="font-size:35px">🎓</span><div style="flex:1"><strong style="font-size:12px">DataSpace Academy — Data Analytics</strong><small style="display:block;color:var(--muted);font-size:10px;margin-top:5px">${completedCount()===54?'Sertifikating tayyor!':'Hali '+(54-completedCount())+' ta missiya qoldi.'}</small></div><button class="btn ${completedCount()===54?'btn-gold':'btn-ghost'}" data-certificate ${completedCount()===54?'':'disabled'}>Sertifikatni ochish →</button></section>`;
  }
  function renderTeacher() {
    const p=percent(completedCount(),54);
    return `<div class="section-heading" style="margin-top:0"><div><span class="eyebrow">MENTOR UCHUN</span><h2>Mentor paneli</h2><p>DataSpace’ga ro‘yxatdan o‘tgan barcha o‘quvchilar va ularning natijalari.</p></div><span class="tag violet">GLOBAL CLASSROOM</span></div>
      <div class="teacher-grid"><div class="teacher-metric card"><strong>${completedCount()}/54</strong><small>Mening missiyalarim</small></div><div class="teacher-metric card"><strong>${p}%</strong><small>Mening taraqqiyotim</small></div><div class="teacher-metric card"><strong>${profile.xp||0}</strong><small>Mening XP</small></div></div>
      <section class="card teacher-user-list-card"><div class="leaderboard-table-heading"><div><h3>👥 Ro‘yxatdan o‘tgan o‘quvchilar</h3><p>Hamma userlar shu yerda ko‘rinadi. Ro‘yxat XP bo‘yicha saralangan.</p></div><span class="tag cyan" id="teacher-user-count">Yuklanmoqda</span></div><div id="teacher-users-list" class="leaderboard-list"><div class="leaderboard-loading">O‘quvchilar olinmoqda...</div></div><div class="teacher-list-actions"><button class="btn btn-secondary" data-refresh-leaderboard>↻ Ro‘yxatni yangilash</button></div></section>
      <section class="card" style="padding:19px"><h3 style="font-size:14px">Mening profilim</h3><p class="muted" style="font-size:10px">@${esc(profile.username||'')} · ${esc(profile.name||'Explorer')} · ${profile.avatar||'🚀'} · ${currentLevel()}-daraja</p><div class="progress-track" style="height:8px"><i style="width:${p}%"></i></div><div class="teacher-tools"><button class="btn btn-primary" data-export-progress>Progressni eksport qilish (.json)</button><button class="btn btn-secondary" data-edit-profile>Profilni sozlash</button><button class="btn btn-ghost" data-cloud-signout>Akkauntdan chiqish</button></div><small class="muted">Eksport qilingan JSON faqat lokal zaxira nusxasi; global reyting serverdagi natijadan hisoblanadi.</small></section>`;
  }
  function makeMissionGameState(index,replay=false) {
    const g=missionGames[index]||{};
    const order=(g.steps||[]).map((_,i)=>i);
    for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
    if(order.length>1&&order.every((v,i)=>v===i)){const first=order.shift();order.push(first);}
    return {index,selected:null,picked:[],order,assignments:{},selectedItem:null,marked:[],minValue:g.start??g.min??0,flag:!!g.startFlag,surveyRows:[],surveySubject:g.subjects?.[0]||'',surveyHours:2,feedback:'',playerStep:isDone(index)&&!replay?3:0,solved:isDone(index)&&!replay};
  }
  function missionGameMatches(g,state) {
    return (g.rows||[]).filter(r=>Number(r.value)>=Number(state.minValue)&&(!g.flagLabel||!state.flag||!!r.flag));
  }
  function renderMissionGame(g,index) {
    if(!g)return '<section class="mission-game card"><p>Bu missiya uchun o‘yin ma’lumoti topilmadi.</p></section>';
    if(!missionGameState||missionGameState.index!==index)missionGameState=makeMissionGameState(index);
    const s=missionGameState;
    let play='';
    if(g.type==='sort'){
      const placed=Object.keys(s.assignments).length;
      const pool=g.items.map((item,i)=>s.assignments[i]===undefined?'<button class="sort-token '+(s.selectedItem===i?'picked':'')+'" draggable="true" data-game-sort-item="'+i+'">'+esc(item[0])+'</button>':'').join('');
      const bins=g.buckets.map((bucket,b)=>'<button class="sort-bin '+(Object.values(s.assignments).includes(b)?'has-items':'')+'" data-game-bin="'+b+'"><strong>'+esc(bucket)+'</strong><span class="bin-count">'+g.items.filter((_,i)=>s.assignments[i]===b).length+' ta</span><div class="bin-items">'+g.items.map((item,i)=>s.assignments[i]===b?'<span>'+esc(item[0])+'</span>':'').join('')+'</div></button>').join('');
      play='<div class="sort-pool">'+pool+'</div><div class="sort-bins">'+bins+'</div><div class="game-instruction">Signalni qutiga sudra yoki signalni, keyin mos qutini bos. Joylashtirilgan: <b>'+placed+'/'+g.items.length+'</b></div>';
    } else if(g.type==='sequence'){
      const picked=s.picked.map((n,i)=>'<div class="sequence-picked"><span>'+(i+1)+'</span><code>'+esc(g.steps[n])+'</code></div>').join('');
      const tiles=s.order.filter(n=>!s.picked.includes(n)).map(n=>'<button class="sequence-tile" data-game-seq-item="'+n+'"><span>＋</span><code>'+esc(g.steps[n])+'</code></button>').join('');
      play='<div class="sequence-work"><div class="sequence-slots">'+(picked||'<div class="sequence-empty">Kod bo‘laklarini shu yerga ketma-ket joylashtir.</div>')+'</div><div class="sequence-tiles">'+tiles+'</div><div class="sequence-actions"><button class="btn btn-ghost" data-game-undo '+(!s.picked.length?'disabled':'')+'>↶ Bittasini qaytar</button><button class="btn btn-ghost" data-game-reset>Qayta aralashtir</button></div></div>';
    } else if(g.type==='clean'){
      const rows=g.rows.map((row,i)=>'<button class="clean-row '+(s.marked.includes(i)?'marked':'')+'" data-game-row="'+i+'"><span class="clean-check">'+(s.marked.includes(i)?'✓':'')+'</span>'+row.map(cell=>'<span>'+esc(cell||'∅ bo‘sh')+'</span>').join('')+'</button>').join('');
      play='<div class="clean-table"><div class="clean-row clean-head"><span></span>'+g.headers.map(h=>'<span>'+esc(h)+'</span>').join('')+'</div>'+rows+'</div><div class="game-instruction">Shubhali qatorlarni belgila. Bir nechta qatorni tanlash mumkin.</div>';
    } else if(g.type==='survey'){
      const counts=(g.subjects||[]).map(subject=>({subject,count:s.surveyRows.filter(row=>row.subject===subject).length}));
      const max=Math.max(1,...counts.map(x=>x.count));
      const rows=s.surveyRows.map((row,i)=>'<tr><td>Anonim #'+(i+1)+'</td><td>'+esc(row.subject)+'</td><td>'+Number(row.hours)+' soat</td></tr>').join('');
      play='<div class="survey-privacy">🔒 Ism, telefon yoki manzilni kiritma. Sinfdoshlaringdan faqat rozilik olgan holda anonim javob so‘ra.</div><div class="survey-form"><label>Sevimli fan<select id="survey-subject">'+g.subjects.map(subject=>'<option '+(subject===s.surveySubject?'selected':'')+'>'+esc(subject)+'</option>').join('')+'</select></label><label>Kunlik mustaqil o‘qish vaqti <b><span id="survey-hours-value">'+Number(s.surveyHours)+'</span> soat</b><input id="survey-hours" type="range" min="0" max="8" step="0.5" value="'+Number(s.surveyHours)+'"></label><button class="btn btn-secondary" data-game-survey-add>＋ Anonim javobni qo‘sh</button></div><div class="survey-progress"><b>'+s.surveyRows.length+' ta javob yig‘ildi</b><span>Missiya uchun kamida '+Number(g.minimum||3)+' ta javob kerak</span></div><div class="survey-table-wrap"><table class="survey-table"><thead><tr><th>Ishtirokchi</th><th>Sevimli fan</th><th>O‘qish vaqti</th></tr></thead><tbody>'+(rows||'<tr><td colspan="3">Hali javob yo‘q. Birinchi anonim yozuvni qo‘sh.</td></tr>')+'</tbody></table></div><div class="survey-chart">'+counts.map(x=>'<div class="survey-chart-row"><span>'+esc(x.subject)+'</span><div><i style="width:'+(x.count/max*100)+'%"></i></div><b>'+x.count+'</b></div>').join('')+'</div>';
    } else if(g.type==='filter'){
      const matches=missionGameMatches(g,s);
      const preview=matches.map(r=>'<span class="filter-result-chip">'+esc(r.name)+' <b>'+Number(r.value)+(g.unit||'')+'</b></span>').join('')||'<span class="filter-empty">Hozircha mos signal yo‘q</span>';
      play='<div class="filter-controls"><label><span>'+esc(g.metric||'Chegara')+': <b class="filter-value">'+Number(s.minValue)+(g.unit||'')+'</b></span><input type="range" data-game-range min="'+Number(g.min??0)+'" max="'+Number(g.max??100)+'" step="1" value="'+Number(s.minValue)+'"></label>'+(g.flagLabel?'<label class="filter-toggle"><input type="checkbox" data-game-flag '+(s.flag?'checked':'')+'><span>'+esc(g.flagLabel)+'</span></label>':'')+'</div><div class="filter-preview"><div><strong>Filtrdan o‘tganlar</strong><span>'+matches.length+' ta yozuv</span></div><div class="filter-results" data-game-filter-preview>'+preview+'</div></div>';
    } else {
      if(g.table){
        play+='<div class="formula-table"><table><thead><tr>'+g.table.headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+g.table.rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
      }
      if(g.values&&g.type==='forecast'){
        const min=Math.min(...g.values),span=Math.max(...g.values)-min||1;
        const coords=g.values.map((v,i)=>({x:24+i*312/Math.max(1,g.values.length-1),y:98-(Number(v)-min)/span*72}));
        const points=coords.map(p=>p.x+','+p.y).join(' ');
        play+='<div class="forecast-chart"><svg viewBox="0 0 360 130" role="img" aria-label="Oylik o‘sish trendi"><line x1="18" y1="100" x2="342" y2="100" class="forecast-axis"/><polyline points="'+points+'" class="forecast-line"/>'+coords.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="5" class="forecast-point"/>').join('')+'<circle cx="360" cy="2" r="0" /></svg><div class="forecast-labels">'+g.labels.map(x=>'<span>'+esc(x)+'</span>').join('')+'<span class="forecast-next">May ?</span></div><div class="forecast-hint">Keyingi nuqta hali yashirilgan — trendni davom ettir.</div></div>';
      }else if(g.values){
        const max=Math.max(...g.values,1);
        play+='<div class="game-chart-preview">'+g.values.map((v,i)=>'<div class="game-chart-col"><div class="game-chart-bar" style="height:'+Math.max(8,Number(v)/max*100)+'%"></div><b>'+esc(v)+'</b><small>'+esc(g.labels?.[i]||String(i+1))+'</small></div>').join('')+'</div>';
      }
      if(g.prompt)play+='<p class="game-question">'+esc(g.prompt)+'</p>';
      play+='<div class="game-choices '+(g.type==='chart'?'chart-choices':'')+'">'+g.choices.map((choice,i)=>{
        const text=typeof choice==='string'?choice:choice.label;
        const mark=g.type==='chart'?(i===0?'📊':i===1?'📈':i===2?'🥧':'🔎'):g.type==='formula'?'ƒ':'◈';
        return '<button class="game-choice '+(s.selected===i?'selected':'')+'" data-game-choice="'+i+'"><span class="choice-mark">'+mark+'</span><span>'+esc(text)+'</span><i>'+(s.selected===i?'Tanlandi':'')+'</i></button>';
      }).join('')+'</div>';
    }
    const solved=s.solved?'<div class="game-feedback success"><strong>✦ Signal topildi!</strong><span>Endi “Aha!” izohini ochib, bu usul nima uchun ishlashini ko‘r.</span><button class="btn btn-ghost" data-game-replay>↻ Qayta o‘ynash</button></div>':'';
    const feedback=s.feedback?'<div class="game-feedback '+(s.solved?'success':'retry')+'"><strong>'+(s.solved?'To‘g‘ri!':'Yana bir urinish!')+'</strong><span>'+esc(s.feedback)+'</span></div>':'';
    const canCheck=g.type==='sort'?Object.keys(s.assignments).length===g.items.length:g.type==='sequence'?s.picked.length===g.steps.length:g.type==='clean'?s.marked.length>0:g.type==='filter'?true:g.type==='survey'?s.surveyRows.length>=Number(g.minimum||3):s.selected!==null;
    return '<section class="mission-game card"><div class="game-topline"><span class="game-badge">🎮 '+esc(g.badge||'MISSION GAME')+'</span><span class="game-duration">2–5 DAQIQA</span></div><h2>'+esc(g.title)+'</h2><p class="game-brief">'+esc(g.brief)+'</p>'+renderGameWorldStage(g,index,s)+'<div class="game-play-area"><div class="obby-quest-label"><span>🚩 OBBY CHALLENGE</span><b>PORTALNI OCHISH UCHUN TOPSHIRIQNI BAJAR</b></div>'+play+'</div><div class="game-controls"><button class="btn btn-primary" data-game-check '+(!canCheck||s.solved?'disabled':'')+'>Tekshir va signal yubor →</button><span>'+((g.type==='sequence')?s.picked.length+'/'+g.steps.length+' bo‘lak':g.type==='sort'?Object.keys(s.assignments).length+'/'+g.items.length+' signal':g.type==='clean'?s.marked.length+' qator belgilandi':s.solved?'Bajarildi':'Missiyani yech')+'</span></div>'+feedback+solved+'</section>';
  }
  function checkMissionGame(index) {
    const g=missionGames[index],s=missionGameState;
    if(!g||!s||s.index!==index||s.solved)return;
    let ok=false;
    if(g.type==='sort')ok=g.items.every((item,i)=>Number(s.assignments[i])===Number(item[1]));
    else if(g.type==='sequence')ok=s.picked.length===g.steps.length&&s.picked.every((n,i)=>n===i);
    else if(g.type==='clean')ok=s.marked.length===g.bad.length&&g.bad.every(n=>s.marked.includes(n));
    else if(g.type==='filter')ok=Number(s.minValue)===Number(g.target)&&(!g.flagLabel||!!s.flag===!!g.targetFlag);
    else if(g.type==='survey')ok=s.surveyRows.length>=Number(g.minimum||3);
    else ok=Number(s.selected)===Number(g.correct);
    if(ok){s.solved=true;s.playerStep=3;s.feedback='Zo‘r! Vazifani o‘zing hal qilding. Endi qisqa izoh va XP seni kutmoqda.';toast('Mini-o‘yin bajarildi! “Aha!” izohi ochildi.','success');}
    else{s.feedback=g.type==='sort'?'Har bir signalni uning ma’no turiga qarab joylashtir.':g.type==='sequence'?'Kod yuqoridan pastga bajariladi. Avval ma’lumot tayyorlanadi, keyin amal ishlaydi.':g.type==='clean'?'Bo‘sh katak, takroriy ID yoki noto‘g‘ri formatni izla.':g.type==='filter'?'Slayder chegarasi va qo‘shimcha belgini vazifa bilan solishtir.':'Tanlovni yana bir bor tekshir. Qaysi javob vazifadagi maqsadga olib boradi?';toast('Hali to‘g‘ri emas. Yana urinib ko‘r!','warning');}
    renderLesson();
  }
  function updateMissionFilterPreview() {
    const g=missionGames[activeLessonIndex],s=missionGameState;
    if(!g||g.type!=='filter'||!s)return;
    const label=document.querySelector('.filter-value');if(label)label.textContent=Number(s.minValue)+(g.unit||'');
    const rows=missionGameMatches(g,s);
    const preview=document.querySelector('[data-game-filter-preview]');
    if(preview)preview.innerHTML=rows.map(r=>'<span class="filter-result-chip">'+esc(r.name)+' <b>'+Number(r.value)+(g.unit||'')+'</b></span>').join('')||'<span class="filter-empty">Hozircha mos signal yo‘q</span>';
    const count=document.querySelector('.filter-preview>div>span');if(count)count.textContent=rows.length+' ta yozuv';
  }
  function wireMissionGame(g,index) {
    const root=document.querySelector('.mission-game');if(!root||!g)return;
    root.querySelectorAll('[data-game-sort-item]').forEach(el=>{
      el.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',el.dataset.gameSortItem);if(missionGameState)missionGameState.selectedItem=Number(el.dataset.gameSortItem);});
    });
    root.querySelectorAll('[data-game-bin]').forEach(el=>{
      el.addEventListener('dragover',e=>e.preventDefault());
      el.addEventListener('drop',e=>{e.preventDefault();const item=Number(e.dataTransfer.getData('text/plain'));if(Number.isInteger(item)){missionGameState.assignments[item]=Number(el.dataset.gameBin);missionGameState.selectedItem=null;renderLesson();}});
    });
    const hours=root.querySelector('#survey-hours');
    if(hours)hours.addEventListener('input',()=>{const label=root.querySelector('#survey-hours-value');if(label)label.textContent=hours.value;});
    const range=root.querySelector('[data-game-range]');
    if(range)range.addEventListener('input',()=>{missionGameState.minValue=Number(range.value);updateMissionFilterPreview();});
    const flag=root.querySelector('[data-game-flag]');
    if(flag)flag.addEventListener('change',()=>{missionGameState.flag=flag.checked;updateMissionFilterPreview();});
  }

  function openLesson(index) {
    if(index<0||index>=lessons.length)return;
    if(index>0&&!isDone(index-1)&&!isDone(index)) { toast('Avval oldingi missiyani tugat. Har bir daraja ketma-ket ochiladi.','warning');return; }
    const worldIndex=WORLDS.findIndex(w=>index>=w.from&&index<=w.to);
    if(!isWorldUnlocked(worldIndex)){toast('Bu olam hali qulflangan. Avval oldingi olamdagi missiyalarni bajar.','warning');return;}
    activeLessonIndex=index;activeView='lesson';selectedQuiz=null;missionGameState=makeMissionGameState(index);editorDirty=false;excelSelected='E2';excelActions={};excelCells=makeExcelCells();
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',false));
    const crumb=document.getElementById('breadcrumb-current');if(crumb)crumb.textContent=`Missiya ${index+1}`;
    renderLesson();window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderLesson() {
    window.DataSpaceWorld?.unmount();
    const index=activeLessonIndex,l=lessons[index],worldIndex=WORLDS.findIndex(w=>index>=w.from&&index<=w.to),world=WORLDS[worldIndex];
    const done=isDone(index),next=index<53?index+1:null,g=missionGames[index];
    const codeArea=(runtime)=>`<div class="lab-header"><div><strong>${runtime==='python'?'Python Editor':'SQL Query Editor'}</strong><small style="display:block;margin-top:3px">${runtime==='python'?'Brauzerda Python 3 · Pyodide':'SQLite · SQL sandbox'}</small></div><div class="lab-toolbar"><span class="tag ${runtime==='python'?'cyan':'gold'}">${runtime==='python'?'PY':'SQL'}</span></div></div><div class="editor-wrap"><div class="editor-top"><i class="editor-dot"></i><i class="editor-dot"></i><i class="editor-dot"></i><span class="editor-file">${runtime==='python'?'mission.py':'query.sql'}</span></div><textarea id="code-editor" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off">${esc(l.starter||'')}</textarea></div><div class="lab-actions"><button class="btn btn-secondary" id="run-code">▶ Kodni ishga tushir</button><button class="btn btn-primary" id="check-code">✓ Kodni tekshir</button><button class="btn btn-ghost" id="reset-code">Qayta tiklash</button><small>${runtime==='python'?'Python brauzer ichida ishlaydi.':'So‘rov lokal SQLite bazasida bajariladi.'}</small></div><div class="console-panel"><div class="console-head"><span>▸ NATIJA / CONSOLE</span><span id="runtime-status">Kutmoqda</span></div><div class="console-output" id="console-output"><span class="placeholder">Natija shu yerda ko‘rinadi. Kodni ishga tushir.</span></div><div id="plot-preview" class="plot-preview hidden"></div><div id="sql-results" class="sql-table-wrap hidden"></div></div>`;
    let lab='';
    if(l.kind==='python') lab=codeArea('python');
    else if(l.kind==='sql') lab=codeArea('sql');
    else if(l.kind==='quiz') lab=renderQuiz(l);
    else if(l.kind==='excel') lab=renderExcelLab(l);
    else if(l.kind==='project') lab=renderProjectLab(l,index);
    const gameHtml=renderMissionGame(g,index);
    const ahaHtml=missionGameState?.solved?`<section class="aha-card card"><div class="aha-label">💡 AHA! · KASHFIYOT</div><h2>Endi tushunding!</h2><p>${esc(g?.aha||l.explanation||l.concept||'')}</p><details class="deeper-concept"><summary>Batafsil tushuncha va misol</summary><p>${esc(l.concept||'')}</p>${l.example?`<pre>${esc(l.example)}</pre>`:''}<p class="objective-note"><b>Bugungi maqsad:</b> ${esc(l.objective||'')}</p></details><div class="aha-mission-badge"><span>🏅</span><div><strong>Missiya nishoni</strong><small>${esc(g?.badge||g?.title||'Data Explorer')}</small></div><span class="tag gold">${done?'Ochildi':'Mukofot tayyor'}</span></div><div class="aha-actions"><button class="btn btn-gold" data-game-complete="${index}" ${done?'disabled':''}>${done?'Missiya avval bajarilgan ✓':'Missiyani yakunlash · +20 XP'} ${done?'':'→'}</button><span>${done?'XP va nishon avval olingan.':'Mukofot: +20 XP va missiya nishoni'}</span></div></section>`:'';
    const doneHtml=done?`<div class="complete-card card"><h3>✓ Bu missiya bajarilgan!</h3><p>O‘yinni qayta o‘ynab bilimni mustahkamlashing mumkin.</p>${next!==null?`<button class="btn btn-primary" data-next-lesson="${next}">Keyingi missiya →</button>`:'<button class="btn btn-gold" data-certificate>Sertifikatni ko‘rish →</button>'}</div>`:'';
    document.getElementById('app-content').innerHTML=`<div class="lesson-top"><button class="back-button" data-view="course">← Darslar</button><div class="lesson-top-copy"><small>${world.emoji} ${world.name.toUpperCase()} · ${l.week}-HAFTA · MISSIYA ${index+1}/54</small><h1>${esc(l.title)}</h1></div><div class="lesson-top-progress"><strong>${completedCount()}/54</strong><div class="progress-track"><i style="width:${percent(completedCount(),54)}%"></i></div></div></div>
      <section class="mission-story card"><div class="story-meta"><span class="tag violet">🎬 30 SONIYALIK MISSIYA HIKOYASI</span><span class="tag cyan">${world.emoji} ${world.name}</span></div><h2>Vaziyatni hal qil!</h2><p>${esc(l.story||'')}</p><div class="story-objective"><b>🎯 Maqsad:</b> ${esc(l.objective||'')}</div><button class="hint-toggle" id="show-hint">💡 Yordam kerakmi?</button><div id="hint-panel" class="hint-panel hidden">${esc(l.hint||'Avval vaziyatni kuzat, keyin o‘zingga mos keladigan amaliy harakatni tanla.')}</div></section>
      ${gameHtml}
      ${ahaHtml}
      <details class="pro-lab"><summary>🧪 PRO LAB · Qo‘shimcha amaliyot va kod muhiti <span>ixtiyoriy</span></summary><div class="pro-lab-inner"><p class="pro-lab-intro">Mini-o‘yinni bajarganingdan keyin mavzuni haqiqiy kod yoki jadvalda sinab ko‘r. Bu bo‘lim qo‘shimcha mashq uchun.</p>${lab}</div></details>
      ${doneHtml}
      <div class="lesson-bottom-nav"><span>${world.emoji} ${world.name} · ${index+1}/54</span><button class="text-link" data-view="course">Barcha darslar ro‘yxati →</button></div>`;
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
    wireMissionGame(missionGames[index],index);
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
  async function completeLesson(index) {
    if(!cloudUser){toast('XP yig‘ish uchun akkauntingga kir.','warning');openAuthModal('signin');return;}
    if(isDone(index)){toast('Bu missiya avval bajarilgan. Davom et!','success');return;}
    if(missionGames[index]&&(!missionGameState||missionGameState.index!==index||!missionGameState.solved)){toast('Avval dars ichidagi mini-o‘yinni yakunla. Keyin XP ochiladi.','warning');return;}
    try{
      const row=await cloud.completeLesson(index);
      if(!row)throw new Error('Natijani serverga saqlab bo‘lmadi. Qayta urinib ko‘r.');
      applyCloudProfile(row,cloudUser);celebrateMission();
      if(profile.completed.length===1)toast('Birinchi signal nishoni ochildi!','success');
      if(profile.completed.length===54)toast('Barcha missiyalar tugadi — sertifikating tayyor!','success');
      toast(`Missiya bajarildi! +20 XP · Jami ${profile.xp} XP`,'success');
      renderLesson();
    }catch(error){toast(error.message||'Progressni saqlab bo‘lmadi.','warning');}
  }
  // 3D world quest reward. Does not change the current view, so the player stays in the world.
  async function awardWorldQuest(index) {
    if(!Number.isInteger(index)||index<0||index>=54)return {ok:false,error:'Noto‘g‘ri missiya indeksi.'};
    if(isDone(index))return {ok:true,already:true,xp:0};
    if(cloudUser&&cloud){
      try{
        const row=await cloud.completeLesson(index);
        if(!row)throw new Error('Server natijani qaytarmadi.');
        applyCloudProfile(row,cloudUser);celebrateMission();
        return {ok:true,xp:20,synced:true};
      }catch(error){return {ok:false,error:error.message||'Natijani serverga saqlab bo‘lmadi.'};}
    }
    profile.completed.push(index);
    profile.xp=(profile.xp||0)+20;
    saveProfile();celebrateMission();
    return {ok:true,xp:20,local:true};
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
      if(e.target.closest('[data-cloud-signout]')){signOutFromApp();return;}
      if(e.target.closest('[data-guest-mode]')){closeModal();toast('Mehmon rejimi: 3D olamni o‘rganishing mumkin. XP shu brauzerda saqlanadi.','success');return;}
      if(e.target.closest('[data-refresh-leaderboard]')){refreshLeaderboard();return;}
      if(e.target.closest('[data-open-auth]')){openAuthModal(cloudUser?'signin':'signup');return;}
      const playerAction=e.target.closest('[data-player-action]');
      if(playerAction){triggerCharacterAction(playerAction.dataset.playerAction);return;}
      const gameSortItem=e.target.closest('[data-game-sort-item]');
      if(gameSortItem){missionGameState.selectedItem=Number(gameSortItem.dataset.gameSortItem);renderLesson();return;}
      const gameBin=e.target.closest('[data-game-bin]');
      if(gameBin){if(missionGameState?.selectedItem!==null&&missionGameState?.selectedItem!==undefined){missionGameState.assignments[missionGameState.selectedItem]=Number(gameBin.dataset.gameBin);missionGameState.selectedItem=null;renderLesson();}else toast('Avval saralanadigan signalni tanla yoki uni qutiga sudra.','warning');return;}
      const gameSeq=e.target.closest('[data-game-seq-item]');
      if(gameSeq){const n=Number(gameSeq.dataset.gameSeqItem);if(!missionGameState.picked.includes(n)){missionGameState.picked.push(n);renderLesson();}return;}
      if(e.target.closest('[data-game-undo]')){missionGameState?.picked.pop();renderLesson();return;}
      if(e.target.closest('[data-game-reset]')||e.target.closest('[data-game-replay]')){missionGameState=makeMissionGameState(activeLessonIndex,true);renderLesson();return;}
      if(e.target.closest('[data-game-survey-add]')){
        const subject=document.getElementById('survey-subject')?.value||'';
        const hours=Number(document.getElementById('survey-hours')?.value??2);
        if(!subject||!Number.isFinite(hours)||hours<0||hours>8){toast('Javob qiymatlarini tekshir.','warning');return;}
        if(missionGameState.surveyRows.length>=12){toast('Bu kichik namuna uchun 12 ta javob yetarli.','warning');return;}
        missionGameState.surveyRows.push({subject,hours});
        missionGameState.surveySubject=subject;missionGameState.surveyHours=hours;
        renderLesson();return;
      }
      const gameChoice=e.target.closest('[data-game-choice]');
      if(gameChoice){missionGameState.selected=Number(gameChoice.dataset.gameChoice);renderLesson();return;}
      const gameRow=e.target.closest('[data-game-row]');
      if(gameRow){const n=Number(gameRow.dataset.gameRow);missionGameState.marked=missionGameState.marked.includes(n)?missionGameState.marked.filter(x=>x!==n):[...missionGameState.marked,n];renderLesson();return;}
      if(e.target.closest('[data-game-check]')){checkMissionGame(activeLessonIndex);return;}
      const gameComplete=e.target.closest('[data-game-complete]');
      if(gameComplete){completeLesson(Number(gameComplete.dataset.gameComplete));return;}
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
      if(e.target.closest('[data-edit-profile]')){openProfileModal();return;}
      if(e.target.closest('[data-reset-progress]')){if(confirm('Shu brauzerdagi barcha DataSpace progressini o‘chirishni xohlaysanmi?')){profile=defaultProfile();saveProfile();render();toast('Lokal progress qayta tiklandi.','warning');}return;}
      if(e.target.closest('[data-close-modal]')){closeModal();return;}
    });
    document.getElementById('profile-button').addEventListener('click',()=>openProfileModal());
    document.getElementById('top-profile').addEventListener('click',()=>openProfileModal());
    document.getElementById('mobile-menu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
    document.getElementById('modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop')closeModal();});
    document.addEventListener('change',e=>{if(e.target.id==='import-progress-file'&&e.target.files[0])importProgress(e.target.files[0]);});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){closeModal();return;}
      if(activeView!=='lesson'||e.repeat||e.target?.matches('input,textarea,select,[contenteditable="true"]')||e.target?.closest('button,a'))return;
      const key=e.code==='Space'?'jump':e.key==='ArrowRight'?'forward':e.key==='ArrowLeft'?'back':e.key.toLowerCase()==='w'?'wave':e.key.toLowerCase()==='d'?'dance':null;
      if(key){e.preventDefault();triggerCharacterAction(key);}
    });
  }
  function renderCourseIntoPage() {
    const root=document.getElementById('app-content');root.innerHTML=renderCourse();
  }
  async function init() {
    bindGlobalEvents();
    try {
      const [res,gameRes]=await Promise.all([fetch('data/curriculum.json'),fetch('data/mission-games.json')]);
      if(!res.ok)throw new Error(`Kurs fayli yuklanmadi: ${res.status}`);
      if(!gameRes.ok)throw new Error(`Mini-o‘yinlar fayli yuklanmadi: ${gameRes.status}`);
      [lessons,missionGames]=await Promise.all([res.json(),gameRes.json()]);
      if(lessons.length!==54)throw new Error(`Kurs 54 dars bo‘lishi kerak, hozir ${lessons.length}.`);
      if(missionGames.length!==54)throw new Error(`Har bir dars uchun mini-o‘yin kerak: ${missionGames.length}/54.`);
      let hadAuthSession=false;
      try{
        cloud=await import('./cloud.js');
        cloudUser=await cloud.currentUser();
        hadAuthSession=!!cloudUser;
        if(cloudUser){
          let row=await cloud.getMyProfile();
          if(!row){
            const username=String(cloudUser.email||'').split('@')[0].toLowerCase();
            if(!/^[a-z0-9_]{3,20}$/.test(username))throw new Error('Akkaunt username ma’lumoti noto‘g‘ri.');
            row=await cloud.ensureProfile({username,displayName:cloudUser.name||username});
          }
          if(row)applyCloudProfile(row,cloudUser);
          else throw new Error('Akkaunt profilingiz topilmadi. Qayta kiring.');
        }
      }catch(error){
        cloudError=error.message||'Cloud serverga ulanib bo‘lmadi.';
        console.error('DataSpace cloud error:',error);
        cloudUser=null;
      }
      if(!cloudUser){profile=loadProfile();openAuthModal(hadAuthSession?'signin':'signup',true);}
      render();
    } catch (e) {
      document.getElementById('app-content').innerHTML='<div class="error-state"><strong>Galaktikani yuklab bo‘lmadi</strong><p>'+esc(e.message)+'</p><button class="btn btn-primary" onclick="location.reload()">Qayta urinish</button></div>';
    }
  }
  // Public bridge consumed by the 3D Roblox-style world module.
  window.DataSpace={
    getState(){
      return {
        profileName:profile.name||'Explorer',
        avatar:profile.avatar||'🚀',
        characterClass:profile.characterClass||'navigator',
        xp:profile.xp||0,
        completed:profile.completed.slice(),
        nextLesson:getNextLesson(),
        lessons,missionGames,
        worlds:WORLDS.map((w,i)=>({...w,index:i,unlocked:isWorldUnlocked(i),progress:worldProgress(w)})),
        isCloud:!!cloudUser
      };
    },
    setView,openLesson,toast,
    awardQuest:awardWorldQuest
  };
  init();
})();
