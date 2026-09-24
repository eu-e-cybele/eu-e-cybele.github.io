/* =====================================================================
   efeitos/rastro.js
   Rastro delicado de coraçõezinhos e brilhos que segue o mouse e o dedo.
   Partículas reaproveitadas (pool) e animadas com Web Animations API,
   só transform/opacity. Não cria globais.
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  if (!doc.body || typeof Element === 'undefined' || !Element.prototype.animate) return;

  var TOTAL = 40;          // tamanho do pool (máximo vivo)
  var TAM = 16;            // tamanho-base em px

  var mq = null;
  try { mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null; } catch (e) { mq = null; }
  var reduzido = !!(mq && mq.matches);
  var intervalo, limite, distMin2;
  function configura() {
    intervalo = reduzido ? 170 : 40;     // ms entre partículas
    limite = reduzido ? 10 : TOTAL;      // quantas podem existir ao mesmo tempo
    distMin2 = reduzido ? 30 * 30 : 7 * 7;
  }
  configura();
  if (mq) {
    var aoMudarPreferencia = function (e) { reduzido = !!e.matches; configura(); };
    if (mq.addEventListener) mq.addEventListener('change', aoMudarPreferencia);
    else if (mq.addListener) mq.addListener(aoMudarPreferencia);
  }

  /* ------------------------------------------------------------------
     Desenhos (SVG embutido, sem arquivos externos)
     ------------------------------------------------------------------ */
  function uri(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }

  var P_CORACAO = 'M12 21C12 21 3 15.5 3 9.2 3 6.3 5.2 4 8 4c1.7 0 3.2.9 4 2.3C12.8 4.9 14.3 4 16 4c2.8 0 5 2.3 5 5.2C21 15.5 12 21 12 21z';
  var P_BRILHO = 'M12 2C12.8 8.4 15.6 11.2 22 12 15.6 12.8 12.8 15.6 12 22 11.2 15.6 8.4 12.8 2 12 8.4 11.2 11.2 8.4 12 2z';

  function coracao(cor) {
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<path d="' + P_CORACAO + '" fill="' + cor + '"/>' +
      '<ellipse cx="7.6" cy="8.4" rx="2.1" ry="1.3" fill="#fff" opacity=".6" transform="rotate(-38 7.6 8.4)"/></svg>');
  }
  function brilho(miolo, borda) {
    return uri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      '<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.3"/></filter></defs>' +
      '<path d="' + P_BRILHO + '" fill="' + borda + '" opacity=".75" filter="url(#b)"/>' +
      '<path d="' + P_BRILHO + '" fill="' + miolo + '" stroke="' + borda + '" stroke-width=".8" stroke-linejoin="round"/></svg>');
  }

  var VARIANTES = [
    coracao('#ff5c8a'),
    coracao('#ff7aa2'),
    coracao('#e8457a'),
    brilho('#fff4c7', '#f5a623'),
    brilho('#ffffff', '#ff7aa2')
  ];

  var css = '.rastro-camada{position:fixed;inset:0;pointer-events:none;z-index:90;overflow:hidden;contain:strict}' +
    '.rastro-p{position:absolute;left:0;top:0;width:' + TAM + 'px;height:' + TAM + 'px;opacity:0;pointer-events:none;' +
    'background:no-repeat center/contain;-webkit-backface-visibility:hidden;backface-visibility:hidden}' +
    VARIANTES.map(function (u, i) { return '.rastro-v' + i + '{background-image:' + u + '}'; }).join('');

  var estilo = doc.createElement('style');
  estilo.setAttribute('data-efeito', 'rastro');
  estilo.textContent = css;
  (doc.head || root).appendChild(estilo);

  /* ------------------------------------------------------------------
     Camada + pool de partículas
     ------------------------------------------------------------------ */
  var camada = doc.createElement('div');
  camada.className = 'rastro-camada';
  camada.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(camada);

  var pool = [];
  for (var i = 0; i < TOTAL; i++) {
    var el = doc.createElement('i');
    el.className = 'rastro-p';
    camada.appendChild(el);
    pool.push({ el: el, livre: true });
  }
  var vivos = 0;
  var cursorPool = 0;

  function pegaLivre() {
    if (vivos >= limite) return null;
    for (var n = 0; n < TOTAL; n++) {
      var k = (cursorPool + n) % TOTAL;
      if (pool[k].livre) {
        cursorPool = (k + 1) % TOTAL;
        return pool[k];
      }
    }
    return null;
  }

  function tf(x, y, s, r) {
    return 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + r.toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
  }

  function solta(x, y, mx, my) {
    var p = pegaLivre();
    if (!p) return;
    var ehCoracao = Math.random() < 0.55;
    var v = ehCoracao ? (Math.random() * 3) | 0 : 3 + ((Math.random() * 2) | 0);
    p.el.className = 'rastro-p rastro-v' + v;

    var esc = ehCoracao ? 0.55 + Math.random() * 0.35 : 0.5 + Math.random() * 0.45;
    // deriva: sobe, espalha um pouquinho e segue levemente o movimento
    var dx = (Math.random() - 0.5) * 30 + mx * 0.35;
    var dy = -(18 + Math.random() * 36) + my * 0.2;
    var r0 = (Math.random() - 0.5) * 40;
    var r1 = r0 + (Math.random() - 0.5) * (ehCoracao ? 50 : 160);
    var dur = 800 + Math.random() * 250;
    if (reduzido) {
      dx *= 0.35;
      dy *= 0.4;
      r1 = r0;
      dur = 900;
    }
    var x0 = x - TAM / 2;
    var y0 = y - TAM / 2;

    var anim;
    try {
      anim = p.el.animate([
        { transform: tf(x0, y0, esc * 0.3, r0), opacity: 0 },
        { transform: tf(x0 + dx * 0.12, y0 + dy * 0.12, esc, r0 + (r1 - r0) * 0.15), opacity: 1, offset: 0.14 },
        { transform: tf(x0 + dx, y0 + dy, esc * 0.2, r1), opacity: 0 }
      ], { duration: dur, easing: 'cubic-bezier(.25,.7,.35,1)', fill: 'none' });
    } catch (e) {
      return;
    }
    p.livre = false;
    vivos++;
    var liberou = false;
    var libera = function () {
      if (liberou) return;
      liberou = true;
      p.livre = true;
      vivos = Math.max(0, vivos - 1);
    };
    anim.onfinish = libera;
    anim.oncancel = libera;
  }

  /* ------------------------------------------------------------------
     Entrada: mouse/caneta (pointermove) e dedo (touchmove, passivo)
     ------------------------------------------------------------------ */
  var ultT = 0;
  var ultX = null;
  var ultY = null;

  function mover(x, y) {
    if (root.classList.contains('intro-ativa')) return; // a abertura cobre a tela
    var agora = (window.performance && performance.now) ? performance.now() : Date.now();
    if (agora - ultT < intervalo) return;
    var mx = 0, my = 0;
    if (ultX !== null) {
      mx = x - ultX;
      my = y - ultY;
      if (mx * mx + my * my < distMin2) return;
    }
    ultT = agora;
    ultX = x;
    ultY = y;
    mx = Math.max(-40, Math.min(40, mx));
    my = Math.max(-40, Math.min(40, my));
    solta(x, y, mx, my);
  }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return; // o toque é tratado pelo touchmove
    mover(e.clientX, e.clientY);
  }, { passive: true });

  function aoToque(e) {
    var t = e.touches && e.touches[0];
    if (t) mover(t.clientX, t.clientY);
  }
  window.addEventListener('touchstart', function (e) {
    ultX = null; // novo toque: não liga com o último ponto
    aoToque(e);
  }, { passive: true });
  window.addEventListener('touchmove', aoToque, { passive: true });
})();
