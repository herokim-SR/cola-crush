/* 콜라 박살내기 — 게임 그림 전부 (Canvas 코드, 직접 제작, 외부 파일 0개)
 * 일반 <script>로 로드(모듈 아님, file:// 동작). 전역은 window.CanArt 하나만.
 * 아이 요청: 캔에 표정(눈·입·얼굴) 절대 없음. 그냥 물건으로 그린다.
 * 성능: 매 프레임 호출 — 그라디언트·shadowBlur 사용 안 함. 폰트는 system-ui만.
 */
(function () {
  'use strict';

  // ===== 그림 수치 (출처 태그는 GAME.md 규칙) =====
  const ART = {
    ink: '#111111',                    // (기본값: 만화풍 검정 외곽선)
    outline: 4,                        // (기본값: GAME.md 아트 리스크 1 — 주황 캔·연하늘 벽 대비 1.8:1이라 4px 필수)
    font: 'system-ui, sans-serif',     // (기본값: kid-safety 외부 폰트 금지)
    silver: '#C9D1D9',                 // (기본값: 은색 뚜껑, 밝은 회색)
    silverDark: '#8C96A0',             // (기본값: 뚜껑 홈·따개 선)

    bg: {
      wall: '#BFE9FF',                 // (기본값: 템플릿 연하늘 벽)
      table: '#F2C894',                // [결정 필요] 기본값 식탁 나무색
      tableEdge: '#B9783C',            // (기본값: 식탁 모서리 선, 나무색보다 진하게)
      grain: '#DFA865',                // (기본값: 나뭇결, 식탁보다 약간 진하게)
      grainLines: 5,                   // (기본값: 나뭇결 몇 줄)
    },

    can: {
      bulge: 0.12,                     // (기본값: 찌그러질수록 옆으로 퍼지는 비율, 5단계에서 +12%)
      lidRy: 0.11,                     // (기본값: 윗뚜껑 타원 세로 = 캔 폭 × 0.11, 살짝 위에서 본 시점)
      tiltMax: 0.22,                   // (기본값: 4~5단계 윗면 기울기 최대 약 13도)
      wrinkleAmp: 0.05,                // (기본값: 옆면 주름 깊이 = 캔 폭 × 0.05 × 단계비율)
      dentDepth: 0.1,                  // (기본값: 눌린 자국 최대 깊이 = 캔 폭 × 0.1)
      wobbleRad: 0.08,                 // (기본값: 흔들림 최대 약 4.5도)
      wobbleHz: 2.5,                   // (기본값: main.js CONFIG.pulseHzMax 상한) — main.js가 o.wobbleHz로 넘기면 그 값(그래도 이 값 이하로 자름)
      flatWidth: 1.4,                  // (기본값: 5단계 납작 원판 폭 = 캔 폭 × 1.4)
      flatMinH: 28,                    // (기본값: 납작해도 보이는 최소 두께 px)
      flatMaxH: 0.35,                  // (기본값: 납작 원판 최대 두께 = 캔 폭 × 0.35)
      flatTeeth: 9,                    // (기본값: 납작 원판 윗선 주름 개수)
      badgeMinD: 72,                   // [결정 필요] 기본값 숫자 배지 지름 72px 이상
      showGradeNumber: false,          // 숫자 배지 끔 — 등급은 색으로만
      badgeRatio: 0.4,                 // (기본값: 배지 지름 = 캔 폭 × 0.4, 216px 캔이면 86px)
    },

    zone: {
      // 진하기·테두리·★·속도·투명도는 main.js CONFIG 값을 drawTopZone 인자로 받는다 (속도는 main.js 한 곳에서만 곱함)
      fill: '#FFC61A',                 // (기본값: 진한 노랑. 투명도는 CONFIG.zoneFillAlpha)
      ring: '#FFD23F',                 // (기본값: 테두리 안쪽 노란 고리 — 띠가 진하게 보이게, 안쪽은 캔이 비쳐 보임)
      scaleAmp: 0.08,                  // (기본값: GAME.md 아트 점검 — 크기 1.0~1.08)
      padX: 14,                        // (기본값: 띠가 캔 양옆으로 나오는 폭 px)
      bubbleFont: 34,                  // (기본값: 9세가 바로 읽는 크기)
      bubbleText: '여기!',             // (기본값: GAME.md 아트 점검 B안 말풍선 "여기! ⬇", 화살표는 기기별 이모지 차이를 피해 그림으로 그림)
      arrowH: 40,                      // (기본값: 아래 화살표 높이 px)
    },

    hammer: {
      headH: 0.8,                      // (기본값: 머리 높이 = 머리 폭 × 0.8, 통통한 장난감 비율)
      handleLen: 1.1,                  // (기본값: 손잡이 길이 = 머리 폭 × 1.1, 짧고 귀엽게)
      handleW: 0.28,                   // (기본값: 손잡이 굵기 = 머리 폭 × 0.28)
      handle: '#FFD23F',               // (기본값: 노란 장난감 손잡이 — 나무·쇠 느낌 회피)
      // 등급별 머리 색: 1 빨강 / 2 주황 / 3 검정 / 4 검정·빨강 (등급 그림은 GAME.md 망치 등급 표)
      grades: [
        { head: '#E63946', cap: '#FFFFFF' }, // 1 기본 망치
        { head: '#FF8C1A', cap: '#FFFFFF' }, // 2 주황 망치
        { head: '#1E1E1E', cap: '#FFD23F' }, // 3 번개 망치
        { head: '#1E1E1E', cap: '#E63946' }, // 4 슈퍼 망치
      ],
    },

    coin: {
      fill: '#FFD23F',                 // (기본값: 노란 원)
      ring: '#D98E04',                 // (기본값: 진한 테두리)
      star: '#FF8C1A',                 // (기본값: 별 무늬, 노랑 위에서 보이게 주황)
    },

    gauge: {
      empty: '#FFFFFF',                // (기본값: 빈 칸 흰색)
      from: '#FF8C1A',                 // (기본값: 주황 → 빨강)
      to: '#E63946',
      label: '힘',                     // (기본값: GAME.md 아트 점검 꾹 힘 게이지 — 위에 "힘" 글자, kid-safety 글자 병기)
    },

    debris: {
      drop: '#7A3B12',                 // (기본값: 콜라 방울 갈색)
      bubble: '#FFFFFF',               // (기본값: 거품 흰색)
      bit: '#C9D1D9',                  // (기본값: 작은 은색 동그라미)
    },

    pop: { size: 72 },                 // (기본값: "뿅!" 글자 기본 크기 px, scale 1 기준)
    hurray: {
      text: '오예!',                   // (아이 요청)
      appearSec: 0.3,                  // (기본값: GAME.md 아트 리스크 5 — 0.3초 커지기)
      sizeRatio: 0.2,                  // (기본값: 글자 크기 = 짧은 변 × 0.2)
      fill: '#FFD23F', back: '#E63946', // (기본값: 노란 글자 + 빨강 그림자 — shadowBlur 대신 겹쳐 그리기)
    },
  };

  // ===== 도우미 =====
  const TAU = Math.PI * 2;
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d; }
  function now() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }

  function hexRgb(hex) {
    if (typeof hex !== 'string' || hex[0] !== '#' || hex.length < 7) return null;
    return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
  }
  function isDark(hex) {
    const c = hexRgb(hex);
    return !!c && (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 90;
  }
  function lerpColor(a, b, t) {
    const x = hexRgb(a), y = hexRgb(b);
    if (!x || !y) return a;
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' +
      Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }

  // ctx.roundRect는 구형 안드로이드 크롬에 없을 수 있어 직접 그림
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function starPath(ctx, cx, cy, rOut, rIn, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2) ? rIn : rOut;
      const a = -Math.PI / 2 + i * Math.PI / points;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function lwFor(size) { return Math.max(2, Math.min(ART.outline, size * 0.06)); }

  // ===== 배경: 연하늘 벽 + 나무 식탁 =====
  function drawBackground(ctx, W, H, tableY) {
    ctx.save();
    const ty = clamp(num(tableY, H * 0.7), 0, H);
    ctx.fillStyle = ART.bg.wall;
    ctx.fillRect(0, 0, W, ty);
    if (ty < H) {
      const th = H - ty;
      ctx.fillStyle = ART.bg.table;
      ctx.fillRect(0, ty, W, th);

      // 나뭇결 (위치 고정 — 매 프레임 같은 그림)
      ctx.strokeStyle = ART.bg.grain;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const n = ART.bg.grainLines;
      for (let i = 0; i < n; i++) {
        const y = ty + th * (0.14 + 0.78 * i / Math.max(1, n - 1));
        const x0 = W * ((i * 0.29) % 0.35);
        const x1 = x0 + W * (0.45 + (i % 2) * 0.15);
        const amp = 3 + (i % 3);
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.bezierCurveTo(x0 + (x1 - x0) * 0.33, y - amp, x0 + (x1 - x0) * 0.66, y + amp, x1, y);
        ctx.stroke();
        // 짧은 두 번째 결
        const x2 = x1 + W * 0.08, x3 = Math.min(W - 10, x2 + W * 0.22);
        if (x3 > x2) {
          ctx.beginPath();
          ctx.moveTo(x2, y + 2);
          ctx.quadraticCurveTo((x2 + x3) / 2, y + 2 + amp, x3, y + 2);
          ctx.stroke();
        }
      }
      // 나무 옹이 하나
      ctx.beginPath();
      ctx.ellipse(W * 0.8, ty + th * 0.55, Math.max(10, W * 0.025), Math.max(5, W * 0.011), 0, 0, TAU);
      ctx.stroke();

      // 식탁 모서리 선
      ctx.strokeStyle = ART.bg.tableEdge;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(W, ty);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ===== 캔 =====
  // dents[].y 는 0=캔 윗면, 1=캔 바닥 (캔 안 세로 위치 비율). side -1=왼쪽, 1=오른쪽.
  function drawCan(ctx, cx, bottomY, w, h, o) {
    o = o || {};
    const color = o.color || '#E63946';
    const grade = o.grade == null ? 1 : o.grade;
    const stage = clamp(num(o.stage, 0), 0, 5);
    const dents = Array.isArray(o.dents) ? o.dents : [];
    const wob = clamp(num(o.wobble, 0), 0, 1);
    const dark = isDark(color);
    const crease = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.28)';
    const s = stage / 5;

    ctx.save();
    if (wob > 0) {
      const whz = Math.min(num(o.wobbleHz, ART.can.wobbleHz), ART.can.wobbleHz); // 초당 3회 미만 고정
      const wt = num(o.wobbleT, now() / 1000); // 맞은 뒤 지난 초 (없으면 시계)
      const a = wob * ART.can.wobbleRad * Math.sin(wt * TAU * whz);
      ctx.translate(cx, bottomY);
      ctx.rotate(a);
      ctx.translate(-cx, -bottomY);
    }

    // 바닥 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(cx, bottomY, w * 0.6 * (1 + 0.4 * s), Math.max(6, w * 0.08), 0, 0, TAU);
    ctx.fill();

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 배지 지름: 보통 크기 캔은 72px 이상. 새 캔 등장 애니메이션으로 w가 아주 작을 때만 함께 작게
    const D = Math.max(Math.min(ART.can.badgeMinD, w * 0.8), w * ART.can.badgeRatio);
    let bx, by;
    if (stage >= 5) {
      const p = drawFlatCan(ctx, cx, bottomY, w, h, color, crease, D);
      bx = p[0]; by = p[1];
    } else {
      const p = drawStandingCan(ctx, cx, bottomY, w, h, color, crease, stage, s, dents, dark);
      bx = p[0]; by = p[1];
    }

    // 등급 숫자 배지 없음: 등급은 캔 색(빨강·주황·검정)으로만 보여 준다
    if (ART.can.showGradeNumber) {
    ctx.beginPath();
    ctx.arc(bx, by, D / 2, 0, TAU);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    ctx.fillStyle = ART.ink;
    ctx.font = '900 ' + Math.round(D * 0.62) + 'px ' + ART.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(grade), bx, by + D * 0.04);
    }

    ctx.restore();
  }

  function drawStandingCan(ctx, cx, bottomY, w, h, color, crease, stage, s, dents, dark) {
    const half = w * (1 + ART.can.bulge * s) / 2;
    const ry = Math.max(4, Math.min(w * ART.can.lidRy, h * 0.25));
    const ryB = ry * 0.9;
    const topY = bottomY - h;
    const tilt = ART.can.tiltMax * s;
    const sinT = Math.sin(tilt), cosT = Math.cos(tilt);
    const yTopL = topY - half * sinT, yTopR = topY + half * sinT;
    const xTopHalf = half * cosT;
    const yBot = bottomY - ryB;
    const teeth = stage >= 1 ? Math.round(stage) * 2 : 0;
    const amp = w * ART.can.wrinkleAmp * s;
    const B0 = 0.12, B1 = 0.9;

    // 옆면 샘플 위치 (주름 꼭짓점을 정확히 포함)
    const ts = [];
    const N = 24;
    for (let i = 0; i <= N; i++) ts.push(i / N);
    for (let k = 0; k <= teeth * 2 && teeth > 0; k++) ts.push(B0 + k * (B1 - B0) / (teeth * 2));
    ts.sort(function (a, b) { return a - b; });

    function inward(t, side) {
      let off = 0;
      if (teeth > 0 && t > B0 && t < B1) {
        const u = (t - B0) / (B1 - B0) * teeth;
        const f = u - Math.floor(u);
        off += amp * (f < 0.5 ? f * 2 : 2 - f * 2);
      }
      for (let i = 0; i < dents.length; i++) {
        const d = dents[i];
        if (!d || d.side !== side) continue;
        const dy = (t - clamp(num(d.y, 0.5), 0, 1)) / 0.12;
        off += clamp(num(d.depth, 0), 0, 1) * w * ART.can.dentDepth * Math.exp(-dy * dy);
      }
      return off;
    }
    function lx(t) { return cx - (xTopHalf + (half - xTopHalf) * t) + inward(t, -1); }
    function ly(t) { return yTopL + (yBot - yTopL) * t; }
    function rx(t) { return cx + (xTopHalf + (half - xTopHalf) * t) - inward(t, 1); }
    function ryy(t) { return yTopR + (yBot - yTopR) * t; }

    function bodyPath() {
      ctx.beginPath();
      for (let i = 0; i < ts.length; i++) {
        if (i === 0) ctx.moveTo(lx(ts[i]), ly(ts[i])); else ctx.lineTo(lx(ts[i]), ly(ts[i]));
      }
      ctx.ellipse(cx, yBot, half, ryB, 0, Math.PI, 0, true);
      for (let i = ts.length - 1; i >= 0; i--) ctx.lineTo(rx(ts[i]), ryy(ts[i]));
      ctx.closePath();
    }

    // 몸통
    bodyPath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.save();
    bodyPath();
    ctx.clip();
    const bodyH = yBot - topY;

    // 흰 띠 무늬 (물결, 글자 없음)
    const yc = topY + bodyH * 0.36;
    const bt = Math.max(14, bodyH * 0.15);
    const x0 = cx - half - 10, x1 = cx + half + 10;
    ctx.beginPath();
    const M = 10;
    for (let i = 0; i <= M; i++) {
      const x = x0 + (x1 - x0) * i / M;
      const y = yc - bt / 2 + Math.sin(i / M * TAU) * bt * 0.45 + (x - cx) * sinT * 0.6;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = M; i >= 0; i--) {
      const x = x0 + (x1 - x0) * i / M;
      const y = yc + bt / 2 + Math.sin(i / M * TAU + 0.6) * bt * 0.45 + (x - cx) * sinT * 0.6;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 세로 반짝 줄
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.3)';
    ctx.fillRect(cx - half * 0.66, topY - ry, half * 0.16, bodyH + ry);

    // 바닥 은색 테
    const yRim = yBot - ry * 0.55;
    ctx.beginPath();
    ctx.ellipse(cx, yRim, half + 4, ryB, 0, 0, Math.PI, false);
    ctx.lineTo(cx - half - 4, bottomY + 6);
    ctx.lineTo(cx + half + 4, bottomY + 6);
    ctx.closePath();
    ctx.fillStyle = ART.silver;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, yRim, half + 4, ryB, 0, 0, Math.PI, false);
    ctx.strokeStyle = ART.silverDark;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 옆면 주름 선 (주름 안쪽 꼭짓점에서 안으로 짧게)
    if (teeth > 0) {
      ctx.strokeStyle = crease;
      ctx.lineWidth = 3;
      const len = w * 0.1 * s + 4;
      for (let k = 0; k < teeth; k++) {
        const t = B0 + (k + 0.5) * (B1 - B0) / teeth;
        const xl = lx(t), yl = ly(t), xr = rx(t), yr = ryy(t);
        ctx.beginPath();
        ctx.moveTo(xl, yl); ctx.lineTo(xl + len, yl + len * 0.25);
        ctx.moveTo(xr, yr); ctx.lineTo(xr - len, yr + len * 0.25);
        ctx.stroke();
      }
    }

    // 눌린 자국 (둥근 음영)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)';
    for (let i = 0; i < dents.length; i++) {
      const d = dents[i];
      if (!d) continue;
      const dep = clamp(num(d.depth, 0), 0, 1);
      if (dep <= 0) continue;
      const t = clamp(num(d.y, 0.5), 0, 1);
      const side = d.side === -1 ? -1 : 1;
      const ex = side < 0 ? lx(t) : rx(t);
      const ey = side < 0 ? ly(t) : ryy(t);
      ctx.beginPath();
      ctx.ellipse(ex - side * (w * 0.05 * dep + 4), ey, w * 0.1 * dep + 6, Math.max(6, bodyH * 0.06), 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore(); // 클립 해제

    // 몸통 외곽선
    bodyPath();
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();

    // 은색 윗뚜껑 + 따개 (단계가 오를수록 기울어짐)
    ctx.save();
    ctx.translate(cx, topY);
    ctx.rotate(tilt);
    ctx.beginPath();
    ctx.ellipse(0, 0, half, ry, 0, 0, TAU);
    ctx.fillStyle = ART.silver;
    ctx.fill();
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, half * 0.78, ry * 0.62, 0, 0, TAU);
    ctx.lineWidth = 3;
    ctx.strokeStyle = ART.silverDark;
    ctx.stroke();
    // 따개
    ctx.beginPath();
    ctx.ellipse(half * 0.2, -ry * 0.05, half * 0.22, ry * 0.3, 0, 0, TAU);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3, w * 0.02), 0, TAU);
    ctx.fillStyle = ART.silverDark;
    ctx.fill();
    // 뚜껑 눌림 (2단계 이상)
    if (stage >= 2) {
      ctx.beginPath();
      ctx.moveTo(-half * 0.55, ry * 0.15);
      ctx.quadraticCurveTo(-half * 0.3, ry * 0.5, -half * 0.05, ry * 0.2);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    return [cx, topY + bodyH * 0.64];
  }

  function drawFlatCan(ctx, cx, bottomY, w, h, color, crease, D) {
    const pw = w * ART.can.flatWidth, half = pw / 2;
    const ph = clamp(num(h, ART.can.flatMinH), ART.can.flatMinH, w * ART.can.flatMaxH);
    const yT = bottomY - ph;
    const ryB = Math.min(ph * 0.35, pw * 0.07);
    const yB = bottomY - ryB;
    const teeth = ART.can.flatTeeth;
    const za = Math.max(4, ph * 0.16);

    function path() {
      ctx.beginPath();
      ctx.moveTo(cx - half, yT);
      ctx.lineTo(cx - half, yB);
      ctx.ellipse(cx, yB, half, ryB, 0, Math.PI, 0, true);
      ctx.lineTo(cx + half, yT);
      for (let k = 1; k <= teeth * 2; k++) {
        ctx.lineTo(cx + half - k * pw / (teeth * 2), yT + ((k % 2) ? -za : 0));
      }
      ctx.closePath();
    }

    path();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.save();
    path();
    ctx.clip();
    // 흰 띠 조각
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - half, yT + ph * 0.28, pw, Math.max(5, ph * 0.22));
    // 주름(아코디언) 세로 선
    ctx.strokeStyle = crease;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 1; k < teeth * 2; k += 2) {
      const x = cx + half - k * pw / (teeth * 2);
      ctx.moveTo(x, yT - za + 2);
      ctx.lineTo(x + 3, yB);
    }
    ctx.stroke();
    // 바닥 은색 테
    const yRim = yB - ph * 0.14;
    ctx.beginPath();
    ctx.ellipse(cx, yRim, half + 4, ryB, 0, 0, Math.PI, false);
    ctx.lineTo(cx - half - 4, bottomY + 6);
    ctx.lineTo(cx + half + 4, bottomY + 6);
    ctx.closePath();
    ctx.fillStyle = ART.silver;
    ctx.fill();
    ctx.restore();

    path();
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();

    // 납작해진 은색 뚜껑
    const lry = Math.max(6, Math.min(ph * 0.45, pw * 0.09));
    ctx.beginPath();
    ctx.ellipse(cx, yT, half * 0.8, lry, 0, 0, TAU);
    ctx.fillStyle = ART.silver;
    ctx.fill();
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, yT, half * 0.6, lry * 0.6, 0, 0, TAU);
    ctx.lineWidth = 3;
    ctx.strokeStyle = ART.silverDark;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx - half * 0.2, yT, half * 0.14, lry * 0.3, 0, 0, TAU);
    ctx.stroke();

    // 배지는 원판 오른쪽 위에 걸쳐 놓음 (뚜껑을 다 가리지 않게)
    return [cx + half * 0.45, Math.min(bottomY - ph / 2, bottomY - D / 2 - 2)];
  }

  // ===== 윗부분 타격 구역 (B안) =====
  // topY = 캔 윗면, zoneH = 윗면 아래 판정 높이. 띠는 판정 범위 그대로 (윗면 − slopPx) ~ (윗면 + zoneH)에 그린다.
  // o = { phase: 박동 위상(바퀴 수, main.js가 time × min(pulseHz, pulseHzMax)로 계산), bump: 0..1 한 번 커졌다 작아지기,
  //       bumpScale, fillAlpha, alphaMin, borderPx, starPx, slopPx, bubbleAlpha: "여기!" 말풍선 투명도(0이면 안 그림) }
  // 옛 호출(숫자 하나)도 phase로 받아 준다.
  function drawTopZone(ctx, cx, topY, w, zoneH, o) {
    if (typeof o === 'number') o = { phase: o };
    o = o || {};
    const k = (1 - Math.cos(TAU * num(o.phase, 0))) / 2; // 0..1 부드럽게 (속도는 main.js 한 곳에서만 정함)
    const bump = clamp(num(o.bump, 0), 0, 1);
    const sc = 1 + ART.zone.scaleAmp * k + num(o.bumpScale, 0) * bump;
    const alphaMin = clamp(num(o.alphaMin, 0.85), 0, 1);
    const al = alphaMin + (1 - alphaMin) * k;
    const slop = Math.max(0, num(o.slopPx, 0));
    const border = Math.max(ART.outline, num(o.borderPx, 6));
    const bw = w + ART.zone.padX * 2;
    const bTop = topY - slop, bH = zoneH + slop;

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 진한 노란 띠(반투명 — 캔 외곽선·뚜껑이 비쳐 보임) + 굵은 검정 테두리 + 안쪽 노란 고리 + 작은 ★
    ctx.save();
    ctx.translate(cx, bTop + bH / 2);
    ctx.scale(sc, sc);
    const r = Math.min(20, bH / 3);
    rr(ctx, -bw / 2, -bH / 2, bw, bH, r);
    ctx.globalAlpha = al * clamp(num(o.fillAlpha, 0.5), 0, 1);
    ctx.fillStyle = ART.zone.fill;
    ctx.fill();
    ctx.globalAlpha = al;
    ctx.lineWidth = border;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    const ins = border / 2 + 3;
    rr(ctx, -bw / 2 + ins, -bH / 2 + ins, bw - ins * 2, Math.max(4, bH - ins * 2), Math.max(2, r - ins));
    ctx.lineWidth = 6;
    ctx.strokeStyle = ART.zone.ring;
    ctx.stroke();
    // ★ : 띠 오른쪽 끝(캔 몸통 바깥)에 반쯤 걸쳐 그림 — 뚜껑·숫자 배지를 가리지 않음
    const sr = Math.max(8, num(o.starPx, 18));
    starPath(ctx, bw / 2 + sr * 0.2, -bH / 2 + bH * 0.55, sr, sr * 0.45, 5);
    ctx.fillStyle = '#FFD23F';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    ctx.restore();

    const bubbleAlpha = clamp(num(o.bubbleAlpha, 1), 0, 1);
    if (bubbleAlpha <= 0) { ctx.restore(); return; }
    ctx.globalAlpha = al * bubbleAlpha;

    // 아래 화살표 (위아래로 살짝 움직임) — 자리 계산은 zoneBubbleGeom 한 곳 (main.js 글자 피하기도 같은 함수 사용)
    const G = zoneBubbleGeom(ctx, cx, bTop, k);
    const aH = G.aH, aW = G.aW, tipY = G.tipY, baseY = G.baseY;
    ctx.beginPath();
    ctx.moveTo(cx - aW * 0.2, baseY);
    ctx.lineTo(cx + aW * 0.2, baseY);
    ctx.lineTo(cx + aW * 0.2, tipY - aH * 0.5);
    ctx.lineTo(cx + aW * 0.5, tipY - aH * 0.5);
    ctx.lineTo(cx, tipY);
    ctx.lineTo(cx - aW * 0.5, tipY - aH * 0.5);
    ctx.lineTo(cx - aW * 0.2, tipY - aH * 0.5);
    ctx.closePath();
    ctx.fillStyle = '#FFD23F';
    ctx.fill();
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();

    // 말풍선 "여기! ⬇" (⬇는 기기별 이모지 차이를 피하려고 그림으로 그림)
    const fs = G.fs, tw = G.tw, ia = G.ia, gap = G.gap, padX = G.padX, bh = G.bh, bubTop = G.bubTop, bLeft = G.bLeft;
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    rr(ctx, bLeft, bubTop, G.bwid, bh, bh / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    ctx.fillStyle = ART.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ART.zone.bubbleText, bLeft + padX, bubTop + bh / 2 + fs * 0.04);
    const ax = bLeft + padX + tw + gap + ia / 2, ay = bubTop + bh / 2;
    ctx.beginPath();
    ctx.moveTo(ax - ia * 0.18, ay - ia * 0.5);
    ctx.lineTo(ax + ia * 0.18, ay - ia * 0.5);
    ctx.lineTo(ax + ia * 0.18, ay - ia * 0.05);
    ctx.lineTo(ax + ia * 0.45, ay - ia * 0.05);
    ctx.lineTo(ax, ay + ia * 0.5);
    ctx.lineTo(ax - ia * 0.45, ay - ia * 0.05);
    ctx.lineTo(ax - ia * 0.18, ay - ia * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#E63946';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  // ===== 말풍선 자리 계산 (그리기와 main.js "글자 피하기"가 같은 값을 쓰도록 한 곳에 둠) =====
  function rectUnion(a, b) { return { l: Math.min(a.l, b.l), r: Math.max(a.r, b.r), t: Math.min(a.t, b.t), b: Math.max(a.b, b.b) }; }

  // 작은 "여기!" 말풍선 + 화살표. bTop = 띠 윗변, k = 박동 0..1
  function zoneBubbleGeom(ctx, cx, bTop, k) {
    const aH = ART.zone.arrowH, aW = aH * 1.1;
    const tipY = bTop - 8 - (1 - clamp(num(k, 0), 0, 1)) * 6;
    const baseY = tipY - aH;
    const fs = ART.zone.bubbleFont;
    ctx.save();
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    const tw = ctx.measureText(ART.zone.bubbleText).width;
    ctx.restore();
    const ia = fs * 0.7, gap = 10, padX = 18;
    const bwid = padX * 2 + tw + gap + ia;
    const bh = fs + 26;
    const bubTop = baseY - 8 - bh;
    const bLeft = cx - bwid / 2;
    const half = ART.outline / 2;
    return { aH, aW, tipY, baseY, fs, tw, ia, gap, padX, bwid, bh, bubTop, bLeft,
      arrow: { l: cx - aW / 2 - half, r: cx + aW / 2 + half, t: baseY - half, b: tipY + half },
      bubble: { l: bLeft - half, r: bLeft + bwid + half, t: bubTop - half, b: bubTop + bh + half } };
  }
  // main.js용: 박동 전체(k 0~1) 동안 차지하는 상자 [화살표, 말풍선]. topY = 캔 윗면, o.slopPx = 판정 여유
  function zoneBubbleRects(ctx, cx, topY, o) {
    const bTop = topY - Math.max(0, num(o && o.slopPx, 0));
    const a = zoneBubbleGeom(ctx, cx, bTop, 0), b = zoneBubbleGeom(ctx, cx, bTop, 1);
    return [rectUnion(a.arrow, b.arrow), rectUnion(a.bubble, b.bubble)];
  }

  // 첫 판 "여기를 톡!" 말풍선 + 큰 화살표 자리
  function tutorialHintGeom(ctx, cx, bandTop, o) {
    o = o || {};
    const aH = Math.max(30, num(o.arrowPx, 72)), aW = aH * 0.9;
    const tip = bandTop - 8 - Math.max(0, num(o.bob, 0));
    const base = tip - aH;
    const fs = Math.max(20, num(o.fontPx, 40));
    const text = o.text || '여기를 톡!';
    ctx.save();
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    const tw = ctx.measureText(text).width;
    ctx.restore();
    const bw = tw + 44, bh = fs + 28;
    const minTop = num(o.minTop, 0);
    let left = cx - bw / 2, top = base - 10 - bh, side = false;
    if (top < minTop) {
      side = true;
      left = Math.max(num(o.sideLeft, cx + aW / 2 + 12), cx + aW / 2 + 12);
      top = Math.max(minTop, bandTop - bh / 2);
    }
    const maxRight = num(o.maxRight, Infinity);
    if (left + bw > maxRight) left = Math.max(4, maxRight - bw);
    return { aH, aW, tip, base, fs, text, bw, bh, left, top, side,
      arrow: { l: cx - aW / 2 - 3, r: cx + aW / 2 + 3, t: base - 3, b: tip + 3 },
      bubble: { l: left - 2, r: left + bw + 2, t: top - 2, b: top + bh + (side ? 2 : 12) } }; // 꼬리 10px 포함
  }
  // main.js용: 위아래 움직임 전체(bob 0 ~ o.bobMax) 동안 차지하는 상자 [화살표, 말풍선]
  function tutorialHintRects(ctx, cx, bandTop, o) {
    const a = tutorialHintGeom(ctx, cx, bandTop, Object.assign({}, o, { bob: 0 }));
    const b = tutorialHintGeom(ctx, cx, bandTop, Object.assign({}, o, { bob: num(o && o.bobMax, 0) }));
    return [rectUnion(a.arrow, b.arrow), rectUnion(a.bubble, b.bubble)];
  }

  // ===== 장난감 뿅망치 =====
  // 로컬 좌표: 머리 중심 (0,0), 머리 아랫면(때리는 면)이 +y, 손잡이는 왼쪽(-x)으로 뻗음.
  // angle 음수 = 반시계 회전 = 손잡이 쪽을 축으로 머리를 뒤로 젖힌 모양.
  function drawHammer(ctx, x, y, size, angle, o) {
    o = o || {};
    const g = clamp(Math.round(num(o.grade, 1)), 1, 4);
    const lw = lwFor(size);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(num(angle, 0));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 손잡이 (둥근 막대 + 끝 동그라미)
    const hl = size * ART.hammer.handleLen, hw = size * ART.hammer.handleW;
    const hx0 = -size * 0.5 - hl;
    rr(ctx, hx0, -hw / 2, hl + size * 0.2, hw, hw / 2);
    ctx.fillStyle = ART.hammer.handle;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx0 + hw * 0.2, 0, hw * 0.72, 0, TAU);
    ctx.fillStyle = ART.hammer.grades[g - 1].head;
    ctx.fill();
    ctx.stroke();

    drawHead(ctx, size, g, o.skin || null, lw);
    ctx.restore();
  }

  function drawHead(ctx, size, g, skin, lw) {
    const W = size, H = size * ART.hammer.headH;
    const r = H * 0.34;
    const spec = ART.hammer.grades[g - 1];
    const capH = H * 0.2;

    rr(ctx, -W / 2, -H / 2, W, H, r);
    ctx.fillStyle = spec.head;
    ctx.fill();

    ctx.save();
    rr(ctx, -W / 2, -H / 2, W, H, r);
    ctx.clip();

    if (skin) {
      drawSkin(ctx, skin, W, H, lw);
    } else if (g === 4) {
      // 검정·빨강 줄무늬
      ctx.fillStyle = '#E63946';
      const sw = W * 0.14, gap = W * 0.32;
      for (let i = -3; i <= 3; i++) {
        const sx = i * gap;
        ctx.beginPath();
        ctx.moveTo(sx - sw / 2 + H * 0.4, -H / 2);
        ctx.lineTo(sx + sw / 2 + H * 0.4, -H / 2);
        ctx.lineTo(sx + sw / 2 - H * 0.4, H / 2);
        ctx.lineTo(sx - sw / 2 - H * 0.4, H / 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 위·아래 말랑한 끝(뿅망치 느낌)
    ctx.fillStyle = spec.cap;
    ctx.fillRect(-W / 2, -H / 2, W, capH);
    ctx.fillRect(-W / 2, H / 2 - capH, W, capH);
    ctx.strokeStyle = ART.ink;
    ctx.lineWidth = lw * 0.6;
    ctx.beginPath();
    ctx.moveTo(-W / 2, -H / 2 + capH); ctx.lineTo(W / 2, -H / 2 + capH);
    ctx.moveTo(-W / 2, H / 2 - capH); ctx.lineTo(W / 2, H / 2 - capH);
    ctx.stroke();

    if (!skin && g === 3) {
      // 노란 번개
      const p = [[0.1, -0.44], [-0.2, 0.06], [-0.02, 0.06], [-0.1, 0.44], [0.22, -0.08], [0.04, -0.08]];
      ctx.beginPath();
      for (let i = 0; i < p.length; i++) {
        const px = p[i][0] * W, py = p[i][1] * H;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#FFD23F';
      ctx.fill();
      ctx.stroke();
    } else if (!skin && g === 4) {
      starPath(ctx, 0, 0, H * 0.3, H * 0.14, 5);
      ctx.fillStyle = '#FFD23F';
      ctx.fill();
      ctx.stroke();
    }

    // 반짝 하이라이트
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    rr(ctx, -W * 0.38, -H / 2 + capH + H * 0.06, W * 0.3, H * 0.12, H * 0.06);
    ctx.fill();
    ctx.restore();

    // 머리 외곽선
    rr(ctx, -W / 2, -H / 2, W, H, r);
    ctx.lineWidth = lw;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();

    // 2등급 배지 "2"
    if (!skin && g === 2) {
      const br = H * 0.26;
      ctx.beginPath();
      ctx.arc(0, 0, br, 0, TAU);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = lw * 0.7;
      ctx.stroke();
      ctx.fillStyle = ART.ink;
      ctx.font = '900 ' + Math.round(br * 1.4) + 'px ' + ART.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2', 0, br * 0.06);
    }
  }

  // 스킨 무늬 (머리 바탕색은 등급색 유지, 클립 안에서 호출)
  function drawSkin(ctx, id, W, H, lw) {
    ctx.strokeStyle = ART.ink;
    ctx.lineWidth = lw * 0.5;
    if (id === 'fire') {
      const xs = [-0.3, 0, 0.3], hs = [0.42, 0.56, 0.42];
      for (let i = 0; i < 3; i++) {
        const fx = xs[i] * W, fy = H * 0.3, fh = hs[i] * H, fw = W * 0.13;
        ctx.beginPath();
        ctx.moveTo(fx, fy - fh);
        ctx.bezierCurveTo(fx + fw * 1.2, fy - fh * 0.45, fx + fw, fy, fx, fy);
        ctx.bezierCurveTo(fx - fw, fy, fx - fw * 1.2, fy - fh * 0.45, fx, fy - fh);
        ctx.closePath();
        ctx.fillStyle = '#FFD23F';
        ctx.fill();
        ctx.stroke();
      }
    } else if (id === 'star') {
      const pts = [[-0.27, -0.05, 0.17], [0.05, 0.1, 0.2], [0.3, -0.1, 0.14]];
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < pts.length; i++) {
        starPath(ctx, pts[i][0] * W, pts[i][1] * H, pts[i][2] * H, pts[i][2] * H * 0.45, 5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (id === 'stripe') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(3, H * 0.09);
      ctx.lineCap = 'round';
      const ys = [-0.12, 0.12];
      for (let j = 0; j < ys.length; j++) {
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const px = -W / 2 + W * i / 12;
          const py = ys[j] * H + Math.sin(i / 12 * TAU * 1.5) * H * 0.06;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }

  // ===== 코인 (금화·₩·$ 아님 — 노란 원 + 별) =====
  function drawCoin(ctx, x, y, r) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = ART.coin.fill;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.78, 0, TAU);
    ctx.lineWidth = Math.max(2, r * 0.14);
    ctx.strokeStyle = ART.coin.ring;
    ctx.stroke();
    starPath(ctx, x, y, r * 0.5, r * 0.22, 5);
    ctx.fillStyle = ART.coin.star;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.lineWidth = Math.max(2, Math.min(ART.outline, r * 0.12));
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x - r * 0.42, y - r * 0.42, r * 0.16, r * 0.1, -0.7, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ctx.restore();
  }

  // ===== 꾹 힘 게이지 (x,y = 막대 왼쪽 위) =====
  // o (선택) = { label: 위 글자 바꾸기(예: "최대!"), labelPx, labelFill, labelScale }
  function drawGauge(ctx, x, y, w, h, fill, o) {
    o = o || {};
    const f = clamp(num(fill, 0), 0, 1);
    const r = Math.min(w / 2, 16);
    ctx.save();
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = ART.gauge.empty;
    ctx.fill();
    if (f > 0) {
      ctx.save();
      rr(ctx, x, y, w, h, r);
      ctx.clip();
      ctx.fillStyle = lerpColor(ART.gauge.from, ART.gauge.to, f);
      ctx.fillRect(x, y + h * (1 - f), w, h * f);
      ctx.restore();
    }
    // 눈금 3개
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      const ty = y + h * i / 4;
      ctx.moveTo(x + w * 0.2, ty);
      ctx.lineTo(x + w * 0.45, ty);
    }
    ctx.stroke();
    rr(ctx, x, y, w, h, r);
    ctx.lineWidth = ART.outline;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    // 위에 "힘" (가득 차면 main.js가 "최대!"로 바꿔 넘김 — 깜빡이지 않고 한 번 커지며 바뀜)
    const label = o.label || ART.gauge.label;
    const fs = Math.max(26, Math.round(num(o.labelPx, w * 0.55)));
    const ls = clamp(num(o.labelScale, 1), 0.1, 2);
    ctx.save();
    ctx.translate(x + w / 2, y - 6);
    ctx.scale(ls, ls);
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, fs * 0.18);
    ctx.strokeStyle = ART.ink;
    ctx.strokeText(label, 0, 0);
    ctx.fillStyle = o.labelFill || '#FFFFFF';
    ctx.fillText(label, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  // ===== 파편 (둥근 것만, 날카로운 조각 없음) =====
  function drawDebris(ctx, p) {
    if (!p) return;
    const a = clamp(num(p.alpha, 1), 0, 1);
    const r = Math.max(1, num(p.r, 6));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(num(p.x, 0), num(p.y, 0));
    ctx.rotate(num(p.rot, 0));
    if (p.kind === 'bubble') {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
      ctx.lineWidth = Math.max(2, r * 0.2);
      ctx.strokeStyle = p.color || ART.debris.bubble;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.35, r * 0.22, 0, TAU);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    } else if (p.kind === 'bit') {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fillStyle = p.color || ART.debris.bit;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = ART.silverDark;
      ctx.stroke();
    } else { // 'drop' (기본)
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 1.18, 0, 0, TAU);
      ctx.fillStyle = p.color || ART.debris.drop;
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, Math.min(3, r * 0.15));
      ctx.strokeStyle = ART.ink;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 0.35, -r * 0.4, r * 0.28, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
    }
    ctx.restore();
  }

  // ===== 꽃가루 (둥근 모서리 사각형) =====
  function drawConfetti(ctx, p) {
    if (!p) return;
    const a = clamp(num(p.alpha, 1), 0, 1);
    if (a <= 0) return;
    const w = num(p.w, 14), h = num(p.h, 9);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(num(p.x, 0), num(p.y, 0));
    ctx.rotate(num(p.rot, 0));
    rr(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.3);
    ctx.fillStyle = p.color || CONFETTI_COLORS[0];
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; // 흰 꽃가루가 연하늘 벽에 묻히지 않게
    ctx.stroke();
    ctx.restore();
  }

  // ===== 만화 글자 "뿅!" "쾅!" "팅" =====
  function drawPopText(ctx, x, y, text, scale, alpha) {
    const sc = num(scale, 1), a = clamp(num(alpha, 1), 0, 1);
    if (sc <= 0 || a <= 0 || !text) return;
    const fs = Math.max(8, Math.round(ART.pop.size * sc));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.rotate(-0.08);
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, fs * 0.2);
    ctx.strokeStyle = ART.ink;
    ctx.strokeText(String(text), 0, 0);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(String(text), 0, 0);
    ctx.restore();
  }

  // ===== 타격 글자 묶음: 큰 글자 + 작은 설명 + 별 (배경 상자 없음) =====
  // o = { text, px, fill, sub, subPx, subFill, stars, scale, alpha }
  // 글자 뒤에 흰 상자를 깔지 않는다. 외곽선은 둥근 이음(lineJoin round)으로 한 번만 그리고 그 위에 채움.
  function drawHitPop(ctx, x, y, o) {
    o = o || {};
    const sc = num(o.scale, 1), a = clamp(num(o.alpha, 1), 0, 1);
    if (sc <= 0 || a <= 0 || !o.text) return;
    const fs = Math.max(10, Math.round(num(o.px, ART.pop.size) * sc));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 별 (큰 글자 둘레, 위치 고정 — 깜빡임 없음)
    const n = Math.max(0, Math.round(num(o.stars, 0)));
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI * 0.95 + (n === 1 ? 0.5 : i / (n - 1)) * Math.PI * 0.9;
      const rad = fs * 0.95;
      const sr = fs * (i % 2 ? 0.13 : 0.18);
      starPath(ctx, Math.cos(ang) * rad, Math.sin(ang) * rad * 0.75, sr, sr * 0.45, 5);
      ctx.fillStyle = '#FFD23F';
      ctx.fill();
      ctx.lineWidth = Math.max(2, sr * 0.22);
      ctx.strokeStyle = ART.ink;
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(-0.08);
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    ctx.lineWidth = Math.max(5, fs * 0.2);
    ctx.strokeStyle = ART.ink;
    ctx.strokeText(String(o.text), 0, 0);
    ctx.fillStyle = o.fill || '#FFFFFF';
    ctx.fillText(String(o.text), 0, 0);
    ctx.restore();

    if (o.sub) {
      const ss = Math.max(10, Math.round(num(o.subPx, 30) * Math.min(sc, 1.1)));
      const sy = fs * 0.5 + ss * 0.75;
      ctx.font = '800 ' + ss + 'px ' + ART.font;
      ctx.lineWidth = Math.max(4, ss * 0.24);
      ctx.strokeStyle = ART.ink;
      ctx.strokeText(String(o.sub), 0, sy);
      ctx.fillStyle = o.subFill || '#FFFFFF';
      ctx.fillText(String(o.sub), 0, sy);
    }
    ctx.restore();
  }

  // ===== 처음 안내: 말풍선 "여기를 톡!" + 아래로 향한 큰 화살표 =====
  // bandTop = 좋은 자리 띠 윗변. o = { text, fontPx, arrowPx, bob(px, 위로 뜨는 양), minTop, sideLeft, maxRight, alpha }
  // 화살표는 띠 위 가운데. 말풍선은 화살표 위에 두되, 위 공간이 모자라면(작은 가로 화면) 띠 오른쪽 옆에 둔다.
  function drawTutorialHint(ctx, cx, bandTop, o) {
    o = o || {};
    const a = clamp(num(o.alpha, 1), 0, 1);
    if (a <= 0) return;
    const G = tutorialHintGeom(ctx, cx, bandTop, o); // 자리 계산은 한 곳
    const aH = G.aH, aW = G.aW, tip = G.tip, base = G.base;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx - aW * 0.2, base);
    ctx.lineTo(cx + aW * 0.2, base);
    ctx.lineTo(cx + aW * 0.2, tip - aH * 0.45);
    ctx.lineTo(cx + aW * 0.5, tip - aH * 0.45);
    ctx.lineTo(cx, tip);
    ctx.lineTo(cx - aW * 0.5, tip - aH * 0.45);
    ctx.lineTo(cx - aW * 0.2, tip - aH * 0.45);
    ctx.closePath();
    ctx.fillStyle = '#FF8C1A';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();

    const fs = G.fs, text = G.text, bw = G.bw, bh = G.bh, left = G.left, top = G.top, side = G.side;
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    rr(ctx, left, top, bw, bh, bh / 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    if (!side) { // 꼬리(아래로) — 화살표와 이어지게
      ctx.beginPath();
      ctx.moveTo(cx - 12, top + bh - 2);
      ctx.lineTo(cx, top + bh + 10);
      ctx.lineTo(cx + 12, top + bh - 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.fillStyle = ART.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, left + bw / 2, top + bh / 2 + fs * 0.04);
    ctx.restore();
  }

  // ===== 캔 등급 배너 "캔이 더 단단해졌어!" (숫자 없음, 배너 색 = 새 캔 색) =====
  // cy = 배너 가운데 y. o = { text, grade, color(새 캔 색), fontPx, maxW, scale, alpha }
  function drawBanner(ctx, W, cy, o) {
    o = o || {};
    const a = clamp(num(o.alpha, 1), 0, 1), sc = num(o.scale, 1);
    if (a <= 0 || sc <= 0) return;
    const text = o.text || '캔이 더 단단해졌어!';
    let fs = Math.max(20, num(o.fontPx, 56));
    ctx.save();
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    let tw = ctx.measureText(text).width;
    const maxW = Math.max(120, num(o.maxW, W - 32));
    let D = fs * 1.25, total = tw + 56;
    if (total > maxW) { // 화면 폭 안에 들어가게 글자 크기를 줄임
      const k = maxW / total;
      fs = Math.max(20, Math.floor(fs * k));
      ctx.font = '900 ' + fs + 'px ' + ART.font;
      tw = ctx.measureText(text).width; D = fs * 1.25; total = tw + 56;
    }
    const bh = Math.max(D + 20, fs * 1.6);
    ctx.globalAlpha = a;
    ctx.translate(W / 2, cy);
    ctx.scale(sc, sc);
    ctx.lineJoin = 'round';
    rr(ctx, -total / 2, -bh / 2, total, bh, bh / 2);
    ctx.fillStyle = o.color || '#E63946';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = ART.ink;
    ctx.stroke();
    const tx = 0;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(5, fs * 0.2);
    ctx.strokeText(text, tx, fs * 0.04);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, tx, fs * 0.04);
    ctx.restore();
  }

  // ===== 큰 "오예!" =====
  function drawHurray(ctx, W, H, t) {
    t = num(t, 0);
    if (t < 0) return;
    const A = ART.hurray.appearSec;
    const p = Math.min(t / A, 1);
    const c1 = 1.70158, c3 = c1 + 1, q = p - 1;
    const e = 1 + c3 * q * q * q + c1 * q * q; // 살짝 넘쳤다 돌아오기
    let sc = 0.3 + 0.7 * e;
    let rot = 0, dy = 0;
    if (t > A) {
      const u = t - A;
      sc *= 1 + 0.04 * Math.sin(TAU * 0.8 * u);
      rot = 0.04 * Math.sin(TAU * 0.5 * u);
      dy = 6 * Math.sin(TAU * 0.5 * u);
    }
    const fs = Math.max(64, Math.round(Math.min(W, H) * ART.hurray.sizeRatio));
    ctx.save();
    ctx.globalAlpha = Math.min(1, t / 0.15);
    ctx.translate(W / 2, H * 0.42 + dy);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.font = '900 ' + fs + 'px ' + ART.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(6, fs * 0.14);
    ctx.strokeStyle = ART.ink;
    const off = fs * 0.06;
    ctx.strokeText(ART.hurray.text, off, off);
    ctx.fillStyle = ART.hurray.back;
    ctx.fillText(ART.hurray.text, off, off);
    ctx.strokeText(ART.hurray.text, 0, 0);
    ctx.fillStyle = ART.hurray.fill;
    ctx.fillText(ART.hurray.text, 0, 0);
    ctx.restore();
  }

  // ===== 상점 카드 미니 그림 (x,y = 그림 중심, size = 정사각 칸 한 변) =====
  // item = {type:'hammer', grade} 또는 {type:'skin', id, grade?} — skin의 grade는 선택(없으면 1등급 색)
  function drawShopIcon(ctx, x, y, size, item) {
    if (!item) return;
    ctx.save();
    if (item.type === 'skin') {
      const s = size * 0.62;
      ctx.translate(x, y);
      ctx.rotate(-0.15);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawHead(ctx, s, clamp(Math.round(num(item.grade, 1)), 1, 4), item.id || null, lwFor(s));
    } else {
      drawHammer(ctx, x + size * 0.18, y - size * 0.12, size * 0.38, -0.6, { grade: item.grade });
    }
    ctx.restore();
  }

  const CONFETTI_COLORS = ['#E63946', '#FF8C1A', '#FFD23F', '#FFFFFF']; // (기본값: GAME.md 아트 점검 — 빨강·주황·노랑·흰색)

  window.CanArt = {
    ART: ART,
    drawBackground: drawBackground,
    drawCan: drawCan,
    drawTopZone: drawTopZone,
    drawHammer: drawHammer,
    drawCoin: drawCoin,
    drawGauge: drawGauge,
    drawDebris: drawDebris,
    drawConfetti: drawConfetti,
    drawPopText: drawPopText,
    drawHitPop: drawHitPop,
    drawTutorialHint: drawTutorialHint,
    zoneBubbleRects: zoneBubbleRects,
    tutorialHintRects: tutorialHintRects,
    drawBanner: drawBanner,
    drawHurray: drawHurray,
    drawShopIcon: drawShopIcon,
    CONFETTI_COLORS: CONFETTI_COLORS,
    // [결정 필요] 망치 이름은 가칭
    HAMMERS: [
      { grade: 1, name: '기본 망치' },
      { grade: 2, name: '주황 망치' },
      { grade: 3, name: '번개 망치' },
      { grade: 4, name: '슈퍼 망치' },
    ],
    // [결정 필요] 기본값: 망치 머리 무늬 3종, 세기 영향 없음
    SKINS: [
      { id: 'fire', name: '불꽃 무늬', emoji: '🔥' },
      { id: 'star', name: '별 무늬', emoji: '⭐' },
      { id: 'stripe', name: '줄무늬', emoji: '〰️' },
    ],
  };
})();
