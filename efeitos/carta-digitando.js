/*
 * efeitos/carta-digitando.js
 *
 * Na PRIMEIRA vez que o envelope abre, a cartinha se escreve sozinha,
 * letrinha por letrinha (efeito máquina de escrever, com cursor piscando),
 * mantendo a estrutura original do HTML (<p>, .assina, <strong>, <br>…).
 *  - Tocar/clicar na carta enquanto ela está sendo escrita mostra tudo na hora.
 *  - Nas próximas aberturas, o texto aparece inteiro.
 *  - Se o envelope for fechado no meio, para tudo e mostra completo depois.
 *  - Ao terminar, corações estouram perto da assinatura (explode()).
 *  - Antes da primeira abertura, o envelope dá umas balançadinhas e mostra
 *    um seloinho flutuante "💌 abre".
 *
 * Não cria nenhuma variável global.
 */
(function () {
  'use strict';

  var envelope = document.getElementById('envelope');
  var carta = document.getElementById('textoCarta');
  if (!envelope || !carta) return;

  /* ------------------------------------------------------------------ */
  /* Estilos (todas as classes com prefixo "cartadig-")                  */
  /* ------------------------------------------------------------------ */
  var CSS = [
    /* balançadinha do envelope até a primeira abertura */
    '#envelope.cartadig-espera{animation:cartadig-balanca 4.6s ease-in-out 1.4s infinite;transform-origin:50% 90%}',
    '@keyframes cartadig-balanca{0%,64%,100%{transform:none}67%{transform:translateY(-4px) rotate(-3.5deg)}71%{transform:translateY(-4px) rotate(3deg)}75%{transform:translateY(-2px) rotate(-2deg)}79%{transform:translateY(-1px) rotate(1.2deg)}83%{transform:none}}',
    '@keyframes cartadig-balanca-leve{0%,70%,100%{transform:none}78%{transform:translateY(-2px) rotate(-.8deg)}86%{transform:translateY(-1px) rotate(.5deg)}}',
    '#envelope:focus{outline:none}',
    '#envelope:focus-visible{outline:3px dashed var(--rosa,#ff5c8a);outline-offset:8px;border-radius:12px}',

    /* seloinho "💌 abre" */
    '.cartadig-convite{position:absolute;top:-16px;right:-8px;z-index:6;display:inline-block;padding:7px 13px 7px 11px;border-radius:999px;background:#fff;color:var(--vinho,#8b1e3f);border:2px solid var(--rosa-claro,#ffd1dc);box-shadow:0 8px 20px rgba(255,92,138,.35);font:600 .85rem/1 "Quicksand",sans-serif;letter-spacing:.02em;white-space:nowrap;pointer-events:none;-webkit-user-select:none;user-select:none;animation:cartadig-flutua 2.6s ease-in-out infinite;transition:opacity .35s ease,transform .35s ease}',
    '.cartadig-convite::after{content:"";position:absolute;left:-2px;top:-2px;right:-2px;bottom:-2px;border-radius:999px;border:2px solid var(--rosa,#ff5c8a);opacity:0;animation:cartadig-onda 2.6s ease-out infinite}',
    '@keyframes cartadig-flutua{0%,100%{transform:translateY(0) rotate(6deg)}50%{transform:translateY(-7px) rotate(2deg)}}',
    '@keyframes cartadig-onda{0%{opacity:.55;transform:scale(1)}70%,100%{opacity:0;transform:scale(1.35)}}',
    '.cartadig-convite.cartadig-sai{animation:none;opacity:0;transform:translateY(-10px) scale(.5) rotate(18deg)}',
    '.cartadig-convite.cartadig-sai::after{animation:none;opacity:0}',

    /* carta com a largura cheia desde o começo: a seção é flex centralizada,
       então sem isso a carta "encolhe" pro tamanho do texto já digitado e
       fica alargando letra por letra na primeira linha. (Com o texto inteiro
       ela já ocupa 100% até o max-width de 560px — o layout final não muda.) */
    '#textoCarta.carta{width:100%}',
    /* carta: altura extra só se o texto for maior que o limite original */
    '#textoCarta.mostrar.cartadig-alta{max-height:var(--cartadig-max,2600px)}',
    '#textoCarta.cartadig-ativa{cursor:pointer}',
    '.cartadig-oculto{display:none!important}',
    '.cartadig-surge{animation:cartadig-surge .5s ease both}',
    '@keyframes cartadig-surge{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',

    /* cursor de digitação */
    '.cartadig-cursor{display:inline-block;width:2px;height:1.05em;margin-left:2px;vertical-align:-.16em;border-radius:2px;background:var(--rosa,#ff5c8a);box-shadow:0 0 6px rgba(255,92,138,.55)}',
    '.cartadig-cursor.cartadig-pausa{animation:cartadig-pisca 1s steps(1,end) infinite}',
    '@keyframes cartadig-pisca{50%{opacity:0}}',

    /* brilho na assinatura quando termina */
    '.cartadig-assinada{animation:cartadig-brilha 1.9s ease both;transform-origin:100% 50%}',
    '@keyframes cartadig-brilha{0%{text-shadow:0 0 0 rgba(255,92,138,0);transform:none}35%{text-shadow:0 0 18px rgba(255,92,138,.7);transform:scale(1.07)}100%{text-shadow:0 0 0 rgba(255,92,138,0);transform:none}}',

    '@media (prefers-reduced-motion:reduce){',
    '#envelope.cartadig-espera{animation-name:cartadig-balanca-leve;animation-duration:6s}',
    '.cartadig-convite{animation-duration:4.5s}',
    '.cartadig-convite::after{animation:none}',
    '.cartadig-surge{animation-duration:.25s}',
    '.cartadig-assinada{animation-duration:1.2s}',
    '}'
  ].join('\n');

  var estilo = document.createElement('style');
  estilo.setAttribute('data-efeito', 'carta-digitando');
  estilo.textContent = CSS;
  (document.head || document.documentElement).appendChild(estilo);

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */
  function reduzMovimento() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  function alturaTela() {
    return window.innerHeight || document.documentElement.clientHeight || 700;
  }

  // Divide o texto em "letras de verdade" (grafemas), pra não quebrar emojis
  // nem letras acentuadas no meio.
  var segmentador = null;
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      segmentador = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' });
    }
  } catch (e) {
    segmentador = null;
  }

  function grafemas(texto) {
    if (segmentador) {
      try {
        return Array.from(segmentador.segment(texto), function (s) { return s.segment; });
      } catch (e) { /* usa o plano B abaixo */ }
    }
    var pontos = Array.from(texto);
    var saida = [];
    for (var i = 0; i < pontos.length; i++) {
      var c = pontos[i];
      var anterior = saida.length ? saida[saida.length - 1] : '';
      var junta = saida.length > 0 && (
        /^[\u0300-\u036f\u200d\ufe0e\ufe0f\u20e3]$/.test(c) ||
        /^\ud83c[\udffb-\udfff]$/.test(c) ||
        anterior.charAt(anterior.length - 1) === '\u200d'
      );
      if (junta) saida[saida.length - 1] += c;
      else saida.push(c);
    }
    return saida;
  }

  var reEmoji;
  try {
    reEmoji = new RegExp('\\p{Extended_Pictographic}', 'u');
  } catch (e) {
    reEmoji = /[\ud83c-\ud83e][\udc00-\udfff]|[\u2600-\u27bf]/;
  }

  /* ------------------------------------------------------------------ */
  /* Estado                                                              */
  /* ------------------------------------------------------------------ */
  var NOVO = 0, DIGITANDO = 1, PRONTO = 2;
  var aberta = carta.classList.contains('mostrar');
  var estado = aberta ? PRONTO : NOVO;

  var blocos = [];            // [{el, textos:[{no, completo, partes}], revelado, assinatura}]
  var iBloco = 0, iTexto = 0, iParte = 0, contaPassos = 0;
  var timer = 0, timerInicio = 0, timerLimpa = 0, timerFesta = 0, timerFesta2 = 0, timerMede = 0;
  var timerCompleta = 0;      // fechou no meio: completa o texto só depois de recolher
  var usuarioRolou = false, ultimoSegue = 0;
  var convite = null;

  var cursor = document.createElement('span');
  cursor.className = 'cartadig-cursor cartadig-pausa';
  cursor.setAttribute('aria-hidden', 'true');

  /* ------------------------------------------------------------------ */
  /* Acessibilidade do envelope (teclado)                                */
  /* ------------------------------------------------------------------ */
  if (!envelope.hasAttribute('tabindex')) envelope.setAttribute('tabindex', '0');
  if (!envelope.hasAttribute('role')) envelope.setAttribute('role', 'button');
  envelope.setAttribute('aria-controls', 'textoCarta');

  function atualizaAria() {
    envelope.setAttribute('aria-expanded', aberta ? 'true' : 'false');
    envelope.setAttribute('aria-label', aberta ? 'Fechar a cartinha' : 'Abrir a cartinha');
  }
  atualizaAria();

  envelope.addEventListener('keydown', function (e) {
    if (e.target !== envelope) return;
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    e.preventDefault();
    if (e.repeat) return; // segurar a tecla não fica abrindo/fechando sem parar
    var r = envelope.getBoundingClientRect();
    var clique;
    try {
      clique = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: r.left + r.width / 2,
        clientY: r.top + r.height / 2
      });
    } catch (err) {
      envelope.click();
      return;
    }
    envelope.dispatchEvent(clique);
  });

  /* ------------------------------------------------------------------ */
  /* Convite: balançadinha + seloinho "💌 abre"                          */
  /* ------------------------------------------------------------------ */
  if (estado === NOVO) {
    envelope.classList.add('cartadig-espera');
    convite = document.createElement('span');
    convite.className = 'cartadig-convite';
    convite.setAttribute('aria-hidden', 'true');
    convite.textContent = '💌 abre';
    envelope.appendChild(convite);
  }

  function tiraConvite() {
    envelope.classList.remove('cartadig-espera');
    if (!convite) return;
    var c = convite;
    convite = null;
    c.classList.add('cartadig-sai');
    setTimeout(function () {
      if (c.parentNode) c.parentNode.removeChild(c);
    }, 450);
  }

  /* ------------------------------------------------------------------ */
  /* Altura da carta: garante que o texto inteiro caiba                  */
  /* ------------------------------------------------------------------ */
  function mede() {
    if (estado === DIGITANDO) return;
    var alvo = carta.scrollHeight;
    if (alvo > 1120) {
      carta.style.setProperty('--cartadig-max', Math.ceil(alvo + 240) + 'px');
      carta.classList.add('cartadig-alta');
    } else {
      carta.classList.remove('cartadig-alta');
    }
  }
  mede();
  window.addEventListener('resize', function () {
    clearTimeout(timerMede);
    timerMede = setTimeout(mede, 250);
  });
  try {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(mede, function () {});
    }
  } catch (e) { /* sem problema */ }

  /* ------------------------------------------------------------------ */
  /* Preparação: guarda o texto original e esvazia                        */
  /* ------------------------------------------------------------------ */
  function registro(no) {
    var completo = no.nodeValue;
    return {
      no: no,
      completo: completo,
      partes: grafemas(completo.replace(/\s+/g, ' '))
    };
  }

  function coletaTextos(el) {
    var lista = [];
    var andador = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    var n = andador.nextNode();
    while (n) {
      if (/\S/.test(n.nodeValue)) lista.push(registro(n));
      n = andador.nextNode();
    }
    return lista;
  }

  function preparar() {
    blocos = [];
    var filhos = Array.prototype.slice.call(carta.childNodes);
    for (var i = 0; i < filhos.length; i++) {
      var no = filhos[i];
      if (no.nodeType === 1) {
        blocos.push({
          el: no,
          textos: coletaTextos(no),
          revelado: false,
          assinatura: !!(no.classList && no.classList.contains('assina'))
        });
      } else if (no.nodeType === 3 && /\S/.test(no.nodeValue)) {
        blocos.push({ el: null, textos: [registro(no)], revelado: false, assinatura: false });
      }
    }
    for (var b = 0; b < blocos.length; b++) {
      var bloco = blocos[b];
      for (var t = 0; t < bloco.textos.length; t++) bloco.textos[t].no.nodeValue = '';
      if (bloco.el) bloco.el.classList.add('cartadig-oculto');
    }
    iBloco = 0;
    iTexto = 0;
    iParte = 0;
    contaPassos = 0;
  }

  function revela(bloco) {
    if (bloco.revelado) return;
    bloco.revelado = true;
    if (bloco.el) {
      bloco.el.classList.remove('cartadig-oculto');
      bloco.el.classList.add('cartadig-surge');
    }
  }

  function poeCursorDepois(no) {
    if (no && no.parentNode) no.parentNode.insertBefore(cursor, no.nextSibling);
  }

  function tiraCursor() {
    if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
  }

  /* ------------------------------------------------------------------ */
  /* Ritmo da digitação                                                  */
  /* ------------------------------------------------------------------ */
  function ritmo(g, ehAssinatura) {
    var rapido = reduzMovimento();
    var base = ehAssinatura ? 55 : 19;
    if (rapido) base = Math.round(base * 0.5);
    var t = base + Math.random() * (rapido ? 6 : 12);
    if (/[.!?…]/.test(g)) t += rapido ? 120 : 240;
    else if (/[,;:]/.test(g)) t += rapido ? 60 : 110;
    else if (reEmoji.test(g)) t += rapido ? 60 : 180;
    return t;
  }

  function pausaBloco(proximo) {
    var r = reduzMovimento() ? 0.5 : 1;
    if (!proximo) return 380 * r;
    return (proximo.assinatura ? 850 : 480) * r;
  }

  /* ------------------------------------------------------------------ */
  /* Acompanhar a escrita com a rolagem (só se ela não mexeu na tela)    */
  /* ------------------------------------------------------------------ */
  function marcaRolagem() { usuarioRolou = true; }
  function teclaRolagem(e) {
    var k = e.key;
    if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp' ||
        k === 'Home' || k === 'End' || (k === ' ' && e.target === document.body)) {
      usuarioRolou = true;
    }
  }
  function ligaSeguir() {
    usuarioRolou = false;
    window.addEventListener('wheel', marcaRolagem, { passive: true });
    window.addEventListener('touchmove', marcaRolagem, { passive: true });
    window.addEventListener('keydown', teclaRolagem);
  }
  function desligaSeguir() {
    window.removeEventListener('wheel', marcaRolagem, { passive: true });
    window.removeEventListener('touchmove', marcaRolagem, { passive: true });
    window.removeEventListener('keydown', teclaRolagem);
  }

  function rola(dy) {
    if (Math.abs(dy) < 4) return;
    ultimoSegue = Date.now();
    try {
      window.scrollBy({ top: dy, left: 0, behavior: reduzMovimento() ? 'auto' : 'smooth' });
    } catch (e) {
      window.scrollBy(0, dy);
    }
  }

  function enquadra() {
    if (usuarioRolou) return;
    var r = carta.getBoundingClientRect();
    var h = alturaTela();
    if (r.top > h * 0.72) rola(r.top - h * 0.3);
  }

  function segue() {
    if (usuarioRolou || !cursor.parentNode) return;
    if (Date.now() - ultimoSegue < 900) return;
    var r = cursor.getBoundingClientRect();
    var h = alturaTela();
    if (r.bottom > h - 64 && r.top < h + 90) rola(r.bottom - h * 0.62);
  }

  /* ------------------------------------------------------------------ */
  /* O "passo" da máquina de escrever                                    */
  /* ------------------------------------------------------------------ */
  function agenda(ms) {
    timer = setTimeout(passo, ms);
  }

  function passo() {
    timer = 0;
    if (estado !== DIGITANDO) return;

    var bloco = blocos[iBloco];
    if (!bloco) {
      terminar(true);
      return;
    }

    if (!bloco.revelado) {
      revela(bloco);
      if (!bloco.textos.length) {
        iBloco++;
        agenda(pausaBloco(blocos[iBloco]));
        return;
      }
      poeCursorDepois(bloco.textos[0].no);
    }
    if (!bloco.textos.length) {
      iBloco++;
      agenda(pausaBloco(blocos[iBloco]));
      return;
    }

    var t = bloco.textos[iTexto];
    var pedaco = '';
    var ultimo = '';
    // espaços vão junto com a próxima letra (não gastam uma "batida")
    while (iParte < t.partes.length) {
      var g = t.partes[iParte++];
      pedaco += g;
      ultimo = g;
      if (/\S/.test(g)) break;
    }
    if (pedaco) t.no.nodeValue += pedaco;

    var espera = ritmo(ultimo, bloco.assinatura);

    if (iParte >= t.partes.length) {
      iParte = 0;
      iTexto++;
      if (iTexto >= bloco.textos.length) {
        iTexto = 0;
        iBloco++;
        espera += pausaBloco(blocos[iBloco]);
      } else {
        poeCursorDepois(bloco.textos[iTexto].no);
      }
    }

    var pausando = espera > 220;
    cursor.classList.toggle('cartadig-pausa', pausando);
    contaPassos++;
    if (pausando || contaPassos % 4 === 0) segue();
    agenda(espera);
  }

  function comecar() {
    timerInicio = 0;
    if (estado !== DIGITANDO) return;
    enquadra();
    passo();
  }

  function limpaSurge() {
    timerLimpa = 0;
    for (var i = 0; i < blocos.length; i++) {
      var el = blocos[i].el;
      if (!el) continue;
      el.classList.remove('cartadig-surge');
      // devolve o HTML do jeitinho que era (sem class="" sobrando)
      if (el.getAttribute('class') === '') el.removeAttribute('class');
    }
  }

  function retanguloTexto(el) {
    try {
      var rg = document.createRange();
      rg.selectNodeContents(el);
      var r = rg.getBoundingClientRect();
      if (r && (r.width || r.height)) return r;
    } catch (e) { /* usa o retângulo do elemento */ }
    return el.getBoundingClientRect();
  }

  function festa() {
    timerFesta = 0;
    if (!aberta) return;
    var alvo = carta.querySelector('.assina');
    if (!alvo) {
      for (var i = blocos.length - 1; i >= 0 && !alvo; i--) alvo = blocos[i].el;
    }
    if (!alvo) return;

    alvo.classList.remove('cartadig-surge', 'cartadig-assinada');
    void alvo.offsetWidth;
    alvo.classList.add('cartadig-assinada');
    setTimeout(function () { alvo.classList.remove('cartadig-assinada'); }, 2100);

    var r = retanguloTexto(alvo);
    var h = alturaTela();
    if (typeof window.explode !== 'function' || r.bottom < 0 || r.top > h) return;
    var x = r.left + r.width / 2;
    var y = r.top + r.height / 2;
    window.explode(x, y, reduzMovimento() ? 6 : 12);
    timerFesta2 = setTimeout(function () {
      timerFesta2 = 0;
      if (aberta) window.explode(x + 24, y - 12, reduzMovimento() ? 3 : 7);
    }, 300);
  }

  function terminar(comFesta) {
    if (estado !== DIGITANDO) return;
    estado = PRONTO;
    clearTimeout(timer);
    clearTimeout(timerInicio);
    clearTimeout(timerCompleta);
    timer = 0;
    timerInicio = 0;
    timerCompleta = 0;

    for (var b = 0; b < blocos.length; b++) {
      var bloco = blocos[b];
      revela(bloco);
      for (var t = 0; t < bloco.textos.length; t++) {
        bloco.textos[t].no.nodeValue = bloco.textos[t].completo;
      }
    }
    tiraCursor();
    carta.classList.remove('cartadig-ativa');
    carta.removeAttribute('aria-busy');
    carta.removeAttribute('title');
    desligaSeguir();

    clearTimeout(timerLimpa);
    timerLimpa = setTimeout(limpaSurge, 800);
    mede();

    if (comFesta && aberta) {
      clearTimeout(timerFesta);
      timerFesta = setTimeout(festa, 260);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Abrir / fechar                                                      */
  /* ------------------------------------------------------------------ */
  function aoAbrir() {
    // reabriu antes de a carta terminar de recolher: mostra tudo de uma vez
    // (roda num microtask, antes da pintura — não pisca o texto pela metade)
    if (estado === DIGITANDO && timerCompleta) {
      terminar(false);
      return;
    }
    if (estado !== NOVO) return;
    estado = DIGITANDO;
    tiraConvite();
    preparar();

    carta.classList.add('cartadig-ativa');
    carta.setAttribute('aria-busy', 'true');
    carta.setAttribute('title', 'toca na carta pra ler tudo de uma vez');

    // o primeiro parágrafo já aparece com o cursor piscando, "pensando"
    var primeiro = blocos[0];
    if (primeiro) {
      revela(primeiro);
      if (primeiro.textos.length) poeCursorDepois(primeiro.textos[0].no);
    }
    cursor.classList.add('cartadig-pausa');

    ligaSeguir();
    timerInicio = setTimeout(comecar, reduzMovimento() ? 250 : 700);
  }

  function aoFechar() {
    clearTimeout(timerFesta);
    clearTimeout(timerFesta2);
    timerFesta = 0;
    timerFesta2 = 0;
    if (estado !== DIGITANDO) return;
    // Para de digitar na hora, mas só devolve o texto inteiro depois que a
    // carta terminar de recolher (a transição do CSS dura .9s). Se completasse
    // agora, a carta "pularia" pro tamanho cheio enquanto fecha, empurrando
    // a página pra baixo.
    clearTimeout(timer);
    clearTimeout(timerInicio);
    timer = 0;
    timerInicio = 0;
    cursor.classList.add('cartadig-pausa');
    desligaSeguir();
    clearTimeout(timerCompleta);
    timerCompleta = setTimeout(function () {
      timerCompleta = 0;
      terminar(false);
    }, 950);
  }

  // Observa a classe "mostrar" (quem alterna é o script principal),
  // assim não dependemos da ordem dos cliques.
  var observador = new MutationObserver(function () {
    var agora = carta.classList.contains('mostrar');
    if (agora === aberta) return;
    aberta = agora;
    atualizaAria();
    if (agora) aoAbrir();
    else aoFechar();
  });
  observador.observe(carta, { attributes: true, attributeFilter: ['class'] });

  // tocar na carta enquanto escreve = mostra tudo na hora
  carta.addEventListener('click', function () {
    if (estado === DIGITANDO) terminar(true);
  });
})();
