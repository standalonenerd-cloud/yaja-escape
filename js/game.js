/* =====================================================================
   야자 탈출 — 게임 엔진 (그림 파일 없이 도형으로 그림)
   ===================================================================== */
(() => {
const T = 32, VW = 640, VH = 384;
const TEACHER = location.hash.replace("#","") === "teacher";
const KEY = "yaja-escape-v1";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

/* ------------------------------------------------------------------
   1. 배치도 → 장면
   배치도의 흰 방은 '출입 금지'로 막고, 색칠된 방만 들어갈 수 있다.
   ------------------------------------------------------------------ */
const COLOR = { class:"#ECD174", special:"#6182D6", toilet:"#FFEF99", white:"#e6e6e6" };

function newScene(id, name, cols, rows, opts={}){
  return { id, name, cols, rows, grid: Array.from({length:rows}, () => Array(cols).fill("#")), objs: [], ...opts };
}
function carve(s, c, r, w, h){ for(let y=r;y<r+h;y++) for(let x=c;x<c+w;x++) s.grid[y][x] = "."; }
function add(s, o){ if(o.kind !== "deco"){ o.w = o.w||1; o.h = o.h||1; } s.objs.push(o); return o; }

function buildFloor4(){
  const s = newScene("F4","본관 4층",45,12,{ hall:true });
  carve(s,4,5,30,2); carve(s,34,3,10,4);
  add(s,{kind:"stairE", label:"동편 계단", c:1,r:2,w:3,h:8, door:[3,5]});
  [["c23",4],["c24",9],["c25",14],["c26",19],["c27",24]].forEach(([id,c]) => add(s,{kind:"room", room:id, c, r:1, w:5, h:4, door:[c+2,4], color:COLOR.class}));
  add(s,{kind:"room", room:"staff", c:29,r:1,w:5,h:4, door:[31,4], color:COLOR.class});
  add(s,{kind:"room", room:"toilet4", c:34,r:0,w:4,h:3, door:[35,2], color:COLOR.toilet});
  add(s,{kind:"room", room:"art", c:38,r:0,w:6,h:3, door:[40,2], color:COLOR.special});
  add(s,{kind:"locked", label:"컴퓨터활용실", c:29,r:7,w:8,h:4, door:[32,7]});
  add(s,{kind:"stairC", label:"중앙 계단", c:37,r:7,w:7,h:4, door:[40,7], to:"F3", toPos:[41,6]});
  add(s,{kind:"deco", label:"중원홀", c:38,r:4,w:0,h:0});
  return s;
}
function buildFloor3(){
  const s = newScene("F3","본관 3층",46,12,{ hall:true });
  carve(s,4,5,33,2); carve(s,37,3,8,4);
  add(s,{kind:"stairE", label:"동편 계단", c:1,r:2,w:3,h:8, door:[3,5], exit:true});
  add(s,{kind:"room", room:"nurse", c:4,r:1,w:5,h:4, door:[6,4], color:COLOR.special});
  add(s,{kind:"room", room:"c21", c:9,r:1,w:5,h:4, door:[11,4], color:COLOR.class});
  add(s,{kind:"room", room:"c22", c:14,r:1,w:5,h:4, door:[16,4], color:COLOR.class});
  add(s,{kind:"locked", label:"연결 통로", c:19,r:1,w:4,h:4, door:[20,4]});
  add(s,{kind:"locked", label:"소강의실2", c:23,r:1,w:4,h:4, door:[24,4]});
  add(s,{kind:"room", room:"counsel", c:27,r:1,w:5,h:4, door:[29,4], color:COLOR.class});
  add(s,{kind:"room", room:"safety", c:32,r:1,w:5,h:4, door:[34,4], color:COLOR.special});
  add(s,{kind:"room", room:"toilet3", c:37,r:0,w:4,h:3, door:[38,2], color:COLOR.toilet});
  add(s,{kind:"room", room:"yewon", c:41,r:0,w:4,h:3, door:[42,2], color:COLOR.class});
  add(s,{kind:"locked", label:"컴퓨터활용실", c:30,r:7,w:8,h:4, door:[33,7]});
  add(s,{kind:"stairC", label:"중앙 계단", c:38,r:7,w:7,h:4, door:[41,7], to:"F4", toPos:[40,6]});
  return s;
}

/* 방 안 — 20×12칸. 문은 아래 벽 (17,11) */
function buildRoom(id){
  const R = ROOMS[id];
  const s = newScene(id, R.name, 20, 12, { room:id, floor: ["c21","c22","nurse","counsel","safety","toilet3","yewon"].includes(id) ? "F3" : "F4" });
  carve(s,1,2,18,9);
  add(s,{kind:"exit", label:"복도로 나가기", c:17,r:11});
  const st = (key, o) => add(s, Object.assign({kind:"station", key, label:R.stations[key].name}, o));
  const prop = o => add(s, Object.assign({kind:"prop"}, o));
  const style = R.kind === "class" ? "class" : id;
  s.style = style;
  if(style === "class"){
    st("board",{c:6,r:0,w:8,h:2, draw:"board"});
    st("desk",{c:9,r:3,w:2,h:1, draw:"lectern"});
    st("locker",{c:2,r:10,w:7,h:1, draw:"locker"});
    [3,5,7,12,14,16].forEach(c => [5,7].forEach(r => prop({c,r,draw:"sdesk", say: r===7&&c===14 ? "책상에 연필로 쓴 낙서: '문법 귀신 진짜 있음. 2-1반까지 버텨.'" : null})));
    prop({c:15,r:0,w:3,h:2,draw:"notice", say:"게시판: '야간 자율 학습 22:00 종료. 마지막에 나가는 사람은 소등.'"});
  } else if(id === "staff"){
    [[3,4],[9,4],[3,7],[9,7]].forEach(([c,r]) => prop({c,r,w:4,h:2,draw:"tdesks", say:"선생님들 책상 위에 수행평가 채점지가 쌓여 있다."}));
    st("main",{c:14,r:4,w:3,h:2,draw:"tdesk"});
    prop({c:15,r:8,w:2,h:1,draw:"copier", say:"복사기가 혼자 '위잉' 하고 한 장을 뱉는다. 백지다."});
  } else if(id === "art"){
    [[3,5],[6,5],[3,8],[6,8],[13,8],[16,8]].forEach(([c,r]) => prop({c,r,draw:"easel", say:"이젤 위 그림 속 인물의 눈이 너를 따라오는 것 같다."}));
    st("main",{c:9,r:4,w:2,h:2,draw:"bigeasel"});
    prop({c:15,r:4,draw:"bust", say:"석고상. 아까는 분명 창문 쪽을 보고 있었는데…"});
    prop({c:2,r:0,w:4,h:2,draw:"sink", say:"물감 묻은 개수대. 물방울이 똑, 똑 떨어진다."});
  } else if(id === "nurse"){
    prop({c:2,r:3,w:3,h:2,draw:"bed", say:"침대 커튼이 살짝 흔들린다. 바람은 없는데."});
    prop({c:2,r:7,w:3,h:2,draw:"bed", say:"베개가 누가 방금 누웠던 것처럼 움푹하다."});
    prop({c:11,r:0,w:5,h:2,draw:"cabinet", say:"약장 유리에 네 얼굴이 비친다. 뒤에… 아무도 없다."});
    st("main",{c:12,r:6,w:3,h:1,draw:"tdesk"});
  } else if(id === "counsel"){
    prop({c:3,r:0,w:6,h:2,draw:"shelf", say:"대학 안내 책자가 빽빽하다. '2027 대입 전형' 한 권이 툭 떨어진다."});
    st("main",{c:8,r:5,w:3,h:1,draw:"ctable"});
    prop({c:8,r:7,w:3,h:1,draw:"sofa", say:"상담용 소파. 앉으면 진로 고민이 저절로 떠오를 것 같다."});
    prop({c:15,r:3,draw:"plant", say:"화분 잎이 아주 천천히 고개를 돌린다."});
  } else if(id === "safety"){
    st("main",{c:8,r:0,w:4,h:2,draw:"board2"});
    prop({c:1,r:3,draw:"ext", say:"소화기. 압력계 바늘이 초록색에 있다. 다행이다."});
    prop({c:15,r:3,w:2,h:1,draw:"aid", say:"구급함. 반창고가 한 상자 가득하다."});
    prop({c:4,r:6,w:4,h:2,draw:"tdesks", say:"안전 점검 서류가 가지런히 놓여 있다."});
  } else if(id === "yewon"){
    prop({c:5,r:0,w:10,h:2,draw:"screen", say:"병풍 그림 속 학이 날개를 접는다."});
    st("main",{c:9,r:3,w:2,h:1,draw:"tea"});
    [[3,6],[8,6],[13,6],[3,9],[13,9]].forEach(([c,r]) => prop({c,r,w:3,h:1,draw:"lowtable", say:"방석이 가지런히 놓인 낮은 상. 바르게 앉아야 할 것 같다."}));
  } else if(id === "toilet4" || id === "toilet3"){
    st("main",{c:3,r:0,w:6,h:2,draw:"mirror"});
    [11,13,15].forEach((c,i) => prop({c,r:2,w:2,h:3,draw:"stall", say: i===2 ? "맨 끝 칸. 안에서 '똑똑' 노크 소리가 난다. …못 들은 걸로 하자." : "칸이 비어 있다."}));
  }
  return s;
}

/* ------------------------------------------------------------------
   2. 상태
   ------------------------------------------------------------------ */
const fresh = () => ({ started:false, t0:0, tEnd:0, scene:"c23", px:null, py:null, dir:"up",
  solved:{}, cleared:{}, charms:0, used:0, qSelf:0, qHelp:0, wrong:0, escaped:false, refl:"", met:{} });
let S = load();
function load(){ if(TEACHER) return fresh(); try{ const v = JSON.parse(localStorage.getItem(KEY)); return v ? Object.assign(fresh(), v) : fresh(); }catch(e){ return fresh(); } }
function save(){ if(TEACHER) return; S.px = P.x; S.py = P.y; S.dir = P.dir; try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

const isCleared = id => !!S.cleared[id];
const chainIdx = id => CHAIN.indexOf(id);
function roomOpen(id){
  if(TEACHER) return true;
  const i = chainIdx(id);
  if(i < 0) return true;                      // 특별실·화장실은 언제든
  return i === 0 || isCleared(CHAIN[i-1]);
}
const nextRequired = () => CHAIN.find(id => !isCleared(id)) || null;
const stairDownOpen = () => TEACHER || isCleared("c27");
const exitOpen = () => TEACHER || isCleared("c21");

/* ------------------------------------------------------------------
   3. 장면 관리
   ------------------------------------------------------------------ */
const SCENES = {};
function scene(id){
  if(!SCENES[id]) SCENES[id] = id === "F4" ? buildFloor4() : id === "F3" ? buildFloor3() : buildRoom(id);
  return SCENES[id];
}
let SC = null;
const P = { x:0, y:0, dir:"up", walk:0, moving:false };
const HB = { w:16, h:10 };

function solidAt(c, r){
  if(r<0||c<0||r>=SC.rows||c>=SC.cols) return true;
  if(SC.grid[r][c] === "#") {
    // 방 칸은 벽(#) 위에 놓인 물체로 그림. 물체가 없는 칸도 막힘.
    return true;
  }
  return SC.objs.some(o => o.w && c>=o.c && c<o.c+o.w && r>=o.r && r<o.r+o.h);
}
function objAt(c, r){
  for(const o of SC.objs){
    if(o.kind === "deco") continue;
    if(o.door){ if(o.door[0]===c && o.door[1]===r) return o; continue; }
    if(c>=o.c && c<o.c+o.w && r>=o.r && r<o.r+o.h) return o;
  }
  return null;
}
function enter(id, pos, dir){
  SC = scene(id);
  if(pos){ P.x = pos[0]*T + T/2; P.y = pos[1]*T + T - 4; }
  if(dir) P.dir = dir;
  S.scene = id; path = null;
  $("#where").textContent = SC.room ? `${SC.name} · ${ROOMS[SC.room].unit}` : SC.name;
  renderSide(); save();
}
function hallFor(roomId){ for(const f of ["F4","F3"]){ const o = scene(f).objs.find(o => o.room === roomId); if(o) return {floor:f, o}; } }

/* ------------------------------------------------------------------
   4. 이동 · 길 찾기
   ------------------------------------------------------------------ */
const DIRV = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
const keys = {};
let path = null, pathGoal = null, near = null;

function blocked(x,y){
  const l=x-HB.w/2, r=x+HB.w/2-1, t=y-HB.h, b=y-1;
  return [[l,t],[r,t],[l,b],[r,b]].some(([px,py]) => solidAt(Math.floor(px/T), Math.floor(py/T)));
}
function tryMove(dx,dy){ if(dx && !blocked(P.x+dx,P.y)) P.x+=dx; if(dy && !blocked(P.x,P.y+dy)) P.y+=dy; }
const ptile = () => ({ c:Math.floor(P.x/T), r:Math.floor((P.y-HB.h/2)/T) });

function findNear(){
  const {c,r} = ptile(), [fx,fy] = DIRV[P.dir];
  const f = objAt(c+fx, r+fy); if(f) return f;
  for(const [dx,dy] of Object.values(DIRV)){ const o = objAt(c+dx, r+dy); if(o) return o; }
  return null;
}
function route(test){
  const s = ptile(), seen = new Set([s.c+","+s.r]), q = [[s.c,s.r,[]]];
  while(q.length){
    const [c,r,trail] = q.shift(); const hit = test(c,r); if(hit) return {trail, face:hit};
    for(const [d,[dx,dy]] of Object.entries(DIRV)){
      const nc=c+dx, nr=r+dy, k=nc+","+nr;
      if(seen.has(k) || solidAt(nc,nr)) continue; seen.add(k); q.push([nc,nr,trail.concat([[nc,nr]])]);
    }
  }
  return null;
}
function routeToObj(o){ return route((c,r) => { for(const [d,[dx,dy]] of Object.entries(DIRV)) if(objAt(c+dx,r+dy) === o) return d; return null; }); }
function walkTo(o, open){ const res = routeToObj(o); if(!res) return; path = res.trail; pathGoal = {face:res.face, o, open}; cv.focus({preventScroll:true}); }
function teleportTo(o){ const res = routeToObj(o); if(!res) return; const t = res.trail.length ? res.trail[res.trail.length-1] : null; if(t){ P.x=t[0]*T+T/2; P.y=t[1]*T+T-4; } P.dir = res.face; path = null; }

/* ------------------------------------------------------------------
   5. 살피기
   ------------------------------------------------------------------ */
function labelOf(o){
  if(o.kind === "room") return ROOMS[o.room].name;
  return o.label || "";
}
function actText(o){
  if(!o) return "살필 것 없음";
  if(o.kind === "room") return roomOpen(o.room) ? `${ROOMS[o.room].name} 들어가기` : `${ROOMS[o.room].name} · 잠김`;
  if(o.kind === "exit") return "복도로 나가기";
  if(o.kind === "stairC") return SC.id === "F4" ? "3층으로 내려가기" : "4층으로 올라가기";
  if(o.kind === "stairE") return o.exit ? "동편 계단으로 탈출" : "동편 계단 살피기";
  if(o.kind === "locked") return `${o.label} · 출입 금지`;
  if(o.kind === "station") return `${o.label} 살피기`;
  return "살펴보기";
}
function interact(o){
  o = o || near; if(!o) return;
  if(o.kind === "room"){
    if(!roomOpen(o.room)){
      const i = chainIdx(o.room);
      return talk(`${ROOMS[o.room].name} 문이 꿈쩍도 안 해. ${ROOMS[CHAIN[i-1]].name} 문제부터 풀어.`);
    }
    return enter(o.room, [17,10], "up"), onEnterRoom(o.room);
  }
  if(o.kind === "exit"){
    const R = ROOMS[SC.room];
    if(R.kind === "class" && !isCleared(SC.room) && !TEACHER) return talk("어딜 가? 이 교실 문제를 다 풀기 전엔 문이 안 열려.");
    const h = hallFor(SC.room);
    return enter(h.floor, [h.o.door[0], h.o.door[1]+1], "down");
  }
  if(o.kind === "stairC"){
    if(SC.id === "F4" && !stairDownOpen()) return talk("중앙 계단은 2-7반까지 다 풀어야 열려.");
    if(SC.id === "F4" && !S.met.floor3){ S.met.floor3 = true; setTimeout(() => talk(STORY.lastRoom), 400); }
    return enter(o.to, o.toPos, "up");
  }
  if(o.kind === "stairE"){
    if(!o.exit) return talk("4층 동편 계단은 셔터가 내려와 있어. 다른 길로 가야 해.");
    if(!exitOpen()) return talk("여기가 학교 밖으로 나가는 길이야. 하지만 2-1반을 풀기 전엔 안 열어 줘. 킥킥.");
    return finish();
  }
  if(o.kind === "locked") return talk(`${o.label}은 잠겨 있어. 배치도에서 흰 방은 못 들어가.`, "안내");
  if(o.kind === "station") return openStation(SC.room, o.key);
  if(o.kind === "prop" && o.say) return talk(o.say, "살펴보니");
}
function onEnterRoom(id){
  const R = ROOMS[id];
  if(!S.met[id] && R.ghost && !isCleared(id)){ S.met[id] = true; save(); setTimeout(() => talk(R.ghost), 250); }
}

/* ------------------------------------------------------------------
   6. 그리기
   ------------------------------------------------------------------ */
const cv = $("#cv"), ctx = cv.getContext("2d");
ctx.scale(2,2); ctx.imageSmoothingEnabled = false;
const fog = document.createElement("canvas"); fog.width = 1280; fog.height = 768;
const fx = fog.getContext("2d"); fx.scale(2,2);
let camX = 0;
const rect = (x,y,w,h,c) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); };
const K = {
  wall:"#1b1e29", wallHi:"#262a3a", floorA:"#3a3d48", floorB:"#34374a", wood:"#6b4f38", woodDk:"#4e3826",
  chalk:"#2a4636", frame:"#7a5a3c", paper:"#eee6d4", ink:"#4b4339", metal:"#8a8fa0", skin:"#f2c9a5", hair:"#241a18",
  blazer:"#2e3a5e", skirt:"#3c3848", shoe:"#151218", ribbon:"#c9463c", bag:"#7a3b38"
};
function text(t,x,y,size,color,align="center",font="'Gowun Dodum',sans-serif"){ ctx.font=`bold ${size}px ${font}`; ctx.fillStyle=color; ctx.textAlign=align; ctx.fillText(t,x,y); ctx.textAlign="left"; }

function drawHall(t){
  const s = SC;
  for(let r=0;r<s.rows;r++) for(let c=0;c<s.cols;c++){
    const x=c*T, y=r*T;
    if(s.grid[r][c] === "."){ rect(x,y,T,T,(r+c)%2?K.floorA:K.floorB); rect(x,y+T-1,T,1,"rgba(0,0,0,.15)"); }
    else rect(x,y,T,T,K.wall);
  }
  // 복도 창문 쪽(아래 벽) 달빛 줄
  for(let c=4;c<s.cols-2;c+=3){ if(s.grid[7] && s.grid[6][c]===".") rect(c*T+6, 7*T, 20, 3, "rgba(170,190,255,.25)"); }
  const nxt = nextRequired();
  for(const o of s.objs){
    const x=o.c*T, y=o.r*T, w=o.w*T, h=o.h*T;
    if(o.kind === "deco"){ text(o.label, x, y, 11, "rgba(233,230,220,.35)"); continue; }
    if(o.kind === "room"){
      const open = roomOpen(o.room), done = isCleared(o.room);
      rect(x,y,w,h,o.color); rect(x+3,y+3,w-6,h-6, shade(o.color,.82));
      // 교실 안 책상 실루엣
      ctx.fillStyle = "rgba(0,0,0,.12)";
      for(let i=0;i<o.w-1;i++) for(let j=0;j<o.h-2;j++) ctx.fillRect(x+10+i*T, y+8+j*T, 14, 10);
      rect(x,y+h-3,w,3,"#2b2416");
      text(ROOMS[o.room].name, x+w/2, y+h/2+2, o.w>=5?14:12, "#2a2414");
      drawDoor(o, open, done);
      if(done) text("✓", x+w-10, y+14, 13, "#2f6b3c");
      else if(o.room === nxt) bubble(o.door[0]*T+T/2, o.door[1]*T - 8 + Math.sin(t*4)*2, "!", "#f2d27a");
      else if(!open) text("🔒", o.door[0]*T+T/2, o.door[1]*T+6, 10, "#000");
      else if(ROOMS[o.room].kind !== "class") bubble(o.door[0]*T+T/2, o.door[1]*T - 6 + Math.sin(t*3+o.c)*2, "符", "#e8d27a", "#b33a2d");
    } else if(o.kind === "locked"){
      rect(x,y,w,h,COLOR.white); rect(x+3,y+3,w-6,h-6,"#cfcfcf");
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
      ctx.strokeStyle = "rgba(200,60,50,.55)"; ctx.lineWidth = 5;
      for(let k=-h;k<w;k+=22){ ctx.beginPath(); ctx.moveTo(x+k,y+h); ctx.lineTo(x+k+h,y); ctx.stroke(); }
      ctx.restore();
      text(o.label, x+w/2, y+h/2-2, 11, "#3a3a3a");
      text("출입 금지", x+w/2, y+h/2+12, 10, "#a33");
    } else if(o.kind === "stairC" || o.kind === "stairE"){
      rect(x,y,w,h,"#2c3040");
      for(let i=0;i<(o.kind==="stairE"?o.h:o.w);i++){
        if(o.kind==="stairE") rect(x+3, y+i*T+4, w-6, 4, "#3d4256"); else rect(x+i*T+4, y+3, 4, h-6, "#3d4256");
      }
      const lab = o.kind === "stairE" ? (o.exit ? "동편 계단 (3F→2F)" : "동편 계단") : `중앙 계단 (${SC.id==="F4"?"4F→3F":"3F→4F"})`;
      if(o.kind === "stairE"){ ctx.save(); ctx.translate(x+w/2, y+h/2); ctx.rotate(-Math.PI/2); text(lab,0,4,11,"#c9cbd6"); ctx.restore(); }
      else text(lab, x+w/2, y+h-10, 11, "#c9cbd6");
      const isExit = o.kind==="stairE" ? o.exit : true;
      const lit = o.kind==="stairE" ? (o.exit && exitOpen()) : (SC.id==="F3" || stairDownOpen());
      if(isExit){ rect(o.door[0]*T+4, o.door[1]*T+(o.kind==="stairE"?2:18), 24, 10, lit ? K.exit : "#2b4a36"); text("EXIT", o.door[0]*T+16, o.door[1]*T+(o.kind==="stairE"?10:26), 7, lit?"#08140d":"#4e7a5c"); }
      if(o.kind==="stairE" && !o.exit){ // 셔터
        ctx.fillStyle = "rgba(150,150,160,.5)"; for(let i=0;i<8;i++) ctx.fillRect(x+w-8, y+i*T+2, 6, T-4);
      }
      if(lit && ((o.kind==="stairC" && SC.id==="F4" && nxt==="c22") || (o.kind==="stairE" && o.exit && !nxt))) bubble(o.door[0]*T+T/2, o.door[1]*T + (o.kind==="stairE"?-6:-8) + Math.sin(t*4)*2, "!", K.exit);
    }
  }
  // 층 표지
  text(s.name, 5*T, 0.6*T, 12, "rgba(233,230,220,.5)", "left");
}
function drawDoor(o, open, done){
  const [dc,dr] = o.door, x=dc*T, y=dr*T;
  rect(x+4, y+T-10, T-8, 10, open ? "#5b4026" : "#3a2d22");
  rect(x+6, y+T-8, T-12, 6, open ? "#7a5634" : "#4a3a2c");
  if(done) rect(x+6, y+T-3, T-12, 2, K.exit);
}
function shade(hex, k){ const n=parseInt(hex.slice(1),16); const r=(n>>16)*k|0, g=((n>>8)&255)*k|0, b=(n&255)*k|0; return `rgb(${r},${g},${b})`; }
function bubble(x,y,ch,bg,fg="#1a1608"){ ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(x,y,7,0,Math.PI*2); ctx.fill(); text(ch,x,y+4,ch.length>1||ch==="符"?9:10,fg); }

function drawRoomBase(){
  const s = SC, st = s.style;
  const floorC = st==="toilet4"||st==="toilet3" ? ["#5c6b70","#566469"] : st==="nurse" ? ["#6a7380","#646d7a"] : st==="yewon" ? ["#8c7350","#856c4a"] : ["#6e5440","#674e3b"];
  for(let r=0;r<s.rows;r++) for(let c=0;c<s.cols;c++){
    const x=c*T,y=r*T;
    if(s.grid[r][c]==="."){
      if(st==="toilet4"||st==="toilet3"||st==="nurse"){ rect(x,y,T,T,(r+c)%2?floorC[0]:floorC[1]); }
      else { rect(x,y,T,T,floorC[(r%2)]); rect(x,y+T-1,T,1,"rgba(0,0,0,.2)"); if((c+r)%3===0) rect(x+T/2,y,1,T,"rgba(0,0,0,.15)"); }
    } else rect(x,y,T,T, r<2 ? "#2b2f3f" : K.wall);
  }
  rect(0,2*T-3,s.cols*T,3,"#1a1c26");
  // 왼쪽 창문(달빛)
  for(const r of [3,6,8]){ rect(0, r*T, T, T+8, "#1a2138"); rect(6, r*T+4, T-12, T, "#2c3a66"); rect(T/2-1, r*T+4, 2, T, "#1a2138"); }
  // 문
  rect(17*T+3, 11*T, T-6, T, "#5b4026"); rect(17*T+6, 11*T+3, T-12, T-6, "#7a5634"); rect(17*T+T-12, 11*T+14, 3, 3, "#d8b46a");
  rect(17*T+4, 11*T-2, T-8, 2, K.exit);
  // 시계
  ctx.fillStyle = K.paper; ctx.beginPath(); ctx.arc(4*T, T, 9, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = K.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4*T,T); ctx.lineTo(4*T,T-7); ctx.moveTo(4*T,T); ctx.lineTo(4*T+5,T+1); ctx.stroke();
}
function drawProp(o, t){
  const x=o.c*T, y=o.r*T, w=o.w*T, h=o.h*T, d=o.draw;
  const solvedSt = o.kind==="station" && S.solved[SC.room+"."+o.key];
  if(d==="board"||d==="board2"){
    rect(x-4,y+4,w+8,h-6,K.frame); rect(x,y+8,w,h-14,d==="board"?K.chalk:"#e8e8e0");
    if(d==="board"){ ctx.strokeStyle="rgba(233,230,220,.7)"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x+14,y+26); ctx.quadraticCurveTo(x+40,y+18,x+70,y+28); ctx.moveTo(x+90,y+22); ctx.lineTo(x+150,y+24); ctx.moveTo(x+170,y+30); ctx.lineTo(x+220,y+20); ctx.stroke(); text(ROOMS[SC.room].unit, x+w/2, y+44, 9, "rgba(233,230,220,.8)"); }
    else { text("안전 점검표", x+w/2, y+26, 10, "#333"); for(let i=0;i<3;i++){ rect(x+12,y+32+i*7,8,5,"#c33"); rect(x+24,y+33+i*7,w-40,3,"#999"); } }
  }
  else if(d==="lectern"){ rect(x,y-6,w,h+8,K.woodDk); rect(x+2,y-4,w-4,h+2,K.wood); rect(x+12,y-2,24,14,K.paper); rect(x+14,y+2,20,2,K.ink); rect(x+14,y+6,14,2,K.ink); }
  else if(d==="locker"){ for(let i=0;i<o.w*2;i++){ rect(x+i*16,y-10,15,h+10,"#5a6278"); rect(x+i*16+2,y-8,11,h+6,"#6c7590"); rect(x+i*16+10,y+4,2,4,"#c9cbd6"); } }
  else if(d==="sdesk"){ rect(x+3,y-2,26,18,K.wood); rect(x+3,y+14,26,3,K.woodDk); rect(x+9,y+20,14,8,"#4a4f63"); }
  else if(d==="notice"){ rect(x+4,y+8,w-8,h-14,"#7a5a3c"); rect(x+8,y+12,w-16,h-22,"#b48a5c"); rect(x+14,y+16,20,14,K.paper); rect(x+40,y+18,16,20,"#f2d27a"); rect(x+62,y+16,18,12,K.paper); }
  else if(d==="tdesks"){ rect(x,y,w,h,K.woodDk); rect(x+2,y+2,w-4,h-4,"#7b5c40"); for(let i=0;i<o.w;i++){ rect(x+8+i*T,y+6,18,12,K.paper); rect(x+10+i*T,y+30,12,10,"#3e4255"); } }
  else if(d==="tdesk"){ rect(x,y,w,h,K.woodDk); rect(x+2,y+2,w-4,h-4,"#8a6848"); rect(x+10,y+6,24,16,K.paper); rect(x+14,y+10,16,2,K.ink); rect(x+14,y+14,12,2,K.ink); rect(x+w-24,y+6,14,10,"#2e3446"); }
  else if(d==="copier"){ rect(x,y-8,w,h+8,"#c8cad2"); rect(x+4,y-4,w-8,8,"#8a8fa0"); rect(x+w-14,y+6,8,4,K.exit); }
  else if(d==="easel"){ ctx.strokeStyle=K.wood; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+6,y+30); ctx.lineTo(x+16,y-6); ctx.lineTo(x+26,y+30); ctx.stroke(); rect(x+5,y-4,22,18,K.paper); rect(x+8,y,16,10,["#c95a4a","#4a7ac9","#5aa36b","#d1a33c"][(o.c+o.r)%4]); }
  else if(d==="bigeasel"){ ctx.strokeStyle=K.wood; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(x+10,y+h); ctx.lineTo(x+w/2,y-10); ctx.lineTo(x+w-10,y+h); ctx.stroke(); rect(x+4,y-8,w-8,h-14,K.paper); rect(x+10,y-2,w-20,h-28,"#6b8fd1"); ctx.fillStyle="#f2d27a"; ctx.beginPath(); ctx.arc(x+w/2,y+14,8,0,Math.PI*2); ctx.fill(); }
  else if(d==="bust"){ rect(x+6,y+14,20,16,"#b0aaa0"); ctx.fillStyle="#e8e4dc"; ctx.beginPath(); ctx.arc(x+16,y+6,9,0,Math.PI*2); ctx.fill(); rect(x+10,y+12,12,8,"#e8e4dc"); }
  else if(d==="sink"){ rect(x+4,y+30,w-8,26,"#c9ccd4"); rect(x+10,y+34,w-20,16,"#7a8090"); ctx.fillStyle="#c95a4a"; ctx.fillRect(x+16,y+38,6,4); ctx.fillStyle="#4a7ac9"; ctx.fillRect(x+40,y+42,8,4); }
  else if(d==="bed"){ rect(x,y,w,h,"#d4d8e2"); rect(x+2,y+2,22,h-4,"#f2f2f6"); rect(x+26,y+4,w-30,h-8,"#9fb0d0"); }
  else if(d==="cabinet"){ rect(x,y+6,w,h-6,"#c9ccd4"); for(let i=0;i<o.w;i++){ rect(x+4+i*T,y+10,T-8,h-20,"#9fc4d8"); rect(x+8+i*T,y+16,6,10,"#fff"); rect(x+16+i*T,y+18,6,8,"#e86a5a"); } text("+",x+w/2,y+20,14,"#c33"); }
  else if(d==="shelf"){ rect(x,y+4,w,h-4,K.woodDk); const cs=["#c95a4a","#4a7ac9","#5aa36b","#d1a33c","#8a6bb5","#ddd"]; for(let i=0;i<w/6-1;i++){ rect(x+4+i*6,y+10,5,18,cs[i%6]); rect(x+4+i*6,y+32,5,20,cs[(i+2)%6]); } }
  else if(d==="ctable"){ rect(x,y,w,h,"#8a6848"); rect(x+10,y+6,26,16,K.paper); rect(x+14,y+10,18,2,K.ink); rect(x+14,y+14,12,2,K.ink); rect(x+60,y+8,12,12,"#f2f2f6"); }
  else if(d==="sofa"){ rect(x,y,w,h+6,"#4b5d80"); rect(x+4,y+4,w-8,h-6,"#5b6f96"); }
  else if(d==="plant"){ rect(x+8,y+16,16,14,"#a8653f"); ctx.fillStyle="#5f8f55"; for(const [a,b] of [[0,-6],[-7,0],[7,0],[-4,-12],[4,-12]]){ ctx.beginPath(); ctx.ellipse(x+16+a,y+12+b,5,9,a/10,0,Math.PI*2); ctx.fill(); } }
  else if(d==="ext"){ rect(x+10,y-6,12,30,"#c83a30"); rect(x+12,y-10,8,6,"#222"); rect(x+12,y+4,8,6,K.paper); }
  else if(d==="aid"){ rect(x+4,y,w-8,h,"#f2f2f6"); rect(x+w/2-3,y+6,6,18,"#c33"); rect(x+w/2-9,y+12,18,6,"#c33"); }
  else if(d==="screen"){ for(let i=0;i<o.w;i++){ rect(x+i*T,y+6,T-2,h-6,"#e9dfc8"); rect(x+i*T,y+6,T-2,4,"#8a2f2a"); } ctx.strokeStyle="#3c5a4a"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+20,y+50); ctx.quadraticCurveTo(x+120,y+14,x+300,y+46); ctx.stroke(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.ellipse(x+180,y+30,10,5,0,0,Math.PI*2); ctx.fill(); }
  else if(d==="tea"){ rect(x,y,w,h,"#7a2f26"); rect(x+2,y+2,w-4,h-4,"#9b4034"); ctx.fillStyle="#f2f2f6"; ctx.beginPath(); ctx.arc(x+18,y+16,6,0,Math.PI*2); ctx.arc(x+44,y+16,6,0,Math.PI*2); ctx.fill(); rect(x+28,y+10,10,10,"#e2b04a"); }
  else if(d==="lowtable"){ rect(x+4,y+4,w-8,h-8,"#6b3a2a"); rect(x,y+h-2,10,8,"#5a6fa0"); rect(x+w-10,y+h-2,10,8,"#5a6fa0"); }
  else if(d==="mirror"){ rect(x,y+4,w,h-14,"#9aa6b5"); rect(x+4,y+8,w-8,h-22,"#c9d6e6"); ctx.fillStyle="rgba(255,255,255,.35)"; ctx.fillRect(x+10,y+12,40,6);
    text(S.solved[SC.room+".main"] ? "…" : "보고 있어", x+w/2, y+30, 10, "rgba(80,90,140,.8)"); for(let i=0;i<3;i++) rect(x+8+i*64, y+h-8, 40, 12, "#e6e8ee"); }
  else if(d==="stall"){ rect(x,y,w,h,"#7b8ba8"); rect(x+3,y+3,w-6,h-6,"#8fa0be"); rect(x+w-12,y+h/2,4,6,"#c9cbd6"); }
  if(o.kind==="station" && !solvedSt){ bubble(x+w/2, y - 6 + Math.sin(t*4+o.c)*2 + (o.r<2?14:0), "!", "#f2d27a"); }
  if(o.kind==="station" && solvedSt){ bubble(x+w/2, y - 6 + (o.r<2?14:0), "✓", K.exit); }
}

