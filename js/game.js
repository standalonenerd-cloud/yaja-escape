/* =====================================================================
   야자 탈출 — 게임 엔진
   그림은 assets 폴더에서 불러오고, 그림이 없으면 도형으로 대신 그립니다.
   ===================================================================== */
(() => {
const T = 32, VW = 640, VH = 384;
const TOUCH = matchMedia("(pointer: coarse)").matches;
const TEACHER = location.hash.replace("#","") === "teacher";
const KEY = "yaja-escape-v2";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle = a => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

/* 그림 불러오기 */
const IMG = {};
function loadImg(k, f){ const i = new Image(); i.src = "assets/" + f; IMG[k] = i; }
["char_player_down","char_player_up","char_player_left","char_player_right","char_ghost","obj_charm","obj_door","obj_door_locked","tile_hall_floor","tile_hall_wall","logo"].forEach(n => loadImg(n, n + ".png"));
["room_class","room_staff","room_art","room_nurse","room_counsel","room_safety","room_yewon","room_toilet","obj_stairs"].forEach(n => loadImg(n, n + ".jpg"));
const ready = k => IMG[k] && IMG[k].complete && IMG[k].naturalWidth > 0;

/* 방마다 쓰는 그림 */
const ROOM_IMG = { c21:"class", c22:"class", c23:"class", c24:"class", c25:"class", c26:"class", c27:"class",
  staff:"staff", art:"art", nurse:"nurse", counsel:"counsel", safety:"safety", yewon:"yewon", toilet3:"toilet", toilet4:"toilet" };

/* 교실 기물 [열,행,너비,높이,살폈을 때 문구] — 문제가 놓이지 않은 기물은 그냥 살펴볼 수 있음 */
const CLASS_FIXTURES = {
  board:   [5,1,8,1, "칠판 구석에 '야자 22:00까지'라고 적혀 있다."],
  desk:    [8,2,2,2, "교탁 위에 분필 상자가 놓여 있다."],
  locker:  [1,10,7,1,"사물함 문 하나가 덜 닫혀 있다."],
  notice:  [13,1,3,1,"게시판: '야간 자율 학습 22:00 종료. 마지막에 나가는 사람은 소등.'"],
  window:  [1,5,1,2, "창밖은 깜깜하다. 운동장 가로등만 깜빡인다."],
  clock:   [16,1,1,1,"시계가 밤 10시 정각에 멈춰 있다."],
  cleaner: [9,10,2,1,"청소도구함. 빗자루와 대걸레가 들어 있다."],
  charger: [16,6,1,2,"핸드폰 충전함. 내 휴대폰은 배터리가 1%다."],
  flag:    [3,1,2,1, "교실 앞 태극기. 바르게 걸려 있다."]
};

const FIX_NAME = { board:"칠판", desk:"교탁", locker:"사물함", notice:"게시판", window:"창문", clock:"시계", cleaner:"청소도구함", charger:"핸드폰 충전함", flag:"태극기" };

/* 방 그림(18×12칸)에 맞춘 배치
   floor: 걸을 수 있는 칸 [열,행,너비,높이] · exit: 문 · spawn: 들어왔을 때 서는 칸
   stations: 문제를 푸는 물건 · props: 살펴볼 수 있는 물건 [열,행,너비,높이,살폈을 때 문구] */
const DESK = "누군가 두고 간 문법 노트. 형광펜 자국이 빽빽하다.";
const LAYOUT = {
  class: { logo:[17,4], floor:[[2,2,15,8],[8,10,5,1]], exit:[14,10,1,1], spawn:[14,9], ghost:[15,3],
    stations:{},
    props:[] },
  staff: { logo:[0,6], floor:[[1,1,16,9],[1,10,11,1]], exit:[12,10,5,1], spawn:[14,9],
    stations:{ main:[11,4,3,3] },
    props:[[2,2,6,3,"선생님들 책상 위에 수행평가 채점지가 쌓여 있다."],[2,7,6,3,"모니터가 꺼져 있다. 화면에 네 얼굴이 비친다."],
      [9,1,8,1,"서류함. 맨 아래 칸이 조금 열려 있다."],[15,5,2,2,"복사기가 혼자 '위잉' 하고 한 장을 뱉는다. 백지다."]] },
  art: { logo:[17,7], floor:[[1,3,16,6],[1,9,11,2]], exit:[12,9,5,2], spawn:[14,8],
    stations:{ main:[7,3,4,4] },
    props:[[1,3,2,6,"물감 묻은 개수대. 물방울이 똑, 똑 떨어진다."],[1,2,6,1,"물감 병이 색깔별로 줄 서 있다."],
      [4,4,2,2,"이젤 위 그림 속 도형이 조금 움직인 것 같다."],[12,3,2,2,"별 그림. 아까보다 별이 하나 늘었다."],[4,7,2,2,"빨간 동그라미가 너를 보는 것 같다."],
      [12,6,2,2,"파란 별이 반짝인다."],[6,8,2,2,"뒤집어 놓은 캔버스."],[10,8,2,2,"뒤집어 놓은 캔버스. 뒷면에 손자국이 있다."],
      [15,4,2,3,"석고상. 아까는 분명 창문 쪽을 보고 있었는데…"]] },
  nurse: { logo:[7,1], floor:[[1,2,16,9]], exit:[17,7,1,4], spawn:[16,8],
    stations:{ main:[13,3,4,2] },
    props:[[1,2,5,3,"침대 커튼이 살짝 흔들린다. 바람은 없는데."],[1,6,5,5,"베개가 누가 방금 누웠던 것처럼 움푹하다."],
      [9,1,4,2,"약장 유리에 네 얼굴이 비친다. 뒤에… 아무도 없다."]] },
  counsel: { logo:[11,2], floor:[[1,3,16,8]], exit:[13,8,4,3], spawn:[14,7],
    stations:{ main:[6,4,4,3] },
    props:[[1,2,9,1,"대학 안내 책자가 빽빽하다. 한 권이 툭 떨어진다."],[1,3,1,8,"진로 안내 책자. 책장 맨 위에 먼지가 쌓였다."],
      [14,3,3,4,"화분 잎이 아주 천천히 고개를 돌린다."],[6,9,5,2,"상담용 소파. 앉으면 진로 고민이 저절로 떠오를 것 같다."]] },
  safety: { logo:[3,1], floor:[[2,2,14,9]], exit:[13,10,3,1], spawn:[14,9],
    stations:{ main:[5,1,8,1] },
    props:[[1,4,1,1,"소화기. 압력계 바늘이 초록색에 있다. 다행이다."],[1,6,1,1,"소화기가 하나 더 있다."],
      [13,1,2,1,"구급함. 반창고가 한 상자 가득하다."],[4,4,4,5,"안전 점검 서류가 가지런히 놓여 있다."]] },
  yewon: { logo:[16,1], floor:[[1,2,16,9]], exit:[13,11,3,1], spawn:[14,10],
    stations:{ main:[8,2,2,2] },
    props:[[3,1,12,1,"병풍 그림 속 학이 날개를 접는다."],[2,3,5,2,"방석이 가지런히 놓인 낮은 상. 바르게 앉아야 할 것 같다."],
      [2,6,5,2,"낮은 상 위에 찻잔 자국이 남아 있다."],[2,8,5,2,"방석 하나가 살짝 따뜻하다."],[11,4,5,2,"낮은 상. 다리를 모으고 앉아야 할 것 같다."],[11,7,5,2,"방석 위에 누군가 접어 둔 종이학이 있다."]] },
  toilet: { logo:[5,11], floor:[[1,2,16,9]], exit:[17,8,1,3], spawn:[16,9],
    stations:{ main:[2,2,7,1] },
    props:[[10,2,2,3,"칸이 비어 있다."],[12,2,3,3,"칸이 비어 있다."],[15,2,2,3,"맨 끝 칸. 안에서 '똑똑' 노크 소리가 난다. …못 들은 걸로 하자."]] }
};

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
  add(s,{kind:"stairE", label:"동편 계단", c:1,r:2,w:3,h:8, door:[3,5], to:"F3", toPos:[4,5]});
  [["c23",4],["c24",9],["c25",14],["c26",19],["c27",24]].forEach(([id,c]) => add(s,{kind:"room", room:id, c, r:1, w:5, h:4, door:[c+2,4], color:COLOR.class}));
  add(s,{kind:"room", room:"staff", c:29,r:1,w:5,h:4, door:[31,4], color:COLOR.class});
  add(s,{kind:"room", room:"toilet4", c:34,r:0,w:4,h:3, door:[35,2], color:COLOR.toilet});
  add(s,{kind:"room", room:"art", c:38,r:0,w:6,h:3, door:[40,2], color:COLOR.special});
  add(s,{kind:"locked", label:"컴퓨터활용실", c:29,r:7,w:8,h:4, door:[32,7]});
  add(s,{kind:"stairC", label:"중앙 계단", c:37,r:7,w:7,h:4, door:[40,7], to:"F3", toPos:[41,6]});
  add(s,{kind:"deco", label:"중원홀", c:38,r:4,w:0,h:0});
  add(s,{kind:"logo", label:"교표", c:14, r:7});
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
  add(s,{kind:"logo", label:"교표", c:15, r:7});
  return s;
}

/* 방 안 — 방 그림(18×12칸)과 LAYOUT 배치를 따름 */
function buildRoom(id){
  const R = ROOMS[id], key = ROOM_IMG[id], L = LAYOUT[key];
  const s = newScene(id, R.name, 18, 12, { room:id, img:"room_"+key, L,
    floor: ["c21","c22","nurse","counsel","safety","toilet3","yewon"].includes(id) ? "F3" : "F4" });
  L.floor.forEach(f => carve(s, ...f));
  add(s,{kind:"exit", label:"복도로 나가기", c:L.exit[0], r:L.exit[1], w:L.exit[2], h:L.exit[3]});
  for(const [k,rc] of Object.entries(L.stations)) if(R.stations[k]) add(s,{kind:"station", key:k, label:R.stations[k].name, c:rc[0], r:rc[1], w:rc[2], h:rc[3]});
  if(key === "class") [[3,4],[6,4],[10,4],[13,4],[3,6],[6,6],[10,6],[13,6],[3,8],[6,8],[10,8],[13,8]].forEach(([c,r], j) => add(s,{kind:"desk", j, label:"책상", c, r, w:2, h:1}));
  if(key === "class") for(const [fx, f] of Object.entries(CLASS_FIXTURES)){
    const k = Object.keys(R.stations).find(k => (R.stations[k].at || k) === fx);
    if(k) add(s,{kind:"station", key:k, fx, label:R.stations[k].name, c:f[0], r:f[1], w:f[2], h:f[3]});
    else add(s,{kind:"prop", fx, label:FIX_NAME[fx], say:f[4], c:f[0], r:f[1], w:f[2], h:f[3]});
  }
  L.props.forEach(p => add(s,{kind:"prop", c:p[0], r:p[1], w:p[2], h:p[3], say:p[4] || "특별한 건 없다."}));
  if(L.logo) add(s,{kind:"logo", label:"교표", c:L.logo[0], r:L.logo[1]});
  return s;
}

/* ------------------------------------------------------------------
   2. 상태
   ------------------------------------------------------------------ */
const fresh = () => ({ lore:0, quizUsed:0, riddle:{}, rtries:{}, logos:{}, started:false, t0:0, tEnd:0, scene:"c27", px:null, py:null, dir:"up",
  solved:{}, cleared:{}, charms:1, used:0, hidden:{}, qSelf:0, qHelp:0, wrong:0, escaped:false, refl:"", met:{} });
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
const allStations = id => Object.keys(ROOMS[id].stations).every(k => S.solved[id+"."+k]);
const riddlePending = id => ROOMS[id].kind === "class" && RIDDLES[id] && !S.riddle[id] && allStations(id) && !isCleared(id);
const nextRequired = () => CHAIN.find(id => !isCleared(id)) || null;
const stairDownOpen = () => TEACHER || isCleared("c23");
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
  if(!pos && SC.L) pos = SC.L.spawn;
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

const GHOST = { kind:"ghost", label:"야자 귀신" };
function ghostDist(){ const g = ghostPos(); return g ? Math.hypot(P.x - g[0], P.y - g[1]) : 1e9; }
function findNear(){
  if(ghostDist() < 58) return GHOST;
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
  if(o.kind === "ghost") return "귀신에게 말 걸기";
  if(o.kind === "room") return roomOpen(o.room) ? `${ROOMS[o.room].name} 들어가기` : `${ROOMS[o.room].name} · 잠김`;
  if(o.kind === "exit") return riddlePending(SC.room) && !TEACHER ? "문 자물쇠 풀기" : "복도로 나가기";
  if(o.kind === "logo") return "교표 살펴보기";
  if(o.kind === "desk") return "책상 살펴보기";
  if(o.kind === "stairC") return SC.id === "F4" ? "3층으로 내려가기" : "4층으로 올라가기";
  if(o.kind === "stairE") return o.exit ? "동편 계단으로 탈출" : (stairDownOpen() ? "동편 계단으로 3층 내려가기" : "동편 계단 · 잠김");
  if(o.kind === "locked") return `${o.label} · 출입 금지`;
  if(o.kind === "station") return `${o.label} 살피기`;
  return o.label ? `${o.label} 살펴보기` : "살펴보기";
}
function interact(o){
  o = o || near; if(!o) return;
  if(o.kind === "ghost") return openGhost();
  if(o.kind === "room"){
    if(!roomOpen(o.room)){
      const i = chainIdx(o.room);
      return talk(`${ROOMS[o.room].name} 문이 꿈쩍도 안 해. ${ROOMS[CHAIN[i-1]].name} 문제부터 풀어.`);
    }
    return enter(o.room, null, "up"), onEnterRoom(o.room);
  }
  if(o.kind === "exit"){
    const R = ROOMS[SC.room];
    if(R.kind === "class" && !isCleared(SC.room) && !TEACHER){
      if(riddlePending(SC.room)) return openRiddle(SC.room);
      return talk("어딜 가? 이 교실 문제를 다 풀기 전엔 문이 안 열려.");
    }
    const h = hallFor(SC.room);
    return enter(h.floor, [h.o.door[0], h.o.door[1]+1], "down");
  }
  if(o.kind === "stairC"){
    if(SC.id === "F4" && !stairDownOpen()) return talk("계단은 2-3반까지 다 풀어야 열려.");
    if(SC.id === "F4" && !S.met.floor3){ S.met.floor3 = true; setTimeout(() => talk(STORY.lastRoom), 400); }
    return enter(o.to, o.toPos, "up");
  }
  if(o.kind === "stairE"){
    if(!o.exit){
      if(!stairDownOpen()) return talk("동편 계단은 셔터가 내려와 있어. 2-3반까지 다 풀면 열어 줄게.");
      if(!S.met.floor3){ S.met.floor3 = true; setTimeout(() => talk(STORY.lastRoom), 400); }
      return enter(o.to, o.toPos, "down");
    }
    if(!exitOpen()) return talk("여기가 학교 밖으로 나가는 길이야. 하지만 2-1반을 풀기 전엔 안 열어 줘. 킥킥.");
    return finish();
  }
  if(o.kind === "locked") return talk(`${o.label}은 잠겨 있어. 배치도에서 흰 방은 못 들어가.`, "안내");
  if(o.kind === "station") return openStation(SC.room, o.key);
  if(o.kind === "prop") return talk(o.say || "특별한 건 없다.", "살펴보니");
  if(o.kind === "desk") return openDesk(o.j);
  if(o.kind === "logo"){
    const first = !S.logos[SC.id]; S.logos[SC.id] = true; save(); renderSide();
    const n = Object.keys(S.logos).length, tot = Object.keys(ROOMS).length + 2;
    const msg = RIDDLES[SC.id] ? `교표 뒷면에 작은 글씨가 있다. "${RIDDLES[SC.id].clue}"` : (LOGO_SAY[SC.id] || "충주예성여고 교표가 반짝인다.");
    return talk(first ? `${msg} (찾은 교표 ${n}/${tot})` : msg, "교표");
  }
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
let camX = 0, camY = 0, Z = 1, vw = VW, vh = VH;
/* 좁은 화면(휴대폰)에서는 캐릭터 주변을 확대해서 보여 줌 */
function updateZoom(){ const w = cv.getBoundingClientRect().width || 640; Z = w < 560 ? 1.6 : 1; vw = VW/Z; vh = VH/Z; }
window.addEventListener("resize", updateZoom);
const rect = (x,y,w,h,c) => { ctx.fillStyle = c; ctx.fillRect(x,y,w,h); };
const K = {
  wall:"#1b1e29", wallHi:"#262a3a", floorA:"#3a3d48", floorB:"#34374a", wood:"#6b4f38", woodDk:"#4e3826",
  chalk:"#2a4636", frame:"#7a5a3c", paper:"#eee6d4", ink:"#4b4339", metal:"#8a8fa0", skin:"#f2c9a5", hair:"#241a18",
  blazer:"#2e3a5e", skirt:"#3c3848", shoe:"#151218", ribbon:"#c9463c", bag:"#7a3b38"
};
function text(t,x,y,size,color,align="center",font="'Gowun Dodum',sans-serif"){ ctx.font=`bold ${size}px ${font}`; ctx.fillStyle=color; ctx.textAlign=align; ctx.fillText(t,x,y); ctx.textAlign="left"; }

function plate(label, cx, cy, size=12){
  ctx.font = `bold ${size}px 'Gowun Dodum',sans-serif`;
  const w = ctx.measureText(label).width + 12;
  ctx.fillStyle = "rgba(10,12,20,.78)"; ctx.fillRect(cx-w/2, cy-size+1, w, size+6);
  text(label, cx, cy+2, size, "#f3efe4");
}
/* 그림의 가운데를 잘라 칸에 꽉 차게 그림 */
function cover(img, x, y, w, h){
  const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(w/iw, h/ih);
  const sw = w/s, sh = h/s;
  ctx.drawImage(img, (iw-sw)/2, (ih-sh)/2, sw, sh, x, y, w, h);
}
function charmIcon(x, y){
  if(ready("obj_charm")){ const i = IMG.obj_charm, h = 28, w = i.naturalWidth*h/i.naturalHeight; ctx.drawImage(i, x-w/2, y-h/2, w, h); }
  else bubble(x, y, "符", "#e8d27a", "#b33a2d");
}

let POST = [];   // 어둠 위에 그릴 표시
function drawHall(t){
  const s = SC, fl = ready("tile_hall_floor"), wl = ready("tile_hall_wall");
  for(let r=0;r<s.rows;r++) for(let c=0;c<s.cols;c++){
    const x=c*T, y=r*T;
    if(s.grid[r][c] === "."){
      if(fl) ctx.drawImage(IMG.tile_hall_floor, x, y, T, T); else rect(x,y,T,T,(r+c)%2?K.floorA:K.floorB);
    } else {
      if(wl){ ctx.drawImage(IMG.tile_hall_wall, x, y, T, T); rect(x,y,T,T,"rgba(10,12,20,.35)"); } else rect(x,y,T,T,K.wall);
    }
  }
  // 복도 창문 쪽 달빛
  for(let c=4;c<s.cols-2;c+=3){ if(s.grid[6] && s.grid[6][c]===".") rect(c*T+6, 7*T-3, 20, 3, "rgba(170,190,255,.3)"); }
  const nxt = nextRequired();
  for(const o of s.objs){
    const x=o.c*T, y=o.r*T, w=o.w*T, h=o.h*T;
    if(o.kind === "deco"){ text(o.label, x, y, 11, "rgba(233,230,220,.4)"); continue; }
    if(o.kind === "room"){
      const open = roomOpen(o.room), done = isCleared(o.room), key = "room_" + ROOM_IMG[o.room];
      rect(x,y,w,h,o.color);
      if(ready(key)) cover(IMG[key], x+3, y+3, w-6, h-6); else rect(x+3,y+3,w-6,h-6, shade(o.color,.82));
      if(!open) rect(x+3,y+3,w-6,h-6,"rgba(8,10,18,.45)");
      plate(ROOMS[o.room].name, x+w/2, y+h/2, o.w>=5?13:11);
      drawDoor(o, open, done);
      if(done) POST.push(() => bubble(x+w-14, y+14, "✓", K.exit, "#08140d", 10));
      else if(o.room === nxt) POST.push(() => { glowRect(x,y,w,h,"#f2d27a",t,4); beacon(o.door[0]*T+T/2, o.door[1]*T - 4, "!", "#f2d27a", t, 13); });
      else if(ROOMS[o.room].kind !== "class" && open) POST.push(() => charmIcon(o.door[0]*T+T/2, o.door[1]*T - 8 + Math.sin(t*3+o.c)*2));
    } else if(o.kind === "locked"){
      rect(x,y,w,h,COLOR.white); rect(x+3,y+3,w-6,h-6,"#bdbdc2");
      ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
      ctx.strokeStyle = "rgba(160,60,50,.35)"; ctx.lineWidth = 5;
      for(let k=-h;k<w;k+=22){ ctx.beginPath(); ctx.moveTo(x+k,y+h); ctx.lineTo(x+k+h,y); ctx.stroke(); }
      ctx.restore();
      plate(o.label + " · 출입 금지", x+w/2, y+h/2, 11);
      drawDoor(o, false, false, true);
    } else if(o.kind === "stairC" || o.kind === "stairE"){
      if(ready("obj_stairs")){
        if(o.kind === "stairE") ctx.drawImage(IMG.obj_stairs, x, y, w, h);
        else { ctx.save(); ctx.translate(x+w/2, y+h/2); ctx.rotate(Math.PI/2); ctx.drawImage(IMG.obj_stairs, -h/2, -w/2, h, w); ctx.restore(); }
        rect(x,y,w,h,"rgba(10,12,20,.25)");
      } else {
        rect(x,y,w,h,"#2c3040");
        for(let i=0;i<(o.kind==="stairE"?o.h:o.w);i++){ if(o.kind==="stairE") rect(x+3, y+i*T+4, w-6, 4, "#3d4256"); else rect(x+i*T+4, y+3, 4, h-6, "#3d4256"); }
      }
      const lab = o.kind === "stairE" ? (o.exit ? "동편 계단 (3F→2F)" : "동편 계단 (4F→3F)") : `중앙 계단 (${SC.id==="F4"?"4F→3F":"3F→4F"})`;
      if(o.kind === "stairE"){ ctx.save(); ctx.translate(x+w/2, y+h/2); ctx.rotate(-Math.PI/2); plate(lab,0,0,11); ctx.restore(); }
      else plate(lab, x+w/2, y+h-14, 11);
      const isExit = true;
      const lit = o.kind==="stairE" ? (o.exit ? exitOpen() : stairDownOpen()) : (SC.id==="F3" || stairDownOpen());
      if(isExit){ rect(o.door[0]*T+4, o.door[1]*T+(o.kind==="stairE"?2:18), 24, 10, lit ? K.exit : "#2b4a36"); text("EXIT", o.door[0]*T+16, o.door[1]*T+(o.kind==="stairE"?10:26), 7, lit?"#08140d":"#4e7a5c"); }
      if(o.kind==="stairE" && !o.exit && !stairDownOpen()){ ctx.fillStyle = "rgba(120,124,136,.85)"; for(let i=0;i<o.h;i++) ctx.fillRect(x+w-10, y+i*T+2, 8, T-4); }
      if(lit && ((o.kind==="stairE" && !o.exit && nxt==="c22") || (o.kind==="stairE" && o.exit && !nxt))) POST.push(() => { glowRect(x,y,w,h,K.exit,t,4); beacon(o.door[0]*T+T/2, o.door[1]*T + (o.kind==="stairE"?-2:-6), "!", K.exit, t, 13); });
    }
  }
  text(s.name, 5*T, 0.6*T, 12, "rgba(233,230,220,.6)", "left");
}
function drawDoor(o, open, done, sealed){
  const [dc,dr] = o.door, top = dr === o.r;
  const k = (sealed || !open) ? "obj_door_locked" : "obj_door";
  const cx = dc*T + T/2, ey = top ? o.r*T : (o.r+o.h)*T;
  if(ready(k)){
    const i = IMG[k], w = 46, h = i.naturalHeight*w/i.naturalWidth;
    ctx.drawImage(i, cx - w/2, ey - h/2, w, h);
  } else {
    rect(dc*T+4, ey-6, T-8, 8, open ? "#7a5634" : "#3a2d22");
  }
  if(done) rect(cx-12, ey + (top?-6:4), 24, 2, K.exit);
}
function shade(hex, k){ const n=parseInt(hex.slice(1),16); const r=(n>>16)*k|0, g=((n>>8)&255)*k|0, b=(n&255)*k|0; return `rgb(${r},${g},${b})`; }
function bubble(x,y,ch,bg,fg="#1a1608",r=7){
  ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle="rgba(10,12,20,.85)"; ctx.lineWidth=Math.max(1.5,r/6); ctx.stroke();
  text(ch,x,y+r*0.5,Math.round(r*1.35),fg);
}
/* 크게 깜빡이는 표시: 고리가 퍼져 나가 눈에 잘 띔 */
function beacon(x,y,ch,bg,t,r=12){
  const k = (t*1.2)%1;
  ctx.strokeStyle = bg; ctx.globalAlpha = 1-k; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x,y,r+k*14,0,Math.PI*2); ctx.stroke(); ctx.globalAlpha = 1;
  bubble(x, y + Math.sin(t*4)*2, ch, bg, "#1a1608", r);
}
function glowRect(x,y,w,h,color,t,width=3){
  ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.globalAlpha=.55+.35*Math.sin(t*4);
  ctx.setLineDash([8,5]); ctx.lineDashOffset=-t*20; ctx.strokeRect(x+1.5,y+1.5,w-3,h-3); ctx.restore();
}

function drawRoomBase(){
  const s = SC;
  if(ready(s.img)){ ctx.drawImage(IMG[s.img], 0, 0, s.cols*T, s.rows*T); drawFixtures(); return; }
  for(let r=0;r<s.rows;r++) for(let c=0;c<s.cols;c++) rect(c*T, r*T, T, T, s.grid[r][c]==="." ? ((r+c)%2 ? "#6e5440" : "#674e3b") : K.wall);
  for(const o of s.objs) if(o.kind !== "exit") rect(o.c*T+2, o.r*T+2, o.w*T-4, o.h*T-4, "#4e3826");
}
/* 그림에 없는 교실 기물을 직접 그림: 태극기 · 시계 · 청소도구함 · 핸드폰 충전함 */
function outline(w=1.6){ ctx.strokeStyle = "#1d1a1a"; ctx.lineWidth = w; }
function drawFixtures(){
  for(const o of SC.objs){
    const x = o.c*T, y = o.r*T, w = o.w*T, h = o.h*T;
    if(o.fx === "flag"){
      const fw = 40, fh = 27, fx = x + (w-fw)/2, fy = y + 2;
      rect(fx-3, fy-2, 2, fh+6, "#8a6a3c");
      ctx.fillStyle = "#fbfbf7"; ctx.fillRect(fx, fy, fw, fh); outline(1.4); ctx.strokeRect(fx, fy, fw, fh);
      const cx = fx + fw/2, cy = fy + fh/2, r = 6.5;
      ctx.fillStyle = "#cd2e3a"; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#0047a0"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI); ctx.fill();
      ctx.fillStyle = "#cd2e3a"; ctx.beginPath(); ctx.arc(cx - r/2, cy, r/2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#0047a0"; ctx.beginPath(); ctx.arc(cx + r/2, cy, r/2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#1d1a1a";
      for(const [dx,dy] of [[-12,-7],[12,-7],[-12,7],[12,7]]) for(let i=0;i<3;i++) ctx.fillRect(cx + dx - 3, cy + dy - 3 + i*2.2, 6, 1.4);
    } else if(o.fx === "clock"){
      const cx = x + w/2, cy = y + h/2 + 2;
      ctx.fillStyle = "#fbfbf7"; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI*2); ctx.fill(); outline(2.4); ctx.stroke();
      ctx.fillStyle = "#1d1a1a"; for(let i=0;i<12;i++){ const a = i*Math.PI/6; ctx.fillRect(cx + Math.cos(a)*8.5 - .7, cy + Math.sin(a)*8.5 - .7, 1.4, 1.4); }
      ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 4, cy - 2.3); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 8); ctx.stroke();
    } else if(o.fx === "cleaner"){
      const bx = x + 2, by = y - 6, bw = w - 4, bh = h + 4;
      ctx.fillStyle = "#7f93a8"; ctx.fillRect(bx, by, bw, bh); outline(1.8); ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = "#93a8bd"; ctx.fillRect(bx+3, by+3, bw/2-4, bh-6); ctx.fillRect(bx+bw/2+1, by+3, bw/2-4, bh-6);
      ctx.beginPath(); ctx.moveTo(bx+bw/2, by+2); ctx.lineTo(bx+bw/2, by+bh-2); ctx.stroke();
      rect(bx+bw/2-5, by+bh/2-3, 2, 6, "#e9e6dc"); rect(bx+bw/2+3, by+bh/2-3, 2, 6, "#e9e6dc");
      ctx.strokeStyle = "#a4733f"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx+bw-8, by+2); ctx.lineTo(bx+bw+2, by-12); ctx.stroke();
      ctx.fillStyle = "#d9c38a"; ctx.beginPath(); ctx.ellipse(bx+bw+4, by-15, 5, 3, -0.6, 0, Math.PI*2); ctx.fill();
    } else if(o.fx === "charger"){
      const bx = x + 3, by = y + 2, bw = w - 6, bh = h - 4;
      ctx.fillStyle = "#3b4150"; ctx.fillRect(bx, by, bw, bh); outline(1.8); ctx.strokeRect(bx, by, bw, bh);
      const cols = ["#d9534f","#4a7ac9","#f2d27a","#5aa36b","#9d6fb5","#e9e6dc"];
      for(let i=0;i<6;i++){ const py = by + 4 + i*(bh-8)/6;
        ctx.fillStyle = cols[i]; ctx.fillRect(bx+4, py, bw-12, (bh-8)/6 - 2);
        ctx.fillStyle = i%3===0 ? "#f2d27a" : "#4fd18b"; ctx.fillRect(bx+bw-6, py+2, 3, 3); }
    }
  }
}
function drawMarks(t){
  for(const o of SC.objs){
    if(o.kind !== "station") continue;
    const x = o.c*T, y = o.r*T, w = o.w*T, h = o.h*T, cx = x + (o.w >= 6 ? w*0.25 : w/2);
    const done = S.solved[SC.room+"."+o.key];
    if(done){ bubble(cx, y + 2, "✓", K.exit, "#08140d", 11); plate(o.label, cx, y + h/2 + 6, 11); }
    else { glowRect(x, y, w, h, "#f2d27a", t, 4); beacon(cx, y - 2, "!", "#f2d27a", t, 14); plate(o.label, cx, y + h/2 + 8, 12); }
  }
  const e = SC.objs.find(o => o.kind === "exit");
  if(e){ const open = ROOMS[SC.room].kind !== "class" || isCleared(SC.room) || TEACHER, rid = riddlePending(SC.room);
    const ex = (e.c+e.w/2)*T, ey = (e.r+e.h/2)*T;
    if(rid){ glowRect(e.c*T, e.r*T, e.w*T, e.h*T, "#b9c8ff", t, 4); beacon(ex, e.r*T - 4, "?", "#b9c8ff", t, 14); plate("수수께끼 자물쇠", ex, ey + 8, 12); }
    else { glowRect(e.c*T, e.r*T, e.w*T, e.h*T, open ? K.exit : "rgba(239,138,120,.9)", t, 3); plate(open ? "나가는 문" : "잠긴 문", ex, ey + 5, 11); } }
}
/* 교표: 벽에 걸린 둥근 학교 로고. 아직 못 찾은 교표는 반짝임 */
function drawLogos(t){
  for(const o of SC.objs){
    if(o.kind !== "logo") continue;
    const x = o.c*T + T/2, y = o.r*T + T/2, r = 15;
    ctx.fillStyle = "#3a2a20"; ctx.beginPath(); ctx.arc(x, y, r+2.5, 0, Math.PI*2); ctx.fill();
    if(ready("logo")){ ctx.imageSmoothingEnabled = true; ctx.drawImage(IMG.logo, x-r, y-r, r*2, r*2); ctx.imageSmoothingEnabled = false; }
    else { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); text("高", x, y+5, 13, "#7a1f2b"); }
    if(!S.logos[SC.id]) POST.push(() => {
      const k = (Math.sin(t*3)+1)/2;
      ctx.save(); ctx.globalAlpha = .35 + .5*k; ctx.strokeStyle = "#fff6d0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r+4, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = "#fff6d0"; const sx = x + r, sy = y - r;
      ctx.beginPath(); ctx.moveTo(sx, sy-6); ctx.lineTo(sx+1.5, sy-1.5); ctx.lineTo(sx+6, sy); ctx.lineTo(sx+1.5, sy+1.5); ctx.lineTo(sx, sy+6); ctx.lineTo(sx-1.5, sy+1.5); ctx.lineTo(sx-6, sy); ctx.lineTo(sx-1.5, sy-1.5); ctx.fill();
      ctx.restore();
    });
  }
}
/* 가까이 간 물건을 밝은 테두리로 감쌈 */
function drawNearRing(){
  if(!near || near.kind === "ghost") return;
  let x, y, w, h;
  if(near.door){ x = near.door[0]*T - 6; y = near.door[1]*T - 6; w = T + 12; h = T + 12; }
  else { x = near.c*T; y = near.r*T; w = near.w*T; h = near.h*T; }
  ctx.save(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.shadowColor = "#f2d27a"; ctx.shadowBlur = 12;
  ctx.strokeRect(x+1.5, y+1.5, w-3, h-3); ctx.restore();
}
/* 귀신 말풍선 */
function ghostLine(){
  if(SC.hall){
    const n = nextRequired();
    if(!n) return GHOST_NEAR.exit;
    if(SC.id === "F4" && ["c22","c21"].includes(n)) return GHOST_NEAR.stairs;
    return GHOST_NEAR.hall.replace("{room}", ROOMS[n].name);
  }
  if(riddlePending(SC.room)) return "이제 문에 걸린 수수께끼만 풀면 돼. 막히면 벽의 교표를 살펴봐.";
  const R = ROOMS[SC.room], left = Object.keys(R.stations).filter(k => !S.solved[SC.room+"."+k]).length;
  return GHOST_NEAR.room.replace("{left}", left);
}
function wrapText(str, maxW){
  const out = []; let line = "";
  for(const ch of str){ if(ctx.measureText(line + ch).width > maxW && line){ out.push(line); line = ch.trim() ? ch : ""; } else line += ch; }
  if(line) out.push(line); return out;
}
function drawSpeech(x, yTop, msg, sub){
  ctx.font = "bold 12px 'Gowun Dodum',sans-serif";
  const lines = wrapText(msg, 168), lh = 16, padX = 10;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width), sub ? 90 : 0) + padX*2;
  const h = lines.length*lh + (sub ? 20 : 0) + 12;
  let bx = Math.min(camX + vw - w - 6, Math.max(camX + 6, x - w/2)), by = Math.max(camY + 4, yTop - h - 10);
  ctx.save();
  ctx.fillStyle = "rgba(14,17,30,.95)"; ctx.strokeStyle = "#b9c8ff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by, w, h, 8); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x-6, by+h-1); ctx.lineTo(x+6, by+h-1); ctx.lineTo(x, by+h+8); ctx.closePath(); ctx.fill();
  ctx.restore();
  lines.forEach((l,i) => text(l, bx + w/2, by + 18 + i*lh, 12, "#dfe6ff"));
  if(sub){ ctx.fillStyle = "#f2d27a"; ctx.beginPath(); ctx.roundRect(bx + w/2 - 46, by + h - 22, 92, 16, 8); ctx.fill(); text(sub, bx + w/2, by + h - 10, 10, "#1a1608"); }
}

