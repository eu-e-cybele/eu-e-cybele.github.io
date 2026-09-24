/* Fotos escondidas: cada polaroid começa coberta e só aparece quando ela toca.
   Depois de revelada, o próximo toque abre o visualizador (galeria.js). */
(function () {
  'use strict';

  var galeria = document.getElementById('galeria');
  if (!galeria) return;

  var reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var css = [
    '#galeria .polaroid{position:relative}',
    '.rev-capa{position:absolute;top:10px;left:10px;right:10px;bottom:38px;border-radius:3px;z-index:2;',
    '  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;overflow:hidden;',
    '  background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.55),transparent 45%),',
    '  linear-gradient(135deg,#ff9ab6 0%,#ff5c8a 55%,#e8457a 100%);color:#fff;',
    '  box-shadow:inset 0 0 0 2px rgba(255,255,255,.35);',
    '  transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .6s ease;transform-origin:center}',
    '.rev-capa::before{content:"";position:absolute;inset:0;opacity:.18;',
    '  background-image:radial-gradient(circle,#fff 1.5px,transparent 2px);background-size:16px 16px}',
    '.rev-capa::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;',
    '  background:linear-gradient(100deg,transparent,rgba(255,255,255,.45),transparent);',
    '  animation:rev-brilho 3.2s ease-in-out infinite;animation-delay:var(--rev-atraso,0s)}',
    '@keyframes rev-brilho{0%,60%{left:-60%}100%{left:130%}}',
    '.rev-cor{font-size:clamp(1.8rem,7vw,2.4rem);position:relative;animation:rev-bate 1.6s ease-in-out infinite;',
    '  animation-delay:var(--rev-atraso,0s);filter:drop-shadow(0 3px 6px rgba(139,30,63,.35))}',
    '@keyframes rev-bate{0%,100%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.08)}}',
    '.rev-txt{position:relative;font-size:.78rem;font-weight:600;letter-spacing:.5px;opacity:.95}',
    '#galeria .polaroid.rev-fechada:hover .rev-cor{transform:scale(1.2)}',
    '.polaroid.rev-abrindo .rev-capa{transform:rotateY(90deg) scale(.6);opacity:0}',
    '.polaroid.rev-aberta .rev-capa{display:none}',
    '.polaroid.rev-abrindo .foto img{animation:rev-surge .9s ease both}',
    '@keyframes rev-surge{from{filter:blur(8px) brightness(1.4);transform:scale(1.15)}to{filter:none;transform:none}}',
    '.rev-topo{display:flex;flex-direction:column;align-items:center;gap:10px;margin:-8px 0 26px}',
    '.rev-dica{font-size:1rem;max-width:520px}',
    '.rev-linha{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center}',
    '.rev-conta{font-size:.9rem;background:#fff;padding:6px 14px;border-radius:999px;',
    '  box-shadow:0 4px 12px rgba(255,92,138,.15);font-variant-numeric:tabular-nums}',
    '.rev-conta b{color:var(--rosa,#ff5c8a)}',
    '.rev-todas{border:2px solid var(--rosa-claro,#ffd1dc);background:#fff;color:var(--texto,#5a2a3a);',
    '  font:600 .9rem Quicksand,sans-serif;padding:7px 16px;border-radius:999px;cursor:pointer;transition:transform .2s}',
    '.rev-todas:hover{transform:scale(1.05)}',
    '.rev-todas[hidden]{display:none}',
    '@media (prefers-reduced-motion:reduce){.rev-capa::after,.rev-cor{animation:none}',
    '  .polaroid.rev-abrindo .foto img{animation-duration:.3s}}'
  ].join('\n');
  var estilo = document.createElement('style');
  estilo.textContent = css;
  document.head.appendChild(estilo);

  var TEXTOS = ['toca pra ver', 'surpresa!', 'abre aqui', 'toca em mim', 'um momento nosso'];

  var polas = Array.prototype.slice.call(galeria.querySelectorAll('.polaroid'));
  var total = polas.length;
  if (!total) return;
  var abertas = 0;

  /* cabeçalho: dica + contador + "revelar todas" */
  var topo = document.createElement('div');
  topo.className = 'rev-topo';
  topo.innerHTML =
    '<p class="rev-dica">Cada foto é uma surpresa… toca nelas pra revelar os nossos momentos 💕</p>' +
    '<div class="rev-linha"><span class="rev-conta" aria-live="polite"></span>' +
    '<button type="button" class="rev-todas">revelar todas ✨</button></div>';
  galeria.parentNode.insertBefore(topo, galeria);
  var conta = topo.querySelector('.rev-conta');
  var btnTodas = topo.querySelector('.rev-todas');

  function atualizaConta() {
    conta.innerHTML = abertas >= total
      ? '<b>' + total + '</b> momentos revelados 💖'
      : '<b>' + abertas + '</b> de ' + total + ' reveladas';
    btnTodas.hidden = abertas >= total;
  }

  polas.forEach(function (p, i) {
    var capa = document.createElement('div');
    capa.className = 'rev-capa';
    capa.setAttribute('aria-hidden', 'true');
    capa.style.setProperty('--rev-atraso', ((i * 0.37) % 3).toFixed(2) + 's');
    capa.innerHTML = '<span class="rev-cor">💝</span><span class="rev-txt">' + TEXTOS[i % TEXTOS.length] + '</span>';
    p.appendChild(capa);
    p.classList.add('rev-fechada');
    p.setAttribute('aria-label', 'Revelar foto ' + (i + 1));
  });
  atualizaConta();

  function revela(p, comFesta) {
    if (!p || !p.classList.contains('rev-fechada')) return;
    p.classList.remove('rev-fechada');
    p.classList.add('rev-abrindo');
    abertas++;
    var i = polas.indexOf(p);
    var leg = (typeof FOTOS !== 'undefined' && FOTOS[i]) ? FOTOS[i].legenda : '';
    p.setAttribute('aria-label', 'Abrir foto ' + (i + 1) + (leg ? ' — ' + leg : ''));
    setTimeout(function () {
      p.classList.remove('rev-abrindo');
      p.classList.add('rev-aberta');
    }, reduzido ? 350 : 900);
    if (comFesta && typeof window.explode === 'function') {
      var r = p.getBoundingClientRect();
      window.explode(r.left + r.width / 2, r.top + r.height / 2 - 14, 10);
    }
    atualizaConta();
    if (abertas === total && comFesta) festaFinal();
  }

  function festaFinal() {
    if (typeof window.explode !== 'function') return;
    for (var k = 0; k < 8; k++) {
      setTimeout(function () {
        window.explode(Math.random() * innerWidth, Math.random() * innerHeight * 0.8 + 40, 12);
      }, k * 150);
    }
  }

  function polaFechada(alvo) {
    var p = alvo && alvo.closest ? alvo.closest('.polaroid') : null;
    return p && galeria.contains(p) && p.classList.contains('rev-fechada') ? p : null;
  }

  /* captura no document: roda antes do listener de captura do #galeria (galeria.js),
     então a foto fechada só revela; já aberta, segue para o visualizador */
  document.addEventListener('click', function (e) {
    var p = polaFechada(e.target);
    if (!p) return;
    e.stopPropagation();
    e.preventDefault();
    revela(p, true);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var p = polaFechada(e.target);
    if (!p) return;
    e.stopPropagation();
    e.preventDefault();
    revela(p, true);
  }, true);

  /* navegando no visualizador, a foto vista também fica revelada na galeria */
  document.addEventListener('galeria:foto', function (e) {
    var i = e.detail && e.detail.i;
    if (typeof i === 'number') revela(polas[i], false);
  });

  btnTodas.addEventListener('click', function (e) {
    e.stopPropagation();
    var fechadas = polas.filter(function (p) { return p.classList.contains('rev-fechada'); });
    fechadas.forEach(function (p, k) {
      setTimeout(function () { revela(p, false); if (abertas === total) festaFinal(); }, k * (reduzido ? 20 : 70));
    });
  });
})();