function drawPlayer(){
  const x = Math.round(P.x), y = Math.round(P.y);
  const step = P.moving ? Math.sin(P.walk) : 0, bob = P.moving ? Math.abs(Math.sin(P.walk))*1.5 : 0;
  ctx.fillStyle="rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(x,y-1,9,3.5,0,0,Math.PI*2); ctx.fill();
  const by = y - bob, side = P.dir==="left"||P.dir==="right";
  if(side){ rect(x-3+step*3,by-9,4,8,K.skin); rect(x-1-step*3,by-9,4,8,"#e0b693"); rect(x-4+step*3,by-2,5,2,K.shoe); rect(x-2-step*3,by-2,5,2,K.shoe); }
  else { rect(x-5,by-9-(step>0?1:0),4,8,K.skin); rect(x+1,by-9-(step<0?1:0),4,8,K.skin); rect(x-5,by-2,4,2,K.shoe); rect(x+1,by-2,4,2,K.shoe); }
  rect(x-7,by-13,14,5,K.skirt); rect(x-7,by-23,14,11,K.blazer);
  if(P.dir==="up") rect(x-6,by-23,12,10,K.bag);
  if(P.dir==="down"){ rect(x-2,by-23,4,7,"#e9e4ea"); rect(x-2,by-20,4,3,K.ribbon); }
  const sw = P.moving ? step*2 : 0;
  if(P.dir!=="left") rect(x+6,by-22+sw,3,9,K.blazer);
  if(P.dir!=="right") rect(x-9,by-22-sw,3,9,K.blazer);
  const hy = by-33;
  ctx.fillStyle=K.hair; ctx.beginPath(); ctx.arc(x,hy,9,0,Math.PI*2); ctx.fill(); rect(x-9,hy,18,9,K.hair);
  if(P.dir==="down"){ ctx.fillStyle=K.skin; ctx.beginPath(); ctx.arc(x,hy+2,7,0,Math.PI*2); ctx.fill(); rect(x-8,hy-6,16,5,K.hair); rect(x-3,hy+2,2,2,"#241a18"); rect(x+2,hy+2,2,2,"#241a18"); }
  if(P.dir==="left"){ ctx.fillStyle=K.skin; ctx.beginPath(); ctx.arc(x-3,hy+2,6,0,Math.PI*2); ctx.fill(); rect(x-8,hy-6,14,5,K.hair); rect(x-6,hy+1,2,2,"#241a18"); }
  if(P.dir==="right"){ ctx.fillStyle=K.skin; ctx.beginPath(); ctx.arc(x+3,hy+2,6,0,Math.PI*2); ctx.fill(); rect(x-6,hy-6,14,5,K.hair); rect(x+4,hy+1,2,2,"#241a18"); }
  // 손전등
  const [dx,dy] = DIRV[P.dir]; rect(x+dx*9-2, by-18+dy*4, 4, 4, "#ddd");
}

