/* DataSpace Academy — 3D Roblox-style learning world.
   A real Three.js world: blocky avatar, 9 themed islands, NPC mentor BYTE,
   knowledge crystals and 54 in-world teaching quests driven by mission-games.json. */
import * as THREE from '../assets/vendor/three.module.min.js';

const STORE_KEY = 'dataspace-world3d-v1';
const TAU = Math.PI * 2;
const ISLAND_RADIUS = 38;

const ZONE_THEME = [
  {base:0x33509b,accent:0x7fd8ff,glow:0x6f8bff},
  {base:0x1f6f78,accent:0x5ee0d0,glow:0x42d8ce},
  {base:0x2c7a55,accent:0x8ff0a8,glow:0x5ee0a5},
  {base:0x8a5a2c,accent:0xffc66e,glow:0xffa85c},
  {base:0x2f7b6b,accent:0x62e8c8,glow:0x42d8ce},
  {base:0x3b3f8f,accent:0xa99aff,glow:0x8e78ff},
  {base:0x6a3f8c,accent:0xd2a2ff,glow:0xb388ff},
  {base:0x2d6b45,accent:0x9be07a,glow:0x5ee0a5},
  {base:0x5b3f86,accent:0xffd28a,glow:0xffc66e}
];
const CLASS_STYLE = {
  navigator:{shirt:0x8e78ff,trim:0x42d8ce,cap:0x2b3c7a},
  coder:{shirt:0x2bb6a8,trim:0xffc66e,cap:0x144f52},
  scientist:{shirt:0x5ee0a5,trim:0xffffff,cap:0x1d5b42},
  detective:{shirt:0xffa56b,trim:0x8e78ff,cap:0x6a3a24}
};
const TYPE_LABEL = {
  sort:'SARALASH O‘YINI',sequence:'KOD OBBY',clean:'XATO OVCHISI',
  filter:'FILTR DARVOZASI',survey:'DATA YIG‘UV',choose:'TO‘G‘RI TANLOV'
};

let session = null;

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function shuffle(list){
  const a=list.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  if(a.length>1&&a.every((v,i)=>v===i)){const f=a.shift();a.push(f);}
  return a;
}
function loadStore(){
  try{const v=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');return v&&typeof v==='object'?v:{};}catch(_){return{};}
}
function saveStore(v){ try{localStorage.setItem(STORE_KEY,JSON.stringify(v));}catch(_){} }
function roundRect(g,x,y,w,h,r){
  g.beginPath();g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);
  g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);
  g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y);g.closePath();
}
function makeLabel(text,accent='#9b8bff',opts={}){
  const maxW=opts.maxW||360, fs=opts.fontSize||24;
  const c=document.createElement('canvas');c.width=maxW;c.height=120;
  let g=c.getContext('2d');
  const font=`700 ${fs}px 'Space Grotesk','DM Sans',sans-serif`;
  g.font=font;
  const words=String(text||'').replace(/\s+/g,' ').split(' ');
  const lines=[];let line='';
  for(const w of words){
    const t=line?line+' '+w:w;
    if(g.measureText(t).width>maxW-36&&line){lines.push(line);line=w;}else line=t;
  }
  if(line)lines.push(line);
  const h=Math.max(46,lines.length*(fs+8)+26);
  c.height=h;g=c.getContext('2d');g.font=font;
  g.fillStyle='rgba(8,15,30,.9)';roundRect(g,2,2,maxW-4,h-4,16);g.fill();
  g.strokeStyle=accent;g.lineWidth=2;roundRect(g,2,2,maxW-4,h-4,16);g.stroke();
  g.fillStyle='#f1f6ff';g.textBaseline='middle';
  lines.forEach((l,i)=>g.fillText(l,18,20+i*(fs+8)));
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
  const w=opts.width||4.6;spr.scale.set(w,w*h/maxW,1);spr.renderOrder=12;
  return spr;
}
function box(w,h,d,color,opts={}){
  const m=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({
      color,roughness:opts.roughness??.65,metalness:opts.metalness??.12,
      emissive:opts.emissive??0x000000,emissiveIntensity:opts.emissiveIntensity??.4,
      transparent:opts.opacity!==undefined,opacity:opts.opacity??1
    })
  );
  m.position.set(opts.x||0,opts.y||0,opts.z||0);
  m.castShadow=opts.shadow!==false;m.receiveShadow=true;
  return m;
}
function disposeGroup(g){
  if(!g)return;
  g.traverse(o=>{
    if(o.geometry)o.geometry.dispose();
    if(o.material){
      const list=Array.isArray(o.material)?o.material:[o.material];
      list.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});
    }
  });
  if(g.parent)g.parent.remove(g);
}

class World3D {
  constructor(root,api){
    this.root=root;this.api=api;
    this.state=api.getState();
    this.store=loadStore();
    this.store.crystals=Array.isArray(this.store.crystals)?this.store.crystals:[];
    this.mode='hub';this.quest=null;
    this.keys=Object.create(null);
    this.joy={x:0,y:0,active:false};
    this.camYaw=.45;this.camDist=13;this.camHeight=7.5;
    this.velocityY=0;this.onGround=true;this.walkPhase=0;
    this.interactables=[];this.platforms=[];this.blockers=[];this.animObjects=[];
    this.burst=[];this.near=null;this.frame=0;this.running=false;
    this.soundOn=this.store.sound!==false;this.audio=null;
    this._handlers=[];this._tips=this.buildFacts();
    this.buildDOM();
    this.bindEvents();
  }
  $(id){ return document.getElementById(id); }
  on(target,type,fn,opts){ target.addEventListener(type,fn,opts);this._handlers.push([target,type,fn,opts]); }
  crystalCount(){ return this.store.crystals.length; }

  buildFacts(){
    return this.state.worlds.map(w=>{
      const total=w.to-w.from+1;
      return [0,1,2].map(k=>{
        const n=w.from+Math.floor(k*(total-1)/2);
        const l=this.state.lessons[n]||{};
        return {title:l.title||'Yangi bilim',text:l.concept||l.objective||'',example:l.example||''};
      });
    });
  }

  buildDOM(){
    const s=this.state;
    const zones=s.worlds.map((w,i)=>`<div class="w3d-zone-row ${w.unlocked?'':'locked'}" data-zone="${i}"><i>${w.emoji}</i><span>${i+1}. ${esc(w.name)}</span><b>${w.progress.done}/${w.progress.total}</b></div>`).join('');
    this.root.innerHTML=`
      <div class="w3d-head">
        <div><span class="eyebrow">ROBLOX MODE · 3D O‘QUV OLAMI</span>
          <h1>DataSpace Worlds</h1>
          <p>Qahramoningni boshqar, 9 ta olamni kez, BYTE bilan gaplash va har bir missiyani 3D maydonda o‘ynab o‘rgan. Har bir o‘yin haqiqiy dars mavzusiga bog‘langan.</p></div>
        <div class="w3d-head-actions">
          <span class="w3d-chip">✦ <b id="w3d-xp-top">${s.xp}</b> XP</span>
          <span class="w3d-chip gold">💎 <b id="w3d-crystal-top">${this.crystalCount()}</b> kristal</span>
          <button class="btn btn-secondary" id="w3d-classic">Klassik darslar</button>
        </div>
      </div>
      <div class="w3d-stage" id="w3d-stage">
        <div class="w3d-loading" id="w3d-loading"><div class="w3d-orbit"></div><strong>3D olam yuklanmoqda...</strong><span>Qahramon, 9 ta olam va missiya maydonlari tayyorlanmoqda.</span></div>
        <div class="w3d-hud">
          <div class="w3d-hud-card"><small>HOZIRGI OLAM</small><strong id="w3d-zone-name">Markaziy maydon</strong><small id="w3d-zone-sub" style="margin-top:4px;letter-spacing:0;text-transform:none;color:#8ea0c4">Galaktika markazi</small></div>
          <div class="w3d-hud-stats">
            <div class="w3d-stat"><b id="w3d-mission-count">${s.completed.length}/54</b>MISSIYA</div>
            <button class="w3d-icon-btn" id="w3d-sound" title="Ovoz">${this.soundOn?'🔊':'🔇'}</button>
            <button class="w3d-icon-btn" id="w3d-reset-cam" title="Kamerani tiklash">◎</button>
            <button class="w3d-icon-btn" id="w3d-fullscreen" title="To‘liq ekran">⛶</button>
          </div>
        </div>
        <div class="w3d-radar"><canvas id="w3d-radar-canvas" width="236" height="236"></canvas><span class="w3d-radar-label">RADAR</span></div>
        <div class="w3d-prompt" id="w3d-prompt"></div>
        <div class="w3d-float-toast" id="w3d-toast"></div>
        <div class="w3d-mobile">
          <div class="w3d-joystick" id="w3d-joystick"><div class="w3d-joy-knob" id="w3d-joy-knob"></div></div>
          <div class="w3d-touch-btns"><button class="w3d-touch-btn" id="w3d-jump">JUMP</button><button class="w3d-touch-btn" id="w3d-interact">TALK</button></div>
        </div>
        <div class="w3d-quest hidden" id="w3d-quest"></div>
        <div class="w3d-overlay hidden" id="w3d-overlay"><div class="w3d-panel" id="w3d-panel"></div></div>
      </div>
      <div class="w3d-help">
        <div class="w3d-help-card"><h3>🎮 Boshqaruv</h3>
          <div class="w3d-keys">
            <span class="w3d-key-item"><b>W A S D</b> yurish</span>
            <span class="w3d-key-item"><b>SPACE</b> sakrash</span>
            <span class="w3d-key-item"><b>E</b> gaplashish / olish</span>
            <span class="w3d-key-item"><b>SHIFT</b> yugurish</span>
            <span class="w3d-key-item"><b>Sichqoncha</b> kamera</span>
            <span class="w3d-key-item"><b>ESC</b> chiqish</span>
          </div>
          <p class="w3d-note">Telefonda: chapdagi joystik bilan yur, JUMP va TALK tugmalarini bos. Obyektga yaqinlashganda yoki unga bosganda o‘zaro ta’sir boshlanadi. Bilim kristallarini yig‘ish orqali har bir olamning asosiy tushunchalarini o‘qiysan.</p>
        </div>
        <div class="w3d-help-card"><h3>🪐 9 ta olam · 54 missiya</h3><div class="w3d-zone-list">${zones}</div>
          <p class="w3d-note">Olamlar ketma-ket ochiladi. 3D missiyani tugatganingda +20 XP va dars nishoni beriladi — xuddi klassik dars kabi.</p>
        </div>
      </div>`;
  }

