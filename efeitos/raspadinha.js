/* =====================================================================
   Raspadinha — efeitos/raspadinha.js
   Monta um cartão de raspadinha em <section id="raspadinha">.
   Por baixo: uma foto do casal com uma legenda. Por cima: um <canvas>
   metálico rosa/dourado que é "raspado" com o dedo ou o mouse.
   Não expõe nenhuma variável global.
   ===================================================================== */
(function () {
  'use strict';

  var secao = document.getElementById('raspadinha');
  if (!secao) return;

  /* ---------- Configuração ---------- */
  var FOTO = 'fotos/17.jpg';
  var LEGENDA = 'Meu lugar favorito no mundo é do seu lado 💖';
  var SEGUNDA_LINHA = 'Você é a melhor parte dos meus dias.';
  var LIMIAR = 0.55;          // fração raspada para revelar tudo
  var INTERVALO_MEDIDA = 220; // ms entre medições durante a raspagem

  var reduz = false;
  try {
    reduz = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { reduz = false; }

  var agora = (window.performance && typeof performance.now === 'function')
    ? function () { return performance.now(); }
    : function () { return Date.now(); };

  /* ---------- CSS ---------- */
  var CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cdefs%3E%3CradialGradient id='g' cx='.35' cy='.3' r='.8'%3E%3Cstop offset='0' stop-color='%23fff6d6'/%3E%3Cstop offset='.55' stop-color='%23f3cf7a'/%3E%3Cstop offset='1' stop-color='%23c99632'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='16' cy='16' r='12.5' fill='url(%23g)' stroke='%23b9852a' stroke-width='1.5'/%3E%3Cpath d='M16 21.5c-.4-.3-5.5-3.6-5.5-7.1a3 3 0 0 1 5.5-1.7 3 3 0 0 1 5.5 1.7c0 3.5-5.1 6.8-5.5 7.1z' fill='%23ff5c8a'/%3E%3C/svg%3E\") 16 16, pointer";

  var css = [
    /* o cartão inclinado + o selo girado geram "overflow" lateral (~12px a 375px),
       o que alargava a página no celular. Corta só na horizontal (o brilho e as
       lasquinhas continuam livres na vertical); "hidden" é o plano B antigo. */
    '#raspadinha{overflow:hidden}',
    '@supports (overflow:clip){#raspadinha{overflow:visible;overflow-x:clip}}',
    '.rasp-conteudo{display:flex;flex-direction:column;align-items:center;width:100%;max-width:640px}',
    '.rasp-dica{font-size:.98rem;opacity:.78;margin:-10px 0 30px}',

    /* cartão */
    '.rasp-cartao{position:relative;width:min(340px,100%);padding:10px;border-radius:28px;',
    '  background:linear-gradient(150deg,#fff 0%,#fff7fa 55%,#ffeef4 100%);',
    '  box-shadow:0 28px 50px -20px rgba(139,30,63,.5),0 10px 24px rgba(255,92,138,.16),inset 0 0 0 1px rgba(255,209,220,.95);',
    '  transform:rotate(-2.5deg);isolation:isolate}',
    /* brilho que aparece em volta do cartão quando a surpresa é revelada */
    '.rasp-cartao::before{content:"";position:absolute;inset:0;border-radius:inherit;z-index:-1;pointer-events:none;',
    '  box-shadow:0 0 0 3px rgba(255,209,220,.75),0 0 48px 10px rgba(255,92,138,.5);opacity:0;transition:opacity 1.2s ease}',
    '.rasp-revelado::before{opacity:1;animation:rasp-pulsa 3.2s ease-in-out 1.3s infinite}',
    '@keyframes rasp-pulsa{50%{opacity:.45}}',

    '.rasp-moldura{position:relative;border-radius:20px;overflow:hidden;isolation:isolate;',
    '  background:linear-gradient(135deg,#ffd1dc,#ffc2d4)}',
    '.rasp-moldura::before{content:"";display:block;padding-top:125%}',

    /* prêmio (foto + legenda) */
    '.rasp-premio{position:absolute;inset:0;visibility:hidden}',
    '.rasp-pronto .rasp-premio{visibility:visible}',
    '.rasp-foto{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;object-position:50% 26%;',
    '  -webkit-user-select:none;user-select:none;-webkit-user-drag:none;transform-origin:50% 35%}',
    '.rasp-zoom .rasp-foto{animation:rasp-zoom 9s cubic-bezier(.25,.6,.3,1) forwards}',
    '@keyframes rasp-zoom{from{transform:scale(1)}to{transform:scale(1.07)}}',
    '.rasp-semfoto{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font-size:5rem;',
    '  background:radial-gradient(circle at 50% 40%,#ffe3ec,#ffb3c8)}',
    '.rasp-sem-foto .rasp-semfoto{display:flex}',
    '.rasp-sem-foto .rasp-foto{display:none}',
    '.rasp-legenda{position:absolute;left:0;right:0;bottom:0;padding:64px 18px 20px;color:#fff;',
    '  font-family:"Dancing Script",cursive;font-size:clamp(1.4rem,5.8vw,1.7rem);line-height:1.2;text-wrap:balance;',
    '  text-shadow:0 2px 12px rgba(60,10,25,.45);',
    '  background:linear-gradient(180deg,rgba(90,20,40,0) 0%,rgba(90,20,40,.5) 45%,rgba(90,20,40,.8) 100%)}',
    '.rasp-reflexo{position:absolute;inset:0;pointer-events:none;opacity:0;transform:translateX(-120%);',
    '  background:linear-gradient(112deg,rgba(255,255,255,0) 32%,rgba(255,255,255,.5) 48%,rgba(255,255,255,0) 64%)}',
    '.rasp-revelado .rasp-reflexo{animation:rasp-reflexo 1.7s ease-in-out .45s forwards}',
    '@keyframes rasp-reflexo{0%{opacity:1;transform:translateX(-120%)}100%{opacity:1;transform:translateX(120%)}}',

    /* camada raspável */
    '.rasp-tela{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;',
    '  -webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;cursor:' + CURSOR + ';',
    '  transition:opacity .9s ease,transform .9s ease;outline:none}',
    '.rasp-tela:focus-visible{outline:3px solid rgba(255,255,255,.95);outline-offset:-8px}',
    '.rasp-revelado .rasp-tela{opacity:0;transform:scale(1.04);pointer-events:none}',

    /* lasquinhas que caem ao raspar */
    '.rasp-lascas{position:absolute;inset:0;pointer-events:none;z-index:3}',
    '.rasp-lasca{position:absolute;left:0;top:0;border-radius:2px;pointer-events:none;will-change:transform,opacity;',
    '  animation:rasp-lasca var(--dur,.9s) cubic-bezier(.3,.55,.55,1) forwards}',
    '@keyframes rasp-lasca{',
    '  0%{opacity:1;transform:translate(var(--x),var(--y)) rotate(0) scale(1)}',
    '  100%{opacity:0;transform:translate(calc(var(--x) + var(--dx)),calc(var(--y) + var(--dy))) rotate(var(--r)) scale(.45)}}',

    /* selinho "6 meses" */
    '.rasp-selo{position:absolute;top:-18px;right:-14px;z-index:4;width:66px;height:66px;border-radius:50%;',
    '  display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;',
    '  color:#fff;font-size:.72rem;font-weight:600;letter-spacing:.04em;line-height:1;',
    '  background:radial-gradient(circle at 35% 30%,#ff9fba,#ff5c8a 62%,#e5436f);',
    '  box-shadow:0 8px 18px rgba(255,92,138,.45),inset 0 0 0 3px rgba(255,255,255,.28);transform:rotate(14deg)}',
    '.rasp-selo b{font-family:"Dancing Script",cursive;font-size:1.7rem;line-height:.9;font-weight:700}',

    /* textos abaixo do cartão */
    '.rasp-segunda{margin-top:34px;min-height:1.3em;font-family:"Dancing Script",cursive;',
    '  font-size:clamp(1.65rem,6.2vw,2.2rem);line-height:1.25;text-wrap:balance;color:var(--vinho,#8b1e3f);',
    '  opacity:0;transform:translateY(12px);transition:opacity .6s ease,transform .6s ease}',
    '.rasp-segunda.rasp-mostra{opacity:1;transform:none;transition:opacity 1.1s ease .55s,transform 1.1s cubic-bezier(.2,.8,.2,1) .55s}',
    '.rasp-denovo{margin-top:12px;background:none;border:none;font:inherit;font-size:.92rem;color:var(--vinho,#8b1e3f);',
    '  text-decoration:underline;text-decoration-color:rgba(139,30,63,.35);text-underline-offset:4px;',
    '  padding:8px 14px;border-radius:999px;cursor:pointer;opacity:0;visibility:hidden;',
    '  transition:opacity .4s ease,visibility 0s linear .4s,background-color .25s ease}',
    '.rasp-denovo.rasp-mostra{opacity:1;visibility:visible;',
    '  transition:opacity .6s ease 1.3s,visibility 0s linear 0s,background-color .25s ease}',
    '.rasp-denovo:hover{background-color:rgba(255,209,220,.5)}',
    '.rasp-denovo:focus-visible{outline:2px solid var(--rosa,#ff5c8a);outline-offset:2px}',

    '@media (prefers-reduced-motion:reduce){',
    '  .rasp-zoom .rasp-foto{animation:none}',
    '  .rasp-revelado::before{animation:none}',
    '  .rasp-revelado .rasp-reflexo{animation:none}',
    '  .rasp-tela{transition:opacity .6s ease}',
    '  .rasp-revelado .rasp-tela{transform:none}',
    '  .rasp-segunda,.rasp-segunda.rasp-mostra{transform:none}',
    '}'
  ].join('\n');

  var estilo = document.createElement('style');
  estilo.setAttribute('data-efeito', 'raspadinha');
  estilo.textContent = css;
  (document.head || document.documentElement).appendChild(estilo);

  /* ---------- DOM ---------- */
  function el(tag, classe, texto) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  }

  secao.textContent = '';
  var conteudo = el('div', 'rasp-conteudo');
  var titulo = el('h2', null, 'Uma raspadinha pra você');
  var dica = el('p', 'rasp-dica', 'raspa com o dedo (ou com o mouse) 💕');
  var cartao = el('div', 'rasp-cartao');
  var moldura = el('div', 'rasp-moldura');
  var premio = el('div', 'rasp-premio');

  var foto = el('img', 'rasp-foto');
  foto.alt = 'Nós dois, juntinhos';
  foto.draggable = false;
  foto.decoding = 'async';
  foto.addEventListener('error', function () { cartao.classList.add('rasp-sem-foto'); });
  foto.src = FOTO;

  var semFoto = el('div', 'rasp-semfoto', '💞');
  semFoto.setAttribute('aria-hidden', 'true');
  var legenda = el('div', 'rasp-legenda', LEGENDA);
  var reflexo = el('div', 'rasp-reflexo');
  reflexo.setAttribute('aria-hidden', 'true');

  var tela = el('canvas', 'rasp-tela');
  tela.setAttribute('tabindex', '0');
  tela.setAttribute('role', 'button');
  tela.setAttribute('aria-label', 'Raspadinha com uma surpresa. Raspe com o dedo ou o mouse, ou aperte Enter para raspar tudo.');

  var lascas = el('div', 'rasp-lascas');
  lascas.setAttribute('aria-hidden', 'true');

  var selo = el('div', 'rasp-selo');
  selo.setAttribute('aria-hidden', 'true');
  selo.appendChild(el('b', null, '6'));
  selo.appendChild(el('span', null, 'meses'));

  var segunda = el('p', 'rasp-segunda', SEGUNDA_LINHA);
  segunda.setAttribute('aria-hidden', 'true');
  var denovo = el('button', 'rasp-denovo', 'raspar de novo');
  denovo.type = 'button';

  premio.appendChild(foto);
  premio.appendChild(semFoto);
  premio.appendChild(legenda);
  premio.appendChild(reflexo);
  moldura.appendChild(premio);
  moldura.appendChild(tela);
  cartao.appendChild(moldura);
  cartao.appendChild(lascas);
  cartao.appendChild(selo);
  conteudo.appendChild(titulo);
  conteudo.appendChild(dica);
  conteudo.appendChild(cartao);
  conteudo.appendChild(segunda);
  conteudo.appendChild(denovo);
  secao.appendChild(conteudo);

  var ctx = null;
  try { ctx = tela.getContext('2d'); } catch (e) { ctx = null; }
  if (!ctx) {
    // Sem canvas: mostra a surpresa direto, sem quebrar nada.
    tela.style.display = 'none';
    cartao.classList.add('rasp-pronto', 'rasp-revelado');
    segunda.classList.add('rasp-mostra');
    segunda.removeAttribute('aria-hidden');
    return;
  }

  /* ---------- Estado ---------- */
  var W = 0, H = 0, DPR = 1;   // tamanho CSS e densidade da camada
  var R = 22;                  // raio do pincel (px CSS)
  var pincel = null;           // carimbo pré-renderizado
  var revelado = false;
  var tocado = false;          // já foi raspado desde a última pintura?
  var ativo = null;            // pointerId que está raspando
  var ultimo = null, meio = null;
  var ultimaMedida = 0, ultimaLasca = 0, lascasVivas = 0;
  var M = { a: 1, b: 0, c: 0, d: 1 }; // parte linear da transformação do cartão
  var timers = [];
  var autoId = 0, ajusteId = 0;
  var viaToque = false;        // a última raspagem foi com o dedo?

  var GW = 32, GH = 40;
  var amostra = document.createElement('canvas');
  var actx = null;
  try { actx = amostra.getContext('2d', { willReadFrequently: true }); } catch (e) { actx = null; }

  function agenda(fn, ms) {
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

  /* PRNG com semente: a pintura fica idêntica quando é refeita */
  function semente(s) {
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function caminhoCoracao(c, x, y, largura, ang) {
    var k = largura / 2;
    c.save();
    c.translate(x, y);
    if (ang) c.rotate(ang);
    c.scale(k, k);
    c.beginPath();
    c.moveTo(0, 0.95);
    c.bezierCurveTo(-0.35, 0.68, -1, 0.3, -1, -0.22);
    c.bezierCurveTo(-1, -0.64, -0.72, -0.92, -0.42, -0.92);
    c.bezierCurveTo(-0.2, -0.92, -0.05, -0.8, 0, -0.56);
    c.bezierCurveTo(0.05, -0.8, 0.2, -0.92, 0.42, -0.92);
    c.bezierCurveTo(0.72, -0.92, 1, -0.64, 1, -0.22);
    c.bezierCurveTo(1, 0.3, 0.35, 0.68, 0, 0.95);
    c.closePath();
    c.restore();
  }

  function retanguloRedondo(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  /* ---------- Pintura da camada metálica ---------- */
  function pinta() {
    if (!W || !H) return;
    var rnd = semente(20260924);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, tela.width, tela.height);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // base metálica rosa + dourado
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f6bccd');
    g.addColorStop(0.2, '#ffe4ec');
    g.addColorStop(0.4, '#f2b0c5');
    g.addColorStop(0.56, '#f7ddb0');
    g.addColorStop(0.7, '#fde7ef');
    g.addColorStop(0.86, '#efb2c7');
    g.addColorStop(1, '#f4cf9f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // reflexos em faixas diagonais
    var b = ctx.createLinearGradient(0, H * 0.05, W, H * 0.95);
    b.addColorStop(0, 'rgba(255,255,255,0)');
    b.addColorStop(0.27, 'rgba(255,255,255,0)');
    b.addColorStop(0.33, 'rgba(255,255,255,.42)');
    b.addColorStop(0.39, 'rgba(255,255,255,0)');
    b.addColorStop(0.63, 'rgba(255,255,255,0)');
    b.addColorStop(0.68, 'rgba(255,255,255,.3)');
    b.addColorStop(0.73, 'rgba(255,255,255,0)');
    b.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = b;
    ctx.fillRect(0, 0, W, H);

    // textura escovada bem sutil
    ctx.lineWidth = 1;
    for (var y = 0; y < H; y += 3) {
      ctx.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(170,90,120,.035)';
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }

    // purpurina
    var qtd = Math.round((W * H) / 260);
    for (var i = 0; i < qtd; i++) {
      var a = 0.25 + rnd() * 0.6;
      ctx.fillStyle = rnd() < 0.72 ? 'rgba(255,255,255,' + a + ')' : 'rgba(255,232,178,' + a + ')';
      ctx.beginPath();
      ctx.arc(rnd() * W, rnd() * H, 0.35 + rnd() * 1.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // padrão de coraçõezinhos
    var passo = Math.max(30, W / 8.5);
    var linha = 0;
    for (var py = passo * 0.45; py < H + passo; py += passo * 0.86, linha++) {
      for (var px = (linha % 2 ? passo / 2 : 0) + passo * 0.25; px < W + passo; px += passo) {
        var tam = passo * 0.3 * (0.8 + rnd() * 0.4);
        caminhoCoracao(ctx, px, py, tam, (rnd() - 0.5) * 0.6);
        ctx.fillStyle = (linha + Math.round(px / passo)) % 3 === 0
          ? 'rgba(214,80,124,.2)'
          : 'rgba(255,255,255,.5)';
        ctx.fill();
      }
    }

    // bordinha tracejada, estilo bilhete
    ctx.save();
    ctx.setLineDash([7, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    retanguloRedondo(ctx, 12, 12, W - 24, H - 24, 14);
    ctx.stroke();
    ctx.restore();

    // halo claro atrás do texto
    var cx = W / 2, cy = H / 2;
    var halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.48);
    halo.addColorStop(0, 'rgba(255,250,252,.88)');
    halo.addColorStop(0.55, 'rgba(255,245,249,.55)');
    halo.addColorStop(1, 'rgba(255,245,249,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    var fs = Math.round(Math.max(22, Math.min(32, W * 0.092)));

    // coração principal acima do texto
    var ch = Math.max(34, W * 0.15);
    var gc = ctx.createLinearGradient(cx - ch / 2, cy - fs * 2.4, cx + ch / 2, cy - fs * 0.9);
    gc.addColorStop(0, '#ff9fba');
    gc.addColorStop(1, '#ff5c8a');
    caminhoCoracao(ctx, cx, cy - fs * 1.75, ch, 0);
    ctx.save();
    ctx.shadowColor = 'rgba(255,92,138,.45)';
    ctx.shadowBlur = 12 * DPR;
    ctx.fillStyle = gc;
    ctx.fill();
    ctx.restore();
    caminhoCoracao(ctx, cx, cy - fs * 1.75, ch, 0);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.stroke();

    // textos
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,.95)';
    ctx.shadowBlur = 6 * DPR;
    ctx.font = '600 ' + fs + 'px Quicksand, "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#8b1e3f';
    ctx.fillText('Raspe aqui ✨', cx, cy);
    ctx.font = '500 ' + Math.round(fs * 0.5) + 'px Quicksand, "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(139,30,63,.78)';
    ctx.fillText('tem uma surpresinha escondida', cx, cy + fs * 1.05);
    ctx.restore();

    tocado = false;
  }

  function criaPincel() {
    R = Math.max(16, Math.min(30, W * 0.075));
    var d = Math.max(2, Math.ceil(R * 2 * DPR));
    pincel = document.createElement('canvas');
    pincel.width = pincel.height = d;
    var p = pincel.getContext('2d');
    if (!p) { pincel = null; return; }
    var g = p.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(0,0,0,.96)');
    g.addColorStop(0.8, 'rgba(0,0,0,.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    p.fillStyle = g;
    p.fillRect(0, 0, d, d);
  }

  /* ---------- Tamanho / nitidez ---------- */
  function ajusta() {
    var w = moldura.clientWidth, h = moldura.clientHeight;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!w || !h) return;
    if (w === W && h === H && dpr === DPR) return;

    // guarda o que já foi raspado para não perder ao redimensionar
    var copia = null;
    if (W && H && tocado && !revelado) {
      try {
        copia = document.createElement('canvas');
        copia.width = tela.width;
        copia.height = tela.height;
        var c2 = copia.getContext('2d');
        if (c2) c2.drawImage(tela, 0, 0); else copia = null;
      } catch (e) { copia = null; }
    }

    W = w; H = h; DPR = dpr;
    tela.width = Math.max(1, Math.round(w * dpr));
    tela.height = Math.max(1, Math.round(h * dpr));
    GW = 32;
    GH = Math.max(8, Math.round(32 * h / w));
    amostra.width = GW;
    amostra.height = GH;
    criaPincel();
    pinta();

    if (copia) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(copia, 0, 0, tela.width, tela.height);
      ctx.restore();
      tocado = true;
    }
    cartao.classList.add('rasp-pronto');
  }

  function pedeAjuste() {
    if (ajusteId) return;
    ajusteId = requestAnimationFrame(function () {
      ajusteId = 0;
      ajusta();
    });
  }

  /* ---------- Raspagem ---------- */
  function carimbo(x, y) {
    if (!pincel) return;
    ctx.drawImage(pincel, x - R, y - R, R * 2, R * 2);
  }

  function preparaApagar() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function linhaReta(a, b, raio) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var passo = Math.max(1, (raio || R) * 0.22);
    var n = Math.max(1, Math.ceil(dist / passo));
    for (var i = 1; i <= n; i++) carimbo(a.x + dx * i / n, a.y + dy * i / n);
  }

  // curva quadrática de a até b, com c como ponto de controle (traço suave)
  function curva(a, c, b) {
    var comp = Math.sqrt((c.x - a.x) * (c.x - a.x) + (c.y - a.y) * (c.y - a.y)) +
               Math.sqrt((b.x - c.x) * (b.x - c.x) + (b.y - c.y) * (b.y - c.y));
    var n = Math.max(1, Math.ceil(comp / Math.max(1, R * 0.22)));
    for (var i = 1; i <= n; i++) {
      var t = i / n, u = 1 - t;
      carimbo(u * u * a.x + 2 * u * t * c.x + t * t * b.x,
              u * u * a.y + 2 * u * t * c.y + t * t * b.y);
    }
  }

  function comecaTraco(p) {
    preparaApagar();
    ultimo = p;
    meio = p;
    carimbo(p.x, p.y);
    tocado = true;
  }

  function continuaTraco(p) {
    if (!ultimo) { comecaTraco(p); return; }
    var dx = p.x - ultimo.x, dy = p.y - ultimo.y;
    if (dx * dx + dy * dy < 0.8) return;
    var novoMeio = { x: (ultimo.x + p.x) / 2, y: (ultimo.y + p.y) / 2 };
    preparaApagar();
    curva(meio, ultimo, novoMeio);
    meio = novoMeio;
    ultimo = p;
  }

  function terminaTraco() {
    if (ultimo && meio) {
      preparaApagar();
      linhaReta(meio, ultimo);
    }
    ultimo = null;
    meio = null;
  }

  /* Converte coordenadas da tela (viewport) para o espaço do canvas,
     desfazendo a leve inclinação do cartão. */
  function leMatriz() {
    M = { a: 1, b: 0, c: 0, d: 1 };
    try {
      var t = window.getComputedStyle(cartao).transform;
      var m = t && /^matrix\(([^)]+)\)$/.exec(t);
      if (m) {
        var v = m[1].split(',');
        var a = parseFloat(v[0]), b = parseFloat(v[1]), c = parseFloat(v[2]), d = parseFloat(v[3]);
        var det = a * d - b * c;
        if (isFinite(det) && Math.abs(det) > 1e-6) M = { a: a, b: b, c: c, d: d };
      }
    } catch (e) { /* mantém identidade */ }
  }

  function local(ev, r) {
    var dx = ev.clientX - (r.left + r.width / 2);
    var dy = ev.clientY - (r.top + r.height / 2);
    // escala extra que a matriz do cartão não conhece (a camada voltando do
    // scale(1.04) depois do "raspar de novo", ou zoom de algum ancestral)
    var esperado = Math.abs(M.a) * W + Math.abs(M.c) * H;
    var k = (esperado > 0 && r.width > 0) ? r.width / esperado : 1;
    if (!isFinite(k) || k < 0.5 || k > 2) k = 1;
    dx /= k;
    dy /= k;
    var det = M.a * M.d - M.b * M.c;
    return {
      x: (M.d * dx - M.c * dy) / det + W / 2,
      y: (-M.b * dx + M.a * dy) / det + H / 2
    };
  }

  /* ---------- Lasquinhas ---------- */
  var CORES_LASCA = ['#f7dcae', '#ffd1dc', '#ffffff', '#f2b0c5', '#ecc57c', '#ffe4ec'];
  function lasca(p) {
    if (!p) return;
    var t = agora();
    var limite = reduz ? 5 : 34;
    if (t - ultimaLasca < (reduz ? 160 : 36) || lascasVivas >= limite) return;
    ultimaLasca = t;
    var n = reduz ? 1 : 2;
    for (var i = 0; i < n; i++) {
      var s = el('span', 'rasp-lasca');
      var tam = 2.5 + Math.random() * 4;
      var dur = reduz ? 0.6 : (0.7 + Math.random() * 0.5);
      s.style.width = tam + 'px';
      s.style.height = (tam * (0.6 + Math.random() * 0.6)) + 'px';
      s.style.background = CORES_LASCA[(Math.random() * CORES_LASCA.length) | 0];
      s.style.boxShadow = '0 0 3px rgba(255,255,255,.7)';
      s.style.setProperty('--x', (p.x + 10 + (Math.random() - 0.5) * R) + 'px');
      s.style.setProperty('--y', (p.y + 10 + (Math.random() - 0.5) * R * 0.6) + 'px');
      s.style.setProperty('--dx', ((Math.random() - 0.5) * (reduz ? 16 : 56)) + 'px');
      s.style.setProperty('--dy', ((reduz ? 16 : 34) + Math.random() * (reduz ? 20 : 70)) + 'px');
      s.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg');
      s.style.setProperty('--dur', dur + 's');
      lascasVivas++;
      lascas.appendChild(s);
      (function (no, ms) {
        var foi = false;
        function tira() {
          if (foi) return;
          foi = true;
          lascasVivas = Math.max(0, lascasVivas - 1);
          if (no.parentNode) no.parentNode.removeChild(no);
        }
        no.addEventListener('animationend', tira);
        setTimeout(tira, ms + 300);
      })(s, dur * 1000);
    }
  }

  /* ---------- Medição do quanto foi raspado ---------- */
  function fracaoRaspada() {
    if (!actx || !W || !H) return 0;
    try {
      actx.globalCompositeOperation = 'copy';
      actx.clearRect(0, 0, GW, GH);
      actx.drawImage(tela, 0, 0, GW, GH);
      var d = actx.getImageData(0, 0, GW, GH).data;
      var n = 0;
      for (var i = 3; i < d.length; i += 4) if (d[i] < 128) n++;
      return n / (GW * GH);
    } catch (e) {
      return 0;
    }
  }

  function confere() {
    if (revelado) return;
    if (fracaoRaspada() >= LIMIAR) revela();
  }

  /* ---------- Revelar / reiniciar ---------- */
  function coracoes(x, y, n) {
    if (typeof window.explode === 'function') {
      try { window.explode(x, y, n); } catch (e) { /* ignora */ }
    }
  }

  function revela() {
    if (revelado) return;
    revelado = true;
    ativo = null;
    ultimo = meio = null;
    paraAuto();
    limpaTimers();

    // reinicia o zoom da foto mesmo se o timer do "raspar de novo" não chegou a tirá-lo
    cartao.classList.remove('rasp-zoom');
    void cartao.offsetWidth;
    cartao.classList.add('rasp-revelado', 'rasp-zoom');
    tela.setAttribute('tabindex', '-1');
    tela.setAttribute('aria-hidden', 'true');
    segunda.classList.add('rasp-mostra');
    segunda.removeAttribute('aria-hidden');
    denovo.classList.add('rasp-mostra');

    var r = moldura.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    coracoes(cx, cy, reduz ? 10 : 24);
    if (!reduz) {
      agenda(function () {
        var q = moldura.getBoundingClientRect();
        coracoes(q.left + q.width * 0.22, q.top + q.height * 0.3, 10);
        coracoes(q.left + q.width * 0.78, q.top + q.height * 0.34, 10);
      }, 380);
    }
    // um toque de vibração bem leve no celular (só depois de um toque real na tela)
    if (viaToque) {
      try {
        var ua = navigator.userActivation;
        if (typeof navigator.vibrate === 'function' && (!ua || ua.hasBeenActive)) navigator.vibrate([16, 50, 16]);
      } catch (e) { /* ignora */ }
    }

    if (document.activeElement === tela) {
      try { denovo.focus({ preventScroll: true }); } catch (e) { /* ignora */ }
    }
  }

  function reinicia() {
    paraAuto();
    limpaTimers();
    revelado = false;
    ativo = null;
    ultimo = meio = null;
    pinta();
    cartao.classList.remove('rasp-revelado');
    segunda.classList.remove('rasp-mostra');
    segunda.setAttribute('aria-hidden', 'true');
    denovo.classList.remove('rasp-mostra');
    tela.setAttribute('tabindex', '0');
    tela.removeAttribute('aria-hidden');
    // o zoom da foto só volta ao normal quando a camada já cobriu tudo
    agenda(function () { cartao.classList.remove('rasp-zoom'); }, 950);
    if (document.activeElement === denovo) {
      try { tela.focus({ preventScroll: true }); } catch (e) { /* ignora */ }
    }
  }

  /* ---------- Raspagem automática (teclado) ---------- */
  function paraAuto() {
    if (autoId) cancelAnimationFrame(autoId);
    autoId = 0;
  }

  function autoRaspa() {
    if (revelado || autoId || !W || !H) return;
    var m = Math.max(R, 18);
    var linhas = 8;
    var pts = [];
    for (var i = 0; i < linhas; i++) {
      pts.push({ x: i % 2 ? W - m : m, y: m + (H - 2 * m) * i / (linhas - 1) });
    }
    var comp = [0];
    for (var j = 1; j < pts.length; j++) {
      comp.push(comp[j - 1] + Math.sqrt(Math.pow(pts[j].x - pts[j - 1].x, 2) + Math.pow(pts[j].y - pts[j - 1].y, 2)));
    }
    var total = comp[comp.length - 1];
    var dur = reduz ? 650 : 1500;
    var raioOriginal = R;
    viaToque = false;
    var t0 = 0, anterior = null;

    function pontoEm(s) {
      var k = 1;
      while (k < comp.length - 1 && comp[k] < s) k++;
      var f = (s - comp[k - 1]) / ((comp[k] - comp[k - 1]) || 1);
      return { x: pts[k - 1].x + (pts[k].x - pts[k - 1].x) * f, y: pts[k - 1].y + (pts[k].y - pts[k - 1].y) * f };
    }

    function quadro(ts) {
      if (revelado) { autoId = 0; return; }
      if (!t0) t0 = ts;
      var f = Math.min(1, (ts - t0) / dur);
      var e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
      var p = pontoEm(e * total);
      R = raioOriginal * 1.35;
      preparaApagar();
      if (anterior) linhaReta(anterior, p, R); else carimbo(p.x, p.y);
      R = raioOriginal;
      tocado = true;
      lasca(p);
      anterior = p;
      if (f < 1) {
        autoId = requestAnimationFrame(quadro);
      } else {
        autoId = 0;
        revela();
      }
    }
    autoId = requestAnimationFrame(quadro);
  }

  /* ---------- Eventos ---------- */
  tela.addEventListener('pointerdown', function (e) {
    if (revelado || autoId) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (ativo !== null) {
      // segundo dedo na tela: ignora (um traço por vez)
      if (e.pointerType !== 'mouse' && e.isPrimary === false) return;
      // traço anterior que nunca recebeu o pointerup (ex.: soltou o botão fora
      // da janela): encerra e segue com o novo, pra raspadinha não "travar"
      terminaTraco();
      ativo = null;
    }
    e.preventDefault();
    ativo = e.pointerId;
    viaToque = e.pointerType === 'touch';
    try { tela.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
    leMatriz();
    var p = local(e, tela.getBoundingClientRect());
    comecaTraco(p);
    lasca(p);
    ultimaMedida = agora();
  });

  tela.addEventListener('pointermove', function (e) {
    if (e.pointerId !== ativo || revelado) return;
    // mouse voltando sem botão apertado: o pointerup se perdeu, encerra o traço
    if (e.pointerType === 'mouse' && e.buttons === 0) { solta(e); return; }
    e.preventDefault();
    var r = tela.getBoundingClientRect();
    var lista = null;
    if (typeof e.getCoalescedEvents === 'function') {
      try { lista = e.getCoalescedEvents(); } catch (err) { lista = null; }
    }
    if (!lista || !lista.length) lista = [e];
    for (var i = 0; i < lista.length; i++) continuaTraco(local(lista[i], r));
    lasca(ultimo);
    var t = agora();
    if (t - ultimaMedida > INTERVALO_MEDIDA) {
      ultimaMedida = t;
      confere();
    }
  });

  function solta(e) {
    if (e.pointerId !== ativo) return;
    ativo = null;
    try { if (tela.hasPointerCapture && tela.hasPointerCapture(e.pointerId)) tela.releasePointerCapture(e.pointerId); } catch (err) { /* ignora */ }
    if (revelado) return;
    terminaTraco();
    confere();
  }
  tela.addEventListener('pointerup', solta);
  tela.addEventListener('pointercancel', solta);
  tela.addEventListener('lostpointercapture', solta);

  // não deixa o clique da raspagem disparar a chuva de corações da página
  tela.addEventListener('click', function (e) { e.stopPropagation(); });
  tela.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  // reforço para navegadores antigos que ignoram touch-action: não rola a página enquanto raspa
  tela.addEventListener('touchmove', function (e) {
    if (!revelado && e.cancelable) e.preventDefault();
  }, { passive: false });

  tela.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      autoRaspa();
    }
  });

  denovo.addEventListener('click', function (e) {
    e.preventDefault();
    reinicia();
  });

  if (typeof window.ResizeObserver === 'function') {
    try { new ResizeObserver(pedeAjuste).observe(moldura); } catch (e) { /* ignora */ }
  }
  window.addEventListener('resize', pedeAjuste);
  window.addEventListener('orientationchange', pedeAjuste);

  ajusta();

  // quando a fonte Quicksand chegar, repinta (se ainda ninguém raspou)
  try {
    if (document.fonts && typeof document.fonts.load === 'function') {
      document.fonts.load('600 26px Quicksand').then(function () {
        if (!tocado && !revelado && W) pinta();
      }, function () { /* sem fonte, segue com a reserva */ });
    }
  } catch (e) { /* ignora */ }
})();
