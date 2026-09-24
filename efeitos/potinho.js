/*
 * efeitos/potinho.js
 *
 * "Potinho de bilhetinhos": um pote de vidro com laço, cheio de papeizinhos
 * dobrados (coraçõezinhos, estrelinhas, envelopinhos) que flutuam de leve.
 * Tocar no pote faz ele balançar, a tampa abre, um bilhete voa lá de dentro
 * e se desdobra no centro da tela, como um papelzinho de verdade.
 *  - 24 bilhetes, sem repetir até sair todo mundo (saquinho embaralhado).
 *  - O pote vai esvaziando e enche de novo quando o saquinho recomeça.
 *  - Fecha tocando fora, no ✕ ou com Esc. Tudo acessível por teclado.
 *
 * Monta dentro de <section id="potinho">. Não cria nenhuma variável global.
 */
(function () {
  'use strict';

  var secao = document.getElementById('potinho');
  if (!secao) return;

  /* ------------------------------------------------------------------ */
  /* Os bilhetinhos                                                      */
  /* ------------------------------------------------------------------ */
  var BILHETES = [
    'Quando você manda áudio rindo antes de conseguir falar, eu já começo a rir junto sem nem saber do quê.',
    'Eu amo o jeitinho que você fala o meu nome quando tá com sono.',
    'Meu coração ainda dá um pulinho toda vez que aparece uma notificação com o seu nome.',
    'Seis meses e eu ainda sinto frio na barriga antes de te ver. Tomara que isso nunca passe.',
    'Se eu pudesse voltar no tempo e escolher de novo, eu escolheria você. Todas as vezes.',
    'Você é a primeira pessoa pra quem eu quero contar tudo, das notícias grandes às bobeirinhas do dia.',
    'Com você, até fila de mercado vira encontro.',
    'Quando você deita no meu ombro, o mundo inteiro pode esperar.',
    'Amo te ver falando das coisas que você ama. Seus olhos brilham de um jeito que me desmonta.',
    'Você fica linda de qualquer jeito, mas de moletom e cabelo preso chega a ser covardia.',
    'Eu adoro quando você me manda foto de alguma coisa aleatória só porque lembrou de mim.',
    'Prometo sempre te guardar o último pedaço da pizza. Tá bom, quase sempre. 🍕',
    'Prometo segurar sua mão nos filmes de terror, mesmo quando o medroso for eu. 🙈',
    'Prometo te lembrar de beber água, de descansar e de que você é incrível. Principalmente a última parte.',
    'Quero ser seu parceiro de aventura, de sofá, de brigadeiro de panela… e de vida.',
    'Prometo nunca parar de te conquistar. Nem daqui a cinquenta anos.',
    'Obrigado por me escolher todo dia, até naqueles em que eu não facilito muito.',
    'Obrigado por ser calmaria nos meus dias de bagunça.',
    'Se um dia você duvidar do quanto é amada, volta aqui e pega mais um bilhetinho.',
    'Eu guardo print das nossas conversas mais bobas. Não conta pra ninguém. 🤫',
    'Te devo um milhão de beijos. Pode cobrar quando quiser, com juros. 😘',
    'Pode roubar meu cobertor quantas vezes quiser. Eu deixo, contanto que seja do meu lado.',
    'De todas as coisas boas que esse ano me trouxe, você é disparado a melhor.',
    'Se amor tivesse tamanho, o meu por você não caberia nesse potinho. Nem no mundo inteiro.'
  ];
  var TOTAL = BILHETES.length;
  var ASSINATURA = 'com amor, seu 💕';
  var PS_FINAL = 'P.S.: os bilhetes acabaram, mas o que eu sinto por você não acaba nunca. 💖';

  // papéis coloridos: "forte" = papel dobrado / "claro" = lado de dentro
  var CORES = [
    { forte: '#ff9eb8', claro: '#fff5f8' },
    { forte: '#ffc59e', claro: '#fff8f1' },
    { forte: '#cdb6f5', claro: '#faf6ff' },
    { forte: '#a9e5cc', claro: '#f3fcf7' },
    { forte: '#ffe08f', claro: '#fffbec' },
    { forte: '#b3d9ff', claro: '#f4f9ff' },
    { forte: '#ff9a9a', claro: '#fff6f4' }
  ];
  var FAISCAS = ['💖', '💕', '💗', '✨', '🌸', '💞'];
  var SUSPIROS = ['💗', '💕', '✨', '💖'];

  function reduz() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Estilos (todas as classes com prefixo "pot-")                       */
  /* ------------------------------------------------------------------ */
  var CSS = [
    '.pot-dica{margin:-8px 0 18px}',
    '.pot-area{position:relative;width:min(250px,68vw);margin:0 auto;-webkit-user-select:none;user-select:none}',
    '.pot-jarra{-webkit-appearance:none;appearance:none;display:block;width:100%;margin:0;padding:0;border:0;background:none;font:inherit;color:inherit;cursor:pointer;border-radius:40px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .35s cubic-bezier(.34,1.56,.64,1)}',
    '.pot-jarra:focus{outline:none}',
    '.pot-jarra:focus-visible{outline:3px dashed var(--rosa,#ff5c8a);outline-offset:6px}',
    '.pot-jarra:active{transform:scale(.96)}',
    '.pot-flutua,.pot-balanco{display:block}',
    '.pot-flutua{transition:transform .5s cubic-bezier(.34,1.56,.64,1)}',
    '@media (hover:hover){.pot-jarra:hover .pot-flutua{transform:translateY(-6px) rotate(-1.5deg)}}',
    '.pot-balanco{transform-origin:50% 96%}',
    '.pot-balanco.pot-mexe{animation:pot-mexe .7s cubic-bezier(.36,.07,.19,.97)}',
    '.pot-svg{display:block;width:100%;height:auto;overflow:visible}',
    '.pot-vazio .pot-flutua{animation:pot-chama 2.4s ease-in-out infinite}',

    /* papeizinhos dentro do pote */
    '.pot-estado,.pot-boia{transform-box:fill-box;transform-origin:50% 50%}',
    '.pot-boia{animation:pot-boia 4.6s ease-in-out infinite}',
    '.pot-boia-alto{animation-name:pot-boia-alto}',
    '.pot-estado{transition:opacity .4s ease,transform .5s cubic-bezier(.4,0,.6,1)}',
    '.pot-estado.pot-some{opacity:0;transform:translateY(-24px) scale(.35)}',
    '.pot-estado.pot-voou{transition-duration:.16s,.2s}',
    '.pot-estado.pot-cai{animation:pot-cai .8s cubic-bezier(.3,1.3,.5,1) both}',
    '.pot-estado.pot-fixo{transition:none}',
    '.pot-pausado .pot-boia,.pot-pausado .pot-cintila{animation-play-state:paused}',

    /* tampa */
    '.pot-tampa{transform-box:fill-box;transform-origin:0% 100%;transition:transform .5s cubic-bezier(.34,1.56,.64,1)}',
    '.pot-tampa.pot-abre{animation:pot-abre .95s cubic-bezier(.3,1.1,.4,1)}',
    '.pot-tampa.pot-destampada{transform:translateY(-14px) rotate(-20deg)}',

    /* brilhinhos e coraçõezinhos que escapam */
    '.pot-cintila{position:absolute;pointer-events:none;color:#ff9ab5;line-height:1;text-shadow:0 0 10px rgba(255,92,138,.55);animation:pot-cintila 2.8s ease-in-out infinite}',
    '.pot-suspiro{position:absolute;top:9%;font-size:15px;line-height:1;pointer-events:none;animation:pot-suspiro 2.6s ease-out forwards}',

    /* contador */
    '.pot-conta{margin-top:20px;max-width:100%;padding:9px 18px;border-radius:999px;background:rgba(255,255,255,.75);border:1px solid rgba(255,209,220,.9);box-shadow:0 6px 18px rgba(255,92,138,.16);font-size:.95rem;font-weight:600;color:var(--vinho,#8b1e3f)}',
    '.pot-conta.pot-pulsa{animation:pot-pulsa .55s cubic-bezier(.34,1.56,.64,1)}',

    /* sobreposição do bilhete */
    '.pot-overlay{position:fixed;left:0;top:0;right:0;bottom:0;z-index:250;display:flex;align-items:center;justify-content:center;padding:16px;overflow:hidden;overscroll-behavior:contain;touch-action:none;outline:none;-webkit-tap-highlight-color:transparent;font-family:"Quicksand",sans-serif}',
    '.pot-fundo{position:absolute;left:0;top:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 45%,rgba(139,30,63,.5),rgba(52,8,24,.8));opacity:0;transition:opacity .5s ease .1s;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
    '.pot-overlay.pot-on .pot-fundo{opacity:1}',
    '.pot-cena{position:relative;display:flex;flex-direction:column;align-items:center;gap:26px;max-width:100%;transition:opacity .3s ease,transform .3s ease}',
    '.pot-overlay.pot-saindo{pointer-events:none}',
    '.pot-overlay.pot-saindo .pot-fundo{opacity:0;transition-delay:0s;transition-duration:.32s}',
    '.pot-overlay.pot-saindo .pot-cena{opacity:0;transform:translateY(14px) scale(.92)}',
    '.pot-palco{position:relative}',

    /* o papel */
    '.pot-cartao{position:relative;width:min(330px,calc(100vw - 56px));min-height:232px;padding:36px 26px 26px;border-radius:6px;display:flex;flex-direction:column;justify-content:center;gap:10px;text-align:center;color:var(--vinho,#8b1e3f);background-color:var(--pot-claro,#fffaf5);background-image:radial-gradient(130% 90% at 0% 0%,rgba(255,255,255,.95),rgba(255,255,255,0) 55%),radial-gradient(90% 70% at 100% 100%,rgba(255,196,168,.24),rgba(255,196,168,0) 60%),repeating-linear-gradient(180deg,rgba(255,92,138,0) 0,rgba(255,92,138,0) 29px,rgba(255,92,138,.11) 29px,rgba(255,92,138,.11) 30px);box-shadow:0 24px 50px rgba(40,6,18,.38),0 3px 8px rgba(40,6,18,.14);outline:none}',
    '.pot-cartao::after{content:"";position:absolute;left:4px;right:4px;top:50%;height:2px;margin-top:-1px;background:linear-gradient(180deg,rgba(139,30,63,.07),rgba(255,255,255,.85));pointer-events:none}',
    '.pot-num{font-size:.72rem;line-height:1.2;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--rosa,#ff5c8a)}',
    '.pot-texto{font-family:"Dancing Script",cursive;font-weight:700;font-size:clamp(1.45rem,6.2vw,1.85rem);line-height:1.3;color:var(--vinho,#8b1e3f);overflow-wrap:break-word}',
    '.pot-texto.pot-longo{font-size:clamp(1.3rem,5.4vw,1.6rem)}',
    '.pot-ps{font-size:.88rem;line-height:1.45;color:#a4426a;font-style:italic}',
    '.pot-assina{font-family:"Dancing Script",cursive;font-size:1.25rem;color:#b54a72;text-align:right;margin-top:4px;padding-right:2px}',
    '.pot-rabisco{position:absolute;left:18px;bottom:16px;width:28px;height:24px;transform:rotate(-14deg);opacity:.85}',

    /* fita adesiva (washi tape) */
    '.pot-fita{position:absolute;top:-15px;left:50%;width:112px;height:30px;margin-left:-56px;z-index:2;opacity:0;pointer-events:none;background-color:rgba(255,255,255,.55);background-image:repeating-linear-gradient(-45deg,var(--pot-forte,#ff9eb8) 0,var(--pot-forte,#ff9eb8) 7px,rgba(255,255,255,.75) 7px,rgba(255,255,255,.75) 14px);-webkit-clip-path:polygon(0 0,100% 0,97% 20%,100% 40%,97% 60%,100% 80%,97% 100%,0 100%,3% 80%,0 60%,3% 40%,0 20%);clip-path:polygon(0 0,100% 0,97% 20%,100% 40%,97% 60%,100% 80%,97% 100%,0 100%,3% 80%,0 60%,3% 40%,0 20%);transform:rotate(-5deg)}',
    '.pot-overlay.pot-aberto .pot-fita{animation:pot-cola .45s cubic-bezier(.3,1.5,.5,1) forwards}',

    /* botões */
    '.pot-fechar{position:absolute;top:-16px;right:-14px;z-index:3;width:42px;height:42px;padding:0;border-radius:50%;border:2px solid var(--rosa-claro,#ffd1dc);background:#fff;color:var(--vinho,#8b1e3f);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(40,6,18,.3);opacity:0;transform:scale(.6);transition:opacity .3s ease .1s,transform .35s cubic-bezier(.34,1.56,.64,1) .1s;-webkit-tap-highlight-color:transparent}',
    '.pot-overlay.pot-aberto .pot-fechar{opacity:1;transform:none}',
    '.pot-acoes{opacity:0;transform:translateY(10px);transition:opacity .35s ease .18s,transform .35s ease .18s}',
    '.pot-overlay.pot-aberto .pot-acoes{opacity:1;transform:none}',
    '.pot-outro{border:0;border-radius:999px;padding:13px 26px;background:#fff;color:var(--vinho,#8b1e3f);font:600 1rem "Quicksand",sans-serif;cursor:pointer;box-shadow:0 10px 24px rgba(0,0,0,.22);transition:transform .2s ease;-webkit-tap-highlight-color:transparent}',
    '@media (hover:hover){.pot-outro:hover{transform:scale(1.05)}}',
    '.pot-outro:active{transform:scale(.97)}',
    '.pot-fechar:focus,.pot-outro:focus{outline:none}',
    '.pot-fechar:focus-visible,.pot-outro:focus-visible{outline:3px dashed #fff;outline-offset:3px}',

    /* a dobra (animação de desdobrar) */
    '.pot-dobra{position:absolute;left:0;top:0;width:100%;height:100%;-webkit-perspective:1100px;perspective:1100px;pointer-events:none;z-index:1}',
    '.pot-metade{position:absolute;left:0;width:100%;height:50%}',
    '.pot-metade-cima{top:0;overflow:hidden;border-radius:6px 6px 0 0;box-shadow:0 14px 30px rgba(40,6,18,.3)}',
    '.pot-metade-baixo{top:50%;-webkit-transform-origin:50% 0;transform-origin:50% 0;-webkit-transform-style:preserve-3d;transform-style:preserve-3d;transform:rotateX(180deg)}',
    '.pot-face{position:absolute;left:0;top:0;width:100%;height:100%;overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden}',
    '.pot-frente{border-radius:0 0 6px 6px}',
    '.pot-verso{transform:rotateX(180deg);border-radius:6px 6px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background-color:var(--pot-forte,#ff9eb8);background-image:radial-gradient(120% 100% at 15% 0%,rgba(255,255,255,.6),rgba(255,255,255,0) 60%),linear-gradient(180deg,rgba(255,255,255,.1),rgba(139,30,63,.1));box-shadow:inset 0 0 0 1px rgba(139,30,63,.08),0 14px 30px rgba(40,6,18,.3)}',
    '.pot-selo{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#ff8fab,#e23e6b);box-shadow:0 3px 8px rgba(139,30,63,.35),inset 0 -3px 6px rgba(0,0,0,.15)}',
    '.pot-selo svg{width:22px;height:20px;display:block}',
    '.pot-verso-nome{font-family:"Dancing Script",cursive;font-weight:700;font-size:1.35rem;color:var(--vinho,#8b1e3f)}',
    '.pot-sombra{position:absolute;left:0;top:0;width:100%;height:100%;background:linear-gradient(180deg,rgba(74,16,36,.34),rgba(74,16,36,.08));pointer-events:none}',
    '.pot-copia{position:absolute!important;left:0;top:0;margin:0!important;min-height:0!important;box-shadow:none!important}',
    '.pot-frente .pot-copia{top:-100%}',

    /* faíscas dentro da sobreposição */
    '.pot-faisca{position:absolute;left:0;top:0;line-height:1;pointer-events:none;animation:pot-faisca 1.4s cubic-bezier(.2,.7,.3,1) both}',

    /* telas bem baixinhas (celular deitado) */
    '@media (max-height:480px){.pot-cartao{min-height:0;padding:26px 22px 18px;gap:6px}.pot-texto,.pot-texto.pot-longo{font-size:1.25rem}.pot-cena{gap:12px}.pot-outro{padding:10px 22px}}',

    /* animações */
    '@keyframes pot-boia{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-2.5px) rotate(4deg)}}',
    '@keyframes pot-boia-alto{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-9px) rotate(8deg)}}',
    '@keyframes pot-boia-leve{0%,100%{transform:none}50%{transform:translateY(-1px) rotate(1.5deg)}}',
    '@keyframes pot-mexe{0%,100%{transform:rotate(0)}15%{transform:rotate(-6deg)}30%{transform:rotate(5deg)}45%{transform:rotate(-3.5deg)}60%{transform:rotate(2deg)}78%{transform:rotate(-.8deg)}}',
    '@keyframes pot-mexe-leve{0%,100%{transform:none}30%{transform:rotate(-1.5deg)}65%{transform:rotate(1deg)}}',
    '@keyframes pot-abre{0%{transform:none}28%,62%{transform:translateY(-12px) rotate(-18deg)}100%{transform:none}}',
    '@keyframes pot-abre-leve{0%,100%{transform:none}30%,65%{transform:translateY(-5px) rotate(-6deg)}}',
    '@keyframes pot-cai{0%{opacity:0;transform:translateY(-190px) rotate(-50deg)}25%{opacity:1}100%{opacity:1;transform:none}}',
    '@keyframes pot-cai-leve{0%{opacity:0;transform:translateY(-10px)}100%{opacity:1;transform:none}}',
    '@keyframes pot-chama{0%,100%{transform:none}50%{transform:scale(1.035)}}',
    '@keyframes pot-cintila{0%,100%{opacity:.15;transform:scale(.55) rotate(0)}50%{opacity:1;transform:scale(1.1) rotate(25deg)}}',
    '@keyframes pot-suspiro{0%{opacity:0;transform:translate(-50%,6px) scale(.4)}25%{opacity:.95}100%{opacity:0;transform:translate(calc(-50% + var(--dx,0px)),-64px) scale(1)}}',
    '@keyframes pot-suspiro-leve{0%{opacity:0;transform:translate(-50%,0)}30%{opacity:.8}100%{opacity:0;transform:translate(-50%,-18px)}}',
    '@keyframes pot-pulsa{40%{transform:scale(1.07)}}',
    '@keyframes pot-cola{0%{opacity:0;transform:rotate(-12deg) scale(1.35) translateY(-8px)}100%{opacity:.92;transform:rotate(-5deg) scale(1)}}',
    '@keyframes pot-faisca{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}18%{opacity:1}100%{opacity:0;transform:translate(calc(-50% + var(--dx,0px)),calc(-50% + var(--dy,0px))) scale(1) rotate(var(--gira,0deg))}}',

    '@media (prefers-reduced-motion:reduce){',
    '.pot-boia,.pot-boia-alto{animation-name:pot-boia-leve}',
    '.pot-balanco.pot-mexe{animation-name:pot-mexe-leve}',
    '.pot-tampa.pot-abre{animation-name:pot-abre-leve}',
    '.pot-tampa.pot-destampada{transform:translateY(-5px) rotate(-6deg)}',
    '.pot-estado.pot-cai{animation-name:pot-cai-leve;animation-duration:.4s}',
    '.pot-vazio .pot-flutua{animation:none}',
    '.pot-cintila{animation-duration:5s}',
    '.pot-suspiro{animation-name:pot-suspiro-leve}',
    '.pot-faisca{animation-duration:.9s}',
    '}'
  ].join('\n');

  var estilo = document.createElement('style');
  estilo.setAttribute('data-efeito', 'potinho');
  estilo.textContent = CSS;
  (document.head || document.documentElement).appendChild(estilo);

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */
  function semente(s) {
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function embaralha(n, evitarPrimeiro) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = a[j]; a[j] = a[k]; a[k] = t;
    }
    if (n > 1 && a[0] === evitarPrimeiro) {
      var m = 1 + Math.floor(Math.random() * (n - 1));
      var t2 = a[0]; a[0] = a[m]; a[m] = t2;
    }
    return a;
  }

  function reinicia(el, classe) {
    if (!el) return;
    el.classList.remove(classe);
    void el.getBoundingClientRect();
    el.classList.add(classe);
  }

  function tira(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function tr(x, y, s, r) {
    return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s + ') rotate(' + r + 'deg)';
  }

  /* ------------------------------------------------------------------ */
  /* Desenho dos papeizinhos (centralizados em 0,0)                      */
  /* ------------------------------------------------------------------ */
  var CONTORNO = 'stroke="rgba(139,30,63,.22)" stroke-width=".8"';
  var ESTRELA = 'M0-9.5L2.8-3.7L9-2.9L4.4 1.4L5.6 7.7L0 4.6L-5.6 7.7L-4.4 1.4L-9-2.9L-2.8-3.7Z';

  var FORMAS = {
    coracao: function (cor) {
      return '<path d="M0 10C-2 8-13 1-13-5C-13-10-9-12.5-6-12.5C-3-12.5-1-10.5 0-8.5C1-10.5 3-12.5 6-12.5C9-12.5 13-10 13-5C13 1 2 8 0 10Z" fill="' + cor + '" ' + CONTORNO + '/>' +
        '<path d="M0 10C-2 8-13 1-13-5C-13-10-9-12.5-6-12.5C-3-12.5-1-10.5 0-8.5Z" fill="rgba(139,30,63,.09)"/>' +
        '<path d="M0-8.5V10" stroke="rgba(255,255,255,.75)" stroke-width=".9"/>' +
        '<ellipse cx="6.5" cy="-7.5" rx="3" ry="1.6" transform="rotate(-25 6.5 -7.5)" fill="rgba(255,255,255,.6)"/>';
    },
    estrela: function (cor) {
      return '<path d="' + ESTRELA + '" fill="none" stroke="rgba(139,30,63,.2)" stroke-width="4.6" stroke-linejoin="round"/>' +
        '<path d="' + ESTRELA + '" fill="' + cor + '" stroke="' + cor + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M0-5V1.5M-4.6-1.5L0 1.5L4.6-1.5M-3.2 5L0 1.5L3.2 5" fill="none" stroke="rgba(255,255,255,.6)" stroke-width=".8" stroke-linecap="round"/>';
    },
    bilhete: function (cor) {
      return '<path d="M-11-9H6L11-4V9H-11Z" fill="' + cor + '" ' + CONTORNO + ' stroke-linejoin="round"/>' +
        '<path d="M6-9V-4H11Z" fill="rgba(255,255,255,.6)" stroke="rgba(139,30,63,.18)" stroke-width=".6" stroke-linejoin="round"/>' +
        '<path d="M-7-3H4M-7 1H6M-7 5H2" stroke="rgba(139,30,63,.25)" stroke-width="1" stroke-linecap="round"/>';
    },
    envelope: function (cor) {
      return '<rect x="-12" y="-8.5" width="24" height="17" rx="2" fill="' + cor + '" ' + CONTORNO + '/>' +
        '<path d="M-11.5-8L0 1L11.5-8" fill="none" stroke="rgba(139,30,63,.28)" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M0-1.2C-.9-2.4-2.8-2-2.6-.4C-2.4.9-.8 1.8 0 2.8C.8 1.8 2.4.9 2.6-.4C2.8-2 .9-2.4 0-1.2Z" fill="#ff5c8a"/>';
    },
    rolinho: function (cor) {
      return '<rect x="-13" y="-4.6" width="26" height="9.2" rx="4.6" fill="' + cor + '" ' + CONTORNO + '/>' +
        '<ellipse cx="10.4" cy="0" rx="2.1" ry="4" fill="rgba(255,255,255,.5)"/>' +
        '<rect x="-2.2" y="-5.6" width="4.4" height="11.2" rx="1.4" fill="#ff5c8a"/>';
    }
  };

  // Posições fixas (semente) pra o pote ficar sempre com a mesma carinha.
  function geraPecas() {
    var rnd = semente(24092026);
    var linhas = [5, 5, 5, 5, 5, 5, 4];
    var lista = [];
    var ultimaCor = -1;

    function sorteiaCor() {
      var c;
      do { c = Math.floor(rnd() * CORES.length); } while (c === ultimaCor);
      ultimaCor = c;
      return c;
    }
    function sorteiaTipo() {
      var s = rnd();
      if (s < 0.38) return 'coracao';
      if (s < 0.56) return 'estrela';
      if (s < 0.72) return 'bilhete';
      if (s < 0.86) return 'envelope';
      return 'rolinho';
    }

    for (var li = 0; li < linhas.length; li++) {
      var n = linhas[li];
      var y = 262 - li * 18;
      var topo = li === linhas.length - 1;
      var xmin = topo ? 72 : 55;
      var xmax = topo ? 168 : 185;
      var desloc = (li % 2) ? 7 : -7;
      for (var k = 0; k < n; k++) {
        var t = n > 1 ? k / (n - 1) : 0.5;
        var x = xmin + (xmax - xmin) * t + desloc + (rnd() * 8 - 4);
        x = Math.max(52, Math.min(188, x));
        lista.push({
          x: x,
          y: y + (rnd() * 8 - 4),
          tipo: sorteiaTipo(),
          cor: sorteiaCor(),
          rot: rnd() * 70 - 35,
          esc: 0.9 + rnd() * 0.25,
          dur: 3.6 + rnd() * 2.8,
          atraso: rnd() * 4,
          alto: false
        });
      }
    }
    // alguns flutuando "no ar", lá em cima do pote
    var soltos = [[78, 128], [160, 124], [120, 134]];
    for (var s = 0; s < soltos.length; s++) {
      lista.push({
        x: soltos[s][0],
        y: soltos[s][1],
        tipo: s === 1 ? 'estrela' : 'coracao',
        cor: sorteiaCor(),
        rot: rnd() * 40 - 20,
        esc: 0.95 + rnd() * 0.15,
        dur: 4.2 + rnd() * 2,
        atraso: rnd() * 4,
        alto: true
      });
    }
    return lista;
  }

  var pecas = geraPecas();

  var pecasHtml = pecas.map(function (p, i) {
    return '<g transform="translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')">' +
      '<g class="pot-estado" data-peca="' + i + '">' +
      '<g class="pot-boia' + (p.alto ? ' pot-boia-alto' : '') + '" style="animation-duration:' + p.dur.toFixed(2) + 's;animation-delay:-' + p.atraso.toFixed(2) + 's">' +
      '<g transform="rotate(' + p.rot.toFixed(1) + ') scale(' + p.esc.toFixed(2) + ')">' +
      FORMAS[p.tipo](CORES[p.cor].forte) +
      '</g></g></g></g>';
  }).join('');

  /* ------------------------------------------------------------------ */
  /* O pote (SVG)                                                        */
  /* ------------------------------------------------------------------ */
  var JARRA = 'M80 62H160V82C160 98 206 100 206 130V256Q206 284 178 284H62Q34 284 34 256V130C34 100 80 98 80 82Z';
  var MIOLO = 'M84 58H156V84C156 101 202 103 202 131V255Q202 280 177 280H63Q38 280 38 255V131C38 103 84 101 84 84Z';

  var ranhuras = '';
  for (var rx = 81; rx <= 159; rx += 8) {
    ranhuras += '<path d="M' + rx + ' 50V65" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>';
  }

  var SVG_POTE =
    '<svg class="pot-svg" viewBox="0 0 240 300" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<radialGradient id="pot-g-sombra"><stop offset="0" stop-color="#8b1e3f" stop-opacity=".24"/><stop offset="1" stop-color="#8b1e3f" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="pot-g-fundo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffc9d7" stop-opacity=".6"/><stop offset=".45" stop-color="#fff4f7" stop-opacity=".32"/><stop offset="1" stop-color="#ffbfd0" stop-opacity=".62"/></linearGradient>' +
        '<linearGradient id="pot-g-vidro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".14" stop-color="#fff" stop-opacity=".09"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".86" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></linearGradient>' +
        '<linearGradient id="pot-g-tampa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffa3bb"/><stop offset=".55" stop-color="#ff7aa0"/><stop offset="1" stop-color="#f0527f"/></linearGradient>' +
        '<linearGradient id="pot-g-topo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd0dc"/><stop offset="1" stop-color="#ff9ab5"/></linearGradient>' +
        '<linearGradient id="pot-g-laco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6f96"/><stop offset="1" stop-color="#d93563"/></linearGradient>' +
        '<clipPath id="pot-clip"><path d="' + MIOLO + '"/></clipPath>' +
      '</defs>' +
      // sombra no "chão"
      '<ellipse cx="120" cy="287" rx="96" ry="10" fill="url(#pot-g-sombra)"/>' +
      // vidro (fundo)
      '<path d="' + JARRA + '" fill="url(#pot-g-fundo)"/>' +
      // papeizinhos
      '<g clip-path="url(#pot-clip)"><g class="pot-pecas">' + pecasHtml + '</g></g>' +
      // vidro (frente) + reflexos
      '<path d="' + JARRA + '" fill="url(#pot-g-vidro)" stroke="#ff9ab5" stroke-opacity=".8" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M40 266Q42 279 62 279H178Q198 279 200 266" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M47 142C43 180 43 220 47 252" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M48 264V266" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M195 150C198 184 198 214 195 238" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M56 118C64 107 74 102 86 99" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>' +
      // fitinha no gargalo
      '<rect x="79" y="70" width="82" height="9" rx="2.5" fill="url(#pot-g-laco)"/>' +
      '<path d="M81 72.5H159" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>' +
      // tampa
      '<g class="pot-tampa">' +
        '<rect x="73" y="44" width="94" height="26" rx="6" fill="url(#pot-g-tampa)"/>' +
        ranhuras +
        '<path d="M76 50H164" stroke="#fff" stroke-opacity=".3" stroke-width="1.4"/>' +
        '<rect x="77" y="35" width="86" height="13" rx="5.5" fill="url(#pot-g-topo)"/>' +
        '<path d="M84 39.5H130" stroke="#fff" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>' +
      '</g>' +
      // laço + etiqueta
      '<g class="pot-laco">' +
        '<path d="M120 75C108 60 90 62 93 74C95 84 110 82 120 75Z" fill="url(#pot-g-laco)"/>' +
        '<path d="M120 75C132 60 150 62 147 74C145 84 130 82 120 75Z" fill="url(#pot-g-laco)"/>' +
        '<path d="M117.5 73C110 68 101 68.5 99.5 73.5M122.5 73C130 68 139 68.5 140.5 73.5" fill="none" stroke="#b0284f" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/>' +
        '<path d="M117 78C114 87 110 95 104 102L110 101.5L112.5 107C117 98 120 89 121 79Z" fill="#e0416d"/>' +
        '<path d="M123 78C126 87 130 95 136 102L130 101.5L127.5 107C123 98 120 89 119 79Z" fill="#d93563"/>' +
        '<rect x="114.5" y="69.5" width="11" height="11" rx="4" fill="#c92d59"/>' +
        '<path d="M117 72.5Q120 71 123 72.5" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M146 77Q162 92 176 100.5" fill="none" stroke="#c98f73" stroke-width="1"/>' +
        '<g transform="translate(190 104) rotate(14)">' +
          '<path d="M-14-9.5H16Q19-9.5 19-6.5V6.5Q19 9.5 16 9.5H-14L-21 0Z" fill="#fff8ee" stroke="#e8c2a4" stroke-width=".9" stroke-linejoin="round"/>' +
          '<circle cx="-14.5" cy="0" r="1.8" fill="#fff" stroke="#e0b596" stroke-width=".8"/>' +
          '<text x="2.5" y="3.6" text-anchor="middle" font-family="\'Dancing Script\', cursive" font-weight="700" font-size="10.5" fill="#8b1e3f">Cybele</text>' +
        '</g>' +
      '</g>' +
    '</svg>';

  var CINTILAS = [
    { x: '-8%', y: '30%', t: '✦', d: '0s', s: 16 },
    { x: '101%', y: '20%', t: '✧', d: '.8s', s: 14 },
    { x: '-5%', y: '70%', t: '✧', d: '1.5s', s: 13 },
    { x: '97%', y: '64%', t: '✦', d: '2.1s', s: 18 },
    { x: '20%', y: '-3%', t: '✦', d: '1.1s', s: 12 }
  ];

  var RABISCO =
    '<svg class="pot-rabisco" viewBox="0 0 32 28" aria-hidden="true" focusable="false">' +
    '<path d="M16 25C10 20 3 15 3.5 8.5C4 3.5 9.5 1.8 13 5.2C14.6 6.7 15.6 8.4 16 9.6C16.6 7.8 18.2 5.4 20.8 4.2C25.2 2.2 29.6 5.6 28.6 11C27.6 16.4 21 20.6 16 25Z" fill="none" stroke="#ff8fab" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var CORACAO_SELO =
    '<svg viewBox="0 0 24 22" aria-hidden="true" focusable="false"><path d="M12 20.5C9 18 2 13.5 2 7.6 2 4.4 4.5 2 7.4 2c2 0 3.6 1.1 4.6 2.7C13 3.1 14.6 2 16.6 2 19.5 2 22 4.4 22 7.6c0 5.9-7 10.4-10 12.9z" fill="#fff"/></svg>';

  var ICONE_X =
    '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';

  /* ------------------------------------------------------------------ */
  /* Monta a seção                                                       */
  /* ------------------------------------------------------------------ */
  if (!secao.querySelector('h2')) {
    var titulo = document.createElement('h2');
    titulo.textContent = 'Potinho de bilhetinhos';
    secao.appendChild(titulo);
  }

  var dica = document.createElement('p');
  dica.className = 'dica pot-dica';
  dica.textContent = 'toca no potinho pra pegar um bilhete 💌';
  secao.appendChild(dica);

  var area = document.createElement('div');
  area.className = 'pot-area';
  area.innerHTML =
    CINTILAS.map(function (c) {
      return '<span class="pot-cintila" aria-hidden="true" style="left:' + c.x + ';top:' + c.y +
        ';font-size:' + c.s + 'px;animation-delay:' + c.d + '">' + c.t + '</span>';
    }).join('') +
    '<button type="button" class="pot-jarra" aria-haspopup="dialog">' +
      '<span class="pot-flutua"><span class="pot-balanco">' + SVG_POTE + '</span></span>' +
    '</button>';
  secao.appendChild(area);

  var contador = document.createElement('p');
  contador.className = 'pot-conta';
  contador.setAttribute('aria-live', 'polite');
  secao.appendChild(contador);

  var jarra = area.querySelector('.pot-jarra');
  var balanco = area.querySelector('.pot-balanco');
  var tampa = area.querySelector('.pot-tampa');
  if (!jarra || !balanco || !tampa) return;

  var elsPecas = area.querySelectorAll('.pot-estado');
  for (var ip = 0; ip < elsPecas.length; ip++) {
    var idx = +elsPecas[ip].getAttribute('data-peca');
    if (pecas[idx]) pecas[idx].el = elsPecas[ip];
  }
  // de cima pra baixo: as de cima saem primeiro
  var ordemTopo = pecas.filter(function (p) { return !!p.el; }).sort(function (a, b) { return a.y - b.y; });

  [balanco, tampa, contador].forEach(function (el) {
    el.addEventListener('animationend', function (e) {
      if (e.target !== el) return;
      el.classList.remove('pot-mexe', 'pot-abre', 'pot-pulsa');
    });
  });

  /* ------------------------------------------------------------------ */
  /* Estado do sorteio                                                   */
  /* ------------------------------------------------------------------ */
  var ordem = embaralha(TOTAL, -1);
  var sorteados = 0;
  var recemCheio = false;
  var ocupado = false;
  var sessao = null;
  var timerAbre = 0, timerRecarga = 0, timerTampa = 0, timerSuspiro = 0;

  function restantes() { return TOTAL - sorteados; }

  function visiveis(rest) {
    if (rest <= 0) return 0;
    return Math.max(1, Math.round(ordemTopo.length * rest / TOTAL));
  }

  function atualizaContador(pulsa) {
    var rest = restantes();
    var txt;
    if (rest === TOTAL) txt = recemCheio ? 'potinho cheinho de novo: ' + TOTAL + ' bilhetinhos pra você 💕' : TOTAL + ' bilhetinhos esperando por você 💕';
    else if (rest > 1) txt = 'ainda tem ' + rest + ' bilhetinhos aqui dentro 💌';
    else if (rest === 1) txt = 'só falta 1 bilhetinho… 🥺';
    else txt = 'Você leu todos! 🥹 Toca no potinho que eu encho ele de novo 💖';
    contador.textContent = txt;
    jarra.setAttribute('aria-label', rest > 0
      ? 'Pegar um bilhetinho do potinho (restam ' + rest + ')'
      : 'Encher o potinho de bilhetinhos de novo');
    area.classList.toggle('pot-vazio', rest === 0 && !sessao);
    if (pulsa) reinicia(contador, 'pot-pulsa');
  }
  atualizaContador(false);

  /* ------------------------------------------------------------------ */
  /* Pegar um bilhete                                                    */
  /* ------------------------------------------------------------------ */
  function sorteia() {
    if (ocupado || sessao) return;
    if (restantes() <= 0) {
      reabastece();
      return;
    }
    ocupado = true;
    recemCheio = false;

    var n = ordemTopo.length;
    var visAntes = visiveis(restantes());
    var idxBilhete = ordem[sorteados];
    sorteados++;
    var numero = sorteados;
    var visDepois = visiveis(restantes());

    var saem = ordemTopo.slice(n - visAntes, n - visDepois);
    var voa = saem[0] || null;
    var rectPeca = voa ? voa.el.getBoundingClientRect() : null;
    var cor = CORES[voa ? voa.cor : idxBilhete % CORES.length];

    reinicia(balanco, 'pot-mexe');
    reinicia(tampa, 'pot-abre');
    saem.forEach(function (p, k) {
      p.el.classList.add('pot-some');
      if (k === 0) p.el.classList.add('pot-voou');
    });
    atualizaContador(true);

    var rTampa = tampa.getBoundingClientRect();
    if (!reduz() && typeof window.explode === 'function') {
      window.explode(rTampa.left + rTampa.width / 2, rTampa.top + 4, 6);
    }

    timerAbre = setTimeout(function () {
      timerAbre = 0;
      abreBilhete(idxBilhete, numero, cor, rectPeca, rTampa);
    }, reduz() ? 80 : 190);
  }

  function reabastece() {
    ocupado = true;
    var ultimo = ordem[TOTAL - 1];
    ordem = embaralha(TOTAL, ultimo);
    sorteados = 0;
    recemCheio = true;

    var passoMs = reduz() ? 12 : 38;
    var deBaixo = ordemTopo.slice().reverse();

    reinicia(balanco, 'pot-mexe');
    tampa.classList.add('pot-destampada');
    // sem transição enquanto enche: senão a transição de "voltar" (tirar
    // .pot-some) briga com a animação de cair e os papeizinhos piscam
    deBaixo.forEach(function (p) {
      p.el.classList.add('pot-fixo');
      p.el.classList.remove('pot-some', 'pot-voou', 'pot-cai');
    });
    void area.getBoundingClientRect();
    deBaixo.forEach(function (p, k) {
      p.el.style.animationDelay = (120 + k * passoMs) + 'ms';
      p.el.classList.add('pot-cai');
    });

    var totalMs = 120 + deBaixo.length * passoMs + 850;
    clearTimeout(timerTampa);
    timerTampa = setTimeout(function () {
      timerTampa = 0;
      tampa.classList.remove('pot-destampada');
    }, Math.max(400, totalMs - 500));

    clearTimeout(timerRecarga);
    timerRecarga = setTimeout(function () {
      timerRecarga = 0;
      deBaixo.forEach(function (p) {
        p.el.classList.remove('pot-cai', 'pot-fixo');
        p.el.style.animationDelay = '';
      });
      ocupado = false;
    }, totalMs);

    atualizaContador(true);
    if (typeof window.explode === 'function') {
      var r = tampa.getBoundingClientRect();
      window.explode(r.left + r.width / 2, r.top, reduz() ? 8 : 16);
    }
  }

  jarra.addEventListener('click', function () {
    sorteia();
  });

  /* ------------------------------------------------------------------ */
  /* O bilhete aberto (sobreposição)                                     */
  /* ------------------------------------------------------------------ */
  function clonaCartao(cartao, W, H) {
    var c = cartao.cloneNode(true);
    c.removeAttribute('id');
    c.removeAttribute('tabindex');
    var comId = c.querySelectorAll('[id]');
    for (var i = 0; i < comId.length; i++) comId[i].removeAttribute('id');
    c.classList.add('pot-copia');
    c.setAttribute('aria-hidden', 'true');
    c.style.width = W + 'px';
    c.style.height = H + 'px';
    c.style.visibility = 'visible';
    return c;
  }

  function faiscas(s, x, y, qtd, raio, porCima) {
    var ov = s.ov;
    if (!ov || s.fechando) return;
    var cena = ov.querySelector('.pot-cena');
    var criadas = [];
    for (var i = 0; i < qtd; i++) {
      var f = document.createElement('span');
      f.className = 'pot-faisca';
      f.setAttribute('aria-hidden', 'true');
      f.textContent = FAISCAS[Math.floor(Math.random() * FAISCAS.length)];
      var ang = (i / qtd) * Math.PI * 2 + Math.random() * 0.5;
      var dist = raio * (0.75 + Math.random() * 0.5);
      f.style.left = x.toFixed(0) + 'px';
      f.style.top = y.toFixed(0) + 'px';
      f.style.fontSize = (14 + Math.random() * 12).toFixed(0) + 'px';
      f.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
      f.style.setProperty('--dy', (Math.sin(ang) * dist * 0.85 - 30).toFixed(0) + 'px');
      f.style.setProperty('--gira', (Math.random() * 80 - 40).toFixed(0) + 'deg');
      f.style.animationDelay = (Math.random() * 120).toFixed(0) + 'ms';
      if (porCima || !cena) ov.appendChild(f);
      else ov.insertBefore(f, cena);
      criadas.push(f);
    }
    s.timers.push(setTimeout(function () { criadas.forEach(tira); }, 1700));
  }

  function abreBilhete(idx, numero, cor, rectPeca, rTampa) {
    var reduzido = reduz();
    var ultimo = numero >= TOTAL;
    var s = { ov: null, anims: [], timers: [], fechando: false, teclas: null };
    sessao = s;

    var ov = document.createElement('div');
    ov.className = 'pot-overlay';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-labelledby', 'pot-num-atual');
    ov.setAttribute('aria-describedby', 'pot-texto-atual');
    ov.setAttribute('tabindex', '-1');
    ov.style.setProperty('--pot-forte', cor.forte);
    ov.style.setProperty('--pot-claro', cor.claro);
    ov.innerHTML =
      '<div class="pot-fundo"></div>' +
      '<div class="pot-cena">' +
        '<div class="pot-palco">' +
          '<div class="pot-cartao">' +
            '<p class="pot-num" id="pot-num-atual"></p>' +
            '<p class="pot-texto" id="pot-texto-atual"></p>' +
            (ultimo ? '<p class="pot-ps"></p>' : '') +
            '<p class="pot-assina"></p>' +
            RABISCO +
          '</div>' +
          '<span class="pot-fita" aria-hidden="true"></span>' +
          '<button type="button" class="pot-fechar" aria-label="Fechar bilhete">' + ICONE_X + '</button>' +
        '</div>' +
        '<div class="pot-acoes"><button type="button" class="pot-outro"></button></div>' +
      '</div>';

    var palco = ov.querySelector('.pot-palco');
    var cartao = ov.querySelector('.pot-cartao');
    var btnFechar = ov.querySelector('.pot-fechar');
    var btnOutro = ov.querySelector('.pot-outro');
    var elTexto = ov.querySelector('.pot-texto');

    ov.querySelector('.pot-num').textContent = 'bilhete ' + numero + ' de ' + TOTAL;
    elTexto.textContent = BILHETES[idx];
    if (BILHETES[idx].length > 78) elTexto.classList.add('pot-longo');
    if (ultimo) ov.querySelector('.pot-ps').textContent = PS_FINAL;
    ov.querySelector('.pot-assina').textContent = ASSINATURA;
    btnOutro.textContent = ultimo ? 'fechar 💖' : 'pegar outro 💌';

    document.body.appendChild(ov);
    s.ov = ov;
    area.classList.remove('pot-vazio');

    /* ---- interação ---- */
    ov.addEventListener('click', function (e) {
      e.stopPropagation(); // não dispara os corações da página por trás
      var alvo = e.target;
      if (!alvo || !alvo.closest) return;
      if (alvo.closest('.pot-fechar')) { fecha(false); return; }
      if (alvo.closest('.pot-outro')) { fecha(!ultimo); return; }
      if (alvo.closest('.pot-palco')) {
        if (ov.classList.contains('pot-aberto') && e.clientX) {
          faiscas(s, e.clientX, e.clientY, reduz() ? 3 : 6, 60, true);
        }
        return;
      }
      if (alvo.closest('.pot-acoes')) return;
      fecha(false);
    });
    ov.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    ov.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

    s.teclas = function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        fecha(false);
        return;
      }
      // setas/PageDown/espaço não rolam a página escondida atrás do bilhete
      // (espaço/Enter continuam apertando o botão que estiver em foco)
      var k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp' ||
          k === 'Home' || k === 'End' ||
          ((k === ' ' || k === 'Spacebar') && !(document.activeElement && document.activeElement.tagName === 'BUTTON'))) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Tab') {
        var foco = [btnFechar, btnOutro];
        var i = foco.indexOf(document.activeElement);
        e.preventDefault();
        var prox;
        if (e.shiftKey) prox = i <= 0 ? foco.length - 1 : i - 1;
        else prox = (i === -1 || i === foco.length - 1) ? 0 : i + 1;
        foco[prox].focus();
      }
    };
    document.addEventListener('keydown', s.teclas, true);

    /* ---- medidas ---- */
    var rc = cartao.getBoundingClientRect();
    var W = rc.width;
    var H = rc.height;
    cartao.style.width = W + 'px'; // garante que a cópia quebre as linhas igualzinho
    var pr = palco.getBoundingClientRect();

    ov.classList.add('pot-on'); // fundo aparece (transição)
    try { ov.focus({ preventScroll: true }); } catch (e) { ov.focus(); }

    var rot = +(Math.random() * 5 - 2.5).toFixed(2);
    var finalTransform = 'rotate(' + rot + 'deg)';

    if (typeof palco.animate !== 'function') {
      palco.style.transform = finalTransform;
      conclui();
      return;
    }

    /* ---- a dobra: duas metades do papel ---- */
    var dobra = document.createElement('div');
    dobra.className = 'pot-dobra';
    dobra.setAttribute('aria-hidden', 'true');

    var cima = document.createElement('div');
    cima.className = 'pot-metade pot-metade-cima';
    cima.appendChild(clonaCartao(cartao, W, H));

    var baixo = document.createElement('div');
    baixo.className = 'pot-metade pot-metade-baixo';
    var frente = document.createElement('div');
    frente.className = 'pot-face pot-frente';
    frente.appendChild(clonaCartao(cartao, W, H));
    var sombra = document.createElement('div');
    sombra.className = 'pot-sombra';
    frente.appendChild(sombra);
    var verso = document.createElement('div');
    verso.className = 'pot-face pot-verso';
    verso.innerHTML = '<span class="pot-selo">' + CORACAO_SELO + '</span><span class="pot-verso-nome">pra Cybele</span>';
    baixo.appendChild(frente);
    baixo.appendChild(verso);

    dobra.appendChild(cima);
    dobra.appendChild(baixo);
    palco.appendChild(dobra);
    cartao.style.visibility = 'hidden';

    // o papel dobrado ocupa a metade de cima do cartão
    palco.style.transformOrigin = '50% 25%';
    var H4 = H / 4;
    var cx = pr.left + pr.width / 2;
    var cy = pr.top + H4;

    var voo;
    var alturaTela = window.innerHeight || document.documentElement.clientHeight || 700;
    var pecaNaTela = rectPeca && rectPeca.bottom > -40 && rectPeca.top < alturaTela + 40;

    if (!reduzido && pecaNaTela) {
      var sx = rectPeca.left + rectPeca.width / 2 - cx;
      var sy = rectPeca.top + rectPeca.height / 2 - cy;
      var mx = rTampa.left + rTampa.width / 2 - cx;
      var my = rTampa.top - 28 - cy;
      voo = palco.animate([
        { transform: tr(sx, sy, 0.08, -28), opacity: 0, offset: 0, easing: 'ease-out' },
        { transform: tr(sx + (mx - sx) * 0.18, sy + (my - sy) * 0.18, 0.1, -20), opacity: 1, offset: 0.12, easing: 'cubic-bezier(.3,.6,.4,1)' },
        { transform: tr(mx, my, 0.22, 12), opacity: 1, offset: 0.42, easing: 'cubic-bezier(.35,0,.25,1)' },
        { transform: tr(0, H4, 1, rot), opacity: 1, offset: 1 }
      ], { duration: 950, fill: 'both' });
    } else {
      voo = palco.animate([
        { transform: tr(0, H4 + 18, 0.7, rot - 6), opacity: 0 },
        { transform: tr(0, H4, 1, rot), opacity: 1 }
      ], { duration: reduzido ? 260 : 420, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
    }
    s.anims.push(voo);

    voo.onfinish = function () {
      if (s.fechando) return;
      var dur = reduzido ? 450 : 820;
      var quadrosDobra = reduzido
        ? [{ transform: 'rotateX(180deg)' }, { transform: 'rotateX(0deg)' }]
        : [
            { transform: 'rotateX(180deg)', offset: 0, easing: 'cubic-bezier(.55,0,.3,1)' },
            { transform: 'rotateX(0deg)', offset: 0.74, easing: 'ease-out' },
            { transform: 'rotateX(9deg)', offset: 0.87, easing: 'ease-in' },
            { transform: 'rotateX(0deg)', offset: 1 }
          ];
      var a1 = baixo.animate(quadrosDobra, { duration: dur, fill: 'both', easing: reduzido ? 'ease-out' : 'linear' });
      var a2 = palco.animate([
        { transform: tr(0, H4, 1, rot), opacity: 1 },
        { transform: tr(0, 0, 1, rot), opacity: 1 }
      ], { duration: dur * 0.8, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
      var a3 = sombra.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: dur * 0.74, easing: 'ease-in', fill: 'both' });
      try { voo.cancel(); } catch (e) { /* ok */ }
      s.anims = [a1, a2, a3];
      a1.onfinish = function () {
        if (s.fechando) return;
        palco.style.transform = tr(0, 0, 1, rot);
        conclui();
      };
    };

    function conclui() {
      if (s.fechando) return;
      cartao.style.visibility = '';
      tira(ov.querySelector('.pot-dobra'));
      s.anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* ok */ } });
      s.anims = [];
      ov.classList.add('pot-aberto');
      var r = palco.getBoundingClientRect();
      faiscas(s, r.left + r.width / 2, r.top + r.height / 2, reduz() ? 6 : 14, Math.max(170, r.width * 0.62), false);
    }
  }

  function fecha(proximo) {
    var s = sessao;
    if (!s || s.fechando) return;
    s.fechando = true;
    s.timers.forEach(clearTimeout);
    s.timers = [];
    if (s.teclas) document.removeEventListener('keydown', s.teclas, true);

    var ov = s.ov;
    var focoDentro = !!ov && (ov.contains(document.activeElement) || document.activeElement === document.body);
    if (ov) ov.classList.add('pot-saindo');

    setTimeout(function () {
      s.anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* ok */ } });
      s.anims = [];
      tira(ov);
      if (sessao === s) sessao = null;
      ocupado = false;
      atualizaContador(false);

      if (focoDentro) {
        try { jarra.focus({ preventScroll: true }); } catch (e) { /* ok */ }
      }

      if (restantes() === 0) {
        // leu todos: festinha em volta do pote
        if (typeof window.explode === 'function') {
          var r = jarra.getBoundingClientRect();
          var qtd = reduz() ? 6 : 12;
          window.explode(r.left + r.width * 0.5, r.top + r.height * 0.3, qtd);
          setTimeout(function () { window.explode(r.left + r.width * 0.2, r.top + r.height * 0.5, qtd); }, 200);
          setTimeout(function () { window.explode(r.left + r.width * 0.8, r.top + r.height * 0.5, qtd); }, 380);
        }
      } else if (proximo) {
        sorteia();
      }
    }, reduz() ? 160 : 320);
  }

  /* ------------------------------------------------------------------ */
  /* Coraçõezinhos escapando do pote (só quando ele está na tela)        */
  /* ------------------------------------------------------------------ */
  function suspira() {
    if (sessao || ocupado || document.hidden) return;
    var el = document.createElement('span');
    el.className = 'pot-suspiro';
    el.setAttribute('aria-hidden', 'true');
    el.textContent = SUSPIROS[Math.floor(Math.random() * SUSPIROS.length)];
    el.style.left = (44 + Math.random() * 12).toFixed(1) + '%';
    el.style.setProperty('--dx', (Math.random() * 50 - 25).toFixed(0) + 'px');
    area.appendChild(el);
    setTimeout(function () { tira(el); }, 2800);
  }

  function ligaSuspiros() {
    area.classList.remove('pot-pausado');
    if (timerSuspiro) return;
    timerSuspiro = setInterval(suspira, reduz() ? 6000 : 3200);
  }

  function desligaSuspiros() {
    area.classList.add('pot-pausado');
    clearInterval(timerSuspiro);
    timerSuspiro = 0;
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) ligaSuspiros();
        else desligaSuspiros();
      });
    }, { threshold: 0.15 });
    io.observe(area);
  } else {
    ligaSuspiros();
  }
})();
