/* =====================================================================
   Constelação — efeitos/constelacao.js
   Transforma <section id="constelacao"> num céu noturno com 14 estrelas
   posicionadas no contorno de um coração. Cada toque acende uma estrela;
   estrelas vizinhas acesas se ligam por uma linha que brilha. Com todas
   acesas, o coração inteiro se desenha e aparece uma mensagem.
   Não expõe nenhuma variável global.
   ===================================================================== */
(function () {
  'use strict';

  var secao = document.getElementById('constelacao');
  if (!secao) return;

  var TOTAL = 14;
  var NS = 'http://www.w3.org/2000/svg';

  var reduz = false;
  try {
    reduz = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { reduz = false; }

  var DUR_LINHA = reduz ? 450 : 900;       // ms para desenhar a linha entre duas estrelas
  var DUR_CONTORNO = reduz ? 1100 : 2400;  // ms para desenhar o coração inteiro no final
  function seg(ms) { return (ms / 1000).toFixed(2) + 's'; }

  /* ---------- Geometria do coração ----------
     x = 16 sen³t ,  y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t
     (t = 0 é o "vale" no topo do coração; t = π é a ponta de baixo) */
  var ESCALA = 10.5, MARGEM = 34, AMOSTRAS = 840; // AMOSTRAS múltiplo de 2*TOTAL
  var cru = [], i, t;
  var yMax = -Infinity, yMin = Infinity;
  for (i = 0; i <= AMOSTRAS; i++) {
    t = (i / AMOSTRAS) * Math.PI * 2;
    var s = Math.sin(t);
    var xr = 16 * s * s * s;
    var yr = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    cru.push([xr, yr]);
    if (yr > yMax) yMax = yr;
    if (yr < yMin) yMin = yr;
  }
  var VW = Math.round(32 * ESCALA + 2 * MARGEM);
  var VH = Math.round((yMax - yMin) * ESCALA + 2 * MARGEM);
  var OX = VW / 2, OY = MARGEM + yMax * ESCALA;

  var pts = [], acum = [0], L = 0;
  for (i = 0; i <= AMOSTRAS; i++) {
    pts.push({ x: OX + cru[i][0] * ESCALA, y: OY - cru[i][1] * ESCALA });
    if (i > 0) {
      L += Math.sqrt(Math.pow(pts[i].x - pts[i - 1].x, 2) + Math.pow(pts[i].y - pts[i - 1].y, 2));
      acum.push(L);
    }
  }

  // ponto no contorno a uma distância "d" (comprimento de arco) do topo
  function pontoNoArco(d) {
    if (d <= 0) return { x: pts[0].x, y: pts[0].y, j: 0 };
    if (d >= L) return { x: pts[AMOSTRAS].x, y: pts[AMOSTRAS].y, j: AMOSTRAS };
    var lo = 0, hi = AMOSTRAS;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (acum[mid] <= d) lo = mid; else hi = mid;
    }
    var f = (d - acum[lo]) / ((acum[hi] - acum[lo]) || 1);
    return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * f, y: pts[lo].y + (pts[hi].y - pts[lo].y) * f, j: lo };
  }

  function comprimento(lista) {
    var c = 0;
    for (var k = 1; k < lista.length; k++) {
      c += Math.sqrt(Math.pow(lista[k].x - lista[k - 1].x, 2) + Math.pow(lista[k].y - lista[k - 1].y, 2));
    }
    return c;
  }

  function caminho(lista, fecha) {
    var d = 'M' + lista[0].x.toFixed(1) + ' ' + lista[0].y.toFixed(1);
    for (var k = 1; k < lista.length; k++) d += 'L' + lista[k].x.toFixed(1) + ' ' + lista[k].y.toFixed(1);
    return fecha ? d + 'Z' : d;
  }

  // posições das estrelas: igualmente espaçadas ao longo do contorno
  var posicoes = [];
  for (i = 0; i < TOTAL; i++) posicoes.push(pontoNoArco((i * L) / TOTAL));

  // trechos do contorno entre a estrela k e a estrela k+1
  var trechos = [];
  for (i = 0; i < TOTAL; i++) {
    var dA = (i * L) / TOTAL, dB = ((i + 1) * L) / TOTAL;
    var a = pontoNoArco(dA), b = pontoNoArco(dB);
    var lista = [{ x: a.x, y: a.y }];
    for (var j = a.j + 1; j <= b.j; j++) {
      if (acum[j] > dA && acum[j] < dB) lista.push(pts[j]);
    }
    lista.push({ x: b.x, y: b.y });
    trechos.push({ d: caminho(lista, false), len: comprimento(lista) });
  }

  // as duas metades do coração, ambas saindo do topo e indo até a ponta
  var metade = AMOSTRAS / 2;
  var direita = pts.slice(0, metade + 1);
  var esquerda = pts.slice(metade).reverse();
  var metades = [
    { d: caminho(direita, false), len: comprimento(direita) },
    { d: caminho(esquerda, false), len: comprimento(esquerda) }
  ];
  var contornoFechado = caminho(pts.slice(0, AMOSTRAS), true);

  /* ---------- CSS ---------- */
  var css = [
    '#constelacao{color:#fff;overflow:hidden;padding-top:130px;padding-bottom:130px;',
    '  background:',
    '    radial-gradient(ellipse 55% 38% at 50% 50%,rgba(255,92,138,.16),rgba(255,92,138,0) 70%),',
    '    radial-gradient(ellipse 70% 26% at 22% 34%,rgba(150,120,255,.13),rgba(150,120,255,0) 70%),',
    '    radial-gradient(ellipse 60% 24% at 80% 70%,rgba(255,140,200,.09),rgba(255,140,200,0) 70%),',
    '    linear-gradient(180deg,rgba(255,232,240,0) 0,#2e1b54 120px,#161b45 34%,#0d1233 56%,#1c1546 80%,#3a1d5a calc(100% - 120px),rgba(255,232,240,0) 100%)}',
    '#constelacao h2{position:relative;color:#ffe0ea;text-shadow:0 0 18px rgba(255,120,170,.6),0 0 2px rgba(255,255,255,.5)}',

    /* céu com estrelinhas piscando */
    '.const-ceu{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;',
    '  -webkit-mask-image:linear-gradient(180deg,transparent 0,#000 150px,#000 calc(100% - 150px),transparent 100%);',
    '  mask-image:linear-gradient(180deg,transparent 0,#000 150px,#000 calc(100% - 150px),transparent 100%)}',
    '.const-ponto{position:absolute;border-radius:50%;background:#fff;opacity:.2;',
    '  animation:const-pisca var(--dur,3s) ease-in-out var(--atraso,0s) infinite alternate}',
    '.const-ponto.const-forte{box-shadow:0 0 6px 1px rgba(255,255,255,.75)}',
    '@keyframes const-pisca{from{opacity:.12;transform:scale(.65)}to{opacity:.95;transform:scale(1)}}',

    /* estrelas cadentes */
    '.const-cadente{position:absolute;height:2px;width:var(--comp,150px);transform:rotate(var(--ang,-28deg));transform-origin:0 50%;pointer-events:none}',
    '.const-cadente i{position:absolute;inset:0;border-radius:2px;opacity:0;',
    '  background:linear-gradient(90deg,#fff 0%,rgba(255,215,232,.85) 14%,rgba(255,255,255,0) 100%);',
    '  animation:const-cadente var(--dur,1.3s) cubic-bezier(.35,.1,.6,1) forwards}',
    '.const-cadente i::before{content:"";position:absolute;left:-2px;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;',
    '  background:#fff;box-shadow:0 0 10px 3px rgba(255,200,225,.9)}',
    '@keyframes const-cadente{0%{transform:translateX(0);opacity:0}12%{opacity:1}72%{opacity:1}100%{transform:translateX(var(--dist,-560px));opacity:0}}',

    /* conteúdo */
    '.const-conteudo{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;width:100%;max-width:560px}',
    '.const-dica{color:rgba(255,228,238,.85);font-size:.98rem;margin:-10px 0 16px}',
    '.const-palco{position:relative;width:min(420px,100%);margin:0 auto}',
    '.const-svg{display:block;width:100%;height:auto;overflow:visible;touch-action:manipulation;-webkit-tap-highlight-color:transparent;',
    '  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    '.const-linhas,.const-contorno,.const-faiscas,.const-preenchimento{pointer-events:none}',

    /* estrelas do coração */
    '.const-estrela{cursor:pointer;outline:none}',
    '.const-alvo{fill:transparent;stroke:none}',
    '.const-anel{fill:none;stroke:#ffd1dc;stroke-width:1.5;stroke-dasharray:3 4;opacity:0;transition:opacity .2s ease}',
    '.const-estrela:focus-visible .const-anel{opacity:1}',
    '@media (hover:hover){.const-estrela:hover .const-anel{opacity:.45}}',
    '.const-aura{fill:url(#const-halo);opacity:0;transform:scale(.3);transform-box:fill-box;transform-origin:center;',
    '  transition:opacity .6s ease,transform .8s cubic-bezier(.2,.9,.3,1.3)}',
    '.const-acesa .const-aura{opacity:1;transform:scale(1);animation:const-aura 3.4s ease-in-out .9s infinite}',
    '@keyframes const-aura{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.86)}}',
    '.const-corpo{fill:#dfe3ff;opacity:.5;transform-box:fill-box;transform-origin:center;',
    '  animation:const-respira 3.2s ease-in-out var(--atraso,0s) infinite}',
    '.const-nucleo{fill:#fff}',
    '@keyframes const-respira{0%,100%{opacity:.36;transform:scale(.86)}50%{opacity:.75;transform:scale(1)}}',
    '.const-acesa .const-corpo{fill:#fff;opacity:1;animation:const-acende .8s cubic-bezier(.2,.9,.3,1.4) forwards}',
    '@keyframes const-acende{0%{opacity:.6;transform:scale(.8)}45%{opacity:1;transform:scale(1.9)}100%{opacity:1;transform:scale(1.35)}}',
    '.const-apagada .const-corpo{animation:const-apaga .55s ease forwards,const-respira 3.2s ease-in-out .55s infinite}',
    '@keyframes const-apaga{from{opacity:1;transform:scale(1.35)}to{opacity:.36;transform:scale(.86)}}',

    /* linhas e contorno */
    '.const-linha{fill:none;stroke:#ffd6e4;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;opacity:0}',
    '.const-linha.const-ligada{opacity:.95}',
    '.const-metade{fill:none;stroke:#fff2f7;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;opacity:0}',
    '.const-completa .const-metade{opacity:1}',
    '.const-completa .const-contorno{animation:const-respira-contorno 3.4s ease-in-out ' + seg(DUR_CONTORNO + 200) + ' infinite}',
    '@keyframes const-respira-contorno{0%,100%{opacity:1}50%{opacity:.55}}',
    '.const-preenchimento{fill:url(#const-preenche);opacity:0;transition:opacity 2.4s ease .6s}',
    '.const-completa .const-preenchimento{opacity:1}',
    '.const-desenho{transform-box:fill-box;transform-origin:center}',
    '.const-completa .const-desenho{animation:const-batida 1.6s ease-in-out ' + seg(DUR_CONTORNO) + ' 2}',
    '@keyframes const-batida{0%,100%{transform:scale(1)}18%{transform:scale(1.045)}36%{transform:scale(1)}54%{transform:scale(1.025)}72%{transform:scale(1)}}',

    /* faíscas ao acender */
    '.const-faisca{transform-box:fill-box;transform-origin:center;animation:const-faisca .85s cubic-bezier(.15,.7,.3,1) forwards}',
    '@keyframes const-faisca{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.2)}}',
    '.const-onda{fill:none;stroke:#ffe3ee;stroke-width:1.3;vector-effect:non-scaling-stroke;transform-box:fill-box;transform-origin:center;',
    '  animation:const-onda .9s ease-out forwards}',
    '@keyframes const-onda{from{opacity:.9;transform:scale(.4)}to{opacity:0;transform:scale(3.4)}}',

    /* contador e mensagem */
    '.const-rodape{display:grid;width:100%;margin-top:20px}',
    '.const-rodape>*{grid-area:1/1}',
    '.const-contador{align-self:start;justify-self:center;margin:0;padding:6px 16px;border-radius:999px;font-size:.95rem;letter-spacing:.05em;',
    '  color:rgba(255,226,236,.88);background:rgba(255,255,255,.07);border:1px solid rgba(255,209,220,.24);',
    '  font-variant-numeric:tabular-nums;transition:opacity .6s ease,transform .6s ease}',
    '.const-num{color:#fff;font-weight:600}',
    '.const-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}',
    '.const-fim .const-contador{opacity:0;transform:translateY(-8px)}',
    '.const-mensagem{opacity:0;transform:translateY(14px);pointer-events:none;',
    '  transition:opacity .5s ease,transform .5s ease}',
    '.const-fim .const-mensagem{opacity:1;transform:none;',
    '  transition:opacity 1.4s ease ' + seg(DUR_CONTORNO * 0.45) + ',transform 1.4s cubic-bezier(.2,.8,.2,1) ' + seg(DUR_CONTORNO * 0.45) + '}',
    '.const-frase{margin:0 auto;max-width:24ch;font-family:"Dancing Script",cursive;font-size:clamp(1.6rem,6.4vw,2.35rem);line-height:1.25;text-wrap:balance;',
    '  color:#fff;text-shadow:0 0 16px rgba(255,140,180,.8),0 0 2px rgba(255,255,255,.6)}',
    '.const-assinatura{margin-top:14px;font-size:1.04rem;color:#ffd1dc;opacity:0;transition:opacity .4s ease}',
    '.const-fim .const-assinatura{opacity:1;transition:opacity 1.3s ease ' + seg(DUR_CONTORNO * 0.45 + 1100) + '}',

    /* botão de recomeçar */
    '.const-reset{margin-top:22px;padding:9px 18px;border-radius:999px;cursor:pointer;font:inherit;font-size:.88rem;',
    '  color:#ffe3ee;background:rgba(255,255,255,.06);border:1px solid rgba(255,209,220,.38);',
    '  opacity:0;visibility:hidden;transition:opacity .5s ease,visibility 0s linear .5s,background-color .25s ease,box-shadow .25s ease}',
    '.const-reset.const-visivel{opacity:1;visibility:visible;transition:opacity .5s ease,visibility 0s linear 0s,background-color .25s ease,box-shadow .25s ease}',
    '.const-reset:hover{background:rgba(255,209,220,.15);box-shadow:0 0 18px rgba(255,140,180,.35)}',
    '.const-reset:focus-visible{outline:2px solid #ffd1dc;outline-offset:3px}',

    /* pausa as animações quando a seção está fora da tela */
    '.const-pausa .const-ponto,.const-pausa .const-corpo,.const-pausa .const-aura,.const-pausa .const-contorno{animation-play-state:paused}',

    '@media (prefers-reduced-motion:reduce){',
    '  .const-ponto{animation-duration:8s}',
    '  @keyframes const-pisca{from{opacity:.3;transform:none}to{opacity:.8;transform:none}}',
    '  .const-corpo{animation-duration:6s}',
    '  .const-acesa .const-corpo{animation:const-acende-suave .5s ease forwards}',
    '  @keyframes const-acende-suave{from{opacity:.6;transform:scale(1)}to{opacity:1;transform:scale(1.3)}}',
    '  .const-acesa .const-aura{animation:none}',
    '  .const-completa .const-desenho{animation:none}',
    '  .const-completa .const-contorno{animation-duration:7s}',
    '  .const-mensagem,.const-fim .const-mensagem{transform:none}',
    '}'
  ].join('\n');

  var estilo = document.createElement('style');
  estilo.setAttribute('data-efeito', 'constelacao');
  estilo.textContent = css;
  (document.head || document.documentElement).appendChild(estilo);

  /* ---------- DOM ---------- */
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }
  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    return e;
  }
  function brilhinho(r) {
    var q = r * 0.2;
    return 'M0 ' + (-r) + 'Q' + q + ' ' + (-q) + ' ' + r + ' 0Q' + q + ' ' + q + ' 0 ' + r +
           'Q' + (-q) + ' ' + q + ' ' + (-r) + ' 0Q' + (-q) + ' ' + (-q) + ' 0 ' + (-r) + 'Z';
  }

  secao.textContent = '';

  var ceu = el('div', 'const-ceu');
  ceu.setAttribute('aria-hidden', 'true');

  var conteudo = el('div', 'const-conteudo');
  var titulo = el('h2', null, 'Nossa constelação');
  var dica = el('p', 'const-dica', 'toque nas estrelas para acendê-las ✨');
  var palco = el('div', 'const-palco');

  var h = [];
  h.push('<svg class="const-svg" xmlns="' + NS + '" viewBox="0 0 ' + VW + ' ' + VH + '" width="' + VW + '" height="' + VH + '"' +
         ' role="group" aria-label="Constelação em forma de coração, com ' + TOTAL + ' estrelas">');
  h.push('<defs>');
  h.push('<radialGradient id="const-halo">' +
         '<stop offset="0" stop-color="#ffffff" stop-opacity="1"/>' +
         '<stop offset=".22" stop-color="#ffe6f0" stop-opacity=".9"/>' +
         '<stop offset=".5" stop-color="#ff9fbf" stop-opacity=".3"/>' +
         '<stop offset="1" stop-color="#ff5c8a" stop-opacity="0"/></radialGradient>');
  h.push('<radialGradient id="const-preenche" cx="50%" cy="42%" r="62%">' +
         '<stop offset="0" stop-color="#ffa3c0" stop-opacity=".42"/>' +
         '<stop offset=".6" stop-color="#ff5c8a" stop-opacity=".15"/>' +
         '<stop offset="1" stop-color="#8b1e3f" stop-opacity="0"/></radialGradient>');
  h.push('<filter id="const-brilho" x="-20%" y="-20%" width="140%" height="140%">' +
         '<feGaussianBlur stdDeviation="2.2" result="b"/>' +
         '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
  h.push('<filter id="const-brilho-forte" x="-20%" y="-20%" width="140%" height="140%">' +
         '<feGaussianBlur stdDeviation="4.5" result="b"/>' +
         '<feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>');
  h.push('</defs>');
  h.push('<g class="const-desenho">');
  h.push('<path class="const-preenchimento" d="' + contornoFechado + '"/>');
  h.push('<g class="const-linhas" filter="url(#const-brilho)">');
  for (i = 0; i < TOTAL; i++) h.push('<path class="const-linha" d="' + trechos[i].d + '"/>');
  h.push('</g>');
  h.push('<g class="const-contorno" filter="url(#const-brilho-forte)">');
  for (i = 0; i < 2; i++) h.push('<path class="const-metade" d="' + metades[i].d + '"/>');
  h.push('</g>');
  h.push('<g class="const-faiscas"></g>');
  h.push('<g class="const-estrelas">');
  for (i = 0; i < TOTAL; i++) {
    var p = posicoes[i];
    h.push('<g class="const-estrela" tabindex="0" role="button" aria-pressed="false"' +
           ' aria-label="Estrela ' + (i + 1) + ' de ' + TOTAL + '"' +
           ' transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')"' +
           ' style="--atraso:' + (-(i * 0.47) % 3.2).toFixed(2) + 's">' +
           '<circle class="const-alvo" r="27"/>' +
           '<circle class="const-anel" r="17"/>' +
           '<circle class="const-aura" r="24"/>' +
           '<g class="const-corpo"><path d="' + brilhinho(8) + '"/><circle class="const-nucleo" r="2.3"/></g>' +
           '</g>');
  }
  h.push('</g>');
  h.push('</g>');
  h.push('</svg>');
  palco.innerHTML = h.join('');

  var rodape = el('div', 'const-rodape');
  var contador = el('p', 'const-contador');
  contador.setAttribute('aria-live', 'polite');
  var num = el('span', 'const-num', '0');
  contador.appendChild(num);
  contador.appendChild(document.createTextNode(' de ' + TOTAL));
  contador.appendChild(el('span', 'const-sr', ' estrelas acesas'));

  var mensagem = el('div', 'const-mensagem');
  mensagem.setAttribute('aria-hidden', 'true');
  mensagem.appendChild(el('p', 'const-frase', 'De todas as estrelas do céu, você é a que mais brilha pra mim.'));
  mensagem.appendChild(el('p', 'const-assinatura', 'Cybele, você é a minha estrela favorita 🌟'));
  rodape.appendChild(contador);
  rodape.appendChild(mensagem);

  var reset = el('button', 'const-reset', 'apagar e acender de novo');
  reset.type = 'button';

  conteudo.appendChild(titulo);
  conteudo.appendChild(dica);
  conteudo.appendChild(palco);
  conteudo.appendChild(rodape);
  conteudo.appendChild(reset);
  secao.appendChild(ceu);
  secao.appendChild(conteudo);

  var svg = palco.querySelector('.const-svg');
  var grupoFaiscas = palco.querySelector('.const-faiscas');
  if (!svg || !grupoFaiscas) return;

  var linhas = palco.querySelectorAll('.const-linha');
  var metadeEls = palco.querySelectorAll('.const-metade');
  var estrelaEls = palco.querySelectorAll('.const-estrela');

  /* ---------- Estado ---------- */
  var estrelas = [], segmentos = [], contornos = [];
  var acesas = 0, completo = false, apagando = false;
  var timers = [];

  function agenda(fn, ms) {
    var id = setTimeout(function () {
      var k = timers.indexOf(id);
      if (k >= 0) timers.splice(k, 1);
      fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function limpaTimers() {
    for (var k = 0; k < timers.length; k++) clearTimeout(timers[k]);
    timers.length = 0;
  }

  function preparaTraco(elemento, len) {
    var oculto = len + 2;
    elemento.style.strokeDasharray = oculto + ' ' + oculto;
    elemento.style.strokeDashoffset = String(oculto);
    return { el: elemento, oculto: oculto };
  }

  for (i = 0; i < TOTAL; i++) {
    estrelas.push({ el: estrelaEls[i], x: posicoes[i].x, y: posicoes[i].y, acesa: false });
    segmentos.push(preparaTraco(linhas[i], trechos[i].len));
  }
  for (i = 0; i < metadeEls.length; i++) contornos.push(preparaTraco(metadeEls[i], metades[i].len));

  /* desenha um traço com stroke-dashoffset; doFim = desenha a partir do final do caminho */
  function desenha(seg, doFim, dur) {
    var e = seg.el;
    e.style.transition = 'none';
    e.style.strokeDashoffset = String(doFim ? -seg.oculto : seg.oculto);
    try { e.getBoundingClientRect(); } catch (err) { /* força o estilo */ }
    e.style.transition = 'stroke-dashoffset ' + (dur || DUR_LINHA) + 'ms cubic-bezier(.5,0,.25,1),opacity .3s ease';
    e.style.strokeDashoffset = '0';
    e.classList.add('const-ligada');
  }

  function escondeTraco(seg) {
    var e = seg.el;
    e.style.transition = 'opacity .45s ease';
    e.classList.remove('const-ligada');
  }

  function zeraTraco(seg) {
    if (seg.el.classList.contains('const-ligada')) return;
    seg.el.style.transition = 'none';
    seg.el.style.strokeDashoffset = String(seg.oculto);
  }

  /* ---------- Faíscas ---------- */
  var CORES = ['#ffffff', '#ffd1dc', '#ffe7a8', '#ffb3cb'];
  function faisca(k, n) {
    var est = estrelas[k];
    var criados = [];
    var onda = svgEl('circle', { cx: est.x.toFixed(1), cy: est.y.toFixed(1), r: '6', 'class': 'const-onda' });
    grupoFaiscas.appendChild(onda);
    criados.push(onda);
    for (var q = 0; q < n; q++) {
      var ang = (q / n) * Math.PI * 2 + Math.random() * 0.5;
      var dist = 16 + Math.random() * (reduz ? 10 : 24);
      var c = svgEl('circle', {
        cx: est.x.toFixed(1), cy: est.y.toFixed(1),
        r: (0.9 + Math.random() * 1.4).toFixed(2),
        fill: CORES[(Math.random() * CORES.length) | 0],
        'class': 'const-faisca'
      });
      c.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      c.style.setProperty('--dy', (Math.sin(ang) * dist).toFixed(1) + 'px');
      grupoFaiscas.appendChild(c);
      criados.push(c);
    }
    setTimeout(function () {
      for (var z = 0; z < criados.length; z++) {
        if (criados[z].parentNode) criados[z].parentNode.removeChild(criados[z]);
      }
    }, 1100);
  }

  /* ---------- Acender / apagar ---------- */
  function atualizaContador() {
    num.textContent = String(acesas);
  }

  function acende(k) {
    if (apagando) return;
    var est = estrelas[k];
    if (est.acesa) { faisca(k, reduz ? 3 : 5); return; }
    est.acesa = true;
    acesas++;
    est.el.classList.remove('const-apagada');
    est.el.classList.add('const-acesa');
    est.el.setAttribute('aria-pressed', 'true');
    est.el.setAttribute('aria-label', 'Estrela ' + (k + 1) + ' de ' + TOTAL + ', acesa');
    faisca(k, reduz ? 6 : 10);

    var prox = (k + 1) % TOTAL, ant = (k + TOTAL - 1) % TOTAL;
    if (estrelas[prox].acesa) desenha(segmentos[k], false);    // trecho k: k → k+1, sai desta estrela
    if (estrelas[ant].acesa) desenha(segmentos[ant], true);    // trecho ant: ant → k, também sai desta estrela

    atualizaContador();
    reset.classList.add('const-visivel');
    if (acesas === TOTAL) agenda(completa, reduz ? 250 : 650);
  }

  function desliga(k) {
    var est = estrelas[k];
    if (!est.acesa) return;
    est.acesa = false;
    acesas = Math.max(0, acesas - 1);
    est.el.classList.remove('const-acesa');
    est.el.classList.add('const-apagada');
    est.el.setAttribute('aria-pressed', 'false');
    est.el.setAttribute('aria-label', 'Estrela ' + (k + 1) + ' de ' + TOTAL);
    atualizaContador();
  }

  function coracoes(x, y, n) {
    if (typeof window.explode === 'function') {
      try { window.explode(x, y, n); } catch (e) { /* ignora */ }
    }
  }

  function completa() {
    if (completo || acesas < TOTAL) return;
    completo = true;
    svg.classList.add('const-completa');
    conteudo.classList.add('const-fim');
    mensagem.removeAttribute('aria-hidden');
    for (var k = 0; k < contornos.length; k++) desenha(contornos[k], false, DUR_CONTORNO);

    var qtd = reduz ? 1 : 4;
    for (var q = 0; q < qtd; q++) agenda(cadente, 350 + q * 850 + Math.random() * 350);

    agenda(function () {
      var r = svg.getBoundingClientRect();
      if (r.width) coracoes(r.left + r.width / 2, r.top + r.height * 0.45, reduz ? 10 : 22);
    }, DUR_CONTORNO * 0.8);
  }

  function apaga() {
    if (apagando) return;
    limpaTimers();
    apagando = true;
    completo = false;
    svg.classList.remove('const-completa');
    conteudo.classList.remove('const-fim');
    mensagem.setAttribute('aria-hidden', 'true');

    var k;
    for (k = 0; k < segmentos.length; k++) escondeTraco(segmentos[k]);
    for (k = 0; k < contornos.length; k++) escondeTraco(contornos[k]);

    var ordem = [];
    for (k = TOTAL - 1; k >= 0; k--) if (estrelas[k].acesa) ordem.push(k);
    var passo = reduz ? 20 : 45;
    ordem.forEach(function (idx, n) {
      agenda(function () { desliga(idx); }, n * passo);
    });

    agenda(function () {
      for (var z = 0; z < segmentos.length; z++) zeraTraco(segmentos[z]);
      for (z = 0; z < contornos.length; z++) zeraTraco(contornos[z]);
      apagando = false;
      acesas = 0;
      atualizaContador();
      var focado = document.activeElement === reset;
      reset.classList.remove('const-visivel');
      if (focado) {
        try { estrelas[0].el.focus({ preventScroll: true }); } catch (e) { /* ignora */ }
      }
    }, Math.max(500, ordem.length * passo + 120));
  }

  /* ---------- Estrelas cadentes ---------- */
  function cadente() {
    var w = secao.clientWidth, hh = secao.clientHeight;
    if (!w || !hh) return;
    var dur = reduz ? 2.4 : (1.1 + Math.random() * 0.5);
    var e = el('div', 'const-cadente');
    e.style.left = (w * (0.45 + Math.random() * 0.5)).toFixed(0) + 'px';
    e.style.top = (hh * (0.16 + Math.random() * 0.3)).toFixed(0) + 'px';
    e.style.setProperty('--comp', (110 + Math.random() * 90).toFixed(0) + 'px');
    e.style.setProperty('--ang', (-(18 + Math.random() * 20)).toFixed(1) + 'deg');
    e.style.setProperty('--dist', (-(w * 0.4 + 180 + Math.random() * 160)).toFixed(0) + 'px');
    e.style.setProperty('--dur', dur + 's');
    e.appendChild(document.createElement('i'));
    ceu.appendChild(e);
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, dur * 1000 + 250);
  }

  /* ---------- Céu estrelado ---------- */
  function criaCeu() {
    var w = secao.clientWidth || window.innerWidth || 375;
    var hh = secao.clientHeight || window.innerHeight || 800;
    var qtd = Math.round(Math.min(130, Math.max(55, (w * hh) / 9000)));
    var frag = document.createDocumentFragment();
    for (var k = 0; k < qtd; k++) {
      var pnt = el('span', 'const-ponto');
      var r = Math.random();
      var tam = 1 + r * r * 2.2;
      pnt.style.left = (Math.random() * 100).toFixed(2) + '%';
      pnt.style.top = (3 + Math.random() * 94).toFixed(2) + '%';
      pnt.style.width = pnt.style.height = tam.toFixed(2) + 'px';
      pnt.style.setProperty('--dur', (2 + Math.random() * 3.5).toFixed(2) + 's');
      pnt.style.setProperty('--atraso', (-Math.random() * 5).toFixed(2) + 's');
      if (Math.random() < 0.12) pnt.style.background = Math.random() < 0.5 ? '#ffd1dc' : '#fff1c9';
      if (tam > 2.4) pnt.className += ' const-forte';
      frag.appendChild(pnt);
    }
    ceu.appendChild(frag);
  }
  criaCeu();

  /* ---------- Eventos ---------- */
  estrelas.forEach(function (est, k) {
    est.el.addEventListener('click', function (ev) {
      // o brilho da estrela já é a festa; evita a chuva de corações genérica
      ev.stopPropagation();
      acende(k);
    });
    est.el.addEventListener('keydown', function (ev) {
      var key = ev.key;
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        ev.preventDefault();
        acende(k);
      } else if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowUp') {
        ev.preventDefault();
        var alvo = (key === 'ArrowRight' || key === 'ArrowDown') ? (k + 1) % TOTAL : (k + TOTAL - 1) % TOTAL;
        try { estrelas[alvo].el.focus(); } catch (e) { /* ignora */ }
      }
    });
  });

  reset.addEventListener('click', function (ev) {
    ev.preventDefault();
    apaga();
  });

  if (typeof window.IntersectionObserver === 'function') {
    try {
      new IntersectionObserver(function (entradas) {
        for (var k = 0; k < entradas.length; k++) {
          secao.classList.toggle('const-pausa', !entradas[k].isIntersecting);
        }
      }).observe(secao);
    } catch (e) { /* ignora */ }
  }
})();
