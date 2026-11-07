// Catálogo de móveis e bichinhos, desenhados em pixel art (SVG) na visão de cima 3/4.
// Cada móvel: lugar ('chao' | 'parede' | 'tapete'), w = largura, h = altura do desenho,
// fh = profundidade no chão (o "pé" que ocupa espaço). Tudo em pixels; 1 tile = 16 px.
//
// Móveis podem ter `modelos` (formatos diferentes) e cada modelo pode ter `girado`
// (a versão virada 90°, com suas próprias medidas). `variantes` são as cores/materiais.
//
// Para trocar um desenho por um sprite pronto (ex.: de um pacote do itch.io), coloque a
// imagem em assets/ e adicione `imagem: 'assets/arquivo.png'` na variante desejada.
window.Sprites = (function () {
  'use strict';
  const { esc, urlSegura, corValida } = window.U;

  const R = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
  const O = '#3b2219'; // contorno padrão

  // Desenha um "mapa de pixels" (array de strings) com uma paleta {letra: cor}.
  function mapa(linhas, cores, ox = 0, oy = 0) {
    let s = '';
    linhas.forEach((linha, y) => {
      let x = 0;
      while (x < linha.length) {
        const ch = linha[x];
        if (!cores[ch]) { x++; continue; }
        let fim = x;
        while (fim < linha.length && linha[fim] === ch) fim++;
        s += R(ox + x, oy + y, fim - x, 1, cores[ch]);
        x = fim;
      }
    });
    return s;
  }

  // Disco "pixelado" (linhas horizontais).
  function disco(cx, cy, r, cor) {
    let s = '';
    for (let y = Math.floor(cy - r); y < Math.ceil(cy + r); y++) {
      const dy = y + 0.5 - cy;
      const meia = Math.sqrt(Math.max(0, r * r - dy * dy));
      const x0 = Math.round(cx - meia), x1 = Math.round(cx + meia);
      if (x1 > x0) s += R(x0, y, x1 - x0, 1, cor);
    }
    return s;
  }

  // ---------- paletas ----------
  const MADEIRAS = {
    madeira: { nome: 'Madeira', o: '#3b2219', t: '#b07a4a', f: '#8a5a33', s: '#6b4226', h: '#c99062', amostra: '#8a5a33' },
    escura: { nome: 'Escura', o: '#22140f', t: '#6e4630', f: '#523424', s: '#3d2619', h: '#87593e', amostra: '#523424' },
    branca: { nome: 'Branca', o: '#4a3a35', t: '#f4f0e8', f: '#dcd5ca', s: '#b9b0a3', h: '#ffffff', amostra: '#dcd5ca' },
    rosa: { nome: 'Rosa', o: '#4a2a35', t: '#f7c1d4', f: '#e897b5', s: '#c87395', h: '#ffe0eb', amostra: '#e897b5' },
    menta: { nome: 'Menta', o: '#24403a', t: '#b8e8d4', f: '#8fd1b8', s: '#68ad94', h: '#e0fff2', amostra: '#8fd1b8' }
  };
  const TECIDOS = {
    vermelho: { nome: 'Vermelho', t: '#e8705a', f: '#c9452f', s: '#962f1f', amostra: '#c9452f' },
    amarelo: { nome: 'Mostarda', t: '#e3cf6f', f: '#c4ac45', s: '#93802b', amostra: '#c4ac45' },
    azul: { nome: 'Azul', t: '#a9cdf0', f: '#7aa8d8', s: '#5480b0', amostra: '#7aa8d8' },
    rosa: { nome: 'Rosa', t: '#ffbfd6', f: '#f28db2', s: '#c9648a', amostra: '#f28db2' },
    verde: { nome: 'Verde', t: '#9fd49a', f: '#6bb366', s: '#4a8a47', amostra: '#6bb366' },
    roxo: { nome: 'Roxo', t: '#c4a6ef', f: '#9a76d4', s: '#7253aa', amostra: '#9a76d4' },
    cinza: { nome: 'Cinza', t: '#c9c9cf', f: '#9d9da6', s: '#74747d', amostra: '#9d9da6' }
  };
  const VASOS = {
    terracota: { nome: 'Terracota', t: '#d97a4f', f: '#c0623b', s: '#9a4a2a', amostra: '#c0623b' },
    branco: { nome: 'Branco', t: '#ffffff', f: '#e4e0d8', s: '#bdb7ab', amostra: '#e4e0d8' },
    azul: { nome: 'Azul', t: '#6fa8e8', f: '#3f7cc4', s: '#2c5a94', amostra: '#3f7cc4' }
  };
  const SONS = {
    preto: { nome: 'Preto', t: '#4a4a4a', f: '#2b2b2b', amostra: '#2b2b2b' },
    prata: { nome: 'Prata', t: '#e0e3e8', f: '#a9adb3', amostra: '#a9adb3' },
    vermelho: { nome: 'Vermelho', t: '#e06a60', f: '#b8322a', amostra: '#b8322a' }
  };
  const MOLDURAS = {
    vermelho: { nome: 'Vermelho', c: '#c0392b', amostra: '#c0392b' },
    preto: { nome: 'Preto', c: '#2b2b2b', amostra: '#2b2b2b' },
    azul: { nome: 'Azul', c: '#2e86de', amostra: '#2e86de' },
    amarelo: { nome: 'Amarelo', c: '#e1b12c', amostra: '#e1b12c' }
  };
  const QUADROS = {
    montanha: { nome: 'Montanha', amostra: '#9fd8f0' },
    mar: { nome: 'Pôr do sol', amostra: '#ff7a45' },
    flor: { nome: 'Flor', amostra: '#e84393' }
  };
  const LUZINHAS = {
    colorido: { nome: 'Coloridas', cores: ['#ff5c5c', '#ffd23f', '#4ade80', '#60a5fa', '#e879f9'], amostra: '#ffd23f' },
    quente: { nome: 'Quentinhas', cores: ['#ffd27a', '#ffe9a8', '#ffc36b'], amostra: '#ffd27a' },
    rosa: { nome: 'Rosa', cores: ['#ff8fc8', '#ffc2e0', '#ff6fb5'], amostra: '#ff8fc8' }
  };
  const NEONS = {
    rosa: { nome: 'Rosa', c: '#ff4fb8', amostra: '#ff4fb8' },
    azul: { nome: 'Azul', c: '#3fd0ff', amostra: '#3fd0ff' },
    verde: { nome: 'Verde', c: '#5dff8a', amostra: '#5dff8a' }
  };
  const FERRO = { o: '#2a2a33', f: '#4a4a58', h: '#7a7a8c' };
  const CEU = { dia: '#8fd3f4', tarde: '#f6a65a', noite: '#1d2b53', neon: '#3b1a5e' };
  const LENCOL = '#efe9de';

  // Cortina balançando: cada linha da cortina desliza um pouco mais quanto mais embaixo (k = força do vento).
  function cortina(x, k, c) {
    let s = '';
    for (let y = 0; y < 24; y++) {
      const t = y / 23;
      const xx = x + Math.round(k * t * t);
      s += R(xx, y, 5, 1, c.f) + R(xx + 1, y, 1, 1, c.t) + R(xx + 3, y, 1, 1, c.s);
    }
    return s;
  }
  // 3 quadros alternados por CSS (classes vf0, vf1, vf2), como animação de pixel art.
  const cortinasAoVento = c => [0, 2, 4].map((k, i) =>
    `<g class="vf${i}">${cortina(0, k, c) + cortina(27, Math.round(k * 0.7), c)}</g>`).join('');

  // ---------- camas ----------
  // Travesseiros + cobertor da cama em pé (colchão de y=13 a 47).
  const roupaV = c => R(2, 14, 13, 9, '#cfc8bd') + R(3, 14, 11, 8, '#ffffff') + R(3, 21, 11, 1, '#e6e0d6')
    + R(17, 14, 13, 9, '#cfc8bd') + R(18, 14, 11, 8, '#ffffff') + R(18, 21, 11, 1, '#e6e0d6')
    + R(4, 15, 8, 1, '#f4f1eb') + R(19, 15, 8, 1, '#f4f1eb')
    + R(4, 19, 2, 1, '#e6e0d6') + R(11, 20, 2, 1, '#e6e0d6')
    + R(19, 19, 2, 1, '#e6e0d6') + R(26, 20, 2, 1, '#e6e0d6')
    + R(1, 25, 30, 22, c.f) + R(1, 25, 30, 4, c.t) + R(1, 29, 30, 1, c.s)
    + R(1, 25, 2, 22, c.s) + R(29, 25, 2, 22, c.s)
    + R(4, 26, 24, 1, 'rgba(255,255,255,.25)') + R(3, 43, 26, 1, c.s)
    + R(6, 34, 8, 1, c.t) + R(7, 35, 5, 1, c.t) + R(18, 40, 8, 1, c.t) + R(20, 41, 5, 1, c.t)
    + R(4, 31, 1, 2, 'rgba(255,255,255,.22)') + R(27, 38, 1, 2, 'rgba(0,0,0,.12)');

  function camaV(estilo, c) {
    const m = MADEIRAS.madeira, F = FERRO;
    if (estilo === 'ferro') {
      let s = R(0, 0, 2, 16, F.o) + R(30, 0, 2, 16, F.o) + R(0, 0, 2, 1, F.h) + R(30, 0, 2, 1, F.h)
        + R(2, 2, 28, 2, F.f) + R(2, 2, 28, 1, F.h) + R(2, 11, 28, 1, F.f);
      for (const x of [6, 11, 16, 21, 26]) s += R(x, 4, 1, 7, F.f);
      return s + R(0, 12, 32, 36, F.o) + R(1, 13, 30, 34, LENCOL) + roupaV(c)
        + R(0, 46, 32, 4, F.o) + R(1, 47, 30, 2, F.f) + R(1, 47, 30, 1, F.h)
        + R(0, 44, 2, 8, F.o) + R(30, 44, 2, 8, F.o) + R(0, 44, 2, 1, F.h) + R(30, 44, 2, 1, F.h);
    }
    if (estilo === 'futon') {
      return R(0, 12, 32, 38, '#5c4630') + R(0, 48, 32, 3, '#3b2a1c')
        + R(1, 13, 30, 34, LENCOL) + R(1, 46, 30, 2, '#d6cfc0') + roupaV(c);
    }
    return R(0, 0, 32, 14, m.o) + R(1, 1, 30, 12, m.f) + R(1, 1, 30, 2, m.t) + R(1, 1, 30, 1, m.h)
      + R(4, 5, 24, 1, m.s) + R(4, 8, 24, 1, m.s)
      + R(0, 12, 32, 36, m.o) + R(1, 13, 30, 34, LENCOL) + roupaV(c)
      + R(0, 46, 32, 5, m.o) + R(1, 47, 30, 2, m.f) + R(1, 47, 30, 1, m.h)
      + R(1, 50, 3, 2, m.o) + R(28, 50, 3, 2, m.o);
  }

  // Cama deitada (cabeceira à esquerda): colchão de x=7 a 44.
  const roupaH = c => R(7, 9, 37, 19, LENCOL)
    + R(8, 10, 8, 16, '#cfc8bd') + R(9, 10, 7, 15, '#ffffff') + R(15, 10, 1, 15, '#e6e0d6')
    + R(18, 9, 26, 19, c.f) + R(18, 9, 3, 19, c.t) + R(21, 9, 1, 19, c.s) + R(26, 14, 6, 1, c.t) + R(34, 20, 6, 1, c.t)
    + R(19, 10, 1, 16, 'rgba(255,255,255,.22)') + R(40, 10, 1, 17, c.s)
    + R(27, 15, 4, 1, c.t) + R(35, 21, 4, 1, c.t) + R(10, 12, 4, 1, '#f4f1eb')
    + R(7, 28, 11, 3, '#d9d2c4') + R(18, 28, 26, 4, c.s) + R(18, 28, 26, 1, c.f);

  function camaH(estilo, c) {
    const m = MADEIRAS.madeira, F = FERRO;
    if (estilo === 'ferro') {
      return R(6, 8, 39, 26, F.o) + roupaH(c) + R(6, 31, 39, 3, F.f) + R(6, 31, 39, 1, F.h)
        + R(0, 0, 2, 34, F.o) + R(5, 0, 2, 34, F.o) + R(0, 0, 7, 1, F.h)
        + R(2, 3, 3, 2, F.f) + R(2, 28, 3, 2, F.f) + R(2, 9, 3, 1, F.f) + R(2, 15, 3, 1, F.f) + R(2, 21, 3, 1, F.f)
        + R(44, 8, 2, 26, F.o) + R(46, 8, 2, 26, F.o) + R(44, 8, 4, 1, F.h) + R(44, 15, 4, 1, F.f) + R(44, 23, 4, 1, F.f)
        + R(7, 34, 2, 2, F.o) + R(41, 34, 2, 2, F.o);
    }
    if (estilo === 'futon') {
      return R(4, 7, 42, 27, '#5c4630') + R(4, 32, 42, 3, '#3b2a1c') + roupaH(c);
    }
    return R(6, 8, 39, 26, m.o) + roupaH(c) + R(6, 31, 39, 3, m.f) + R(6, 31, 39, 1, m.h)
      + R(0, 0, 7, 34, m.o) + R(1, 1, 5, 32, m.f) + R(1, 1, 5, 2, m.t) + R(1, 1, 5, 1, m.h) + R(3, 5, 1, 24, m.s)
      + R(44, 6, 4, 28, m.o) + R(45, 7, 2, 26, m.f) + R(45, 7, 2, 1, m.h)
      + R(7, 34, 2, 2, m.o) + R(41, 34, 2, 2, m.o);
  }

  // ---------- tapetes ----------
  function tapeteRet(w, h, c) {
    let s = R(0, 0, w, h, c.s) + R(1, 1, w - 2, h - 2, c.f) + R(3, 3, w - 6, h - 6, c.t) + R(5, 5, w - 10, h - 10, c.f);
    const cx = w / 2, cy = h / 2;
    s += R(cx - 4, cy - 4, 8, 8, c.t) + R(cx - 2, cy - 6, 4, 12, c.t) + R(cx - 6, cy - 2, 12, 4, c.t) + R(cx - 1, cy - 1, 2, 2, c.s);
    if (w >= h) for (let y = 2; y < h - 1; y += 3) s += R(-1, y, 1, 1, '#efe6d0') + R(w, y, 1, 1, '#efe6d0');
    else for (let x = 2; x < w - 1; x += 3) s += R(x, -1, 1, 1, '#efe6d0') + R(x, h, 1, 1, '#efe6d0');
    return s;
  }
  function tapeteRedondo(c) {
    return disco(16, 16, 16, c.s) + disco(16, 16, 15, c.f) + disco(16, 16, 12, c.t) + disco(16, 16, 9, c.f)
      + disco(16, 16, 5, c.t) + disco(16, 16, 2, c.s)
      + R(9, 4, 6, 1, 'rgba(255,255,255,.22)') + R(4, 12, 1, 5, 'rgba(255,255,255,.18)')
      + R(21, 26, 4, 1, 'rgba(0,0,0,.14)') + R(27, 15, 1, 5, 'rgba(0,0,0,.14)');
  }
  function passadeira(w, h, c) {
    const deitada = w > h;
    const largura = deitada ? h : w;
    let s = R(0, 0, w, h, c.s) + R(1, 1, w - 2, h - 2, '#efe6d0');
    [[3, c.f], [7, c.t], [11, c.f]].forEach(([d, cor]) => {
      s += deitada ? R(1, d, w - 2, 2, cor) : R(d, 1, 2, h - 2, cor);
    });
    for (let i = 2; i < largura - 1; i += 3) {
      s += deitada ? R(-1, i, 1, 1, '#efe6d0') + R(w, i, 1, 1, '#efe6d0') : R(i, -1, 1, 1, '#efe6d0') + R(i, h, 1, 1, '#efe6d0');
    }
    return s;
  }

  // ---------- assentos ----------
  const poltronaV = c => R(1, 0, 14, 10, O) + R(2, 1, 12, 8, c.f) + R(2, 1, 12, 2, c.t)
    + R(0, 8, 16, 10, O) + R(3, 9, 10, 4, c.t) + R(3, 13, 10, 3, c.f)
    + R(1, 8, 3, 9, c.f) + R(1, 8, 3, 1, c.t) + R(12, 8, 3, 9, c.f) + R(12, 8, 3, 1, c.t)
    + R(1, 16, 14, 1, c.s) + R(1, 18, 2, 2, O) + R(13, 18, 2, 2, O);
  const poltronaH = c => R(10, 0, 6, 18, O) + R(11, 1, 4, 16, c.f) + R(11, 1, 4, 1, c.t)
    + R(0, 7, 11, 11, O) + R(1, 8, 9, 4, c.t)
    + R(0, 11, 11, 7, O) + R(1, 12, 9, 4, c.f) + R(1, 12, 9, 1, c.t) + R(1, 16, 9, 1, c.s)
    + R(1, 18, 2, 2, O) + R(12, 18, 2, 2, O);
  const sofaV = c => R(0, 0, 32, 11, O) + R(1, 1, 30, 9, c.f) + R(1, 1, 30, 2, c.t) + R(16, 2, 1, 8, c.s)
    + R(0, 9, 32, 10, O) + R(3, 10, 26, 4, c.t) + R(16, 10, 1, 4, c.s) + R(3, 14, 26, 3, c.f)
    + R(0, 8, 4, 10, O) + R(1, 9, 2, 8, c.f) + R(1, 9, 2, 1, c.t)
    + R(28, 8, 4, 10, O) + R(29, 9, 2, 8, c.f) + R(29, 9, 2, 1, c.t)
    + R(1, 17, 30, 1, c.s) + R(2, 19, 2, 3, O) + R(28, 19, 2, 3, O);
  const sofaH = c => R(10, 0, 6, 30, O) + R(11, 1, 4, 28, c.f) + R(11, 1, 4, 1, c.t)
    + R(0, 0, 11, 5, O) + R(1, 1, 10, 3, c.t)
    + R(0, 4, 11, 22, O) + R(1, 5, 9, 9, c.t) + R(1, 15, 9, 9, c.t) + R(1, 14, 9, 1, c.s) + R(1, 5, 1, 19, c.f)
    + R(0, 25, 11, 5, O) + R(1, 26, 10, 2, c.t) + R(1, 28, 10, 1, c.f)
    + R(1, 30, 2, 2, O) + R(12, 30, 2, 2, O);
  function cadeiraV(c) {
    const m = MADEIRAS.madeira;
    return R(2, 0, 12, 7, m.o) + R(3, 1, 10, 5, m.f) + R(3, 1, 10, 1, m.h) + R(6, 3, 4, 1, m.s)
      + R(2, 7, 2, 6, m.o) + R(12, 7, 2, 6, m.o)
      + R(1, 12, 14, 5, m.o) + R(2, 13, 12, 3, c.f) + R(2, 13, 12, 1, c.t)
      + R(2, 17, 2, 5, m.o) + R(12, 17, 2, 5, m.o) + R(4, 19, 8, 1, m.s);
  }
  function cadeiraH(c) {
    const m = MADEIRAS.madeira;
    return R(11, 0, 3, 22, m.o) + R(12, 1, 1, 10, m.f)
      + R(1, 12, 13, 5, m.o) + R(2, 13, 11, 3, c.f) + R(2, 13, 11, 1, c.t)
      + R(2, 17, 2, 5, m.o) + R(10, 17, 2, 5, m.o) + R(4, 19, 6, 1, m.s);
  }

  // ---------- tons extras (brilho e sombra funda) a partir da paleta de tecido ----------
  function misturar(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const canal = (p, s) => (p >> s) & 255;
    return '#' + [16, 8, 0].map(s => Math.round(canal(pa, s) * (1 - k) + canal(pb, s) * k).toString(16).padStart(2, '0')).join('');
  }
  const brilho = c => misturar(c.t, '#ffffff', 0.45);
  const fundo = c => misturar(c.s, '#000000', 0.3);
  const PERNA = '#5a3a22';

  // Elipse "pixelada".
  function elipse(cx, cy, rx, ry, cor) {
    let s = '';
    for (let y = Math.floor(cy - ry); y < Math.ceil(cy + ry); y++) {
      const dy = (y + 0.5 - cy) / ry;
      const meia = rx * Math.sqrt(Math.max(0, 1 - dy * dy));
      const x0 = Math.round(cx - meia), x1 = Math.round(cx + meia);
      if (x1 > x0) s += R(x0, y, x1 - x0, 1, cor);
    }
    return s;
  }

  // ---------- pufes ----------
  function pufePera(c) {
    // costas mais altas à esquerda, assento afundado no meio, base larga
    const linhas = [
      '................',
      '....ooooo.......',
      '...ohhttto......',
      '..ohhttttfo.....',
      '..ohttttffoooo..',
      '.ohtttfffssttfo.',
      '.ohttffssssstfo.',
      'ohttfffssssttffo',
      'ohtfffffffffffso',
      'otffffffffffffso',
      'otffffffffffssdo',
      'offfffffffsssddo',
      '.offfffsssssddo.',
      '.ossssssdddddoo.',
      '..ooddddddddoo..',
      '....oooooooo....'
    ];
    return elipse(8, 15.5, 8, 1.8, 'rgba(0,0,0,.28)')
      + mapa(linhas, { o: O, h: brilho(c), t: c.t, f: c.f, s: c.s, d: fundo(c) });
  }
  function pufeRedondo(c) {
    // tampa grande e lateral baixa (visto de cima, a tampa aparece mais)
    return elipse(8, 14.6, 8, 1.8, 'rgba(0,0,0,.28)')
      + elipse(8, 11, 8, 4, O) + R(0, 5, 16, 6, O) + elipse(8, 5, 8, 4.6, O)
      + elipse(8, 11, 7, 3.2, c.f) + R(1, 5, 14, 6, c.f)
      + R(1, 6, 2, 6, c.t) + R(2, 7, 1, 4, brilho(c)) + R(11, 6, 3, 6, c.s) + R(13, 6, 1, 6, fundo(c))
      + elipse(8, 5.7, 7, 3.6, c.s) + elipse(8, 5, 7, 3.6, c.t) + elipse(6, 4, 3, 1.4, brilho(c))
      + R(7, 5, 2, 1, fundo(c));
  }
  function pufeQuadrado(c) {
    return R(1, 14, 15, 2, 'rgba(0,0,0,.28)')
      + R(0, 0, 16, 15, O) + R(1, 1, 14, 5, c.t) + R(1, 1, 14, 1, brilho(c))
      + R(4, 3, 1, 1, c.s) + R(8, 3, 1, 1, c.s) + R(11, 3, 1, 1, c.s) + R(4, 2, 1, 1, brilho(c))
      + R(1, 6, 14, 1, fundo(c)) + R(1, 7, 14, 6, c.f) + R(1, 7, 2, 6, c.t) + R(11, 7, 4, 6, c.s) + R(14, 7, 1, 6, fundo(c))
      + R(1, 12, 14, 1, fundo(c)) + R(1, 15, 2, 1, PERNA) + R(13, 15, 2, 1, PERNA);
  }

  // ---------- poltronas extras ----------
  function orelhudaV(c) {
    return R(1, 0, 14, 12, O) + R(2, 1, 12, 10, c.f) + R(2, 1, 12, 2, c.t) + R(3, 1, 10, 1, brilho(c))
      + R(5, 3, 1, 8, c.s) + R(10, 3, 1, 8, c.s) + R(6, 3, 1, 8, brilho(c))
      + R(0, 3, 3, 9, O) + R(1, 4, 1, 7, c.t) + R(13, 3, 3, 9, O) + R(14, 4, 1, 7, c.s)
      + R(0, 11, 16, 8, O) + R(3, 12, 10, 3, c.t) + R(3, 12, 10, 1, brilho(c)) + R(3, 15, 10, 3, c.f)
      + R(1, 10, 3, 8, c.f) + R(1, 10, 3, 1, c.t) + R(12, 10, 3, 8, c.s) + R(12, 10, 3, 1, c.f)
      + R(1, 17, 14, 1, fundo(c))
      + R(1, 19, 2, 3, PERNA) + R(13, 19, 2, 3, PERNA) + R(1, 19, 1, 3, '#7a5233');
  }
  function orelhudaH(c) {
    return R(10, 0, 6, 19, O) + R(11, 1, 4, 17, c.f) + R(11, 1, 4, 1, brilho(c)) + R(14, 1, 1, 17, c.s)
      + R(7, 2, 4, 9, O) + R(8, 3, 2, 7, c.t)
      + R(0, 11, 11, 8, O) + R(1, 12, 9, 3, c.t) + R(1, 12, 9, 1, brilho(c)) + R(1, 15, 9, 3, c.f)
      + R(0, 10, 11, 4, O) + R(1, 11, 9, 2, c.f) + R(1, 11, 9, 1, c.t) + R(1, 17, 9, 1, fundo(c))
      + R(1, 19, 2, 3, PERNA) + R(12, 19, 2, 3, PERNA);
  }
  function clubeV(c) {
    return R(2, 0, 12, 1, O) + R(1, 1, 14, 7, O) + R(2, 1, 12, 6, c.f) + R(2, 1, 12, 2, c.t) + R(3, 1, 10, 1, brilho(c))
      + R(4, 8, 8, 6, O) + R(4, 9, 8, 2, c.t) + R(5, 9, 6, 1, brilho(c)) + R(4, 11, 8, 2, c.f)
      + R(0, 5, 4, 10, O) + R(1, 6, 2, 8, c.t) + R(1, 6, 2, 1, brilho(c)) + R(3, 7, 1, 7, c.f)
      + R(12, 5, 4, 10, O) + R(13, 6, 2, 8, c.f) + R(13, 6, 2, 1, c.t) + R(14, 7, 1, 7, c.s)
      + R(1, 14, 14, 2, O) + R(2, 14, 12, 1, c.s)
      + R(2, 16, 2, 2, PERNA) + R(12, 16, 2, 2, PERNA);
  }
  function clubeH(c) {
    return R(10, 1, 6, 13, O) + R(11, 2, 4, 11, c.f) + R(11, 2, 4, 1, c.t) + R(14, 2, 1, 11, c.s)
      + R(0, 8, 11, 7, O) + R(1, 9, 9, 2, c.t) + R(1, 11, 9, 3, c.f)
      + R(0, 6, 12, 9, O) + R(1, 7, 10, 7, c.f) + R(1, 7, 10, 2, c.t) + R(2, 7, 8, 1, brilho(c)) + R(1, 13, 10, 1, fundo(c))
      + R(1, 15, 2, 3, PERNA) + R(10, 15, 2, 3, PERNA);
  }

  // ---------- vistos de costas (encosto na frente, assento aparecendo atrás) ----------
  const poltronaC = c => R(0, 2, 16, 9, O) + R(1, 3, 3, 7, c.f) + R(1, 3, 3, 1, c.t) + R(12, 3, 3, 7, c.f) + R(12, 3, 3, 1, c.t) + R(4, 4, 8, 4, c.t)
    + R(1, 6, 14, 12, O) + R(2, 7, 12, 10, c.s) + R(2, 7, 12, 1, c.f) + R(3, 8, 10, 1, c.f) + R(2, 16, 12, 1, fundo(c))
    + R(1, 18, 2, 2, O) + R(13, 18, 2, 2, O);
  const orelhudaC = c => R(0, 2, 16, 8, O) + R(1, 3, 2, 6, c.t) + R(13, 3, 2, 6, c.f) + R(3, 3, 10, 3, c.t)
    + R(1, 5, 14, 15, O) + R(2, 6, 12, 13, c.s) + R(2, 6, 12, 1, c.f) + R(3, 7, 10, 1, c.f) + R(2, 18, 12, 1, fundo(c))
    + R(1, 20, 2, 2, PERNA) + R(13, 20, 2, 2, PERNA);
  const clubeC = c => R(0, 1, 16, 8, O) + R(1, 2, 3, 6, c.t) + R(1, 2, 3, 1, brilho(c)) + R(12, 2, 3, 6, c.f) + R(4, 3, 8, 3, c.t)
    + R(1, 6, 14, 10, O) + R(2, 7, 12, 8, c.s) + R(2, 7, 12, 1, c.f) + R(2, 14, 12, 1, fundo(c))
    + R(2, 16, 2, 2, PERNA) + R(12, 16, 2, 2, PERNA);
  const sofaC = c => R(0, 1, 32, 9, O) + R(1, 2, 3, 7, c.t) + R(28, 2, 3, 7, c.f) + R(4, 3, 24, 4, c.t) + R(16, 3, 1, 4, c.s)
    + R(0, 7, 32, 13, O) + R(1, 8, 30, 11, c.s) + R(1, 8, 30, 1, c.f) + R(2, 9, 28, 1, c.f) + R(1, 17, 30, 1, fundo(c))
    + R(2, 20, 2, 2, O) + R(28, 20, 2, 2, O);
  function cadeiraC(c) {
    const m = MADEIRAS.madeira;
    return R(1, 5, 14, 5, m.o) + R(2, 6, 12, 3, c.f) + R(2, 6, 12, 1, c.t)
      + R(2, 8, 12, 8, m.o) + R(3, 9, 10, 6, m.s) + R(3, 9, 10, 1, m.f) + R(6, 11, 4, 1, m.f)
      + R(2, 16, 2, 6, m.o) + R(12, 16, 2, 6, m.o) + R(4, 19, 8, 1, m.s);
  }
  // Cama de costas: cabeceira perto de quem olha, pés lá no fundo.
  function camaC(estilo, c) {
    const m = MADEIRAS.madeira, F = FERRO;
    const corpo = R(1, 5, 30, 36, LENCOL)
      + R(1, 5, 30, 17, c.f) + R(1, 5, 2, 17, c.s) + R(29, 5, 2, 17, c.s) + R(6, 10, 8, 1, c.t) + R(18, 15, 8, 1, c.t)
      + R(1, 22, 30, 3, c.t) + R(1, 25, 30, 1, c.s)
      + R(2, 28, 13, 9, '#cfc8bd') + R(3, 29, 11, 7, '#ffffff') + R(17, 28, 13, 9, '#cfc8bd') + R(18, 29, 11, 7, '#ffffff');
    if (estilo === 'ferro') {
      let s = R(0, 0, 32, 6, F.o) + R(1, 1, 30, 2, F.f) + R(1, 1, 30, 1, F.h) + R(0, 4, 32, 38, F.o) + corpo
        + R(0, 38, 2, 14, F.o) + R(30, 38, 2, 14, F.o) + R(2, 40, 28, 2, F.f) + R(2, 40, 28, 1, F.h) + R(2, 49, 28, 1, F.f);
      for (const x of [6, 11, 16, 21, 26]) s += R(x, 42, 1, 7, F.f);
      return s;
    }
    if (estilo === 'futon') {
      return R(0, 4, 32, 46, '#5c4630') + R(0, 48, 32, 3, '#3b2a1c') + corpo + R(1, 41, 30, 6, LENCOL) + R(1, 46, 30, 2, '#d6cfc0');
    }
    return R(0, 0, 32, 6, m.o) + R(1, 1, 30, 3, m.f) + R(1, 1, 30, 1, m.h)
      + R(0, 4, 32, 38, m.o) + corpo
      + R(0, 38, 32, 14, m.o) + R(1, 39, 30, 12, m.s) + R(1, 39, 30, 1, m.f) + R(4, 43, 24, 1, m.f) + R(4, 47, 24, 1, m.f);
  }

  // ---------- plantas ----------
  const vaso = v => R(2, 16, 12, 3, O) + R(3, 19, 10, 7, O) + R(3, 17, 10, 1, v.t) + R(4, 19, 8, 6, v.f) + R(10, 19, 2, 6, v.s)
    + R(4, 20, 1, 4, v.t) + R(5, 24, 5, 1, 'rgba(0,0,0,.12)');

  // ---------- criados e armários ----------
  const criadoBase = (p, dy) => R(0, dy, 16, 18, p.o) + R(1, dy + 1, 14, 5, p.t) + R(1, dy + 1, 14, 1, p.h)
    + R(1, dy + 6, 14, 11, p.f) + R(1, dy + 11, 14, 1, p.s) + R(1, dy + 16, 14, 1, p.s)
    + R(2, dy + 7, 12, 1, p.t) + R(2, dy + 12, 12, 1, p.t) + R(2, dy + 9, 1, 1, p.s) + R(13, dy + 14, 1, 1, p.s)
    + R(7, dy + 8, 2, 1, p.o) + R(7, dy + 13, 2, 1, p.o)
    + R(1, dy + 18, 2, 2, p.o) + R(13, dy + 18, 2, 2, p.o);

  // ---------- catálogo ----------
  const CATALOGO = {
    cama: {
      nome: 'Cama', categoria: 'Móveis', lugar: 'chao', variantes: TECIDOS,
      modelos: {
        classica: { rotulo: 'Clássica', w: 32, fh: 48, h: 52, desenhar: c => camaV('classica', c), costas: c => camaC('classica', c), girado: { w: 48, fh: 32, h: 36, desenhar: c => camaH('classica', c) } },
        ferro: { rotulo: 'De ferro', w: 32, fh: 48, h: 52, desenhar: c => camaV('ferro', c), costas: c => camaC('ferro', c), girado: { w: 48, fh: 32, h: 36, desenhar: c => camaH('ferro', c) } },
        futon: { rotulo: 'Futon', w: 32, fh: 48, h: 52, desenhar: c => camaV('futon', c), costas: c => camaC('futon', c), girado: { w: 48, fh: 32, h: 36, desenhar: c => camaH('futon', c) } }
      }
    },

    criado: {
      nome: 'Criado-mudo', categoria: 'Móveis', lugar: 'chao', variantes: MADEIRAS,
      modelos: {
        gavetas: {
          rotulo: 'Gavetas', w: 16, fh: 16, h: 20,
          desenhar: p => criadoBase(p, 0) + R(9, 1, 4, 3, '#c0392b') + R(9, 1, 4, 1, '#e8766a') + R(10, 2, 2, 1, '#fff')
        },
        abajur: {
          rotulo: 'Com abajur', w: 16, fh: 16, h: 30,
          desenhar: p => criadoBase(p, 10) + R(7, 6, 2, 6, '#555') + R(4, 11, 8, 2, '#3a3a44')
            + R(3, 0, 10, 7, O) + R(4, 1, 8, 5, '#f5e6c8') + R(4, 1, 8, 1, '#fff6dd') + R(10, 1, 2, 5, '#d9c7a0') + R(5, 6, 6, 1, '#fff6a0'),
          brilhos: () => [{ x: 8, y: 7, r: 22, cor: '#ffd27a' }]
        },
        caixote: {
          rotulo: 'Caixote', w: 16, fh: 16, h: 18,
          desenhar: p => R(2, 0, 2, 6, '#c0392b') + R(4, 1, 2, 5, '#2e86de') + R(6, 0, 2, 6, '#f39c12') + R(9, 1, 2, 5, '#27ae60') + R(11, 0, 2, 6, '#8e44ad')
            + R(0, 2, 16, 16, p.o) + R(1, 3, 14, 3, '#2a170c') + R(2, 3, 2, 3, '#c0392b') + R(6, 3, 2, 3, '#f39c12') + R(11, 3, 2, 3, '#8e44ad')
            + R(1, 6, 14, 11, p.f) + R(1, 6, 14, 1, p.h) + R(1, 10, 14, 1, p.s) + R(1, 14, 14, 1, p.s) + R(3, 8, 10, 1, p.t)
        }
      }
    },

    estante: {
      nome: 'Estante de DVDs', categoria: 'Móveis', lugar: 'chao', w: 32, fh: 16, h: 44, variantes: MADEIRAS,
      unico: true, acao: 'estante', dica: () => 'Estante de DVDs',
      desenhar(p, ctx) {
        let s = R(0, 0, 32, 42, p.o) + R(1, 1, 30, 3, p.t) + R(1, 1, 30, 1, p.h) + R(1, 4, 30, 37, p.f)
          + R(3, 5, 26, 35, '#2a170c') + R(3, 5, 26, 1, 'rgba(0,0,0,.4)');
        const fundos = [13, 22, 31, 40];
        ctx.dvds.slice(0, 48).forEach((d, i) => {
          const x = 4 + (i % 12) * 2, yb = fundos[Math.floor(i / 12)];
          s += R(x, yb - d.h, 2, d.h, d.cor) + R(x + 1, yb - d.h, 1, d.h, 'rgba(0,0,0,.25)')
            + R(x, yb - d.h + 1, 1, 1, 'rgba(255,255,255,.55)') + R(x, yb - 2, 1, 1, 'rgba(255,255,255,.3)');
        });
        for (const y of [13, 22, 31]) s += R(3, y, 26, 2, p.f) + R(3, y, 26, 1, p.t);
        return s + R(3, 40, 26, 1, p.s) + R(1, 42, 3, 2, p.o) + R(28, 42, 3, 2, p.o);
      }
    },

    tv: {
      nome: 'TV de tubo', categoria: 'Móveis', lugar: 'chao', w: 32, fh: 16, h: 34, variantes: MADEIRAS,
      unico: true, acao: 'tv',
      dica: ctx => ctx.assistindo.titulo ? 'TV: ' + ctx.assistindo.titulo : 'TV: desligada',
      desenhar(p, ctx) {
        const a = ctx.assistindo;
        const ligada = !!a.titulo;
        const prog = window.Filmes ? window.Filmes.progressoDe(a) : Math.max(0, Math.min(100, Number(a.progresso) || 0));
        const tela = ligada
          ? R(9, 10, 11, 8, '#1f4f7a') + R(10, 12, 6, 1, '#c8ffc8') + R(10, 14, 8, 1, 'rgba(200,255,200,.6)')
            + R(9, 17, Math.round(11 * prog / 100), 1, '#7dff9a')
          : `<rect x="9" y="10" width="11" height="8" fill="#777" class="tv-estatica"/>`;
        return R(10, 0, 1, 2, '#999') + R(11, 2, 1, 2, '#999') + R(12, 4, 1, 2, '#999')
          + R(22, 0, 1, 2, '#999') + R(21, 2, 1, 2, '#999') + R(20, 4, 1, 2, '#999')
          + R(0, 20, 32, 12, p.o) + R(1, 21, 30, 4, p.t) + R(1, 21, 30, 1, p.h) + R(1, 25, 30, 6, p.f)
          + R(3, 26, 12, 4, p.s) + R(17, 26, 12, 4, p.s) + R(13, 27, 1, 2, p.h) + R(18, 27, 1, 2, p.h)
          + R(1, 32, 2, 2, p.o) + R(29, 32, 2, 2, p.o)
          + R(13, 5, 7, 2, '#333') + R(5, 6, 22, 17, '#1c1c1c') + R(6, 7, 20, 15, '#3a3a3a') + R(6, 7, 20, 1, '#5a5a5a')
          + R(8, 9, 13, 10, '#111') + tela
          + R(10, 10, 2, 1, 'rgba(255,255,255,.4)') + R(9, 10, 1, 1, '#111') + R(19, 17, 1, 1, '#111')
          + R(22, 10, 3, 2, '#888') + R(22, 13, 3, 2, '#888') + R(22, 17, 3, 1, '#222') + R(22, 19, 3, 1, '#222');
      },
      brilhos: ctx => ctx.assistindo.titulo ? [{ x: 15, y: 14, r: 18, cor: '#7fb8ff' }] : [],
      // de costas: a traseira da TV de tubo (com respiros e o cabo) em cima do rack
      costas(p) {
        return R(10, 0, 1, 2, '#999') + R(11, 2, 1, 2, '#999') + R(12, 4, 1, 2, '#999')
          + R(22, 0, 1, 2, '#999') + R(21, 2, 1, 2, '#999') + R(20, 4, 1, 2, '#999')
          + R(0, 20, 32, 12, p.o) + R(1, 21, 30, 4, p.t) + R(1, 21, 30, 1, p.h) + R(1, 25, 30, 6, p.f) + R(2, 27, 28, 1, p.s)
          + R(1, 32, 2, 2, p.o) + R(29, 32, 2, 2, p.o)
          + R(13, 5, 7, 2, '#333') + R(5, 6, 22, 17, '#1c1c1c') + R(6, 7, 20, 15, '#3a3a3a') + R(6, 7, 20, 1, '#5a5a5a')
          + R(9, 9, 14, 11, '#2e2e2e') + R(10, 11, 12, 1, '#222') + R(10, 13, 12, 1, '#222') + R(10, 15, 12, 1, '#222') + R(10, 17, 12, 1, '#222')
          + R(15, 22, 1, 3, '#111') + R(15, 24, 6, 1, '#111');
      },
      brilhosCostas: () => [],
      // de lado (virada pra esquerda): rack comprido pra trás e a TV de perfil, com a tela pra esquerda
      girado: {
        w: 16, fh: 32, h: 46,
        desenhar(p, ctx) {
          const ligada = !!(ctx && ctx.assistindo && ctx.assistindo.titulo);
          return R(7, 0, 1, 4, '#999') + R(9, 1, 1, 3, '#999')
            // rack
            + R(0, 16, 16, 28, p.o) + R(1, 17, 14, 20, p.t) + R(1, 17, 1, 20, p.h) + R(14, 17, 1, 20, p.s)
            + R(1, 37, 14, 6, p.f) + R(1, 37, 14, 1, p.h) + R(3, 39, 10, 3, p.s) + R(7, 40, 2, 1, p.h)
            + R(1, 43, 2, 3, p.o) + R(13, 43, 2, 3, p.o)
            // TV de perfil
            + R(3, 3, 11, 22, '#1c1c1c') + R(13, 6, 2, 16, '#1c1c1c')
            + R(4, 4, 9, 9, '#4a4a4a') + R(4, 4, 9, 1, '#6a6a6a') + R(13, 7, 1, 6, '#3a3a3a')
            + R(4, 13, 9, 11, '#3a3a3a') + R(4, 13, 9, 1, '#2a2a2a') + R(13, 13, 1, 8, '#2e2e2e')
            + R(9, 16, 2, 2, '#888') + R(9, 19, 2, 2, '#888')
            + R(3, 5, 1, 18, '#111') + (ligada ? R(3, 7, 1, 14, '#9fd0ff') : R(3, 7, 1, 14, '#777'));
        },
        brilhos: ctx => ctx.assistindo.titulo ? [{ x: 3, y: 14, r: 18, cor: '#7fb8ff' }] : []
      }
    },

    pc: {
      nome: 'Escrivaninha com PC', categoria: 'Móveis', lugar: 'chao', w: 32, fh: 16, h: 30, variantes: MADEIRAS,
      unico: true, acao: 'computador', dica: () => 'Computador: listas e diário',
      desenhar(p) {
        return R(0, 12, 32, 10, p.o) + R(1, 13, 30, 5, p.t) + R(1, 13, 30, 1, p.h) + R(1, 18, 30, 3, p.f)
          + R(0, 21, 4, 9, p.o) + R(1, 21, 2, 8, p.f) + R(28, 21, 4, 9, p.o) + R(29, 21, 2, 8, p.f)
          + R(17, 21, 11, 6, p.o) + R(18, 21, 9, 5, p.f) + R(21, 23, 3, 1, p.h)
          + R(5, 0, 17, 15, '#5c574a') + R(6, 1, 15, 13, '#d8d4c4') + R(6, 1, 15, 1, '#f0ecdf')
          + R(8, 3, 11, 8, '#333') + R(9, 4, 9, 6, '#0b7a75') + R(10, 5, 4, 3, '#c0c0c0') + R(10, 5, 4, 1, '#000080')
          + R(15, 5, 2, 1, '#ffec27') + R(9, 9, 9, 1, '#c0c0c0') + R(18, 12, 1, 1, '#39ff14') + R(11, 14, 5, 2, '#9a9686')
          + R(7, 16, 13, 2, '#8f8b7b') + R(7, 16, 13, 1, '#e6e2d4')
          + R(24, 11, 3, 4, '#8e2a1f') + R(24, 11, 3, 3, '#c0392b') + R(24, 11, 3, 1, '#e8766a') + R(27, 12, 1, 2, '#c0392b');
      },
      brilhos: () => [{ x: 13, y: 7, r: 14, cor: '#5fe0d0' }],
      // de costas: vê a traseira do monitor (com o cabo) e o painel de trás da mesa
      costas(p) {
        return R(0, 12, 32, 10, p.o) + R(1, 13, 30, 5, p.t) + R(1, 13, 30, 1, p.h)
          + R(0, 18, 32, 11, p.o) + R(1, 18, 30, 10, p.f) + R(1, 18, 30, 1, p.s) + R(2, 21, 28, 1, p.s) + R(2, 25, 28, 1, p.s)
          + R(1, 28, 3, 2, p.o) + R(28, 28, 3, 2, p.o)
          + R(5, 0, 17, 15, '#5c574a') + R(6, 1, 15, 13, '#c9c5b5') + R(6, 1, 15, 1, '#e6e2d4')
          + R(9, 3, 9, 7, '#b4b0a0') + R(10, 4, 7, 1, '#8f8b7b') + R(10, 6, 7, 1, '#8f8b7b') + R(10, 8, 7, 1, '#8f8b7b')
          + R(13, 14, 2, 1, '#222') + R(14, 15, 1, 4, '#222') + R(14, 18, 4, 1, '#222')
          + R(4, 11, 3, 4, '#8e2a1f') + R(4, 11, 3, 3, '#c0392b') + R(4, 11, 3, 1, '#e8766a') + R(3, 12, 1, 2, '#c0392b');
      },
      brilhosCostas: () => [],
      // de lado (virado pra esquerda): mesa comprida pra trás, monitor de perfil com a tela pra esquerda
      girado: {
        w: 16, fh: 32, h: 44,
        desenhar(p) {
          return R(0, 10, 16, 26, p.o) + R(1, 11, 14, 22, p.t) + R(1, 11, 1, 22, p.h) + R(14, 11, 1, 22, p.s)
            + R(1, 33, 14, 3, p.f) + R(1, 33, 14, 1, p.h)
            + R(0, 36, 3, 8, p.o) + R(1, 36, 1, 7, p.f) + R(13, 36, 3, 8, p.o) + R(14, 36, 1, 7, p.f)
            + R(3, 36, 10, 5, p.o) + R(4, 36, 8, 4, p.f) + R(6, 38, 4, 1, p.h)
            // monitor de perfil
            + R(5, 21, 6, 3, '#8f8b7b')
            + R(3, 1, 9, 21, '#5c574a') + R(11, 4, 3, 16, '#5c574a')           // contorno (atrás o tubo afina)
            + R(4, 2, 7, 8, '#f0ecdf') + R(11, 5, 2, 5, '#e6e2d4')             // tampa de cima
            + R(4, 10, 7, 11, '#d8d4c4') + R(11, 10, 2, 9, '#bdb9a9')          // lateral
            + R(4, 10, 7, 1, '#b9b5a5') + R(7, 13, 3, 1, '#9a9686') + R(7, 15, 3, 1, '#9a9686') + R(7, 17, 3, 1, '#9a9686')
            + R(3, 3, 1, 18, '#222') + R(3, 5, 1, 14, '#2fb8aa')               // a tela, vista de quina
            + R(5, 19, 1, 1, '#39ff14')
            // teclado na frente da tela e a caneca no fundo da mesa
            + R(1, 14, 2, 12, '#8f8b7b') + R(1, 14, 1, 12, '#e6e2d4')
            + R(9, 25, 4, 4, '#8e2a1f') + R(9, 25, 4, 3, '#c0392b') + R(9, 25, 4, 1, '#e8766a') + R(13, 26, 1, 2, '#c0392b');
        },
        brilhos: () => [{ x: 3, y: 10, r: 14, cor: '#5fe0d0' }]
      }
    },

    guardaroupa: {
      nome: 'Armário', categoria: 'Móveis', lugar: 'chao', variantes: MADEIRAS,
      modelos: {
        portas: {
          rotulo: 'Guarda-roupa', w: 32, fh: 16, h: 48,
          desenhar(p) {
            let s = R(0, 0, 32, 46, p.o) + R(1, 1, 30, 3, p.t) + R(1, 1, 30, 1, p.h) + R(1, 4, 30, 41, p.f) + R(15, 5, 2, 39, p.o);
            for (const x of [3, 18]) s += R(x, 6, 11, 1, p.h) + R(x, 6, 1, 37, p.h) + R(x, 42, 11, 1, p.s) + R(x + 10, 6, 1, 37, p.s);
            return s + R(12, 22, 1, 5, p.o) + R(19, 22, 1, 5, p.o) + R(1, 46, 3, 2, p.o) + R(28, 46, 3, 2, p.o);
          }
        },
        comoda: {
          rotulo: 'Cômoda', w: 32, fh: 16, h: 30,
          desenhar(p) {
            let s = R(0, 0, 32, 28, p.o) + R(1, 1, 30, 4, p.t) + R(1, 1, 30, 1, p.h) + R(1, 5, 30, 22, p.f);
            for (const y of [6, 13, 20]) s += R(2, y, 28, 6, p.f) + R(2, y, 28, 1, p.h) + R(2, y + 5, 28, 1, p.s) + R(9, y + 2, 2, 2, p.o) + R(21, y + 2, 2, 2, p.o);
            return s + R(1, 28, 3, 2, p.o) + R(28, 28, 3, 2, p.o)
              + R(22, -4, 6, 6, '#e8e4dc') + R(22, -4, 6, 1, '#fff') + R(4, -1, 9, 3, '#6a8fc2') + R(4, -1, 9, 1, '#a9c4ea');
          }
        },
        arara: {
          rotulo: 'Arara de roupas', w: 32, fh: 16, h: 40,
          desenhar() {
            const roupas = ['#c9452f', '#f2d16b', '#5480b0', '#f28db2', '#6bb366', '#2b2b33'];
            let s = R(1, 2, 2, 36, '#555') + R(29, 2, 2, 36, '#555') + R(1, 2, 30, 2, '#777') + R(1, 2, 30, 1, '#aaa')
              + R(0, 37, 6, 3, '#444') + R(26, 37, 6, 3, '#444');
            roupas.forEach((cor, k) => {
              const x = 4 + k * 4, alt = 14 + ((k * 7) % 9);
              s += R(x + 1, 4, 1, 2, '#333') + R(x, 6, 4, alt, cor) + R(x, 6, 1, alt, 'rgba(255,255,255,.25)') + R(x + 3, 6, 1, alt, 'rgba(0,0,0,.25)');
            });
            return s;
          }
        }
      }
    },

    poltrona: {
      nome: 'Assento', categoria: 'Móveis', lugar: 'chao', variantes: TECIDOS,
      modelos: {
        poltrona: { rotulo: 'Poltrona', w: 16, fh: 16, h: 20, desenhar: poltronaV, costas: poltronaC, girado: { w: 16, fh: 16, h: 20, desenhar: poltronaH } },
        orelhuda: { rotulo: 'Poltrona orelhuda', w: 16, fh: 16, h: 22, desenhar: orelhudaV, costas: orelhudaC, girado: { w: 16, fh: 16, h: 22, desenhar: orelhudaH } },
        clube: { rotulo: 'Poltrona clube', w: 16, fh: 16, h: 18, desenhar: clubeV, costas: clubeC, girado: { w: 16, fh: 16, h: 18, desenhar: clubeH } },
        sofa: { rotulo: 'Sofá', w: 32, fh: 16, h: 22, desenhar: sofaV, costas: sofaC, girado: { w: 16, fh: 32, h: 32, desenhar: sofaH } },
        cadeira: { rotulo: 'Cadeira', w: 16, fh: 16, h: 22, desenhar: cadeiraV, costas: cadeiraC, girado: { w: 16, fh: 16, h: 22, desenhar: cadeiraH } }
      }
    },

    pufe: {
      nome: 'Pufe', categoria: 'Móveis', lugar: 'chao', variantes: TECIDOS,
      modelos: {
        pera: { rotulo: 'Pera', w: 16, fh: 16, h: 17, desenhar: pufePera },
        redondo: { rotulo: 'Redondo', w: 16, fh: 16, h: 17, desenhar: pufeRedondo },
        quadrado: { rotulo: 'Quadrado', w: 16, fh: 16, h: 16, desenhar: pufeQuadrado }
      }
    },

    luminaria: {
      nome: 'Luminária', categoria: 'Decoração', lugar: 'chao', variantes: TECIDOS,
      modelos: {
        pe: {
          rotulo: 'De pé', w: 16, fh: 16, h: 34,
          desenhar: c => R(4, 31, 8, 3, '#2b2b2b') + R(5, 31, 6, 1, '#555') + R(7, 10, 2, 21, '#444') + R(7, 10, 1, 21, '#666')
            + R(2, 0, 12, 11, O) + R(3, 1, 10, 9, c.f) + R(3, 1, 10, 2, c.t) + R(11, 1, 2, 9, c.s) + R(4, 10, 8, 1, '#fff6a0'),
          brilhos: () => [{ x: 8, y: 12, r: 30, cor: '#ffd27a' }]
        },
        lava: {
          rotulo: 'Lâmpada de lava', w: 16, fh: 16, h: 24,
          desenhar: c => R(6, 2, 4, 2, '#3a3a44') + R(7, 1, 2, 1, '#3a3a44')
            + R(5, 4, 6, 15, '#2a2a33') + R(6, 4, 4, 14, c.t)
            + R(7, 6, 2, 3, c.f) + R(6, 11, 3, 2, c.f) + R(8, 14, 2, 3, c.f) + R(7, 16, 3, 2, c.f) + R(6, 5, 1, 4, 'rgba(255,255,255,.5)')
            + R(4, 18, 8, 5, '#3a3a44') + R(4, 18, 8, 1, '#6a6a78') + R(3, 22, 10, 2, '#2a2a33'),
          brilhos: (_, it) => [{ x: 8, y: 11, r: 22, cor: (TECIDOS[it.v] || TECIDOS.vermelho).f }]
        },
        globo: {
          rotulo: 'Globo de papel', w: 16, fh: 16, h: 34,
          desenhar: c => R(4, 31, 8, 3, '#2b2b2b') + R(5, 31, 6, 1, '#555') + R(7, 13, 2, 18, '#444') + R(7, 13, 1, 18, '#666')
            + disco(8, 7, 7, '#7a6a55') + disco(8, 7, 6, '#fff4d6') + R(2, 6, 12, 1, c.t) + R(3, 9, 10, 1, c.t) + R(7, 1, 1, 12, c.t)
            + R(5, 3, 2, 2, '#ffffff'),
          brilhos: () => [{ x: 8, y: 7, r: 30, cor: '#fff1c4' }]
        }
      }
    },

    som: {
      nome: 'Aparelho de som', categoria: 'Decoração', lugar: 'chao', w: 16, fh: 16, h: 18, variantes: SONS,
      unico: true, acao: 'musica',
      dica: ctx => ctx.tocando ? 'Som: tocando ♫ (clique pra pausar)' : 'Som: clique pra tocar a música do quarto',
      desenhar(c, ctx) {
        return R(3, 0, 10, 1, '#222') + R(3, 0, 1, 5, '#222') + R(12, 0, 1, 5, '#222')
          + R(0, 4, 16, 14, '#151515') + R(1, 5, 14, 12, c.f) + R(1, 5, 14, 2, c.t)
          + R(2, 8, 5, 5, '#111') + R(3, 9, 3, 3, '#555') + R(4, 10, 1, 1, '#999')
          + R(9, 8, 5, 5, '#111') + R(10, 9, 3, 3, '#555') + R(11, 10, 1, 1, '#999')
          + R(5, 14, 6, 2, '#111') + R(6, 14, 4, 1, ctx.tocando ? '#39ff14' : '#1a3a1a');
      }
    },

    planta: {
      nome: 'Planta', categoria: 'Decoração', lugar: 'chao', variantes: VASOS,
      modelos: {
        folhagem: {
          rotulo: 'Folhagem', w: 16, fh: 16, h: 26,
          desenhar: v => R(7, 6, 2, 12, '#2f6b2f')
            + R(2, 7, 6, 4, '#3f9a3f') + R(2, 7, 6, 1, '#5fc05f') + R(9, 3, 6, 4, '#3f9a3f') + R(9, 3, 6, 1, '#5fc05f')
            + R(1, 12, 6, 3, '#2f7a2f') + R(9, 9, 6, 4, '#4fb04f') + R(9, 9, 6, 1, '#7fd07f')
            + R(5, 0, 5, 4, '#4fb04f') + R(5, 0, 5, 1, '#7fd07f') + R(10, 14, 4, 3, '#2f7a2f') + vaso(v)
        },
        cacto: {
          rotulo: 'Cacto', w: 16, fh: 16, h: 26,
          desenhar: v => R(6, 3, 4, 14, '#3f8a4a') + R(6, 3, 1, 14, '#6cc077') + R(9, 3, 1, 14, '#2c6636')
            + R(2, 7, 2, 6, '#3f8a4a') + R(2, 7, 1, 6, '#6cc077') + R(2, 12, 4, 2, '#3f8a4a')
            + R(12, 5, 2, 6, '#3f8a4a') + R(13, 5, 1, 6, '#2c6636') + R(10, 10, 3, 2, '#3f8a4a')
            + R(7, 1, 2, 2, '#ff6fa8') + R(7, 1, 1, 1, '#ffc2dc')
            + R(7, 7, 1, 1, '#e8f5d0') + R(8, 11, 1, 1, '#e8f5d0') + R(3, 9, 1, 1, '#e8f5d0') + R(13, 7, 1, 1, '#e8f5d0') + vaso(v)
        },
        flores: {
          rotulo: 'Flores', w: 16, fh: 16, h: 26,
          desenhar: v => R(4, 6, 1, 11, '#2f7a2f') + R(8, 3, 1, 14, '#2f7a2f') + R(11, 7, 1, 10, '#2f7a2f')
            + R(5, 11, 2, 1, '#3f9a3f') + R(9, 9, 2, 1, '#3f9a3f') + R(9, 13, 2, 1, '#3f9a3f') + R(2, 13, 2, 1, '#3f9a3f')
            + R(3, 4, 3, 3, '#ff6fa8') + R(4, 5, 1, 1, '#ffec27') + R(7, 1, 3, 3, '#ffd23f') + R(8, 2, 1, 1, '#c0392b')
            + R(10, 5, 3, 3, '#9a76d4') + R(11, 6, 1, 1, '#fff') + vaso(v)
        }
      }
    },

    tapete: {
      nome: 'Tapete', categoria: 'Decoração', lugar: 'tapete', variantes: TECIDOS,
      modelos: {
        retangular: { rotulo: 'Retangular', w: 48, fh: 32, h: 32, desenhar: c => tapeteRet(48, 32, c), girado: { w: 32, fh: 48, h: 48, desenhar: c => tapeteRet(32, 48, c) } },
        redondo: { rotulo: 'Redondo', w: 32, fh: 32, h: 32, desenhar: tapeteRedondo },
        passadeira: { rotulo: 'Passadeira', w: 64, fh: 16, h: 16, desenhar: c => passadeira(64, 16, c), girado: { w: 16, fh: 64, h: 64, desenhar: c => passadeira(16, 64, c) } }
      }
    },

    // ----- parede -----
    janela: {
      nome: 'Janela', categoria: 'Parede', lugar: 'parede', w: 32, h: 28, variantes: TECIDOS,
      desenhar(c, ctx) {
        const ceu = CEU[ctx.luz] || CEU.dia;
        let vista = '';
        if (ctx.luz === 'dia') vista = R(5, 7, 5, 2, '#fff') + R(6, 6, 3, 1, '#fff') + R(22, 6, 3, 3, '#fff6a0') + R(19, 15, 6, 2, '#fff')
          + R(3, 21, 12, 2, '#8abf8b') + R(17, 21, 12, 2, '#8abf8b') + R(6, 20, 4, 1, '#b7dca3') + R(22, 20, 4, 1, '#b7dca3');
        else if (ctx.luz === 'tarde') vista = R(20, 13, 4, 4, '#ffde7a') + R(5, 10, 6, 1, '#ffd0a0') + R(3, 18, 12, 4, '#c96b3c') + R(17, 18, 12, 4, '#c96b3c');
        else vista = R(21, 6, 4, 4, '#f5f3c4') + R(21, 6, 1, 1, ceu) + R(6, 7, 1, 1, '#fff') + R(10, 14, 1, 1, '#fff') + R(25, 17, 1, 1, '#fff') + R(19, 12, 1, 1, '#cfd8ff');
        return R(0, 0, 32, 26, O) + R(1, 1, 30, 24, '#f4f1ea') + R(3, 3, 12, 20, ceu) + R(17, 3, 12, 20, ceu)
          + vista + R(3, 3, 12, 1, 'rgba(0,0,0,.15)') + R(17, 3, 12, 1, 'rgba(0,0,0,.15)')
          + R(5, 11, 1, 6, 'rgba(255,255,255,.4)') + R(6, 10, 2, 1, 'rgba(255,255,255,.4)')
          + R(19, 12, 1, 5, 'rgba(255,255,255,.35)') + R(20, 11, 2, 1, 'rgba(255,255,255,.35)')
          + R(-1, 24, 34, 4, O) + R(0, 24, 32, 3, '#e0dbd2') + R(0, 24, 32, 1, '#fff')
          + cortinasAoVento(c)
          + R(-2, 0, 36, 1, '#5a3a22');
      }
    },

    poster: {
      nome: 'Pôster favorito', categoria: 'Parede', lugar: 'parede', w: 16, h: 24, acao: 'posteres',
      dica: (ctx, it) => 'Pôster: ' + ((ctx.posteres[it.slot] || {}).titulo || '?'),
      desenhar(_, ctx, it) {
        const p = ctx.posteres[it.slot] || {};
        const img = urlSegura(p.imagem);
        const inicial = String(p.titulo || '?').trim().charAt(0).toUpperCase();
        const miolo = img
          ? `<image href="${esc(img)}" x="1" y="1" width="14" height="22" preserveAspectRatio="xMidYMid slice"/>`
          : `<text x="8" y="14" class="txt-poster-grande">${esc(inicial)}</text>`
            + R(3, 18, 10, 1, 'rgba(255,255,255,.55)') + R(4, 20, 8, 1, 'rgba(255,255,255,.35)');
        return R(1, 1, 16, 24, 'rgba(0,0,0,.25)') + R(0, 0, 16, 24, '#1a1a1a') + R(1, 1, 14, 22, corValida(p.cor, '#444444'))
          + miolo + R(1, 1, 14, 1, 'rgba(255,255,255,.25)') + R(5, -1, 6, 2, 'rgba(255,250,220,.85)');
      }
    },

    mural: {
      nome: 'Mural de recados', categoria: 'Parede', lugar: 'parede', w: 32, h: 24, unico: true, acao: 'mural',
      dica: () => 'Mural: recados e informações',
      desenhar(_, ctx) {
        const cores = ['#fff59d', '#f8bbd0', '#b3e5fc'];
        let s = R(1, 1, 32, 24, 'rgba(0,0,0,.2)') + R(0, 0, 32, 24, O) + R(1, 1, 30, 22, '#7a4a22') + R(2, 2, 28, 20, '#c98d4e') + R(2, 2, 28, 1, '#a86f38');
        ctx.recados.slice(0, 6).forEach((_, i) => {
          const x = 4 + (i % 3) * 9, y = 4 + Math.floor(i / 3) * 9;
          s += R(x + 1, y + 1, 7, 6, 'rgba(0,0,0,.25)') + R(x, y, 7, 6, cores[i % 3]) + R(x + 1, y + 3, 5, 1, 'rgba(0,0,0,.2)') + R(x + 3, y - 1, 2, 2, '#c62828');
        });
        return s;
      }
    },

    trofeus: {
      nome: 'Prateleira de troféus', categoria: 'Parede', lugar: 'parede', w: 24, h: 14, variantes: MADEIRAS,
      unico: true, acao: 'trofeus', dica: () => 'Troféus: conquistas',
      desenhar(p, ctx) {
        let s = '';
        for (let i = 0; i < Math.min(4, ctx.trofeusGanhos); i++) {
          const x = 1 + i * 6;
          s += R(x, 1, 5, 4, '#f5c518') + R(x, 1, 1, 4, '#fff3a0') + R(x + 4, 1, 1, 4, '#c9a00e') + R(x + 2, 5, 1, 2, '#c9a00e') + R(x + 1, 7, 3, 2, '#8a6d1e');
        }
        return s + R(0, 9, 24, 3, p.o) + R(1, 9, 22, 1, p.t) + R(1, 10, 22, 1, p.f) + R(1, 12, 22, 1, 'rgba(0,0,0,.2)')
          + R(3, 12, 1, 2, p.o) + R(20, 12, 1, 2, p.o);
      }
    },

    relogio: {
      nome: 'Relógio', categoria: 'Parede', lugar: 'parede', w: 12, h: 12, variantes: MOLDURAS,
      desenhar(v) {
        return R(3, 0, 6, 12, v.c) + R(0, 3, 12, 6, v.c) + R(1, 1, 10, 10, v.c)
          + R(3, 1, 6, 10, '#fff') + R(1, 3, 10, 6, '#fff') + R(2, 2, 8, 8, '#fff')
          + R(6, 3, 1, 4, '#222') + R(6, 6, 3, 1, '#222') + R(6, 6, 1, 1, '#c0392b');
      }
    },

    quadro: {
      nome: 'Quadrinho', categoria: 'Parede', lugar: 'parede', w: 16, h: 16, variantes: QUADROS,
      desenhar(_, ctx, it) {
        const tipo = QUADROS[it.v] ? it.v : 'montanha';
        let arte;
        if (tipo === 'mar') arte = R(2, 2, 12, 12, '#ffcf8a') + R(6, 6, 4, 3, '#ff7a45') + R(2, 9, 12, 5, '#2e6fb5') + R(3, 11, 3, 1, '#9fd0ff') + R(9, 12, 3, 1, '#9fd0ff');
        else if (tipo === 'flor') arte = R(2, 2, 12, 12, '#f5e6c8') + R(6, 10, 4, 4, '#2e86de') + R(7, 6, 1, 4, '#2f7a2f') + R(8, 7, 2, 1, '#3f9a3f') + R(6, 3, 3, 3, '#e84393') + R(7, 4, 1, 1, '#ffec27');
        else arte = R(2, 2, 12, 12, '#9fd8f0') + R(2, 9, 12, 5, '#4f9a4f') + R(5, 6, 4, 3, '#7a7a8a') + R(6, 5, 2, 1, '#fff') + R(9, 7, 4, 2, '#6a6a7a') + R(11, 3, 2, 2, '#ffec27');
        return R(1, 1, 16, 16, 'rgba(0,0,0,.25)') + R(0, 0, 16, 16, '#8a6d1e') + R(0, 0, 16, 1, '#d4af37') + R(0, 0, 1, 16, '#c9a33a') + R(1, 1, 14, 14, '#5e4a12') + arte;
      }
    },

    luzinhas: {
      nome: 'Varal de luzinhas', categoria: 'Parede', lugar: 'parede', w: 64, h: 8, variantes: LUZINHAS,
      desenhar(v) {
        let s = '';
        const yFio = x => 1 + Math.round(3 * Math.sin(Math.PI * (x % 32) / 32));
        for (let x = 0; x < 64; x++) s += R(x, yFio(x), 1, 1, '#2a3a2a');
        for (let k = 0; k < 10; k++) {
          const x = 3 + k * 6, cor = v.cores[k % v.cores.length];
          s += `<g class="lampada" style="animation-delay:${(k % 4) * 0.35}s">${R(x, yFio(x) + 1, 2, 3, cor) + R(x, yFio(x) + 1, 1, 1, '#fff')}</g>`;
        }
        return s;
      },
      brilhos(_, it) {
        const v = LUZINHAS[it.v] || LUZINHAS.colorido;
        const yFio = x => 1 + Math.round(3 * Math.sin(Math.PI * (x % 32) / 32));
        return Array.from({ length: 10 }, (_, k) => ({ x: 4 + k * 6, y: yFio(3 + k * 6) + 3, r: 6, cor: v.cores[k % v.cores.length] }));
      }
    },

    neon: {
      nome: 'Coração neon', categoria: 'Parede', lugar: 'parede', w: 16, h: 16, variantes: NEONS,
      desenhar(v) {
        const linhas = ['.cc...cc.', 'c..c.c..c', 'c...c...c', 'c.......c', '.c.....c.', '..c...c..', '...c.c...', '....c....'];
        return R(1, 2, 14, 12, 'rgba(0,0,0,.18)') + mapa(linhas, { c: v.c }, 3, 4) + mapa(linhas, { c: 'rgba(255,255,255,.45)' }, 3, 4);
      },
      brilhos: (_, it) => [{ x: 8, y: 8, r: 16, cor: (NEONS[it.v] || NEONS.rosa).c }]
    }
  };

  // ---------- bichinhos (mapas 16x12, olhando pra direita; 2 quadros de animação) ----------
  const PETS = {
    gato: {
      nome: 'Gato',
      cores: {
        laranja: { nome: 'Laranja', c: '#f0a04b', s: '#c4772d', b: '#ffe2b8', e: '#1a1a1a', p: '#ff8fa3' },
        preto: { nome: 'Preto', c: '#34343c', s: '#1f1f25', b: '#4a4a55', e: '#ffe14d', p: '#ff8fa3' },
        cinza: { nome: 'Cinza', c: '#9aa0a8', s: '#6f757d', b: '#d6d9dd', e: '#1a1a1a', p: '#ff8fa3' },
        branco: { nome: 'Branco', c: '#f4f1ea', s: '#c9c3b8', b: '#ffffff', e: '#3a7bd5', p: '#ff8fa3' }
      },
      a: ['................', '..........c...c.', '..........cc.cc.', '..........ccccc.', '.s........cecec.', '.s........ccpcc.',
        '..s.cccccccccc..', '...scccccccccs..', '....cccccccccs..', '....bbbbbbbbs...', '....c.c....c.c..', '....s.s....s.s..'],
      b: ['................', '..........c...c.', '..........cc.cc.', '..........ccccc.', '.s........cecec.', '.s........ccpcc.',
        '..s.cccccccccc..', '...scccccccccs..', '....cccccccccs..', '....bbbbbbbbs...', '.....cc....cc...', '.....ss....ss...']
    },
    cachorro: {
      nome: 'Cachorro',
      cores: {
        caramelo: { nome: 'Caramelo', c: '#c98a4b', s: '#8f5a2b', b: '#f2d2a9', e: '#1a1a1a', o: '#1a1a1a' },
        preto: { nome: 'Preto', c: '#2f2f35', s: '#1a1a1f', b: '#c9a27a', e: '#f5f5f5', o: '#000' },
        branco: { nome: 'Branco', c: '#f4f1ea', s: '#b9a48a', b: '#ffffff', e: '#1a1a1a', o: '#1a1a1a' }
      },
      a: ['................', '..........ccc...', '.........scccc..', '.........scceccc', 's........sccccco', '.s.......ccccc..',
        '..scccccccccc...', '..cccccccccccs..', '..cccccccccccs..', '..bbbbbbbbbbs...', '..c.c.....c.c...', '..s.s.....s.s...'],
      b: ['................', '..........ccc...', '.........scccc..', '.........scceccc', '.s.......sccccco', 's........ccccc..',
        '..scccccccccc...', '..cccccccccccs..', '..cccccccccccs..', '..bbbbbbbbbbs...', '...cc.....cc....', '...ss.....ss....']
    },
    coelho: {
      nome: 'Coelho',
      cores: {
        branco: { nome: 'Branco', c: '#f7f4ee', s: '#cdc6ba', b: '#ffffff', e: '#d6336c', p: '#ffb3c6', w: '#ffffff' },
        marrom: { nome: 'Marrom', c: '#a87650', s: '#7a5235', b: '#e8cdb0', e: '#1a1a1a', p: '#ffb3c6', w: '#f4efe6' },
        cinza: { nome: 'Cinza', c: '#a3a6ad', s: '#777a82', b: '#dadce0', e: '#1a1a1a', p: '#ffb3c6', w: '#f4f4f4' }
      },
      a: ['...........c.c..', '...........p.p..', '...........c.c..', '..........ccccc.', '..........ccecc.', '..........cccpc.',
        '.....cccccccccc.', '....ccccccccccc.', '...wccccccccccs.', '....bbbbbbbbbs..', '....cc.....cc...', '....ss.....ss...'],
      b: ['...........c.c..', '...........p.p..', '...........c.c..', '..........ccccc.', '..........ccecc.', '..........cccpc.',
        '.....cccccccccc.', '....ccccccccccc.', '...wccccccccccs.', '....bbbbbbbbbs..', '.....cc...cc....', '.....ss...ss....']
    },
    hamster: {
      nome: 'Hamster',
      cores: {
        dourado: { nome: 'Dourado', c: '#e7a85b', s: '#b77a35', b: '#fff1d6', e: '#1a1a1a', p: '#ff9fb0' },
        cinza: { nome: 'Cinza', c: '#b5b0a8', s: '#8a857d', b: '#f2efe9', e: '#1a1a1a', p: '#ff9fb0' }
      },
      a: ['................', '................', '................', '................', '..........c.c...', '.......cccccc...',
        '.....ccccccecc..', '....ccccccccccp.', '....bbbbbccccc..', '....bbbbbbbbbs..', '.....s.s..s.s...', '................'],
      b: ['................', '................', '................', '................', '..........c.c...', '.......cccccc...',
        '.....ccccccecc..', '....ccccccccccp.', '....bbbbbccccc..', '....bbbbbbbbbs..', '......s.s.s.s...', '................']
    }
  };

  const CORACAO = ['.pp.pp.', 'ppppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'];

  function variante(def, v) {
    if (!def.variantes) return {};
    return def.variantes[v] || def.variantes[Object.keys(def.variantes)[0]];
  }

  // Direções: 0 = de frente, 1 = virado pra esquerda, 2 = de costas, 3 = virado pra direita (espelho do 1).
  // Móveis sem desenho de costas (tapetes) só alternam entre 0 e 1.
  const DIRECOES = ['de frente', 'virado pra esquerda', 'de costas', 'virado pra direita'];
  const direcaoDe = it => (Number(it.r) || 0) % 4; // `r: true` (versão antiga) vira 1

  function modeloDe(it) {
    const def = CATALOGO[it.id];
    if (!def || !def.modelos) return null;
    const chave = def.modelos[it.m] ? it.m : Object.keys(def.modelos)[0];
    return { chave, m: def.modelos[chave] };
  }
  // O "girado" (de lado) e o "costas" ficam no modelo escolhido ou, em móveis sem modelos, no próprio móvel.
  const fonteGiro = it => { const md = modeloDe(it); return md ? md.m : CATALOGO[it.id] || {}; };
  const giros = it => { const g = fonteGiro(it); return !g.girado ? 1 : g.costas ? 4 : 2; };

  // Junta o móvel com o modelo escolhido e a direção para onde está virado.
  function forma(it) {
    const def = CATALOGO[it.id];
    if (!def) return null;
    const md = modeloDe(it);
    if (!md && !def.girado) return def;
    let f = md ? Object.assign({}, def, md.m, { modelo: md.chave, espelhar: false }) : Object.assign({}, def, { espelhar: false });
    const g = fonteGiro(it);
    const d = direcaoDe(it) % giros(it);
    f.direcao = d;
    if ((d === 1 || d === 3) && g.girado) f = Object.assign(f, g.girado, { espelhar: d === 3 });
    if (d === 2 && g.costas) { f.desenhar = g.costas; if (g.brilhosCostas !== undefined) f.brilhos = g.brilhosCostas; }
    return f;
  }
  const podeGirar = it => giros(it) > 1;
  const proximaDirecao = it => (direcaoDe(it) % giros(it) + 1) % giros(it);
  const nomeDirecao = it => DIRECOES[direcaoDe(it) % giros(it)];

  // Desenha um item (ou a imagem da variante, se houver).
  function arte(it, ctx) {
    const f = forma(it);
    const v = variante(f, it.v);
    const img = v.imagem && urlSegura(v.imagem);
    const desenho = img
      ? `<image href="${esc(img)}" width="${f.w}" height="${f.h}" style="image-rendering:pixelated"/>`
      : f.desenhar(v, ctx, it);
    return f.espelhar ? `<g transform="translate(${f.w},0) scale(-1,1)">${desenho}</g>` : desenho;
  }

  // Miniatura para o catálogo.
  function miniatura(id, v, ctx, m, r) {
    const it = { id, v, m, r, slot: 0 };
    const f = forma(it);
    const lado = Math.max(f.w, f.h) + 4;
    const ox = (lado - f.w) / 2, oy = (lado - f.h) / 2;
    return `<svg viewBox="${-ox} ${-oy} ${lado} ${lado}" shape-rendering="crispEdges" aria-hidden="true">${arte(it, ctx)}</svg>`;
  }

  return { CATALOGO, PETS, CORACAO, mapa, variante, forma, podeGirar, proximaDirecao, nomeDirecao, arte, miniatura, R };
})();