/* 주인공: 방향별 그림 한 장에 걸음 움직임(통통·뒤뚱·눌림)을 코드로 입힘 */
function drawPlayer(){
  const k = "char_player_" + P.dir;
  if(!ready(k)) return drawPlayerShape();
  const img = IMG[k], h = 56, w = img.naturalWidth*h/img.naturalHeight;
  const ph = P.walk, m = P.moving;
  const bob = m ? Math.abs(Math.sin(ph))*3.2 : Math.sin(performance.now()/450)*0.6;
  const tilt = m ? Math.sin(ph)*0.07 : 0;
  const sy = m ? 1 - Math.abs(Math.cos(ph))*0.05 : 1, sx = 2 - sy;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(P.x, P.y-1, 12 - bob*0.8, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.save(); ctx.translate(P.x, P.y - 1 - bob); ctx.rotate(tilt); ctx.scale(sx, sy);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(img, -w/2, -h, w, h); ctx.imageSmoothingEnabled = false;
  ctx.restore();
}
function drawPlayerShape(){
  const x = Math.round(P.x), y = Math.round(P.y);
  const step = P.moving ? Math.sin(P.walk) : 0, bob = P.moving ? Math.abs(Math.sin(P.walk))*1.5 : 0;
  ctx.fillStyle="rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(x,y-1,9,3.5,0,0,Math.PI*2); ctx.fill();
  const by = y - bob;
  rect(x-5,by-9,4,8,K.skin); rect(x+1,by-9,4,8,K.skin);
  rect(x-7,by-13,14,5,K.skirt); rect(x-7,by-23,14,11,K.blazer);
  ctx.fillStyle=K.hair; ctx.beginPath(); ctx.arc(x,by-33,9,0,Math.PI*2); ctx.fill(); rect(x-9,by-33,18,9,K.hair);
  if(step) rect(x+6,by-22,3,9,K.blazer);
}

/* 귀신: 다음 교실 문 앞(복도) 또는 교실 구석에 떠 있음 */
function ghostPos(){
  if(S.escaped) return null;
  if(SC.hall){
    const n = nextRequired();
    if(!n){ const st = SC.objs.find(o => o.kind==="stairE"); return st ? [(st.door[0]+2)*T, (st.door[1]+1)*T+10] : null; }
    const o = SC.objs.find(o => o.room === n);
    if(o) return [o.door[0]*T+T/2+30, (o.door[1]+1)*T+18];
    if(SC.id==="F4"){ const st = SC.objs.find(o => o.kind==="stairE"); return [(st.door[0]+2)*T, (st.door[1]+1)*T+10]; }
    return null;
  }
  if(ROOMS[SC.room].kind==="class" && !isCleared(SC.room) && SC.L.ghost) return [SC.L.ghost[0]*T+T/2, SC.L.ghost[1]*T+T];
  return null;
}
function drawGhost(t){
  const g = ghostPos(); if(!g) return;
  const x = g[0], y = g[1] + Math.sin(t*2)*4;
  if(ready("char_ghost")){
    const i = IMG.char_ghost, h = 60, w = i.naturalWidth*h/i.naturalHeight;
    ctx.save(); ctx.globalAlpha = 0.78 + Math.sin(t*5)*0.08;
    ctx.fillStyle = "rgba(185,200,255,.22)"; ctx.beginPath(); ctx.ellipse(x, g[1]+6, 16, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowColor = "rgba(185,200,255,.9)"; ctx.shadowBlur = 14;
    ctx.translate(x, y); ctx.rotate(Math.sin(t*1.6)*0.05);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(i, -w/2, -h, w, h); ctx.imageSmoothingEnabled = false;
    ctx.restore();
    const d = ghostDist();
    if(d < 120) drawSpeech(x, y - h, ghostLine(), d < 58 ? (TOUCH ? "눌러서 말 걸기" : "E · 말 걸기") : null);
    return;
  }
  ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = "#dfe6ff";
  ctx.beginPath(); ctx.arc(x, y-20, 11, Math.PI, 0); ctx.lineTo(x+11, y); ctx.lineTo(x-11, y); ctx.fill(); ctx.restore();
}

function drawLabel(){
  if(!near) return;
  const label = actText(near);
  if(near.kind === "ghost") return;
  ctx.font = "bold 13px 'Gowun Dodum',sans-serif";
  const w = ctx.measureText(label).width + 30;
  const x = Math.min(camX+vw-w-4, Math.max(camX+4, P.x - w/2)), y = Math.max(camY+4, P.y - 86);
  ctx.fillStyle = "rgba(7,8,12,.92)"; ctx.beginPath(); ctx.roundRect(x,y,w,22,6); ctx.fill();
  ctx.strokeStyle = "#f2d27a"; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#f2d27a"; ctx.beginPath(); ctx.roundRect(x+5,y+4,14,14,3); ctx.fill();
  text(TOUCH ? "▶" : "E", x+12, y+15, 10, "#1a1608");
  text(label, x+w/2+8, y+16, 13, "#f3efe4");
}
function drawPath(){ if(!path) return; ctx.fillStyle="rgba(242,210,122,.6)"; for(const [c,r] of path){ ctx.beginPath(); ctx.arc(c*T+T/2,r*T+T/2+6,2,0,Math.PI*2); ctx.fill(); } }

let flicker = 0;
function drawFog(t){
  const dark = SC.hall ? .78 : .55;
  fx.setTransform(2*Z,0,0,2*Z,0,0);
  fx.globalCompositeOperation = "source-over";
  fx.clearRect(0,0,vw,vh);
  fx.fillStyle = `rgba(4,5,12,${Math.min(.95, dark + flicker)})`; fx.fillRect(0,0,vw,vh);
  fx.globalCompositeOperation = "destination-out";
  const px = P.x - camX, py = P.y - 22 - camY, [dx,dy] = DIRV[P.dir];
  const hole = (x,y,r0,r1,a=1) => { const g = fx.createRadialGradient(x,y,r0,x,y,r1); g.addColorStop(0,`rgba(0,0,0,${a})`); g.addColorStop(1,"rgba(0,0,0,0)"); fx.fillStyle=g; fx.beginPath(); fx.arc(x,y,r1,0,Math.PI*2); fx.fill(); };
  hole(px, py, 12, 78);
  hole(px+dx*76, py+dy*64, 24, 130, .95);
  for(const o of SC.objs){
    if(o.kind==="stairC" || o.kind==="stairE") hole(o.door[0]*T+T/2-camX, o.door[1]*T+T/2-camY, 4, 46, .7);
    if(o.kind==="station" || o.kind==="exit" || (o.kind==="room" && o.room===nextRequired())){ const dc = o.door||[o.c+o.w/2-.5, o.r+o.h/2]; hole(dc[0]*T+T/2-camX, dc[1]*T-camY, 4, 52, .62); }
  }
  const g = ghostPos(); if(g) hole(g[0]-camX, g[1]-24-camY, 4, 50, .85);
  fx.globalCompositeOperation = "source-over";
  ctx.drawImage(fog, 0, 0, vw*2*Z, vh*2*Z, camX, camY, vw, vh);
  if(flicker > 0) flicker = Math.max(0, flicker - 0.012);
}

function draw(t){
  const worldW = SC.cols*T, worldH = SC.rows*T;
  camX = worldW <= vw ? (worldW - vw)/2 : Math.max(0, Math.min(worldW - vw, P.x - vw/2));
  camY = worldH <= vh ? (worldH - vh)/2 : Math.max(0, Math.min(worldH - vh, P.y - 24 - vh/2));
  ctx.save(); ctx.setTransform(2*Z,0,0,2*Z,0,0); ctx.fillStyle = "#07080c"; ctx.fillRect(0,0,vw,vh); ctx.translate(-camX,-camY);
  POST = [];
  if(SC.hall) drawHall(t); else drawRoomBase();
  drawLogos(t);
  drawPath(); drawPlayer();
  drawFog(t);
  if(!SC.hall) drawMarks(t);
  POST.forEach(f => f());
  drawNearRing();
  drawGhost(t);
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
    const len = Math.hypot(dx,dy), step = 120*dt; tryMove(dx/len*step, dy/len*step); P.walk += dt*10;
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
  const x = (e.clientX-r.left)/r.width*vw + camX, y = (e.clientY-r.top)/r.height*vh + camY;
  const c = Math.floor(x/T), rr = Math.floor(y/T);
  const g = ghostPos();
  if(g && Math.abs(x - g[0]) < 24 && y > g[1] - 64 && y < g[1] + 8){
    if(ghostDist() < 58) return openGhost();
    const gc = Math.floor(g[0]/T), gr = Math.floor((g[1]-4)/T);
    const res = route((cc,r2) => Math.abs(cc-gc) + Math.abs(r2-gr) <= 1 ? "stay" : null);
    if(res){ path = res.trail; pathGoal = { face:P.dir, o:GHOST, open:true }; }
    return;
  }
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
  if($("#hud")) $("#hud").innerHTML = `<img src="assets/obj_charm.png" alt="">×${S.charms}`;
  $("#teacherBadge").hidden = !TEACHER;
  $("#route").innerHTML = CHAIN.map((id,i) => {
    const cls = isCleared(id) ? "done" : id===nx ? "next" : "lock";
    const fl = ["c22","c21"].includes(id) ? "3층" : "4층";
    return `<li class="${cls}"><i>${isCleared(id)?"✓":id===nx?"▶":"·"}</i><span>${ROOMS[id].name} <small>${ROOMS[id].unit}</small></span><small>${fl}</small></li>`;
  }).join("") + `<li class="${S.escaped?"done":!nx?"next":"lock"}"><i>${S.escaped?"✓":!nx?"▶":"·"}</i><span>동편 계단 <small>학교 밖으로</small></span><small>3층</small></li>`;
  $("#charms").innerHTML = S.charms ? Array.from({length:S.charms},()=>`<span class="charm" title="부적"></span>`).join("") : `<span class="say" style="font-size:13px">아직 없어요</span>`;
  const sides = Object.keys(ROOMS).filter(k => ROOMS[k].kind !== "class");
  $("#log").innerHTML = `<span>스스로 푼 문제 ${S.qSelf} · 도움 받은 문제 ${S.qHelp}</span><span>귀신 웃음 ${S.wrong}번 · 부적 사용 ${S.used}장</span><span>둘러본 특별실·화장실 ${sides.filter(isCleared).length}/${sides.length}</span><span>찾은 교표 ${Object.keys(S.logos).length}/${Object.keys(ROOMS).length + 2}</span>`;
  renderPlaces();
}
function renderPlaces(){
  if(!SC) return;
  const list = SC.objs.filter(o => ["room","station","exit","stairC","stairE"].includes(o.kind));
  $("#places").innerHTML = list.map((o,i) => {
    let s = "";
    if(o.kind==="room") s = isCleared(o.room) ? "done" : !roomOpen(o.room) ? "lock" : o.room===nextRequired() ? "next" : "";
    if(o.kind==="station") s = S.solved[SC.room+"."+o.key] ? "done" : "next";
    const name = o.kind==="room" ? ROOMS[o.room].name : o.kind==="stairC" ? o.label : o.kind==="stairE" ? (o.exit ? "동편 계단(탈출)" : "동편 계단(3층으로)") : o.label;
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

/* 귀신과 이야기하기: 길 안내 · 귀신 이야기 · 복습 문제(맞히면 부적) */
function ghostGuide(){
  const n = nextRequired();
  if(!n) return "2-1반까지 다 풀었잖아! 3층 복도 왼쪽 끝 동편 계단으로 가. 문 열어 놨어.";
  if(!SC.hall && SC.room === n && riddlePending(n)) return `문에 걸린 자물쇠 수수께끼가 남았어. "${RIDDLES[n].clue}" …이건 교표 뒷면에 적힌 말이야.`;
  if(!SC.hall && SC.room === n){
    const left = Object.keys(ROOMS[n].stations).filter(k => !S.solved[n+"."+k]).map(k => ROOMS[n].stations[k].name);
    return `이 교실에서 ${left.join(", ")} 문제가 남았어. 노란 테두리가 깜빡이는 곳을 찾아봐.`;
  }
  const fl = ["c22","c21"].includes(n) ? "3층" : "4층";
  const where = (SC.id === "F4" && fl === "3층") ? " 복도 왼쪽 끝 동편 계단으로 내려가면 돼." : "";
  return `다음은 ${fl} ${ROOMS[n].name}(${ROOMS[n].unit})야.${where} 문 위에 ! 표시가 뜬 교실로 들어와.`;
}
function openGhost(){
  const lines = ["왔구나. 뭐가 궁금해?", "킥킥, 나한테 말을 거는 애는 처음이야.", "무서워? 문제만 풀면 아무 일도 없어."];
  show(`<div class="ghostbox"><img src="assets/char_ghost.png" alt="야자 귀신" class="gface"><div><span class="eyebrow">야자 귀신</span><p class="gsay" id="gsay">${esc(lines[Math.floor(Math.random()*lines.length)])}</p></div></div>
    <div class="gopts" id="gopts">
      <button class="btn ghost" id="g1">어디로 가야 해?</button>
      <button class="btn ghost" id="g2">너는 누구야?</button>
      <button class="btn ghost" id="g3">복습 문제 내 줘 (맞히면 부적)</button>
      <button class="btn" id="gx">그만 이야기하기</button>
    </div><div id="gquiz"></div>`,
  () => {
    const say = m => { $("#gsay").textContent = m; };
    $("#g1").onclick = () => say(ghostGuide());
    $("#g2").onclick = () => { say(GHOST_LORE[S.lore % GHOST_LORE.length]); S.lore++; save(); };
    $("#g3").onclick = () => ghostQuiz(say);
    $("#gx").onclick = hide;
  });
}
function ghostQuiz(say){
  const earned = CHAIN.filter(isCleared).length;
  const pool = [];
  for(const [rid,R] of Object.entries(ROOMS)) for(const [k,st] of Object.entries(R.stations)) if(S.solved[rid+"."+k]) (st.qs || []).forEach(q => pool.push(q));
  if(!pool.length) return say("아직 푼 문제가 없잖아. 칠판 문제부터 풀고 와.");
  if(S.quizUsed >= earned && !TEACHER) return say("부적은 교실을 하나 풀 때마다 한 장씩만 줄 수 있어. 다음 교실을 풀고 와.");
  const q = pool[Math.floor(Math.random()*pool.length)], order = shuffle(q.opts.map((_,k)=>k));
  say("좋아, 아까 푼 거야. 기억나? 한 번에 맞혀야 부적을 줄 거야.");
  $("#gopts").hidden = true;
  $("#gquiz").innerHTML = `<div class="word">${q.w}</div><p class="ctx">${esc(q.ask)}</p>
    <div class="choices">${order.map(k=>`<button class="choice ${TEACHER&&k===0?"key":""}" data-k="${k}">${esc(q.opts[k])}</button>`).join("")}</div><div id="gfb"></div>`;
  document.querySelectorAll("#gquiz .choice").forEach(b => b.onclick = () => {
    const ok = +b.dataset.k === 0;
    document.querySelectorAll("#gquiz .choice").forEach(x => { x.disabled = true; if(+x.dataset.k === 0) x.classList.add("right"); });
    if(!ok) b.classList.add("wrong");
    if(!TEACHER){ S.quizUsed++; if(ok) S.charms++; save(); renderSide(); }
    say(ok ? "오, 제법인데? 부적 한 장 줄게." : "땡! 이번엔 부적 없어. 다음 교실 풀고 다시 와.");
    $("#gfb").innerHTML = `<div class="fb ${ok?"ok":"no"}"><span>${esc(q.why)}</span></div><div class="btnrow"><button class="btn" id="gdone">고마워</button></div>`;
    $("#gdone").onclick = hide; $("#gdone").focus();
  });
}
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
    <p class="say">${done ? "이미 푼 문제예요. 복습 삼아 다시 풀어 볼 수 있어요(기록에는 남지 않아요)." : (st.mode === "match" ? `짝 지우기: ${esc(st.rule)}. 패를 모두 지우면 이곳이 풀려요.` : st.mode === "type" ? `받아쓰기: 낱말 ${st.items.length}개를 직접 적으면 이곳이 풀려요.` : `문제 ${st.qs.length}개를 모두 맞히면 이곳이 풀려요.`)}</p>
    <div class="btnrow"><button class="btn" id="go">${done?"다시 풀기":"문제 풀기"}</button><button class="btn ghost" id="x">닫기</button></div>`,
    () => { $("#go").onclick = () => st.mode === "match" ? matchGame(roomId, key) : st.mode === "type" ? typeGame(roomId, key, 0, 0) : question(roomId, key, 0); $("#x").onclick = hide; });
}
function dots(i,n){ return `<div class="dots">${Array.from({length:n},(_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("")}</div>`; }

/* ---------- 부적: 힌트를 보는 아이템 ---------- */
const NO_CHARM = "부적이 없어요. 교실 책상을 살펴 숨은 OX 게임에서 얻을 수 있어요. (세 번 틀리면 귀신이 힌트를 흘려 주기도 해요)";
function useCharm(replay){ if(replay || TEACHER) return "free"; if(S.charms <= 0) return null; S.charms--; S.used++; save(); renderSide(); return "used"; }
const charmNote = r => r === "used" ? ` (부적 1장 사용 · 남은 부적 ${S.charms}장)` : "";
function charmHint(replay, box, hint, onUse){
  const r = useCharm(replay);
  if(!r){ $(box).innerHTML = `<p class="hint">${NO_CHARM}</p>`; return; }
  onUse && onUse();
  $(box).innerHTML = `<p class="hint">부적이 타오르며 글씨가 떠올라요. ${esc(hint)}<span class="tag">${charmNote(r)}</span></p>`;
  const b = $("#hintB") || $("#rhint"); if(b){ b.disabled = true; b.textContent = "힌트를 봤어요"; }
}

/* ---------- 교실 책상: 책상마다 다른 문구, 두 곳엔 숨은 OX 게임 ---------- */
function seeded(str){ let h = 1779033703 ^ str.length; for(const ch of str){ h = Math.imul(h ^ ch.charCodeAt(0), 3432918353); h = h << 13 | h >>> 19; }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
const DESK_MSGS = (() => { const out = {};
  CHAIN.forEach((rid, i) => {
    const list = []; ["study","food","doodle","chara"].forEach(c => { for(let k=0;k<3;k++) list.push(DESK_TEXT[c][(i*3+k) % DESK_TEXT[c].length]); });
    const rnd = seeded(rid); for(let a=list.length-1;a>0;a--){ const b = Math.floor(rnd()*(a+1)); [list[a],list[b]] = [list[b],list[a]]; }
    const hidden = new Set(); while(hidden.size < 2) hidden.add(Math.floor(rnd()*list.length));
    out[rid] = { list, hidden };
  }); return out; })();
function openDesk(j){
  const rid = SC.room, D = DESK_MSGS[rid], msg = D.list[j], key = rid + "." + j;
  if(!D.hidden.has(j)) return talk(msg, "책상");
  if(S.hidden[key]) return talk(msg + " 서랍은 이미 비어 있다.", "책상");
  show(`<span class="eyebrow">${ROOMS[rid].name} · 책상</span><h3>서랍 속 노란 종이</h3>
    <p class="deskmsg">${esc(msg)}</p><p class="say">${esc(HIDDEN_DESK)}</p>
    <div class="btnrow"><button class="btn hot" id="dgo">꺼내 보기</button><button class="btn ghost" id="dx">그냥 두기</button></div>`,
  () => { $("#dgo").onclick = () => oxGame(rid, key); $("#dx").onclick = hide; });
}
function oxGame(rid, key){
  const qs = shuffle(OX_BANK[rid] || []).slice(0, 3); let i = 0, right = 0;
  const step = () => { const q = qs[i];
    show(`${dots(i, qs.length)}<span class="eyebrow">숨은 OX 게임 · ${i+1}/${qs.length}</span><h3>맞으면 O, 틀리면 X</h3>
      <div class="chalk ox">${esc(q[0])}</div>
      <div class="oxrow"><button class="oxb o" data-v="1" aria-label="O, 맞다">O</button><button class="oxb x" data-v="0" aria-label="X, 틀리다">X</button></div><div id="fb"></div>`,
    () => document.querySelectorAll(".oxb").forEach(b => b.onclick = () => {
      const ok = (b.dataset.v === "1") === q[1]; if(ok) right++;
      document.querySelectorAll(".oxb").forEach(x => { x.disabled = true; if((x.dataset.v === "1") === q[1]) x.classList.add("right"); });
      if(!ok) b.classList.add("wrong");
      $("#fb").innerHTML = `<div class="fb ${ok?"ok":"no"}"><span class="tag">${ok?"정답":"아쉬워요"} · 정답은 ${q[1]?"O":"X"}</span><span>${esc(q[2])}</span></div><div class="btnrow"><button class="btn" id="onx">${i < qs.length-1 ? "다음 문제" : "결과 보기"}</button></div>`;
      $("#onx").onclick = () => { i++; i < qs.length ? step() : result(); }; $("#onx").focus();
    }));
  };
  const result = () => { const win = right === qs.length;
    if(win){ S.hidden[key] = true; S.charms++; save(); renderSide(); }
    show(`<span class="eyebrow">숨은 OX 게임</span><h3>${win ? "부적을 얻었어요!" : "부적이 서랍 속으로 숨어 버렸어요"}</h3>
      ${win ? `<div class="getcharm"><img src="assets/obj_charm.png" alt="부적"><span>부적 +1 · 지금 ${S.charms}장</span></div>` : ""}
      <p class="say">${win ? "세 문제를 모두 맞혀 서랍 속 부적을 꺼냈어요. 문제를 풀다 막히면 '부적으로 힌트 보기'를 누르세요." : `${qs.length}문제 가운데 ${right}개를 맞혔어요. 모두 맞혀야 부적을 꺼낼 수 있어요.`}</p>
      <div class="btnrow">${win ? "" : `<button class="btn hot" id="oretry">다시 도전</button>`}<button class="btn ghost" id="oxx">닫기</button></div>`,
    () => { $("#oxx").onclick = hide; if(!win) $("#oretry").onclick = () => oxGame(rid, key); });
  };
  step();
}

function question(roomId, key, i){
  const R = ROOMS[roomId], st = R.stations[key], q = st.qs[i], replay = !!S.solved[roomId+"."+key];
  const order = shuffle(q.opts.map((_,k)=>k));
  show(`${dots(i, st.qs.length)}<span class="eyebrow">${R.name} · ${st.name} · ${i+1}/${st.qs.length}</span>
    <div class="word">${q.w}</div><p class="ctx">${esc(q.ask)}</p>
    <div class="choices">${order.map(k=>`<button class="choice ${TEACHER&&k===0?"key":""}" data-k="${k}">${esc(q.opts[k])}</button>`).join("")}</div>
    <div id="fb"></div>
    <div class="btnrow" id="ctl">${`<button class="btn charmbtn" id="hintB">부적으로 힌트 보기 (${replay||TEACHER?"무료":"보유 "+S.charms+"장"})</button>`}<button class="btn ghost" id="later">나중에 하기</button></div>`);
  let w = 0, helped = false, finished = false;
  $("#later").onclick = hide;
  $("#hintB").onclick = () => charmHint(replay, "#fb", q.hint, () => { helped = true; });
  document.querySelectorAll(".choice").forEach(b => b.onclick = () => {
    if(finished) return;
    const k = +b.dataset.k;
    if(k === 0){
      finished = true; b.classList.add("right"); document.querySelectorAll(".choice").forEach(x => x.disabled = true);
      const h = helped || w >= 3;
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
      $("#fb").innerHTML = `<div class="gline">${esc(line)}</div>${w>=3?`<p class="hint">세 번 틀려서 귀신이 힌트를 흘렸어요: ${esc(q.hint)}</p>`:""}`;
    }
  });
}
function clearRoom(roomId){
  const R = ROOMS[roomId];
  S.cleared[roomId] = true;
  if(R.kind === "class") return roomId === "c23" ? STORY.floorDown : roomId === "c21" ? "…다 풀었네. 동편 계단 문이 열렸어. 교실을 나가서 복도 끝으로 가." : STORY.roomClear;
  S.charms++; return `${R.name} 문제를 다 풀었어. 부적 한 장 가져가.`;
}
/* 문 자물쇠 수수께끼 */
const norm = v => String(v).replace(/[\s.,!?~'"“”‘’()\[\]]/g, "");
function openRiddle(id){
  const Q = RIDDLES[id], R = ROOMS[id];
  const dial = Q.type === "dial", digits = dial ? Array(Q.answer.length).fill(0) : null;
  show(`<span class="eyebrow">${R.name} · 문 자물쇠</span><h3>${esc(Q.title)}</h3>
    <div class="chalk riddle">${esc(Q.text).replace(/\n/g,"<br>")}</div>
    ${dial ? `<div class="dials" style="grid-template-columns:repeat(${digits.length},minmax(0,1fr))">${digits.map((d,k)=>`<div class="dial"><span>${esc(Q.labels[k])}</span><button data-d="${k}" data-v="1" aria-label="${esc(Q.labels[k])} 올리기">▲</button><span class="n" id="dn${k}">0</span><button data-d="${k}" data-v="-1" aria-label="${esc(Q.labels[k])} 내리기">▼</button></div>`).join("")}</div>`
      : `<label class="answer">답 적기<input type="text" id="rin" autocomplete="off" placeholder="예: 두세 글자 낱말"></label>`}
    <div id="rfb">${TEACHER ? `<p class="hint">교사용 정답: ${dial ? Q.answer : Q.answer.join(", ")}</p>` : ""}</div>
    <div class="btnrow"><button class="btn hot" id="rgo">자물쇠 열기</button><button class="btn charmbtn" id="rhint">부적으로 힌트 보기 (${TEACHER?"무료":"보유 "+S.charms+"장"})</button><button class="btn ghost" id="rx">나중에 하기</button></div>`,
  () => {
    if(dial) document.querySelectorAll(".dial button").forEach(b => b.onclick = () => { const k = +b.dataset.d; digits[k] = (digits[k] + (+b.dataset.v) + 10) % 10; $("#dn"+k).textContent = digits[k]; });
    else { $("#rin").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); $("#rgo").click(); } }); setTimeout(() => $("#rin").focus(), 50); }
    $("#rx").onclick = hide;
    $("#rhint").onclick = () => charmHint(false, "#rfb", Q.hint, () => { S.rtries[id] = Math.max(S.rtries[id]||0, 3); save(); });
    $("#rgo").onclick = () => {
      const val = dial ? digits.join("") : norm($("#rin").value);
      const ok = dial ? val === Q.answer : Q.answer.some(a => val === norm(a) || val.replace(/(이야|이다|입니다|야|다)$/,"") === norm(a));
      if(ok){
        const helped = (S.rtries[id]||0) >= 3; S.riddle[id] = true; helped ? S.qHelp++ : S.qSelf++;
        const msg = clearRoom(id); save();
        $("#rfb").innerHTML = `<div class="fb ok"><span class="tag">철컥! 자물쇠가 열렸어요</span><span>${esc(Q.why)}</span></div>`;
        document.querySelector("#sheet .btnrow").innerHTML = `<button class="btn hot" id="rdone">문 열고 나가기</button>`;
        $("#rdone").onclick = () => { hide(); setTimeout(() => talk(msg), 150); };
        $("#rdone").focus(); return;
      }
      if(!dial && !val){ $("#rfb").innerHTML = `<p class="hint">답을 적어 주세요.</p>`; return; }
      S.rtries[id] = (S.rtries[id]||0) + 1; S.wrong++; flicker = .1; save();
      let msg = GHOST_WRONG[Math.floor(Math.random()*GHOST_WRONG.length)];
      if(dial){ const right = [...val].filter((d,k) => d === Q.answer[k]).length; msg += ` (자물쇠 ${val.length}칸 가운데 ${right}칸이 딸깍 맞물렸어.)`; }
      $("#rfb").innerHTML = `<div class="gline">${esc(msg)}</div>${S.rtries[id] >= 3 ? `<p class="hint">세 번 틀려서 귀신이 힌트를 흘렸어요: ${esc(Q.hint)}</p>` : ""}`;
    };
  });
}
/* ---------- 짝 지우기(사천성) ---------- */
function matchGame(roomId, key){
  const R = ROOMS[roomId], st = R.stations[key], replay = !!S.solved[roomId+"."+key];
  const W = st.cols, H = st.rows, DX = [1,-1,0,0], DY = [0,0,1,-1];
  const tiles = []; for(const [g,arr] of Object.entries(st.groups)) arr.forEach(t => tiles.push({ t, g }));
  let grid = [], sel = null, hints = 0, misses = 0, left = tiles.length, busy = false;
  const deal = list => { const sh = shuffle(list); grid = Array.from({length:H+2}, () => Array(W+2).fill(null)); let i = 0;
    for(let y=1;y<=H;y++) for(let x=1;x<=W;x++) grid[y][x] = sh[i++] || null; };
  const remaining = () => { const a = []; for(let y=1;y<=H;y++) for(let x=1;x<=W;x++) if(grid[y][x]) a.push(grid[y][x]); return a; };
  const reshuffle = () => { const rem = shuffle(remaining()); let i = 0;
    for(let y=1;y<=H;y++) for(let x=1;x<=W;x++) if(grid[y][x]) grid[y][x] = rem[i++]; };
  function link(a, b){   // 선이 두 번까지만 꺾이는 길 찾기
    const best = {}, q = [];
    for(let d=0; d<4; d++) q.push({ x:a.x, y:a.y, d, turns:0, pts:[[a.x,a.y]] });
    while(q.length){
      const c = q.shift(), nx = c.x + DX[c.d], ny = c.y + DY[c.d];
      if(nx < 0 || ny < 0 || nx > W+1 || ny > H+1) continue;
      if(nx === b.x && ny === b.y) return c.pts.concat([[nx,ny]]);
      if(grid[ny][nx]) continue;
      const k = nx+","+ny+","+c.d; if(best[k] !== undefined && best[k] <= c.turns) continue; best[k] = c.turns;
      q.push({ x:nx, y:ny, d:c.d, turns:c.turns, pts:c.pts });
      if(c.turns < 2) for(let d2=0; d2<4; d2++) if(d2 !== c.d && d2 !== (c.d^1)) q.push({ x:nx, y:ny, d:d2, turns:c.turns+1, pts:c.pts.concat([[nx,ny]]) });
    }
    return null;
  }
  const pos = []; // 칸 좌표 찾기
  function findPair(){
    const cells = []; for(let y=1;y<=H;y++) for(let x=1;x<=W;x++) if(grid[y][x]) cells.push({ x, y, g:grid[y][x].g });
    for(let i=0;i<cells.length;i++) for(let j=i+1;j<cells.length;j++) if(cells[i].g === cells[j].g && link(cells[i], cells[j])) return [cells[i], cells[j]];
    return null;
  }
  deal(tiles); for(let n=0; n<60 && !findPair(); n++) reshuffle();
  show(`<span class="eyebrow">${R.name} · ${esc(st.name)} · 짝 지우기</span>
    <h3>${esc(st.rule)}</h3>
    <p class="say">같은 무리의 패 두 개를 차례로 누르세요. 두 패를 잇는 선은 <b>두 번까지만 꺾일 수 있고</b>, 다른 패를 넘어갈 수 없어요. 판 바깥 테두리로는 지나갈 수 있어요.</p>
    <div class="mwrap"><div class="mgrid" id="mgrid" style="grid-template-columns:14px repeat(${W},minmax(0,1fr)) 14px"></div><svg class="mline" id="mline"></svg></div>
    <div id="fb"></div>
    <div class="btnrow" id="ctl"><button class="btn charmbtn" id="mhint">부적으로 짝 하나 보기 (${replay||TEACHER?"무료":"보유 "+S.charms+"장"})</button><button class="btn ghost" id="mshuf">패 섞기</button><button class="btn ghost" id="mx">나중에 하기</button></div>`,
  () => { render(); $("#mx").onclick = hide;
    $("#mhint").onclick = () => { const p = findPair(); if(!p) return;
      const r = useCharm(replay); if(!r){ $("#fb").innerHTML = `<p class="hint">${NO_CHARM}</p>`; return; }
      hints++; [p[0],p[1]].forEach(c => cellEl(c.x,c.y).classList.add("hint"));
      $("#fb").innerHTML = `<p class="hint">파란 테두리 두 패를 이어 보세요.${charmNote(r)}</p>`; $("#mhint").textContent = `부적으로 짝 하나 보기 (${replay||TEACHER?"무료":"보유 "+S.charms+"장"})`; };
    $("#mshuf").onclick = () => { reshuffle(); for(let n=0; n<60 && !findPair(); n++) reshuffle(); sel = null; render(); }; });
  function cellEl(x,y){ return $(`#mgrid [data-x="${x}"][data-y="${y}"]`); }
  function render(){
    const g = $("#mgrid"); g.innerHTML = "";
    for(let y=0;y<=H+1;y++) for(let x=0;x<=W+1;x++){
      const edge = x===0 || y===0 || x===W+1 || y===H+1, t = grid[y][x];
      const el = document.createElement(edge ? "div" : "button");
      el.dataset.x = x; el.dataset.y = y;
      el.className = edge ? "medge" : "tile" + (t ? "" : " gone") + (t && /^[\u3131-\u318E]$/.test(t.t) ? " big" : "");
      if(edge && (y===0 || y===H+1)) el.style.height = "14px";
      if(!edge){ el.innerHTML = t ? t.t : ""; el.disabled = !t; if(TEACHER && t) el.title = t.g; el.onclick = () => pick(x,y); }
      g.appendChild(el);
    }
  }
  function drawLine(pts){
    const svg = $("#mline"), box = $("#mgrid").getBoundingClientRect();
    const xy = pts.map(([x,y]) => { const r = cellEl(x,y).getBoundingClientRect(); return [(r.left+r.right)/2 - box.left, (r.top+r.bottom)/2 - box.top]; });
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = `<polyline points="${xy.map(p=>p.join(",")).join(" ")}" />`;
    setTimeout(() => { svg.innerHTML = ""; }, 420);
  }
  function pick(x,y){
    if(busy || !grid[y][x]) return;
    const el = cellEl(x,y);
    if(!sel){ sel = {x,y}; el.classList.add("sel"); return; }
    if(sel.x === x && sel.y === y){ el.classList.remove("sel"); sel = null; return; }
    const a = sel, A = grid[a.y][a.x], B = grid[y][x], ea = cellEl(a.x,a.y);
    sel = null; ea.classList.remove("sel");
    if(A.g !== B.g){
      misses++; if(!replay){ S.wrong++; save(); flicker = .1; }
      [ea, el].forEach(e => { e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); });
      $("#fb").innerHTML = `<div class="gline">${esc(GHOST_WRONG[Math.floor(Math.random()*GHOST_WRONG.length)])} 둘은 같은 무리가 아니야.</div>`;
      return;
    }
    const path = link(a, {x,y});
    if(!path){ $("#fb").innerHTML = `<p class="hint">같은 무리는 맞아! 그런데 길이 막혔어. 선이 두 번 넘게 꺾이거나 다른 패를 넘으면 안 돼. 다른 패부터 지워 봐.</p>`; return; }
    busy = true; drawLine(path); ea.classList.add("pop"); el.classList.add("pop");
    $("#fb").innerHTML = `<div class="fb ok"><span><b>${esc(A.g)}</b> · ${A.t} — ${B.t}</span></div>`;
    setTimeout(() => {
      grid[a.y][a.x] = null; grid[y][x] = null; left -= 2; busy = false;
      if(!left) return finishMatch();
      if(!findPair()){ for(let n=0; n<60 && !findPair(); n++) reshuffle(); $("#fb").innerHTML = `<p class="hint">이을 수 있는 짝이 없어서 귀신이 패를 섞어 줬어.</p>`; }
      render();
    }, 380);
  }
  function finishMatch(){
    const helped = hints > 0 || misses >= 3;
    if(!replay){ helped ? S.qHelp++ : S.qSelf++; save(); }
    $("#mgrid").innerHTML = ""; $("#mgrid").style.display = "none";
    $("#fb").innerHTML = `<div class="fb ok"><span class="tag">${helped ? "도움 받아 해결" : "스스로 해결"} · 틀린 짝 ${misses}번 · 힌트 ${hints}번</span>${Object.entries(st.groups).map(([g,a]) => `<span><b>${esc(g)}</b>: ${a.join(", ")}</span>`).join("")}</div>`;
    $("#ctl").innerHTML = `<button class="btn" id="nx">끝내기</button>`; $("#nx").onclick = () => stationDone(roomId, key, replay); $("#nx").focus();
  }
}

/* ---------- 받아쓰기(타이핑) ---------- */
function typeGame(roomId, key, i, helpedSoFar){
  const R = ROOMS[roomId], st = R.stations[key], it = st.items[i], replay = !!S.solved[roomId+"."+key];
  let w = 0, helped = false;
  show(`${dots(i, st.items.length)}<span class="eyebrow">${R.name} · ${esc(st.name)} · 받아쓰기 ${i+1}/${st.items.length}</span>
    <div class="word">${it.w}</div><p class="ctx">${esc(it.ask || st.ask)}</p>
    <label class="answer">답 적기<input type="text" id="tin" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
    <div id="fb">${TEACHER ? `<p class="hint">교사용 정답: ${it.answer.join(", ")}</p>` : ""}</div>
    <div class="btnrow" id="ctl"><button class="btn hot" id="tgo">확인</button>${`<button class="btn charmbtn" id="hintB">부적으로 힌트 보기 (${replay||TEACHER?"무료":"보유 "+S.charms+"장"})</button>`}<button class="btn ghost" id="later">나중에 하기</button></div>`,
  () => {
    setTimeout(() => $("#tin").focus(), 50);
    $("#tin").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); $("#tgo") && $("#tgo").click(); } });
    $("#later").onclick = hide;
    $("#hintB").onclick = () => charmHint(replay, "#fb", it.hint, () => { helped = true; });
    $("#tgo").onclick = () => {
      const val = norm($("#tin").value);
      if(!val){ $("#fb").innerHTML = `<p class="hint">답을 적어 주세요.</p>`; return; }
      if(it.answer.some(a => norm(a) === val)) return done(false);
      w++; if(!replay){ S.wrong++; save(); flicker = .1; }
      let extra = w >= 3 ? `<p class="hint">세 번 틀려서 귀신이 힌트를 흘렸어요: ${esc(it.hint)}</p>` : "";
      if(w >= 4) extra += `<div class="btnrow"><button class="btn ghost" id="reveal">정답 보기</button></div>`;
      $("#fb").innerHTML = `<div class="gline">${esc(GHOST_WRONG[Math.floor(Math.random()*GHOST_WRONG.length)])}</div>${extra}`;
      if($("#reveal")) $("#reveal").onclick = () => done(true);
      $("#tin").select();
    };
  });
  function done(revealed){
    const h = helped || w >= 3 || revealed;
    if(!replay){ h ? S.qHelp++ : S.qSelf++; save(); }
    $("#tin").disabled = true;
    $("#fb").innerHTML = `<div class="fb ok"><span class="tag">${revealed ? "정답 확인" : h ? "도움 받아 해결" : "스스로 해결"} · 정답: ${esc(it.answer[0])}</span><span>${esc(it.why)}</span></div>`;
    const last = i+1 >= st.items.length;
    $("#ctl").innerHTML = `<button class="btn" id="nx">${last ? "끝내기" : "다음 낱말"}</button>`;
    $("#nx").onclick = () => last ? stationDone(roomId, key, replay) : typeGame(roomId, key, i+1, helpedSoFar || h);
    $("#nx").focus();
  }
}

function stationDone(roomId, key, replay){
  const R = ROOMS[roomId];
  if(!replay){ S.solved[roomId+"."+key] = true; }
  const allDone = Object.keys(R.stations).every(k => S.solved[roomId+"."+k]);
  let msg = "";
  if(!replay && allDone && !isCleared(roomId)){
    if(R.kind === "class" && RIDDLES[roomId] && !S.riddle[roomId]){
      msg = "세 곳 다 풀었네. 그런데 문에 자물쇠가 걸려 있지? 문으로 가서 수수께끼를 풀어 봐. 막히면 벽의 교표를 살펴봐.";
    } else msg = clearRoom(roomId);
  }
  save(); hide();
  if(msg) setTimeout(() => talk(msg), 200);
  else if(!replay){ const left = Object.keys(R.stations).filter(k => !S.solved[roomId+"."+k]).map(k => R.stations[k].name); if(left.length) setTimeout(() => talk(`남은 곳: ${left.join(", ")}`, "탈출 수첩"), 200); }
}

/* ------------------------------------------------------------------
   10. 시작 · 끝
   ------------------------------------------------------------------ */
function intro(){
  show(`<img class="hero" src="assets/title.jpg" alt="밤의 학교 복도에서 손전등을 든 학생과 손을 흔드는 귀신"><span class="eyebrow">밤 10시 · 본관 4층</span><h3>야자 탈출</h3>
    <div class="story">${STORY.intro.map(l=>`<p>${esc(l)}</p>`).join("")}</div>
    <p class="say">방향키나 WASD로 움직이고, E로 살펴요. 휴대폰에서는 화면 방향키를 쓰거나 가고 싶은 곳을 누르세요. 노란 <b>!</b>는 아직 풀지 않은 곳, 문 위에 부적이 뜬 곳은 들러 볼 수 있는 특별실이에요.</p>
    <p class="say" style="font-size:14px">부적은 막힐 때 힌트를 보는 아이템이에요. 한 장을 가지고 시작하고, 교실 책상 서랍의 숨은 OX 게임·특별실·귀신의 복습 문제로 더 얻을 수 있어요. 틀려도 실패하지 않아요.</p>
    <div class="btnrow"><button class="btn hot" id="go">교실 둘러보기</button></div>`,
    () => $("#go").onclick = () => { S.started = true; S.t0 = Date.now(); S.met.c27 = true; save(); hide(); setTimeout(() => talk(STORY.ghostIntro), 300); });
}
function mmss(ms){ const s=Math.max(0,Math.floor(ms/1000)); return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }
function finish(){
  if(!S.escaped){ S.escaped = true; S.tEnd = Date.now(); save(); renderSide(); }
  const sides = Object.keys(ROOMS).filter(k => ROOMS[k].kind === "side");
  show(`<img class="hero" src="assets/title.jpg" alt=""><span class="eyebrow">밤 11시 · 교문 밖</span><h3>탈출 성공 — 집에 갈 수 있어요</h3>
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
        <dt>찾은 교표</dt><dd>${Object.keys(S.logos).length}/${Object.keys(ROOMS).length + 2}</dd>
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
  () => { $("#yes").onclick = () => { try{ localStorage.removeItem(KEY); }catch(e){} S = fresh(); enter("c27",null,"up"); intro(); }; $("#no").onclick = hide; });

setInterval(() => { if(S.started) $("#stClock").textContent = mmss((S.escaped?S.tEnd:Date.now())-S.t0); if(S.started && $("#overlay").hidden) save(); }, 1000);
setInterval(() => { if(Math.random() < .25 && SC && SC.hall) flicker = .08; }, 6000);

/* 시작 */
enter(S.scene || "c27", null, S.dir);
if(S.px != null && !solidAt(Math.floor(S.px/T), Math.floor((S.py-5)/T))){ P.x = S.px; P.y = S.py; } else if(SC.hall){ const r = SC.objs.find(o=>o.room===nextRequired()); if(r){ P.x=r.door[0]*T+T/2; P.y=(r.door[1]+1)*T+T-4; } }
updateZoom();
requestAnimationFrame(loop);
if(!S.started) intro();

/* 점검용 (자동 테스트) */
window.__yaja = { S:()=>S, enter, interact, scene:()=>SC, P, unreachable:()=>SC.objs.filter(o=>o.kind!=="deco" && !routeToObj(o)).map(o=>o.label||o.say||o.room||o.kind), solveAll:(id)=>{ Object.keys(ROOMS[id].stations).forEach(k=>S.solved[id+"."+k]=true); S.riddle[id]=true; S.cleared[id]=true; renderSide(); } };
})();
