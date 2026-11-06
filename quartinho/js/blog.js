// O "blog" de cada pessoa: fundo da página, estilo das caixas, fonte, título, cursor,
// rastro do mouse e stickers espalhados pela página. Tudo fica em perfil.blog.
window.Blog = (function () {
  'use strict';
  const { esc, urlSegura, corValida, limitar } = window.U;
  const { mapa } = window.Sprites;

  const PADRAO = {
    fundo: 'estrelas', cor1: '#14082e', cor2: '#ffffff', imagem: '', modoImagem: 'cobrir',
    caixa: 'pixel', fonte: 'vt323', titulo: '', estiloTitulo: 'glitter', letreiro: '',
    cursor: 'padrao', rastro: 'nenhum', stickers: []
  };

  const FUNDOS = {
    estrelas: '✦ Estrelinhas', coracoes: '♥ Corações', xadrez: 'Xadrez', bolinhas: 'Bolinhas',
    listras: 'Listras', diagonal: 'Diagonais', nuvens: 'Nuvens', grade: 'Grade neon',
    glitter: 'Glitter', gradiente: 'Degradê', liso: 'Cor lisa', imagem: '📁 Imagem'
  };
  const CAIXAS = { pixel: 'Pixel', win98: 'Windows 98', fofo: 'Fofinho', neon: 'Neon', caderno: 'Caderno', vidro: 'Vidro Y2K' };
  const FONTES = { vt323: 'VT323 (pixel)', pixel: 'Press Start', comic: 'Comic Sans', courier: 'Máquina de escrever', georgia: 'Diário (serifa)', verdana: 'Verdana' };
  const TITULOS = { glitter: '✨ Glitter', arcoiris: '🌈 Arco-íris', neon: '💡 Neon', tres: '🧊 3D', onda: '🌊 Ondinha', simples: 'Simples' };
  const CURSORES = { padrao: 'Normal', seta: 'Setinha', estrela: 'Estrela', coracao: 'Coração', varinha: 'Varinha' };
  const RASTROS = { nenhum: 'Nenhum', brilhos: '✦ Brilhinhos', coracoes: '♥ Corações', estrelas: '★ Estrelas', arcoiris: '🌈 Arco-íris' };

  // Temas prontos: mudam várias coisas de uma vez (não mexem nos stickers).
  const TEMAS = {
    galaxia: { nome: '🌌 Galáxia', fundo: 'glitter', cor1: '#1b0f3a', cor2: '#e7c6ff', caixa: 'vidro', fonte: 'comic', estiloTitulo: 'arcoiris', cursor: 'estrela', rastro: 'brilhos' },
    fofura: { nome: '🌸 Fofura', fundo: 'coracoes', cor1: '#ffd6e8', cor2: '#ff8fc0', caixa: 'fofo', fonte: 'comic', estiloTitulo: 'onda', cursor: 'coracao', rastro: 'coracoes' },
    emo: { nome: '🖤 Emo 2006', fundo: 'xadrez', cor1: '#111111', cor2: '#2a2a2a', caixa: 'neon', fonte: 'courier', estiloTitulo: 'neon', cursor: 'seta', rastro: 'estrelas' },
    fliperama: { nome: '🕹️ Fliperama', fundo: 'grade', cor1: '#0b0b18', cor2: '#00e5ff', caixa: 'neon', fonte: 'pixel', estiloTitulo: 'tres', cursor: 'seta', rastro: 'arcoiris' },
    caderninho: { nome: '📓 Caderninho', fundo: 'bolinhas', cor1: '#fff8e1', cor2: '#ffcc80', caixa: 'caderno', fonte: 'georgia', estiloTitulo: 'simples', cursor: 'varinha', rastro: 'nenhum' },
    windows: { nome: '💾 Windows 98', fundo: 'liso', cor1: '#008080', cor2: '#ffffff', caixa: 'win98', fonte: 'verdana', estiloTitulo: 'tres', cursor: 'padrao', rastro: 'nenhum' },
    ceu: { nome: '☁️ Céu', fundo: 'nuvens', cor1: '#8fd3ff', cor2: '#ffffff', caixa: 'vidro', fonte: 'verdana', estiloTitulo: 'glitter', cursor: 'coracao', rastro: 'brilhos' }
  };

  // ================= desenhos (pixel art original) =================
  const O = '#1a1020';
  const STICKERS = {
    estrela: { nome: 'Estrela', cores: { O, Y: '#ffd23f', W: '#fff7c2' }, mapa: [
      '       OO       ', '      OYYO      ', '      OYYO      ', '     OYWYYO     ',
      ' OOOOOYWYYOOOOO ', 'OYYYYYWYYYYYYYYO', ' OYYWWYYYYYYYYO ', '  OYYYYYYYYYYO  ',
      '   OYYYYYYYYO   ', '   OYYYYYYYYO   ', '  OYYYYOOYYYYO  ', '  OYYYO  OYYYO  ',
      ' OYYYO    OYYYO ', ' OYYO      OYYO ', ' OOO        OOO ']
    },
    coracao: { nome: 'Coração', cores: { O, R: '#ff4f81', W: '#ffd0dd', D: '#c42a5a' }, mapa: [
      '  OOOO    OOOO  ', ' ORRRRO  ORRRRO ', 'ORWWRRROORRRRRRO', 'ORWRRRRRRRRRRRRO',
      'ORRRRRRRRRRRRRDO', 'ORRRRRRRRRRRRRDO', ' ORRRRRRRRRRRDO ', '  ORRRRRRRRRDO  ',
      '   ORRRRRRRDO   ', '    ORRRRRDO    ', '     ORRRDO     ', '      ORDO      ', '       OO       ']
    },
    pipoca: { nome: 'Pipoca', cores: { P: '#c9a25a', W: '#fffdf0', Y: '#ffe066', O, R: '#e63946', B: '#ffffff' }, mapa: [
      '   PP  PPP PP   ', '  PWWPPWWWPWWP  ', ' PWWWWWWPWWWWWP ', ' PWWYWWWWWWYWWP ',
      '  PWWWWYWWWWWP  ', ' OOOOOOOOOOOOOO ', ' ORRBBRRBBRRBBO ', '  ORRBBRRBBRRO  ',
      '  ORRBBRRBBRRO  ', '  ORRBBRRBBRRO  ', '  ORRBBRRBBRRO  ', '   ORBBRRBBRO   ',
      '   ORBBRRBBRO   ', '   OOOOOOOOOO   ']
    },
    claquete: { nome: 'Claquete', cores: { O: '#000000', W: '#ffffff', K: '#2b2b2b', G: '#9a9a9a' }, mapa: [
      '  OOOOOOOOOOOOOO', '  OWWKKWWKKWWKKO', '  OKWWKKWWKKWWKO', '  OOOOOOOOOOOOOO',
      'OOOOOOOOOOOOOOO ', 'OWWKKWWKKWWKKWO ', 'OOOOOOOOOOOOOOO ', 'OKKKKKKKKKKKKKO ',
      'OKGGGGKKGGGGGKO ', 'OKKKKKKKKKKKKKO ', 'OKGGGKKKGGGGKKO ', 'OKKKKKKKKKKKKKO ',
      'OKGGGGGGKKGGGKO ', 'OKKKKKKKKKKKKKO ', 'OOOOOOOOOOOOOOO ']
    },
    vhs: { nome: 'Fita VHS', cores: { O: '#000000', K: '#2d2d34', L: '#ff7eb6', W: '#ffffff', G: '#b7b7c4', D: '#111111' }, mapa: [
      'OOOOOOOOOOOOOOOO', 'OKKKKKKKKKKKKKKO', 'OKLLLLLLLLLLLLKO', 'OKLWWWWWWWWWWLKO',
      'OKLLLLLLLLLLLLKO', 'OKKKKKKKKKKKKKKO', 'OKDDDDDDDDDDDDKO', 'OKDGGDDDDDDGGDKO',
      'OKDGGDDDDDDGGDKO', 'OKDDDDDDDDDDDDKO', 'OKKKKKKKKKKKKKKO', 'OOOOOOOOOOOOOOOO']
    },
    disquete: { nome: 'Disquete', cores: { O: '#0b1530', B: '#3a6fd8', S: '#c9d1e0', K: '#3d4454', W: '#ffffff', L: '#9fb4dc' }, mapa: [
      'OOOOOOOOOOOOOO  ', 'OBBOSSSSSSOBBBO ', 'OBBOSSKKSSOBBBBO', 'OBBOSSKKSSOBBBBO',
      'OBBOSSSSSSOBBBBO', 'OBBBOOOOOOBBBBBO', 'OBBBBBBBBBBBBBBO', 'OBBWWWWWWWWWWBBO',
      'OBBWLLLLLLLLWBBO', 'OBBWWWWWWWWWWBBO', 'OBBWLLLLLLWWWBBO', 'OBBWWWWWWWWWWBBO',
      'OBBWWWWWWWWWWBBO', 'OOOOOOOOOOOOOOOO']
    },
    cd: { nome: 'CD', desenho: () => desenhoCd() },
    smiley: { nome: 'Carinha', cores: { O, Y: '#ffd23f', W: '#fff7c2', K: '#1a1020' }, mapa: [
      '     OOOOOO     ', '   OOYYYYYYOO   ', '  OYYYYYYYYYYO  ', ' OYWWYYYYYYYYYO ',
      ' OYWYYKYYYYKYYO ', 'OYYYYYKYYYYKYYYO', 'OYYYYYKYYYYKYYYO', 'OYYYYYYYYYYYYYYO',
      'OYYYYYYYYYYYYYYO', 'OYYKYYYYYYYYKYYO', ' OYYKYYYYYYKYYO ', ' OYYYKKKKKKYYYO ',
      '  OYYYYYYYYYYO  ', '   OOYYYYYYOO   ', '     OOOOOO     ']
    },
    gatinho: { nome: 'Gatinho', cores: { O, G: '#f5a54a', P: '#ff9fb8', W: '#ffffff', K: '#1a1020' }, mapa: [
      ' OO          OO ', ' OPO        OPO ', ' OPPO      OPPO ', ' OPPPOOOOOOPPPO ',
      ' OGGGGGGGGGGGGO ', 'OGGGGGGGGGGGGGGO', 'OGGKKGGGGGGKKGGO', 'OGGKWGGGGGGKWGGO',
      'OGGGGGGGGGGGGGGO', 'OGPPGGGKKGGGPPGO', 'OGGGGGKGGKGGGGGO', ' OGGGGGGGGGGGGO ',
      '  OGGGGGGGGGGO  ', '   OOOOOOOOOO   ']
    },
    arcoiris: { nome: 'Arco-íris', desenho: () => desenhoArcoIris() },
    nuvem: { nome: 'Nuvem', cores: { O: '#5b7fb8', W: '#ffffff', B: '#d4e4ff' }, mapa: [
      '     OOOO       ', '    OWWWWO OO   ', '  OOWWWWWWOWWO  ', ' OWWWWWWWWWWWWO ',
      'OWWWWWWWWWWWWWWO', 'OWWWWWWWWWWWWWBO', ' OBBWWWWWWWWBBO ', '  OOOOOOOOOOOO  ']
    },
    raio: { nome: 'Raio', cores: { O, Y: '#ffe14d', W: '#fffbd1' }, mapa: [
      '     OOOOOOO', '    OYWWYYO ', '    OYWYYO  ', '   OYWYYO   ', '   OYYYYOOOO',
      '  OYYYYYYYYO', '  OOOOOYYYO ', '     OYYYO  ', '    OYYYO   ', '    OYYO    ',
      '   OYYO     ', '   OYO      ', '   OO       ']
    },
    flor: { nome: 'Flor', cores: { O, P: '#ff8ad8', Y: '#ffd23f', G: '#3fae5a' }, mapa: [
      '     OOOO     ', '    OPPPPO    ', ' OOOOPPPPOOOO ', 'OPPPOPPPPOPPPO',
      'OPPPPOYYOPPPPO', 'OPPPPYYYYPPPPO', 'OPPPPYYYYPPPPO', ' OPPPOYYOPPPO ',
      ' OPPPPOOPPPPO ', '  OOPPPPPPOO  ', '    OPPOPPO   ', '     OOGOO    ',
      '   GG  G      ', '    GGGG      ', '      G       ']
    },
    fantasma: { nome: 'Fantasminha', cores: { O: '#3a3550', W: '#ffffff', K: '#1a1020', B: '#d9d6ef' }, mapa: [
      '    OOOOOO    ', '  OOWWWWWWOO  ', ' OWWWWWWWWWWO ', ' OWWKKWWKKWWO ',
      'OWWWKKWWKKWWWO', 'OWWWWWWWWWWWWO', 'OWWWWWKKWWWWBO', 'OWWWWWKKWWWWBO',
      'OWWWWWWWWWWWBO', 'OWWWWWWWWWWBBO', 'OWWOWWWOWWWOBO', 'OWO OWO OWO OO', 'OO   O   O    ']
    },
    alien: { nome: 'Alien', cores: { O, G: '#7ee06c', K: '#1a1020', W: '#ffffff', D: '#4fb043' }, mapa: [
      '    OOOOOO    ', '  OOGGGGGGOO  ', ' OGGGGGGGGGGO ', 'OGGGGGGGGGGGGO',
      'OGKKKGGGGKKKGO', 'OGKWKKGGKKWKGO', 'OGGKKKGGKKKGGO', ' OGGGGGGGGGDO ',
      '  OGGGOOGGDO  ', '   OGGGGGDO   ', '    OOOOOO    ']
    },
    coroa: { nome: 'Coroa', cores: { O, Y: '#ffc93c', R: '#e63946', B: '#4cc9f0', W: '#fff4c2' }, mapa: [
      'O     OO     O', 'OO   OYYO   OO', 'OYO OYYYYO OYO', 'OYYOYYYYYYOYYO',
      'OYYYYYYRYYYYYO', 'OYBYYYRRRYYYBO', 'OYYYYYYRYYYYYO', 'OYYYYYYYYYYYYO',
      'OOOOOOOOOOOOOO', 'OWYWYWYWYWYWYO', 'OOOOOOOOOOOOOO']
    },
    oculos: { nome: 'Óculos 3D', cores: { O: '#000000', W: '#ffffff', R: '#ff3b3b', C: '#29d3ff' }, mapa: [
      'OOOOOOOOOOOOOOOO', 'OWWWWWWWWWWWWWWO', 'OWRRRRRWWCCCCCWO', 'OWRRRRRWWCCCCCWO',
      'OWRRRRRWWCCCCCWO', 'OWWWWWWOOWWWWWWO', 'OOOOOOO  OOOOOOO']
    },
    lua: { nome: 'Lua', cores: { O, Y: '#fff1a6', D: '#e6cf6a' }, mapa: [
      '    OOOO    ', '  OOYYYO    ', ' OYYYYO     ', ' OYYYO      ', 'OYYYDO      ',
      'OYYYDO      ', 'OYYYDO      ', 'OYYYYO      ', ' OYYYDO    O', ' OYYYYDOOOO ',
      '  OOYYYYYO  ', '    OOOOO   ']
    },
    controle: { nome: 'Controle', cores: { O, G: '#8d8da6', K: '#2b2b38', R: '#ff4f81', B: '#4cc9f0', L: '#c4c4d6' }, mapa: [
      '  OOOOOOOOOOOO  ', ' OLLLLLLLLLLLLO ', 'OGGGGGGGGGGGGGGO', 'OGGKGGGGGGGGRGGO',
      'OGKKKGGGGGGRGBGO', 'OGGKGGGOOGGGBGGO', 'OGGGGGOGGOGGGGGO', ' OGGGO    OGGGO ', '  OOO      OOO  ']
    }
  };

  function desenhoCd() {
    let s = '';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 8, d = Math.hypot(dx, dy);
      if (d > 7.6 || d < 1.6) continue;
      let c = '#d7dbe6';
      if (d > 6.8) c = '#5a5f73';
      else if (d < 2.6) c = '#9aa0b3';
      else {
        const ang = Math.atan2(dy, dx);
        const brilho = Math.abs(Math.sin(ang * 2 + 0.6));
        if (brilho > 0.92) c = '#ffffff';
        else if (brilho > 0.75) c = ['#ff9fd5', '#ffe680', '#9ff0ff', '#c4a8ff'][Math.floor(d) % 4];
      }
      s += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`;
    }
    return { svg: s, w: 16, h: 16 };
  }
  function desenhoArcoIris() {
    const cores = ['#ff4f6d', '#ff9f43', '#ffe14d', '#5ee17a', '#4cc9f0', '#9b6dff'];
    let s = '';
    for (let y = 0; y < 10; y++) for (let x = 0; x < 18; x++) {
      const d = Math.hypot(x + 0.5 - 9, y + 0.5 - 10);
      if (d > 9.2 || d < 3) continue;
      const i = Math.floor((9.2 - d) / 1.04);
      s += `<rect x="${x}" y="${y}" width="1" height="1" fill="${cores[Math.min(i, 5)]}"/>`;
    }
    // nuvenzinhas nas pontas
    s += mapa([' WW ', 'WWWW'], { W: '#ffffff' }, 0, 8) + mapa([' WW ', 'WWWW'], { W: '#ffffff' }, 14, 8);
    return { svg: s, w: 18, h: 10 };
  }

  function desenhoDe(id) {
    const st = STICKERS[id];
    if (!st) return null;
    if (st._d) return st._d;
    st._d = st.desenho
      ? st.desenho()
      : { svg: mapa(st.mapa, st.cores), w: Math.max(...st.mapa.map(l => l.length)), h: st.mapa.length };
    return st._d;
  }
  const svgSticker = (id, escala = 3) => {
    const d = desenhoDe(id);
    return d ? `<svg viewBox="0 0 ${d.w} ${d.h}" width="${d.w * escala}" height="${d.h * escala}" shape-rendering="crispEdges" aria-hidden="true">${d.svg}</svg>` : '';
  };

  // Selinhos estilo "blinkie" (88x31) com texto piscando.
  const ESTILOS_SELO = [
    { fundo: '#000000', cor: '#ff66cc', c2: '#ffffff', borda: '#ff66cc' },
    { fundo: '#fff1f8', cor: '#ff3e9a', c2: '#9b6dff', borda: '#ff9fd5' },
    { fundo: '#0b1a2e', cor: '#39ff14', c2: '#00e5ff', borda: '#39ff14' },
    { fundo: '#ffe14d', cor: '#e63946', c2: '#000000', borda: '#e63946' },
    { fundo: '#2b1a12', cor: '#ffb000', c2: '#fff1d0', borda: '#ff7043' },
    { fundo: '#e6f4ff', cor: '#2e86de', c2: '#ff66cc', borda: '#4fc3f7' }
  ];
  const SELOS_PRONTOS = [
    { texto: '♥ eu amo cinema ♥', e: 0 }, { texto: 'pipoca addict', e: 3 }, { texto: 'não me dê spoiler!', e: 2 },
    { texto: 'seja gentil, rebobine', e: 4 }, { texto: 'maratonista oficial', e: 1 }, { texto: 'team terror', e: 2 },
    { texto: 'chorei no final', e: 5 }, { texto: 'NEW!!!', e: 3 }
  ];
  const htmlSelo = (texto, e) => {
    const st = ESTILOS_SELO[e] || ESTILOS_SELO[0];
    return `<span class="selo" style="background:${st.fundo};color:${st.cor};border-color:${st.borda};--c2:${st.c2}">${esc(texto)}</span>`;
  };

  function htmlConteudo(s) {
    if (s.id === 'selo') return htmlSelo(s.texto, s.e);
    if (s.id === 'imagem') { const u = urlSegura(s.src); return u ? `<img src="${esc(u)}" alt="" draggable="false">` : ''; }
    return svgSticker(s.id);
  }

  // ================= fundos =================
  const svgUrl = (w, h, corpo) => `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" shape-rendering="crispEdges">${corpo}</svg>`)}")`;
  const ret = (x, y, w, h, c, op) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${op ? ` opacity="${op}"` : ''}/>`;
  const mais = (x, y, c) => ret(x, y - 1, 1, 3, c) + ret(x - 1, y, 3, 1, c);

  function misturar(c1, c2, t) {
    const n1 = parseInt(c1.slice(1), 16), n2 = parseInt(c2.slice(1), 16);
    const canal = s => Math.round(((n1 >> s) & 255) * (1 - t) + ((n2 >> s) & 255) * t);
    return '#' + [16, 8, 0].map(s => canal(s).toString(16).padStart(2, '0')).join('');
  }

  // Nuvens em pixel art, cada uma de um tamanho e formato, espalhadas ao acaso (mas sempre igual
  // pra mesma "semente"). Quem passa da borda do azulejo continua do outro lado, pra emenda não aparecer.
  function nuvensAleatorias(w, h, semente, qtd, min, max, cor, sombra, brilho) {
    let st = semente;
    const rnd = () => (st = (st * 16807) % 2147483647) / 2147483647;
    const P = 4; // tamanho de cada "pixel" da nuvem
    let s = '';
    for (let i = 0; i < qtd; i++) {
      const larg = Math.round(min + rnd() * (max - min)); // em pixels de nuvem
      // bolhas: uma base comprida e algumas bolotas por cima, de tamanhos variados
      // base arredondada (mais da metade da elipse fica visível, então os lados são redondos)
      const rb = Math.max(2.5, larg * (0.2 + rnd() * 0.08));
      const bolhas = [{ x: larg / 2, y: -rb * 0.45, rx: larg / 2, ry: rb }];
      const nb = 2 + Math.floor(rnd() * 3);
      for (let b = 0; b < nb; b++) {
        const r = larg * (0.14 + rnd() * 0.14);
        const x = r + rnd() * Math.max(0, larg - 2 * r); // não deixa a bolota sair pelos lados
        bolhas.push({ x, y: -rb * 0.9 - r * (0.1 + rnd() * 0.45), rx: r, ry: r });
      }
      const topo = Math.floor(Math.min(...bolhas.map(b => b.y - b.ry))) - 1;
      const dentro = (x, y) => y <= 0 && bolhas.some(b => ((x + 0.5 - b.x) / b.rx) ** 2 + ((y + 0.5 - b.y) / b.ry) ** 2 <= 1);
      let corpo = '';
      for (let y = topo; y <= 0; y++) {
        let x = 0, run = null, ini = 0;
        const fechar = fim => { if (run) corpo += `<rect x="${ini * P}" y="${(y - topo) * P}" width="${(fim - ini) * P}" height="${P}" fill="${run}"/>`; };
        for (; x <= larg; x++) {
          let c = null;
          if (dentro(x, y)) c = y >= -1 ? sombra : !dentro(x, y - 1) && x < larg * 0.6 ? brilho : cor;
          if (c !== run) { fechar(x); run = c; ini = x; }
        }
        fechar(x);
      }
      const cw = (larg + 1) * P, ch = (1 - topo) * P;
      const px = Math.floor(rnd() * w / P) * P, py = Math.floor(rnd() * h / P) * P;
      // desenha de novo do outro lado quando encosta na borda
      for (const dx of [0, -w]) for (const dy of [0, -h]) {
        if ((dx && px + cw <= w) || (dy && py + ch <= h)) continue;
        s += `<g transform="translate(${px + dx} ${py + dy})">${corpo}</g>`;
      }
    }
    return s;
  }

  // Devolve o CSS de "background" do fundo escolhido.
  function cssFundo(b, miniatura) {
    const a = corValida(b.cor1, PADRAO.cor1), c = corValida(b.cor2, PADRAO.cor2);
    switch (b.fundo) {
      case 'coracoes': {
        const m = [' CC CC ', 'CCCCCCC', 'CCCCCCC', ' CCCCC ', '  CCC  ', '   C   '];
        return `${svgUrl(32, 32, ret(0, 0, 32, 32, a) + mapa(m, { C: c }, 4, 5) + mapa(m, { C: c }, 20, 21))} 0 0 / 32px 32px`;
      }
      case 'xadrez': return `${svgUrl(32, 32, ret(0, 0, 32, 32, a) + ret(0, 0, 16, 16, c) + ret(16, 16, 16, 16, c))} 0 0 / 32px 32px`;
      case 'bolinhas': {
        const m = [' CC ', 'CCCC', 'CCCC', ' CC '];
        return `${svgUrl(24, 24, ret(0, 0, 24, 24, a) + mapa(m, { C: c }, 4, 4) + mapa(m, { C: c }, 16, 16))} 0 0 / 24px 24px`;
      }
      case 'listras': return `repeating-linear-gradient(90deg, ${a} 0 14px, ${c} 14px 28px)`;
      case 'diagonal': return `repeating-linear-gradient(45deg, ${a} 0 14px, ${c} 14px 28px)`;
      case 'nuvens': {
        // duas camadas de tamanhos "quebrados": juntas, levam muito tempo pra repetir o mesmo desenho
        const f = miniatura ? 0.25 : 1;
        const sombra = misturar(c, a, 0.28), brilho = misturar(c, '#ffffff', 0.6);
        const camada = (w, h, semente, qtd, min, max) =>
          `${svgUrl(w, h, nuvensAleatorias(w, h, semente, qtd, min, max, c, sombra, brilho))} 0 0 / ${Math.round(w * f)}px ${Math.round(h * f)}px`;
        return `${camada(1560, 1180, 11, 11, 18, 36)}, ${camada(1210, 950, 29, 12, 8, 17)}, linear-gradient(${a}, ${a})`;
      }
      case 'grade': return `linear-gradient(${c}66 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, ${c}66 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(${a}, ${a})`;
      case 'glitter': {
        let s = ret(0, 0, 48, 48, a);
        let semente = 7;
        const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 26; i++) s += ret(Math.floor(rnd() * 48), Math.floor(rnd() * 48), 1, 1, rnd() > 0.7 ? '#ffffff' : c, (0.35 + rnd() * 0.65).toFixed(2));
        s += mais(10, 12, '#ffffff') + mais(36, 34, c);
        return `${svgUrl(48, 48, s)} 0 0 / 48px 48px`;
      }
      case 'gradiente': return `linear-gradient(180deg, ${a}, ${c})`;
      case 'liso': return a;
      case 'imagem': {
        const u = urlSegura(b.imagem);
        if (!u) return a;
        return b.modoImagem === 'repetir' ? `url("${u}") 0 0 / auto repeat, ${a}` : `url("${u}") center / cover no-repeat, ${a}`;
      }
      default: { // estrelas
        let s = ret(0, 0, 96, 96, a);
        s += mais(14, 20, c) + mais(70, 60, '#ffec27') + ret(40, 10, 1, 1, c) + ret(88, 30, 1, 1, '#9cf') +
          ret(30, 74, 1, 1, '#ffec27') + ret(56, 40, 1, 1, c) + ret(8, 58, 1, 1, '#9cf') + ret(80, 86, 1, 1, c);
        return `${svgUrl(96, 96, s)} 0 0 / 96px 96px`;
      }
    }
  }
  const luminancia = hex => {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  };
  function fundoClaro(b) {
    const a = corValida(b.cor1, PADRAO.cor1), c = corValida(b.cor2, PADRAO.cor2);
    if (b.fundo === 'gradiente' || b.fundo === 'listras' || b.fundo === 'diagonal' || b.fundo === 'xadrez') return (luminancia(a) + luminancia(c)) / 2 > 0.6;
    if (b.fundo === 'imagem' && urlSegura(b.imagem)) return false; // em imagem, o texto ganha sombra
    return luminancia(a) > 0.6;
  }

  // ================= cursores =================
  const MAPA_SETA = ['O          ', 'OO         ', 'OCO        ', 'OCCO       ', 'OCCCO      ', 'OCCCCO     ', 'OCCCCCO    ',
    'OCCCCCCO   ', 'OCCCCCCCO  ', 'OCCCCCOOOO ', 'OCCOCCO    ', 'OCO OCCO   ', 'OO  OCCO   ', '     OCCO  ', '     OOO   '];
  const MAPA_VARINHA = ['  Y             ', ' YWY            ', 'YWWWY           ', ' YWY            ', '  Y  O          ',
    '    OWO         ', '    OWWO        ', '     OKKO       ', '      OKKO      ', '       OKKO     ', '        OKKO    ',
    '         OKKO   ', '          OKKO  ', '           OKO  ', '            O   '];
  const cacheCursor = {};
  function svgCursor(tipo, destaque) {
    if (tipo === 'seta') return { svg: mapa(MAPA_SETA, { O: '#000', C: destaque }), w: 16, h: 16, x: 0, y: 0 };
    if (tipo === 'varinha') return { svg: mapa(MAPA_VARINHA, { Y: '#ffd23f', W: '#fffbd1', O: '#000', K: destaque }), w: 16, h: 16, x: 2, y: 2 };
    const d = desenhoDe(tipo);
    return d ? { svg: d.svg, w: d.w, h: d.h, x: Math.floor(d.w / 2), y: Math.floor(d.h / 2) } : null;
  }
  // Os navegadores aceitam melhor PNG que SVG como cursor: desenha uma vez num canvas e guarda.
  function cursorCss(tipo, destaque, pronto) {
    if (!CURSORES[tipo] || tipo === 'padrao') return '';
    const chave = tipo + destaque;
    if (cacheCursor[chave]) return cacheCursor[chave];
    const c = svgCursor(tipo, destaque);
    if (!c) return '';
    const img = new Image();
    img.onload = () => {
      const tela = document.createElement('canvas');
      tela.width = 32; tela.height = 32;
      const g = tela.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, 32, 32);
      cacheCursor[chave] = `url("${tela.toDataURL('image/png')}") ${c.x * 2} ${c.y * 2}, auto`;
      pronto(cacheCursor[chave]);
    };
    const lado = Math.max(c.w, c.h);
    img.src = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="32" height="32" shape-rendering="crispEdges">${c.svg}</svg>`);
    return '';
  }

  // ================= rastro do mouse =================
  let rastroAtual = 'nenhum', ultimoRastro = 0, rastrosVivos = 0;
  const semMovimento = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.addEventListener('pointermove', e => {
    if (rastroAtual === 'nenhum' || e.pointerType !== 'mouse' || semMovimento()) return;
    const agora = performance.now();
    if (agora - ultimoRastro < 45 || rastrosVivos > 30) return;
    ultimoRastro = agora;
    const sp = document.createElement('span');
    sp.className = 'rastro';
    sp.setAttribute('aria-hidden', 'true');
    const cores = { brilhos: ['#fff6a8', '#ffffff', 'var(--destaque)'], coracoes: ['#ff4f81', '#ff9fd5', 'var(--destaque)'], estrelas: ['#ffd23f', '#fff', '#9cf'], arcoiris: ['#ff4f6d', '#ff9f43', '#ffe14d', '#5ee17a', '#4cc9f0', '#9b6dff'] }[rastroAtual];
    sp.textContent = { brilhos: '✦', coracoes: '♥', estrelas: '★', arcoiris: '●' }[rastroAtual];
    sp.style.color = cores[Math.floor(Math.random() * cores.length)];
    sp.style.left = e.clientX + (Math.random() * 10 - 5) + 'px';
    sp.style.top = e.clientY + 8 + 'px';
    rastrosVivos++;
    sp.addEventListener('animationend', () => { sp.remove(); rastrosVivos--; });
    document.body.appendChild(sp);
  }, { passive: true });

  // ================= aplicar o tema na página =================
  const blogDe = p => Object.assign({}, PADRAO, p.blog || {});
  // Garante que p.blog existe (pra poder editar) com todos os campos.
  function garantir(p) {
    p.blog = Object.assign({}, PADRAO, p.blog || {});
    p.blog.stickers = Array.isArray(p.blog.stickers) ? p.blog.stickers : [];
    return p.blog;
  }

  let perfilAtual = null, editando = false, selecionado = null, aoSalvar = null;

  function aplicar(p) {
    perfilAtual = p;
    const b = blogDe(p);
    const corpo = document.body;
    corpo.classList.add('tema-blog');
    corpo.dataset.caixa = CAIXAS[b.caixa] ? b.caixa : 'pixel';
    corpo.dataset.fonte = FONTES[b.fonte] ? b.fonte : 'vt323';
    corpo.classList.toggle('fundo-claro', fundoClaro(b));
    corpo.classList.toggle('fundo-glitter', b.fundo === 'glitter');
    corpo.classList.toggle('fundo-fixo', b.fundo === 'imagem' || b.fundo === 'gradiente');
    corpo.style.background = cssFundo(b);
    const destaque = corValida(p.corDestaque, '#ff66cc');
    corpo.style.cursor = cursorCss(b.cursor, destaque, css => {
      if (perfilAtual === p && corpo.classList.contains('tema-blog') && blogDe(p).cursor === b.cursor) corpo.style.cursor = css;
    });
    rastroAtual = RASTROS[b.rastro] ? b.rastro : 'nenhum';
    renderCabecalho(p, b);
    renderStickers();
  }

  function limpar() {
    const corpo = document.body;
    corpo.classList.remove('tema-blog', 'fundo-claro', 'fundo-glitter', 'fundo-fixo', 'editando-stickers');
    delete corpo.dataset.caixa;
    delete corpo.dataset.fonte;
    corpo.style.background = '';
    corpo.style.cursor = '';
    rastroAtual = 'nenhum';
    document.querySelectorAll('.camada-stickers').forEach(c => c.remove());
    perfilAtual = null;
  }

  const tituloDe = (p, b) => b.titulo || `~ quartinho de ${p.nome} ~`;
  function renderCabecalho(p, b) {
    const cab = document.getElementById('cabecalho-blog');
    if (!cab) return;
    const estilo = TITULOS[b.estiloTitulo] ? b.estiloTitulo : 'glitter';
    const texto = tituloDe(p, b);
    const miolo = estilo === 'onda'
      ? [...texto].map((ch, i) => `<span class="letra" style="--i:${i}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')
      : `<span class="tt">${esc(texto)}</span>`;
    const faisca = estilo === 'glitter' ? '<span class="faisca" aria-hidden="true">✦</span>' : '';
    cab.innerHTML = `<h2 class="titulo-blog titulo-${estilo}" aria-label="${esc(texto)}">${faisca}${miolo}${faisca}</h2>`;
  }

  // ================= stickers =================
  const ANCORAS = { topo: '#cabecalho-blog', quarto: '.area-quarto', lateral: '#lateral', pagina: '.pagina' };
  const elAncora = a => document.querySelector(ANCORAS[a] || ANCORAS.pagina);

  function renderStickers() {
    document.querySelectorAll('.camada-stickers').forEach(c => c.remove());
    if (!perfilAtual) return;
    const lista = blogDe(perfilAtual).stickers || [];
    const camadas = {};
    lista.forEach(s => {
      const a = ANCORAS[s.a] ? s.a : 'pagina';
      if (!camadas[a]) {
        const el = elAncora(a);
        if (!el) return;
        camadas[a] = document.createElement('div');
        camadas[a].className = 'camada-stickers';
        camadas[a].setAttribute('aria-hidden', 'true');
        el.appendChild(camadas[a]);
      }
      const d = document.createElement('div');
      d.className = 'sticker' + (s.id === 'selo' || s.id === 'imagem' ? '' : ' sticker-pixel') + (s.uid === selecionado ? ' sel' : '');
      d.dataset.uid = s.uid;
      d.style.left = limitar(Number(s.x) || 0, -20, 120) + '%';
      d.style.top = limitar(Number(s.y) || 0, -20, 120) + '%';
      d.style.transform = `translate(-50%, -50%) rotate(${limitar(Number(s.r) || 0, -180, 180)}deg) scale(calc(${limitar(Number(s.s) || 1, 0.5, 3)} * var(--esc-sticker, 1)))`;
      d.innerHTML = htmlConteudo(s);
      camadas[a].appendChild(d);
    });
  }

  // Acha a âncora que contém o ponto (coordenadas da tela) e devolve a posição em %.
  function ancorar(cx, cy) {
    for (const a of ['topo', 'quarto', 'lateral']) {
      const el = elAncora(a);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return emPct(a, r, cx, cy);
    }
    return emPct('pagina', elAncora('pagina').getBoundingClientRect(), cx, cy);
  }
  const emPct = (a, r, cx, cy) => ({
    a,
    x: Math.round(limitar((cx - r.left) / r.width * 100, -10, 110) * 10) / 10,
    y: Math.round(limitar((cy - r.top) / r.height * 100, -10, 110) * 10) / 10
  });

  const stickerSel = () => perfilAtual && (perfilAtual.blog && perfilAtual.blog.stickers || []).find(s => s.uid === selecionado);
  const novoUid = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const MAX_STICKERS = 40, MAX_IMAGENS = 8;

  function salvarStickers() { renderStickers(); if (aoSalvar) aoSalvar(); }

  function adicionarSticker(dados) {
    const b = garantir(perfilAtual);
    if (b.stickers.length >= MAX_STICKERS) return `Limite de ${MAX_STICKERS} stickers.`;
    if (dados.id === 'imagem' && b.stickers.filter(s => s.id === 'imagem').length >= MAX_IMAGENS) return `Limite de ${MAX_IMAGENS} stickers de imagem.`;
    // aparece no meio da parte visível da página (à direita da janela de edição)
    const jan = document.getElementById('jan-blog');
    const jr = jan ? jan.getBoundingClientRect() : null;
    const celular = innerWidth < 700;
    const cx = !celular && jr ? (jr.right + innerWidth) / 2 : innerWidth / 2;
    const cy = celular && jr ? Math.max(60, jr.top / 2) : innerHeight / 2;
    const pos = ancorar(cx + (Math.random() * 40 - 20), cy + (Math.random() * 40 - 20));
    const s = Object.assign({ uid: novoUid(), s: 1, r: 0 }, dados, pos);
    b.stickers.push(s);
    selecionado = s.uid;
    salvarStickers();
    return '';
  }

  function mexerSelecionado(f) {
    const s = stickerSel();
    if (!s) return;
    f(s);
    salvarStickers();
  }
  function removerSelecionado() {
    if (!perfilAtual || !perfilAtual.blog) return;
    perfilAtual.blog.stickers = perfilAtual.blog.stickers.filter(s => s.uid !== selecionado);
    selecionado = null;
    salvarStickers();
  }

  // arrastar
  document.addEventListener('pointerdown', e => {
    if (!editando) return;
    const el = e.target.closest('.sticker');
    if (!el) return;
    e.preventDefault();
    selecionado = el.dataset.uid;
    document.querySelectorAll('.sticker.sel').forEach(x => x.classList.remove('sel'));
    el.classList.add('sel');
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const camada = el.parentElement.getBoundingClientRect();
    el.setPointerCapture(e.pointerId);
    el.classList.add('arrastando');
    let moveu = false;
    const mover = ev => {
      moveu = true;
      el.style.left = ((ev.clientX - dx - camada.left) / camada.width * 100) + '%';
      el.style.top = ((ev.clientY - dy - camada.top) / camada.height * 100) + '%';
    };
    const parar = ev => {
      el.removeEventListener('pointermove', mover);
      el.removeEventListener('pointerup', parar);
      el.removeEventListener('pointercancel', parar);
      el.classList.remove('arrastando');
      const s = stickerSel();
      if (s && moveu) Object.assign(s, ancorar(ev.clientX - dx, ev.clientY - dy));
      salvarStickers();
    };
    el.addEventListener('pointermove', mover);
    el.addEventListener('pointerup', parar);
    el.addEventListener('pointercancel', parar);
  });

  document.addEventListener('keydown', e => {
    if (!editando || !selecionado || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const passos = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (passos[e.key]) {
      e.preventDefault();
      mexerSelecionado(s => { s.x = limitar(s.x + passos[e.key][0], -10, 110); s.y = limitar(s.y + passos[e.key][1], -10, 110); });
    } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removerSelecionado(); }
  });

  function editar(ligado) {
    editando = ligado;
    if (!ligado) selecionado = null;
    document.body.classList.toggle('editando-stickers', ligado);
    renderStickers();
  }

  // Imagem enviada vira sticker: cabe em 128x128 e continua PNG (mantém o fundo transparente).
  function imagemParaSticker(arquivo) {
    return new Promise((ok, falha) => {
      if (!arquivo || !/^image\//.test(arquivo.type)) return falha(new Error('Esse arquivo não é uma imagem.'));
      if (arquivo.size > 15 * 1024 * 1024) return falha(new Error('Imagem grande demais (máx. 15 MB).'));
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        const esc_ = Math.min(1, 128 / Math.max(img.width, img.height));
        const tela = document.createElement('canvas');
        tela.width = Math.max(1, Math.round(img.width * esc_));
        tela.height = Math.max(1, Math.round(img.height * esc_));
        tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
        URL.revokeObjectURL(url);
        ok(tela.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não consegui abrir essa imagem.')); };
      img.src = url;
    });
  }
  // Fundo enviado: até 800px no lado maior, em JPEG (fica leve pro navegador guardar).
  function imagemParaFundo(arquivo) {
    return new Promise((ok, falha) => {
      if (!arquivo || !/^image\//.test(arquivo.type)) return falha(new Error('Esse arquivo não é uma imagem.'));
      if (arquivo.size > 15 * 1024 * 1024) return falha(new Error('Imagem grande demais (máx. 15 MB).'));
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        const f = Math.min(1, 800 / Math.max(img.width, img.height));
        const tela = document.createElement('canvas');
        tela.width = Math.max(1, Math.round(img.width * f));
        tela.height = Math.max(1, Math.round(img.height * f));
        tela.getContext('2d').drawImage(img, 0, 0, tela.width, tela.height);
        URL.revokeObjectURL(url);
        ok(tela.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não consegui abrir essa imagem.')); };
      img.src = url;
    });
  }

  // ================= janela "Personalizar blog" =================
  // ctx: { perfil(), salvar() -> bool, renderTudo() }
  function janela(ctx) {
    const opcoes = (obj, atual) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === atual ? 'selected' : ''}>${esc(v)}</option>`).join('');
    const def = {
      titulo: '🎨 Personalizar meu blog', largura: 400, soDono: true, aEsquerda: true, aba: 'temas',
      aoAbrir() { editar(true); },
      aoFechar() { editar(false); },
      html() {
        const p = ctx.perfil();
        const b = blogDe(p);
        const aba = (id, rotulo) => `<button class="aba" type="button" role="tab" aria-selected="${this.aba === id}" data-aba="${id}">${rotulo}</button>`;
        let painel = '';
        if (this.aba === 'temas') {
          painel = `<p>Escolha um tema pronto e depois ajuste do seu jeito:</p>
            <div class="temas-prontos">${Object.entries(TEMAS).map(([k, t]) => `
              <button type="button" class="tema-pronto" data-tema="${k}" style="background:${cssFundo(Object.assign({}, PADRAO, t), true).replace(/"/g, "'")}">
                <span>${esc(t.nome)}</span></button>`).join('')}</div>
            <fieldset><legend>Fundo da página</legend>
              <div class="swatches fundos">${Object.entries(FUNDOS).map(([k, v]) => `
                <label class="swatch"><input type="radio" name="fundo" value="${k}" ${k === b.fundo ? 'checked' : ''}>
                  <span class="amostra" style="background:${cssFundo(Object.assign({}, b, { fundo: k }), true).replace(/"/g, "'")}"></span>${esc(v)}</label>`).join('')}</div>
              <div class="linha">
                <label class="campo curto"><span>Cor do fundo</span><input type="color" name="cor1" value="${corValida(b.cor1, PADRAO.cor1)}"></label>
                <label class="campo curto"><span>Cor do desenho</span><input type="color" name="cor2" value="${corValida(b.cor2, PADRAO.cor2)}"></label>
              </div>
              ${b.fundo === 'imagem' ? `<div class="linha">
                <label class="btn98 botao-arquivo">📁 Enviar imagem<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-upload-fundo></label>
                <label class="campo"><span>Jeito</span><select name="modoImagem">${opcoes({ cobrir: 'Esticar na tela', repetir: 'Repetir (azulejo)' }, b.modoImagem)}</select></label>
              </div>` : ''}
            </fieldset>`;
        } else if (this.aba === 'caixas') {
          painel = `<fieldset><legend>Estilo das caixas</legend>
              <div class="swatches caixas-estilos">${Object.entries(CAIXAS).map(([k, v]) => `
                <label class="swatch"><input type="radio" name="caixa" value="${k}" ${k === b.caixa ? 'checked' : ''}>
                  <span class="amostra amostra-caixa amostra-caixa-${k}"><i></i></span>${esc(v)}</label>`).join('')}</div>
            </fieldset>
            <fieldset><legend>Letras e cor</legend>
              <div class="linha">
                <label class="campo"><span>Fonte</span><select name="fonte">${opcoes(FONTES, b.fonte)}</select></label>
                <label class="campo curto"><span>Cor de destaque</span><input type="color" name="corDestaque" value="${corValida(p.corDestaque, '#ff66cc')}"></label>
              </div>
              <p class="previa-fonte fonte-${b.fonte}">Assisti 3 filmes hoje e não me arrependo de nada ♥</p>
            </fieldset>`;
        } else if (this.aba === 'titulo') {
          painel = `<fieldset><legend>Título do blog</legend>
              <label class="campo"><span>Texto</span><input type="text" name="titulo" maxlength="40" value="${esc(b.titulo)}" placeholder="${esc(tituloDe(p, Object.assign({}, b, { titulo: '' })))}"></label>
              <div class="swatches estilos-titulo">${Object.entries(TITULOS).map(([k, v]) => `
                <label class="swatch largo"><input type="radio" name="estiloTitulo" value="${k}" ${k === b.estiloTitulo ? 'checked' : ''}>
                  <span class="amostra amostra-titulo titulo-${k}"><span class="tt">Aa</span></span>${esc(v)}</label>`).join('')}</div>
            </fieldset>
            <fieldset><legend>Letreiro (o texto que passa lá em cima)</legend>
              <label class="campo"><span>Texto</span><input type="text" name="letreiro" maxlength="140" value="${esc(b.letreiro)}" placeholder="deixa vazio pra usar o automático"></label>
            </fieldset>`;
        } else if (this.aba === 'mouse') {
          const destaque = corValida(p.corDestaque, '#ff66cc');
          painel = `<fieldset><legend>Cursor</legend>
              <div class="swatches">${Object.entries(CURSORES).map(([k, v]) => {
                const c = k === 'padrao' ? null : svgCursor(k, destaque);
                return `<label class="swatch"><input type="radio" name="cursor" value="${k}" ${k === b.cursor ? 'checked' : ''}>
                  <span class="amostra amostra-cursor">${c ? `<svg viewBox="0 0 ${Math.max(c.w, c.h)} ${Math.max(c.w, c.h)}" shape-rendering="crispEdges">${c.svg}</svg>` : '<span>↖</span>'}</span>${esc(v)}</label>`;
              }).join('')}</div>
            </fieldset>
            <fieldset><legend>Rastro do mouse</legend>
              <label class="campo"><span>Deixa um rastrinho por onde o mouse passa</span><select name="rastro">${opcoes(RASTROS, b.rastro)}</select></label>
              <small>No celular não tem mouse, então o rastro não aparece.</small>
            </fieldset>`;
        } else {
          const s = stickerSel();
          painel = `<p class="dica-edicao">Clique pra colar na página e <b>arraste</b> pra mudar de lugar. Os stickers ficam presos no pedaço da página onde você soltar.</p>
            <div class="paleta-stickers">${Object.entries(STICKERS).map(([k, st]) => `
              <button type="button" class="btn-sticker" data-add="${k}" title="${esc(st.nome)}" aria-label="Colar ${esc(st.nome)}">${svgSticker(k, 2)}</button>`).join('')}</div>
            <p>Selinhos:</p>
            <div class="paleta-selos">${SELOS_PRONTOS.map((s2, i) => `
              <button type="button" class="btn-selo" data-selo="${i}" aria-label="Colar selo ${esc(s2.texto)}">${htmlSelo(s2.texto, s2.e)}</button>`).join('')}</div>
            <div class="linha">
              <label class="campo"><span>Selo com seu texto</span><input type="text" name="selo_texto" maxlength="24" placeholder="ex.: fã de terror"></label>
              <label class="campo curto"><span>Cor</span><select name="selo_estilo">${ESTILOS_SELO.map((_, i) => `<option value="${i}">${i + 1}</option>`).join('')}</select></label>
              <button type="button" class="btn98" data-selo-meu>colar</button>
            </div>
            <div class="linha">
              <label class="btn98 botao-arquivo">📁 Sticker com sua imagem<input type="file" accept="image/png,image/gif,image/webp,image/jpeg" data-upload-sticker></label>
              <small>PNG com fundo transparente fica mais bonito</small>
            </div>
            <fieldset class="controles-sticker"><legend>Sticker selecionado</legend>
              ${s ? `<div class="linha">
                <button type="button" class="btn98" data-st="girar-">⟲ girar</button>
                <button type="button" class="btn98" data-st="girar+">⟳ girar</button>
                <button type="button" class="btn98" data-st="menor">− menor</button>
                <button type="button" class="btn98" data-st="maior">+ maior</button>
                <button type="button" class="btn98" data-st="frente">⬆ pra frente</button>
                <button type="button" class="btn98" data-st="remover">🗑 tirar</button>
              </div><small>dica: setas do teclado movem, Delete tira</small>`
              : '<p class="vazio">clique num sticker da página pra selecionar</p>'}
            </fieldset>
            ${(b.stickers || []).length ? `<button type="button" class="btn98" data-st="limpar">Tirar todos os stickers (${b.stickers.length})</button>` : ''}`;
        }
        return `<form class="form98" id="f-blog">
          <div class="abas" role="tablist">${aba('temas', '🖼️ Fundo')}${aba('caixas', '🔤 Caixas')}${aba('titulo', '✨ Título')}${aba('mouse', '🖱️ Mouse')}${aba('stickers', '⭐ Stickers')}</div>
          <div class="painel">${painel}</div>
          <p class="msg" role="status"></p>
        </form>`;
      },
      bind(corpo, redesenhar) {
        const form = corpo.querySelector('form');
        const msg = t => { corpo.querySelector('.msg').textContent = t; };
        const salvar = () => {
          const p = ctx.perfil();
          garantir(p).personalizou = true;
          const ok = ctx.salvar();
          ctx.renderTudo();
          msg(ok ? 'salvo ✔' : '⚠ não deu pra salvar: o navegador está sem espaço');
          return ok;
        };
        aoSalvar = () => { garantir(ctx.perfil()).personalizou = true; ctx.salvar(); if (def.aba === 'stickers') redesenhar(); };
        form.onsubmit = e => e.preventDefault();
        form.onchange = async e => {
          const t = e.target;
          const p = ctx.perfil();
          const b = garantir(p);
          if (t.dataset.uploadFundo !== undefined) {
            const arq = t.files && t.files[0];
            if (!arq) return;
            msg('carregando...');
            try {
              const antes = b.imagem;
              b.imagem = await ctx.guardarImagem(await imagemParaFundo(arq));
              if (!salvar()) { b.imagem = antes; salvar(); msg('⚠ sem espaço no navegador pra essa imagem'); }
            } catch (err) { msg('⚠ ' + err.message); }
            return;
          }
          if (t.dataset.uploadSticker !== undefined) {
            const arq = t.files && t.files[0];
            if (!arq) return;
            msg('carregando...');
            try {
              const erro = adicionarSticker({ id: 'imagem', src: await ctx.guardarImagem(await imagemParaSticker(arq)) });
              if (erro) msg('⚠ ' + erro);
              else if (!ctx.salvar()) { removerSelecionado(); msg('⚠ sem espaço no navegador pra essa imagem'); }
            } catch (err) { msg('⚠ ' + err.message); }
            return;
          }
          const n = t.name;
          if (n === 'fundo' && FUNDOS[t.value]) b.fundo = t.value;
          else if (n === 'cor1' || n === 'cor2') b[n] = corValida(t.value, PADRAO[n]);
          else if (n === 'modoImagem') b.modoImagem = t.value === 'repetir' ? 'repetir' : 'cobrir';
          else if (n === 'caixa' && CAIXAS[t.value]) b.caixa = t.value;
          else if (n === 'fonte' && FONTES[t.value]) b.fonte = t.value;
          else if (n === 'corDestaque') {
            p.corDestaque = corValida(t.value, '#ff66cc');
            const outro = document.querySelector('#f-decorar [name="corDestaque"]');
            if (outro) outro.value = p.corDestaque;
          }
          else if (n === 'titulo') b.titulo = t.value.trim().slice(0, 40);
          else if (n === 'estiloTitulo' && TITULOS[t.value]) b.estiloTitulo = t.value;
          else if (n === 'letreiro') b.letreiro = t.value.trim().slice(0, 140);
          else if (n === 'cursor' && CURSORES[t.value]) b.cursor = t.value;
          else if (n === 'rastro' && RASTROS[t.value]) b.rastro = t.value;
          else return;
          salvar();
          // redesenha a janela quando muda algo que aparece nas amostras
          if (['fundo', 'cor1', 'cor2', 'fonte', 'corDestaque'].includes(n)) redesenhar();
        };
        corpo.onclick = e => {
          const ab = e.target.closest('[data-aba]');
          if (ab) { def.aba = ab.dataset.aba; redesenhar(); return; }
          const p = ctx.perfil();
          const tema = e.target.closest('[data-tema]');
          if (tema) {
            const { nome, ...resto } = TEMAS[tema.dataset.tema];
            const b = garantir(p);
            Object.assign(b, resto);
            salvar(); redesenhar();
            msg(`tema ${nome} aplicado ✔`);
            return;
          }
          const add = e.target.closest('[data-add]');
          if (add) { msg(adicionarSticker({ id: add.dataset.add })); return; }
          const selo = e.target.closest('[data-selo]');
          if (selo) { const s = SELOS_PRONTOS[selo.dataset.selo]; msg(adicionarSticker({ id: 'selo', texto: s.texto, e: s.e })); return; }
          if (e.target.closest('[data-selo-meu]')) {
            const texto = form.elements.selo_texto.value.trim().slice(0, 24);
            if (!texto) { msg('escreve o texto do selo primeiro'); return; }
            msg(adicionarSticker({ id: 'selo', texto, e: Number(form.elements.selo_estilo.value) || 0 }));
            return;
          }
          const st = e.target.closest('[data-st]');
          if (!st) return;
          const acao = st.dataset.st;
          if (acao === 'limpar') {
            if (!confirm('Tirar todos os stickers da página?')) return;
            garantir(p).stickers = [];
            selecionado = null;
            salvarStickers();
            return;
          }
          if (acao === 'remover') { removerSelecionado(); return; }
          if (acao === 'frente') {
            const b = garantir(p), s = stickerSel();
            if (s) { b.stickers = b.stickers.filter(x => x !== s).concat(s); salvarStickers(); }
            return;
          }
          mexerSelecionado(s => {
            if (acao === 'girar-') s.r = ((Number(s.r) || 0) - 15);
            if (acao === 'girar+') s.r = ((Number(s.r) || 0) + 15);
            if (acao === 'menor') s.s = Math.max(0.5, (Number(s.s) || 1) - 0.25);
            if (acao === 'maior') s.s = Math.min(3, (Number(s.s) || 1) + 0.25);
            if (s.r > 180) s.r -= 360;
            if (s.r < -180) s.r += 360;
          });
        };
      }
    };
    return def;
  }

  return { aplicar, limpar, janela, blogDe, renderStickers, letreiroDe: p => blogDe(p).letreiro, STICKERS, svgSticker };
})();
