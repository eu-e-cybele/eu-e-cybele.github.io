/* =====================================================================
   efeitos/intro.js
   Abertura em tela cheia: céu noturno rosado com estrelinhas, um texto
   que se escreve sozinho e um coração que se enche de amor enquanto ela
   segura. Ao completar, o coração explode em corações, a abertura some
   e a música começa.
   Não cria globais. Enquanto a abertura está na tela, <html> recebe a
   classe "intro-ativa". Ao terminar, dispara document "intro:aberta".
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  if (!body || doc.querySelector('.intro-overlay')) return;

  var reduzido = false;
  try {
    reduzido = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* sem matchMedia */ }

  var TAU = Math.PI * 2;
  var TEMPO_SEGURAR = 1600;   // ms segurando para abrir
  var TEMPO_ESVAZIAR = 1100;  // ms para esvaziar se soltar antes
  var TEXTO_1 = 'Oi, meu amor…';
  var TEXTO_2 = 'Preparei uma coisinha pra você 💌';
  var MSG_INICIAL = 'Segure o coração para abrir';
  var MSG_FINAL = 'Feliz 6 meses, Cybele 💖';
  var CORACAO = 'M50 88C22 66 4 50 4 29C4 14 15 4 28 4C38 4 46 10 50 18C54 10 62 4 72 4C85 4 96 14 96 29C96 50 78 66 50 88Z';
  var CORES = ['#ffd1dc', '#ff8fab', '#ffe3a1', '#ffffff', '#ff5c8a', '#ffc2d4'];

  /* ------------------------------------------------------------------
     Estilos (tudo prefixado com "intro-")
     ------------------------------------------------------------------ */
  var CSS = [
    'html.intro-ativa,html.intro-ativa body{overflow:hidden!important}',
    'html.intro-estourando .explode{z-index:320!important}',
    'html.intro-estourando #coracoes{z-index:310!important}',

    '.intro-overlay{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;',
    'padding:24px 16px;overflow:hidden;text-align:center;color:#fff1f5;font-family:"Quicksand",sans-serif;',
    'background:radial-gradient(120% 60% at 50% 108%,rgba(255,92,138,.55) 0%,rgba(139,30,63,.38) 38%,rgba(139,30,63,0) 70%),',
    'radial-gradient(90% 55% at 50% -5%,rgba(126,58,140,.45) 0%,rgba(126,58,140,0) 70%),',
    'linear-gradient(180deg,#16061b 0%,#2a0b29 48%,#45112f 100%);',
    '-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;',
    '-webkit-tap-highlight-color:transparent;overscroll-behavior:contain;opacity:1;transition:opacity 1.3s ease .45s}',
    '.intro-overlay.intro-saindo{opacity:0;pointer-events:none}',
    // movimento reduzido: o esmaecer termina (0,2s + 0,8s) antes da remoção (1,3s)
    '.intro-overlay.intro-reduzido{transition:opacity .8s ease .2s}',
    '.intro-ceu{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}',

    '.intro-conteudo{position:relative;z-index:1;width:100%;max-width:520px;display:flex;flex-direction:column;align-items:center;',
    'transition:transform 1.5s cubic-bezier(.2,.7,.2,1) .3s,opacity 1s ease .4s}',
    '.intro-saindo .intro-conteudo{transform:scale(1.15);opacity:0}',
    '.intro-reduzido.intro-saindo .intro-conteudo{transform:none}',
    '.intro-reduzido .intro-conteudo{transition:transform .8s ease .1s,opacity .7s ease .1s}',

    '.intro-l1{margin:0;font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(2.5rem,11vw,3.8rem);',
    'line-height:1.2;min-height:1.2em;color:#ffd1dc;text-shadow:0 0 14px rgba(255,92,138,.8),0 0 38px rgba(255,92,138,.4)}',
    '.intro-l2{margin:8px 0 0;font-size:clamp(1.05rem,4.4vw,1.3rem);font-weight:500;line-height:1.5;min-height:1.5em;',
    'color:#fff1f5;letter-spacing:.01em;text-shadow:0 0 12px rgba(255,92,138,.35)}',
    '.intro-cursor{display:inline-block;width:2px;height:.95em;margin-left:3px;vertical-align:-.1em;border-radius:2px;',
    'background:currentColor;box-shadow:0 0 8px rgba(255,209,220,.9);animation:intro-pisca 1.05s steps(1,end) infinite;transition:opacity .5s}',
    '.intro-cursor.intro-some{opacity:0}',
    '@keyframes intro-pisca{50%{opacity:0}}',
    '.intro-sr{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;',
    'clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}',

    '.intro-palco{--intro-tam:min(52vw,210px,32vh);position:relative;width:var(--intro-tam);height:calc(var(--intro-tam)*.92);',
    'margin-top:clamp(20px,5vh,38px);opacity:0;visibility:hidden;transform:translateY(18px) scale(.6);',
    'transition:opacity .9s ease,transform 1.1s cubic-bezier(.2,1.5,.4,1),visibility 0s linear .9s}',
    '.intro-palco.intro-on{opacity:1;visibility:visible;transform:none;',
    'transition:opacity .9s ease,transform 1.1s cubic-bezier(.2,1.5,.4,1),visibility 0s}',
    '.intro-aura{position:absolute;left:calc(var(--intro-tam)*-.4);top:calc(var(--intro-tam)*-.44);',
    'width:calc(var(--intro-tam)*1.8);height:calc(var(--intro-tam)*1.8);border-radius:50%;pointer-events:none;opacity:.4;',
    'background:radial-gradient(circle closest-side,rgba(255,92,138,.62) 0%,rgba(255,92,138,.22) 45%,rgba(255,92,138,0) 100%);',
    'will-change:transform,opacity}',
    '.intro-eco{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;opacity:0;',
    'animation:intro-eco 3s cubic-bezier(.2,.6,.3,1) infinite}',
    '.intro-eco+.intro-eco{animation-delay:1.5s}',
    '@keyframes intro-eco{0%{transform:scale(1);opacity:.55}100%{transform:scale(1.6);opacity:0}}',
    '.intro-reduzido .intro-eco{animation-duration:5s}',
    '.intro-reduzido .intro-eco+.intro-eco{animation-delay:2.5s}',
    '.intro-segurando .intro-eco,.intro-concluido .intro-eco{display:none}',

    '.intro-coracao{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;border-radius:42%;',
    'background:transparent;color:inherit;font:inherit;cursor:pointer;outline:none;touch-action:none;',
    '-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;',
    'will-change:transform}',
    '.intro-coracao::-moz-focus-inner{border:0}',
    '.intro-coracao svg{display:block;width:100%;height:100%;overflow:visible;pointer-events:none}',
    '.intro-foco{opacity:0;transition:opacity .3s}',
    // o contorno de foco só aparece para quem usa teclado (o foco é dado por script,
    // e alguns navegadores mostrariam o anel mesmo sem teclado)
    '.intro-teclado .intro-coracao:focus .intro-foco{opacity:.85}',

    '.intro-instrucao{margin:clamp(18px,4vh,30px) 0 0;min-height:1.6em;font-size:clamp(.98rem,3.9vw,1.12rem);font-weight:600;',
    'letter-spacing:.02em;color:#ffd1dc;opacity:0;transform:translateY(6px);transition:opacity .8s ease,transform .8s ease;',
    'text-shadow:0 0 10px rgba(255,92,138,.55)}',
    '.intro-instrucao.intro-on{opacity:1;transform:none}',
    '.intro-msg{display:inline-block;animation:intro-respira 2.8s ease-in-out infinite}',
    '@keyframes intro-respira{0%,100%{opacity:1}50%{opacity:.62}}',
    '.intro-segurando~.intro-instrucao .intro-msg{animation:none}',
    '.intro-instrucao.intro-final{font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(2rem,8.5vw,2.8rem);',
    'color:#fff;letter-spacing:0;text-shadow:0 0 16px rgba(255,92,138,.9),0 0 40px rgba(255,92,138,.5);',
    'animation:intro-final .9s cubic-bezier(.2,1.4,.4,1) both}',
    '.intro-instrucao.intro-final .intro-msg{animation:none}',
    '@keyframes intro-final{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}',

    '.intro-florescer{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;',
    'pointer-events:none;z-index:0;opacity:0;transform:scale(0);',
    'background:radial-gradient(circle closest-side,rgba(255,245,248,.95) 0%,rgba(255,170,198,.7) 40%,rgba(255,92,138,0) 100%)}',
    '.intro-florescer.intro-on{animation:intro-florescer 1.6s cubic-bezier(.15,.7,.3,1) forwards}',
    '.intro-reduzido .intro-florescer.intro-on{animation-duration:1s}',
    '@keyframes intro-florescer{0%{transform:scale(0);opacity:.95}45%{opacity:.75}100%{transform:scale(var(--intro-fl,40));opacity:0}}'
  ].join('');

  var estilo = doc.createElement('style');
  estilo.setAttribute('data-efeito', 'intro');
  estilo.textContent = CSS;
  (doc.head || root).appendChild(estilo);

  /* ------------------------------------------------------------------
     Estrutura
     ------------------------------------------------------------------ */
  var ECO = '<svg class="intro-eco" viewBox="0 0 100 92" aria-hidden="true" focusable="false">' +
    '<path d="' + CORACAO + '" fill="none" stroke="#ffd1dc" stroke-width="1.6"/></svg>';

  var SVG =
    '<svg viewBox="0 0 100 92" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="intro-g-cheio" x1="0" y1="1" x2=".25" y2="0">' +
          '<stop offset="0" stop-color="#b3124f"/>' +
          '<stop offset=".5" stop-color="#ff5c8a"/>' +
          '<stop offset="1" stop-color="#ffa3bf"/>' +
        '</linearGradient>' +
        '<radialGradient id="intro-g-vazio" cx=".5" cy=".42" r=".65">' +
          '<stop offset="0" stop-color="#ff8fab" stop-opacity=".3"/>' +
          '<stop offset="1" stop-color="#ff5c8a" stop-opacity=".07"/>' +
        '</radialGradient>' +
        '<clipPath id="intro-clip-nivel"><path class="intro-nivel" d="M-4 96L-4 92L104 92L104 96Z"/></clipPath>' +
        '<clipPath id="intro-clip-forma"><path d="' + CORACAO + '"/></clipPath>' +
      '</defs>' +
      '<path d="' + CORACAO + '" fill="url(#intro-g-vazio)"/>' +
      '<path d="' + CORACAO + '" fill="url(#intro-g-cheio)" clip-path="url(#intro-clip-nivel)"/>' +
      '<path class="intro-superficie" d="M0 0" fill="none" stroke="#ffe4ec" stroke-width="1.6" stroke-linecap="round" clip-path="url(#intro-clip-forma)" opacity="0"/>' +
      '<path d="' + CORACAO + '" fill="none" stroke="#ffd1dc" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path class="intro-foco" d="' + CORACAO + '" fill="none" stroke="#fff" stroke-width="1.4" stroke-dasharray="2 5" stroke-linecap="round" transform="translate(50 46) scale(1.16) translate(-50 -46)"/>' +
      '<ellipse cx="29" cy="24" rx="11" ry="6" fill="#fff" opacity=".3" transform="rotate(-35 29 24)"/>' +
      '<circle cx="19.5" cy="35" r="2.3" fill="#fff" opacity=".35"/>' +
    '</svg>';

  var overlay = doc.createElement('div');
  overlay.className = 'intro-overlay' + (reduzido ? ' intro-reduzido' : '');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Uma surpresa pra você');
  overlay.innerHTML =
    '<canvas class="intro-ceu" aria-hidden="true"></canvas>' +
    '<span class="intro-florescer" aria-hidden="true"></span>' +
    '<div class="intro-conteudo">' +
      '<p class="intro-l1"><span class="intro-sr">' + TEXTO_1 + '</span><span class="intro-dig" aria-hidden="true"></span></p>' +
      '<p class="intro-l2"><span class="intro-sr">' + TEXTO_2 + '</span><span class="intro-dig" aria-hidden="true"></span></p>' +
      '<div class="intro-palco">' +
        '<span class="intro-aura" aria-hidden="true"></span>' + ECO + ECO +
        '<button type="button" class="intro-coracao" aria-label="Segure o coração para abrir a surpresa">' + SVG + '</button>' +
      '</div>' +
      '<p class="intro-instrucao"><span class="intro-msg">' + MSG_INICIAL + '</span></p>' +
    '</div>';
  body.appendChild(overlay);
  root.classList.add('intro-ativa');
  root.classList.remove('intro-pre'); // opcional: o index pode esconder a página até aqui

  var canvas = overlay.querySelector('.intro-ceu');
  var florescer = overlay.querySelector('.intro-florescer');
  var digs = overlay.querySelectorAll('.intro-dig');
  var palco = overlay.querySelector('.intro-palco');
  var aura = overlay.querySelector('.intro-aura');
  var botao = overlay.querySelector('.intro-coracao');
  var nivel = overlay.querySelector('.intro-nivel');
  var superficie = overlay.querySelector('.intro-superficie');
  var instr = overlay.querySelector('.intro-instrucao');
  var msgEl = overlay.querySelector('.intro-msg');
  if (!canvas || digs.length < 2 || !palco || !aura || !botao || !nivel || !superficie || !instr || !msgEl) {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    root.classList.remove('intro-ativa');
    return;
  }

  // começa sempre do topo da página
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* ignora */ }
  try {
    var sbAntes = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = sbAntes;
  } catch (e) { /* ignora */ }

  /* ------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------ */
  var timers = [];
  function depois(fn, ms) {
    var id = setTimeout(function () {
      var i = timers.indexOf(id);
      if (i >= 0) timers.splice(i, 1);
      fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function limpaTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers.length = 0;
  }
  function entre(a, b) { return a + Math.random() * (b - a); }
  function corAleatoria() { return CORES[(Math.random() * CORES.length) | 0]; }
  function vibra(padrao) {
    try {
      var ua = navigator.userActivation;
      if (ua && ua.hasBeenActive && navigator.vibrate) navigator.vibrate(padrao);
    } catch (e) { /* ignora */ }
  }

  /* ------------------------------------------------------------------
     Estado
     ------------------------------------------------------------------ */
  var pronto = false;       // coração visível e interativo
  var concluido = false;
  var segurando = false;
  var ponteiro = null;
  var teclado = false;
  var ultimaInteracao = 0;
  var p = 0;                // progresso real (0..1)
  var pv = 0;               // progresso exibido (suavizado)
  var pvAnterior = -1;
  var fase = 0;             // fase do batimento
  var tConclusao = 0;
  var msgAtual = MSG_INICIAL;
  var raf = 0;
  var ultimoQuadro = 0;
  var acumulado = 0;
  var centro = { x: 0, y: 0, w: 0 };

  function medeCoracao() {
    var r = palco.getBoundingClientRect();
    centro.x = r.left + r.width / 2;
    centro.y = r.top + r.height / 2;
    centro.w = r.width;
  }

  /* ------------------------------------------------------------------
     Texto que se escreve sozinho
     ------------------------------------------------------------------ */
  var cursor = doc.createElement('span');
  cursor.className = 'intro-cursor';
  cursor.setAttribute('aria-hidden', 'true');

  var LINHAS = [
    { el: digs[0], chars: Array.from(TEXTO_1), min: 70, max: 125 },
    { el: digs[1], chars: Array.from(TEXTO_2), min: 38, max: 80 }
  ];
  var digitando = false;
  var timerDig = 0;

  function digita(li, ci) {
    var L = LINHAS[li];
    if (ci === 0) L.el.parentNode.appendChild(cursor);
    L.el.textContent = L.chars.slice(0, ci).join('');
    if (ci < L.chars.length) {
      var anterior = ci > 0 ? L.chars[ci - 1] : '';
      var espera = entre(L.min, L.max) * (reduzido ? 0.45 : 1);
      if (anterior === ',') espera += reduzido ? 120 : 320;
      if (anterior === ' ') espera *= 0.7;
      timerDig = depois(function () { digita(li, ci + 1); }, espera);
    } else if (li + 1 < LINHAS.length) {
      timerDig = depois(function () { digita(li + 1, 0); }, reduzido ? 350 : 750);
    } else {
      timerDig = depois(fimDigitacao, reduzido ? 250 : 550);
    }
  }

  function comecaDigitacao() {
    if (digitando || pronto) return;
    digitando = true;
    depois(function () { if (digitando) digita(0, 0); }, reduzido ? 150 : 350);
  }

  function fimDigitacao() {
    if (pronto) return;
    digitando = false;
    clearTimeout(timerDig);
    LINHAS.forEach(function (L) { L.el.textContent = L.chars.join(''); });
    if (cursor.parentNode !== LINHAS[1].el.parentNode) LINHAS[1].el.parentNode.appendChild(cursor);
    depois(function () { cursor.classList.add('intro-some'); }, 500);
    depois(function () { if (cursor.parentNode) cursor.parentNode.removeChild(cursor); }, 1100);
    mostraCoracao();
  }

  function mostraCoracao() {
    if (pronto) return;
    pronto = true;
    palco.classList.add('intro-on');
    depois(function () { instr.classList.add('intro-on'); }, 450);
    depois(medeCoracao, 1150);
    depois(function () {
      if (concluido) return;
      try { botao.focus({ preventScroll: true }); } catch (e) { botao.focus(); }
    }, 500);
    medeCoracao();
  }

  // espera a fonte cursiva carregar (no máximo ~1,4s) para não "piscar" a letra
  var iniciou = false;
  function inicia() {
    if (iniciou) return;
    iniciou = true;
    comecaDigitacao();
  }
  try {
    if (doc.fonts && doc.fonts.load) doc.fonts.load('700 40px "Dancing Script"').then(inicia, inicia);
  } catch (e) { /* ignora */ }
  depois(inicia, 1400);

  /* ------------------------------------------------------------------
     Céu: estrelas, coraçõezinhos flutuando, estrela cadente e poeira
     ------------------------------------------------------------------ */
  var g = null;
  try { g = canvas.getContext('2d'); } catch (e) { g = null; }
  var W = 0, H = 0, dpr = 1;
  var estrelas = [], bolhas = [], particulas = [];
  var cadente = null, proximaCadente = 0;
  var MAX_PARTICULAS = reduzido ? 120 : 280;

  function criaCeu() {
    var n = Math.round(Math.min(230, Math.max(70, (W * H) / 4200)));
    estrelas = [];
    for (var i = 0; i < n; i++) {
      estrelas.push({
        x: Math.random(),
        y: Math.pow(Math.random(), 1.35),
        r: 0.35 + Math.pow(Math.random(), 2.2) * 1.45,
        a: 0.35 + Math.random() * 0.65,
        v: (0.6 + Math.random() * 1.9) * (reduzido ? 0.4 : 1),
        f: Math.random() * TAU,
        cor: Math.random() < 0.28 ? '#ffc2d4' : '#ffffff'
      });
    }
    bolhas = [];
    var nb = W < 500 ? 7 : 11;
    for (var j = 0; j < nb; j++) {
      bolhas.push({
        x: Math.random(),
        y: Math.random() * 1.1,
        s: 8 + Math.random() * 16,
        v: (reduzido ? 4 : 9) + Math.random() * 12,
        amp: 8 + Math.random() * 18,
        f: Math.random() * TAU,
        a: 0.06 + Math.random() * 0.12
      });
    }
  }

  function redimensiona() {
    var w = overlay.clientWidth || window.innerWidth;
    var h = overlay.clientHeight || window.innerHeight;
    var mudouMuito = !estrelas.length || Math.abs(w - W) > 120 || Math.abs(h - H) > 160;
    W = w;
    H = h;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    if (g) {
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (mudouMuito) criaCeu();
    var diag = Math.sqrt(W * W + H * H);
    florescer.style.setProperty('--intro-fl', ((diag * 2.2) / 60).toFixed(1));
    medeCoracao();
  }

  function tracaCoracao(x, y, s) {
    g.beginPath();
    g.moveTo(x, y + s * 0.45);
    g.bezierCurveTo(x - s * 0.1, y + s * 0.35, x - s * 0.5, y + s * 0.1, x - s * 0.5, y - s * 0.15);
    g.bezierCurveTo(x - s * 0.5, y - s * 0.42, x - s * 0.2, y - s * 0.52, x, y - s * 0.28);
    g.bezierCurveTo(x + s * 0.2, y - s * 0.52, x + s * 0.5, y - s * 0.42, x + s * 0.5, y - s * 0.15);
    g.bezierCurveTo(x + s * 0.5, y + s * 0.1, x + s * 0.1, y + s * 0.35, x, y + s * 0.45);
    g.closePath();
  }

  function tracaBrilho(x, y, s) {
    g.beginPath();
    g.moveTo(x, y - s);
    g.quadraticCurveTo(x, y, x + s, y);
    g.quadraticCurveTo(x, y, x, y + s);
    g.quadraticCurveTo(x, y, x - s, y);
    g.quadraticCurveTo(x, y, x, y - s);
    g.closePath();
  }

  function particula(x, y, vx, vy, vida, r, tipo) {
    if (particulas.length >= MAX_PARTICULAS) return;
    particulas.push({ x: x, y: y, vx: vx, vy: vy, vida: vida, max: vida, r: r, cor: corAleatoria(), tipo: tipo });
  }

  function faisca(x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU;
      var vel = (50 + Math.random() * 140) * (reduzido ? 0.5 : 1);
      particula(x, y, Math.cos(a) * vel, Math.sin(a) * vel - 20, 0.7 + Math.random() * 0.6,
        1 + Math.random() * 1.8, Math.random() < 0.35 ? 1 : 0);
    }
  }

  function poeira(x, y) {
    var n = reduzido ? 1 : 2;
    for (var i = 0; i < n; i++) {
      particula(x + entre(-4, 4), y + entre(-4, 4), entre(-18, 18), entre(-30, -8),
        0.6 + Math.random() * 0.6, 0.8 + Math.random() * 1.4, Math.random() < 0.25 ? 1 : 0);
    }
  }

  // ponto no contorno de um coração (curva paramétrica clássica)
  function pontoCoracao(a) {
    var s = Math.sin(a);
    return {
      x: 16 * s * s * s,
      y: 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)
    };
  }

  // no final: um coração feito de estrelas que se expande
  function coracaoDeEstrelas(cx, cy) {
    var n = reduzido ? 36 : 84;
    var k = reduzido ? 9 : 16;
    for (var i = 0; i < n; i++) {
      var pt = pontoCoracao((i / n) * TAU);
      particula(cx, cy, pt.x * k, -(pt.y + 2.5) * k, 1.3 + Math.random() * 0.5,
        1.1 + Math.random() * 1.4, i % 3 === 0 ? 1 : 0);
    }
  }

  function brilhosDoCoracao(dt) {
    if (!segurando || concluido || !centro.w) return;
    acumulado += dt * (8 + 40 * p) * (reduzido ? 0.4 : 1);
    var k = (centro.w * 0.92) / 32;
    while (acumulado >= 1) {
      acumulado -= 1;
      var pt = pontoCoracao(Math.random() * TAU);
      particula(centro.x + pt.x * k, centro.y - (pt.y + 2.5) * k, entre(-12, 12), -(25 + Math.random() * 55),
        0.8 + Math.random() * 0.7, 0.8 + Math.random() * 1.6, Math.random() < 0.3 ? 1 : 0);
    }
  }

  function desenhaCeu(dt, t) {
    if (!g || !W) return;
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);

    // coraçõezinhos desfocados subindo devagar
    g.fillStyle = '#ff8fab';
    for (var b = 0; b < bolhas.length; b++) {
      var bo = bolhas[b];
      bo.y -= (bo.v * dt) / H;
      if (bo.y < -0.08) {
        bo.y = 1.08;
        bo.x = Math.random();
      }
      g.globalAlpha = bo.a;
      tracaCoracao(bo.x * W + Math.sin(t * 0.5 + bo.f) * bo.amp, bo.y * H, bo.s);
      g.fill();
    }

    // estrelas piscando
    for (var i = 0; i < estrelas.length; i++) {
      var s = estrelas[i];
      var a = s.a * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.v + s.f)));
      var x = s.x * W;
      var y = s.y * H;
      g.globalAlpha = a;
      g.fillStyle = s.cor;
      g.beginPath();
      g.arc(x, y, s.r, 0, TAU);
      g.fill();
      if (s.r > 1.2 && a > 0.55) {
        var L = s.r * 3.2 * a;
        g.strokeStyle = s.cor;
        g.lineWidth = 0.7;
        g.beginPath();
        g.moveTo(x - L, y);
        g.lineTo(x + L, y);
        g.moveTo(x, y - L);
        g.lineTo(x, y + L);
        g.stroke();
      }
    }

    // estrela cadente de vez em quando
    if (!reduzido) {
      if (!proximaCadente) proximaCadente = t + 2.5;
      if (!cadente && t > proximaCadente) {
        cadente = {
          x: W * (0.25 + Math.random() * 0.75),
          y: H * Math.random() * 0.35,
          vx: -(260 + Math.random() * 220),
          vy: 110 + Math.random() * 90,
          vida: 0.9
        };
        proximaCadente = t + 5 + Math.random() * 7;
      }
      if (cadente) {
        cadente.x += cadente.vx * dt;
        cadente.y += cadente.vy * dt;
        cadente.vida -= dt;
        if (cadente.vida <= 0) {
          cadente = null;
        } else {
          var cx = cadente.x - cadente.vx * 0.16;
          var cy = cadente.y - cadente.vy * 0.16;
          var gr = g.createLinearGradient(cx, cy, cadente.x, cadente.y);
          gr.addColorStop(0, 'rgba(255,255,255,0)');
          gr.addColorStop(1, 'rgba(255,238,244,0.95)');
          g.globalAlpha = Math.min(1, cadente.vida * 2);
          g.strokeStyle = gr;
          g.lineWidth = 1.4;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(cx, cy);
          g.lineTo(cadente.x, cadente.y);
          g.stroke();
        }
      }
    }

    // poeira de estrelas (brilho somado)
    g.globalCompositeOperation = 'lighter';
    var atrito = Math.max(0, 1 - 1.6 * dt);
    for (var j = particulas.length - 1; j >= 0; j--) {
      var q = particulas[j];
      q.vida -= dt;
      if (q.vida <= 0) {
        particulas[j] = particulas[particulas.length - 1];
        particulas.pop();
        continue;
      }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= atrito;
      q.vy = q.vy * atrito - 6 * dt;
      var k2 = q.vida / q.max;
      var al = Math.min(1, k2 * 1.6);
      g.fillStyle = q.cor;
      if (q.tipo === 1) {
        g.globalAlpha = al;
        tracaBrilho(q.x, q.y, q.r * 2.6);
        g.fill();
      } else {
        g.globalAlpha = al * 0.22;
        g.beginPath();
        g.arc(q.x, q.y, q.r * 3.2, 0, TAU);
        g.fill();
        g.globalAlpha = al;
        g.beginPath();
        g.arc(q.x, q.y, q.r, 0, TAU);
        g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------
     Coração: batimento, tremidinha, brilho e o "líquido" subindo
     ------------------------------------------------------------------ */
  function linhaOnda(y0, t, amp) {
    var d = '';
    for (var x = -4; x <= 104; x += 6) {
      var y = y0 + Math.sin(x * 0.075 + t * 3.1) * amp + Math.sin(x * 0.13 - t * 2.2) * amp * 0.45;
      d += (d ? ' L' : 'M') + x + ' ' + y.toFixed(2);
    }
    return d;
  }

  function mensagem() {
    if (concluido) return;
    var m;
    if (segurando) {
      if (p < 0.15) m = 'Isso… continua segurando 💗';
      else if (p < 0.5) m = 'Enchendo de amor…';
      else if (p < 0.85) m = 'Só mais um pouquinho…';
      else m = 'Quase lá! 💞';
    } else if (p > 0.02) {
      m = 'Ei, não solta ainda 🥺';
    } else {
      m = MSG_INICIAL;
    }
    if (m !== msgAtual) {
      msgAtual = m;
      msgEl.textContent = m;
    }
  }

  function atualizaCoracao(dt, t, agoraMs) {
    if (!pronto) return;
    var bpm = segurando ? 72 + 100 * p : 60;
    fase += (dt * bpm) / 60;
    var f = fase % 1;
    var pulso = Math.exp(-Math.pow((f - 0.08) / 0.06, 2)) + 0.55 * Math.exp(-Math.pow((f - 0.3) / 0.07, 2));
    pv += (p - pv) * Math.min(1, dt * 14);

    var esc, jx = 0, jy = 0, auraOp, auraEsc, opac = 1;
    if (concluido) {
      var tc = (agoraMs - tConclusao) / 1000;
      var e1 = 1 - Math.pow(1 - Math.min(1, tc / 0.45), 3);
      esc = 1.1 + 0.35 * e1;
      opac = 1 - Math.max(0, Math.min(1, (tc - 0.35) / 0.6));
      auraOp = Math.max(0, 1 - tc / 1.2);
      auraEsc = 1.4 + e1 * 0.9;
      pv = 1;
    } else {
      esc = 1 + (reduzido ? 0.018 : 0.045) * pulso + 0.1 * pv;
      if (segurando && !reduzido) {
        var amp = 0.35 + 1.9 * pv;
        jx = (Math.random() * 2 - 1) * amp;
        jy = (Math.random() * 2 - 1) * amp;
      }
      auraOp = 0.32 + 0.22 * pulso + 0.46 * pv;
      auraEsc = 0.9 + 0.12 * pulso + 0.5 * pv;
    }
    botao.style.transform = 'translate(' + jx.toFixed(2) + 'px,' + jy.toFixed(2) + 'px) scale(' + esc.toFixed(4) + ')';
    if (opac < 1) botao.style.opacity = opac.toFixed(3);
    aura.style.opacity = Math.min(1, auraOp).toFixed(3);
    aura.style.transform = 'scale(' + auraEsc.toFixed(4) + ')';

    if (pv > 0.002 || pvAnterior > 0.002 || pvAnterior < 0) {
      var y0 = 90 - pv * 88;
      var ampOnda = concluido ? 0 : (segurando ? 2.4 : 1.2) * Math.sin(Math.PI * Math.min(1, pv));
      var onda = linhaOnda(y0, t, ampOnda);
      nivel.setAttribute('d', onda + ' L104 96 L-4 96Z');
      superficie.setAttribute('d', onda);
      superficie.style.opacity = pv > 0.01 && pv < 0.985 ? '0.8' : '0';
    }
    pvAnterior = pv;
    mensagem();
  }

  /* ------------------------------------------------------------------
     Laço de animação
     ------------------------------------------------------------------ */
  function quadro(agoraMs) {
    raf = requestAnimationFrame(quadro);
    if (!ultimoQuadro) ultimoQuadro = agoraMs;
    var real = Math.max(0, agoraMs - ultimoQuadro);
    ultimoQuadro = agoraMs;
    // o tempo de segurar segue o relógio mesmo em aparelhos lentos (até 150ms por quadro);
    // já a física das partículas usa passos pequenos para ficar estável
    var dtProgresso = Math.min(150, real);
    var dt = Math.min(50, real) / 1000;
    var t = agoraMs / 1000;

    if (pronto && !concluido) {
      if (segurando) p = Math.min(1, p + dtProgresso / TEMPO_SEGURAR);
      else p = Math.max(0, p - dtProgresso / TEMPO_ESVAZIAR);
      if (p >= 1 && segurando) conclui();
    }
    brilhosDoCoracao(dt);
    atualizaCoracao(dt, t, agoraMs);
    desenhaCeu(dt, t);
  }

  /* ------------------------------------------------------------------
     Segurar / soltar
     ------------------------------------------------------------------ */
  function comeca() {
    if (!pronto || concluido || segurando) return;
    segurando = true;
    palco.classList.add('intro-segurando');
    mensagem();
  }

  function solta() {
    if (!segurando) return;
    segurando = false;
    palco.classList.remove('intro-segurando');
    mensagem();
  }

  function ehTeclaDeAcao(e) {
    return e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar' || e.code === 'Space';
  }

  function aoApertar(e) {
    ultimaInteracao = Date.now();
    if (!pronto || concluido || ponteiro !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    ponteiro = e.pointerId;
    if (e.cancelable) e.preventDefault();
    comeca();
  }

  function aoSoltarPonteiro(e) {
    if (ponteiro === null || e.pointerId !== ponteiro) return;
    ultimaInteracao = Date.now();
    ponteiro = null;
    if (!teclado) solta();
  }

  function aoTeclaBaixo(e) {
    if (!ehTeclaDeAcao(e)) return;
    e.preventDefault();
    ultimaInteracao = Date.now();
    if (e.repeat || teclado || !pronto || concluido) return;
    teclado = true;
    comeca();
  }

  function aoTeclaCima(e) {
    if (!ehTeclaDeAcao(e)) return;
    e.preventDefault();
    ultimaInteracao = Date.now();
    if (!teclado) return;
    teclado = false;
    if (ponteiro === null) solta();
  }

  function aoPerderFoco() {
    if (!teclado) return;
    teclado = false;
    if (ponteiro === null) solta();
  }

  function aoClicarCoracao(e) {
    e.preventDefault();
    e.stopPropagation();
    // ativação por leitor de tela (clique sintético, sem ponteiro nem tecla)
    if (e.detail === 0 && Date.now() - ultimaInteracao > 700 && pronto && !concluido && !segurando) conclui();
  }

  function semMenu(e) { e.preventDefault(); }
  // (o "segurar" no iOS/Android fica sem menu/seleção via CSS: -webkit-touch-callout,
  //  user-select e touch-action:none, mais o contextmenu cancelado abaixo)

  botao.addEventListener('pointerdown', aoApertar);
  botao.addEventListener('pointerup', aoSoltarPonteiro);
  botao.addEventListener('pointercancel', aoSoltarPonteiro);
  botao.addEventListener('pointerleave', aoSoltarPonteiro);
  botao.addEventListener('keydown', aoTeclaBaixo);
  botao.addEventListener('keyup', aoTeclaCima);
  botao.addEventListener('blur', aoPerderFoco);
  botao.addEventListener('click', aoClicarCoracao);
  botao.addEventListener('contextmenu', semMenu);

  /* Interações no céu: tocar pula a digitação e solta faíscas; mexer deixa poeira */
  var ultimaPoeira = 0;
  function aoTocarCeu(e) {
    if (concluido) return;
    if (!pronto) fimDigitacao();
    if (e.target && e.target.closest && e.target.closest('.intro-coracao')) return;
    faisca(e.clientX, e.clientY, reduzido ? 6 : 14);
  }
  function aoMoverCeu(e) {
    if (concluido) return;
    var agora = performance.now();
    if (agora - ultimaPoeira < (reduzido ? 90 : 28)) return;
    ultimaPoeira = agora;
    poeira(e.clientX, e.clientY);
  }
  function engoleClique(e) { e.stopPropagation(); }

  overlay.addEventListener('pointerdown', aoTocarCeu);
  overlay.addEventListener('pointermove', aoMoverCeu);
  overlay.addEventListener('click', engoleClique);
  overlay.addEventListener('contextmenu', semMenu);
  overlay.addEventListener('selectstart', semMenu);
  overlay.addEventListener('dragstart', semMenu);

  // teclado global enquanto a abertura existe: pular digitação e manter o foco no coração
  function teclaGlobal(e) {
    if (concluido) return;
    overlay.classList.add('intro-teclado');
    if (e.key === 'Tab') {
      e.preventDefault();
      if (pronto) botao.focus();
      return;
    }
    if (!pronto && (ehTeclaDeAcao(e) || e.key === 'Escape')) {
      e.preventDefault();
      fimDigitacao();
      return;
    }
    // o foco saiu do coração (ex.: clicou no céu): Espaço/Enter continuam enchendo ele
    if (pronto && ehTeclaDeAcao(e) && e.target !== botao) {
      try { botao.focus({ preventScroll: true }); } catch (err) { botao.focus(); }
      aoTeclaBaixo(e);
    }
  }
  doc.addEventListener('keydown', teclaGlobal, true);
  // mouse/dedo voltou a ser usado: esconde o contorno de foco
  overlay.addEventListener('pointerdown', function () { overlay.classList.remove('intro-teclado'); }, true);

  function aoRedimensionar() { redimensiona(); }
  window.addEventListener('resize', aoRedimensionar, { passive: true });

  /* ------------------------------------------------------------------
     Abrir!
     ------------------------------------------------------------------ */
  function conclui() {
    if (concluido) return;
    concluido = true;
    segurando = false;
    teclado = false;
    ponteiro = null;
    p = 1;
    tConclusao = performance.now();
    palco.classList.remove('intro-segurando');
    palco.classList.add('intro-concluido');
    botao.setAttribute('aria-hidden', 'true');
    botao.tabIndex = -1;
    medeCoracao();
    var cx = centro.x;
    var cy = centro.y;

    // música (o contexto de áudio já foi destravado no primeiro toque pelo musica.js)
    try {
      if (window.musica && typeof window.musica.play === 'function' && !window.musica.tocando) window.musica.play();
    } catch (e) { /* ignora */ }

    root.classList.add('intro-estourando');
    coracaoDeEstrelas(cx, cy);
    faisca(cx, cy, reduzido ? 14 : 40);

    florescer.style.left = cx + 'px';
    florescer.style.top = cy + 'px';
    florescer.classList.add('intro-on');

    var ex = typeof window.explode === 'function' ? window.explode : null;
    var sc = typeof window.soltaCoracao === 'function' ? window.soltaCoracao : null;
    if (ex) {
      try { ex(cx, cy, reduzido ? 12 : 30); } catch (e) { /* ignora */ }
      var anel = reduzido ? 4 : 10;
      for (var i = 0; i < anel; i++) {
        (function (n) {
          depois(function () {
            var a = (n / anel) * TAU - Math.PI / 2;
            var R = centro.w * (0.55 + Math.random() * 0.35);
            try { ex(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 8); } catch (e) { /* ignora */ }
          }, 80 + n * 70);
        })(i);
      }
    }
    if (sc) {
      var chuva = reduzido ? 14 : 44;
      for (var j = 0; j < chuva; j++) {
        depois(function () { try { sc(); } catch (e) { /* ignora */ } }, j * 38);
      }
    }
    vibra([18, 50, 30]);

    msgAtual = MSG_FINAL;
    msgEl.textContent = MSG_FINAL;
    instr.classList.add('intro-final');

    depois(sair, reduzido ? 900 : 1150);
  }

  function sair() {
    overlay.classList.add('intro-saindo');
    root.classList.remove('intro-ativa'); // destrava a rolagem
    depois(remove, reduzido ? 1300 : 1900);
  }

  function remove() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    limpaTimers();
    clearTimeout(timerDig);
    window.removeEventListener('resize', aoRedimensionar, { passive: true });
    doc.removeEventListener('keydown', teclaGlobal, true);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    root.classList.remove('intro-estourando');
    root.classList.remove('intro-ativa');
    if (estilo.parentNode) estilo.parentNode.removeChild(estilo);
    particulas.length = 0;
    estrelas.length = 0;
    bolhas.length = 0;
    try {
      doc.dispatchEvent(new CustomEvent('intro:aberta'));
    } catch (e) { /* navegador antigo */ }
  }

  /* ------------------------------------------------------------------
     Começo
     ------------------------------------------------------------------ */
  redimensiona();
  raf = requestAnimationFrame(quadro);
})();
