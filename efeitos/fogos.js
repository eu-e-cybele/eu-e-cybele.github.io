/* ==========================================================================
   efeitos/fogos.js
   O grande "Sim! 💖": o céu escurece, sobem foguetes que explodem em
   CORAÇÕES de luz (e alguns redondos), e aparece uma mensagem batendo como
   um coração. Clicar em "Sim" de novo repete o espetáculo (sem empilhar).
   Script clássico (sem módulos), não cria globais.
   ========================================================================== */
(function () {
  'use strict';

  var btnSim = document.getElementById('btnSim');
  if (!btnSim || !document.body) return;

  var mqReduz = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduz() { return !!(mqReduz && mqReduz.matches); }
  function ehToque() { return !!(window.matchMedia && window.matchMedia('(hover: none)').matches); }
  function agora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  var CORACOES = ['💖', '💕', '💗', '💓', '💞', '❤️', '🌸', '💘'];
  try {
    if (typeof EMOJIS !== 'undefined' && EMOJIS && EMOJIS.length) CORACOES = EMOJIS;
  } catch (e) { /* usa o padrão */ }

  /* ---------------------------------------------------------------- CSS */
  var ESTRELAS = [
    [8, 14, 1.6], [17, 32, 1], [26, 9, 1.2], [34, 24, 1.8], [43, 6, 1], [51, 19, 1.3],
    [60, 11, 1.7], [68, 29, 1], [76, 8, 1.4], [85, 21, 1.1], [92, 12, 1.6], [12, 44, 1],
    [30, 52, 1.2], [57, 41, 1], [73, 47, 1.3], [95, 38, 1], [4, 60, 1.1], [47, 63, 1],
    [82, 58, 1.2], [21, 70, 1]
  ].map(function (s) {
    return 'radial-gradient(' + s[2] + 'px ' + s[2] + 'px at ' + s[0] + '% ' + s[1] + '%,rgba(255,255,255,.95),rgba(255,255,255,0))';
  }).join(',');

  var CSS = [
    /* o véu fica ABAIXO dos corações da página (#coracoes z50, .explode z60,
       botão de música z80): assim a chuva e as explosões de corações do "Sim"
       original brilham sobre o céu noturno, em vez de virarem sombras escuras.
       As seções (z2) ficam por baixo dele; o canvas dos fogos (z220) por cima. */
    '.fogos-veu{position:fixed;inset:0;z-index:45;pointer-events:none;opacity:0;transition:opacity 1.3s ease;background:radial-gradient(ellipse at 50% 16%,rgba(80,18,58,.9) 0%,rgba(32,7,30,.94) 55%,rgba(12,3,14,.96) 100%)}',
    '.fogos-veu::before{content:"";position:absolute;inset:0;background-image:' + ESTRELAS + ';animation:fogos-estrelas 3.2s ease-in-out infinite alternate}',
    '.fogos-veu.fogos-forte{opacity:1}',
    '.fogos-veu.fogos-suave{opacity:.62}',
    '@keyframes fogos-estrelas{from{opacity:.4}to{opacity:1}}',

    '.fogos-canvas{position:fixed;left:0;top:0;width:100%;height:100%;z-index:220;pointer-events:none;display:block}',

    '.fogos-msg{position:fixed;inset:0;z-index:230;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:16px 16px calc(8vh + env(safe-area-inset-bottom,0px));pointer-events:none;font-family:"Quicksand",sans-serif}',
    /* telas baixas: o cartão fica no centro, então espera os primeiros corações brilharem */
    '@media (max-height:560px){.fogos-msg{justify-content:center;padding-bottom:16px}.fogos-cartao{padding:22px 22px 14px}.fogos-msg.fogos-in .fogos-cartao{transition-delay:3s,3s}.fogos-bate{font-size:2.2rem}.fogos-titulo{font-size:clamp(2.2rem,9vh,3.2rem)}.fogos-texto{margin-top:8px;font-size:1rem}.fogos-toque{margin-top:8px}}',
    '.fogos-cartao{position:relative;width:100%;max-width:430px;padding:30px 26px 20px;border-radius:28px;text-align:center;color:#5a2a3a;background:linear-gradient(160deg,rgba(255,255,255,.97),rgba(255,236,242,.94));border:1px solid rgba(255,255,255,.85);box-shadow:0 30px 80px rgba(139,30,63,.45),0 0 70px rgba(255,92,138,.35);pointer-events:auto;cursor:pointer;-webkit-tap-highlight-color:transparent;opacity:0;transform:translateY(26px) scale(.9);transition:opacity .8s ease .45s,transform 1s cubic-bezier(.2,1.25,.4,1) .45s}',
    '.fogos-cartao::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;animation:fogos-anel 1.4s ease-out infinite}',
    '.fogos-msg.fogos-in .fogos-cartao{opacity:1;transform:none}',
    '.fogos-msg.fogos-sai .fogos-cartao{opacity:0;transform:translateY(14px) scale(.94);transition:opacity .45s ease,transform .45s ease}',
    '.fogos-cartao.fogos-pulsa{animation:fogos-pop .6s ease}',
    '.fogos-bate{display:inline-block;font-size:2.8rem;line-height:1;filter:drop-shadow(0 6px 14px rgba(255,92,138,.5));animation:fogos-batida 1.4s ease-in-out infinite}',
    '.fogos-titulo{margin-top:8px;font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(2.6rem,11vw,3.9rem);line-height:1.08;color:#8b1e3f;animation:fogos-batida-suave 1.4s ease-in-out .08s infinite}',
    '.fogos-texto{margin-top:12px;font-size:1.08rem;line-height:1.6;font-weight:500}',
    '.fogos-toque{display:block;margin-top:14px;font-size:.8rem;letter-spacing:.08em;opacity:.55}',
    '.fogos-x{position:absolute;top:8px;right:8px;width:44px;height:44px;padding:0;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,92,138,.12);color:#8b1e3f;cursor:pointer;pointer-events:auto;touch-action:manipulation;font:inherit;transition:background .2s ease,transform .25s ease}',
    '.fogos-x:hover{background:rgba(255,92,138,.26);transform:rotate(90deg)}',
    '.fogos-x:focus-visible{outline:2px solid #ff5c8a;outline-offset:2px}',
    '.fogos-voa{position:absolute;z-index:2;pointer-events:none;line-height:1;transform:translate(-50%,-50%);animation:fogos-voa 1.2s cubic-bezier(.2,.8,.3,1) forwards}',
    '@keyframes fogos-voa{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--r))}}',
    '@keyframes fogos-batida{0%,100%{transform:scale(1)}14%{transform:scale(1.2)}28%{transform:scale(1)}42%{transform:scale(1.12)}70%{transform:scale(1)}}',
    '@keyframes fogos-batida-suave{0%,100%{transform:scale(1)}14%{transform:scale(1.045)}28%{transform:scale(1)}42%{transform:scale(1.03)}70%{transform:scale(1)}}',
    '@keyframes fogos-anel{0%{box-shadow:0 0 0 0 rgba(255,92,138,.45)}70%,100%{box-shadow:0 0 0 18px rgba(255,92,138,0)}}',
    '@keyframes fogos-pop{0%{transform:scale(1)}40%{transform:scale(1.05)}100%{transform:scale(1)}}',
    '@media (prefers-reduced-motion:reduce){',
    '.fogos-bate{animation-name:fogos-batida-suave;animation-duration:2.6s}',
    '.fogos-titulo{animation-duration:2.6s}',
    '.fogos-cartao::after{animation-duration:3s}',
    '.fogos-veu::before{animation-duration:6s}',
    '.fogos-cartao{transform:translateY(8px);transition:opacity .8s ease .3s,transform .8s ease .3s}',
    '.fogos-voa{animation-duration:1.6s!important}',
    '}'
  ].join('\n');

  var estilo = document.createElement('style');
  estilo.id = 'fogos-estilos';
  estilo.textContent = CSS;
  (document.head || document.documentElement).appendChild(estilo);

  /* ---------------------------------------------------------- utilidades */
  var ICO_X = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function tira(e) { if (e && e.parentNode) e.parentNode.removeChild(e); }
  function foca(e) {
    if (!e) return;
    try { e.focus({ preventScroll: true }); } catch (err) { try { e.focus(); } catch (err2) { /* ok */ } }
  }
  function aleat(a, b) { return a + Math.random() * (b - a); }

  function estadoMusica(m) {
    var campos = ['tocando', 'isPlaying', 'playing', 'estaTocando'];
    for (var i = 0; i < campos.length; i++) {
      var v = m[campos[i]];
      if (typeof v === 'function') { try { return !!v.call(m); } catch (e) { /* tenta o próximo */ } }
      else if (typeof v === 'boolean') return v;
    }
    if (typeof m.paused === 'boolean') return !m.paused;
    if (m.audio && typeof m.audio.paused === 'boolean') return !m.audio.paused;
    return null;
  }
  function tocaMusica() {
    var m = window.musica;
    if (!m) return;
    try {
      var estado = estadoMusica(m);
      if (estado === true) return;
      var nomes = ['tocar', 'play', 'iniciar', 'start', 'ligar'];
      for (var i = 0; i < nomes.length; i++) {
        if (typeof m[nomes[i]] === 'function') {
          var r = m[nomes[i]]();
          if (r && typeof r.then === 'function') r.then(null, function () {});
          return;
        }
      }
      if (estado === false) {
        var alt = m.alternar || m.toggle;
        if (typeof alt === 'function') alt.call(m);
      }
    } catch (e) { /* música é opcional */ }
  }

  /* ======================================================================
     FOGOS (canvas)
     ====================================================================== */
  var PALETAS = [
    ['#ff5c8a', '#ff8fab', '#ffd1dc'],   /* rosa */
    ['#ff2d55', '#ff6f91', '#ffc2d1'],   /* vermelho-rosado */
    ['#ffc94d', '#ffe08a', '#fff5d6'],   /* dourado */
    ['#ff7eb3', '#ffb3d1', '#ffffff'],   /* rosa-claro com branco */
    ['#e8174a', '#ff5c8a', '#ffd166']    /* vermelho com ouro */
  ];
  var COR_FAISCA = '#ffcf7a';
  var COR_BRILHO = '#fff3c4';
  var COR_CABECA = '#fff1c9';
  var LIMITE = 3200;
  var DRAG = 0.955;
  var ALCANCE = 1 / (1 - DRAG);   /* deslocamento total ≈ v0 * ALCANCE */

  var F = {
    cv: null, ctx: null, dpr: 1, W: 0, H: 0,
    raf: 0, ultimo: 0, relogio: 0,
    agenda: [], foguetes: [], parts: [], flashes: [],
    sprites: {}, veu: null, tVeu: 0
  };

  function hexRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* brilho pré-renderizado por cor (muito mais leve que shadowBlur) */
  function sprite(cor) {
    var s = F.sprites[cor];
    if (s) return s;
    s = document.createElement('canvas');
    s.width = s.height = 64;
    var c = s.getContext('2d');
    var rgb = hexRgb(cor).join(',');
    var g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.16, 'rgba(' + rgb + ',1)');
    g.addColorStop(0.42, 'rgba(' + rgb + ',.35)');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    F.sprites[cor] = s;
    return s;
  }

  function particula(x, y, vx, vy, cor, o) {
    if (F.parts.length >= LIMITE) return;
    F.parts.push({
      x: x, y: y, vx: vx, vy: vy,
      spr: sprite(cor),
      idade: 0, vida: o.vida, tam: o.tam,
      g: o.g, drag: o.drag,
      pisca: !!o.pisca, fase: Math.random() * 6.283
    });
  }

  function montaAgenda() {
    /* [tempo ms, tipo (c = coração, r = redondo), x (0-1), y (0-1), grande] */
    var plano = reduz() ? [
      [0, 'c', 0.5, 0.3], [1300, 'c', 0.3, 0.26], [2600, 'r', 0.7, 0.24],
      [3900, 'c', 0.68, 0.3], [5300, 'c', 0.5, 0.3, 1]
    ] : [
      [0, 'c', 0.5, 0.28], [450, 'c', 0.24, 0.34], [950, 'r', 0.76, 0.22],
      [1500, 'c', 0.72, 0.36], [2050, 'c', 0.3, 0.22], [2600, 'r', 0.52, 0.18],
      [3100, 'c', 0.2, 0.3], [3600, 'c', 0.8, 0.28], [4200, 'c', 0.46, 0.36],
      [4750, 'r', 0.28, 0.2], [5350, 'c', 0.64, 0.24], [5950, 'c', 0.5, 0.3, 1]
    ];
    var desloc = Math.floor(Math.random() * PALETAS.length);
    var out = [];
    for (var i = 0; i < plano.length; i++) {
      var p = plano[i];
      out.push({
        t: p[0],
        tipo: p[1] === 'c' ? 'coracao' : 'redondo',
        x: p[2], y: p[3],
        grande: !!p[4],
        paleta: p[4] ? PALETAS[0] : PALETAS[(i + desloc) % PALETAS.length]
      });
    }
    return out;
  }

  function lanca(ev) {
    var x = F.W * ev.x + (Math.random() - 0.5) * F.W * 0.06;
    var alvo = F.H * ev.y;
    var g = 0.16;
    var dist = Math.max(80, F.H + 10 - alvo);
    F.foguetes.push({
      x: x, y: F.H + 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.sqrt(2 * g * dist),
      g: g, ev: ev, acc: 0
    });
  }

  function explodeCoracao(x, y, grande, pal) {
    var r = reduz();
    var base = Math.min(F.W, F.H);
    var R = base * (grande ? 0.27 : 0.15) * aleat(0.9, 1.1);   /* meia-largura do coração */
    var n = r ? (grande ? 100 : 64) : (grande ? 170 : 110);
    var k = R / (16 * ALCANCE);
    var tilt = grande ? 0 : (Math.random() - 0.5) * 0.32;
    var cs = Math.cos(tilt), sn = Math.sin(tilt);
    var camadas = [
      { n: n, esc: 1, cor: pal[0], cor2: pal[1], tam: grande ? 2.8 : 2.4, vida: [1500, 2200] },
      { n: Math.round(n * 0.38), esc: 0.55, cor: pal[1], cor2: pal[2], tam: 1.6, vida: [1300, 1900] }
    ];
    for (var c = 0; c < camadas.length; c++) {
      var L = camadas[c];
      for (var i = 0; i < L.n; i++) {
        var t = (i / L.n) * Math.PI * 2;
        var st = Math.sin(t);
        var hx = 16 * st * st * st;
        var hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 2.5;
        var rx = hx * cs - hy * sn, ry = hx * sn + hy * cs;
        var j = aleat(0.965, 1.035) * L.esc * k;
        particula(x, y, rx * j, ry * j, (i % 5 === 0) ? L.cor2 : L.cor, {
          vida: aleat(L.vida[0], L.vida[1]), tam: L.tam, g: 0.022, drag: DRAG, pisca: Math.random() < 0.45
        });
      }
    }
    var brilhos = r ? 10 : (grande ? 44 : 26);
    for (var m = 0; m < brilhos; m++) {
      var a = Math.random() * Math.PI * 2, v = Math.random() * (R / ALCANCE) * 0.9;
      particula(x, y, Math.cos(a) * v, Math.sin(a) * v, COR_BRILHO, {
        vida: aleat(1800, 2700), tam: 1.4, g: 0.03, drag: 0.95, pisca: true
      });
    }
    if (!r) F.flashes.push({ x: x, y: y, raio: R * 1.5, idade: 0, vida: 420, spr: sprite(pal[0]) });
  }

  function explodeRedondo(x, y, pal) {
    var r = reduz();
    var R = Math.min(F.W, F.H) * aleat(0.15, 0.2);
    var n = r ? 50 : 90;
    var i, a, v;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2 + Math.random() * 0.05;
      v = (R / ALCANCE) * aleat(0.72, 1);
      particula(x, y, Math.cos(a) * v, Math.sin(a) * v, pal[Math.floor(Math.random() * 2)], {
        vida: aleat(1300, 2000), tam: 2.1, g: 0.03, drag: DRAG, pisca: Math.random() < 0.35
      });
    }
    var m = Math.round(n * 0.4);
    for (i = 0; i < m; i++) {
      a = (i / m) * Math.PI * 2;
      v = (R / ALCANCE) * 0.5;
      particula(x, y, Math.cos(a) * v, Math.sin(a) * v, pal[2], {
        vida: aleat(1100, 1600), tam: 1.7, g: 0.03, drag: DRAG, pisca: true
      });
    }
    if (!r) F.flashes.push({ x: x, y: y, raio: R * 1.1, idade: 0, vida: 360, spr: sprite(pal[1]) });
  }

  function explode(fg) {
    var ev = fg.ev;
    if (ev.tipo === 'coracao') explodeCoracao(fg.x, fg.y, ev.grande, ev.paleta);
    else explodeRedondo(fg.x, fg.y, ev.paleta);
  }

  function dimensiona() {
    if (!F.cv || !F.ctx) return;
    var de = document.documentElement;
    var W = window.innerWidth || de.clientWidth || 375;
    var H = window.innerHeight || de.clientHeight || 667;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (W * H * dpr * dpr > 4200000) dpr = Math.max(1, Math.sqrt(4200000 / (W * H)));
    F.W = W; F.H = H; F.dpr = dpr;
    F.cv.width = Math.round(W * dpr);
    F.cv.height = Math.round(H * dpr);
    F.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function criaCanvas() {
    if (F.cv) return true;
    var cv = document.createElement('canvas');
    cv.className = 'fogos-canvas';
    cv.setAttribute('aria-hidden', 'true');
    var ctx = null;
    try { ctx = cv.getContext('2d'); } catch (e) { ctx = null; }
    if (!ctx) return false;
    F.cv = cv;
    F.ctx = ctx;
    document.body.appendChild(cv);
    dimensiona();
    window.addEventListener('resize', dimensiona);
    return true;
  }

  function quadro(ts) {
    F.raf = 0;
    var ctx = F.ctx;
    if (!ctx) return;
    var dt = ts - F.ultimo;
    F.ultimo = ts;
    if (!(dt > 0)) dt = 0;
    if (dt > 50) dt = 50;
    var f = dt / 16.667;
    F.relogio += dt;

    while (F.agenda.length && F.agenda[0].t <= F.relogio) lanca(F.agenda.shift());

    /* rastro: apaga um pouquinho do quadro anterior */
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,' + (1 - Math.pow(0.78, f)).toFixed(3) + ')';
    ctx.fillRect(0, 0, F.W, F.H);
    ctx.globalCompositeOperation = 'lighter';

    var i, n, s, q, a;

    /* clarões das explosões */
    for (i = 0, n = 0; i < F.flashes.length; i++) {
      var fl = F.flashes[i];
      fl.idade += dt;
      q = fl.idade / fl.vida;
      if (q >= 1) continue;
      a = (1 - q) * (1 - q) * 0.55;
      s = fl.raio * 2 * (0.6 + 0.4 * q);
      ctx.globalAlpha = a;
      ctx.drawImage(fl.spr, fl.x - s / 2, fl.y - s / 2, s, s);
      F.flashes[n++] = fl;
    }
    F.flashes.length = n;

    /* foguetes subindo */
    var cabeca = sprite(COR_CABECA);
    for (i = 0, n = 0; i < F.foguetes.length; i++) {
      var fg = F.foguetes[i];
      fg.vy += fg.g * f;
      fg.x += fg.vx * f;
      fg.y += fg.vy * f;
      fg.acc += f;
      while (fg.acc >= 0.5) {
        fg.acc -= 0.5;
        particula(fg.x + aleat(-1, 1), fg.y + aleat(0, 3), aleat(-0.4, 0.4), aleat(0.3, 1.4), COR_FAISCA, {
          vida: aleat(350, 620), tam: 1.2, g: 0.02, drag: 0.92, pisca: false
        });
      }
      ctx.globalAlpha = 1;
      ctx.drawImage(cabeca, fg.x - 7, fg.y - 7, 14, 14);
      if (fg.vy >= -1.2) { explode(fg); continue; }
      F.foguetes[n++] = fg;
    }
    F.foguetes.length = n;

    /* partículas */
    var ps = F.parts;
    for (i = 0, n = 0; i < ps.length; i++) {
      var p = ps[i];
      p.idade += dt;
      if (p.idade >= p.vida) continue;
      var d = Math.pow(p.drag, f);
      p.vx *= d;
      p.vy = p.vy * d + p.g * f;
      p.x += p.vx * f;
      p.y += p.vy * f;
      q = p.idade / p.vida;
      a = q < 0.05 ? q / 0.05 : 1 - Math.pow((q - 0.05) / 0.95, 1.7);
      if (p.pisca && q > 0.35) a *= 0.45 + 0.55 * Math.abs(Math.sin(p.idade * 0.018 + p.fase));
      if (a > 0.015) {
        s = p.tam * 7 * (1 - q * 0.35);
        ctx.globalAlpha = a > 1 ? 1 : a;
        ctx.drawImage(p.spr, p.x - s / 2, p.y - s / 2, s, s);
      }
      ps[n++] = p;
    }
    ps.length = n;

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (!F.agenda.length && !F.foguetes.length && !F.parts.length && !F.flashes.length) {
      termina();
      return;
    }
    F.raf = requestAnimationFrame(quadro);
  }

  function termina() {
    if (F.raf) cancelAnimationFrame(F.raf);
    F.raf = 0;
    window.removeEventListener('resize', dimensiona);
    tira(F.cv);
    F.cv = null;
    F.ctx = null;
    F.agenda = [];
    F.foguetes = [];
    F.parts = [];
    F.flashes = [];
    atualizaVeu();
  }

  function dispara() {
    if (!criaCanvas()) return;
    F.agenda = montaAgenda();
    F.relogio = 0;
    veu('forte');
    if (!F.raf) {
      F.ultimo = agora();
      F.raf = requestAnimationFrame(quadro);
    }
  }

  /* ---- véu de "noite estrelada" que faz os fogos brilharem ---- */
  function veu(estado) {
    if (!F.veu) {
      if (estado === 'fora') return;
      F.veu = el('div', 'fogos-veu');
      F.veu.setAttribute('aria-hidden', 'true');
      document.body.appendChild(F.veu);
      void F.veu.offsetWidth;
    }
    clearTimeout(F.tVeu);
    F.veu.classList.toggle('fogos-forte', estado === 'forte');
    F.veu.classList.toggle('fogos-suave', estado === 'suave');
    if (estado === 'fora') {
      var v = F.veu;
      F.tVeu = setTimeout(function () {
        tira(v);
        if (F.veu === v) F.veu = null;
      }, 1400);
    }
  }
  function atualizaVeu() {
    if (F.raf || F.cv) veu('forte');
    else if (M.visivel) veu('suave');
    else veu('fora');
  }

  /* ======================================================================
     MENSAGEM
     ====================================================================== */
  var M = { el: null, cartao: null, x: null, visivel: false, tSai: 0 };

  function criaMensagem() {
    var m = el('div', 'fogos-msg');
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'false');
    m.setAttribute('aria-labelledby', 'fogos-titulo');
    m.style.display = 'none';
    m.innerHTML =
      '<div class="fogos-cartao">' +
        '<button type="button" class="fogos-x" aria-label="Fechar mensagem">' + ICO_X + '</button>' +
        '<div class="fogos-bate" aria-hidden="true">💖</div>' +
        '<div class="fogos-titulo" id="fogos-titulo">Eu te amo, Cybele</div>' +
        '<p class="fogos-texto">Obrigado por esses 6 meses.<br>Que venham todos os próximos. 💖</p>' +
        '<span class="fogos-toque" aria-hidden="true">' + (ehToque() ? 'toca pra fechar' : 'clica pra fechar') + '</span>' +
      '</div>';
    document.body.appendChild(m);
    M.el = m;
    M.cartao = m.querySelector('.fogos-cartao');
    M.x = m.querySelector('.fogos-x');

    M.cartao.addEventListener('click', function (e) {
      e.stopPropagation();
      var x, y;
      if (e.detail === 0 || (!e.clientX && !e.clientY)) {
        var r = M.cartao.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      } else {
        x = e.clientX;
        y = e.clientY;
      }
      fechaMensagem(x, y);
    });
    M.cartao.addEventListener('animationend', function (e) {
      if (e.target === M.cartao && e.animationName === 'fogos-pop') M.cartao.classList.remove('fogos-pulsa');
    });
  }

  function coracoesMsg(x, y, n) {
    for (var i = 0; i < n; i++) {
      var s = el('span', 'fogos-voa');
      s.textContent = CORACOES[Math.floor(Math.random() * CORACOES.length)];
      var ang = Math.random() * Math.PI * 2, dist = aleat(50, 130);
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.fontSize = aleat(14, 30).toFixed(0) + 'px';
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist - 50).toFixed(1) + 'px');
      s.style.setProperty('--r', aleat(-40, 40).toFixed(0) + 'deg');
      var dur = aleat(900, 1500);
      s.style.animationDuration = dur.toFixed(0) + 'ms';
      M.el.appendChild(s);
      setTimeout(tira.bind(null, s), dur + 80);
    }
  }

  /* outro overlay modal (fotos, história, potinho…) aberto por cima da mensagem? */
  function outroModalAberto() {
    var ds = document.querySelectorAll('[aria-modal="true"]');
    for (var i = 0; i < ds.length; i++) {
      if (ds[i] !== M.el && ds[i].getClientRects().length) return true;
    }
    return false;
  }

  function teclaM(e) {
    if (!M.visivel) return;
    if (e.key === 'Escape' || e.key === 'Esc') {
      /* o Esc pertence ao overlay que está na frente; a mensagem continua */
      if (outroModalAberto()) return;
      e.preventDefault();
      fechaMensagem();
    }
  }

  function mostraMensagem() {
    if (!M.el) criaMensagem();
    clearTimeout(M.tSai);
    M.el.classList.remove('fogos-sai');
    if (M.visivel) {
      M.cartao.classList.remove('fogos-pulsa');
      void M.cartao.offsetWidth;
      M.cartao.classList.add('fogos-pulsa');
      return;
    }
    M.visivel = true;
    M.el.style.display = '';
    void M.el.offsetWidth;
    M.el.classList.add('fogos-in');
    document.addEventListener('keydown', teclaM, true);
    foca(M.x);
  }

  function fechaMensagem(x, y) {
    if (!M.visivel) return;
    M.visivel = false;
    document.removeEventListener('keydown', teclaM, true);
    var focoDentro = M.el.contains(document.activeElement);
    if (typeof x === 'number' && typeof y === 'number') coracoesMsg(x, y, reduz() ? 6 : 14);
    M.el.classList.remove('fogos-in');
    M.el.classList.add('fogos-sai');
    clearTimeout(M.tSai);
    M.tSai = setTimeout(function () {
      M.el.classList.remove('fogos-sai');
      M.el.style.display = 'none';
    }, 1600);
    atualizaVeu();
    if (focoDentro) foca(btnSim);
  }

  /* ======================================================================
     O "SIM"
     ====================================================================== */
  btnSim.addEventListener('click', function () {
    tocaMusica();
    dispara();
    mostraMensagem();
  });
})();
