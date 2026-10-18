// 효과음 — Web Audio 합성음만 사용(소리 파일 없음, 외부 접속 없음).
// 전역은 window.Sfx 하나. 첫 터치/키 입력 때 Sfx.unlock()을 부르기 전에는 AudioContext를 만들지 않고 소리도 내지 않는다.
(function () {
  'use strict';
  var MASTER_VOLUME = 0.25; // (기본값: 아이 귀 보호 — 0.3 이하)

  var ac = null, master = null, noiseBuf = null;
  var on = true, unlocked = false;

  function resume() {
    try { if (ac && ac.state === 'suspended') ac.resume(); } catch (e) { /* 무시 */ }
  }

  function unlock() {
    if (unlocked) { resume(); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = on ? MASTER_VOLUME : 0;
      master.connect(ac.destination);
      unlocked = true;
      resume();
    } catch (e) { ac = null; master = null; }
  }

  function tone(f0, f1, dur, type, vol, delay) {
    var t = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function noise(dur, vol, cutoff, delay) {
    if (!noiseBuf) {
      var len = Math.floor(ac.sampleRate * 0.6);
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    var t = ac.currentTime + (delay || 0);
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf;
    f.type = 'lowpass';
    f.frequency.setValueAtTime(cutoff, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff * 0.2), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + Math.min(dur, 0.58) + 0.02);
  }

  function play(fn) {
    if (!on || !ac || !master) return;
    resume();
    try { fn(); } catch (e) { /* 소리 실패는 무시 */ }
  }

  window.Sfx = {
    unlock: unlock,
    setOn: function (b) {
      on = !!b;
      try { if (master) master.gain.setValueAtTime(on ? MASTER_VOLUME : 0, ac.currentTime); } catch (e) { /* 무시 */ }
    },
    isOn: function () { return on; },
    // 톡 = "뿅": 통통 튀는 낮은 하강음 두 번
    boing: function () {
      play(function () {
        tone(420, 150, 0.13, 'triangle', 0.8, 0);
        tone(300, 110, 0.16, 'sine', 0.6, 0.09);
      });
    },
    // 꾹·납작 = "쾅": 노이즈 버스트 + 저음. power 0..1
    bang: function (power) {
      var p = Math.max(0, Math.min(1, Number(power) || 0));
      play(function () {
        noise(0.16 + 0.16 * p, 0.45 + 0.35 * p, 1400 + 1600 * p, 0);
        tone(140, 45, 0.25 + 0.15 * p, 'sine', 0.7 + 0.3 * p, 0);
      });
    },
    // 잘못 친 것 = "팅": 높은 금속음
    ting: function () {
      play(function () {
        tone(1760, 1700, 0.22, 'triangle', 0.35, 0);
        tone(2640, 2600, 0.16, 'sine', 0.18, 0);
      });
    },
    // 코인 = "띵": 두 음 상승
    coin: function () {
      play(function () {
        tone(988, 988, 0.08, 'triangle', 0.3, 0);
        tone(1319, 1319, 0.14, 'triangle', 0.3, 0.06);
      });
    },
    // 오예 팡파르: 짧은 상승 아르페지오
    fanfare: function () {
      play(function () {
        var notes = [523, 659, 784, 1047];
        for (var i = 0; i < notes.length; i++) {
          var last = i === notes.length - 1;
          tone(notes[i], notes[i], last ? 0.45 : 0.14, 'triangle', 0.45, i * 0.12);
          tone(notes[i] * 2, notes[i] * 2, last ? 0.35 : 0.1, 'sine', 0.12, i * 0.12);
        }
      });
    }
  };
})();
