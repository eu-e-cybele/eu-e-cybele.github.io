/* =====================================================================
   efeitos/musica.js
   Caixinha de música original, sintetizada na hora com a Web Audio API
   (nenhum arquivo de áudio). Cria o botão redondo .musica (canto inferior
   direito) e expõe UMA global:
     window.musica = { play(), pause(), toggle(), get tocando() }
   ===================================================================== */
(function () {
  'use strict';

  var doc = document;
  if (!doc.body) return;

  var AC = window.AudioContext || window.webkitAudioContext || null;

  var reduzMov = false;
  try {
    reduzMov = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* sem matchMedia */ }

  /* ------------------------------------------------------------------
     Estilos (tudo prefixado com "musica-")
     ------------------------------------------------------------------ */
  var CSS = [
    '.musica.musica-btn{display:flex;align-items:center;justify-content:center;padding:0;line-height:1;',
    'right:calc(16px + env(safe-area-inset-right, 0px));bottom:calc(16px + env(safe-area-inset-bottom, 0px));',
    '-webkit-tap-highlight-color:transparent;touch-action:manipulation;-webkit-user-select:none;user-select:none;',
    'transition:transform .3s cubic-bezier(.3,1.6,.5,1),box-shadow .35s ease}',
    '.musica.musica-btn[hidden]{display:none}',
    '@media (hover:hover){.musica.musica-btn:hover{transform:scale(1.07)}}',
    '.musica.musica-btn:active{transform:scale(.93)}',
    '.musica.musica-btn:focus{outline:none}',
    '.musica.musica-btn:focus-visible{outline:3px solid rgba(255,92,138,.5);outline-offset:3px}',
    '.musica-icone{display:inline-block;pointer-events:none}',
    '.musica-btn::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,92,138,.55);opacity:0;pointer-events:none}',
    '.musica-btn.musica-tocando{box-shadow:0 6px 22px rgba(255,92,138,.45)}',
    '.musica-btn.musica-tocando::after{animation:musica-onda 2.5s ease-out infinite}',
    '.musica-btn.musica-tocando .musica-icone{animation:musica-bate 2.5s ease-in-out infinite}',
    '@keyframes musica-onda{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.65);opacity:0}}',
    '@keyframes musica-bate{0%,100%{transform:scale(1) rotate(0)}25%{transform:scale(1.12) rotate(-6deg)}50%{transform:scale(1) rotate(0)}75%{transform:scale(1.07) rotate(5deg)}}',
    '.musica-notinha{position:fixed;z-index:80;pointer-events:none;font-size:16px;line-height:1;color:#ff5c8a;',
    'text-shadow:0 1px 6px rgba(255,255,255,.95);animation:musica-flutua 2.8s ease-out forwards}',
    '@keyframes musica-flutua{0%{transform:translate(-50%,0) scale(.5);opacity:0}18%{opacity:.95}',
    '100%{transform:translate(calc(-50% + var(--musica-dx,-10px)),-78px) rotate(var(--musica-rot,0deg)) scale(1.05);opacity:0}}',
    '@media (prefers-reduced-motion:reduce){',
    '.musica-btn.musica-tocando::after{animation-duration:4.5s}',
    '.musica-btn.musica-tocando .musica-icone{animation:none}}'
  ].join('');

  var estilo = doc.createElement('style');
  estilo.setAttribute('data-efeito', 'musica');
  estilo.textContent = CSS;
  (doc.head || doc.documentElement).appendChild(estilo);

  /* ------------------------------------------------------------------
     Botão (reaproveita um button.musica se o HTML já tiver um)
     ------------------------------------------------------------------ */
  var btn = doc.querySelector('button.musica');
  if (!btn) {
    btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'musica';
    doc.body.appendChild(btn);
  }
  btn.classList.add('musica-btn');
  btn.innerHTML = '<span class="musica-icone" aria-hidden="true"></span>';
  var icone = btn.firstChild;
  if (!AC) btn.hidden = true; // navegador sem Web Audio: some com o botão

  /* ------------------------------------------------------------------
     A música (composição original, em Dó maior, compasso 3/4)
     Cada compasso: [arpejo em colcheias (6 notas MIDI), melodia [[nota, tempos]]]
     ------------------------------------------------------------------ */
  var BPM = 72;
  var SPB = 60 / BPM;          // segundos por tempo
  var TEMPOS_COMPASSO = 3;
  var VOLUME = 0.16;           // volume geral, bem suave
  var GANHO_VOZES = 2.2;       // ganho de compensação das vozes (pico final ≈ -10 dBFS)

  var COMPASSOS = [
    [[48, 55, 60, 64, 67, 64], [[76, 1], [79, 1], [84, 1]]],        // C
    [[47, 55, 59, 62, 67, 62], [[83, 2], [79, 1]]],                 // G/B
    [[45, 52, 57, 60, 64, 60], [[81, 1], [84, 1], [88, 1]]],        // Am
    [[43, 52, 55, 59, 64, 59], [[83, 3]]],                          // Em/G
    [[41, 53, 57, 60, 65, 60], [[81, 1], [79, 1], [77, 1]]],        // F
    [[40, 52, 55, 60, 64, 60], [[76, 2], [72, 1]]],                 // C/E
    [[38, 50, 57, 60, 65, 60], [[74, 1], [77, 1], [81, 1]]],        // Dm7
    [[43, 50, 55, 59, 65, 62], [[79, 3]]],                          // G7
    [[48, 55, 60, 64, 67, 64], [[76, 1], [79, 1], [84, 1]]],        // C
    [[47, 55, 59, 62, 67, 62], [[83, 1], [86, 1], [83, 1]]],        // G/B
    [[45, 52, 57, 60, 64, 60], [[84, 2], [81, 1]]],                 // Am
    [[43, 52, 55, 59, 64, 59], [[79, 2], [76, 1]]],                 // Em/G
    [[41, 53, 57, 60, 65, 60], [[77, 1], [81, 1], [84, 1]]],        // F
    [[43, 50, 55, 59, 65, 62], [[83, 1.5], [81, 0.5], [79, 1]]],    // G7
    [[48, 55, 60, 64, 67, 64], [[84, 2], [79, 1]]],                 // C
    [[48, 55, 60, 64, 72, 67], [[72, 3]]]                           // C (fecho)
  ];

  // Timbre de caixinha: parciais senoidais [razão, amplitude, decaimento(s)]
  var TIMBRES = {
    baixo:    { vel: 0.34, parciais: [[1, 1, 3.2], [2, 0.45, 1.4], [3, 0.18, 0.7]] },
    arpejo:   { vel: 0.20, parciais: [[1, 1, 2.1], [2, 0.26, 0.7], [3, 0.07, 0.35], [4.2, 0.05, 0.07]] },
    melodia:  { vel: 0.50, parciais: [[1, 1, 3.0], [2, 0.20, 1.0], [3, 0.06, 0.4], [4.2, 0.07, 0.07]] },
    harmonia: { vel: 0.18, parciais: [[1, 1, 2.4], [2, 0.18, 0.8], [4.2, 0.03, 0.06]] }
  };

  var EVENTOS = [];
  COMPASSOS.forEach(function (c, i) {
    var base = i * TEMPOS_COMPASSO;
    c[0].forEach(function (m, k) {
      EVENTOS.push({ t: base + k * 0.5, m: m, tipo: k === 0 ? 'baixo' : 'arpejo', k: k });
    });
    var tt = base;
    c[1].forEach(function (n) {
      if (n[0]) EVENTOS.push({ t: tt, m: n[0], tipo: 'melodia', d: n[1] });
      tt += n[1];
    });
  });
  EVENTOS.sort(function (a, b) { return a.t - b.t; });
  var DURACAO_VOLTA = COMPASSOS.length * TEMPOS_COMPASSO * SPB;

  var ESCALA = [0, 2, 4, 5, 7, 9, 11];
  // terça diatônica abaixo (usada como segunda voz nas voltas ímpares)
  function tercaAbaixo(m) {
    var i = ESCALA.indexOf(m % 12);
    if (i < 0) return 0;
    var grau = Math.floor(m / 12) * 7 + i - 2;
    return Math.floor(grau / 7) * 12 + ESCALA[((grau % 7) + 7) % 7];
  }

  /* ------------------------------------------------------------------
     Estado de áudio
     ------------------------------------------------------------------ */
  var ctx = null;
  var master = null, busMel = null, busArp = null, busBaixo = null;
  var tocando = false;
  var agendador = null;
  var idx = 0, volta = 0, inicioVolta = 0;
  var timerParada = null, timerOcioso = null, timerNotinhas = null;
  var destravado = false, esperandoGesto = false;
  var ADIANTE = 0.3;     // janela de agendamento (s)
  var PASSO_MS = 50;     // frequência do agendador

  function nada() {}

  function podeCriarAgora() {
    var ua = navigator.userActivation;
    return !(ua && ua.hasBeenActive === false);
  }

  function garanteContexto() {
    if (ctx) return true;
    if (!AC || !podeCriarAgora()) return false;
    try {
      ctx = new AC({ latencyHint: 'playback' });
    } catch (e) {
      try { ctx = new AC(); } catch (e2) { ctx = null; }
    }
    if (!ctx) return false;
    montaGrafo();
    return true;
  }

  function impulso(seg) {
    var sr = ctx.sampleRate;
    var len = Math.floor(sr * seg);
    var buf = ctx.createBuffer(2, len, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      var lp = 0;
      var pre = Math.floor(sr * 0.012);
      for (var i = 0; i < len; i++) {
        var x = i / len;
        var ruido = (Math.random() * 2 - 1) * Math.pow(1 - x, 2.6);
        lp += (ruido - lp) * (0.55 - 0.42 * x); // cauda cada vez mais escura
        d[i] = i < pre ? lp * (i / pre) : lp;
      }
    }
    return buf;
  }

  function montaGrafo() {
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    var filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 5200;
    filtro.Q.value = 0.4;

    var seco = ctx.createGain();
    seco.gain.value = 0.85;
    filtro.connect(seco);
    seco.connect(master);

    try {
      var reverb = ctx.createConvolver();
      reverb.buffer = impulso(2.6);
      var molhado = ctx.createGain();
      molhado.gain.value = 0.32;
      filtro.connect(reverb);
      reverb.connect(molhado);
      molhado.connect(master);
    } catch (e) { /* sem reverb, tudo bem */ }

    function barramento(ganho, pan) {
      var g = ctx.createGain();
      g.gain.value = ganho;
      if (pan && typeof ctx.createStereoPanner === 'function') {
        var p = ctx.createStereoPanner();
        p.pan.value = pan;
        g.connect(p);
        p.connect(filtro);
      } else {
        g.connect(filtro);
      }
      return g;
    }
    busMel = barramento(GANHO_VOZES, 0.12);
    busArp = barramento(GANHO_VOZES, -0.18);
    busBaixo = barramento(GANHO_VOZES, 0);
  }

  // destrava o áudio no iOS tocando um buffer mudo dentro do gesto
  function destravaIOS() {
    if (destravado || !ctx) return;
    try {
      var b = ctx.createBuffer(1, 1, 22050);
      var s = ctx.createBufferSource();
      s.buffer = b;
      s.connect(ctx.destination);
      s.start(0);
      destravado = true;
    } catch (e) { /* ignora */ }
  }

  function fatorDecai(m) {
    return Math.max(0.65, Math.min(1.35, 1.3 - (m - 48) / 70));
  }

  function limpaNos(o, g) {
    return function () {
      try { o.disconnect(); g.disconnect(); } catch (e) { /* já desconectado */ }
    };
  }

  function nota(m, t, tipo, h, destino) {
    var tb = TIMBRES[tipo];
    var f = 440 * Math.pow(2, (m - 69) / 12);
    var fat = fatorDecai(m);
    var vel = tb.vel * h;
    for (var i = 0; i < tb.parciais.length; i++) {
      var pr = tb.parciais[i];
      var fp = f * pr[0];
      if (fp > 9000) continue;
      var dec = pr[2] * (i === 0 ? fat : Math.sqrt(fat));
      var amp = Math.max(0.0002, vel * pr[1]);
      var osc = ctx.createOscillator();
      var env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fp, t);
      if (i === 0 && tipo === 'melodia' && osc.detune) {
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, t);
      }
      env.gain.setValueAtTime(0.00001, t);
      env.gain.exponentialRampToValueAtTime(amp, t + (i === 0 ? 0.006 : 0.003));
      env.gain.exponentialRampToValueAtTime(0.00001, t + 0.006 + dec);
      osc.connect(env);
      env.connect(destino);
      osc.start(t);
      osc.stop(t + dec + 0.08);
      osc.onended = limpaNos(osc, env);
    }
  }

  function tocaEvento(ev, quando) {
    var t = quando + Math.random() * 0.01;        // leve humanização
    var h = 0.88 + Math.random() * 0.24;
    if (ev.tipo === 'melodia') {
      nota(ev.m, t, 'melodia', h * (ev.d >= 2 ? 1.05 : 1), busMel);
      if (volta % 2 === 1) {
        var m2 = tercaAbaixo(ev.m);
        if (m2) nota(m2, t + 0.004, 'harmonia', h, busMel);
      }
    } else if (ev.tipo === 'baixo') {
      nota(ev.m, t, 'baixo', h, busBaixo);
    } else {
      nota(ev.m, t, 'arpejo', h * (ev.k === 3 ? 1.1 : 1), busArp);
    }
  }

  /* ------------------------------------------------------------------
     Agendador com "lookahead" (setInterval + ctx.currentTime)
     ------------------------------------------------------------------ */
  function avanca() {
    idx++;
    if (idx >= EVENTOS.length) {
      idx = 0;
      volta++;
      inicioVolta += DURACAO_VOLTA;
    }
  }

  function realinha(aPartirDe) {
    var comp = Math.floor(EVENTOS[idx].t / TEMPOS_COMPASSO);
    var i = 0;
    while (i < EVENTOS.length - 1 && EVENTOS[i].t < comp * TEMPOS_COMPASSO) i++;
    idx = i;
    inicioVolta = aPartirDe - comp * TEMPOS_COMPASSO * SPB;
  }

  function agenda() {
    if (!ctx) return;
    var agora = ctx.currentTime;
    if (inicioVolta + EVENTOS[idx].t * SPB < agora - 0.25) realinha(agora + 0.08); // a aba travou
    var n = 0;
    while (n++ < 48) {
      var ev = EVENTOS[idx];
      var quando = inicioVolta + ev.t * SPB;
      if (quando > agora + ADIANTE) break;
      if (quando >= agora - 0.03) tocaEvento(ev, Math.max(quando, agora));
      avanca();
    }
  }

  function ligaAgendador(doComeco) {
    if (agendador || !ctx) return;
    var t0 = ctx.currentTime + 0.1;
    if (doComeco) {
      idx = 0;
      volta = 0;
      inicioVolta = t0;
    } else {
      realinha(t0);
    }
    agendador = setInterval(agenda, PASSO_MS);
    agenda();
  }

  function desligaAgendador() {
    if (agendador) {
      clearInterval(agendador);
      agendador = null;
    }
  }

  function rampa(alvo, seg) {
    if (!ctx || !master) return;
    var g = master.gain;
    var t = ctx.currentTime;
    var v = Math.max(0.0001, g.value);
    g.cancelScheduledValues(t);
    g.setValueAtTime(v, t);
    g.linearRampToValueAtTime(alvo, t + seg);
  }

  function suspende() {
    if (!ctx || ctx.state !== 'running') return;
    try {
      var pr = ctx.suspend();
      if (pr && pr.catch) pr.catch(nada);
    } catch (e) { /* ignora */ }
  }

  function retoma() {
    if (!ctx || ctx.state === 'running') return;
    try {
      var pr = ctx.resume();
      if (pr && pr.then) {
        pr.then(function () {
          if (ctx.state !== 'running') esperaGesto();
        }, function () { esperaGesto(); });
      }
    } catch (e) { /* ignora */ }
    // alguns navegadores só liberam dentro de um gesto: fica ouvindo o próximo
    if (ctx.state !== 'running') esperaGesto();
  }

  function sessaoAudio(tipo) {
    try {
      if (navigator.audioSession && navigator.audioSession.type !== tipo) navigator.audioSession.type = tipo;
    } catch (e) { /* ignora */ }
  }

  /* ------------------------------------------------------------------
     Desbloqueio por gesto do usuário (cria/retoma o AudioContext)
     ------------------------------------------------------------------ */
  var GESTOS = ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
  var OPC_GESTO = { capture: true, passive: true };

  function esperaGesto() {
    if (esperandoGesto || !AC) return;
    esperandoGesto = true;
    GESTOS.forEach(function (n) { window.addEventListener(n, aoGesto, OPC_GESTO); });
  }

  function paraDeEsperar() {
    if (!esperandoGesto) return;
    esperandoGesto = false;
    GESTOS.forEach(function (n) { window.removeEventListener(n, aoGesto, OPC_GESTO); });
  }

  function confirmaDestravado() {
    if (!ctx || ctx.state !== 'running') return;
    paraDeEsperar();
    if (tocando) {
      if (!agendador && !doc.hidden) {
        ligaAgendador(true);
        rampa(VOLUME, 2);
      }
    } else if (!agendador) {
      // só destravou: descansa depois de um tempinho para poupar bateria
      clearTimeout(timerOcioso);
      timerOcioso = setTimeout(function () {
        timerOcioso = null;
        if (!tocando && !agendador) suspende();
      }, 4000);
    }
  }

  function aoGesto(e) {
    if (e && e.isTrusted === false) return;
    if (!garanteContexto()) return;
    destravaIOS();
    if (ctx.state !== 'running') {
      try {
        var pr = ctx.resume();
        if (pr && pr.then) pr.then(confirmaDestravado, nada);
      } catch (err) { /* ignora */ }
    }
    confirmaDestravado();
  }

  /* ------------------------------------------------------------------
     Notinhas flutuando do botão enquanto toca
     ------------------------------------------------------------------ */
  function soltaNotinha() {
    if (doc.hidden || btn.hidden || !btn.isConnected) return;
    var r = btn.getBoundingClientRect();
    if (!r.width) return;
    var n = doc.createElement('span');
    n.className = 'musica-notinha';
    n.setAttribute('aria-hidden', 'true');
    n.textContent = Math.random() < 0.5 ? '♪' : '♫';
    n.style.left = (r.left + r.width / 2 + (Math.random() * 16 - 8)) + 'px';
    n.style.top = (r.top - 4) + 'px';
    n.style.setProperty('--musica-dx', (Math.random() * 36 - 26).toFixed(1) + 'px');
    n.style.setProperty('--musica-rot', (Math.random() * 40 - 20).toFixed(1) + 'deg');
    doc.body.appendChild(n);
    var foi = false;
    var fim = function () {
      if (foi) return;
      foi = true;
      if (n.parentNode) n.parentNode.removeChild(n);
    };
    n.addEventListener('animationend', fim);
    setTimeout(fim, 3200);
  }

  function iniciaNotinhas() {
    if (timerNotinhas || reduzMov) return;
    timerNotinhas = setInterval(soltaNotinha, 1500);
  }

  function paraNotinhas() {
    if (timerNotinhas) {
      clearInterval(timerNotinhas);
      timerNotinhas = null;
    }
  }

  /* ------------------------------------------------------------------
     API pública
     ------------------------------------------------------------------ */
  function atualizaBotao() {
    icone.textContent = tocando ? '🎵' : '🔇'; // 🎵 / 🔇
    btn.classList.toggle('musica-tocando', tocando);
    var rotulo = tocando ? 'Pausar a música' : 'Tocar a nossa música';
    btn.setAttribute('aria-label', rotulo);
    btn.title = rotulo;
  }

  function play() {
    if (!AC) return;
    tocando = true;
    atualizaBotao();
    sessaoAudio('playback');
    iniciaNotinhas();
    if (timerParada) { clearTimeout(timerParada); timerParada = null; }
    if (timerOcioso) { clearTimeout(timerOcioso); timerOcioso = null; }
    if (!garanteContexto()) { esperaGesto(); return; }
    destravaIOS();
    retoma();
    if (!doc.hidden) {
      ligaAgendador(true);
      rampa(VOLUME, 2);
    }
  }

  function pause() {
    tocando = false;
    atualizaBotao();
    paraNotinhas();
    if (!ctx) { sessaoAudio('auto'); return; }
    rampa(0.0001, 0.9);
    clearTimeout(timerParada);
    timerParada = setTimeout(function () {
      timerParada = null;
      if (tocando) return;
      desligaAgendador();
      suspende();
      sessaoAudio('auto');
    }, 1000);
  }

  function toggle() {
    if (tocando) pause(); else play();
  }

  btn.addEventListener('click', function () {
    pausadaPorVideo = false; // a escolha dela vale mais que a pausa automática
    toggle();
  });

  /* Vídeo com som tocando (ex.: o nosso vídeo na seção de fotos): a caixinha
     dá uma pausa pra não embolar os sons e volta sozinha quando o vídeo para.
     Eventos de mídia não borbulham, então escutamos na fase de captura. */
  var pausadaPorVideo = false;

  function ehMidiaComSom(el) {
    return !!el && (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') && !el.muted && el.volume > 0;
  }

  function algumaMidiaTocando() {
    var ms = doc.querySelectorAll('video,audio');
    for (var i = 0; i < ms.length; i++) {
      if (ehMidiaComSom(ms[i]) && !ms[i].paused && !ms[i].ended) return true;
    }
    return false;
  }

  doc.addEventListener('play', function (e) {
    if (!ehMidiaComSom(e.target) || !tocando) return;
    pausadaPorVideo = true;
    pause();
  }, true);

  function aoPararMidia(e) {
    var t = e.target;
    if (!t || (t.tagName !== 'VIDEO' && t.tagName !== 'AUDIO')) return;
    if (!pausadaPorVideo || algumaMidiaTocando()) return;
    pausadaPorVideo = false;
    if (!tocando) play();
  }
  doc.addEventListener('pause', aoPararMidia, true);
  doc.addEventListener('ended', aoPararMidia, true);

  /* Aba escondida: para de agendar e silencia; volta quando reaparecer */
  doc.addEventListener('visibilitychange', function () {
    if (!ctx || !tocando) return;
    if (doc.hidden) {
      paraNotinhas();
      rampa(0.0001, 0.25);
      clearTimeout(timerParada);
      timerParada = setTimeout(function () {
        timerParada = null;
        if (!doc.hidden) return;
        desligaAgendador();
        suspende();
      }, 300);
    } else {
      if (timerParada) { clearTimeout(timerParada); timerParada = null; }
      retoma();
      if (!agendador) ligaAgendador(false);
      rampa(VOLUME, 1.5);
      iniciaNotinhas();
    }
  });

  atualizaBotao();
  // Destrava o áudio no primeiro gesto (ex.: ao encostar no coração da abertura),
  // assim a música pode começar assim que a surpresa se abrir.
  esperaGesto();

  window.musica = {
    play: play,
    pause: pause,
    toggle: toggle,
    get tocando() { return tocando; }
  };
})();