  bindEvents(){
    this.on(this.$('w3d-classic'),'click',()=>this.api.setView('course'));
    this.on(this.$('w3d-sound'),'click',()=>{
      this.soundOn=!this.soundOn;this.store.sound=this.soundOn;saveStore(this.store);
      this.$('w3d-sound').textContent=this.soundOn?'🔊':'🔇';
      if(this.soundOn)this.beep('coin');
    });
    this.on(this.$('w3d-reset-cam'),'click',()=>{this.camYaw=.45;this.camDist=13;this.camHeight=7.5;});
    this.on(this.$('w3d-fullscreen'),'click',()=>{
      const el=this.$('w3d-stage');
      if(document.fullscreenElement)document.exitFullscreen();
      else if(el.requestFullscreen)el.requestFullscreen().catch(()=>{});
    });
    this.on(this.$('w3d-panel'),'click',e=>this.handlePanelClick(e));
    this.on(this.$('w3d-quest'),'click',e=>this.handleQuestClick(e));
    this.on(this.$('w3d-quest'),'input',e=>this.handleQuestInput(e));
    this.on(this.$('w3d-overlay'),'click',e=>{if(e.target.id==='w3d-overlay')this.hideOverlay();});

    this.on(window,'keydown',e=>this.onKeyDown(e));
    this.on(window,'keyup',e=>{this.keys[e.code]=false;});
    this.on(window,'resize',()=>this.resize());
    this.on(window,'blur',()=>{this.keys=Object.create(null);this.joy={x:0,y:0,active:false};});

    const stage=this.$('w3d-stage');
    let drag=null;
    this.on(stage,'pointerdown',e=>{
      if(e.target.closest('.w3d-joystick,.w3d-touch-btns,.w3d-quest,.w3d-overlay,.w3d-hud,.w3d-radar'))return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
      if(e.target.setPointerCapture&&e.target.tagName==='CANVAS')e.target.setPointerCapture(e.pointerId);
    });
    this.on(stage,'pointermove',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;
      if(drag.moved){this.camYaw-=dx*.006;this.camHeight=clamp(this.camHeight+dy*.025,4,20);drag.x=e.clientX;drag.y=e.clientY;}
    });
    this.on(stage,'pointerup',e=>{
      if(drag&&!drag.moved&&e.pointerId===drag.id)this.handleClick(e);
      drag=null;
    });
    this.on(stage,'pointercancel',()=>{drag=null;});
    this.on(stage,'wheel',e=>{e.preventDefault();this.camDist=clamp(this.camDist+e.deltaY*.012,8,30);},{passive:false});
    this.on(stage,'contextmenu',e=>e.preventDefault());