/* 귀신: 다음 교실 문 앞(복도) 또는 교실 구석에 떠 있음 */
function ghostPos(){
  if(S.escaped) return null;
  if(SC.hall){
    const n = nextRequired();
    if(!n){ const st = SC.objs.find(o => o.kind==="stairE"); return st ? [(st.door[0]+2)*T, (st.door[1]+1)*T] : null; }
    const o = SC.objs.find(o => o.room === n);
    if(o) return [o.door[0]*T+T/2+26, (o.door[1]+1)*T+6];
    if(SC.id==="F4"){ const st = SC.objs.find(o => o.kind==="stairC"); return [st.door[0]*T-20, (st.door[1]-1)*T+10]; }
    return null;
  }
  if(ROOMS[SC.room].kind==="class" && !isCleared(SC.room)) return [16*T, 3*T+10];
  return null;
}
function drawGhost(t){
  const g = ghostPos(); if(!g) return;
  const x = g[0], y = g[1] + Math.sin(t*2)*4, a = 0.55 + Math.sin(t*5)*0.08;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(185,200,255,.25)"; ctx.beginPath(); ctx.ellipse(x, y+14, 14, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#dfe6ff";
  ctx.beginPath(); ctx.moveTo(x-11,y-6); ctx.quadraticCurveTo(x-12,y-30,x,y-31); ctx.quadraticCurveTo(x+12,y-30,x+11,y-6);
  for(let i=0;i<4;i++){ const xx = x+11-i*7.3; ctx.quadraticCurveTo(xx-2, y+6+Math.sin(t*6+i)*3, xx-3.6, y-2); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#3a3f5c"; ctx.beginPath(); ctx.arc(x,y-24,10,Math.PI,0); ctx.fill(); rect(x-10,y-24,4,14,"#3a3f5c"); rect(x+6,y-24,4,14,"#3a3f5c");
  ctx.strokeStyle = "#3a3f5c"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x-4,y-18,2.2,Math.PI*0.1,Math.PI*0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(x+4,y-18,2.2,Math.PI*0.1,Math.PI*0.9); ctx.stroke();
  rect(x-5,y-12,10,8,"#f2f2f6"); rect(x-5,y-12,10,2,"#7a8bbf"); // 옛날 출석부
  ctx.restore();
}

function drawLabel(){
  if(!near) return;
  const label = actText(near);
  ctx.font = "bold 11px 'Gowun Dodum',sans-serif";
  const w = ctx.measureText(label).width + 16;
  const x = Math.min(camX+VW-w-4, Math.max(camX+4, P.x - w/2)), y = P.y - 60;
  ctx.fillStyle = "rgba(7,8,12,.88)"; ctx.fillRect(x,y,w,18);
  ctx.strokeStyle = "#f2d27a"; ctx.lineWidth = 1; ctx.strokeRect(x+.5,y+.5,w-1,17);
  text(label, x+w/2, y+13, 11, "#e9e6dc");
}
function drawPath(){ if(!path) return; ctx.fillStyle="rgba(242,210,122,.5)"; for(const [c,r] of path){ ctx.beginPath(); ctx.arc(c*T+T/2,r*T+T/2+6,2,0,Math.PI*2); ctx.fill(); } }

let flicker = 0;
function drawFog(t){
  const dark = SC.hall ? .8 : .6;
  fx.globalCompositeOperation = "source-over";
  fx.clearRect(0,0,VW,VH);
  fx.fillStyle = `rgba(4,5,12,${Math.min(.95, dark + flicker)})`; fx.fillRect(0,0,VW,VH);
  fx.globalCompositeOperation = "destination-out";
  const px = P.x - camX, py = P.y - 18, [dx,dy] = DIRV[P.dir];
  const hole = (x,y,r0,r1,a=1) => { const g = fx.createRadialGradient(x,y,r0,x,y,r1); g.addColorStop(0,`rgba(0,0,0,${a})`); g.addColorStop(1,"rgba(0,0,0,0)"); fx.fillStyle=g; fx.beginPath(); fx.arc(x,y,r1,0,Math.PI*2); fx.fill(); };
  hole(px, py, 10, 70);
  hole(px+dx*70, py+dy*60, 20, 120, .95);
  if(!SC.hall){ for(const r of [3,6,8]) hole(T/2 - camX, r*T+T/2, 4, 60, .5); }
  for(const o of SC.objs){
    if(o.kind==="stairC" || (o.kind==="stairE" && o.exit)) hole(o.door[0]*T+T/2-camX, o.door[1]*T+T/2, 4, 46, .7);
    if(o.kind==="station" || (o.kind==="room" && o.room===nextRequired())){ const dc = o.door||[o.c+o.w/2, o.r+o.h/2]; hole(dc[0]*T+T/2-camX, dc[1]*T, 2, 26, .45); }
  }
  const g = ghostPos(); if(g) hole(g[0]-camX, g[1]-12, 4, 44, .8);
  fx.globalCompositeOperation = "source-over";
  ctx.drawImage(fog, camX, 0, VW, VH);
  if(flicker > 0) flicker = Math.max(0, flicker - 0.012);
}

function draw(t){
  const worldW = SC.cols*T;
  camX = Math.max(0, Math.min(worldW - VW, P.x - VW/2));
  ctx.save(); ctx.setTransform(2,0,0,2,0,0); ctx.clearRect(0,0,VW,VH); ctx.translate(-camX,0);
  if(SC.hall) drawHall(t);
  else {
    drawRoomBase();
    drawPath();
    const items = SC.objs.filter(o => o.draw).map(o => ({y:(o.r+o.h)*T, f:() => drawProp(o,t)}));
    items.push({y:P.y, f:drawPlayer});
    items.sort((a,b)=>a.y-b.y).forEach(i => i.f());
  }
  if(SC.hall){ drawPath(); drawPlayer(); }
  drawGhost(t);
  drawFog(t);
  drawLabel();
  ctx.restore();
}

/* ------------------------------------------------------------------
   7. 루프와 입력
   ------------------------------------------------------------------ */
let last = performance.now();
function loop(now){
  const dt = Math.min(.05, (now-last)/1000); last = now;
  const paused = !$("#overlay").hidden;
  let dx=0, dy=0;
  if(!paused){
    if(keys.left) dx--; if(keys.right) dx++; if(keys.up) dy--; if(keys.down) dy++;
    if(dx||dy){ path = null; pathGoal = null; }
    else if(path){
      if(!path.length){ path = null; if(pathGoal){ P.dir = pathGoal.face; const g = pathGoal; pathGoal = null; if(g.open) setTimeout(() => interact(g.o), 120); } }
      else { const [c,r] = path[0], tx=c*T+T/2, ty=r*T+T-4, ex=tx-P.x, ey=ty-P.y, d=Math.hypot(ex,ey);
        if(d<2){ P.x=tx; P.y=ty; path.shift(); } else { dx=ex/d; dy=ey/d; } }
    }
  }
  P.moving = !!(dx||dy);
  if(P.moving){
    if(Math.abs(dx)>Math.abs(dy)) P.dir = dx>0?"right":"left"; else P.dir = dy>0?"down":"up";
    const len = Math.hypot(dx,dy), step = 120*dt; tryMove(dx/len*step, dy/len*step); P.walk += dt*8;
  }
  const n = findNear(); if(n !== near){ near = n; const b = $("#actBtn"); b.disabled = !n; b.textContent = actText(n); }
  draw(now/1000);
  requestAnimationFrame(loop);
}
const KEYMAP = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right", w:"up", s:"down", a:"left", d:"right", W:"up", S:"down", A:"left", D:"right" };
document.addEventListener("keydown", e => {
  if(!$("#overlay").hidden){ if(e.key==="Escape" && S.started) hide(); return; }
  if(/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if(KEYMAP[e.key]){ keys[KEYMAP[e.key]] = true; e.preventDefault(); hideTalkSoon(); }
  else if(["e","E","Enter"," "].includes(e.key) && document.activeElement === cv){ e.preventDefault(); interact(); }
});
document.addEventListener("keyup", e => { if(KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });
window.addEventListener("blur", () => Object.keys(keys).forEach(k => keys[k] = false));
cv.addEventListener("pointerdown", e => {
  const r = cv.getBoundingClientRect();
  const x = (e.clientX-r.left)/r.width*VW + camX, y = (e.clientY-r.top)/r.height*VH;
  const c = Math.floor(x/T), rr = Math.floor(y/T);
  const o = objAt(c, rr) || SC.objs.find(o => o.kind!=="deco" && o.w && c>=o.c && c<o.c+o.w && rr>=o.r && rr<o.r+o.h);
  if(o) return walkTo(o, true);
  if(solidAt(c,rr)) return;
  const res = route((cc,r2) => cc===c && r2===rr ? "stay" : null); if(res){ path = res.trail; pathGoal = null; }
});
document.querySelectorAll("#pad button").forEach(b => {
  const d = b.dataset.dir;
  b.addEventListener("pointerdown", e => { e.preventDefault(); keys[d] = true; b.setPointerCapture(e.pointerId); });
  ["pointerup","pointercancel","lostpointercapture"].forEach(ev => b.addEventListener(ev, () => keys[d] = false));
});
$("#actBtn").onclick = () => interact();

/* ------------------------------------------------------------------
   8. 말풍선 · 수첩
   ------------------------------------------------------------------ */
let talkTimer = null;
function talk(msg, who="야자 귀신"){
  $("#talk .who").textContent = who; $("#talkText").textContent = msg; $("#talk").hidden = false;
  clearTimeout(talkTimer); talkTimer = setTimeout(() => $("#talk").hidden = true, Math.max(4000, msg.length*110));
}
function hideTalkSoon(){ /* 움직이기 시작해도 말풍선은 시간이 지나면 사라짐 */ }
$("#talkX").onclick = () => { $("#talk").hidden = true; cv.focus({preventScroll:true}); };

function renderSide(){
  const n = CHAIN.filter(isCleared).length, nx = nextRequired();
  $("#stRooms").textContent = `${n}/${CHAIN.length}`;
  $("#stCharm").textContent = S.charms;
  $("#teacherBadge").hidden = !TEACHER;
  $("#route").innerHTML = CHAIN.map((id,i) => {
    const cls = isCleared(id) ? "done" : id===nx ? "next" : "lock";
    const fl = ["c22","c21"].includes(id) ? "3층" : "4층";
    return `<li class="${cls}"><i>${isCleared(id)?"✓":id===nx?"▶":"·"}</i><span>${ROOMS[id].name} <small>${ROOMS[id].unit}</small></span><small>${fl}</small></li>`;
  }).join("") + `<li class="${S.escaped?"done":!nx?"next":"lock"}"><i>${S.escaped?"✓":!nx?"▶":"·"}</i><span>동편 계단 <small>학교 밖으로</small></span><small>3층</small></li>`;
  $("#charms").innerHTML = S.charms ? Array.from({length:S.charms},()=>`<span class="charm" title="부적"></span>`).join("") : `<span class="say" style="font-size:13px">아직 없어요</span>`;
  const sides = Object.keys(ROOMS).filter(k => ROOMS[k].kind !== "class");
  $("#log").innerHTML = `<span>스스로 푼 문제 ${S.qSelf} · 도움 받은 문제 ${S.qHelp}</span><span>귀신 웃음 ${S.wrong}번 · 부적 사용 ${S.used}장</span><span>둘러본 특별실·화장실 ${sides.filter(isCleared).length}/${sides.length}</span>`;
  renderPlaces();
}
function renderPlaces(){
  if(!SC) return;
  const list = SC.objs.filter(o => ["room","station","exit","stairC","stairE"].includes(o.kind) && !(o.kind==="stairE" && !o.exit));
  $("#places").innerHTML = list.map((o,i) => {
    let s = "";
    if(o.kind==="room") s = isCleared(o.room) ? "done" : !roomOpen(o.room) ? "lock" : o.room===nextRequired() ? "next" : "";
    if(o.kind==="station") s = S.solved[SC.room+"."+o.key] ? "done" : "next";
    const name = o.kind==="room" ? ROOMS[o.room].name : o.kind==="stairC" ? o.label : o.kind==="stairE" ? "동편 계단(탈출)" : o.label;
    return `<button data-i="${i}" data-s="${s}">${name}${s==="done"?" ✓":s==="lock"?" (잠김)":""}</button>`;
  }).join("");
  $("#places").querySelectorAll("button").forEach(b => b.onclick = () => { const o = list[+b.dataset.i]; if(TEACHER){ teleportTo(o); interact(o); } else walkTo(o, true); });
}

/* ------------------------------------------------------------------
   9. 문제 창
   ------------------------------------------------------------------ */
function show(html, after){ $("#sheet").innerHTML = html; $("#overlay").hidden = false; Object.keys(keys).forEach(k=>keys[k]=false); path=null; after && after(); const f = $("#sheet").querySelector("button"); f && f.focus(); }
function hide(){ $("#overlay").hidden = true; renderSide(); cv.focus({preventScroll:true}); }
$("#overlay").addEventListener("click", e => { if(e.target.id==="overlay" && S.started) hide(); });

function openStation(roomId, key){
  const R = ROOMS[roomId], st = R.stations[key], done = !!S.solved[roomId+"."+key];
  if(R.kind === "rest"){
    show(`<span class="eyebrow">${R.name}</span><h3>${st.name}</h3><div class="chalk" style="background:#2c3550;border-color:#8a93a8">${esc(st.note)}</div>
      ${done ? "" : `<div class="fb ok"><span class="tag">부적 1장을 얻었어요</span><span>문제를 풀 때 '부적 쓰기'를 누르면 틀린 보기 두 개가 지워져요.</span></div>`}
      <div class="btnrow"><button class="btn" id="ok">닫기</button></div>`, () => $("#ok").onclick = hide);
    if(!done){ S.solved[roomId+"."+key] = true; S.cleared[roomId] = true; S.charms++; save(); renderSide(); }
    return;
  }
  show(`<span class="eyebrow">${R.name} · ${R.unit}</span><h3>${st.name}</h3>
    <div class="chalk">${esc(st.note)}</div>
    <p class="say">${done ? "이미 푼 문제예요. 복습 삼아 다시 풀어 볼 수 있어요(기록에는 남지 않아요)." : `문제 ${st.qs.length}개를 모두 맞히면 이곳이 풀려요.`}</p>
    <div class="btnrow"><button class="btn" id="go">${done?"다시 풀기":"문제 풀기"}</button><button class="btn ghost" id="x">닫기</button></div>`,
    () => { $("#go").onclick = () => question(roomId, key, 0); $("#x").onclick = hide; });
}
function dots(i,n){ return `<div class="dots">${Array.from({length:n},(_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("")}</div>`; }

function question(roomId, key, i){
  const R = ROOMS[roomId], st = R.stations[key], q = st.qs[i], replay = !!S.solved[roomId+"."+key];
  const order = shuffle(q.opts.map((_,k)=>k));
  show(`${dots(i, st.qs.length)}<span class="eyebrow">${R.name} · ${st.name} · ${i+1}/${st.qs.length}</span>
    <div class="word">${q.w}</div><p class="ctx">${esc(q.ask)}</p>
    <div class="choices">${order.map(k=>`<button class="choice ${TEACHER&&k===0?"key":""}" data-k="${k}">${esc(q.opts[k])}</button>`).join("")}</div>
    <div id="fb"></div>
    <div class="btnrow" id="ctl"><button class="btn ghost" id="hintB">힌트 보기</button><button class="btn charmbtn" id="charmB" ${S.charms&&!replay?"":"disabled"}>부적 쓰기 (${S.charms})</button><button class="btn ghost" id="later">나중에 하기</button></div>`);
  let w = 0, helped = false, finished = false;
  $("#later").onclick = hide;
  $("#hintB").onclick = () => { helped = true; $("#fb").innerHTML = `<p class="hint">${esc(q.hint)}</p>`; };
  $("#charmB").onclick = () => {
    if(!S.charms) return; S.charms--; S.used++; save(); renderSide();
    const wrongs = shuffle([...document.querySelectorAll(".choice")].filter(b => +b.dataset.k !== 0 && !b.disabled)).slice(0,2);
    wrongs.forEach(b => { b.disabled = true; b.classList.add("gone"); });
    $("#charmB").disabled = true; $("#fb").innerHTML = `<p class="hint">부적이 타오르며 틀린 보기 두 개를 지웠어요.</p>`;
  };
  document.querySelectorAll(".choice").forEach(b => b.onclick = () => {
    if(finished) return;
    const k = +b.dataset.k;
    if(k === 0){
      finished = true; b.classList.add("right"); document.querySelectorAll(".choice").forEach(x => x.disabled = true);
      const h = helped || w >= 2;
      if(!replay){ h ? S.qHelp++ : S.qSelf++; save(); }
      $("#fb").innerHTML = `<div class="fb ok"><span class="tag">${h?"도움 받아 해결":"스스로 해결"}</span><span>${esc(q.why)}</span></div>`;
      const last = i+1 >= st.qs.length;
      $("#ctl").innerHTML = `<button class="btn" id="nx">${last?"끝내기":"다음 문제"}</button>`;
      $("#nx").onclick = () => last ? stationDone(roomId, key, replay) : question(roomId, key, i+1);
      $("#nx").focus();
    } else {
      w++; b.classList.add("wrong"); b.disabled = true;
      if(!replay){ S.wrong++; save(); flicker = .1; }
      const line = GHOST_WRONG[Math.floor(Math.random()*GHOST_WRONG.length)];
      $("#fb").innerHTML = `<div class="gline">${esc(line)}</div>${w>=2?`<p class="hint">${esc(q.hint)}</p>`:""}`;
    }
  });
}
function stationDone(roomId, key, replay){
  const R = ROOMS[roomId];
  if(!replay){ S.solved[roomId+"."+key] = true; }
  const allDone = Object.keys(R.stations).every(k => S.solved[roomId+"."+k]);
  let msg = "";
  if(!replay && allDone && !isCleared(roomId)){
    S.cleared[roomId] = true;
    if(R.kind === "class"){
      msg = roomId === "c27" ? STORY.floorDown : roomId === "c21" ? "…다 풀었네. 동편 계단 문이 열렸어. 교실을 나가서 복도 끝으로 가." : STORY.roomClear;
    } else { S.charms++; msg = `${R.name} 문제를 다 풀었어. 부적 한 장 가져가.`; }
  }
  save(); hide();
  if(msg) setTimeout(() => talk(msg), 200);
  else if(!replay){ const left = Object.keys(R.stations).filter(k => !S.solved[roomId+"."+k]).map(k => R.stations[k].name); if(left.length) setTimeout(() => talk(`남은 곳: ${left.join(", ")}`, "탈출 수첩"), 200); }
}

/* ------------------------------------------------------------------
   10. 시작 · 끝
   ------------------------------------------------------------------ */
function intro(){
  show(`<span class="eyebrow">밤 10시 · 본관 4층</span><h3>야자 탈출</h3>
    <div class="story">${STORY.intro.map(l=>`<p>${esc(l)}</p>`).join("")}</div>
    <p class="say">방향키나 WASD로 움직이고, E로 살펴요. 휴대폰에서는 화면 방향키를 쓰거나 가고 싶은 곳을 누르세요. 노란 <b>!</b>는 아직 풀지 않은 곳, 부적 표시(符)는 들러 볼 수 있는 특별실이에요.</p>
    <p class="say" style="font-size:14px">틀려도 실패하지 않아요. 힌트와 부적을 쓰면 끝까지 갈 수 있어요.</p>
    <div class="btnrow"><button class="btn hot" id="go">교실 둘러보기</button></div>`,
    () => $("#go").onclick = () => { S.started = true; S.t0 = Date.now(); S.met.c23 = true; save(); hide(); setTimeout(() => talk(STORY.ghostIntro), 300); });
}
function mmss(ms){ const s=Math.max(0,Math.floor(ms/1000)); return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }
function finish(){
  if(!S.escaped){ S.escaped = true; S.tEnd = Date.now(); save(); renderSide(); }
  const sides = Object.keys(ROOMS).filter(k => ROOMS[k].kind === "side");
  show(`<span class="eyebrow">밤 11시 · 교문 밖</span><h3>탈출 성공 — 집에 갈 수 있어요</h3>
    <div class="gline">${esc(STORY.outro)}</div>
    <div class="cert">
      <label>이름·번호 (저장하지 않아요)<input type="text" id="nm" placeholder="예: 2학년 3반 15번"></label>
      <dl>
        <dt>푼 교실</dt><dd>${CHAIN.filter(isCleared).map(id=>ROOMS[id].name).join(" → ")}</dd>
        <dt>들른 특별실</dt><dd>${sides.filter(isCleared).map(id=>ROOMS[id].name).join(", ") || "없음"}</dd>
        <dt>스스로 푼 문제</dt><dd>${S.qSelf}개</dd>
        <dt>도움 받은 문제</dt><dd>${S.qHelp}개</dd>
        <dt>귀신 웃음</dt><dd>${S.wrong}번</dd>
        <dt>부적 사용</dt><dd>${S.used}장</dd>
        <dt>걸린 시간</dt><dd>${mmss((S.tEnd||Date.now())-S.t0)}</dd>
      </dl>
      <label>돌아보기 한 줄 (채점하지 않아요)<textarea id="refl" placeholder="가장 헷갈렸던 문법 개념과 그 까닭">${esc(S.refl)}</textarea></label>
    </div>
    <p class="say" style="font-size:14px">이 화면을 캡처해 제출하세요. 못 들른 특별실은 다시 돌아가 풀어 볼 수 있어요.</p>
    <div class="btnrow"><button class="btn" id="ok">학교 다시 둘러보기</button></div>`,
    () => { $("#refl").oninput = e => { S.refl = e.target.value; save(); }; $("#ok").onclick = hide; });
}
$("#resetBtn").onclick = () => show(`<h3>처음부터 다시 할까요?</h3><p class="say">이 기기에 저장된 진행 기록이 모두 지워져요.</p>
  <div class="btnrow"><button class="btn hot" id="yes">기록 지우고 다시 시작</button><button class="btn ghost" id="no">취소</button></div>`,
  () => { $("#yes").onclick = () => { try{ localStorage.removeItem(KEY); }catch(e){} S = fresh(); enter("c23",[17,10],"up"); intro(); }; $("#no").onclick = hide; });

setInterval(() => { if(S.started) $("#stClock").textContent = mmss((S.escaped?S.tEnd:Date.now())-S.t0); if(S.started && $("#overlay").hidden) save(); }, 1000);
setInterval(() => { if(Math.random() < .25 && SC && SC.hall) flicker = .08; }, 6000);

/* 시작 */
enter(S.scene || "c23", null, S.dir);
if(S.px != null && !solidAt(Math.floor(S.px/T), Math.floor((S.py-5)/T))){ P.x = S.px; P.y = S.py; } else { P.x = 17*T+T/2; P.y = 10*T+T-4; if(SC.hall){ const r = SC.objs.find(o=>o.room===nextRequired()); if(r){ P.x=r.door[0]*T+T/2; P.y=(r.door[1]+1)*T+T-4; } } }
requestAnimationFrame(loop);
if(!S.started) intro();

/* 점검용 (자동 테스트) */
window.__yaja = { S:()=>S, enter, interact, scene:()=>SC, P, solveAll:(id)=>{ Object.keys(ROOMS[id].stations).forEach(k=>S.solved[id+"."+k]=true); S.cleared[id]=true; renderSide(); } };
})();
