/* ==========================================================================
   efeitos/galeria.js
   1) Visualizador de fotos (substitui o #lightbox antigo): foto grande com
      transição suave, setas, arrastar pro lado / pra baixo, teclado,
      contador, legenda e "beijinho" ao tocar na foto.
   2) "Ver a nossa história": slideshow cinematográfico em tela cheia com
      Ken Burns, crossfade, intertítulos, barra de progresso e final especial.
   Script clássico (sem módulos), não cria globais.
   ========================================================================== */
(function () {
  'use strict';

  var galeria = document.getElementById('galeria');
  if (!galeria || !document.body) return;

  var LISTA = null;
  try {
    if (typeof FOTOS !== 'undefined' && FOTOS && FOTOS.length) LISTA = FOTOS;
  } catch (e) { LISTA = null; }
  if (!LISTA) return;
  var N = LISTA.length;

  var CORACOES = ['💖', '💕', '💗', '💓', '💞', '❤️', '🌸', '💘'];
  try {
    if (typeof EMOJIS !== 'undefined' && EMOJIS && EMOJIS.length) CORACOES = EMOJIS;
  } catch (e) { /* usa o padrão */ }

  var mqReduz = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduz() { return !!(mqReduz && mqReduz.matches); }
  function ehToque() {
    return !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
  }
  function agora() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  /* ---------------------------------------------------------------- CSS */
  var CSS = [
    /* botão "Ver a nossa história" */
    '.galeria-cta{margin-top:36px;display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.galeria-play{position:relative;isolation:isolate;overflow:hidden;display:inline-flex;align-items:center;gap:14px;max-width:100%;padding:12px 28px 12px 12px;border:none;border-radius:999px;font-family:"Quicksand",sans-serif;font-weight:600;font-size:clamp(1.02rem,4vw,1.2rem);color:#fff;background:linear-gradient(135deg,#ff8fab 0%,#ff5c8a 52%,#e0457a 100%);box-shadow:0 14px 34px rgba(255,92,138,.45),inset 0 1px 0 rgba(255,255,255,.4);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .25s ease,box-shadow .25s ease}',
    '.galeria-play:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 18px 42px rgba(255,92,138,.55),inset 0 1px 0 rgba(255,255,255,.4)}',
    '.galeria-play:active{transform:scale(.97)}',
    '.galeria-play:focus-visible{outline:3px solid #8b1e3f;outline-offset:4px}',
    '.galeria-play::after{content:"";position:absolute;top:0;bottom:0;left:-45%;width:32%;z-index:-1;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(255,255,255,.5),rgba(255,255,255,0));transform:skewX(-18deg);animation:galeria-brilho 3.8s ease-in-out infinite}',
    '.galeria-play-ico{position:relative;flex:none;width:44px;height:44px;border-radius:50%;background:#fff;color:#ff5c8a;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(139,30,63,.25)}',
    '.galeria-play-ico svg{margin-left:3px}',
    '.galeria-play-ico::before{content:"";position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(255,255,255,.8);animation:galeria-onda 2.2s ease-out infinite}',
    '.galeria-cta-sub{font-size:.92rem;opacity:.75}',
    '@keyframes galeria-brilho{0%,55%{left:-45%}100%{left:130%}}',
    '@keyframes galeria-onda{from{transform:scale(.92);opacity:.9}to{transform:scale(1.4);opacity:0}}',
    '#galeria .polaroid:focus-visible{outline:3px solid #ff5c8a;outline-offset:5px}',

    /* coraçõezinhos que voam (usados nos dois overlays) */
    '.galeria-voa{position:absolute;z-index:6;pointer-events:none;line-height:1;transform:translate(-50%,-50%);animation:galeria-voa 1.2s cubic-bezier(.2,.8,.3,1) forwards;will-change:transform,opacity}',
    '@keyframes galeria-voa{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}15%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(var(--r))}}',
    '.galeria-beijo{position:absolute;z-index:7;pointer-events:none;font-size:64px;line-height:1;transform:translate(-50%,-50%);filter:drop-shadow(0 6px 16px rgba(255,92,138,.7));animation:galeria-beijo 1.05s cubic-bezier(.2,.9,.3,1.2) forwards}',
    '@keyframes galeria-beijo{0%{opacity:0;transform:translate(-50%,-50%) scale(.2)}25%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}45%{transform:translate(-50%,-50%) scale(.95)}100%{opacity:0;transform:translate(-50%,-115%) scale(1.05)}}',
    '@keyframes galeria-pulsa{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.65}50%{transform:translate(-50%,-50%) scale(1.2);opacity:1}}',
    '@keyframes galeria-bate{0%,100%{transform:scale(1)}14%{transform:scale(1.08)}28%{transform:scale(1)}42%{transform:scale(1.05)}70%{transform:scale(1)}}',
    '@keyframes galeria-bate-suave{0%,100%{transform:scale(1)}20%{transform:scale(1.025)}40%{transform:scale(1)}}',

    /* ---------- visualizador ---------- */
    '.galeria-v{position:fixed;inset:0;z-index:260;display:none;color:#fff;font-family:"Quicksand",sans-serif;touch-action:none;overscroll-behavior:contain;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;outline:none}',
    '.galeria-v.galeria-on{display:block}',
    '.galeria-v-fundo{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,rgba(122,28,64,.9) 0%,rgba(54,8,30,.95) 62%,rgba(24,4,14,.97) 100%);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .42s ease}',
    '.galeria-v.galeria-in .galeria-v-fundo{opacity:1}',
    '.galeria-v-palco{position:absolute;inset:0;cursor:zoom-out}',
    '.galeria-v-slide{position:absolute;top:calc(68px + env(safe-area-inset-top,0px));bottom:calc(98px + env(safe-area-inset-bottom,0px));left:16px;right:16px;display:flex;align-items:center;justify-content:center;transition:transform .5s cubic-bezier(.22,.9,.3,1),opacity .45s ease;will-change:transform,opacity}',
    '.galeria-v-slide img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.5),0 0 50px rgba(255,92,138,.28);-webkit-user-drag:none;cursor:pointer;transition:opacity .35s ease}',
    '.galeria-v-carregando img,.galeria-v-erro img{opacity:0}',
    '.galeria-v-carregando::after,.galeria-v-erro::after{content:"💗";position:absolute;left:50%;top:50%;font-size:2.6rem;transform:translate(-50%,-50%);animation:galeria-pulsa 1.1s ease-in-out infinite}',
    '.galeria-v-erro::after{animation:none}',
    '.galeria-v-sai{pointer-events:none}',
    '.galeria-v-topo{position:absolute;top:calc(12px + env(safe-area-inset-top,0px));left:16px;right:16px;z-index:3;display:flex;align-items:center;justify-content:space-between;pointer-events:none;opacity:0;transition:opacity .35s ease .08s}',
    '.galeria-v-cont{padding:8px 15px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);font-weight:600;font-size:.95rem;letter-spacing:.06em;font-variant-numeric:tabular-nums}',
    '.galeria-v-btn{display:flex;align-items:center;justify-content:center;padding:0;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.14);color:#fff;font:inherit;cursor:pointer;pointer-events:auto;touch-action:manipulation;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);transition:opacity .35s ease .08s,background .2s ease,box-shadow .2s ease,transform .2s ease}',
    '.galeria-v-btn:hover{background:rgba(255,92,138,.55);box-shadow:0 0 22px rgba(255,92,138,.6)}',
    '.galeria-v-btn:active{transform:scale(.92)}',
    '.galeria-v-btn:focus-visible{outline:2px solid #ffd1dc;outline-offset:3px}',
    '.galeria-v-x{width:44px;height:44px}',
    '.galeria-v-seta{position:absolute;z-index:3;top:50%;width:54px;height:54px;margin-top:-27px;opacity:0}',
    '.galeria-v-ant{left:22px}.galeria-v-prox{right:22px}',
    '.galeria-v-legenda{position:absolute;z-index:2;left:88px;right:88px;bottom:calc(22px + env(safe-area-inset-bottom,0px));min-height:56px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(1.8rem,6.4vw,2.6rem);line-height:1.1;text-shadow:0 2px 16px rgba(255,92,138,.9),0 1px 2px rgba(0,0,0,.4);pointer-events:none;opacity:0;transition:opacity .35s ease .08s}',
    '.galeria-v-legenda span{display:inline-block;transition:opacity .2s ease,transform .2s ease}',
    '.galeria-v-legenda.galeria-troca span{opacity:0;transform:translateY(6px)}',
    '.galeria-v.galeria-in .galeria-v-topo,.galeria-v.galeria-in .galeria-v-seta,.galeria-v.galeria-in .galeria-v-legenda{opacity:1}',
    '.galeria-v-dica{position:absolute;z-index:4;left:50%;top:calc(66px + env(safe-area-inset-top,0px));transform:translateX(-50%);width:max-content;max-width:calc(100% - 32px);padding:8px 15px;border-radius:999px;background:rgba(24,4,14,.6);border:1px solid rgba(255,255,255,.2);font-size:.84rem;text-align:center;pointer-events:none;opacity:0;transition:opacity .6s ease}',
    '.galeria-v-dica.galeria-mostra{opacity:1}',
    '@media (min-width:700px){.galeria-v-slide{left:100px;right:100px;bottom:calc(92px + env(safe-area-inset-bottom,0px))}.galeria-v-legenda{left:16px;right:16px}}',
    '@media (max-width:699px){.galeria-v-seta{top:auto;margin-top:0;bottom:calc(24px + env(safe-area-inset-bottom,0px));width:52px;height:52px}.galeria-v-ant{left:16px}.galeria-v-prox{right:16px}.galeria-v-legenda{left:76px;right:76px}}',

    /* ---------- história (slideshow) ---------- */
    '.galeria-h{position:fixed;inset:0;z-index:270;display:none;overflow:hidden;color:#fff;font-family:"Quicksand",sans-serif;background:radial-gradient(ellipse at 50% 35%,#3c1026 0%,#1b0611 60%,#0d0308 100%);touch-action:none;overscroll-behavior:contain;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none;cursor:pointer;outline:none;opacity:0;transition:opacity .7s ease}',
    '.galeria-h.galeria-on{display:block}',
    '.galeria-h.galeria-in{opacity:1}',
    '.galeria-h-palco{position:absolute;inset:0}',
    '.galeria-h-cena{position:absolute;inset:0;overflow:hidden;animation:galeria-h-entra 1.1s ease forwards}',
    '.galeria-h-cena.galeria-h-velha{animation:galeria-h-sai .9s ease .45s forwards}',
    '.galeria-h-pausado .galeria-h-palco,.galeria-h-pausado .galeria-h-palco *{animation-play-state:paused!important}',
    '@keyframes galeria-h-entra{from{opacity:0}to{opacity:1}}',
    '@keyframes galeria-h-sai{from{opacity:1}to{opacity:0}}',
    '.galeria-h-borrao{position:absolute;inset:0;width:100%;height:100%;transform:scale(1.15);opacity:.95}',
    '.galeria-h-kb{position:absolute;top:8%;bottom:max(16%,96px);left:5%;right:5%;display:flex;align-items:center;justify-content:center;animation-name:galeria-h-kb;animation-timing-function:linear;animation-fill-mode:forwards;will-change:transform}',
    '.galeria-h-kb img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;border-radius:8px;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.12);-webkit-user-drag:none}',
    '.galeria-h-cobre .galeria-h-kb{top:0;bottom:0;left:0;right:0}',
    '.galeria-h-cobre .galeria-h-kb img{width:100%;height:100%;max-width:none!important;max-height:none!important;object-fit:cover;border-radius:0;box-shadow:none}',
    '.galeria-h-semfoto .galeria-h-kb img{display:none}',
    '.galeria-h-semfoto .galeria-h-kb::after{content:"💗";font-size:4rem}',
    '@keyframes galeria-h-kb{from{transform:scale(var(--s0)) translate(var(--x0),var(--y0))}to{transform:scale(var(--s1)) translate(var(--x1),var(--y1))}}',
    '.galeria-h-data{position:absolute;left:16px;right:16px;bottom:calc(5% + env(safe-area-inset-bottom,0px));text-align:center;font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(1.9rem,7vw,3rem);line-height:1.15;text-shadow:0 2px 18px rgba(255,92,138,.95),0 1px 3px rgba(0,0,0,.55);opacity:0;animation:galeria-h-data 1.2s ease .6s forwards}',
    '@keyframes galeria-h-data{from{opacity:0;transform:translateY(12px);letter-spacing:.08em}to{opacity:1;transform:none;letter-spacing:.01em}}',
    '.galeria-h-titulo{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 24px;text-align:center}',
    '.galeria-h-texto{max-width:900px;font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(2.5rem,10vw,4.6rem);line-height:1.15;color:#ffe9f0;text-shadow:0 0 24px rgba(255,92,138,.75),0 0 60px rgba(255,92,138,.35)}',
    '.galeria-h-palavra{display:inline-block;opacity:0;animation:galeria-h-palavra 1.2s cubic-bezier(.2,.7,.3,1) forwards}',
    '@keyframes galeria-h-palavra{from{opacity:0;transform:translateY(14px);filter:blur(8px)}to{opacity:1;transform:none;filter:blur(0)}}',
    '.galeria-h-orn{margin-top:18px;font-size:1.3rem;color:#ff8fab;opacity:0;animation:galeria-h-entra 1.2s ease 1s forwards}',
    '.galeria-h-luzes{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
    '.galeria-h-luz{position:absolute;bottom:-25%;border-radius:50%;background:radial-gradient(circle,rgba(255,150,190,.6) 0%,rgba(255,92,138,0) 70%);animation:galeria-h-sobe linear infinite}',
    '.galeria-h-luz.galeria-h-ouro{background:radial-gradient(circle,rgba(255,214,150,.55) 0%,rgba(255,200,120,0) 70%)}',
    '@keyframes galeria-h-sobe{from{transform:translate3d(0,0,0)}to{transform:translate3d(var(--vx),-135vh,0)}}',
    '.galeria-h-vinheta{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 120% 90% at 50% 45%,rgba(8,0,4,0) 55%,rgba(8,0,4,.7) 100%),linear-gradient(to top,rgba(20,2,10,.65) 0%,rgba(20,2,10,0) 30%)}',
    '.galeria-h-barra{position:absolute;z-index:3;top:env(safe-area-inset-top,0px);left:0;right:0;height:3px;background:rgba(255,255,255,.12);pointer-events:none}',
    '.galeria-h-barra i{position:absolute;inset:0;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#ff5c8a,#ffb3c6);box-shadow:0 0 12px rgba(255,92,138,.8)}',
    '.galeria-h-x{position:absolute;z-index:5;top:calc(14px + env(safe-area-inset-top,0px));right:16px;width:44px;height:44px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;cursor:pointer;touch-action:manipulation;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:background .2s ease,transform .2s ease}',
    '.galeria-h-x:hover{background:rgba(255,92,138,.55)}',
    '.galeria-h-x:active{transform:scale(.92)}',
    '.galeria-h-x:focus-visible,.galeria-h-fim button:focus-visible{outline:2px solid #ffd1dc;outline-offset:3px}',
    '.galeria-h-pausa{position:absolute;z-index:4;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(20,4,12,.45);border:1px solid rgba(255,255,255,.3);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);pointer-events:none;opacity:0;transform:scale(.8);transition:opacity .3s ease,transform .3s ease}',
    '.galeria-h-pausado .galeria-h-pausa{opacity:1;transform:none}',
    '.galeria-h-pausado .galeria-h-pausa::after{content:"pausado";position:absolute;top:100%;left:50%;margin-top:12px;transform:translateX(-50%);font-size:.78rem;letter-spacing:.25em;text-transform:uppercase;white-space:nowrap;opacity:.85}',
    '.galeria-h-pausa.galeria-h-retoma{animation:galeria-h-retoma .7s ease forwards}',
    '@keyframes galeria-h-retoma{from{opacity:1;transform:none}to{opacity:0;transform:scale(1.35)}}',
    '.galeria-h-dica{position:absolute;z-index:4;left:50%;bottom:calc(22px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);width:max-content;max-width:calc(100% - 32px);padding:8px 15px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);font-size:.84rem;text-align:center;pointer-events:none;opacity:0;transition:opacity .6s ease}',
    '.galeria-h-dica.galeria-mostra{opacity:.92}',
    '.galeria-h-fim{position:absolute;z-index:3;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;text-align:center;cursor:default;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .6s ease,visibility 0s linear .6s}',
    '.galeria-h-final .galeria-h-fim{opacity:1;visibility:visible;pointer-events:auto;transition:opacity 1.4s ease .5s,visibility 0s}',
    '.galeria-h-final .galeria-h-pausa,.galeria-h-final .galeria-h-dica{display:none}',
    '.galeria-h-fim-cap{font-size:.78rem;letter-spacing:.32em;text-transform:uppercase;opacity:.7}',
    '.galeria-h-fim-titulo{margin:12px 0 10px;font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(3rem,13vw,5.6rem);line-height:1.05;color:#fff;text-shadow:0 0 26px rgba(255,92,138,.9),0 0 70px rgba(255,92,138,.45);animation:galeria-bate 1.6s ease-in-out infinite}',
    '.galeria-h-fim-sub{max-width:440px;font-size:clamp(1rem,3.8vw,1.2rem);line-height:1.6;opacity:.92}',
    '.galeria-h-fim-botoes{margin-top:30px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}',
    '.galeria-h-fim button{border:none;border-radius:999px;padding:13px 26px;font-family:"Quicksand",sans-serif;font-weight:600;font-size:1.05rem;cursor:pointer;touch-action:manipulation;transition:transform .2s ease,box-shadow .2s ease,background .2s ease}',
    '.galeria-h-denovo{color:#fff;background:linear-gradient(135deg,#ff8fab,#ff5c8a);box-shadow:0 12px 30px rgba(255,92,138,.5)}',
    '.galeria-h-sair{color:#fff;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3)!important}',
    '.galeria-h-fim button:hover{transform:translateY(-2px) scale(1.03)}',
    '.galeria-h-gota{position:absolute;z-index:2;top:-40px;pointer-events:none;line-height:1;animation:galeria-h-cai linear forwards}',
    '@keyframes galeria-h-cai{0%{opacity:0;transform:translate3d(0,0,0) rotate(0)}10%{opacity:.95}100%{opacity:.25;transform:translate3d(var(--vx),115vh,0) rotate(var(--r))}}',

    /* movimento reduzido: mais calmo, mas ainda vivo */
    '@media (prefers-reduced-motion:reduce){',
    '.galeria-play::after{animation-duration:9s}',
    '.galeria-play-ico::before{animation-duration:4.5s}',
    '.galeria-h-luz{animation-duration:90s!important}',
    '.galeria-h-fim-titulo{animation-name:galeria-bate-suave;animation-duration:2.4s}',
    '.galeria-h-palavra{animation-name:galeria-h-entra}',
    '.galeria-v-slide{transition-duration:.3s,.3s}',
    '.galeria-voa{animation-duration:1.6s!important}',
    '}'
  ].join('\n');

  var estilo = document.createElement('style');
  estilo.id = 'galeria-estilos';
  estilo.textContent = CSS;
  (document.head || document.documentElement).appendChild(estilo);

  /* ---------------------------------------------------------- utilidades */
  var ICO_X = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var ICO_ESQ = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICO_DIR = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M9.5 5.5L16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICO_PLAY = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.9-6.2a.8.8 0 0 0 0-1.4L9.2 5.1A.8.8 0 0 0 8 5.8z" fill="currentColor"/></svg>';
  var ICO_PAUSA = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false"><rect x="6.5" y="5" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.5" fill="currentColor"/></svg>';
  var ICO_PLAY_G = '<svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false"><path d="M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.9-6.2a.8.8 0 0 0 0-1.4L9.2 5.1A.8.8 0 0 0 8 5.8z" fill="currentColor"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function tira(e) { if (e && e.parentNode) e.parentNode.removeChild(e); }
  function depois(lista, fn, ms) {
    var id = setTimeout(function () {
      var k = lista.indexOf(id);
      if (k >= 0) lista.splice(k, 1);
      fn();
    }, ms);
    lista.push(id);
    return id;
  }
  function limpaTimers(lista) { while (lista.length) clearTimeout(lista.pop()); }
  function foca(e) {
    if (!e) return;
    try { e.focus({ preventScroll: true }); } catch (err) { try { e.focus(); } catch (err2) { /* ok */ } }
  }
  function emoji() { return CORACOES[Math.floor(Math.random() * CORACOES.length)]; }

  /* trava a rolagem da página enquanto algum overlay estiver aberto */
  var trava = { n: 0, html: '', body: '', pad: '' };
  function travaScroll() {
    if (trava.n++ > 0) return;
    var de = document.documentElement, b = document.body;
    var barra = window.innerWidth - de.clientWidth;
    trava.html = de.style.overflow;
    trava.body = b.style.overflow;
    trava.pad = b.style.paddingRight;
    de.style.overflow = 'hidden';
    b.style.overflow = 'hidden';
    if (barra > 0) b.style.paddingRight = barra + 'px';
  }
  function soltaScroll() {
    if (trava.n === 0) return;
    if (--trava.n > 0) return;
    var de = document.documentElement, b = document.body;
    de.style.overflow = trava.html;
    b.style.overflow = trava.body;
    b.style.paddingRight = trava.pad;
  }

  /* inicia a música (se existir o módulo e ela não estiver tocando) */
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

  /* explosão de coraçõezinhos dentro de um overlay (coordenadas da tela) */
  function coracoes(container, x, y, n, forca) {
    forca = forca || 1;
    for (var i = 0; i < n; i++) {
      var s = el('span', 'galeria-voa');
      s.textContent = emoji();
      var ang = Math.random() * Math.PI * 2;
      var dist = (40 + Math.random() * 80) * forca;
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      s.style.fontSize = ((14 + Math.random() * 16) * (forca > 1 ? 1.2 : 1)) + 'px';
      s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(1) + 'px');
      s.style.setProperty('--dy', (Math.sin(ang) * dist - 50).toFixed(1) + 'px');
      s.style.setProperty('--r', (Math.random() * 80 - 40).toFixed(0) + 'deg');
      var dur = 900 + Math.random() * 600;
      s.style.animationDuration = dur.toFixed(0) + 'ms';
      container.appendChild(s);
      setTimeout(tira.bind(null, s), dur + 80);
    }
  }

  function anguloDe(e) {
    try {
      var t = getComputedStyle(e).transform;
      if (!t || t === 'none') return 0;
      var m = t.match(/matrix\(([^)]+)\)/);
      if (!m) return 0;
      var v = m[1].split(',');
      return Math.atan2(parseFloat(v[1]), parseFloat(v[0])) || 0;
    } catch (err) { return 0; }
  }

  function polaroids() { return galeria.querySelectorAll('.polaroid'); }
  function indiceDe(p) { return Array.prototype.indexOf.call(polaroids(), p); }

  /* ======================================================================
     1) VISUALIZADOR
     ====================================================================== */
  var V = {
    aberto: false, fechando: false, atual: 0, slide: null, arrasto: null,
    timers: [], tLeg: 0, tFlip: 0, foco: null, dicaMostrada: false, cache: {}, ultimoDx: 0
  };

  var vRaiz = el('div', 'galeria-v');
  vRaiz.setAttribute('role', 'dialog');
  vRaiz.setAttribute('aria-modal', 'true');
  vRaiz.setAttribute('aria-label', 'Nossas fotos');
  vRaiz.tabIndex = -1;
  vRaiz.innerHTML =
    '<div class="galeria-v-fundo"></div>' +
    '<div class="galeria-v-palco"></div>' +
    '<div class="galeria-v-topo">' +
      '<span class="galeria-v-cont" aria-live="polite"></span>' +
      '<button type="button" class="galeria-v-btn galeria-v-x" aria-label="Fechar">' + ICO_X + '</button>' +
    '</div>' +
    '<button type="button" class="galeria-v-btn galeria-v-seta galeria-v-ant" aria-label="Foto anterior">' + ICO_ESQ + '</button>' +
    '<button type="button" class="galeria-v-btn galeria-v-seta galeria-v-prox" aria-label="Próxima foto">' + ICO_DIR + '</button>' +
    '<div class="galeria-v-legenda"><span></span></div>' +
    '<div class="galeria-v-dica" aria-hidden="true"></div>';
  document.body.appendChild(vRaiz);

  var fundoV = vRaiz.querySelector('.galeria-v-fundo');
  var palcoV = vRaiz.querySelector('.galeria-v-palco');
  var contV = vRaiz.querySelector('.galeria-v-cont');
  var btnXV = vRaiz.querySelector('.galeria-v-x');
  var btnAnt = vRaiz.querySelector('.galeria-v-ant');
  var btnProx = vRaiz.querySelector('.galeria-v-prox');
  var legV = vRaiz.querySelector('.galeria-v-legenda');
  var legTxt = legV.querySelector('span');
  var dicaV = vRaiz.querySelector('.galeria-v-dica');

  if (N < 2) { btnAnt.style.display = 'none'; btnProx.style.display = 'none'; }

  function precarrega(i) {
    var offs = [1, -1, 2];
    for (var k = 0; k < offs.length; k++) {
      var j = ((i + offs[k]) % N + N) % N;
      if (V.cache[j]) continue;
      var im = new Image();
      im.decoding = 'async';
      im.src = LISTA[j].arquivo;
      V.cache[j] = im;
    }
  }

  function criaSlide(i) {
    var s = el('div', 'galeria-v-slide galeria-v-carregando');
    var img = new Image();
    img.alt = 'Foto ' + (i + 1) + ' de ' + N + ' — ' + LISTA[i].legenda;
    img.draggable = false;
    img.decoding = 'async';
    img.onload = function () { s.classList.remove('galeria-v-carregando'); };
    img.onerror = function () {
      s.classList.remove('galeria-v-carregando');
      s.classList.add('galeria-v-erro');
    };
    img.src = LISTA[i].arquivo;
    if (img.complete && img.naturalWidth) s.classList.remove('galeria-v-carregando');
    s.appendChild(img);
    return { el: s, img: img };
  }

  function atualizaInfo(i, imediato) {
    contV.textContent = (i + 1) + ' / ' + N;
    try { document.dispatchEvent(new CustomEvent('galeria:foto', { detail: { i: i } })); } catch (e) { /* navegador antigo */ }
    clearTimeout(V.tLeg);
    if (imediato) {
      legTxt.textContent = LISTA[i].legenda;
      legV.classList.remove('galeria-troca');
      return;
    }
    legV.classList.add('galeria-troca');
    V.tLeg = setTimeout(function () {
      legTxt.textContent = LISTA[i].legenda;
      legV.classList.remove('galeria-troca');
    }, 190);
  }

  var CLIP_ABERTO = 'inset(-90px round 14px)';
  function setClip(img, v) { img.style.clipPath = v; img.style.webkitClipPath = v; }

  /* a foto "sai" da polaroid e cresce até o centro */
  function flipAbrir(img, origem) {
    var alvo = origem.querySelector('.foto') || origem;
    var rD = alvo.getBoundingClientRect();
    var rI = img.getBoundingClientRect();
    var w = img.offsetWidth, h = img.offsetHeight;
    if (!rD.width || !rI.width || !w || !h) return;
    var ang = anguloDe(origem);
    var lado = rD.width / (Math.abs(Math.cos(ang)) + Math.abs(Math.sin(ang)));
    var c = Math.min(w, h), s = lado / c;
    var dx = (rD.left + rD.width / 2) - (rI.left + rI.width / 2);
    var dy = (rD.top + rD.height / 2) - (rI.top + rI.height / 2);
    var ix = (w - c) / 2, iy = (h - c) / 2;
    img.style.transition = 'none';
    img.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) rotate(' + ang.toFixed(4) + 'rad) scale(' + s.toFixed(4) + ')';
    setClip(img, 'inset(' + iy.toFixed(1) + 'px ' + ix.toFixed(1) + 'px ' + iy.toFixed(1) + 'px ' + ix.toFixed(1) + 'px round ' + (3 / s).toFixed(1) + 'px)');
    void img.offsetWidth;
    var ease = ' .62s cubic-bezier(.2,.85,.22,1)';
    img.style.transition = 'transform' + ease + ',clip-path' + ease + ',-webkit-clip-path' + ease;
    img.style.transform = '';
    setClip(img, CLIP_ABERTO);
    clearTimeout(V.tFlip);
    V.tFlip = setTimeout(function () {
      img.style.transition = '';
      setClip(img, '');
    }, 700);
  }

  /* a foto volta voando pro lugar dela na galeria */
  function flipFechar(img, p) {
    var alvo = p.querySelector('.foto') || p;
    var rD = alvo.getBoundingClientRect();
    if (!rD.width || rD.bottom < 0 || rD.top > window.innerHeight) return false;
    /* congela qualquer animação de abertura ainda em curso antes de medir */
    clearTimeout(V.tFlip);
    img.style.transition = 'none';
    img.style.transform = '';
    setClip(img, CLIP_ABERTO);
    var rI = img.getBoundingClientRect();
    var w = img.offsetWidth, h = img.offsetHeight;
    if (!rI.width || !w || !h) { setClip(img, ''); return false; }
    var ang = anguloDe(p);
    var lado = rD.width / (Math.abs(Math.cos(ang)) + Math.abs(Math.sin(ang)));
    var c = Math.min(w, h), s = lado / c;
    var dx = (rD.left + rD.width / 2) - (rI.left + rI.width / 2);
    var dy = (rD.top + rD.height / 2) - (rI.top + rI.height / 2);
    var ix = (w - c) / 2, iy = (h - c) / 2;
    var ease = ' .5s cubic-bezier(.4,0,.2,1)';
    img.style.transition = 'transform' + ease + ',clip-path' + ease + ',-webkit-clip-path' + ease;
    img.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) rotate(' + ang.toFixed(4) + 'rad) scale(' + s.toFixed(4) + ')';
    setClip(img, 'inset(' + iy.toFixed(1) + 'px ' + ix.toFixed(1) + 'px ' + iy.toFixed(1) + 'px ' + ix.toFixed(1) + 'px round ' + (3 / s).toFixed(1) + 'px)');
    return true;
  }

  function garanteVisivel(p) {
    var r = p.getBoundingClientRect();
    var margem = 70;
    if (r.top >= margem && r.bottom <= window.innerHeight - margem) return;
    var de = document.documentElement;
    var sb = de.style.scrollBehavior;
    de.style.scrollBehavior = 'auto';
    try { window.scrollBy(0, r.top + r.height / 2 - window.innerHeight / 2); } catch (e) { /* ok */ }
    de.style.scrollBehavior = sb;
  }

  function mostra(i, dir, origem) {
    i = ((i % N) + N) % N;
    var antigo = V.slide;
    var novo = criaSlide(i);
    var s = novo.el;
    var d = Math.min(120, window.innerWidth * 0.18);
    var usaFlip = !!(origem && !reduz() && novo.img.complete && novo.img.naturalWidth);

    if (!usaFlip) {
      s.style.transition = 'none';
      s.style.opacity = '0';
      s.style.transform = dir ? 'translateX(' + (dir * d).toFixed(0) + 'px) scale(.97)' : 'scale(.94)';
    }
    palcoV.appendChild(s);
    V.slide = novo;
    V.atual = i;

    if (usaFlip) {
      flipAbrir(novo.img, origem);
    } else {
      void s.offsetWidth;
      s.style.transition = '';
      s.style.opacity = '';
      s.style.transform = '';
    }

    if (antigo) {
      var a = antigo.el;
      a.classList.add('galeria-v-sai');
      a.style.transition = '';
      a.style.opacity = '0';
      var saida = Math.max(d, Math.abs(V.ultimoDx) + d * 0.6);
      a.style.transform = dir ? 'translateX(' + (-dir * saida).toFixed(0) + 'px) scale(.96)' : 'scale(.96)';
      depois(V.timers, tira.bind(null, a), 620);
    }
    V.ultimoDx = 0;
    fundoV.style.transition = '';
    fundoV.style.opacity = '';

    atualizaInfo(i, !antigo);
    precarrega(i);
  }

  function navega(dir) {
    if (!V.aberto || V.fechando || N < 2) return;
    mostra(V.atual + dir, dir);
  }

  function voltaV() {
    var sl = V.slide && V.slide.el;
    if (sl) {
      sl.style.transition = '';
      sl.style.transform = '';
      sl.style.opacity = '';
    }
    fundoV.style.transition = '';
    fundoV.style.opacity = '';
  }

  function beijinho(x, y) {
    var b = el('span', 'galeria-beijo');
    b.textContent = Math.random() < 0.5 ? '💋' : '💖';
    b.style.left = x + 'px';
    b.style.top = y + 'px';
    vRaiz.appendChild(b);
    setTimeout(tira.bind(null, b), 1150);
    coracoes(vRaiz, x, y, reduz() ? 4 : 8, 1);
  }

  function mostraDicaV() {
    if (V.dicaMostrada) return;
    V.dicaMostrada = true;
    dicaV.textContent = ehToque()
      ? 'arrasta pro lado pra ver mais · toca na foto pra mandar um beijinho 💋'
      : 'usa ← → pra passear · clica na foto pra mandar um beijinho 💋';
    depois(V.timers, function () { dicaV.classList.add('galeria-mostra'); }, 700);
    depois(V.timers, function () { dicaV.classList.remove('galeria-mostra'); }, 5200);
  }

  function abreViewer(i, origem) {
    if (V.fechando) terminaFechamentoV();
    if (V.aberto) { mostra(i, i > V.atual ? 1 : -1); return; }
    V.aberto = true;
    V.foco = document.activeElement;
    travaScroll();
    vRaiz.classList.add('galeria-on');
    void vRaiz.offsetWidth;
    vRaiz.classList.add('galeria-in');
    document.addEventListener('keydown', teclaV, true);
    mostra(i, 0, origem || null);
    foca(btnXV);
    mostraDicaV();
  }

  function fechaV(modo, dy) {
    if (!V.aberto || V.fechando) return;
    V.fechando = true;
    V.arrasto = null;
    document.removeEventListener('keydown', teclaV, true);
    clearTimeout(V.tLeg);
    dicaV.classList.remove('galeria-mostra');

    var sl = V.slide;
    var voou = false;
    if (sl) {
      if (modo === 'arrasto') {
        var sinal = dy < 0 ? -1 : 1;
        sl.el.style.transition = 'transform .4s ease-in,opacity .4s ease-in';
        sl.el.style.transform = 'translateY(' + (sinal * window.innerHeight * 0.7).toFixed(0) + 'px) scale(.8)';
        sl.el.style.opacity = '0';
      } else {
        var p = polaroids()[V.atual];
        if (p && !reduz() && sl.img.complete && sl.img.naturalWidth && !sl.el.classList.contains('galeria-v-erro')) {
          sl.el.style.transition = 'none';
          sl.el.style.transform = '';
          sl.el.style.opacity = '';
          garanteVisivel(p);
          voou = flipFechar(sl.img, p);
        }
        if (!voou) {
          sl.el.style.transition = '';
          sl.el.style.opacity = '0';
          sl.el.style.transform = 'scale(.94)';
        }
      }
    }
    fundoV.style.transition = '';
    fundoV.style.opacity = '';
    vRaiz.classList.remove('galeria-in');
    depois(V.timers, terminaFechamentoV, voou ? 540 : 420);
  }

  function terminaFechamentoV() {
    limpaTimers(V.timers);
    clearTimeout(V.tLeg);
    clearTimeout(V.tFlip);
    vRaiz.classList.remove('galeria-on', 'galeria-in');
    palcoV.innerHTML = '';
    var soltos = vRaiz.querySelectorAll('.galeria-voa,.galeria-beijo');
    for (var i = 0; i < soltos.length; i++) tira(soltos[i]);
    V.slide = null;
    V.arrasto = null;
    V.aberto = false;
    V.fechando = false;
    soltaScroll();
    var f = V.foco;
    V.foco = null;
    if (f && f !== document.body && document.contains(f)) foca(f);
  }

  function prendeTab(e, raiz) {
    var bs = raiz.querySelectorAll('button');
    var vis = [];
    for (var i = 0; i < bs.length; i++) {
      var b = bs[i];
      if (b.offsetParent === null) continue;
      if (getComputedStyle(b).visibility === 'hidden') continue;
      vis.push(b);
    }
    if (!vis.length) { e.preventDefault(); return; }
    var k = vis.indexOf(document.activeElement);
    e.preventDefault();
    if (e.shiftKey) k = k <= 0 ? vis.length - 1 : k - 1;
    else k = (k < 0 || k >= vis.length - 1) ? 0 : k + 1;
    foca(vis[k]);
  }

  function teclaV(e) {
    if (!V.aberto || V.fechando) return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'Right') { e.preventDefault(); navega(1); }
    else if (k === 'ArrowLeft' || k === 'Left') { e.preventDefault(); navega(-1); }
    else if (k === 'Escape' || k === 'Esc') { e.preventDefault(); fechaV(); }
    else if (k === 'Tab') prendeTab(e, vRaiz);
  }

  /* ---- gestos: arrastar pro lado, arrastar pra baixo, tocar ---- */
  palcoV.addEventListener('pointerdown', function (e) {
    if (!V.aberto || V.fechando || V.arrasto) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    V.arrasto = {
      id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: agora(),
      modo: '', dx: 0, dy: 0,
      naFoto: !!(e.target && e.target.tagName === 'IMG')
    };
    try { palcoV.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    if (e.pointerType === 'mouse') e.preventDefault();
  });

  palcoV.addEventListener('pointermove', function (e) {
    var a = V.arrasto;
    if (!a || e.pointerId !== a.id) return;
    var dx = e.clientX - a.x0, dy = e.clientY - a.y0;
    a.dx = dx; a.dy = dy;
    var sl = V.slide && V.slide.el;
    if (!sl) return;
    if (!a.modo) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      a.modo = (Math.abs(dx) >= Math.abs(dy) && N > 1) ? 'h' : 'v';
      sl.style.transition = 'none';
      fundoV.style.transition = 'none';
    }
    if (a.modo === 'h') {
      sl.style.transform = 'translateX(' + dx.toFixed(1) + 'px) rotate(' + (dx * 0.012).toFixed(2) + 'deg)';
      sl.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / (window.innerWidth * 1.1)).toFixed(3));
    } else {
      var p = Math.min(Math.abs(dy) / 320, 1);
      sl.style.transform = 'translateY(' + dy.toFixed(1) + 'px) scale(' + (1 - p * 0.18).toFixed(3) + ')';
      fundoV.style.opacity = String((1 - p * 0.75).toFixed(3));
    }
  });

  function soltaDedoV(e) {
    var a = V.arrasto;
    if (!a || e.pointerId !== a.id) return;
    V.arrasto = null;
    try { palcoV.releasePointerCapture(e.pointerId); } catch (err) { /* ok */ }
    if (e.type === 'pointercancel') { voltaV(); return; }
    var dt = Math.max(1, agora() - a.t0);
    if (a.modo === 'h') {
      var vx = a.dx / dt;
      if (Math.abs(a.dx) > 70 || (Math.abs(vx) > 0.45 && Math.abs(a.dx) > 24)) {
        V.ultimoDx = a.dx;
        navega(a.dx < 0 ? 1 : -1);
      } else voltaV();
    } else if (a.modo === 'v') {
      var vy = a.dy / dt;
      if (Math.abs(a.dy) > 110 || (Math.abs(vy) > 0.5 && Math.abs(a.dy) > 30)) fechaV('arrasto', a.dy);
      else voltaV();
    } else if (dt < 700) {
      if (a.naFoto) beijinho(e.clientX, e.clientY);
      else fechaV();
    }
  }
  palcoV.addEventListener('pointerup', soltaDedoV);
  palcoV.addEventListener('pointercancel', soltaDedoV);

  btnXV.addEventListener('click', function () { fechaV(); });
  btnAnt.addEventListener('click', function () { navega(-1); });
  btnProx.addEventListener('click', function () { navega(1); });
  /* cliques dentro do visualizador não disparam a explosão da página por trás */
  vRaiz.addEventListener('click', function (e) { e.stopPropagation(); });
  vRaiz.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ---- assume o clique nas polaroids (fase de captura: o lightbox antigo não roda) ---- */
  galeria.addEventListener('click', function (e) {
    var p = e.target && e.target.closest ? e.target.closest('.polaroid') : null;
    if (!p || !galeria.contains(p)) return;
    var i = indiceDe(p);
    if (i < 0 || i >= N) return;
    e.stopPropagation();
    e.preventDefault();
    abreViewer(i, p);
  }, true);

  galeria.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var p = e.target && e.target.closest ? e.target.closest('.polaroid') : null;
    if (!p || !galeria.contains(p)) return;
    var i = indiceDe(p);
    if (i < 0 || i >= N) return;
    e.preventDefault();
    abreViewer(i, p);
  });

  (function acessivel() {
    var ps = polaroids();
    for (var i = 0; i < ps.length && i < N; i++) {
      if (!ps[i].hasAttribute('tabindex')) ps[i].tabIndex = 0;
      ps[i].setAttribute('role', 'button');
      ps[i].setAttribute('aria-label', 'Abrir foto ' + (i + 1) + ' — ' + LISTA[i].legenda);
    }
  })();

  /* rede de segurança: se algo ainda abrir o #lightbox com uma foto da galeria,
     ele é fechado na hora e o visualizador novo abre no lugar */
  var lb = document.getElementById('lightbox');
  if (lb && window.MutationObserver) {
    var indicePorSrc = function (src) {
      if (!src) return -1;
      var s = src;
      try { s = decodeURI(src); } catch (e) { /* mantém */ }
      for (var i = 0; i < N; i++) {
        var arq = LISTA[i].arquivo;
        if (s === arq || s.slice(-(arq.length + 1)) === '/' + arq) return i;
      }
      return -1;
    };
    new MutationObserver(function () {
      if (!lb.classList.contains('on')) return;
      var img = lb.querySelector('img');
      var i = indicePorSrc(img ? (img.getAttribute('src') || img.src) : '');
      if (i < 0) return;
      lb.classList.remove('on');
      abreViewer(i, null);
    }).observe(lb, { attributes: true, attributeFilter: ['class'] });
  }

  /* ======================================================================
     2) A NOSSA HISTÓRIA (slideshow cinematográfico)
     ====================================================================== */
  var H = {
    aberto: false, fechando: false, pausado: false, acabou: false,
    tempo: 0, ultimo: 0, raf: 0, k: -1,
    cenas: [], inicios: [], total: 1, remocoes: [],
    timers: [], chuva: 0, foco: null, toque: null, cache: {}, dicaMostrada: false
  };

  var hRaiz = el('div', 'galeria-h');
  hRaiz.setAttribute('role', 'dialog');
  hRaiz.setAttribute('aria-modal', 'true');
  hRaiz.setAttribute('aria-label', 'A nossa história');
  hRaiz.tabIndex = -1;
  hRaiz.innerHTML =
    '<div class="galeria-h-palco" aria-live="polite"></div>' +
    '<div class="galeria-h-luzes" aria-hidden="true"></div>' +
    '<div class="galeria-h-vinheta" aria-hidden="true"></div>' +
    '<div class="galeria-h-barra" aria-hidden="true"><i></i></div>' +
    '<button type="button" class="galeria-h-x" aria-label="Sair da história">' + ICO_X + '</button>' +
    '<div class="galeria-h-pausa" aria-hidden="true"></div>' +
    '<div class="galeria-h-dica" aria-hidden="true"></div>' +
    '<div class="galeria-h-fim">' +
      '<div class="galeria-h-fim-cap">fim do primeiro capítulo</div>' +
      '<div class="galeria-h-fim-titulo">Te amo, Cybele 💖</div>' +
      '<p class="galeria-h-fim-sub">Mal posso esperar pra escrever os próximos capítulos com você.</p>' +
      '<div class="galeria-h-fim-botoes">' +
        '<button type="button" class="galeria-h-denovo">↺ ver de novo</button>' +
        '<button type="button" class="galeria-h-sair">fechar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(hRaiz);

  var palcoH = hRaiz.querySelector('.galeria-h-palco');
  var luzesH = hRaiz.querySelector('.galeria-h-luzes');
  var barraH = hRaiz.querySelector('.galeria-h-barra i');
  var btnXH = hRaiz.querySelector('.galeria-h-x');
  var pausaH = hRaiz.querySelector('.galeria-h-pausa');
  var dicaH = hRaiz.querySelector('.galeria-h-dica');
  var btnDeNovo = hRaiz.querySelector('.galeria-h-denovo');
  var btnSairH = hRaiz.querySelector('.galeria-h-sair');

  (function criaLuzes() {
    for (var i = 0; i < 12; i++) {
      var s = el('span', 'galeria-h-luz' + (i % 4 === 3 ? ' galeria-h-ouro' : ''));
      var tam = 40 + Math.random() * 140;
      s.style.width = tam.toFixed(0) + 'px';
      s.style.height = tam.toFixed(0) + 'px';
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.opacity = (0.15 + Math.random() * 0.35).toFixed(2);
      s.style.setProperty('--vx', (Math.random() * 120 - 60).toFixed(0) + 'px');
      s.style.animationDuration = (16 + Math.random() * 18).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 30).toFixed(1) + 's';
      luzesH.appendChild(s);
    }
  })();

  var DUR_FOTO = 3200;
  var FADE_H = 1100;

  function montaCenas() {
    var c = [];
    c.push({ tipo: 'titulo', texto: 'Era uma vez…', dur: 3000 });
    var i30 = Math.round(N * 0.3), i60 = Math.round(N * 0.6);
    for (var i = 0; i < N; i++) {
      if (i === 1 && N > 3) c.push({ tipo: 'titulo', texto: '…um encontro que mudou tudo.', dur: 2900 });
      if (N >= 10 && i === i30) c.push({ tipo: 'titulo', texto: 'e cada dia com você…', dur: 2700 });
      if (N >= 10 && i === i60) c.push({ tipo: 'titulo', texto: '…foi mais bonito que o anterior.', dur: 2900 });
      if (N > 2 && i === N - 1) c.push({ tipo: 'titulo', texto: 'até chegar aqui…', dur: 2500 });
      c.push({ tipo: 'foto', i: i, dur: DUR_FOTO });
    }
    c.push({ tipo: 'titulo', texto: '…e isso é só o começo. 💖', dur: 3800 });
    return c;
  }

  function precarregaH(i) {
    if (H.cache[i]) return;
    var im = new Image();
    im.decoding = 'async';
    im.src = LISTA[i].arquivo;
    H.cache[i] = im;
  }

  /* fundo desfocado barato: a foto reduzida num canvas minúsculo e esticada */
  function borrao(cv, img) {
    try {
      var W = window.innerWidth || 375, Hh = window.innerHeight || 667;
      var w = 16, h = Math.max(8, Math.min(48, Math.round(16 * Hh / W)));
      cv.width = w;
      cv.height = h;
      var ctx = cv.getContext('2d');
      if (!ctx) return;
      var nw = img.naturalWidth, nh = img.naturalHeight;
      var ar = w / h, iar = nw / nh, sx, sy, sw, sh;
      if (iar > ar) { sh = nh; sw = sh * ar; sx = (nw - sw) / 2; sy = 0; }
      else { sw = nw; sh = sw / ar; sx = 0; sy = (nh - sh) / 2; }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      ctx.fillStyle = 'rgba(28,6,18,.42)';
      ctx.fillRect(0, 0, w, h);
    } catch (e) { /* sem fundo desfocado */ }
  }

  function decideCobre(img) {
    var W = window.innerWidth || 375, Hh = window.innerHeight || 667;
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return false;
    var arI = nw / nh, arT = W / Hh;
    var diferenca = Math.max(arI / arT, arT / arI);
    var escala = Math.max(W / nw, Hh / nh);
    return diferenca <= 1.42 && escala <= 2.1;
  }

  function kenBurns(kb, cobre, dur) {
    var r = reduz();
    var s0, s1, amp;
    var aproxima = Math.random() < 0.62;
    if (r) { s0 = cobre ? 1.04 : 1; s1 = s0 + 0.03; amp = 0; }
    else if (cobre) { s0 = aproxima ? 1.06 : 1.17; s1 = aproxima ? 1.17 : 1.06; amp = 2.4; }
    else { s0 = aproxima ? 1 : 1.07; s1 = aproxima ? 1.07 : 1; amp = 1.3; }
    var ang = Math.random() * Math.PI * 2;
    var x0 = Math.cos(ang) * amp, y0 = Math.sin(ang) * amp;
    kb.style.setProperty('--s0', s0.toFixed(3));
    kb.style.setProperty('--s1', s1.toFixed(3));
    kb.style.setProperty('--x0', x0.toFixed(2) + '%');
    kb.style.setProperty('--y0', y0.toFixed(2) + '%');
    kb.style.setProperty('--x1', (-x0).toFixed(2) + '%');
    kb.style.setProperty('--y1', (-y0).toFixed(2) + '%');
    kb.style.animationDuration = dur + 'ms';
  }

  function cenaFoto(c) {
    var f = LISTA[c.i];
    var cena = el('div', 'galeria-h-cena galeria-h-foto');
    var cv = document.createElement('canvas');
    cv.className = 'galeria-h-borrao';
    cv.width = 2; cv.height = 2;
    var kb = el('div', 'galeria-h-kb');
    var img = new Image();
    img.alt = 'Foto de ' + f.legenda;
    img.draggable = false;
    var data = el('div', 'galeria-h-data');
    data.textContent = f.legenda;
    kb.appendChild(img);
    cena.appendChild(cv);
    cena.appendChild(kb);
    cena.appendChild(data);

    var durKB = c.dur + FADE_H + 700;
    var ajusta = function () {
      if (!img.naturalWidth) return false;
      var cobre = decideCobre(img);
      cena.classList.toggle('galeria-h-cobre', cobre);
      if (!cobre) {
        img.style.maxWidth = 'min(100%, ' + Math.round(img.naturalWidth * 2.6) + 'px)';
        img.style.maxHeight = 'min(100%, ' + Math.round(img.naturalHeight * 2.6) + 'px)';
      }
      borrao(cv, img);
      return cobre;
    };
    img.onerror = function () { cena.classList.add('galeria-h-semfoto'); };
    img.src = f.arquivo;
    if (img.complete && img.naturalWidth) {
      kenBurns(kb, ajusta(), durKB);
    } else {
      kenBurns(kb, false, durKB);
      /* se a foto chegou atrasada e virou tela cheia, refaz o movimento pra não mostrar bordas */
      img.onload = function () { if (ajusta()) kenBurns(kb, true, durKB); };
    }
    return cena;
  }

  function cenaTitulo(c) {
    var cena = el('div', 'galeria-h-cena galeria-h-titulo');
    var txt = el('div', 'galeria-h-texto');
    var palavras = c.texto.split(' ');
    for (var i = 0; i < palavras.length; i++) {
      if (i > 0) txt.appendChild(document.createTextNode(' '));
      var p = el('span', 'galeria-h-palavra');
      p.textContent = palavras[i];
      p.style.animationDelay = (150 + i * 190) + 'ms';
      txt.appendChild(p);
    }
    var orn = el('div', 'galeria-h-orn');
    orn.setAttribute('aria-hidden', 'true');
    orn.textContent = '♡';
    orn.style.animationDelay = (400 + palavras.length * 190) + 'ms';
    cena.appendChild(txt);
    cena.appendChild(orn);
    return cena;
  }

  function mostraCena(k) {
    H.k = k;
    var c = H.cenas[k];
    var velhos = Array.prototype.slice.call(palcoH.children);
    var nova = c.tipo === 'foto' ? cenaFoto(c) : cenaTitulo(c);
    palcoH.appendChild(nova);
    for (var i = 0; i < velhos.length; i++) {
      if (velhos[i].classList.contains('galeria-h-velha')) continue;
      velhos[i].classList.add('galeria-h-velha');
      H.remocoes.push({ el: velhos[i], em: H.tempo + 1500 });
    }
    for (var j = k + 1; j < Math.min(H.cenas.length, k + 4); j++) {
      if (H.cenas[j].tipo === 'foto') precarregaH(H.cenas[j].i);
    }
  }

  function quadroH(ts) {
    H.raf = requestAnimationFrame(quadroH);
    var dt = ts - H.ultimo;
    H.ultimo = ts;
    if (!(dt > 0)) dt = 0;
    if (dt > 100) dt = 100;
    if (H.pausado || H.acabou) return;
    H.tempo += dt;
    while (H.k + 1 < H.cenas.length && H.tempo >= H.inicios[H.k + 1]) mostraCena(H.k + 1);
    for (var i = H.remocoes.length - 1; i >= 0; i--) {
      if (H.tempo >= H.remocoes[i].em) {
        tira(H.remocoes[i].el);
        H.remocoes.splice(i, 1);
      }
    }
    barraH.style.transform = 'scaleX(' + Math.max(0, Math.min(1, H.tempo / H.total)).toFixed(4) + ')';
    if (H.tempo >= H.total) finalizaH();
  }

  function alternaPausa(forcar) {
    if (H.acabou || !H.aberto) return;
    var novo = typeof forcar === 'boolean' ? forcar : !H.pausado;
    if (novo === H.pausado) return;
    H.pausado = novo;
    pausaH.classList.remove('galeria-h-retoma');
    if (novo) {
      pausaH.innerHTML = ICO_PAUSA;
      hRaiz.classList.add('galeria-h-pausado');
    } else {
      hRaiz.classList.remove('galeria-h-pausado');
      pausaH.innerHTML = ICO_PLAY_G;
      void pausaH.offsetWidth;
      pausaH.classList.add('galeria-h-retoma');
    }
  }

  function pula(dir) {
    if (H.acabou || !H.aberto || !H.cenas.length) return;
    var k = H.k + dir;
    if (k < 0) k = 0;
    if (k >= H.cenas.length) { H.tempo = H.total; finalizaH(); return; }
    if (H.pausado) alternaPausa(false);
    H.tempo = H.inicios[k];
    for (var i = 0; i < H.remocoes.length; i++) {
      H.remocoes[i].em = Math.min(H.remocoes[i].em, H.tempo + 1500);
    }
    mostraCena(k);
  }

  function gota() {
    var s = el('span', 'galeria-h-gota');
    s.textContent = emoji();
    s.style.left = (Math.random() * 100).toFixed(1) + '%';
    s.style.fontSize = (14 + Math.random() * 20).toFixed(0) + 'px';
    s.style.setProperty('--vx', (Math.random() * 120 - 60).toFixed(0) + 'px');
    s.style.setProperty('--r', (Math.random() * 300 - 150).toFixed(0) + 'deg');
    var dur = 5000 + Math.random() * 4000;
    s.style.animationDuration = dur.toFixed(0) + 'ms';
    hRaiz.appendChild(s);
    setTimeout(tira.bind(null, s), dur + 100);
  }

  function finalizaH() {
    if (H.acabou) return;
    H.acabou = true;
    cancelAnimationFrame(H.raf);
    H.raf = 0;
    barraH.style.transform = 'scaleX(1)';
    var cs = palcoH.children;
    for (var i = 0; i < cs.length; i++) cs[i].classList.add('galeria-h-velha');
    H.remocoes = [];
    depois(H.timers, function () { palcoH.innerHTML = ''; }, 1500);
    hRaiz.classList.remove('galeria-h-pausado');
    hRaiz.classList.add('galeria-h-final');

    var r = reduz();
    var W = window.innerWidth, Hh = window.innerHeight;
    depois(H.timers, function () { coracoes(hRaiz, W / 2, Hh * 0.42, r ? 10 : 22, 1.8); }, 700);
    var n = r ? 3 : 7;
    for (var j = 0; j < n; j++) {
      depois(H.timers, function () {
        coracoes(hRaiz, W * (0.15 + Math.random() * 0.7), Hh * (0.18 + Math.random() * 0.5), r ? 8 : 14, 1.4);
      }, 1000 + j * 280);
    }
    clearInterval(H.chuva);
    H.chuva = setInterval(gota, r ? 650 : 230);
    depois(H.timers, function () { foca(btnDeNovo); }, 1300);
  }

  function limpaSoltosH() {
    var soltos = hRaiz.querySelectorAll('.galeria-voa,.galeria-h-gota');
    for (var i = 0; i < soltos.length; i++) tira(soltos[i]);
  }

  function reiniciaH() {
    limpaTimers(H.timers);
    clearInterval(H.chuva);
    H.chuva = 0;
    cancelAnimationFrame(H.raf);
    limpaSoltosH();
    palcoH.innerHTML = '';
    H.remocoes = [];
    H.k = -1;
    H.tempo = -700;
    H.acabou = false;
    H.pausado = false;
    hRaiz.classList.remove('galeria-h-final', 'galeria-h-pausado');
    pausaH.classList.remove('galeria-h-retoma');
    pausaH.innerHTML = ICO_PAUSA;
    barraH.style.transform = 'scaleX(0)';
    H.cenas = montaCenas();
    H.inicios = [];
    var t = 0;
    for (var i = 0; i < H.cenas.length; i++) { H.inicios.push(t); t += H.cenas[i].dur; }
    H.total = t;
    for (var j = 0; j < Math.min(3, N); j++) precarregaH(j);
    H.ultimo = agora();
    H.raf = requestAnimationFrame(quadroH);
    foca(hRaiz);
  }

  function mostraDicaH() {
    if (H.dicaMostrada) return;
    H.dicaMostrada = true;
    dicaH.textContent = ehToque()
      ? 'toca na tela pra pausar · desliza pra pular'
      : 'clica pra pausar · ← → pra pular · Esc pra sair';
    depois(H.timers, function () { dicaH.classList.add('galeria-mostra'); }, 800);
    depois(H.timers, function () { dicaH.classList.remove('galeria-mostra'); }, 3500);
  }

  function pausaVideos() {
    var vs = document.querySelectorAll('video');
    for (var i = 0; i < vs.length; i++) {
      try { if (!vs[i].paused) vs[i].pause(); } catch (e) { /* ok */ }
    }
  }

  function abreH() {
    if (H.aberto) return;
    if (V.aberto) terminaFechamentoV();
    H.aberto = true;
    H.fechando = false;
    H.foco = document.activeElement;
    pausaVideos();
    tocaMusica();
    travaScroll();
    hRaiz.classList.add('galeria-on');
    void hRaiz.offsetWidth;
    hRaiz.classList.add('galeria-in');
    document.addEventListener('keydown', teclaH, true);
    document.addEventListener('visibilitychange', visibilidadeH);
    reiniciaH();
    mostraDicaH();
  }

  function fechaH() {
    if (!H.aberto || H.fechando) return;
    H.fechando = true;
    cancelAnimationFrame(H.raf);
    H.raf = 0;
    limpaTimers(H.timers);
    clearInterval(H.chuva);
    H.chuva = 0;
    H.toque = null;
    document.removeEventListener('keydown', teclaH, true);
    document.removeEventListener('visibilitychange', visibilidadeH);
    hRaiz.classList.remove('galeria-in');
    depois(H.timers, function () {
      hRaiz.classList.remove('galeria-on', 'galeria-h-final', 'galeria-h-pausado');
      palcoH.innerHTML = '';
      limpaSoltosH();
      dicaH.classList.remove('galeria-mostra');
      H.remocoes = [];
      H.aberto = false;
      H.fechando = false;
      H.pausado = false;
      H.acabou = false;
      soltaScroll();
      var f = H.foco;
      H.foco = null;
      if (f && f !== document.body && document.contains(f)) foca(f);
    }, 720);
  }

  function visibilidadeH() {
    if (document.hidden && H.aberto && !H.acabou && !H.fechando) alternaPausa(true);
  }

  function teclaH(e) {
    if (!H.aberto || H.fechando) return;
    var k = e.key;
    if (k === 'Escape' || k === 'Esc') { e.preventDefault(); fechaH(); }
    else if (k === 'Tab') prendeTab(e, hRaiz);
    else if (H.acabou) return;
    else if (k === ' ' || k === 'Spacebar' || k === 'k' || k === 'K') { e.preventDefault(); alternaPausa(); }
    else if (k === 'ArrowRight' || k === 'Right') { e.preventDefault(); pula(1); }
    else if (k === 'ArrowLeft' || k === 'Left') { e.preventDefault(); pula(-1); }
  }

  hRaiz.addEventListener('pointerdown', function (e) {
    if (!H.aberto || H.fechando) return;
    if (e.target && e.target.closest && e.target.closest('button')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    H.toque = { id: e.pointerId, x: e.clientX, y: e.clientY, t: agora() };
  });
  hRaiz.addEventListener('pointerup', function (e) {
    var t = H.toque;
    if (!t || t.id !== e.pointerId || H.fechando) return;
    H.toque = null;
    var dx = e.clientX - t.x, dy = e.clientY - t.y;
    var parado = Math.abs(dx) < 12 && Math.abs(dy) < 12;
    if (H.acabou) {
      if (parado) coracoes(hRaiz, e.clientX, e.clientY, reduz() ? 5 : 10, 1);
      return;
    }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { pula(dx < 0 ? 1 : -1); return; }
    if (parado && agora() - t.t < 700) alternaPausa();
  });
  hRaiz.addEventListener('pointercancel', function () { H.toque = null; });
  hRaiz.addEventListener('click', function (e) { e.stopPropagation(); });
  hRaiz.addEventListener('dragstart', function (e) { e.preventDefault(); });
  pausaH.addEventListener('animationend', function () { pausaH.classList.remove('galeria-h-retoma'); });

  btnXH.addEventListener('click', fechaH);
  btnSairH.addEventListener('click', fechaH);
  btnDeNovo.addEventListener('click', function () {
    if (!H.aberto || H.fechando) return;
    tocaMusica();
    reiniciaH();
  });

  /* ---- botão "Ver a nossa história" logo abaixo da galeria ---- */
  var cta = el('div', 'galeria-cta');
  cta.innerHTML =
    '<button type="button" class="galeria-play">' +
      '<span class="galeria-play-ico" aria-hidden="true">' + ICO_PLAY + '</span>' +
      '<span>Ver a nossa história</span>' +
    '</button>' +
    '<span class="galeria-cta-sub">um filminho só nosso, com todos os nossos momentos 🎞️</span>';
  if (galeria.parentNode) galeria.parentNode.insertBefore(cta, galeria.nextSibling);
  var btnPlay = cta.querySelector('.galeria-play');
  btnPlay.addEventListener('click', abreH);
})();
