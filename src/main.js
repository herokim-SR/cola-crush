// 콜라 박살내기 — 빌드 없음, 외부 접속 없음, 데이터 수집 없음.
// 그림은 src/art.js 의 window.CanArt, 소리는 src/sfx.js 의 window.Sfx 를 호출만 한다.
(function () {
  'use strict';

  const CONFIG = {
    // ---- GAME.md "CONFIG 변수 목록" ----
    hitsPerCan: 10, // (아이 요청) 1등급 캔 + 기본 망치 + 윗부분 톡 = 10번이면 납작
    goodHitValue: 1.0, // [결정 필요] 기본값 1.0 — 윗부분 타격 1번의 몫
    badHitValue: 0.5, // [결정 필요] 기본값 0.5 — 옆·가운데 타격 1번의 몫
    topZoneRatio: 0.25, // [결정 필요] 기본값 0.25 — 캔 키 중 윗부분 비율
    topZoneMinPx: 80, // (기본값: kid-safety 권장 버튼 80px)
    hitSlopPx: 24, // [결정 필요] 기본값 24 — 그림 밖 판정 여유
    canHeightRatio: 0.45, // [결정 필요] 기본값 0.45 — 캔 키 = 짧은 변 × 이 값
    canWidthRatio: 0.6, // (기본값: 실제 캔 비율 약 0.54보다 통통한 만화풍)
    canMinHeightPx: 320, // (기본값: topZoneMinPx 80 ÷ topZoneRatio 0.25)
    canBottomRatioPortrait: 0.78, // [결정 필요] 기본값
    canBottomRatioLandscape: 0.82, // [결정 필요] 기본값
    hudHeightPx: 96, // (기본값: 위 여백 12 + 버튼 72 + 여유 12)
    crushStages: 5, // [결정 필요] 기본값 5 — art.js는 stage 0..5(5=납작)로 그림
    tapThresholdMs: 250, // [결정 필요] 기본값 250 — 이보다 짧으면 톡
    chargeMaxSec: 1.0, // [결정 필요] 기본값 1.0 — 게이지 가득 차는 시간
    chargeMaxMultiplier: 3.0, // [결정 필요] 기본값 3.0 — 게이지 가득일 때 배수
    pointsPerCan: 10, // (아이 요청)
    coinsPerCan: 10, // (아이 요청)
    goalScore: 50, // (아이 요청) 꽃가루 + "오예!" (이번 판 1회)
    cansPerGradeUp: 3, // [결정 필요] 기본값 3
    maxCanGrade: 3, // [결정 필요] 기본값 3
    canHardness: [1.0, 1.5, 2.0], // 1등급 (아이 요청 10번 기준), 2·3등급 [결정 필요]
    canColors: ['#E63946', '#FF8C1A', '#1E1E1E'], // (아이 요청: 빨강·주황·검정), 색 코드 (기본값: artist 대비 계산)
    hammerPrices: [0, 20, 50, 100], // 20은 (아이 요청), 0·50·100은 [결정 필요]
    hammerPower: [1.0, 1.5, 2.0, 3.0], // [결정 필요] 기본값
    skinPrice: 20, // (아이 요청)
    pulseHz: 1, // (기본값: 깜빡임 금지 기준 초당 3회의 1/3) — 속도는 여기 한 곳에서만 곱함(art.js는 위상만 받음)
    pulseHzMax: 2.5, // (기본값: kid-safety 깜빡임 기준 초당 3회 미만) — 모든 반복 움직임 속도를 이 값으로 Math.min 고정
    saveKeyPrefix: 'cancrush.', // (기본값: 다른 아이용 게임과 저장값이 섞이지 않게)

    // ---- 2026-10-18 재미 QA 개선: 좋은 자리 띠 ----
    zoneFillAlpha: 0.5, // [결정 필요] 기본값 0.5 — 진한 노란 띠 투명도. 캔 외곽선·뚜껑이 비쳐 보이는 상한
    zonePulseAlphaMin: 0.85, // [결정 필요] 기본값 — 박동 중 최저 진하기 (플레이 점검 '띠가 너무 연하다' 지적, 이전 0.7)
    zoneBorderPx: 6, // [결정 필요] 기본값 — 캔 외곽선 4px보다 굵게 (굵은 테두리는 플레이 점검)
    zoneStarPx: 18, // [결정 필요] 기본값 — 작은 ★ 반지름
    zoneBumpScale: 0.15, // [결정 필요] 기본값 — 나쁜 타격 때 띠가 한 번 커지는 양(+15%)
    zoneBumpSec: 0.6, // [결정 필요] 기본값 — 한 번 커졌다 작아지는 시간. 하한 1/pulseHzMax=0.4초는 코드에서 고정

    // ---- 처음 안내 "여기를 톡!" ----
    tutorialGoodHits: 3, // (플레이 점검) 좋은 타격 몇 번까지 안내를 보일지
    tutorialSave: false, // [결정 필요] 기본값 false — 안내를 봤다는 사실을 저장하지 않음(실행할 때마다 첫 판에 보임)
    tutorialBobHz: 0.8, // [결정 필요] 기본값 — 플레이 점검 범위(1Hz 이하) 안의 값
    tutorialBobPx: 10, // [결정 필요] 기본값 — 위아래 움직임 폭
    tutorialArrowPx: 72, // [결정 필요] 기본값 — 큰 화살표 높이 (기존 작은 화살표 40px보다 크게)
    tutorialFontPx: 40, // [결정 필요] 기본값 — 말풍선 글자 (기존 "여기!" 34px보다 크게)
    tutorialFadeSec: 0.4, // [결정 필요] 기본값 — 안내가 한 번 부드럽게 사라지는 시간

    // ---- 망치 대기 자리 ----
    hammerIdleAngle: -1.0, // [결정 필요] 기본값 — 대기 중 젖힌 각도(라디안). 손잡이가 아래로 향해 화면 밖으로 덜 나감
    hammerIdleGapPx: 16, // (기본값: 기존 gaugeGapPx 16과 같은 간격) 띠와 망치 머리 사이
    hammerIdleBlend: 8, // [결정 필요] 기본값 — 대기 각도로 바뀌는 부드러움, 초당 비율

    // ---- 타격 글자 ----
    popMaxVisible: 2, // (플레이 점검) 동시에 보이는 타격 글자 최대 개수
    popOldFadeSec: 0.15, // [결정 필요] 기본값 — 새 글자가 나오면 옛 글자가 사라지는 시간
    popGapPx: 12, // (기본값: index.html 상단 버튼 여백 12px과 같음) 캔·망치 머리와 글자 사이
    popRisePx: 30, // [결정 필요] 기본값 — 글자가 떠오르는 높이 (이전 40)
    goodPopPx: 84, // [결정 필요] 기본값 — 큰 "뿅!" 글자 (이전 72px보다 크게, 플레이 점검 '크고 읽기 쉬운')
    goodSubPx: 30, // (기본값: HUD 점수 글자 30px과 같음) "잘 쳤어!" 글자
    goodHitStars: 3, // [결정 필요] 기본값 — 좋은 타격 때 별 개수
    badPopPx: 44, // [결정 필요] 기본값 — 작은 "팅" 글자
    badSubPx: 28, // [결정 필요] 기본값 — "윗부분을 쳐 봐!" 글자
    badHintCount: 3, // [결정 필요] 기본값 — "윗부분을 쳐 봐!"를 보여 주는 횟수(실행마다)

    // ---- 꾹 최대 ----
    chargeMaxLabelPx: 40, // [결정 필요] 기본값 — "최대!" 글자
    chargeMaxTremblePx: 3, // [결정 필요] 기본값 — 최대일 때 망치 떨림 폭(위치만 움직임, 밝기 변화 없음)
    chargeMaxTrembleHz: 2.5, // (기본값: pulseHzMax 상한 — 떨림에도 상한 적용은 플레이 점검)

    // ---- 상점 알림·등급 배너 ----
    shopToastSec: 2.0, // (플레이 점검: 약 2초)
    gradeBannerSec: 2.4, // [결정 필요] 기본값 — "캔이 더 단단해졌어!" 표시 시간 (이전 0.7초 팝 글자에서 키움)
    gradeBannerFontPx: 56, // [결정 필요] 기본값 — 최대 글자 크기. 화면 폭·빈 공간에 맞춰 자동으로 줄어듦
    gradeBannerBobHz: 0.8, // [결정 필요] 기본값 — 위아래 움직임 속도 (pulseHzMax 상한 적용)
    gradeBannerMinFontPx: 32, // [결정 필요] 기본값 — 하늘에 이 크기로 안 들어가면 식탁(캔 아래)으로 옮김

    // ---- 시작 화면 배치 ----
    startMarginPx: 12, // (기본값: index.html 상단 버튼 여백 top/right 12px과 같음) 시작 화면 글자·버튼과 캔·소리 버튼 사이 최소 간격

    // ---- 화면·배치 ----
    flatHeightRatio: 0.25, // [결정 필요] 기본값 — 납작 시 원래 키의 약 25%
    canHeightEase: 14, // (기본값: 키가 줄어드는 부드러움, 초당 비율)
    minHammerSpacePx: 40, // (기본값: 작은 가로 화면에서 캔 위 망치 공간 최소)
    gaugeWidthPx: 64, // [결정 필요] 기본값 64 (GAME.md 결정 필요 14번)
    gaugeGapPx: 16, // (기본값: 판정 여유 바깥으로 띄우는 간격)
    hammerSizeRatio: 0.35, // [결정 필요] 망치 머리 폭 = 캔 기본 키 × 이 값 (360px 캔 → 126px 머리)
    hammerFaceRatio: 0.4, // (기본값: art.js 머리 높이 = 폭 × 0.8 의 절반 — 때리는 면이 손가락 위치에 닿게)
    hammerLiftPx: 18, // (기본값: 평소 머리를 살짝 띄우는 높이)
    hammerRestAngle: -0.3, // (기본값: 평소 살짝 젖힌 각도, 라디안)
    hammerChargeAngle: -1.3, // [결정 필요] 꾹 가득일 때 젖히는 각도
    hammerStrikeSec: 0.14, // (기본값: 내려치기 애니메이션 길이)
    hammerIdleDelaySec: 0.6, // (기본값: 손을 뗀 뒤 캔 위로 돌아가기까지)
    hammerFollow: 28, // (기본값: 손가락 따라가는 속도)
    maxDents: 10, // (기본값: 성능·그림 보호)
    wobbleSec: 0.3, // (기본값: 맞을 때 흔들림 길이)
    canWobbleHz: 2.5, // (기본값: pulseHzMax 상한. 이전 art.js 5Hz는 상한 밖이라 내림) — 맞을 때 캔 기우뚱 속도

    // ---- 흔들림 (기본값: GAME.md 아트 리스크 5 — 화면 섬광 대신 약한 흔들림, kid-safety 깜빡임 금지) — px·초 수치는 [결정 필요] 기본값 ----
    shakeTapPx: 2.5,
    shakeBadPx: 2,
    shakeChargeMinPx: 3,
    shakeChargeMaxPx: 7,
    shakeFlatPx: 8,
    shakeTapSec: 0.15,
    shakeChargeSec: 0.25,
    shakeFlatSec: 0.3,

    // ---- 파편(둥근 방울·거품·은색 동그라미) ----
    debrisTap: 4, // [결정 필요]
    debrisChargeMax: 9, // [결정 필요]
    debrisBad: 2, // [결정 필요]
    debrisFlat: 18, // [결정 필요]
    maxDebris: 80, // (기본값: 성능 보호 상한)
    debrisGravity: 900, // (기본값: px/s²)
    debrisColors: { drop: '#7A3B12', bubble: '#FFFFFF', bit: '#C9D1D9' }, // (기본값: art.js 콜라 방울·거품·은색과 같은 값)

    // ---- 글자·코인·등장 ----
    popTextSec: 0.7, // (기본값)
    respawnDelaySec: 0.8, // [결정 필요] 기본값 — 약 0.8초 뒤 새 캔
    spawnAnimSec: 0.35, // (기본값: 새 캔이 커지며 등장)
    coinFlyCount: 6, // [결정 필요] 날아가는 코인 그림 개수
    coinFlySec: 0.8, // (기본값)
    coinFlyStaggerSec: 0.08, // (기본값)
    coinRadiusPx: 18, // (기본값)

    // ---- 꽃가루 ----
    confettiCount: 140, // [결정 필요]
    maxConfetti: 200, // (기본값: 성능 보호 상한)
    goalPanelDelaySec: 1.8 // (기본값: 꽃가루·"오예!"를 본 뒤 패널 열기)
  };

  const DEFAULT_HAMMERS = [ // GAME.md 등급 표 가칭. CanArt.HAMMERS 가 있으면 그 이름을 씀
    { grade: 1, name: '기본 망치' }, { grade: 2, name: '주황 망치' },
    { grade: 3, name: '번개 망치' }, { grade: 4, name: '슈퍼 망치' }];
  const DEFAULT_SKINS = [
    { id: 'fire', name: '불꽃', emoji: '🔥' }, { id: 'star', name: '별', emoji: '⭐' },
    { id: 'stripe', name: '줄무늬', emoji: '〰️' }];
  const DEFAULT_CONFETTI = ['#E63946', '#FF8C1A', '#FFD93D', '#FFFFFF'];

  // ---------- 그림 호출(가드) ----------
  const artErr = {};
  function A() { return window.CanArt || null; }
  function art(name, c) {
    const lib = A();
    if (!lib || typeof lib[name] !== 'function') return;
    const args = Array.prototype.slice.call(arguments, 1);
    c.save();
    try { lib[name].apply(lib, args); } catch (e) {
      if (!artErr[name]) { artErr[name] = 1; console.warn('CanArt.' + name, e); }
    }
    c.restore();
  }
  function hammerList() { const l = A() && A().HAMMERS; return Array.isArray(l) && l.length ? l : DEFAULT_HAMMERS; }
  function skinList() { const l = A() && A().SKINS; return Array.isArray(l) && l.length ? l : DEFAULT_SKINS; }
  function confettiColors() { const l = A() && A().CONFETTI_COLORS; return Array.isArray(l) && l.length ? l : DEFAULT_CONFETTI; }
  const SFX = window.Sfx || { unlock() {}, setOn() {}, isOn() { return true; }, boing() {}, bang() {}, ting() {}, coin() {}, fanfare() {} };

  // ---------- 기기 안 저장 (kid-safety 허용 항목만) ----------
  const store = {
    get(k) { try { return localStorage.getItem(CONFIG.saveKeyPrefix + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(CONFIG.saveKeyPrefix + k, String(v)); } catch (e) { /* 막힌 환경 무시 */ } }
  };
  function loadInt(k, def) {
    const v = parseInt(store.get(k), 10);
    return Number.isFinite(v) && v >= 0 ? v : def;
  }
  function loadArray(k) {
    try { const a = JSON.parse(store.get(k)); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }

  let best = loadInt('best', 0);
  let coins = loadInt('coins', 0);
  let coinsShown = coins;
  let ownedHammers = loadArray('hammers').filter((g) => Number.isInteger(g) && g >= 1 && g <= CONFIG.hammerPrices.length);
  if (ownedHammers.indexOf(1) < 0) ownedHammers.push(1);
  ownedHammers = ownedHammers.filter((g, i, a) => a.indexOf(g) === i).sort();
  let hammer = loadInt('hammer', 1);
  if (ownedHammers.indexOf(hammer) < 0) hammer = 1;
  const skinIds = skinList().map((s) => s.id);
  let ownedSkins = loadArray('skins').filter((id, i, a) => skinIds.indexOf(id) >= 0 && a.indexOf(id) === i);
  let skin = store.get('skin');
  if (ownedSkins.indexOf(skin) < 0) skin = null;
  let soundOn = store.get('sound') !== 'off';
  SFX.setOn(soundOn);

  function saveShop() {
    store.set('coins', coins);
    store.set('hammers', JSON.stringify(ownedHammers));
    store.set('hammer', hammer);
    store.set('skins', JSON.stringify(ownedSkins));
    store.set('skin', skin || 'none');
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('game'), ctx = canvas.getContext('2d');
  const fx = $('fx'), fxc = fx.getContext('2d');
  const hudLeft = $('hudLeft'), scoreEl = $('score'), coinTextEl = $('coinText'), coinIcon = $('coinIcon');
  const pauseBtn = $('pause'), soundBtn = $('sound');
  const startEl = $('start'), startBtn = $('startBtn'), bestStart = $('bestStart');
  const panelEl = $('panel'), hurrayTitle = $('hurrayTitle'), panelInfo = $('panelInfo');
  const continueBtn = $('continueBtn'), restartBtn = $('restartBtn');
  const hammerCards = $('hammerCards'), skinCards = $('skinCards');
  const shopCoinText = $('shopCoinText'), shopCoinIcon = $('shopCoinIcon');
  const topRight = $('topRight'), startBox = $('startBox'), startTitle = $('startTitle'), startHint = $('startHint');
  const startRow = $('startRow'), toastEl = $('toast'), pauseBadge = $('pauseBadge');
  /** 반복 움직임 속도 상한 (kid-safety: 초당 3회 미만) */
  function hz(v) { return Math.min(v, CONFIG.pulseHzMax); }

  // 안드로이드 길게 누르기 메뉴 막기
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  // 첫 터치/키 입력 전에는 소리를 만들지 않음
  document.addEventListener('pointerdown', () => SFX.unlock(), true);
  document.addEventListener('keydown', () => SFX.unlock(), true);

  // ---------- 상태 ----------
  let W = 0, H = 0, dpr = 1;
  let L = {};
  let screen = 'start'; // 'start' | 'play' | 'panel'
  let score = 0, canGrade = 1, cansCrushed = 0, goalShown = false;
  let can = null;
  let respawnIn = -1, gradeUpPending = false;
  let goalOpenIn = -1, hurrayT = -1;
  let time = 0;
  let debris = [], confetti = [], popups = [], flyingCoins = [];
  let shake = { amp: 0, dur: 0, t: 0 };
  const pointer = { active: false, id: null, downT: 0, x: 0, y: 0, kb: false, type: '' };
  const hover = { on: false, x: 0, y: 0, type: '', lastT: -99 };
  let aimMode = 'idle'; // 'pointer' | 'key' | 'idle'
  let keyAim = 'top'; // 'top' | 'mid'
  const ham = { x: 0, y: 0, init: false, strikeT: -1, sx: 0, sy: 0, fromAngle: 0, fromLift: 0, idle: 0 };
  // 2026-10-18 재미 QA 개선
  let tutorialGood = 0, tutorialFade = -1; // 좋은 타격 수(안내용), 사라지는 중이면 남은 초
  let badHintsShown = 0;
  let zoneBumpT = -1;
  let chargeFullT = -1; // 꾹 게이지가 가득 찬 뒤 지난 시간
  let banner = null; // { grade, t }
  let couldBuy = false, toastCount = 0, toastHideIn = -1, toastPending = false;

  // ---------- 배치 ----------
  function sizeCanvas(cv, c) {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    sizeCanvas(canvas, ctx); sizeCanvas(fx, fxc);
    const portrait = H >= W;
    const bottomY = H * (portrait ? CONFIG.canBottomRatioPortrait : CONFIG.canBottomRatioLandscape);
    let baseH = Math.max(Math.min(W, H) * CONFIG.canHeightRatio, CONFIG.canMinHeightPx);
    // HUD(위 96px)와 겹치지 않게: 아주 작은 화면에서는 최소 높이보다 작아질 수 있음
    baseH = Math.max(60, Math.min(baseH, bottomY - CONFIG.hudHeightPx - CONFIG.minHammerSpacePx));
    let canW = baseH * CONFIG.canWidthRatio;
    const side = CONFIG.hitSlopPx + CONFIG.gaugeGapPx + CONFIG.gaugeWidthPx + 8;
    const maxW = W - 2 * side;
    if (canW > maxW) { canW = Math.max(36, maxW); baseH = canW / CONFIG.canWidthRatio; }
    const cx = W / 2;
    const gx = cx + canW / 2 + CONFIG.hitSlopPx + CONFIG.gaugeGapPx;
    L = { portrait, bottomY, baseH, canW, cx,
      hammerSize: baseH * CONFIG.hammerSizeRatio,
      gauge: { x: gx, y: bottomY - baseH, w: CONFIG.gaugeWidthPx, h: baseH } };
    drawCoinIcon(coinIcon, 36); drawCoinIcon(shopCoinIcon, 40);
    layoutStart();
  }

  // ---------- 시작 화면 배치: 제목·설명·시작 버튼이 캔·소리 버튼과 겹치지 않게 ----------
  // 순서대로 시도하고 실제 화면 크기(getBoundingClientRect)로 겹침을 검사한다.
  //  1) 'stack-hud' : 캔 위 빈 하늘(HUD 아래 ~ 캔 뚜껑 위) 가운데에 세로로 쌓음
  //  2) 'stack-top' : 1이 안 들어가면 화면 맨 위부터 (소리 버튼과 옆으로 겹치지 않을 때만)
  //  3) 'side'      : 작은 가로 화면 — 캔 왼쪽 빈 곳에 줄바꿈해서 넣음
  function startAvoidRects() {
    const m = CONFIG.startMarginPx;
    const lidRy = L.canW * 0.11; // art.js 뚜껑 타원 세로(lidRy 0.11)
    const half = L.canW * 0.6; // 바닥 그림자까지 포함한 폭
    const can = { l: L.cx - half - m, r: L.cx + half + m, t: L.bottomY - L.baseH - lidRy - m, b: H };
    const tr = topRight.getBoundingClientRect();
    const btn = { l: tr.left - m, r: tr.right + m, t: tr.top - m, b: tr.bottom + m };
    return [can, btn];
  }
  function overlaps(a, b) { return a.left < b.r && a.right > b.l && a.top < b.b && a.bottom > b.t; }
  function startFits(avoid) {
    const els = [startTitle, startHint, startBtn, bestStart];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      if (r.left < 0 || r.right > W || r.top < 0 || r.bottom > H) return false;
      for (const a of avoid) if (overlaps(r, a)) return false;
    }
    return true;
  }
  function layoutStart() {
    if (!startBox || startEl.hidden || !W) return;
    const avoid = startAvoidRects();
    const canTopLimit = avoid[0].t;
    const s = startBox.style;
    // 1·2) 가운데 쌓기
    startBox.className = 'stack';
    s.width = ''; s.maxWidth = (W - 16) + 'px'; s.left = '0px'; s.top = '0px';
    const bh = startBox.offsetHeight, bw = startBox.offsetWidth;
    s.left = Math.round((W - bw) / 2) + 'px';
    const tops = [];
    const hud = CONFIG.hudHeightPx;
    if (canTopLimit - hud >= bh) tops.push(['stack-hud', hud + (canTopLimit - hud - bh) / 2]);
    if (canTopLimit - CONFIG.startMarginPx >= bh) tops.push(['stack-top', CONFIG.startMarginPx + (canTopLimit - CONFIG.startMarginPx - bh) / 2]);
    for (const t of tops) {
      s.top = Math.round(t[1]) + 'px';
      if (startFits(avoid)) { L.startMode = t[0]; return; }
    }
    // 3) 캔 왼쪽 옆
    startBox.className = 'side';
    const sideW = Math.max(160, avoid[0].l - 2 * CONFIG.startMarginPx);
    s.maxWidth = ''; s.width = sideW + 'px';
    s.left = CONFIG.startMarginPx + 'px';
    const sh = startBox.offsetHeight;
    s.top = Math.round(Math.max(CONFIG.startMarginPx, (H - sh) / 2)) + 'px';
    L.startMode = startFits(avoid) ? 'side' : 'side-tight';
  }

  function drawCoinIcon(cv, size) {
    cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr);
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, size, size);
    art('drawCoin', c, size / 2, size / 2, size * 0.42);
  }

  // ---------- 캔 ----------
  function newCan() {
    const hard = CONFIG.canHardness[Math.min(canGrade, CONFIG.canHardness.length) - 1] || 1;
    const hp = CONFIG.hitsPerCan * hard;
    can = { grade: canGrade, maxHp: hp, hp, stage: 0, dents: [], wobble: 0, hFactor: 1, state: 'spawn', t: 0 };
  }
  function targetFactor(stage) { return 1 - (1 - CONFIG.flatHeightRatio) * (stage / CONFIG.crushStages); }
  function stageFor(c) {
    if (c.hp <= 1e-6) return CONFIG.crushStages;
    const ratio = 1 - c.hp / c.maxHp;
    return Math.max(0, Math.min(CONFIG.crushStages - 1, Math.ceil(ratio * CONFIG.crushStages - 1e-9)));
  }
  function canH() { return L.baseH * can.hFactor; }
  function canTop() { return L.bottomY - canH(); }
  function zoneH() { return Math.max(canH() * CONFIG.topZoneRatio, CONFIG.topZoneMinPx); }

  // 판정: 'good'(윗부분) | 'bad'(옆·가운데) | null(캔 밖)
  function judge(x, y) {
    if (!can || can.state !== 'ready') return null;
    if (Math.abs(x - L.cx) > L.canW / 2 + CONFIG.hitSlopPx) return null;
    const top = canTop(), z = zoneH();
    if (y >= top - CONFIG.hitSlopPx && y <= top + z) return 'good';
    if (y > top + z && y <= L.bottomY + CONFIG.hitSlopPx) return 'bad';
    return null;
  }

  // ---------- 좋은 자리 띠·망치 대기 자리 ----------
  function zonePadX() { const a = A() && A().ART; return (a && a.zone && a.zone.padX) || 14; }
  function zoneScaleAmp() { const a = A() && A().ART; return (a && a.zone && a.zone.scaleAmp) || 0.08; }
  function zoneBumpSec() { return Math.max(CONFIG.zoneBumpSec, 1 / CONFIG.pulseHzMax); } // 한 번 커졌다 작아지기도 상한 적용
  // 띠가 가장 커졌을 때의 반폭 (박동 + 나쁜 타격 커짐 포함)
  function zoneHalfMax() { return (L.canW / 2 + zonePadX()) * (1 + zoneScaleAmp() + CONFIG.zoneBumpScale); }
  // 대기 망치: 머리 중심이 띠 왼쪽 바깥, 높이는 띠 위쪽. 반환값은 hammerPose가 쓰는 "손가락 자리"(머리 아랫면)
  // top = 캔 윗면 (기본: 지금 캔)
  function idleHead(top) {
    const hs = L.hammerSize, a = Math.abs(CONFIG.hammerIdleAngle);
    const fr = CONFIG.hammerFaceRatio; // 머리 높이의 절반 = 폭 × fr
    const headHalfW = 0.5 * hs * Math.cos(a) + fr * hs * Math.sin(a);
    const headHalfH = 0.5 * hs * Math.sin(a) + fr * hs * Math.cos(a);
    let hx = L.cx - zoneHalfMax() - CONFIG.hammerIdleGapPx - headHalfW;
    hx = Math.max(headHalfW + 4, hx); // 머리는 화면 안 (손잡이는 아주 좁은 화면에서만 왼쪽 끝이 잘릴 수 있음)
    const t = top == null ? canTop() : top;
    let hy = t + Math.max((L.bottomY - t) * CONFIG.topZoneRatio, CONFIG.topZoneMinPx) * 0.35;
    hy = Math.max(CONFIG.hudHeightPx + headHalfH, hy);
    return { hx, hy, headHalfW, headHalfH };
  }
  function idleHammerPoint() {
    const h = idleHead();
    return { x: h.hx, y: h.hy + L.hammerSize * CONFIG.hammerFaceRatio + CONFIG.hammerLiftPx };
  }
  // 대기 망치(머리 + 아래 왼쪽으로 뻗은 손잡이)가 차지하는 상자. 위아래 움직임 4px 포함
  function idleHammerBox(top) {
    const h = idleHead(top), hs = L.hammerSize, a = Math.abs(CONFIG.hammerIdleAngle);
    const reach = 1.6 * hs, knob = 0.22 * hs; // art.js: 손잡이 끝 = 머리 중심에서 1.6×폭, 끝 동그라미 반지름 ≈ 0.2×폭
    return { l: h.hx - reach * Math.cos(a) - knob, r: h.hx + h.headHalfW,
      t: h.hy - h.headHalfH - 4, b: h.hy + reach * Math.sin(a) + knob + 4 };
  }

  function keyAimPoint() {
    const top = canTop(), z = zoneH();
    if (keyAim === 'top') return { x: L.cx, y: top + Math.min(z, canH()) * 0.4 };
    const lo = Math.min(top + z, L.bottomY);
    return { x: L.cx, y: lo + (L.bottomY - lo) * 0.5 };
  }

  // ---------- 타격 ----------
  function strike(x, y, mult, charged) {
    ham.strikeT = 0; ham.sx = x; ham.sy = y;
    const zone = judge(x, y);
    if (!zone) return; // 캔 밖: 망치만 허공에 휘두름
    const power = (mult - 1) / Math.max(0.0001, CONFIG.chargeMaxMultiplier - 1);
    const hp = CONFIG.hammerPower[hammer - 1] || 1;
    const amount = (zone === 'good' ? CONFIG.goodHitValue : CONFIG.badHitValue) * hp * mult;
    can.hp = Math.max(0, can.hp - amount);
    can.wobble = 1;
    const top = canTop(), h = canH();
    const dent = zone === 'good'
      ? { y: 0.06 + Math.random() * 0.12, side: Math.random() < 0.5 ? -1 : 1, depth: Math.min(1, 0.2 + 0.15 * amount) }
      : { y: Math.max(0.05, Math.min(0.95, (y - top) / h)), side: x < L.cx ? -1 : 1, depth: Math.min(1, 0.3 + 0.2 * amount) };
    can.dents.push(dent);
    if (can.dents.length > CONFIG.maxDents) can.dents.shift();
    can.stage = stageFor(can);

    const hitY = Math.max(top, Math.min(L.bottomY, y));
    const willFlat = can.hp <= 1e-6; // 납작해지는 한 방은 flatten()의 "쾅"만 낸다(소리 겹침 방지)
    if (zone === 'good') {
      const pop = { text: charged ? '쾅!' : '뿅!', px: CONFIG.goodPopPx, fill: '#FFD23F', scale: charged ? 1.1 + 0.3 * power : 1,
        sub: '잘 쳤어!', subPx: CONFIG.goodSubPx, stars: CONFIG.goodHitStars };
      addPop(x, hitY, pop);
      if (charged) {
        if (!willFlat) SFX.bang(power);
        addShake(CONFIG.shakeChargeMinPx + (CONFIG.shakeChargeMaxPx - CONFIG.shakeChargeMinPx) * power, CONFIG.shakeChargeSec);
        spawnDebris(x, hitY, Math.round(CONFIG.debrisTap + (CONFIG.debrisChargeMax - CONFIG.debrisTap) * power));
      } else {
        if (!willFlat) SFX.boing();
        addShake(CONFIG.shakeTapPx, CONFIG.shakeTapSec);
        spawnDebris(x, hitY, CONFIG.debrisTap);
      }
      if (tutorialGood < CONFIG.tutorialGoodHits) {
        tutorialGood++;
        if (tutorialGood >= CONFIG.tutorialGoodHits) tutorialFade = CONFIG.tutorialFadeSec;
      }
    } else {
      if (!willFlat) SFX.ting();
      const hint = badHintsShown < CONFIG.badHintCount;
      if (hint) badHintsShown++;
      addPop(x, hitY, { text: '팅', px: CONFIG.badPopPx, fill: '#B8BEC6', scale: 1,
        sub: hint ? '윗부분을 쳐 봐!' : '', subPx: CONFIG.badSubPx, stars: 0 });
      zoneBumpT = 0; // 좋은 자리 띠가 한 번 부드럽게 커졌다 작아짐
      addShake(CONFIG.shakeBadPx, CONFIG.shakeTapSec);
      spawnDebris(x, hitY, CONFIG.debrisBad, 'bit');
    }
    if (can.hp <= 1e-6) flatten();
  }

  function flatten() {
    can.state = 'flat'; can.stage = CONFIG.crushStages;
    SFX.bang(1);
    addShake(CONFIG.shakeFlatPx, CONFIG.shakeFlatSec);
    spawnDebris(L.cx, L.bottomY - L.baseH * CONFIG.flatHeightRatio, CONFIG.debrisFlat);
    score += CONFIG.pointsPerCan;
    if (score > best) { best = score; store.set('best', best); }
    coins += CONFIG.coinsPerCan; store.set('coins', coins);
    launchCoins();
    toastPending = true; // 코인이 HUD에 다 들어간 뒤 "살 수 있는 물건 없음 → 있음"인지 확인
    cansCrushed++;
    if (cansCrushed % CONFIG.cansPerGradeUp === 0 && canGrade < CONFIG.maxCanGrade) { canGrade++; gradeUpPending = true; }
    respawnIn = CONFIG.respawnDelaySec;
    if (!goalShown && score >= CONFIG.goalScore) {
      goalShown = true;
      burstConfetti();
      SFX.fanfare();
      hurrayT = 0;
      goalOpenIn = CONFIG.goalPanelDelaySec;
    }
    renderHud();
  }

  // ---------- 연출 ----------
  function addShake(amp, dur) {
    const remain = shake.dur > 0 ? shake.amp * Math.max(0, 1 - shake.t / shake.dur) : 0;
    if (amp >= remain) shake = { amp, dur, t: 0 };
  }
  // 타격 글자: 동시에 최대 popMaxVisible개. 새 글자가 나오면 옛 글자는 popOldFadeSec 안에 사라짐.
  // 자리는 addPop 설명 참고: 캔 오른쪽 → 캔 왼쪽 → 친 자리 위·아래 순, popAvoidBoxes의 상자(망치·말풍선)와 겹치지 않게.
  // 글자 묶음이 차지하는 가장 큰 상자(가운데 기준 hw=반폭, up=위, down=아래).
  // art.js drawHitPop과 같은 비율: 처음 1.2배 확대, 별 = 가운데에서 0.95×글자크기 + 별 반지름 0.18×글자크기(= 1.13배),
  // 외곽선 = 글자크기 × 0.2 (양쪽 절반씩). 글자 폭은 measureText로 실제로 잰다.
  const POP_GROW_MAX = 1.2; // draw()의 grow 최댓값과 같음
  function textW(text, px, weight) {
    const lib = A();
    ctx.save();
    ctx.font = weight + ' ' + Math.round(px) + 'px ' + ((lib && lib.ART && lib.ART.font) || 'system-ui, sans-serif');
    const w = ctx.measureText(String(text)).width;
    ctx.restore();
    return w;
  }
  function popExtent(o, scale) {
    const fs = o.px * scale * POP_GROW_MAX;
    let hw = textW(o.text, fs, 900) / 2 + fs * 0.1;
    let up = fs * 0.6, down = fs * 0.6;
    if (o.stars) { hw = Math.max(hw, fs * 1.13); up = Math.max(up, fs * (0.95 * 0.75 + 0.18)); }
    if (o.sub) {
      const ss = o.subPx * Math.min(scale * POP_GROW_MAX, 1.1);
      const sw = Math.max(4, ss * 0.24);
      hw = Math.max(hw, textW(o.sub, ss, 800) / 2 + sw / 2);
      down = fs * 0.5 + ss * 1.25 + sw / 2;
    }
    return { hw: hw + 4, up: up + 4 + CONFIG.popRisePx, down: down + 4 };
  }
  // 타격 순간 망치 머리가 있을 수 있는 가장 큰 상자 (꾹으로 젖힌 자세 ~ 내려친 자세 모두 포함)
  function hammerHeadBox(hitX, hitY) {
    const hs = L.hammerSize, half = hs * 0.65; // 회전한 머리 반폭 최대 ≈ 0.64×폭
    const top = hitY - hs * CONFIG.hammerFaceRatio - (CONFIG.hammerLiftPx + hs * 0.3) - half;
    return { l: hitX - half, r: hitX + half, t: top, b: hitY + 4 };
  }
  // 친 뒤 손가락 자리에 남는 망치 손잡이(머리 왼쪽, 평소 각도 -0.3 ~ 내려친 0, 여유로 -0.5까지)
  function hammerHandleBox(hitX, hitY) {
    const hs = L.hammerSize;
    const hc = hitY - hs * CONFIG.hammerFaceRatio - CONFIG.hammerLiftPx; // 머리 중심
    return { l: hitX - 1.6 * hs - 0.25 * hs, r: hitX - 0.3 * hs, t: hc - 0.25 * hs, b: hc + 1.6 * hs * Math.sin(0.5) + 0.25 * hs };
  }
  // ---- 타격 글자가 피해야 하는 상자 목록 (한 곳에서 관리) ----
  // 망치 머리·손잡이(친 자리), 대기 망치(머리+손잡이), 첫 판 큰 말풍선·화살표, 작은 "여기!" 말풍선·화살표.
  // 캔이 찌그러지며 말풍선·대기 망치가 내려오므로 지금 캔 윗면과 이번 타격 뒤 목표 윗면 둘 다 넣는다.
  function popAvoidBoxes(hitX, hitY) {
    const boxes = [hammerHeadBox(hitX, hitY), hammerHandleBox(hitX, hitY)];
    const tops = [canTop()];
    if (can) tops.push(L.bottomY - L.baseH * targetFactor(can.stage));
    const lib = A();
    const tutA = tutorialAlpha();
    for (const top of tops) {
      boxes.push(idleHammerBox(top));
      if (!lib) continue;
      const bandTop = top - CONFIG.hitSlopPx;
      if (tutA > 0 && typeof lib.tutorialHintRects === 'function') {
        const r = lib.tutorialHintRects(ctx, L.cx, bandTop, tutorialHintOpts(0));
        boxes.push(r[0], r[1]);
      }
      // 작은 "여기!" 말풍선은 항상 넣는다 (안내가 끝나는 타격 직후 글자가 보이는 동안 다시 나타나므로)
      if (typeof lib.zoneBubbleRects === 'function') {
        const r = lib.zoneBubbleRects(ctx, L.cx, top, { slopPx: CONFIG.hitSlopPx });
        boxes.push(r[0], r[1]);
      }
    }
    return boxes;
  }
  function boxHit(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }
  // 타격 글자 자리: 세로줄(① 캔 오른쪽 바깥 → ② 캔 왼쪽 바깥 → ③ 친 자리 위)마다
  // 피할 상자와 겹치지 않는 높이를 친 높이에서 가까운 순으로 찾는다. 모두 안 되면 글자를 0.9~0.5배로 줄여 다시.
  function addPop(hitX, hitY, o) {
    for (const p of popups) if (p.fade < 0 || p.fade > CONFIG.popOldFadeSec) p.fade = CONFIG.popOldFadeSec;
    while (popups.length >= Math.max(1, CONFIG.popMaxVisible)) popups.shift();
    const avoid = popAvoidBoxes(hitX, hitY);
    const head = avoid[0], handle = avoid[1];
    const canRight = L.cx + L.canW / 2 + CONFIG.hitSlopPx, canLeft = L.cx - L.canW / 2 - CONFIG.hitSlopPx;
    const gap = CONFIG.popGapPx, minY = CONFIG.hudHeightPx;
    function fitColumn(x, e) {
      if (x - e.hw < 8 || x + e.hw > W - 8) return null;
      const lo = minY + e.up, hi = H - 8 - e.down; // 글자 가운데 y가 들어갈 수 있는 범위
      if (lo > hi) return null;
      const y0 = Math.max(lo, Math.min(hi, hitY));
      const ys = [y0];
      for (const b of avoid) {
        if (b.l >= x + e.hw || b.r <= x - e.hw) continue; // 이 세로줄과 안 겹치는 상자
        ys.push(b.t - gap - e.down, b.b + gap + e.up);
      }
      ys.sort((p, q) => Math.abs(p - y0) - Math.abs(q - y0));
      for (const y of ys) {
        if (y < lo || y > hi) continue;
        const box = { l: x - e.hw, r: x + e.hw, t: y - e.up, b: y + e.down };
        if (!avoid.some((b) => boxHit(box, b))) return y;
      }
      return null;
    }
    function place(scale) {
      const e = popExtent(o, scale);
      const cols = [
        Math.max(canRight, head.r) + gap + e.hw, // ① 오른쪽
        Math.min(canLeft, head.l, handle.l) - gap - e.hw, // ② 왼쪽 (망치 손잡이보다 더 왼쪽)
        Math.max(e.hw + 8, Math.min(W - e.hw - 8, hitX)) // ③ 친 자리 위·아래
      ];
      for (const x of cols) {
        const y = fitColumn(x, e);
        if (y != null) return { x, y, scale };
      }
      return null;
    }
    const s0 = o.scale || 1;
    let pos = place(s0);
    for (let k = 0.9; !pos && k >= 0.5; k -= 0.1) pos = place(s0 * k);
    if (!pos) { // 마지막(계산상 세 화면 크기에서는 나오지 않음): 오른쪽 끝에 붙임
      const e = popExtent(o, s0 * 0.5);
      pos = { x: W - e.hw - 8, y: Math.max(minY + e.up, Math.min(H - 8 - e.down, hitY)), scale: s0 * 0.5 };
    }
    popups.push(Object.assign({ t: 0, fade: -1 }, o, { x: pos.x, y: pos.y, scale: pos.scale }));
  }
  // 등급 배너 자리: ① HUD 아래 ~ 노란 띠 윗변(가장 커졌을 때) 사이 하늘, 안 들어가면 ② 캔 바닥 그림자 아래 식탁.
  // 배너 높이는 art.js drawBanner와 같은 식 max(1.25×글자+20, 1.6×글자), 등장 때 1.1배 커짐 + 위아래 4px 여유.
  function bannerLayout() {
    const maxFs = CONFIG.gradeBannerFontPx, minFs = CONFIG.gradeBannerMinFontPx;
    function fsFor(avail) {
      const h = (avail - 8) / 1.1; // 1.1 = easeOutBack 최대 확대, 8 = 위아래 움직임 4px × 2
      return Math.floor(Math.min(maxFs, h / 1.6, (h - 20) / 1.25));
    }
    const freshTop = L.bottomY - L.baseH; // 새 캔(찌그러지기 전) 윗면
    const bandH = zoneHFor(L.baseH) + CONFIG.hitSlopPx;
    const skyT = CONFIG.hudHeightPx + 8;
    const skyB = freshTop - CONFIG.hitSlopPx - bandH * (zoneScaleAmp() + CONFIG.zoneBumpScale) / 2 - 8;
    const tabT = L.bottomY + Math.max(6, L.canW * 0.08) + 8; // art.js 바닥 그림자 세로 반지름
    const tabB = H - 8;
    const fsSky = fsFor(skyB - skyT), fsTab = fsFor(tabB - tabT);
    if (fsSky >= minFs) return { fs: fsSky, y: (skyT + skyB) / 2 };
    if (fsTab >= minFs) return { fs: fsTab, y: (tabT + tabB) / 2 };
    return fsSky >= fsTab ? { fs: Math.max(20, fsSky), y: (skyT + skyB) / 2 } : { fs: Math.max(20, fsTab), y: (tabT + tabB) / 2 };
  }
  // 작은 가로 화면에서 말풍선을 띠 옆에 둘 때: 띠 오른쪽 끝과 꾹 게이지 위 "최대!" 글자(가장 넓은 글자) 둘 다의 오른쪽
  function tutorialSideLeft() {
    const g = L.gauge;
    const labelHalf = textW('최대!', CONFIG.chargeMaxLabelPx, 900) / 2 + CONFIG.chargeMaxLabelPx * 0.1;
    return Math.max(L.cx + zoneHalfMax(), g.x + g.w / 2 + labelHalf, g.x + g.w) + CONFIG.popGapPx;
  }
  // 첫 판 안내 설정 — 그리기(draw)와 타격 글자 피하기(popAvoidBoxes)가 같은 값을 쓴다
  function tutorialHintOpts(bob) {
    return { text: '여기를 톡!', fontPx: CONFIG.tutorialFontPx, arrowPx: CONFIG.tutorialArrowPx, bob, bobMax: CONFIG.tutorialBobPx,
      minTop: CONFIG.hudHeightPx + 4, sideLeft: tutorialSideLeft(), maxRight: W - 8 };
  }
  function zoneHFor(h) { return Math.max(h * CONFIG.topZoneRatio, CONFIG.topZoneMinPx); }
  function bannerAlpha() {
    if (!banner) return 0;
    const t = banner.t, d = CONFIG.gradeBannerSec;
    return Math.min(1, t / 0.2) * (t > d - 0.4 ? Math.max(0, (d - t) / 0.4) : 1);
  }
  function tutorialAlpha() {
    if (tutorialGood < CONFIG.tutorialGoodHits) return 1;
    return tutorialFade > 0 ? tutorialFade / CONFIG.tutorialFadeSec : 0;
  }

  function spawnDebris(x, y, n, onlyKind) {
    const kinds = ['drop', 'bubble', 'bit'];
    for (let i = 0; i < n; i++) {
      if (debris.length >= CONFIG.maxDebris) debris.shift();
      const kind = onlyKind || kinds[Math.floor(Math.random() * kinds.length)];
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = 180 + Math.random() * 260;
      const life = 0.6 + Math.random() * 0.5;
      debris.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        r: kind === 'bubble' ? 5 + Math.random() * 6 : 4 + Math.random() * 5,
        kind, color: CONFIG.debrisColors[kind], alpha: 1, rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 8, life, max: life });
    }
  }

  function burstConfetti() {
    const colors = confettiColors();
    for (let i = 0; i < CONFIG.confettiCount; i++) {
      if (confetti.length >= CONFIG.maxConfetti) confetti.shift();
      confetti.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4,
        vx: (Math.random() - 0.5) * 80, vy: 120 + Math.random() * 160,
        w: 10 + Math.random() * 8, h: 6 + Math.random() * 6, rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 8, sway: Math.random() * 6.28,
        color: colors[i % colors.length], alpha: 1 });
    }
  }

  function launchCoins() {
    const n = Math.max(1, Math.min(CONFIG.coinFlyCount, CONFIG.coinsPerCan));
    const r = coinIcon.getBoundingClientRect();
    const tx = r.width ? r.left + r.width / 2 : 40, ty = r.height ? r.top + r.height / 2 : 60;
    const base = Math.floor(CONFIG.coinsPerCan / n);
    let rest = CONFIG.coinsPerCan - base * n;
    const sy = L.bottomY - L.baseH * 0.2;
    for (let i = 0; i < n; i++) {
      const sx = L.cx + (Math.random() - 0.5) * L.canW * 0.6;
      flyingCoins.push({ sx, sy, tx, ty, kx: (sx + tx) / 2 + (Math.random() - 0.5) * 120,
        ky: Math.min(sy, ty) - 80 - Math.random() * 80,
        t: -i * CONFIG.coinFlyStaggerSec, value: base + (rest-- > 0 ? 1 : 0) });
    }
  }

  // ---------- 입력 ----------
  function startPress(x, y, kb, type) {
    pointer.active = true; pointer.kb = kb; pointer.type = type || '';
    pointer.downT = performance.now(); pointer.x = x; pointer.y = y;
  }
  function heldSec() { return (performance.now() - pointer.downT) / 1000; }
  function chargeFill() {
    if (!pointer.active) return 0;
    const s = heldSec();
    return s * 1000 < CONFIG.tapThresholdMs ? 0 : Math.min(s / CONFIG.chargeMaxSec, 1);
  }
  function release(x, y) {
    if (!pointer.active) return;
    const s = heldSec();
    pointer.active = false;
    const charged = s * 1000 >= CONFIG.tapThresholdMs;
    const mult = charged ? 1 + (CONFIG.chargeMaxMultiplier - 1) * Math.min(s / CONFIG.chargeMaxSec, 1) : 1;
    // 판정 위치 = 손을 뗀 위치. [결정 필요] 기본값 (개발 중 정한 값, GAME.md [결정 필요] 10번).
    //  망치가 손가락을 따라다니므로, 꾹 하는 동안 겨눈 곳을 옮겨 칠 수 있게 하려는 것
    strike(x, y, mult, charged);
  }
  function cancelPress() { pointer.active = false; }

  canvas.addEventListener('pointerdown', (e) => {
    if (screen !== 'play') return;
    e.preventDefault();
    hover.on = true; hover.x = e.clientX; hover.y = e.clientY; hover.type = e.pointerType; hover.lastT = time;
    aimMode = 'pointer';
    if (pointer.active) return; // 멀티터치: 첫 포인터만
    pointer.id = e.pointerId;
    startPress(e.clientX, e.clientY, false, e.pointerType);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (pointer.active && !pointer.kb && e.pointerId !== pointer.id) return;
    hover.on = true; hover.x = e.clientX; hover.y = e.clientY; hover.type = e.pointerType; hover.lastT = time;
    aimMode = 'pointer';
    if (pointer.active && !pointer.kb) { pointer.x = e.clientX; pointer.y = e.clientY; }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!pointer.active || pointer.kb || e.pointerId !== pointer.id) return;
    hover.x = e.clientX; hover.y = e.clientY; hover.lastT = time;
    if (screen === 'play') release(e.clientX, e.clientY); else cancelPress();
  });
  canvas.addEventListener('pointercancel', (e) => {
    if (pointer.active && !pointer.kb && e.pointerId === pointer.id) cancelPress();
  });
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !pointer.active) hover.on = false; });

  window.addEventListener('keydown', (e) => {
    if (screen !== 'play') return; // 시작·패널에서는 Enter/스페이스가 버튼을 누름(브라우저 기본)
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
      e.preventDefault();
      keyAim = e.code === 'ArrowUp' ? 'top' : 'mid';
      aimMode = 'key';
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat || pointer.active) return;
      aimMode = 'key';
      const p = keyAimPoint();
      startPress(p.x, p.y, true, 'key');
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code !== 'Space') return;
    if (screen === 'play') e.preventDefault();
    if (pointer.active && pointer.kb) {
      if (screen !== 'play') { cancelPress(); return; }
      const p = keyAimPoint();
      release(p.x, p.y);
    }
  });

  // ---------- 화면 전환 ----------
  function blurAll() { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
  function setScreen(s) {
    screen = s;
    startEl.hidden = s !== 'start';
    panelEl.hidden = s !== 'panel';
    hudLeft.hidden = s !== 'play';
    pauseBtn.hidden = s !== 'play';
  }
  function goPlay() { cancelPress(); setScreen('play'); blurAll(); renderHud(); }
  function openPanel(hurray) {
    cancelPress();
    setScreen('panel');
    hurrayTitle.hidden = !hurray;
    setGiftBadge(false); hideToast(); // 상점(패널)을 열었으니 🎁 표시 제거
    panelInfo.textContent = '⭐ 지금 ' + score + '점 · 최고 ' + best + '점';
    renderShop();
    panelEl.scrollTop = 0;
    try { continueBtn.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
  }
  function restart() {
    score = 0; canGrade = 1; cansCrushed = 0; goalShown = false;
    goalOpenIn = -1; hurrayT = -1; respawnIn = -1; gradeUpPending = false;
    debris = []; popups = []; confetti = [];
    banner = null; zoneBumpT = -1; chargeFullT = -1;
    newCan();
    goPlay();
  }

  startBtn.addEventListener('click', goPlay);
  continueBtn.addEventListener('click', goPlay);
  restartBtn.addEventListener('click', restart);
  pauseBtn.addEventListener('click', () => { openPanel(false); });
  function renderSound() { soundBtn.textContent = soundOn ? '🔊 소리' : '🔇 조용'; }
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn; SFX.setOn(soundOn); store.set('sound', soundOn ? 'on' : 'off'); renderSound();
    if (screen === 'play') blurAll();
  });

  function renderHud() {
    scoreEl.textContent = '⭐ ' + score + '점';
    coinTextEl.textContent = '코인 ' + coinsShown;
  }

  // ---------- 상점 알림 (🎁) ----------
  function canBuyAny() {
    for (let g = 1; g <= CONFIG.hammerPrices.length; g++) {
      if (ownedHammers.indexOf(g) < 0 && CONFIG.hammerPrices[g - 1] <= coins) return true;
    }
    for (const sk of skinList()) if (ownedSkins.indexOf(sk.id) < 0 && CONFIG.skinPrice <= coins) return true;
    return false;
  }
  function setGiftBadge(on) {
    pauseBadge.hidden = !on;
    pauseBtn.setAttribute('aria-label', on ? '쉬기, 상점에 살 수 있는 물건이 있어요' : '쉬기');
  }
  function showShopToast() {
    // 금액은 지금 코인 수. 처음 시작(코인 0)이면 캔 2개 = 20코인이라 "🎁 코인 20개! 쉬기에서 상점을 열어 봐" 그대로 나옴
    toastEl.textContent = '🎁 코인 ' + coins + '개! 쉬기에서 상점을 열어 봐';
    toastCount++;
    toastEl.classList.toggle('low', tutorialAlpha() > 0);
    toastEl.classList.add('show');
    toastHideIn = CONFIG.shopToastSec;
    setGiftBadge(true);
  }
  function hideToast() { toastEl.classList.remove('show'); toastHideIn = -1; }

  // ---------- 상점 ----------
  function makeCard(item, name, info, priceText, state, need, onClick) {
    const card = document.createElement('div');
    card.className = 'card' + (state === 'equipped' ? ' on' : '');
    const cv = document.createElement('canvas');
    cv.width = Math.round(80 * dpr); cv.height = Math.round(80 * dpr);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    art('drawShopIcon', c, 40, 40, 80, item);
    const nm = document.createElement('div'); nm.className = 'name'; nm.textContent = name;
    const inf = document.createElement('div'); inf.className = 'info'; inf.textContent = info;
    const pr = document.createElement('div'); pr.className = 'price'; pr.textContent = priceText;
    const b = document.createElement('button'); b.className = 'btn';
    if (state === 'equipped') { b.textContent = '✅ 끼움'; b.disabled = true; }
    else if (state === 'owned') { b.textContent = '👉 끼우기'; }
    else if (need > 0) { b.textContent = '코인 ' + need + '개 더 모아요'; b.disabled = true; }
    else { b.textContent = '🎁 사기'; }
    b.addEventListener('click', onClick);
    card.appendChild(cv); card.appendChild(nm); card.appendChild(inf); card.appendChild(pr); card.appendChild(b);
    return card;
  }

  function renderShop() {
    shopCoinText.textContent = '코인 ' + coins;
    hammerCards.textContent = '';
    hammerList().forEach((hm, i) => {
      const grade = hm.grade || i + 1;
      if (grade > CONFIG.hammerPrices.length) return;
      const price = CONFIG.hammerPrices[grade - 1];
      const owned = ownedHammers.indexOf(grade) >= 0;
      const state = hammer === grade ? 'equipped' : owned ? 'owned' : 'shop';
      const priceText = owned ? (price === 0 ? '처음부터 있어요' : '내 거예요') : price + '코인';
      const info = '힘 ' + (CONFIG.hammerPower[grade - 1] || 1) + '배';
      hammerCards.appendChild(makeCard({ type: 'hammer', grade }, hm.name || ('망치 ' + grade), info, priceText,
        state, owned ? 0 : price - coins, () => {
          if (!owned) {
            if (coins < price) return;
            coins -= price; coinsShown = Math.min(coinsShown, coins);
            ownedHammers.push(grade); ownedHammers.sort();
          }
          hammer = grade; saveShop(); renderShop(); renderHud();
        }));
    });
    skinCards.textContent = '';
    skinCards.appendChild(makeCard({ type: 'skin', id: null, grade: hammer }, '무늬 없음', '', '', skin ? 'owned' : 'equipped', 0,
      () => { skin = null; saveShop(); renderShop(); }));
    skinList().forEach((sk) => {
      const owned = ownedSkins.indexOf(sk.id) >= 0;
      const state = skin === sk.id ? 'equipped' : owned ? 'owned' : 'shop';
      skinCards.appendChild(makeCard({ type: 'skin', id: sk.id, grade: hammer },(sk.emoji ? sk.emoji + ' ' : '') + sk.name,
        '힘은 그대로', owned ? '내 거예요' : CONFIG.skinPrice + '코인', state,
        owned ? 0 : CONFIG.skinPrice - coins, () => {
          if (!owned) {
            if (coins < CONFIG.skinPrice) return;
            coins -= CONFIG.skinPrice; coinsShown = Math.min(coinsShown, coins);
            ownedSkins.push(sk.id);
          }
          skin = sk.id; saveShop(); renderShop(); renderHud();
        }));
    });
    couldBuy = canBuyAny(); // 물건을 사서 코인이 줄면, 다음에 다시 살 수 있게 될 때 알림이 또 나옴
  }

  // ---------- 갱신 ----------
  function easeOutBack(p) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); }

  function update(dt) {
    time += dt;
    const playing = screen === 'play';

    if (can) {
      const tf = targetFactor(can.stage);
      can.hFactor += (tf - can.hFactor) * (1 - Math.exp(-CONFIG.canHeightEase * dt));
      can.wobble = Math.max(0, can.wobble - dt / CONFIG.wobbleSec);
      if (can.state === 'spawn') {
        can.t += dt;
        if (can.t >= CONFIG.spawnAnimSec) can.state = 'ready';
      }
    }
    if (playing && respawnIn >= 0) {
      respawnIn -= dt;
      if (respawnIn < 0) {
        newCan();
        if (gradeUpPending) {
          gradeUpPending = false;
          banner = { grade: canGrade, t: 0 }; // 전용 배너 (이전: 0.7초짜리 팝 글자)
        }
      }
    }
    if (banner) { banner.t += dt; if (banner.t > CONFIG.gradeBannerSec) banner = null; }
    if (tutorialFade > 0) tutorialFade = Math.max(0, tutorialFade - dt);
    if (zoneBumpT >= 0) { zoneBumpT += dt; if (zoneBumpT > zoneBumpSec()) zoneBumpT = -1; }
    if (playing && chargeFill() >= 1) chargeFullT = chargeFullT < 0 ? 0 : chargeFullT + dt; else chargeFullT = -1;
    if (toastHideIn >= 0) { toastHideIn -= dt; if (toastHideIn < 0) hideToast(); }
    if (toastPending && !flyingCoins.length) {
      toastPending = false;
      const now = canBuyAny();
      if (now && !couldBuy && screen === 'play' && goalOpenIn < 0) showShopToast();
      else if (now && !couldBuy) setGiftBadge(true);
      couldBuy = now;
    }
    if (goalOpenIn >= 0) {
      goalOpenIn -= dt;
      if (goalOpenIn < 0) openPanel(true);
    }
    if (hurrayT >= 0) { hurrayT += dt; if (hurrayT > CONFIG.goalPanelDelaySec) hurrayT = -1; }

    // 망치 위치
    let tx, ty;
    if (aimMode === 'pointer' && !pointer.active && hover.type !== 'mouse' && time - hover.lastT > CONFIG.hammerIdleDelaySec) aimMode = 'idle';
    if (aimMode === 'pointer' && hover.type === 'mouse' && !hover.on && !pointer.active) aimMode = 'idle';
    if (pointer.active) { tx = pointer.kb ? keyAimPoint().x : pointer.x; ty = pointer.kb ? keyAimPoint().y : pointer.y; }
    else if (aimMode === 'pointer') { tx = hover.x; ty = hover.y; }
    else if (aimMode === 'key') { const p = keyAimPoint(); tx = p.x; ty = p.y; }
    else {
      // 좋은 자리 띠 왼쪽 옆(띠·"여기!" 말풍선과 겹치지 않는 곳)에서 젖힌 채 대기
      const p = idleHammerPoint();
      tx = p.x; ty = p.y + Math.sin(time * 2.4) * 4; // 2.4rad/s ≈ 0.38Hz
    }
    const isIdle = aimMode === 'idle' && !pointer.active && ham.strikeT < 0;
    ham.idle += ((isIdle ? 1 : 0) - ham.idle) * (1 - Math.exp(-CONFIG.hammerIdleBlend * dt));
    if (!ham.init) { ham.x = tx; ham.y = ty; ham.init = true; }
    const k = 1 - Math.exp(-CONFIG.hammerFollow * dt);
    ham.x += (tx - ham.x) * k; ham.y += (ty - ham.y) * k;
    if (ham.strikeT >= 0) { ham.strikeT += dt; if (ham.strikeT > CONFIG.hammerStrikeSec) ham.strikeT = -1; }

    if (shake.dur > 0) { shake.t += dt; if (shake.t >= shake.dur) shake = { amp: 0, dur: 0, t: 0 }; }

    for (let i = debris.length - 1; i >= 0; i--) {
      const p = debris[i];
      p.life -= dt;
      if (p.life <= 0) { debris.splice(i, 1); continue; }
      p.vy += (p.kind === 'bubble' ? -CONFIG.debrisGravity * 0.15 : CONFIG.debrisGravity) * dt;
      if (p.kind === 'bubble') p.vx *= 0.96;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      p.alpha = Math.max(0, p.life / p.max);
    }
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.sway += dt * 3;
      p.x += (p.vx + Math.sin(p.sway) * 40) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > H + 30) confetti.splice(i, 1);
    }
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.t += dt;
      if (p.fade >= 0) p.fade -= dt;
      if (p.t > CONFIG.popTextSec || (p.fade !== -1 && p.fade <= 0)) popups.splice(i, 1);
    }
    for (let i = flyingCoins.length - 1; i >= 0; i--) {
      const c = flyingCoins[i];
      c.t += dt;
      if (c.t >= CONFIG.coinFlySec) {
        coinsShown = Math.min(coins, coinsShown + c.value);
        flyingCoins.splice(i, 1);
        SFX.coin();
        renderHud();
      }
    }
    if (!flyingCoins.length && coinsShown !== coins) { coinsShown = coins; renderHud(); }
  }

  // ---------- 그리기 ----------
  function hammerPose() {
    const rest = CONFIG.hammerRestAngle, lift = CONFIG.hammerLiftPx;
    if (ham.strikeT >= 0) {
      const p = ham.strikeT / CONFIG.hammerStrikeSec;
      if (p < 0.35) { const q = p / 0.35; return { x: ham.sx, y: ham.sy, a: ham.fromAngle * (1 - q), lift: ham.fromLift * (1 - q) }; }
      const q = (p - 0.35) / 0.65;
      return { x: ham.sx, y: ham.sy, a: rest * q * q, lift: lift * q * q };
    }
    const f = chargeFill();
    let a = rest + (CONFIG.hammerChargeAngle - rest) * f;
    a += (CONFIG.hammerIdleAngle - a) * ham.idle; // 대기 중에는 젖힌 자세
    let x = ham.x;
    if (chargeFullT >= 0) { // 꾹 최대: 위치만 살짝 좌우로 떨림 (밝기·투명도 변화 없음, 속도 상한 적용)
      const w = Math.sin(Math.PI * 2 * hz(CONFIG.chargeMaxTrembleHz) * chargeFullT);
      x += w * CONFIG.chargeMaxTremblePx;
      a += w * 0.04;
    }
    return { x, y: ham.y, a, lift: lift + f * L.hammerSize * 0.3 };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    art('drawBackground', ctx, W, H, L.bottomY);

    const amp = shake.dur > 0 ? shake.amp * (1 - shake.t / shake.dur) : 0;
    ctx.save();
    if (amp > 0) ctx.translate((Math.random() * 2 - 1) * amp, (Math.random() * 2 - 1) * amp);

    if (can) {
      let w = L.canW, h = canH();
      if (can.state === 'spawn') { const s = Math.max(0.05, easeOutBack(Math.min(1, can.t / CONFIG.spawnAnimSec))); w *= s; h *= s; }
      art('drawCan', ctx, L.cx, L.bottomY, w, h, {
        color: CONFIG.canColors[can.grade - 1] || CONFIG.canColors[0], grade: can.grade,
        stage: can.stage, dents: can.dents, wobble: can.wobble,
        wobbleHz: hz(CONFIG.canWobbleHz), wobbleT: (1 - can.wobble) * CONFIG.wobbleSec }); // 기우뚱 속도도 상한 적용, 맞은 순간부터 위상 시작
      if (can.state === 'ready' && screen !== 'start') {
        const tutA = screen === 'play' ? tutorialAlpha() : 0;
        const bump = zoneBumpT >= 0 ? Math.sin(Math.PI * Math.min(1, zoneBumpT / zoneBumpSec())) : 0;
        art('drawTopZone', ctx, L.cx, canTop(), L.canW, zoneH(), {
          phase: time * hz(CONFIG.pulseHz), // 속도는 여기 한 곳에서만 곱하고 상한(pulseHzMax)을 넘지 않게 고정
          bump, bumpScale: CONFIG.zoneBumpScale, fillAlpha: CONFIG.zoneFillAlpha, alphaMin: CONFIG.zonePulseAlphaMin,
          borderPx: CONFIG.zoneBorderPx, starPx: CONFIG.zoneStarPx, slopPx: CONFIG.hitSlopPx,
          bubbleAlpha: (1 - tutA) * (1 - bannerAlpha()) }); // 안내·배너가 보일 때는 작은 "여기!" 말풍선을 부드럽게 숨김
        if (tutA > 0) {
          const bob = (1 - Math.cos(Math.PI * 2 * hz(CONFIG.tutorialBobHz) * time)) / 2 * CONFIG.tutorialBobPx;
          const bandTop = canTop() - CONFIG.hitSlopPx;
          art('drawTutorialHint', ctx, L.cx, bandTop, Object.assign(tutorialHintOpts(bob), { alpha: tutA }));
        }
      }
    }
    if (screen === 'play' && chargeFill() > 0) {
      const g = L.gauge;
      const full = chargeFullT >= 0;
      const ls = full ? 0.6 + 0.4 * Math.min(1, easeOutBack(Math.min(1, chargeFullT / 0.25))) : 1; // 한 번 커지며 등장
      art('drawGauge', ctx, g.x, g.y, g.w, g.h, chargeFill(), full
        ? { label: '최대!', labelPx: CONFIG.chargeMaxLabelPx, labelFill: '#FFD23F', labelScale: ls } : null);
    }
    for (const p of debris) art('drawDebris', ctx, p);
    for (const p of popups) {
      const t = p.t, d = CONFIG.popTextSec;
      const grow = t < 0.15 ? 0.6 + 0.6 * (t / 0.15) : t < 0.3 ? 1.2 - 0.2 * ((t - 0.15) / 0.15) : 1;
      let alpha = t > d * 0.6 ? Math.max(0, 1 - (t - d * 0.6) / (d * 0.4)) : 1;
      if (p.fade >= 0) alpha *= Math.max(0, p.fade / CONFIG.popOldFadeSec); // 새 글자가 나오면 빨리 사라짐
      art('drawHitPop', ctx, p.x, p.y - Math.min(1, t / d) * CONFIG.popRisePx, {
        text: p.text, px: p.px, fill: p.fill, sub: p.sub, subPx: p.subPx, stars: p.stars, scale: grow * p.scale, alpha });
    }
    if (screen === 'play') {
      const hp = hammerPose();
      // (hp.x, hp.y) = 손가락(판정 위치). 머리 아랫면(때리는 면)이 그곳에 닿도록 머리 중심을 위로 올려 그림
      if (ham.strikeT < 0) { ham.fromAngle = hp.a; ham.fromLift = hp.lift; }
      const headY = hp.y - L.hammerSize * CONFIG.hammerFaceRatio - hp.lift;
      art('drawHammer', ctx, hp.x, headY, L.hammerSize, hp.a, { grade: hammer, skin: skin });
    }
    ctx.restore();

    if (banner && screen === 'play') {
      const t = banner.t;
      const sc = easeOutBack(Math.min(1, t / 0.35));
      const alpha = bannerAlpha(); // 한 번 나타나고 한 번 사라짐
      const bob = Math.sin(Math.PI * 2 * hz(CONFIG.gradeBannerBobHz) * t) * 4;
      const bl = bannerLayout();
      art('drawBanner', ctx, W, bl.y + bob, { text: '캔이 더 단단해졌어!', grade: banner.grade,
        color: CONFIG.canColors[banner.grade - 1] || CONFIG.canColors[0], fontPx: bl.fs, maxW: W - 32, scale: Math.max(0.05, sc), alpha });
    }

    for (const c of flyingCoins) {
      if (c.t < 0) continue;
      const p = Math.min(1, c.t / CONFIG.coinFlySec), q = 1 - p;
      const x = q * q * c.sx + 2 * q * p * c.kx + p * p * c.tx;
      const y = q * q * c.sy + 2 * q * p * c.ky + p * p * c.ty;
      art('drawCoin', ctx, x, y, CONFIG.coinRadiusPx * (1 - 0.3 * p));
    }

    // 위 레이어(꽃가루·"오예!"): 패널 위에도 보이게 별도 캔버스. 터치는 통과.
    fxc.clearRect(0, 0, W, H);
    for (const p of confetti) art('drawConfetti', fxc, p);
    if (hurrayT >= 0) art('drawHurray', fxc, W, H, hurrayT);
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    update(dt); draw();
    requestAnimationFrame(loop);
  }

  // ---------- 시작 ----------
  window.addEventListener('resize', resize);
  resize();
  newCan();
  can.state = 'ready'; // 시작 화면의 캔은 등장 애니메이션 없이 — 커지는 순간 제목·버튼과 겹치지 않게
  renderSound();
  renderHud();
  bestStart.textContent = best > 0 ? '최고 점수 ⭐ ' + best + '점' : '';
  couldBuy = canBuyAny();
  setGiftBadge(couldBuy); // [결정 필요] 기본값: 시작할 때 이미 살 수 있는 물건이 있으면 🎁 표시만(알림 글자는 없음)
  setScreen('start');
  layoutStart();
  try { startBtn.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
  requestAnimationFrame(loop);
})();