    const joy=this.$('w3d-joystick'),knob=this.$('w3d-joy-knob');
    const joyMove=e=>{
      const r=joy.getBoundingClientRect();
      const dx=clamp((e.clientX-(r.left+r.width/2))/(r.width/2),-1,1);
      const dy=clamp((e.clientY-(r.top+r.height/2))/(r.height/2),-1,1);
      this.joy={x:dx,y:-dy,active:true};
      knob.style.transform=`translate(${dx*32}px,${dy*32}px)`;
    };
    const joyEnd=()=>{this.joy={x:0,y:0,active:false};knob.style.transform='';};
    this.on(joy,'pointerdown',e=>{joy.setPointerCapture(e.pointerId);joyMove(e);});
    this.on(joy,'pointermove',e=>{if(this.joy.active)joyMove(e);});
    this.on(joy,'pointerup',joyEnd);
    this.on(joy,'pointercancel',joyEnd);
    this.on(this.$('w3d-jump'),'click',()=>this.jump());
    this.on(this.$('w3d-interact'),'click',()=>{if(this.near)this.interact(this.near);});
  }

  onKeyDown(e){
    if(!this.running)return;
    const t=e.target;
    if(t&&(t.matches?.('input,textarea,select,[contenteditable="true"]')))return;
    const modal=document.getElementById('modal-backdrop');
    if(modal&&!modal.classList.contains('hidden'))return;
    this.keys[e.code]=true;
    if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();
    if(e.code==='Space'&&!e.repeat)this.jump();
    if(e.code==='KeyE'){if(this.near)this.interact(this.near);return;}
    if(e.code==='Escape'){
      if(!this.$('w3d-overlay').classList.contains('hidden'))this.hideOverlay();
      else if(this.mode==='quest')this.exitQuest();
      return;
    }
    if(e.code==='KeyR'){this.camYaw=.45;this.camDist=13;this.camHeight=7.5;return;}
    if(e.code==='KeyM'){this.$('w3d-sound').click();return;}
  }

  async start(){
    try{ this.buildScene(); }
    catch(error){
      console.error('DataSpace 3D world failed:',error);
      const l=this.$('w3d-loading');
      l.classList.add('error');
      l.innerHTML='<strong>3D olamni ishga tushirib bo‘lmadi</strong><span>'+esc(error.message||'Brauzeringiz WebGLni qo‘llab-quvvatlamaydi. Klassik darslardan foydalanishingiz mumkin.')+'</span><button class="btn btn-primary" id="w3d-fallback">Klassik darslarga o‘tish</button>';
      const b=this.$('w3d-fallback');if(b)this.on(b,'click',()=>this.api.setView('course'));
      return;
    }
    this.$('w3d-loading').classList.add('hidden');
    this.running=true;
    this.clock=new THREE.Clock();
    if(window.ResizeObserver){
      this.resizeObserver=new ResizeObserver(()=>this.resize());
      this.resizeObserver.observe(this.$('w3d-stage'));
    }
    this.loop();
    this.floatToast('3D olam tayyor! BYTE bilan gaplashish uchun unga yaqinlash va E ni bos.','');
  }

  buildScene(){
    const stage=this.$('w3d-stage');
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    this.renderer.setSize(stage.clientWidth||900,stage.clientHeight||600,false);
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    stage.insertBefore(this.renderer.domElement,stage.firstChild);

    this.scene=new THREE.Scene();
    this.scene.background=new THREE.Color(0x070d1c);
    this.scene.fog=new THREE.Fog(0x070d1c,72,190);
    this.camera=new THREE.PerspectiveCamera(58,(stage.clientWidth||900)/(stage.clientHeight||600),.1,400);
    this.raycaster=new THREE.Raycaster();
    this.pointer=new THREE.Vector2();

    this.scene.add(new THREE.HemisphereLight(0xa9bcff,0x1a2540,1.05));
    const sun=new THREE.DirectionalLight(0xffffff,1.25);
    sun.position.set(28,58,18);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);
    sun.shadow.camera.left=-80;sun.shadow.camera.right=80;
    sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;
    sun.shadow.camera.far=160;this.scene.add(sun);
    const rim=new THREE.PointLight(0x8e78ff,1.1,120);rim.position.set(-30,22,-26);this.scene.add(rim);

    const ground=new THREE.Mesh(new THREE.CircleGeometry(96,72),new THREE.MeshStandardMaterial({color:0x101a30,roughness:1}));
    ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;this.scene.add(ground);
    const grid=new THREE.GridHelper(190,76,0x3b5187,0x1e3055);
    grid.position.y=.02;grid.material.transparent=true;grid.material.opacity=.3;this.scene.add(grid);

    const starPos=[];
    for(let i=0;i<700;i++){
      const a=Math.random()*TAU,r=100+Math.random()*90;
      starPos.push(Math.cos(a)*r,8+Math.random()*95,Math.sin(a)*r);
    }
    const starGeo=new THREE.BufferGeometry();
    starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
    this.stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xa8bcff,size:.85,transparent:true,opacity:.85}));
    this.scene.add(this.stars);

    this.buildPlaza();
    this.buildIslands();
    this.buildPlayer();
    this.hubAnimCount=this.animObjects.length;
    this.centerGroup=new THREE.Group();this.scene.add(this.centerGroup);
    this.camera.position.set(this.player.position.x,this.camHeight,this.player.position.z+this.camDist);
  }

  buildPlaza(){
    this.plaza=new THREE.Group();this.scene.add(this.plaza);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(10,10.6,.6,48),new THREE.MeshStandardMaterial({color:0x1b2b4d,roughness:.8,metalness:.2}));
    base.position.y=.3;base.receiveShadow=true;this.plaza.add(base);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(9.7,.16,10,64),new THREE.MeshStandardMaterial({color:0x8e78ff,emissive:0x8e78ff,emissiveIntensity:.8}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.66;this.plaza.add(ring);
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(1.5),new THREE.MeshStandardMaterial({color:0x9b8bff,emissive:0x7b6bff,emissiveIntensity:.9,metalness:.4,roughness:.2}));
    core.position.set(0,3.6,0);this.plaza.add(core);
    this.animObjects.push({obj:core,type:'spin',base:3.6,phase:0,speed:.7});
    const label=makeLabel('✦ MISSION ARENA · MARKAZ','#9b8bff',{maxW:360,fontSize:23,width:6});
    label.position.set(0,6.1,0);this.plaza.add(label);
    for(let i=0;i<4;i++){
      const a=i*TAU/4+Math.PI/4;
      const p=box(.7,3.4,.7,0x2a3c68,{x:Math.cos(a)*8.4,y:1.9,z:Math.sin(a)*8.4,emissive:0x4d5fa0,emissiveIntensity:.4});
      this.plaza.add(p);
      const cap=box(.9,.25,.9,0x8e78ff,{x:Math.cos(a)*8.4,y:3.7,z:Math.sin(a)*8.4,emissive:0x8e78ff,emissiveIntensity:.8});
      this.plaza.add(cap);
    }
  }

  buildIslands(){
    this.islandGroups=[];
    for(let i=0;i<9;i++){
      const theme=ZONE_THEME[i],w=this.state.worlds[i];
      const angle=-Math.PI/2+i*TAU/9;
      const wx=Math.cos(angle)*ISLAND_RADIUS,wz=Math.sin(angle)*ISLAND_RADIUS;
      const g=new THREE.Group();g.position.set(wx,0,wz);this.scene.add(g);this.islandGroups.push(g);

      const bridge=box(3.2,.14,20,0x1b2c4c,{x:Math.cos(angle)*19.5,y:.08,z:Math.sin(angle)*19.5,shadow:false});
      bridge.rotation.y=Math.PI/2-angle;this.scene.add(bridge);
      const bridgeLine=box(.16,.06,20,0x4b5f95,{x:Math.cos(angle)*19.5,y:.17,z:Math.sin(angle)*19.5,shadow:false,emissive:0x4b5f95,emissiveIntensity:.5});
      bridgeLine.rotation.y=Math.PI/2-angle;this.scene.add(bridgeLine);

      const base=new THREE.Mesh(new THREE.CylinderGeometry(9,9.6,.9,40),new THREE.MeshStandardMaterial({color:theme.base,roughness:.82,metalness:.16}));
      base.position.y=.45;base.receiveShadow=true;base.castShadow=true;g.add(base);
      const top=new THREE.Mesh(new THREE.CylinderGeometry(8.4,8.4,.14,40),new THREE.MeshStandardMaterial({color:0x14213a,roughness:.9}));
      top.position.y=.96;top.receiveShadow=true;g.add(top);
      const edge=new THREE.Mesh(new THREE.TorusGeometry(8.7,.13,8,48),new THREE.MeshStandardMaterial({color:theme.accent,emissive:theme.glow,emissiveIntensity:w.unlocked?.9:.2}));
      edge.rotation.x=-Math.PI/2;edge.position.y=1.03;g.add(edge);

      // portal
      const portal=new THREE.Group();portal.position.set(0,0,-5.6);g.add(portal);
      const frameColor=w.unlocked?theme.accent:0x44506e;
      portal.add(box(.65,3.6,.65,frameColor,{x:-2.1,y:2.5,z:0,emissive:theme.glow,emissiveIntensity:w.unlocked?.5:.05}));
      portal.add(box(.65,3.6,.65,frameColor,{x:2.1,y:2.5,z:0,emissive:theme.glow,emissiveIntensity:w.unlocked?.5:.05}));
      portal.add(box(4.9,.6,.7,frameColor,{x:0,y:4.5,z:0,emissive:theme.glow,emissiveIntensity:w.unlocked?.5:.05}));
      const panel=new THREE.Mesh(new THREE.PlaneGeometry(3.7,3.2),new THREE.MeshStandardMaterial({color:w.unlocked?theme.glow:0x23304c,emissive:w.unlocked?theme.glow:0x101828,emissiveIntensity:w.unlocked?.55:.15,transparent:true,opacity:.72,side:THREE.DoubleSide}));
      panel.position.set(0,2.6,.05);portal.add(panel);
      const pLabel=makeLabel(`${w.unlocked?'✦':'🔒'} ${i+1}. ${w.name}`,'#'+theme.accent.toString(16).padStart(6,'0'),{maxW:340,fontSize:23,width:5});
      pLabel.position.set(0,5.7,0);portal.add(pLabel);
      if(w.unlocked){
        const portalLight=new THREE.PointLight(theme.glow,1.5,16);
        portalLight.position.set(0,2.6,0);portal.add(portalLight);
      }
      this.addInteractive(portal,'portal',{world:i},new THREE.Vector3(wx,0,wz-5.6));

      // NPC BYTE
      const npc=this.makeByte(theme);npc.position.set(-4.6,0,2.6);g.add(npc);
      this.animObjects.push({obj:npc,type:'bob',base:1.35,phase:i*.7,speed:2.1});
      const nLabel=makeLabel('BYTE · MENTOR','#5ee0d0',{maxW:260,fontSize:22,width:3.2});
      nLabel.position.set(0,3.6,0);npc.add(nLabel);
      this.addInteractive(npc,'npc',{world:i},new THREE.Vector3(wx-4.6,0,wz+2.6));
      this.blockers.push({x:wx-4.6,z:wz+2.6,r:1.1});

      // knowledge crystals
      const spots=[[5.6,2.6],[-1.8,5.9],[2.1,5.9]];
      spots.forEach((p,k)=>{
        const id=`w${i}-c${k}`;
        const collected=this.store.crystals.includes(id);
        const cr=new THREE.Group();cr.position.set(p[0],2.1,p[1]);g.add(cr);
        const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.72),new THREE.MeshStandardMaterial({color:theme.accent,emissive:theme.glow,emissiveIntensity:.85,metalness:.5,roughness:.2}));
        cr.add(gem);cr.userData.gem=gem;
        const halo=new THREE.Mesh(new THREE.TorusGeometry(1.05,.06,8,28),new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.5}));
        halo.rotation.x=Math.PI/2;cr.add(halo);
        const cLabel=makeLabel('💎 BILIM','#'+theme.accent.toString(16).padStart(6,'0'),{maxW:200,fontSize:22,width:2.4});
        cLabel.position.set(0,1.55,0);cr.add(cLabel);
        cr.visible=!collected;
        this.animObjects.push({obj:cr,type:'bob',base:2.1,phase:k*1.4+i,speed:1.8});
        this.addInteractive(cr,'crystal',{id,fact:this._tips[i][k],world:i},new THREE.Vector3(wx+p[0],0,wz+p[1]));
        this.blockers.push({x:wx+p[0],z:wz+p[1],r:.6});
      });

      // themed decorations
      for(let d=0;d<7;d++){
        const a=d*TAU/7+i*.4,r=6.6+(d%2)*.7;
        const x=Math.cos(a)*r,z=Math.sin(a)*r;
        const tall=d%3===0;
        const prop=tall
          ? box(.75,2.2+d%2*.8,.75,theme.accent,{x,y:2.1,z,emissive:theme.glow,emissiveIntensity:.28})
          : new THREE.Mesh(new THREE.ConeGeometry(.8,2.1,6),new THREE.MeshStandardMaterial({color:theme.base,emissive:theme.glow,emissiveIntensity:.16,roughness:.7}));
        if(!tall){prop.position.set(x,2.05,z);prop.castShadow=true;}
        g.add(prop);
      }
      const zoneLabel=makeLabel(`${w.emoji} ${w.subtitle}`,'#'+theme.accent.toString(16).padStart(6,'0'),{maxW:400,fontSize:21,width:6.4});
      zoneLabel.position.set(0,8.2,0);g.add(zoneLabel);
    }
  }

  makeByte(theme){
    const g=new THREE.Group();
    g.add(box(1.25,1.15,.9,0x20365c,{x:0,y:1.25,z:0,emissive:0x2c4a7a,emissiveIntensity:.5}));
    g.add(box(1.05,.95,.85,0x2c477a,{x:0,y:2.3,z:0,emissive:0x3c63a8,emissiveIntensity:.45}));
    g.add(box(.22,.22,.1,0x7ff5e6,{x:-.26,y:2.4,z:.46,emissive:0x5ee0d0,emissiveIntensity:1,shadow:false}));
    g.add(box(.22,.22,.1,0x7ff5e6,{x:.26,y:2.4,z:.46,emissive:0x5ee0d0,emissiveIntensity:1,shadow:false}));
    g.add(box(.13,.55,.13,0x8fa9d8,{x:0,y:3.05,z:0,shadow:false}));
    const orb=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshStandardMaterial({color:theme.accent,emissive:theme.glow,emissiveIntensity:1}));
    orb.position.set(0,3.4,0);g.add(orb);
    g.add(box(.42,.55,.42,0x1b2e50,{x:-.85,y:1.25,z:0}));
    g.add(box(.42,.55,.42,0x1b2e50,{x:.85,y:1.25,z:0}));
    return g;
  }

  buildPlayer(){
    const st=CLASS_STYLE[this.state.characterClass]||CLASS_STYLE.navigator;
    const g=new THREE.Group();
    const skin=0xf4cba4,dark=0x16203a;
    const head=box(.86,.86,.86,skin,{x:0,y:2.72,z:0});g.add(head);
    g.add(box(.92,.2,.92,st.cap,{x:0,y:3.2,z:0}));
    g.add(box(.12,.12,.06,dark,{x:-.2,y:2.78,z:-.44,shadow:false}));
    g.add(box(.12,.12,.06,dark,{x:.2,y:2.78,z:-.44,shadow:false}));
    g.add(box(.26,.06,.06,0xb9755c,{x:0,y:2.55,z:-.44,shadow:false}));
    g.add(box(.34,.22,.3,skin,{x:0,y:2.2,z:0}));
    const torso=box(1.05,1.25,.55,st.shirt,{x:0,y:1.62,z:0});g.add(torso);
    g.add(box(.42,.42,.08,st.trim,{x:0,y:1.72,z:-.31,emissive:st.trim,emissiveIntensity:.45,shadow:false}));
    const armL=box(.32,1.1,.32,st.shirt,{x:-.72,y:1.65,z:0});
    const armR=box(.32,1.1,.32,st.shirt,{x:.72,y:1.65,z:0});
    armL.geometry.translate(0,-.45,0);armR.geometry.translate(0,-.45,0);
    armL.position.y=2.1;armR.position.y=2.1;
    g.add(armL);g.add(armR);
    const legL=box(.38,1.0,.38,0x2b3a60,{x:-.26,y:.55,z:0});
    const legR=box(.38,1.0,.38,0x2b3a60,{x:.26,y:.55,z:0});
    legL.geometry.translate(0,-.45,0);legR.geometry.translate(0,-.45,0);
    legL.position.y=1.0;legR.position.y=1.0;
    g.add(legL);g.add(legR);
    const label=makeLabel(this.state.profileName||'EXPLORER','#9b8bff',{maxW:260,fontSize:24,width:3});
    label.position.set(0,4.05,0);g.add(label);
    this.carried=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshStandardMaterial({color:0xffc66e,emissive:0xffa85c,emissiveIntensity:.9}));
    this.carried.position.set(0,3.5,-1.1);this.carried.visible=false;g.add(this.carried);
    g.position.set(0,0,14);
    this.player=g;this.scene.add(g);
    this.playerParts={armL,armR,legL,legR,torso,head};
  }

  addInteractive(mesh,type,data,pos,quest=false){
    const entry={mesh,type,data,pos:pos.clone?pos.clone():new THREE.Vector3(pos.x,pos.y,pos.z),quest,disabled:false};
    mesh.userData.interactive=entry;
    this.interactables.push(entry);
    return entry;
  }

  resize(){
    if(!this.renderer)return;
    const s=this.$('w3d-stage');
    const w=s.clientWidth||900,h=s.clientHeight||600;
    this.renderer.setSize(w,h,false);
    this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
  }

  loop=()=>{
    if(!this.running)return;
    this.raf=requestAnimationFrame(this.loop);
    const dt=Math.min(.05,this.clock.getDelta());
    this.update(dt);
    this.renderer.render(this.scene,this.camera);
    if(++this.frame%4===0)this.drawRadar();
  };

  update(dt){
    const t=this.clock.elapsedTime;
    const paused=!this.$('w3d-overlay').classList.contains('hidden');
    let ix=0,iz=0;
    if(!paused){
      if(this.keys.KeyW||this.keys.ArrowUp)iz+=1;
      if(this.keys.KeyS||this.keys.ArrowDown)iz-=1;
      if(this.keys.KeyA||this.keys.ArrowLeft)ix-=1;
      if(this.keys.KeyD||this.keys.ArrowRight)ix+=1;
      ix+=this.joy.x;iz+=this.joy.y;
    }
    const f=new THREE.Vector3(-Math.sin(this.camYaw),0,-Math.cos(this.camYaw));
    const r=new THREE.Vector3(Math.cos(this.camYaw),0,-Math.sin(this.camYaw));
    const dir=f.multiplyScalar(clamp(iz,-1,1)).add(r.multiplyScalar(clamp(ix,-1,1)));
    const moving=dir.lengthSq()>.01&&!paused;
    if(moving)dir.normalize();
    const speed=(this.keys.ShiftLeft||this.keys.ShiftRight)?14:9;
    const p=this.player.position;
    if(moving){
      let nx=p.x+dir.x*speed*dt,nz=p.z+dir.z*speed*dt;
      const rad=Math.hypot(nx,nz);
      if(rad>91){nx=nx/rad*91;nz=nz/rad*91;}
      for(const b of this.blockers){
        const d=Math.hypot(nx-b.x,nz-b.z);
        if(d<b.r+.5&&d>.001){nx=b.x+(nx-b.x)/d*(b.r+.5);nz=b.z+(nz-b.z)/d*(b.r+.5);}
      }
      p.x=nx;p.z=nz;
      const target=Math.atan2(-dir.x,-dir.z);
      let diff=target-this.player.rotation.y;
      while(diff>Math.PI)diff-=TAU;while(diff<-Math.PI)diff+=TAU;
      this.player.rotation.y+=diff*Math.min(1,dt*12);
    }
    this.velocityY-=24*dt;
    const prevY=p.y;
    p.y+=this.velocityY*dt;
    let support=0;
    for(const pl of this.platforms){
      if(Math.abs(p.x-pl.x)<pl.w/2+.3&&Math.abs(p.z-pl.z)<pl.d/2+.3&&prevY>=pl.top-.35)support=Math.max(support,pl.top);
    }
    if(p.y<=support){p.y=support;this.velocityY=0;this.onGround=true;}
    else this.onGround=false;

    this.walkPhase+=dt*(moving?11:2.6);
    const amp=moving?.55:.045;
    const P=this.playerParts;
    P.armL.rotation.x=Math.sin(this.walkPhase)*amp;
    P.armR.rotation.x=-Math.sin(this.walkPhase)*amp;
    P.legL.rotation.x=-Math.sin(this.walkPhase)*amp;
    P.legR.rotation.x=Math.sin(this.walkPhase)*amp;
    P.torso.position.y=1.62+Math.sin(t*2.2)*.025;
    if(!this.onGround){P.armL.rotation.x=-1.1;P.armR.rotation.x=-1.1;}

    const camTarget=new THREE.Vector3(
      p.x+Math.sin(this.camYaw)*this.camDist,
      p.y+this.camHeight,
      p.z+Math.cos(this.camYaw)*this.camDist
    );
    this.camera.position.lerp(camTarget,1-Math.exp(-7*dt));
    this.camera.lookAt(p.x,p.y+1.7,p.z);

    for(const a of this.animObjects){
      if(!a.obj.visible)continue;
      if(a.type==='bob')a.obj.position.y=a.base+Math.sin(t*a.speed+a.phase)*.24;
      else if(a.type==='spin'){a.obj.rotation.y+=dt*a.speed;a.obj.position.y=a.base+Math.sin(t*1.4)*.25;}
    }
    this.stars.rotation.y+=dt*.004;
    if(this.carried.visible){this.carried.rotation.y+=dt*2.4;this.carried.position.y=3.5+Math.sin(t*4)*.12;}
    this.updateBurst(dt);
    this.updateNear();
  }

  jump(){
    if(!this.onGround)return;
    this.velocityY=9.2;this.onGround=false;this.beep('jump');
  }

  updateBurst(dt){
    for(let i=this.burst.length-1;i>=0;i--){
      const b=this.burst[i];
      b.life-=dt;b.mesh.position.addScaledVector(b.v,dt);b.v.y-=11*dt;
      if(b.life<=0){disposeGroup(b.mesh);this.burst.splice(i,1);}
    }
  }
  confetti(){
    const colors=[0xffc66e,0x9b8bff,0x5ee0a5,0x42d8ce,0xff7c91];
    for(let i=0;i<36;i++){
      const m=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.22),new THREE.MeshBasicMaterial({color:colors[i%colors.length]}));
      m.position.set(this.player.position.x,3.2,this.player.position.z);
      this.scene.add(m);
      this.burst.push({mesh:m,v:new THREE.Vector3((Math.random()-.5)*9,5+Math.random()*7,(Math.random()-.5)*9),life:1.4+Math.random()*.7});
    }
  }

  updateNear(){
    let best=null,bestD=3.5;
    for(const it of this.interactables){
      if(it.disabled)continue;
      const d=Math.hypot(this.player.position.x-it.pos.x,this.player.position.z-it.pos.z);
      if(d<bestD){bestD=d;best=it;}
    }
    if(best!==this.near){
      this.near=best;this.updatePrompt();
    }
  }
  updatePrompt(){
    const el=this.$('w3d-prompt');
    if(!this.near){el.classList.remove('show');return;}
    const n=this.near;
    let text='';
    if(n.type==='npc')text='BYTE bilan gaplash — mavzuni tushuntiradi';
    else if(n.type==='portal')text='Portal — 3D missiyani boshlash';
    else if(n.type==='crystal')text='Bilim kristalini yig‘ish';
    else if(n.type.startsWith('q'))text=this.questPrompt(n);
    el.innerHTML='<span class="w3d-key">E</span><span>'+esc(text)+'</span>';
    el.classList.add('show');
  }
  questPrompt(n){
    const map={qchoice:'Javob podiumini tanlash',qitem:'Signalni olish',qbin:'Signalni qutiga joylashtirish',qstep:'Kod platformasiga chiqish',qrow:'Shubhali qatorni belgilash',qgate:'Filtr darvozasini tekshirish',qsurvey:'Anonim javob yig‘ish'};
    return map[n.type]||'O‘zaro ta’sir';
  }

  handleClick(e){
    if(!this.renderer)return;
    const rect=this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.interactables.filter(i=>!i.disabled).map(i=>i.mesh),true);
    if(!hits.length)return;
    let o=hits[0].object,entry=null;
    while(o&&!entry){entry=o.userData?.interactive||null;o=o.parent;}
    if(entry)this.interact(entry);
  }

  interact(entry){
    if(entry.type==='npc')this.openNpcDialog(entry.data.world);
    else if(entry.type==='portal')this.openPortal(entry.data.world);
    else if(entry.type==='crystal')this.collectCrystal(entry);
    else if(entry.type.startsWith('q'))this.questInteract(entry);
  }

  floatToast(msg,kind=''){
    const el=this.$('w3d-toast');
    el.textContent=msg;el.className='w3d-float-toast show'+(kind?' '+kind:'');
    clearTimeout(this._toastTimer);
    this._toastTimer=setTimeout(()=>el.classList.remove('show'),3200);
  }
  showOverlay(html){
    this.$('w3d-panel').innerHTML=html;
    this.$('w3d-overlay').classList.remove('hidden');
  }
  hideOverlay(){ this.$('w3d-overlay').classList.add('hidden'); }
  beep(kind){
    if(!this.soundOn)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      if(!this.audio)this.audio=new AC();
      const notes={coin:[660,.09],jump:[420,.1],pick:[520,.08],wrong:[190,.16],win:[880,.22],step:[700,.06]};
      const [freq,dur]=notes[kind]||[520,.08];
      const o=this.audio.createOscillator(),g=this.audio.createGain();
      o.type=kind==='wrong'?'sawtooth':'sine';o.frequency.value=freq;
      g.gain.setValueAtTime(.055,this.audio.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001,this.audio.currentTime+dur);
      o.connect(g);g.connect(this.audio.destination);o.start();o.stop(this.audio.currentTime+dur);
    }catch(_){}
  }

  nextInWorld(i){
    const w=this.state.worlds[i];
    for(let n=w.from;n<=w.to;n++)if(!this.state.completed.includes(n))return n;
    return null;
  }
  worldCrystalCount(i){ return this.store.crystals.filter(id=>id.startsWith(`w${i}-`)).length; }

  openNpcDialog(i){
    const w=this.state.worlds[i],n=this.nextInWorld(i);
    const game=n!==null?this.state.missionGames[n]:null;
    const lesson=n!==null?this.state.lessons[n]:null;
    const tips=[0,1,2].map(k=>{
      const idx=w.from+Math.floor(k*(w.to-w.from)/2);
      return this.state.lessons[idx]?.title||'';
    }).filter(Boolean);
    const canStart=n!==null&&w.unlocked&&n===this.state.nextLesson;
    this.beep('pick');
    this.showOverlay(`<div class="eyebrow">🤖 BYTE · ${esc(w.name.toUpperCase())} MENTORI</div>
      <h2>Salom, ${esc(this.state.profileName)}!</h2>
      <p>${esc(w.subtitle)}. Bu olamda <b>${w.progress.total} ta missiya</b> bor, hozir <b>${w.progress.done} tasi</b> tugatilgan.</p>
      <div class="w3d-fact-box">${game?`<b>🎯 Navbatdagi vazifa:</b> ${esc(game.title)}<br>${esc(game.brief)}`:'<b>🏆 Bu olam to‘liq zabt etilgan!</b> Bilim kristallarini yig‘ib, bilimingni mustahkamlashing mumkin.'}</div>
      <h3>📚 Bu olamda o‘rganasan</h3>
      <div class="w3d-tip-list">${tips.map((x,k)=>`<div class="w3d-tip"><span>0${k+1}</span>${esc(x)}</div>`).join('')}</div>
      <p>💎 Bilim kristallari: <b>${this.worldCrystalCount(i)}/3</b> · ularning har biri bitta asosiy tushunchani ochib beradi.</p>
      <div class="w3d-panel-actions">
        ${canStart?`<button class="btn btn-primary" data-w3d="quest" data-index="${n}">🎮 3D missiyani boshlash →</button>`:''}
        ${n!==null&&w.unlocked?`<button class="btn btn-secondary" data-w3d="classic" data-index="${n}">Klassik dars</button>`:''}
        ${!w.unlocked?'<span class="tag violet">🔒 Avval oldingi olamni tugat</span>':''}
        <button class="btn btn-ghost" data-w3d="close">Yopish</button>
      </div>`);
  }

  openPortal(i){
    const w=this.state.worlds[i];
    if(!w.unlocked){
      this.beep('wrong');
      this.floatToast('🔒 Bu olam qulflangan. Avval oldingi olam missiyalarini tugat.','warn');
      return;
    }
    const n=this.nextInWorld(i);
    if(n===null){
      this.beep('coin');
      this.showOverlay(`<div class="eyebrow">✦ PORTAL · ${esc(w.name.toUpperCase())}</div><h2>Olam zabt etildi!</h2>
        <p>Bu olamning barcha ${w.progress.total} ta missiyasi bajarilgan. Oxirgi missiyani qayta o‘ynab bilimni mustahkamlashing mumkin — XP qayta berilmaydi.</p>
        <div class="w3d-panel-actions"><button class="btn btn-primary" data-w3d="quest" data-index="${w.to}">↻ Qayta o‘ynash</button><button class="btn btn-ghost" data-w3d="close">Yopish</button></div>`);
      return;
    }
    if(n!==this.state.nextLesson){
      this.floatToast('Avval oldingi olamlarning navbatdagi missiyasini tugat.','warn');
      return;
    }
    this.startQuest(n);
  }

  collectCrystal(entry){
    if(this.store.crystals.includes(entry.data.id))return;
    this.store.crystals.push(entry.data.id);saveStore(this.store);
    entry.mesh.visible=false;entry.disabled=true;this.near=null;this.updatePrompt();
    this.$('w3d-crystal-top').textContent=this.crystalCount();
    this.beep('coin');this.confetti();
    const f=entry.data.fact;
    this.showOverlay(`<div class="eyebrow">💎 BILIM KRISTALI · ${esc(this.state.worlds[entry.data.world].name)}</div>
      <h2>${esc(f.title)}</h2>
      <div class="w3d-fact-box">${esc(f.text)}${f.example?`<pre>${esc(f.example)}</pre>`:''}</div>
      <p style="margin-top:12px">Kristall yig‘ildi: <b>${this.crystalCount()} / 27</b>. Hammasini yig‘sang, butun kursning asosiy tushunchalarini takrorlaysan.</p>
      <div class="w3d-panel-actions"><button class="btn btn-primary" data-w3d="close">Tushundim →</button></div>`);
  }

  handlePanelClick(e){
    const b=e.target.closest('[data-w3d]');if(!b)return;
    const a=b.dataset.w3d;
    if(a==='close'){this.hideOverlay();return;}
    if(a==='classic'){this.hideOverlay();this.api.openLesson(Number(b.dataset.index));return;}
    if(a==='quest'){this.hideOverlay();this.startQuest(Number(b.dataset.index));return;}
  }

  /* ---------------- QUESTS ---------------- */

  startQuest(index){
    const lesson=this.state.lessons[index],game=this.state.missionGames[index];
    if(!lesson||!game){this.floatToast('Bu missiya uchun ma’lumot topilmadi.','warn');return;}
    this.hideOverlay();
    if(this.plaza)this.plaza.visible=false;
    this.clearCenter();
    this.mode='quest';
    this.quest={
      index,lesson,game,replay:this.state.completed.includes(index),solved:false,
      result:null,feedback:'',hintOpen:false,lastStep:null,lastStepAt:0,
      type:['sort','sequence','clean','filter','survey'].includes(game.type)?game.type:'choose',
      data:this.makeQuestData(game),refs:{items:[],bins:[],steps:[],rows:[],choices:[],survey:[]}
    };
    this.player.position.set(0,0,7);this.velocityY=0;this.onGround=true;
    this.camYaw=.12;this.camDist=17;this.camHeight=10;
    this.buildQuestScene();
    this.$('w3d-quest').classList.remove('hidden');
    this.$('w3d-zone-name').textContent='Missiya maydoni';
    this.$('w3d-zone-sub').textContent=`WORLD ${String(this.worldOf(index)+1).padStart(2,'0')} · MISSIYA ${index+1}/54`;
    this.renderQuestPanel();
    this.beep('coin');
    this.floatToast(`🎮 ${game.title} — 3D maydon tayyor!`,'');
  }
  worldOf(index){ return this.state.worlds.findIndex(w=>index>=w.from&&index<=w.to); }
  makeQuestData(g){
    if(g.type==='sort')return {assignments:{},selected:null};
    if(g.type==='sequence')return {picked:[],order:shuffle((g.steps||[]).map((_,i)=>i))};
    if(g.type==='clean')return {marked:[]};
    if(g.type==='filter')return {minValue:Number(g.start??g.min??0),flag:!!g.startFlag};
    if(g.type==='survey')return {rows:[],subject:g.subjects?.[0]||'',hours:2};
    return {selected:null};
  }

  clearCenter(){
    for(const b of this.burst){disposeGroup(b.mesh);}
    this.burst=[];
    this.interactables=this.interactables.filter(i=>!i.quest);
    this.platforms=[];
    if(this.hubAnimCount!==undefined)this.animObjects.length=this.hubAnimCount;
    if(this.centerGroup){disposeGroup(this.centerGroup);}
    this.centerGroup=new THREE.Group();this.scene.add(this.centerGroup);
    this.carried.visible=false;
    this.near=null;this.updatePrompt();
  }

  exitQuest(){
    this.clearCenter();
    this.mode='hub';this.quest=null;
    this.$('w3d-quest').classList.add('hidden');
    this.$('w3d-quest').innerHTML='';
    this.player.position.set(0,0,14);
    this.camYaw=.45;this.camDist=13;this.camHeight=7.5;
    if(this.plaza)this.plaza.visible=true;
    this.$('w3d-zone-name').textContent='Markaziy maydon';
    this.$('w3d-zone-sub').textContent='Galaktika markazi';
    this.refreshState();
  }

  buildQuestScene(){
    const g=this.quest.game,q=this.quest,cg=this.centerGroup;
    const theme=ZONE_THEME[this.worldOf(q.index)]||ZONE_THEME[0];
    const floor=new THREE.Mesh(new THREE.CylinderGeometry(10.6,10.6,.18,48),new THREE.MeshStandardMaterial({color:0x182949,roughness:.7,metalness:.25}));
    floor.position.y=.09;floor.receiveShadow=true;cg.add(floor);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(10.2,.12,8,64),new THREE.MeshStandardMaterial({color:theme.accent,emissive:theme.glow,emissiveIntensity:.8}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.2;cg.add(ring);

    const bot=this.makeByte(theme);bot.position.set(-7.6,0,-6.4);bot.scale.setScalar(.9);cg.add(bot);
    this.animObjects.push({obj:bot,type:'bob',base:1.2,phase:1,speed:2});
    const speech=makeLabel(`🤖 ${g.title}`,'#5ee0d0',{maxW:400,fontSize:22,width:5.4});
    speech.position.set(-7.6,4.2,-6.4);cg.add(speech);
    const exitSign=makeLabel('↩ ESC · OLAMGA QAYTISH','#9b8bff',{maxW:340,fontSize:20,width:4.4});
    exitSign.position.set(7.4,3.6,6.6);cg.add(exitSign);

    if(q.type==='choose')this.buildChoiceScene(g,theme);
    else if(q.type==='sort')this.buildSortScene(g,theme);
    else if(q.type==='sequence')this.buildSequenceScene(g,theme);
    else if(q.type==='clean')this.buildCleanScene(g,theme);
    else if(q.type==='filter')this.buildFilterScene(g,theme);
    else if(q.type==='survey')this.buildSurveyScene(g,theme);
  }

  buildChoiceScene(g,theme){
    const q=this.quest,cg=this.centerGroup;
    const options=g.choices||[];
    options.forEach((opt,i)=>{
      const x=(i-(options.length-1)/2)*3.5;
      const grp=new THREE.Group();grp.position.set(x,0,-4.2);cg.add(grp);
      const ped=box(2.5,.7,2.5,0x223457,{x:0,y:.45,z:0,emissive:theme.glow,emissiveIntensity:.12});
      grp.add(ped);
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.62),new THREE.MeshStandardMaterial({color:theme.accent,emissive:theme.glow,emissiveIntensity:.85}));
      gem.position.set(0,1.7,0);grp.add(gem);
      this.animObjects.push({obj:gem,type:'spin',base:1.7,phase:i,speed:1.1});
      const text=typeof opt==='string'?opt:opt.label;
      const lbl=makeLabel(`${String.fromCharCode(65+i)} · ${text}`,'#'+theme.accent.toString(16).padStart(6,'0'),{maxW:320,fontSize:20,width:3.6});
      lbl.position.set(0,3.3,0);grp.add(lbl);
      q.refs.choices.push({group:grp,ped,gem});
      this.addInteractive(grp,'qchoice',{i},new THREE.Vector3(x,0,-4.2),true);
    });
  }

  buildSortScene(g,theme){
    const q=this.quest,cg=this.centerGroup;
    (g.buckets||[]).forEach((b,i)=>{
      const x=(i-(g.buckets.length-1)/2)*5.2;
      const grp=new THREE.Group();grp.position.set(x,0,-5.4);cg.add(grp);
      const bin=box(3.6,1.5,2.6,0x1d3357,{x:0,y:.75,z:0,emissive:theme.glow,emissiveIntensity:.16});grp.add(bin);
      const rim=box(3.9,.2,2.9,theme.accent,{x:0,y:1.6,z:0,emissive:theme.glow,emissiveIntensity:.7});grp.add(rim);
      const lbl=makeLabel(`📦 ${b}`,'#'+theme.accent.toString(16).padStart(6,'0'),{maxW:280,fontSize:22,width:3.4});
      lbl.position.set(0,3,0);grp.add(lbl);
      q.refs.bins.push({group:grp});
      this.addInteractive(grp,'qbin',{b:i},new THREE.Vector3(x,0,-5.4),true);
    });
    (g.items||[]).forEach((it,i)=>{
      const cols=g.items.length;
      const x=(i-(cols-1)/2)*Math.min(3.2,16/Math.max(1,cols));
      const z=1.5+(i%2)*2;
      const grp=new THREE.Group();grp.position.set(x,0,z);cg.add(grp);
      const gem=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.1,1.1),new THREE.MeshStandardMaterial({color:0xffc66e,emissive:0xffa85c,emissiveIntensity:.55,roughness:.35}));
      gem.position.y=1.7;grp.add(gem);
      this.animObjects.push({obj:gem,type:'spin',base:1.7,phase:i*.8,speed:.9});
      const lbl=makeLabel(String(it[0]),'#ffc66e',{maxW:300,fontSize:20,width:3.3});
      lbl.position.set(0,3,0);grp.add(lbl);
      q.refs.items.push({group:grp,gem});
      this.addInteractive(grp,'qitem',{i},new THREE.Vector3(x,0,z),true);
    });
  }

  buildSequenceScene(g,theme){
    const q=this.quest,cg=this.centerGroup;
    const steps=g.steps||[];
    q.data.order.forEach((stepIndex,slot)=>{
      const x=(slot-(steps.length-1)/2)*Math.min(3.6,17/Math.max(1,steps.length));
      const z=-3.5+(slot%2)*1.6;
      const grp=new THREE.Group();grp.position.set(x,0,z);cg.add(grp);
      const plat=box(3,1,3,0x2a3c68,{x:0,y:.5,z:0,emissive:theme.glow,emissiveIntensity:.18});
      grp.add(plat);
      const lbl=makeLabel(`${slot+1} · ${steps[stepIndex]}`,'#'+theme.accent.toString(16).padStart(6,'0'),{maxW:340,fontSize:19,width:3.7});
      lbl.position.set(0,2.8,0);grp.add(lbl);
      q.refs.steps[stepIndex]={group:grp,plat,slot};
      this.platforms.push({x,z,w:3,d:3,top:1});
      this.addInteractive(grp,'qstep',{n:stepIndex},new THREE.Vector3(x,0,z),true);
    });
  }

  buildCleanScene(g,theme){
    const q=this.quest,cg=this.centerGroup;
    (g.rows||[]).forEach((row,i)=>{
      const x=(i-(g.rows.length-1)/2)*Math.min(3.1,17/Math.max(1,g.rows.length));
      const z=(i%2)?-.8:-4;
      const grp=new THREE.Group();grp.position.set(x,0,z);cg.add(grp);
      const tab=box(2.6,1.5,.5,0x223457,{x:0,y:1.5,z:0,emissive:theme.glow,emissiveIntensity:.12});grp.add(tab);
      const lbl=makeLabel(String(row.map(c=>c||'∅').join(' | ')),'#'+theme.accent.toString(16).padStart(6,'0'),{maxW:320,fontSize:19,width:3.2});
      lbl.position.set(0,3.2,0);grp.add(lbl);
      q.refs.rows.push({group:grp,tab});
      this.addInteractive(grp,'qrow',{i},new THREE.Vector3(x,0,z),true);
    });
  }

  buildFilterScene(g,theme){
    const q=this.quest,cg=this.centerGroup;
    const gate=new THREE.Group();gate.position.set(0,0,-4.8);cg.add(gate);
    gate.add(box(.6,4,.6,theme.accent,{x:-4,y:2,z:0,emissive:theme.glow,emissiveIntensity:.5}));
    gate.add(box(.6,4,.6,theme.accent,{x:4,y:2,z:0,emissive:theme.glow,emissiveIntensity:.5}));
    gate.add(box(8.6,.6,.7,theme.accent,{x:0,y:4,z:0,emissive:theme.glow,emissiveIntensity:.5}));
    const lbl=makeLabel('🚪 FILTR DARVOZASI','#'+theme.accent.toString(16).padStart(6,'0'),{maxW:360,fontSize:22,width:5});
    lbl.position.set(0,5.2,0);gate.add(lbl);
    this.addInteractive(gate,'qgate',{},new THREE.Vector3(0,0,-4.8),true);
    (g.rows||[]).forEach((row,i)=>{
      const x=(i-(g.rows.length-1)/2)*Math.min(3,16/Math.max(1,g.rows.length));
      const z=1.8+(i%2)*2;
      const grp=new THREE.Group();grp.position.set(x,0,z);cg.add(grp);
      const gem=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,1.2),new THREE.MeshStandardMaterial({color:0x8fa3cc,emissive:0x4b5f95,emissiveIntensity:.3}));
      gem.position.y=1.7;grp.add(gem);
      const lbl=makeLabel(`${row.name} · ${row.value}${g.unit||''}`,'#8fa3cc',{maxW:300,fontSize:19,width:3.2});
      lbl.position.set(0,3.1,0);grp.add(lbl);
      q.refs.rows.push({group:grp,gem,row});
    });
    this.updateFilterVisual();
  }

  buildSurveyScene(g,theme){
    const q=this.quest,cg=this.centerGroup;
    const spots=[[-5,1],[0,2],[5,1],[-3,5],[3,5]];
    spots.forEach((p,i)=>{
      const grp=new THREE.Group();grp.position.set(p[0],0,p[1]);cg.add(grp);
      const bot=this.makeByte(theme);bot.scale.setScalar(.62);grp.add(bot);
      const lbl=makeLabel(`🙋 ANONIM #${i+1}`,'#5ee0a5',{maxW:260,fontSize:20,width:3});
      lbl.position.set(0,2.8,0);grp.add(lbl);
      q.refs.survey.push({group:grp});
      this.addInteractive(grp,'qsurvey',{i},new THREE.Vector3(p[0],0,p[1]),true);
    });
  }

  questInteract(entry){
    const q=this.quest;if(!q||q.solved)return;
    const now=performance.now();
    if(entry.type==='qstep'&&entry===this.near&&now-q.lastStepAt<1200&&q.lastStep===entry.data.n)return;
    if(entry.type==='qstep'){q.lastStepAt=now;q.lastStep=entry.data.n;}
    switch(entry.type){
      case 'qchoice':this.selectChoice(entry.data.i);break;
      case 'qitem':this.pickItem(entry.data.i);break;
      case 'qbin':this.deposit(entry.data.b);break;
      case 'qstep':this.stepPlatform(entry.data.n);break;
      case 'qrow':this.toggleRow(entry.data.i);break;
      case 'qgate':this.checkQuest();break;
      case 'qsurvey':this.addSurvey(entry.data.i);break;
    }
  }

  selectChoice(i){
    const q=this.quest;if(!q||q.solved)return;
    q.data.selected=i;q.feedback='';this.beep('pick');
    q.refs.choices.forEach((c,k)=>{
      c.ped.material.color.setHex(k===i?0x3c6f8a:0x223457);
      c.ped.material.emissiveIntensity=k===i?.8:.12;
    });
    this.renderQuestPanel();
  }
  pickItem(i){
    const q=this.quest;if(!q||q.solved||q.data.assignments[i]!==undefined)return;
    q.data.selected=i;this.carried.visible=true;this.beep('pick');
    q.refs.items.forEach((it,k)=>{
      if(!it)return;
      const picked=k===i;
      it.gem.material.color.setHex(picked?0xffd891:0xffc66e);
      it.gem.material.emissiveIntensity=picked?1:.55;
      it.group.scale.setScalar(picked?1.18:1);
    });
    this.floatToast('Signal olindi! Endi mos qutiga bor yoki pastdagi qutini tanla.','');
    this.renderQuestPanel();
  }
  deposit(b){
    const q=this.quest;if(!q||q.solved)return;
    if(q.data.selected===null||q.data.selected===undefined){this.floatToast('Avval signalni tanla yoki unga yaqinlash.','warn');return;}
    const i=q.data.selected;
    q.data.assignments[i]=b;q.data.selected=null;this.carried.visible=false;this.beep('step');
    const item=q.refs.items[i];
    if(item){
      item.group.visible=false;
      const bin=q.refs.bins[b];
      if(bin){
        const cube=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshBasicMaterial({color:0x5ee0a5}));
        cube.position.set((Math.random()-.5)*1.6,1.9,(Math.random()-.5)*1.4);
        bin.group.add(cube);
      }
    }
    const entries=this.interactables.filter(x=>x.quest&&x.type==='qitem'&&x.data.i===i);
    entries.forEach(x=>x.disabled=true);
    this.renderQuestPanel();
    if(Object.keys(q.data.assignments).length===(q.game.items||[]).length)this.checkQuest();
  }
  stepPlatform(n){
    const q=this.quest;if(!q||q.solved)return;
    const expected=q.data.picked.length;
    if(n!==expected){
      q.data.picked=[];
      q.feedback='Kod yuqoridan pastga bajariladi. Avval ma’lumot tayyorlanadi, keyin amal ishlaydi. Qaytadan boshla!';
      this.beep('wrong');
      q.refs.steps.forEach(s=>{if(s)s.plat.material.color.setHex(0x2a3c68);});
      this.renderQuestPanel();return;
    }
    q.data.picked.push(n);q.feedback='';this.beep('step');
    const ref=q.refs.steps[n];
    if(ref)ref.plat.material.color.setHex(0x2f7a5c);
    this.renderQuestPanel();
    if(q.data.picked.length===(q.game.steps||[]).length)this.checkQuest();
  }
  toggleRow(i){
    const q=this.quest;if(!q||q.solved)return;
    const at=q.data.marked.indexOf(i);
    if(at>=0)q.data.marked.splice(at,1);else q.data.marked.push(i);
    this.beep('pick');
    const ref=q.refs.rows[i];
    if(ref)ref.tab.material.color.setHex(at>=0?0x223457:0x7a3b4c);
    this.renderQuestPanel();
  }
  addSurvey(i){
    const q=this.quest;if(!q||q.solved)return;
    const g=q.game,subs=g.subjects||['Fan'];
    const need=Number(g.minimum||3);
    if(q.data.rows.length>=need){this.floatToast('Yetarli javob yig‘ildi. Endi tekshir!','');return;}
    q.data.rows.push({subject:subs[i%subs.length],hours:2+(i%3)});
    this.beep('coin');
    const ref=q.refs.survey[i];
    if(ref){
      const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.4),new THREE.MeshBasicMaterial({color:0x5ee0a5}));
      orb.position.set(0,3.4,0);ref.group.add(orb);
      ref.group.scale.setScalar(.55);
    }
    this.floatToast('🔒 Anonim javob qo‘shildi. Ism yoki telefon so‘ralmadi.','');
    this.renderQuestPanel();
  }
  updateFilterVisual(){
    const q=this.quest;if(!q||q.type!=='filter')return;
    const g=q.game,d=q.data;
    q.refs.rows.forEach(r=>{
      const match=Number(r.row.value)>=Number(d.minValue)&&(!g.flagLabel||!d.flag||!!r.row.flag);
      r.gem.material.color.setHex(match?0x5ee0a5:0x556180);
      r.gem.material.emissive.setHex(match?0x2e9e70:0x232f4b);
      r.gem.material.emissiveIntensity=match?.75:.2;
      r.gem.position.y=match?2.15:1.35;
    });
  }

  handleQuestInput(e){
    const q=this.quest;if(!q)return;
    const el=e.target;
    if(el.dataset.qrange!==undefined){
      q.data.minValue=Number(el.value);
      const show=this.$('w3d-range-value');if(show)show.textContent=String(q.data.minValue)+(q.game.unit||'');
      this.updateFilterVisual();return;
    }
    if(el.dataset.qflag!==undefined){q.data.flag=el.checked;this.updateFilterVisual();return;}
    if(el.dataset.qhours!==undefined){q.data.hours=Number(el.value);const show=this.$('w3d-hours-value');if(show)show.textContent=String(q.data.hours);return;}
    if(el.dataset.qsubject!==undefined){q.data.subject=el.value;return;}
  }

  handleQuestClick(e){
    const b=e.target.closest('[data-q]');if(!b)return;
    const a=b.dataset.q,q=this.quest;
    if(a==='exit'){this.exitQuest();return;}
    if(a==='hint'){q.hintOpen=!q.hintOpen;this.renderQuestPanel();return;}
    if(a==='check'){this.checkQuest();return;}
    if(a==='next'){
      const n=this.state.nextLesson;
      if(n===null){this.exitQuest();this.floatToast('🏆 Barcha 54 missiya tugadi!','');}
      else this.startQuest(n);
      return;
    }
    if(a==='classic'){this.api.openLesson(q.index);return;}
    if(a==='retry'){q.solved=false;q.result=null;q.feedback='';q.data=this.makeQuestData(q.game);this.buildQuestScene();this.renderQuestPanel();return;}
    if(!q||q.solved)return;
    if(a==='choice')this.selectChoice(Number(b.dataset.i));
    else if(a==='item')this.pickItem(Number(b.dataset.i));
    else if(a==='bin')this.deposit(Number(b.dataset.b));
    else if(a==='step')this.stepPlatform(Number(b.dataset.n));
    else if(a==='row')this.toggleRow(Number(b.dataset.i));
    else if(a==='addsurvey')this.addSurvey(q.data.rows.length);
  }

  checkQuest(){
    const q=this.quest;if(!q||q.solved)return;
    const g=q.game,d=q.data;
    let ok=false;
    if(q.type==='sort')ok=(g.items||[]).every((it,i)=>Number(d.assignments[i])===Number(it[1]));
    else if(q.type==='sequence')ok=d.picked.length===(g.steps||[]).length&&d.picked.every((n,i)=>n===i);
    else if(q.type==='clean')ok=d.marked.length===(g.bad||[]).length&&(g.bad||[]).every(n=>d.marked.includes(n));
    else if(q.type==='filter')ok=Number(d.minValue)===Number(g.target)&&(!g.flagLabel||!!d.flag===!!g.targetFlag);
    else if(q.type==='survey')ok=d.rows.length>=Number(g.minimum||3);
    else ok=d.selected!==null&&d.selected!==undefined&&Number(d.selected)===Number(g.correct);
    if(ok){this.solveQuest();return;}
    this.beep('wrong');
    q.feedback=q.type==='sort'?'Har bir signalni uning ma’no turiga qarab joylashtir.':
      q.type==='sequence'?'Kod yuqoridan pastga bajariladi: avval tayyorgarlik, keyin amal, oxirida natija.':
      q.type==='clean'?'Bo‘sh katak, takroriy ID yoki noto‘g‘ri formatni izla.':
      q.type==='filter'?'Slayder chegarasi va qo‘shimcha belgini vazifadagi shart bilan solishtir.':
      q.type==='survey'?`Kamida ${Number(g.minimum||3)} ta anonim javob kerak.`:
      'Yana bir bor o‘yla: qaysi javob vazifadagi maqsadga olib boradi?';
    this.renderQuestPanel();
  }

  async solveQuest(){
    const q=this.quest;if(!q||q.solved)return;
    q.solved=true;q.feedback='';
    this.beep('win');this.confetti();this.renderQuestPanel();
    let result;
    try{ result=await this.api.awardQuest(q.index); }
    catch(error){ result={ok:false,error:error.message||'XP saqlanmadi.'}; }
    if(!this.quest||this.quest!==q)return;
    q.result=result||{ok:false,error:'Natija olinmadi.'};
    this.state=this.api.getState();
    this.updateHud();
    this.renderQuestPanel();
  }

  updateHud(){
    this.$('w3d-xp-top').textContent=this.state.xp;
    this.$('w3d-mission-count').textContent=`${this.state.completed.length}/54`;
    this.$('w3d-crystal-top').textContent=this.crystalCount();
    this.root.querySelectorAll('[data-zone]').forEach(el=>{
      const i=Number(el.dataset.zone),w=this.state.worlds[i];
      el.classList.toggle('locked',!w.unlocked);
      const b=el.querySelector('b');if(b)b.textContent=`${w.progress.done}/${w.progress.total}`;
    });
  }
  refreshState(){ this.state=this.api.getState();this.updateHud(); }

  renderQuestPanel(){
    const q=this.quest;if(!q)return;
    const g=q.game,l=q.lesson,d=q.data;
    const typeLabel=TYPE_LABEL[q.type]||'MINI O‘YIN';
    const prompt=g.prompt||l.challenge||'';
    let body='',canCheck=true,progress=0,progressMax=1;
    if(q.type==='choose'){
      const opts=g.choices||[];
      body=`<div class="w3d-qlabel">JAVOB PODIUMI · 3D maydonda podiumga bor yoki tugmani bos</div><div class="w3d-options">${opts.map((o,i)=>{
        const text=typeof o==='string'?o:o.label;
        const cls=d.selected===i?'selected':(q.solved&&i===g.correct?'correct':'');
        return `<button class="w3d-option ${cls}" data-q="choice" data-i="${i}" ${q.solved?'disabled':''}><span>${String.fromCharCode(65+i)}</span><span>${esc(text)}</span></button>`;
      }).join('')}</div>`;
      progress=d.selected===null?0:1;progressMax=1;
    } else if(q.type==='sort'){
      const items=g.items||[],bins=g.buckets||[];
      body=`<div class="w3d-qlabel">SIGNALLAR · birini tanla</div><div class="w3d-chips">${items.map((it,i)=>{
        const placed=d.assignments[i]!==undefined;
        return `<button class="w3d-chip-btn ${placed?'placed':d.selected===i?'picked':''}" data-q="item" data-i="${i}" ${placed||q.solved?'disabled':''}>${esc(it[0])}${placed?' → '+esc(bins[d.assignments[i]]||''):''}</button>`;
      }).join('')}</div><div class="w3d-qlabel">QUTILAR · joylashtir</div><div class="w3d-bin-row">${bins.map((b,i)=>`<button class="w3d-bin-btn" data-q="bin" data-b="${i}" ${q.solved?'disabled':''}><b>📦 ${esc(b)}</b><small>${items.filter((_,k)=>d.assignments[k]===i).length} ta signal</small></button>`).join('')}</div>`;
      progress=Object.keys(d.assignments).length;progressMax=items.length;canCheck=progress===progressMax;
    } else if(q.type==='sequence'){
      const steps=g.steps||[];
      body=`<div class="w3d-qlabel">KOD BO‘LAKLARI · to‘g‘ri tartibda platformalarga chiq</div><div class="w3d-options">${(d.order||steps.map((_,n)=>n)).map(n=>{
        const at=d.picked.indexOf(n);
        return `<button class="w3d-option ${at>=0?'correct':''}" data-q="step" data-n="${n}" ${q.solved?'disabled':''}><span>${at>=0?at+1:'·'}</span><span><code>${esc(steps[n])}</code></span></button>`;
      }).join('')}</div>`;
      progress=d.picked.length;progressMax=steps.length;canCheck=progress===progressMax;
    } else if(q.type==='clean'){
      const rows=g.rows||[];
      body=`<div class="w3d-qlabel">JADVAL QATORLARI · shubhalilarini belgila</div><div class="w3d-options">${rows.map((row,i)=>`<button class="w3d-option ${d.marked.includes(i)?'wrong':''}" data-q="row" data-i="${i}" ${q.solved?'disabled':''}><span>${d.marked.includes(i)?'⚑':'·'}</span><span>${esc(row.map(c=>c||'∅ bo‘sh').join(' · '))}</span></button>`).join('')}</div>`;
      progress=d.marked.length;progressMax=g.bad?.length||1;
    } else if(q.type==='filter'){
      body=`<div class="w3d-qlabel">${esc(g.metric||'CHEGARA')} · slayderni vazifaga mos qo‘y</div>
        <div class="w3d-slider-row"><input type="range" data-qrange min="${Number(g.min??0)}" max="${Number(g.max??100)}" step="1" value="${Number(d.minValue)}" ${q.solved?'disabled':''}><b id="w3d-range-value">${Number(d.minValue)}${esc(g.unit||'')}</b></div>
        ${g.flagLabel?`<label class="w3d-check"><input type="checkbox" data-qflag ${d.flag?'checked':''} ${q.solved?'disabled':''}> ${esc(g.flagLabel)}</label>`:''}
        <div class="w3d-qhint">Yashil bo‘lgan qatorlar filtrdan o‘tadi. Darvozaga borib yoki «Tekshir» tugmasi bilan natijani yubor.</div>`;
      progress=0;progressMax=1;
    } else if(q.type==='survey'){
      const need=Number(g.minimum||3);
      body=`<div class="w3d-fact-box">🔒 Ism, telefon yoki manzil so‘ralmaydi. Faqat rozilik olingan anonim javoblar yig‘iladi.</div>
        <div class="w3d-qlabel">ANONIM SO‘ROV</div>
        <div class="w3d-slider-row"><span style="font-size:9px;color:#aebdd8">Fan</span><select data-qsubject style="flex:1;background:#14233e;color:#dce6fa;border:1px solid #6c7daa55;border-radius:8px;padding:7px;font-size:10px">${(g.subjects||[]).map(s=>`<option ${s===d.subject?'selected':''}>${esc(s)}</option>`).join('')}</select></div>
        <div class="w3d-slider-row"><span style="font-size:9px;color:#aebdd8">Soat</span><input type="range" data-qhours min="0" max="8" step=".5" value="${Number(d.hours)}"><b id="w3d-hours-value">${Number(d.hours)}</b></div>
        <div class="w3d-chips"><button class="w3d-chip-btn lit" data-q="addsurvey" ${q.solved?'disabled':''}>＋ Anonim javob qo‘sh</button></div>
        <div class="w3d-qhint">Yig‘ilgan javoblar: <b>${d.rows.length}</b> / ${need}. 3D maydondagi o‘quvchilarga ham yaqinlashib javob olishing mumkin.</div>`;
      progress=d.rows.length;progressMax=need;
    }
    const hint=q.hintOpen?`<div class="w3d-feedback"><strong>💡 Yordam</strong>${esc(l.hint||l.objective||'Avval vaziyatni kuzat, keyin qoidani qo‘lla.')}</div>`:'';
    const feedback=q.feedback?`<div class="w3d-feedback bad"><strong>↻ Yana bir urinish</strong>${esc(q.feedback)}</div>`:'';
    let end='';
    if(q.solved){
      const r=q.result;
      const resultHtml=r===null?'<div class="w3d-feedback"><strong>✦ Natija saqlanmoqda...</strong></div>':
        r.ok?`<div class="w3d-feedback good"><strong>🎉 ${r.already?'Bu missiya avval bajarilgan':'+20 XP · missiya nishoni ochildi!'}</strong>${r.local?'Mehmon rejimi: XP shu brauzerda saqlandi. Akkauntga kirsang, natijalar barcha qurilmada ko‘rinadi.':'Natija akkauntingga saqlandi va reytingga qo‘shildi.'}</div>`:
        `<div class="w3d-feedback bad"><strong>⚠ Natijani saqlab bo‘lmadi</strong>${esc(r.error||'Serverga ulanishda xatolik.')} Klassik dars orqali qayta urinib ko‘r.</div>`;
      const next=this.state.nextLesson;
      end=`<div class="w3d-aha"><b>💡 AHA! · ENDI TUSHUNDING</b><p>${esc(g.aha||l.explanation||l.concept||'')}</p></div>
        ${l.concept?`<div class="w3d-fact-box" style="margin-top:9px">${esc(l.concept)}${l.example?`<pre>${esc(l.example)}</pre>`:''}</div>`:''}
        ${resultHtml}
        <div class="w3d-quest-actions">${next!==null?`<button class="btn btn-primary" data-q="next">Keyingi missiya →</button>`:''}<button class="btn btn-secondary" data-q="exit">Olamga qaytish</button><button class="btn btn-ghost" data-q="classic">Klassik dars</button></div>`;
    }
    this.$('w3d-quest').innerHTML=`
      <div class="w3d-qmeta"><span class="tag violet">🎮 ${esc(typeLabel)}</span><span class="tag gold">✦ +20 XP</span><span class="tag cyan">MISSIYA ${q.index+1}/54</span></div>
      <h2>${esc(g.title)}</h2>
      <p>${esc(g.brief)}</p>
      <div class="w3d-qobjective"><b>🎯 Maqsad:</b> ${esc(l.objective||'')}</div>
      ${prompt?`<p style="color:#e2eaff;font-weight:700">${esc(prompt)}</p>`:''}
      ${body}
      <div class="w3d-progress-line"><i style="width:${Math.round(progress/Math.max(1,progressMax)*100)}%"></i></div>
      <div class="w3d-progress-note"><span>Taraqqiyot</span><span>${Math.min(progress,progressMax)} / ${progressMax}</span></div>
      ${hint}${feedback}${end}
      <div class="w3d-quest-actions">
        ${!q.solved?`<button class="btn btn-primary" data-q="check" ${canCheck?'':'disabled'}>✓ Tekshir va signal yubor</button>`:''}
        <button class="btn btn-ghost" data-q="hint">💡 Yordam</button>
        <button class="btn btn-ghost" data-q="exit">↩ Chiqish</button>
      </div>`;
  }

  drawRadar(){
    const c=this.$('w3d-radar-canvas');if(!c)return;
    const g=c.getContext('2d'),S=236,C=S/2,scale=.95;
    g.clearRect(0,0,S,S);
    g.fillStyle='#0a1324';g.beginPath();g.arc(C,C,C-2,0,TAU);g.fill();
    g.strokeStyle='#2b3c63';g.lineWidth=2;
    [.35,.7,1].forEach(k=>{g.beginPath();g.arc(C,C,(C-8)*k,0,TAU);g.stroke();});
    g.strokeStyle='#1d2c4a';g.beginPath();g.moveTo(C,8);g.lineTo(C,S-8);g.moveTo(8,C);g.lineTo(S-8,C);g.stroke();
    this.state.worlds.forEach((w,i)=>{
      const a=-Math.PI/2+i*TAU/9;
      const x=C+Math.cos(a)*ISLAND_RADIUS*scale,y=C+Math.sin(a)*ISLAND_RADIUS*scale;
      const th=ZONE_THEME[i];
      g.fillStyle=w.unlocked?'#'+th.accent.toString(16).padStart(6,'0'):'#3d4a68';
      g.beginPath();g.arc(x,y,w.unlocked?6:4,0,TAU);g.fill();
      if(i===this.worldOf(this.state.nextLesson??0)){
        g.strokeStyle='#ffc66e';g.lineWidth=2;g.beginPath();g.arc(x,y,10,0,TAU);g.stroke();
      }
    });
    const px=C+this.player.position.x*scale,pz=C+this.player.position.z*scale;
    g.save();g.translate(px,pz);g.rotate(-this.player.rotation.y);
    g.fillStyle='#ffffff';g.beginPath();g.moveTo(0,-8);g.lineTo(6,7);g.lineTo(0,4);g.lineTo(-6,7);g.closePath();g.fill();g.restore();
  }

  destroy(){
    this.running=false;
    if(this.raf)cancelAnimationFrame(this.raf);
    if(this.resizeObserver)this.resizeObserver.disconnect();
    clearTimeout(this._toastTimer);
    this._handlers.forEach(([t,type,fn,opts])=>{try{t.removeEventListener(type,fn,opts);}catch(_){}});
    this._handlers=[];
    if(this.audio){try{this.audio.close();}catch(_){}}
    if(this.scene){
      this.scene.traverse(o=>{
        if(o.geometry)o.geometry.dispose();
        if(o.material){const l=Array.isArray(o.material)?o.material:[o.material];l.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}
      });
    }
    if(this.renderer){this.renderer.dispose();if(this.renderer.domElement.parentNode)this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);}
    this.root.innerHTML='';
  }
}

export function mount(root,api){
  if(session){session.destroy();session=null;}
  if(!root||!api)return;
  session=new World3D(root,api);
  session.start();
}
export function unmount(){
  if(session){session.destroy();session=null;}
}
window.DataSpaceWorld={mount,unmount,get session(){return session;}};
