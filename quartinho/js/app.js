(function () {
  'use strict';
  const { esc, urlSegura, ehUpload, imagemParaPoster, corValida, limitar, hash, corDe, hoje, fmtData, estrelas } = window.U;
  const { CATALOGO, PETS, CORACAO, forma, podeGirar, proximaDirecao, nomeDirecao } = window.Sprites;
  const NS = 'http://www.w3.org/2000/svg';

  // ================= constantes =================
  const CHAVE = 'quartinho:v2';
  const CHAVE_V1 = 'quartinho:perfil:v1';
  const CHAVE_VISITAS = 'quartinho:visitas';
  const CHAVE_VOLUME = 'quartinho:volume';

  const LARG = 192, ALT = 160, PAREDE = 48, GRADE = 4; // área interna do quarto (px)

  const PAPEIS = { listras: 'Listras rosa', xadrez: 'Xadrez azul', bolinhas: 'Bolinhas', estrelas: 'Céu estrelado', madeira: 'Madeira', tijolo: 'Tijolinho', nuvens: 'Nuvens' };
  const PISOS = { madeira: 'Taco', carpete: 'Carpete', xadrez: 'Xadrez', ladrilho: 'Ladrilho', tatame: 'Tatame' };
  const LUZES = { dia: '☀️ Dia', tarde: '🌇 Fim de tarde', noite: '🌙 Noite', neon: '💜 Neon' };
  const EFEITOS = { nenhum: 'Nenhum', neve: '❄ Neve', coracoes: '♥ Corações', brilhos: '✦ Brilhinhos', vagalumes: '• Vaga-lumes' };

  const TROFEUS = [
    { icone: '🎬', nome: 'Primeira sessão', desc: 'Guardou o 1º filme na estante', ok: p => p.assistidos.length >= 1 },
    { icone: '🍿', nome: 'Cinéfilo', desc: '10 filmes na estante', ok: p => p.assistidos.length >= 10 },
    { icone: '📼', nome: 'Maratonista', desc: '25 filmes na estante', ok: p => p.assistidos.length >= 25 },
    { icone: '✍️', nome: 'Crítico de sofá', desc: 'Escreveu 3 páginas no diário', ok: p => p.diario.length >= 3 },
    { icone: '💌', nome: 'Popular', desc: 'Recebeu 5 recados no mural', ok: p => p.recados.length >= 5 },
    { icone: '📋', nome: 'Listeiro', desc: 'Tem 3 listas no computador', ok: p => p.listas.length >= 3 },
    { icone: '🍅', nome: 'Exigente', desc: 'Deu nota 1 pra algum filme', ok: p => p.assistidos.some(f => f.nota === 1) },
    { icone: '🖌️', nome: 'Decorador', desc: 'Decorou o próprio quarto', ok: p => !!p.decorou },
    { icone: '🐾', nome: 'Melhor amigo', desc: 'Tem um bichinho no quarto', ok: p => !!(p.pet && PETS[p.pet.tipo]) },
    { icone: '⏳', nome: 'Viajante do tempo', desc: 'Filmes de 5 décadas diferentes', ok: p => new Set(p.assistidos.filter(f => Number(f.ano)).map(f => Math.floor(f.ano / 10))).size >= 5 },
    { icone: '🌍', nome: 'Poliglota', desc: 'Filmes de 5 países diferentes', ok: p => new Set(p.assistidos.flatMap(f => (window.Filmes.metaDe(f) || {}).pais || [])).size >= 5 },
    { icone: '✨', nome: 'Estiloso', desc: 'Personalizou o próprio blog', ok: p => !!(p.blog && p.blog.personalizou) },
    { icone: '🎨', nome: 'Eclético', desc: 'Viu 8 gêneros diferentes', ok: p => new Set(p.assistidos.flatMap(f => (window.Filmes.metaDe(f) || {}).generos || [])).size >= 8 }
  ];

  // ================= dados =================
  const clonar = o => JSON.parse(JSON.stringify(o));

  function carregar() {
    const perfis = clonar(window.QUARTINHO_DADOS.perfis);
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null'); } catch (e) { /* ignora */ }
    if (salvo && salvo.perfis) {
      for (const id in salvo.perfis) if (perfis[id]) Object.assign(perfis[id], salvo.perfis[id]);
    } else {
      // migra o que a pessoa já tinha salvo na versão anterior
      try {
        const v1 = JSON.parse(localStorage.getItem(CHAVE_V1) || 'null');
        if (v1) {
          const { papel, piso, ...resto } = v1;
          Object.assign(perfis.eu, resto);
          if (PAPEIS[papel]) perfis.eu.papel = papel;
          if (PISOS[piso]) perfis.eu.piso = piso;
        }
      } catch (e) { /* ignora */ }
    }
    return perfis;
  }
  // Devolve false se o navegador não deixou salvar (ex.: armazenamento cheio).
  function salvar() {
    if (window.Conta.logado() && perfis.eu && perfis.eu.uid) { window.Conta.salvarPerfil(dadosParaBanco(perfis.eu)); return true; }
    if (perfis.eu && perfis.eu.uid) return true; // perfil da nuvem sem sessão: não mistura com o modo demo
    try { localStorage.setItem(CHAVE, JSON.stringify({ perfis })); return true; } catch (e) { return false; }
  }

  let perfis = carregar();
  let atualId = 'eu';
  let tela = 'feed'; // 'feed' (início) ou 'quarto'
  let modoEdicao = false;
  let selecionado = null;
  const perfil = () => perfis[atualId];
  const ehMeu = () => atualId === 'eu';

  // ================= geometria dos itens =================
  // defDe: dados gerais do móvel (nome, ação...). forma: medidas do modelo escolhido (e girado).
  const defDe = it => CATALOGO[it.id];
  function posArte(it) {
    const f = forma(it);
    return f.lugar === 'chao' ? { x: it.x, y: it.y + f.fh - f.h } : { x: it.x, y: it.y };
  }
  const baseDe = it => { const f = forma(it); return f.lugar === 'chao' ? it.y + f.fh : it.y; };
  function limites(f) {
    if (f.lugar === 'parede') return { x0: 0, x1: LARG - f.w, y0: 0, y1: PAREDE - f.h };
    return { x0: 0, x1: LARG - f.w, y0: PAREDE, y1: ALT - f.fh };
  }
  function prender(it) {
    const l = limites(forma(it));
    it.x = limitar(Math.round(it.x / GRADE) * GRADE, l.x0, l.x1);
    it.y = limitar(Math.round(it.y / GRADE) * GRADE, l.y0, Math.max(l.y0, l.y1));
  }
  // retângulo que o item ocupa (pé no chão, ou o desenho na parede)
  function caixa(it) {
    const f = forma(it);
    return { x: it.x, y: it.y, w: f.w, h: f.lugar === 'parede' ? f.h : f.fh };
  }
  function nomeDe(it) {
    const d = defDe(it), f = forma(it);
    return d.modelos ? `${d.nome}: ${d.modelos[f.modelo].rotulo}` : d.nome;
  }
  const cruza = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  // ================= contexto pros desenhos =================
  function contexto(p) {
    return {
      luz: p.luz,
      assistindo: p.assistindo || {},
      posteres: p.posteres || [],
      recados: p.recados || [],
      trofeusGanhos: TROFEUS.filter(t => t.ok(p)).length,
      dvds: (p.assistidos || []).map(f => ({ cor: corDe(f.titulo), h: 5 + (hash(f.titulo) % 3) })),
      tocando: window.Musica.tocando() === p.musica && p.musica !== 'nenhuma'
    };
  }

  // ================= padrões de parede e chão =================
  const DEFS = `
    <pattern id="wp-listras" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f7c6d9"/><rect width="3" height="8" fill="#fbe0ea"/><rect x="6" width="1" height="8" fill="#eeb0c8"/></pattern>
    <pattern id="wp-xadrez" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#9ec5f0"/><rect width="6" height="6" fill="#b9d6f5"/><rect x="6" y="6" width="6" height="6" fill="#b9d6f5"/></pattern>
    <pattern id="wp-bolinhas" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fff1b8"/><rect x="2" y="2" width="2" height="2" fill="#f4a259"/><rect x="7" y="7" width="2" height="2" fill="#8cc084"/></pattern>
    <pattern id="wp-estrelas" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#1d2b53"/><rect x="4" y="4" width="1" height="3" fill="#ffec27"/><rect x="3" y="5" width="3" height="1" fill="#ffec27"/><rect x="16" y="14" width="1" height="1" fill="#fff"/><rect x="10" y="19" width="1" height="1" fill="#c2c3c7"/><rect x="19" y="3" width="1" height="1" fill="#c2c3c7"/></pattern>
    <pattern id="wp-madeira" width="32" height="64" patternUnits="userSpaceOnUse"><rect width="32" height="64" fill="#a5713f"/><rect width="1" height="64" fill="#b4834f"/><rect x="8" width="1" height="64" fill="#b4834f"/><rect x="16" width="1" height="64" fill="#b4834f"/><rect x="24" width="1" height="64" fill="#b4834f"/><rect x="7" width="1" height="64" fill="#7a5230"/><rect x="15" width="1" height="64" fill="#7a5230"/><rect x="23" width="1" height="64" fill="#7a5230"/><rect x="31" width="1" height="64" fill="#7a5230"/><rect y="40" width="7" height="1" fill="#7a5230"/><rect x="8" y="18" width="7" height="1" fill="#7a5230"/><rect x="16" y="54" width="7" height="1" fill="#7a5230"/><rect x="24" y="6" width="7" height="1" fill="#7a5230"/><rect x="3" y="8" width="1" height="12" fill="#b88a58"/><rect x="11" y="30" width="1" height="10" fill="#b88a58"/><rect x="19" y="6" width="1" height="14" fill="#b88a58"/><rect x="27" y="26" width="1" height="11" fill="#b88a58"/><rect x="5" y="48" width="1" height="8" fill="#8f6034"/><rect x="12" y="2" width="1" height="7" fill="#8f6034"/><rect x="20" y="34" width="1" height="9" fill="#8f6034"/><rect x="28" y="44" width="1" height="8" fill="#8f6034"/></pattern>
    <pattern id="wp-tijolo" width="16" height="8" patternUnits="userSpaceOnUse"><rect width="16" height="8" fill="#b5523b"/><rect y="3" width="16" height="1" fill="#d9a38a"/><rect y="7" width="16" height="1" fill="#d9a38a"/><rect x="7" width="1" height="3" fill="#d9a38a"/><rect x="15" y="4" width="1" height="3" fill="#d9a38a"/><rect x="1" y="0" width="4" height="1" fill="#c96a50"/><rect x="9" y="4" width="4" height="1" fill="#c96a50"/></pattern>
    <pattern id="wp-nuvens" width="32" height="24" patternUnits="userSpaceOnUse"><rect width="32" height="24" fill="#bfe6ff"/><rect x="3" y="5" width="9" height="3" fill="#fff"/><rect x="5" y="3" width="5" height="2" fill="#fff"/><rect x="19" y="16" width="10" height="3" fill="#fff"/><rect x="21" y="14" width="5" height="2" fill="#fff"/><rect x="3" y="8" width="9" height="1" fill="#e2f3ff"/></pattern>
    <pattern id="fl-madeira" width="32" height="16" patternUnits="userSpaceOnUse"><rect width="32" height="16" fill="#9c6b3c"/><rect y="7" width="32" height="1" fill="#7a5230"/><rect y="15" width="32" height="1" fill="#7a5230"/><rect x="20" width="1" height="7" fill="#7a5230"/><rect x="4" y="8" width="1" height="7" fill="#7a5230"/><rect x="5" y="2" width="8" height="1" fill="#ad7a48"/><rect x="22" y="11" width="6" height="1" fill="#ad7a48"/><rect y="0" width="32" height="1" fill="#a87545"/><rect y="8" width="32" height="1" fill="#a87545"/></pattern>
    <pattern id="fl-carpete" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#7b2d3b"/><rect x="1" y="1" width="1" height="1" fill="#8f3a49"/><rect x="3" y="3" width="1" height="1" fill="#6a2433"/></pattern>
    <pattern id="fl-xadrez" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e8e8e8"/><rect width="8" height="8" fill="#333"/><rect x="8" y="8" width="8" height="8" fill="#333"/></pattern>
    <pattern id="fl-ladrilho" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e9e4da"/><rect y="15" width="16" height="1" fill="#bdb5a6"/><rect x="15" width="1" height="16" fill="#bdb5a6"/><rect x="1" y="1" width="6" height="1" fill="#f7f4ee"/></pattern>
    <linearGradient id="grad-tv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="stop-tv" stop-color="#7fb8ff" stop-opacity=".9"/><stop offset=".55" class="stop-tv" stop-color="#7fb8ff" stop-opacity=".3"/><stop offset="1" class="stop-tv" stop-color="#7fb8ff" stop-opacity="0"/></linearGradient>
    <radialGradient id="grad-tv-r"><stop offset="0" class="stop-tv" stop-color="#7fb8ff" stop-opacity=".9"/><stop offset="1" class="stop-tv" stop-color="#7fb8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="grad-pc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fe0d0" stop-opacity=".9"/><stop offset=".5" stop-color="#5fe0d0" stop-opacity=".3"/><stop offset="1" stop-color="#5fe0d0" stop-opacity="0"/></linearGradient>
    <linearGradient id="grad-pc-e" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#5fe0d0" stop-opacity=".9"/><stop offset=".5" stop-color="#5fe0d0" stop-opacity=".3"/><stop offset="1" stop-color="#5fe0d0" stop-opacity="0"/></linearGradient>
    <linearGradient id="grad-pc-d" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fe0d0" stop-opacity=".9"/><stop offset=".5" stop-color="#5fe0d0" stop-opacity=".3"/><stop offset="1" stop-color="#5fe0d0" stop-opacity="0"/></linearGradient>
    <pattern id="fl-tatame" width="32" height="16" patternUnits="userSpaceOnUse"><rect width="32" height="16" fill="#c8c07a"/><rect width="32" height="1" fill="#6b6b3a"/><rect width="1" height="16" fill="#6b6b3a"/><rect y="4" width="32" height="1" fill="#b8b06a"/><rect y="8" width="32" height="1" fill="#b8b06a"/><rect y="12" width="32" height="1" fill="#b8b06a"/></pattern>`;

  // ================= o quarto =================
  function attrsItem(it, ctx) {
    const d = defDe(it);
    const base = `data-uid="${it.uid}" data-base="${baseDe(it)}"`;
    if (modoEdicao) {
      return `class="item editavel${it.uid === selecionado ? ' selecionado' : ''}" ${base} data-dica="${esc(nomeDe(it))}"`;
    }
    if (d.acao) {
      const dica = d.dica ? d.dica(ctx, it) : d.nome;
      const idx = it.slot != null ? `data-idx="${it.slot}"` : '';
      return `class="item hotspot" ${base} data-acao="${d.acao}" ${idx} data-dica="${esc(dica)}" tabindex="0" role="button" aria-label="${esc(dica)}"`;
    }
    return `class="item" ${base}`;
  }

  function svgItem(it, ctx, brilhos) {
    const f = forma(it);
    const pos = posArte(it);
    // móvel espelhado (virado pra direita): o brilho também troca de lado
    if (f.brilhos) f.brilhos(ctx, it).forEach(b => brilhos.push({ x: pos.x + (f.espelhar ? f.w - b.x : b.x), y: pos.y + b.y, r: b.r, cor: b.cor }));
    return `<g ${attrsItem(it, ctx)} transform="translate(${pos.x},${pos.y})">${window.Sprites.arte(it, ctx)}</g>`;
  }

  // Coisas que se mexem por cima da iluminação: notas do som e luz da TV e do PC.
  const NOTAS = [
    ['..cc.', '..c.c', '..c..', '..c..', '.cc..', 'ccc..', '.c...'],
    ['.ccccc', '.c...c', '.c...c', '.c...c', 'cc..cc', 'cc.ccc']
  ];
  const CORES_NOTAS = ['#ff6fb5', '#ffe14d', '#5fe0ff', '#9dff7a'];

  function svgVivos(itens, ctx, luz) {
    const noite = luz === 'noite' || luz === 'neon';
    const { mapa } = window.Sprites;
    let s = '';
    for (const it of itens) {
      const pos = posArte(it);
      if (it.id === 'som' && ctx.tocando) {
        for (let k = 0; k < 4; k++) {
          const forma = NOTAS[k % 2];
          const desenho = mapa(forma, { c: 'rgba(0,0,0,.45)' }, 1, 1) + mapa(forma, { c: CORES_NOTAS[k] });
          s += `<g transform="translate(${pos.x + (k % 2 ? 10 : 0)},${pos.y - 4})">
            <g class="nota" style="animation-delay:${(-k * 0.65).toFixed(2)}s;--dx:${k % 2 ? 7 : -7}px">${desenho}</g></g>`;
        }
      }
      if (it.id === 'tv' && ctx.assistindo.titulo) {
        const sx = pos.x + 9, sy = pos.y + 10, chao = baseDe(it);
        s += `<polygon class="luz-tv" fill="url(#grad-tv)" points="${sx},${sy + 8} ${sx + 11},${sy + 8} ${sx + 30},${chao + 30} ${sx - 19},${chao + 30}" opacity="${noite ? 0.5 : 0.22}"/>
          <circle class="luz-tv" fill="url(#grad-tv-r)" cx="${sx + 5.5}" cy="${sy + 4}" r="${noite ? 18 : 12}" opacity="${noite ? 0.55 : 0.3}"/>`;
      }
      if (it.id === 'pc') {
        const f = forma(it), op = noite ? 0.45 : 0.16;
        if (f.direcao === 1 || f.direcao === 3) {
          // de lado: a luz sai pela lateral, pra onde a tela está virada
          const lado = f.direcao === 1 ? -1 : 1;
          const sx = f.direcao === 1 ? pos.x + 3 : pos.x + f.w - 3, sy = pos.y + 5;
          s += `<polygon class="luz-pc" fill="url(#grad-pc-${lado < 0 ? 'e' : 'd'})" points="${sx},${sy} ${sx},${sy + 11} ${sx + lado * 24},${sy + 30} ${sx + lado * 24},${sy - 2}" opacity="${op}"/>`;
        } else if (f.direcao !== 2) {
          const sx = pos.x + 9, sy = pos.y + 4, chao = baseDe(it);
          s += `<polygon class="luz-pc" fill="url(#grad-pc)" points="${sx},${sy + 6} ${sx + 9},${sy + 6} ${sx + 22},${chao + 18} ${sx - 13},${chao + 18}" opacity="${op}"/>`;
        }
      }
    }
    return s;
  }

  function svgQuarto() {
    const p = perfil();
    const ctx = contexto(p);
    const itens = (p.quarto || []).filter(it => CATALOGO[it.id]);
    const brilhos = [];
    const parede = itens.filter(it => defDe(it).lugar === 'parede');
    const tapetes = itens.filter(it => defDe(it).lugar === 'tapete');
    const chao = itens.filter(it => defDe(it).lugar === 'chao').sort((a, b) => baseDe(a) - baseDe(b));
    const papel = PAPEIS[p.papel] ? p.papel : 'listras';
    const piso = PISOS[p.piso] ? p.piso : 'madeira';
    const luz = LUZES[p.luz] ? p.luz : 'dia';

    // luz do sol entrando pelas janelas
    let sol = '';
    if (luz === 'dia' || luz === 'tarde') {
      const cor = luz === 'dia' ? 'rgba(255,250,210,.16)' : 'rgba(255,170,90,.2)';
      parede.filter(it => it.id === 'janela').forEach(j => {
        const x = j.x;
        sol += `<polygon points="${x + 3},${PAREDE} ${x + 29},${PAREDE} ${x + 45},${PAREDE + 44} ${x + 19},${PAREDE + 44}" fill="${cor}"/>`;
      });
    }

    const corpoParede = parede.map(it => svgItem(it, ctx, brilhos)).join('');
    const corpoTapetes = tapetes.map(it => svgItem(it, ctx, brilhos)).join('');
    const corpoChao = chao.map(it => svgItem(it, ctx, brilhos)).join('');

    // iluminação
    let clima = '';
    const gradientes = new Set();
    if (luz === 'tarde') clima = `<rect width="${LARG}" height="${ALT}" fill="#ff7a2d" opacity=".13"/>`;
    if (luz === 'noite' || luz === 'neon') {
      clima = luz === 'noite'
        ? `<rect width="${LARG}" height="${ALT}" fill="#0a0f30" opacity=".55"/>`
        : `<rect width="${LARG}" height="${ALT}" fill="#2a0845" opacity=".42"/>`;
      clima += brilhos.map(b => {
        const id = 'gl-' + b.cor.replace('#', '');
        gradientes.add(b.cor);
        return `<circle cx="${b.x}" cy="${b.y}" r="${b.r}" fill="url(#${id})" class="brilho-luz"/>`;
      }).join('');
    }
    const defsLuz = [...gradientes].map(c => `<radialGradient id="gl-${c.replace('#', '')}"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset=".45" stop-color="${c}" stop-opacity=".25"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('');

    let marcacao = '';
    if (modoEdicao && selecionado) {
      const it = itens.find(i => i.uid === selecionado);
      if (it) {
        const d = forma(it), pos = posArte(it);
        marcacao = `<rect x="${pos.x - 1}" y="${pos.y - 1}" width="${d.w + 2}" height="${d.h + 2}" fill="none" stroke="#000" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <rect x="${pos.x - 1}" y="${pos.y - 1}" width="${d.w + 2}" height="${d.h + 2}" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4" vector-effect="non-scaling-stroke" class="formiguinhas"/>`;
      }
    }
    const grade = modoEdicao
      ? `<rect width="${LARG}" height="${ALT}" fill="url(#grade-edicao)" pointer-events="none"/><rect y="${PAREDE}" width="${LARG}" height="1" fill="rgba(255,255,255,.5)" pointer-events="none"/>`
      : '';

    return `<svg viewBox="0 0 ${LARG + 16} ${ALT + 16}" class="quarto-svg${modoEdicao ? ' editando' : ''}" shape-rendering="crispEdges" xmlns="${NS}">
      <title>Quarto de ${esc(p.nome)}</title>
      <defs>${DEFS}${defsLuz}
        <pattern id="grade-edicao" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".5"/></pattern>
      </defs>
      <rect width="${LARG + 16}" height="${ALT + 16}" fill="#3b2219"/>
      <rect x="2" y="2" width="${LARG + 12}" height="${ALT + 12}" fill="#7a4a2e"/>
      <rect x="2" y="2" width="${LARG + 12}" height="1" fill="#a06a44"/>
      <rect x="6" y="6" width="${LARG + 4}" height="${ALT + 4}" fill="#2a170f"/>
      <g id="interior" transform="translate(8,8)">
        <rect width="${LARG}" height="${PAREDE}" fill="url(#wp-${papel})"/>
        <rect width="${LARG}" height="3" fill="rgba(0,0,0,.18)"/>
        <rect y="${PAREDE - 4}" width="${LARG}" height="4" fill="#5a3a22"/>
        <rect y="${PAREDE - 4}" width="${LARG}" height="1" fill="#8a5a33"/>
        <rect y="${PAREDE}" width="${LARG}" height="${ALT - PAREDE}" fill="url(#fl-${piso})"/>
        <rect y="${PAREDE}" width="${LARG}" height="3" fill="rgba(0,0,0,.2)"/>
        <rect y="${ALT - 6}" width="${LARG}" height="6" fill="rgba(0,0,0,.08)"/>
        <g id="camada-parede">${corpoParede}</g>
        ${sol}
        <g id="camada-tapetes">${corpoTapetes}</g>
        <g id="camada-chao">${corpoChao}</g>
        <g pointer-events="none">${clima}</g>
        <g pointer-events="none">${svgVivos(itens, ctx, luz)}</g>
        ${grade}
        <g pointer-events="none">${marcacao}</g>
      </g>
    </svg>`;
  }

  function renderQuarto() {
    document.getElementById('quarto').innerHTML = svgQuarto();
    renderEfeitos();
    iniciarPet();
  }

  // ================= efeitos (partículas por cima do quarto) =================
  function renderEfeitos() {
    const caixaEf = document.getElementById('efeitos');
    const ef = perfil().efeito;
    caixaEf.className = 'efeitos ef-' + (EFEITOS[ef] ? ef : 'nenhum');
    if (!EFEITOS[ef] || ef === 'nenhum') { caixaEf.innerHTML = ''; return; }
    const qtd = ef === 'brilhos' ? 18 : 26;
    const simbolo = { coracoes: '♥', brilhos: '✦' }[ef] || '';
    // Sorteio com semente fixa (o mesmo quarto sempre fica igual) e posições espalhadas:
    // cada partícula ganha sua própria faixa horizontal e uma altura pela sequência áurea.
    let semente = hash(perfil().id + ef) || 1;
    const sorteio = () => {
      semente = (semente + 0x6D2B79F5) | 0;
      let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const ordem = Array.from({ length: qtd }, (_, i) => i).sort(() => sorteio() - 0.5);
    let html = '';
    for (let i = 0; i < qtd; i++) {
      const esq = ((ordem[i] + 0.15 + sorteio() * 0.7) / qtd) * 96 + 2;
      const topo = (((i * 0.618034) + sorteio() * 0.25) % 1) * 90 + 4;
      const dur = 5 + sorteio() * 6;
      const atraso = -sorteio() * dur;
      html += `<span style="left:${esq.toFixed(1)}%;${ef === 'neve' || ef === 'coracoes' ? '' : `top:${topo.toFixed(1)}%;`}animation-delay:${atraso.toFixed(2)}s;animation-duration:${dur.toFixed(2)}s">${simbolo}</span>`;
    }
    caixaEf.innerHTML = html;
  }

  // ================= bichinho =================
  const Pet = { estado: null, raf: 0 };
  const COLS = LARG / 16, LINHAS = (ALT - PAREDE) / 16;

  function gradeLivre() {
    const livre = Array.from({ length: LINHAS }, () => Array(COLS).fill(true));
    for (const it of perfil().quarto || []) {
      const d = CATALOGO[it.id] && forma(it);
      if (!d || d.lugar !== 'chao') continue;
      const c0 = Math.floor(it.x / 16), c1 = Math.ceil((it.x + d.w) / 16) - 1;
      const r0 = Math.floor((it.y - PAREDE) / 16), r1 = Math.ceil((it.y + d.fh - PAREDE) / 16) - 1;
      for (let r = Math.max(0, r0); r <= Math.min(LINHAS - 1, r1); r++)
        for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) livre[r][c] = false;
    }
    return livre;
  }
  function tileAleatorio(livre) {
    const opcoes = [];
    livre.forEach((linha, r) => linha.forEach((ok, c) => { if (ok) opcoes.push({ c, r }); }));
    return opcoes.length ? opcoes[Math.floor(Math.random() * opcoes.length)] : null;
  }
  function caminho(livre, de, para) {
    const chave = t => t.c + ',' + t.r;
    const veio = new Map([[chave(de), null]]);
    const fila = [de];
    while (fila.length) {
      const t = fila.shift();
      if (t.c === para.c && t.r === para.r) break;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { c: t.c + dc, r: t.r + dr };
        if (n.c < 0 || n.r < 0 || n.c >= COLS || n.r >= LINHAS || !livre[n.r][n.c] || veio.has(chave(n))) continue;
        veio.set(chave(n), t);
        fila.push(n);
      }
    }
    if (!veio.has(chave(para))) return [];
    const rota = [];
    for (let t = para; t && !(t.c === de.c && t.r === de.r); t = veio.get(chave(t))) rota.unshift(t);
    return rota;
  }

  function iniciarPet() {
    cancelAnimationFrame(Pet.raf);
    const p = perfil();
    const tipo = p.pet && PETS[p.pet.tipo];
    const camada = document.getElementById('camada-chao');
    if (!tipo || !camada) return;
    const cores = tipo.cores[p.pet.cor] || Object.values(tipo.cores)[0];
    const livre = gradeLivre();

    let st = Pet.estado;
    if (!st || st.dono !== p.id || !livre[st.row] || !livre[st.row][st.col]) {
      const t = tileAleatorio(livre);
      if (!t) return;
      st = { dono: p.id, col: t.c, row: t.r, x: t.c * 16, y: t.r * 16, rota: [], espera: performance.now() + 800, frame: 0, tFrame: 0, esq: false, coracaoAte: 0 };
    } else {
      st.rota = st.rota.filter(t => livre[t.r] && livre[t.r][t.c]);
    }
    Pet.estado = st;

    const quadros = [window.Sprites.mapa(tipo.a, cores), window.Sprites.mapa(tipo.b, cores)];
    const coracao = window.Sprites.mapa(CORACAO, { p: '#ff4f7a' });
    const g = document.createElementNS(NS, 'g');
    g.id = 'pet';
    g.setAttribute('class', modoEdicao ? 'pet' : 'pet hotspot');
    g.dataset.dica = `${p.pet.nome || tipo.nome} (${tipo.nome.toLowerCase()}) — clique pra fazer carinho`;
    camada.appendChild(g);

    let desenhado = '';
    let ultimo = performance.now();
    function passo(agora) {
      const dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      if (st.rota.length) {
        const alvo = st.rota[0];
        const dx = alvo.c * 16 - st.x, dy = alvo.r * 16 - st.y;
        const dist = Math.hypot(dx, dy), v = 24 * dt;
        if (dx < -0.1) st.esq = true; else if (dx > 0.1) st.esq = false;
        if (dist <= v) {
          st.x = alvo.c * 16; st.y = alvo.r * 16; st.col = alvo.c; st.row = alvo.r;
          st.rota.shift();
          if (!st.rota.length) st.espera = agora + 1500 + Math.random() * 4500;
        } else { st.x += dx / dist * v; st.y += dy / dist * v; }
        st.tFrame += dt;
        if (st.tFrame > 0.16) { st.tFrame = 0; st.frame ^= 1; }
      } else if (agora > st.espera) {
        const destino = tileAleatorio(livre);
        st.rota = destino ? caminho(livre, { c: st.col, r: st.row }, destino) : [];
        if (!st.rota.length) st.espera = agora + 2000;
      }

      const temCoracao = agora < st.coracaoAte;
      const chave = `${st.frame}${st.esq}${temCoracao}`;
      if (chave !== desenhado) {
        desenhado = chave;
        const corpo = `<rect x="3" y="12" width="11" height="1" fill="rgba(0,0,0,.28)"/>${quadros[st.frame]}`;
        g.innerHTML = (st.esq ? `<g transform="translate(16,0) scale(-1,1)">${corpo}</g>` : corpo)
          + (temCoracao ? `<g class="coracao-pet">${coracao.replace(/<rect /g, '<rect transform="translate(5,-8)" ')}</g>` : '');
      }
      const px = Math.round(st.x), py = PAREDE + Math.round(st.y) + 4;
      g.setAttribute('transform', `translate(${px},${py})`);

      // ordem de desenho: o bichinho fica atrás do que está mais pra frente
      const basePet = PAREDE + st.y + 16;
      let depois = null;
      for (const filho of camada.children) {
        if (filho !== g && Number(filho.dataset.base) > basePet) { depois = filho; break; }
      }
      if (g.nextSibling !== depois) camada.insertBefore(g, depois);

      Pet.raf = requestAnimationFrame(passo);
    }
    Pet.raf = requestAnimationFrame(passo);
  }

  function carinho() {
    if (!Pet.estado) return;
    Pet.estado.coracaoAte = performance.now() + 1400;
    Pet.estado.rota = [];
    Pet.estado.espera = performance.now() + 1600;
  }

  // ================= lateral =================
  function avatarPadrao(p) {
    const c = corValida(p.corDestaque, '#ff66cc');
    return `<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <rect width="16" height="16" fill="${c}"/>
      <rect x="4" y="3" width="8" height="10" fill="#ffd6a5"/>
      <rect x="3" y="2" width="10" height="3" fill="#3b2a1a"/><rect x="3" y="5" width="1" height="4" fill="#3b2a1a"/><rect x="12" y="5" width="1" height="4" fill="#3b2a1a"/>
      <rect x="6" y="7" width="1" height="2" fill="#000"/><rect x="9" y="7" width="1" height="2" fill="#000"/>
      <rect x="6" y="11" width="4" height="1" fill="#c0392b"/>
      <rect x="3" y="13" width="10" height="3" fill="#2e86de"/>
    </svg>`;
  }

  // ----- som ambiente da TV (preferência de quem está vendo, não do dono do quarto) -----
  const CHAVE_SOM_TV = 'quartinho:somTv';
  let somTvPref = false;
  let jaInteragiu = false; // o navegador só deixa tocar som depois de um clique/toque
  try { somTvPref = localStorage.getItem(CHAVE_SOM_TV) === '1'; } catch (e) { /* ignora */ }

  const tvLigadaNoQuarto = () => {
    const p = perfil();
    return !!(p.assistindo && p.assistindo.titulo && (p.quarto || []).some(it => it.id === 'tv'));
  };
  function atualizarSomTV() {
    const tv = window.Musica.tv;
    const deve = somTvPref && jaInteragiu && tela === 'quarto' && tvLigadaNoQuarto();
    if (deve && !tv.ligada()) tv.ligar();
    if (!deve && tv.ligada()) tv.desligar();
    tv.nivel(window.Musica.tocando() ? 0.45 : 1);
  }
  function definirSomTV(ligado) {
    somTvPref = ligado;
    jaInteragiu = true;
    try { localStorage.setItem(CHAVE_SOM_TV, ligado ? '1' : '0'); } catch (e) { /* ignora */ }
    atualizarSomTV();
    const r = document.getElementById('radio');
    if (r) r.innerHTML = htmlRadio();
  }
  document.addEventListener('pointerdown', () => {
    if (!jaInteragiu) { jaInteragiu = true; atualizarSomTV(); }
  }, { capture: true });

  function htmlSomTV() {
    const ligadaNoQuarto = tvLigadaNoQuarto();
    return `<label class="som-tv"><input type="checkbox" data-som-tv ${somTvPref ? 'checked' : ''}>
      📺 som ambiente da TV ${ligadaNoQuarto ? '' : '<small>(a TV desse quarto está desligada)</small>'}</label>`;
  }

  function htmlRadio() {
    const p = perfil();
    const f = window.Musica.FAIXAS[p.musica];
    if (!f) return `<p class="vazio">esse quarto é silencioso</p>${htmlSomTV()}`;
    const tocandoEste = window.Musica.tocando() === p.musica;
    return `<p class="faixa">${tocandoEste ? '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>' : '♫'} ${esc(f.nome)}</p>
      <div class="radio-controles">
        <button class="btn98" data-radio>${tocandoEste ? '❚❚ pausar' : '▶ tocar'}</button>
        <label class="volume">🔈<input type="range" min="0" max="1" step="0.05" value="${window.Musica.volume()}" data-volume aria-label="Volume"></label>
      </div>
      ${htmlSomTV()}`;
  }

  function renderLateral() {
    const p = perfil();
    const a = p.assistindo || {};
    const img = urlSegura(p.avatar);
    const prog = window.Filmes.progressoDe(a);
    const amigos = Object.values(perfis).filter(x => x.id !== atualId);
    document.getElementById('lateral').innerHTML = `
      <div class="caixa">
        <div class="caixa-titulo">perfil</div>
        <div class="avatar">${img ? `<img src="${esc(img)}" alt="Foto de ${esc(p.nome)}">` : avatarPadrao(p)}</div>
        <p class="nome-perfil">${esc(p.nome)}</p>
        <p>humor: ${esc(p.humor)}</p>
        ${p.cidade ? `<p>📍 ${esc(p.cidade)}</p>` : ''}
        ${p.pet && PETS[p.pet.tipo] ? `<p>🐾 mora com: ${esc(p.pet.nome || PETS[p.pet.tipo].nome)}</p>` : ''}
      </div>
      <div class="caixa">
        <div class="caixa-titulo">♫ rádio do quarto</div>
        <div id="radio">${htmlRadio()}</div>
      </div>
      <div class="caixa">
        <div class="caixa-titulo">📺 assistindo agora</div>
        ${a.titulo
          ? `<p><b>${esc(a.titulo)}</b><br>${esc(a.detalhe)}</p>${a.comentario ? `<p class="comentario-lateral">💬 “${esc(a.comentario)}”</p>` : ''}<div class="barra98" style="margin:6px 10px 10px"><div style="width:${prog}%"></div></div>`
          : `<p class="vazio">nada no momento</p>`}
      </div>
      <div class="caixa">
        <div class="caixa-titulo">sobre ${ehMeu() ? 'mim' : esc(p.nome)}</div>
        <p style="white-space:pre-wrap">${esc(p.sobre)}</p>
      </div>
      <div class="caixa">
        <div class="caixa-titulo">pelo quarto</div>
        <ul class="menu-quarto">
          <li><button data-acao="estante">📀 estante de DVDs</button></li>
          <li><button data-acao="posteres" data-idx="0">🖼️ pôsteres favoritos</button></li>
          <li><button data-acao="tv">📺 televisão</button></li>
          <li><button data-acao="computador">💾 computador</button></li>
          <li><button data-acao="mural">📌 mural de recados</button></li>
          <li><button data-acao="trofeus">🏆 troféus</button></li>
          <li><a href="#stats/${p.id}">📊 estatísticas</a></li>
        </ul>
      </div>
      <div class="caixa">
        <div class="caixa-titulo">${ehMeu() ? '👥 meus amigos' : '👥 outros quartos'}</div>
        <ul class="lista-amigos">${amigos.map(x => `
          <li><button data-visitar="${x.id}">
            <span class="mini-avatar" style="background:${corValida(x.corDestaque, '#ff66cc')}"></span>
            <span><b>${x.id === 'eu' ? '🏠 meu quarto' : esc(x.nome)}</b><small>${x.assistindo && x.assistindo.titulo ? 'vendo ' + esc(x.assistindo.titulo) : ''}</small></span>
          </button></li>`).join('')}</ul>
      </div>
      ${ehMeu() ? `
        <button class="btn98 btn-lateral" data-acao="arrumar">🪑 Arrumar móveis</button>
        <button class="btn98 btn-lateral" data-acao="decorar">🖌️ Decorar e mudar a vibe</button>
        <button class="btn98 btn-lateral" data-acao="blog">🎨 Personalizar meu blog</button>`
        : `<button class="btn98 btn-lateral" data-visitar="eu">🏠 Voltar pro meu quarto</button>`}`;
  }

  function renderTudo() {
    const p = perfil();
    document.documentElement.style.setProperty('--destaque', corValida(p.corDestaque, '#ff66cc'));
    document.title = `${p.nome} · quartinho.net`;
    renderQuarto();
    renderLateral();
    const a = p.assistindo || {};
    const letreiroProprio = window.Blog.letreiroDe(p);
    document.getElementById('letreiro-texto').textContent = letreiroProprio ? `~*~ ${letreiroProprio} ~*~` :
      `~*~ bem-vindo(a) ao quartinho de ${p.nome}!!! ~*~ ` +
      (a.titulo ? `assistindo agora: ${a.titulo} ~*~ ` : '') +
      `deixe um recado no mural ~*~ ${(p.assistidos || []).length} filmes na estante ~*~`;
    atualizarSomTV();
    const aviso = document.getElementById('visitando');
    aviso.hidden = ehMeu();
    aviso.innerHTML = ehMeu() ? '' : `🚪 você está visitando o quartinho de <b>${esc(p.nome)}</b>${p.usuario ? ` <small>@${esc(p.usuario)}</small>` : ''} ${btnSeguir(p)}`;
    if (tela === 'quarto') window.Blog.aplicar(p);
  }

  function mudou() { salvar(); renderTudo(); atualizarArrumar(); }

  function visitar(id) {
    if (!perfis[id] || id === atualId) return;
    document.querySelectorAll('.janela').forEach(fecharJanela);
    const estavaTocando = !!window.Musica.tocando();
    atualId = id;
    Pet.estado = null;
    renderTudo();
    if (estavaTocando) {
      const m = perfil().musica;
      if (window.Musica.FAIXAS[m]) window.Musica.tocar(m); else window.Musica.parar();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function alternarRadio() {
    const m = perfil().musica;
    if (!window.Musica.FAIXAS[m]) return;
    if (window.Musica.tocando() === m) window.Musica.parar(); else window.Musica.tocar(m);
  }
  window.Musica.aoMudar(() => {
    window.Musica.tv.nivel(window.Musica.tocando() ? 0.45 : 1);
    const r = document.getElementById('radio');
    if (r) r.innerHTML = htmlRadio();
    renderQuarto(); // atualiza a luzinha do aparelho de som
  });

  function contarVisita() {
    let n = 1337;
    try {
      n = (parseInt(localStorage.getItem(CHAVE_VISITAS), 10) || 1337) + 1;
      localStorage.setItem(CHAVE_VISITAS, String(n));
      const v = parseFloat(localStorage.getItem(CHAVE_VOLUME));
      if (!isNaN(v)) window.Musica.definirVolume(v);
    } catch (e) { /* ignora */ }
    document.getElementById('contador').textContent = String(n).padStart(6, '0');
  }

  // ================= arrumar móveis (modo edição) =================
  function novoUid() { return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function lugarLivre(id) {
    const d = forma({ id });
    const l = limites(d);
    const outros = (perfil().quarto || []).filter(it => CATALOGO[it.id] && defDe(it).lugar === d.lugar).map(caixa);
    const passoY = d.lugar === 'parede' ? 4 : 8;
    for (let y = l.y0; y <= l.y1; y += passoY) {
      for (let x = l.x0; x <= l.x1; x += 8) {
        const c = { x, y, w: d.w, h: d.lugar === 'parede' ? d.h : d.fh };
        if (!outros.some(o => cruza(o, c))) return { x, y };
      }
    }
    return { x: Math.round((l.x0 + l.x1) / 2 / GRADE) * GRADE, y: Math.round((l.y0 + l.y1) / 2 / GRADE) * GRADE };
  }

  function podeAdicionar(id) {
    const d = CATALOGO[id];
    const q = perfil().quarto || [];
    if (id === 'poster') return q.filter(it => it.id === 'poster').length < 3;
    if (d.unico) return !q.some(it => it.id === id);
    return true;
  }

  function adicionar(id) {
    if (!podeAdicionar(id)) return;
    const p = perfil();
    const d = CATALOGO[id];
    const it = { uid: novoUid(), id, ...lugarLivre(id) };
    if (d.variantes) it.v = Object.keys(d.variantes)[0];
    if (d.modelos) it.m = Object.keys(d.modelos)[0];
    if (id === 'poster') {
      const usados = p.quarto.filter(i => i.id === 'poster').map(i => i.slot);
      it.slot = [0, 1, 2].find(s => !usados.includes(s));
    }
    p.quarto.push(it);
    selecionado = it.uid;
    mudou();
  }

  function itemSelecionado() { return (perfil().quarto || []).find(it => it.uid === selecionado); }

  function atualizarArrumar() {
    const def = JANELAS.arrumar;
    if (def._redesenhar && document.getElementById('jan-arrumar')) def._redesenhar();
  }

  // arrastar com o mouse/dedo
  let arraste = null;
  function pontoNoQuarto(e) {
    const interior = document.getElementById('interior');
    const pt = interior.ownerSVGElement.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(interior.getScreenCTM().inverse());
  }
  document.getElementById('quarto').addEventListener('pointerdown', e => {
    if (!modoEdicao) return;
    const g = e.target.closest('.item');
    if (!g) { selecionado = null; renderQuarto(); atualizarArrumar(); return; }
    const it = (perfil().quarto || []).find(i => i.uid === g.dataset.uid);
    if (!it) return;
    e.preventDefault();
    if (selecionado !== it.uid) { selecionado = it.uid; renderQuarto(); atualizarArrumar(); }
    const pt = pontoNoQuarto(e);
    arraste = { it, dx: pt.x - it.x, dy: pt.y - it.y, moveu: false, id: e.pointerId };
    document.getElementById('quarto').setPointerCapture(e.pointerId);
  });
  document.getElementById('quarto').addEventListener('pointermove', e => {
    if (!arraste || e.pointerId !== arraste.id) return;
    const pt = pontoNoQuarto(e);
    const { it } = arraste;
    const ax = it.x, ay = it.y;
    it.x = pt.x - arraste.dx; it.y = pt.y - arraste.dy;
    prender(it);
    if (it.x !== ax || it.y !== ay) { arraste.moveu = true; renderQuarto(); }
  });
  function soltar(e) {
    if (!arraste || e.pointerId !== arraste.id) return;
    const moveu = arraste.moveu;
    arraste = null;
    if (moveu) mudou();
  }
  document.getElementById('quarto').addEventListener('pointerup', soltar);
  document.getElementById('quarto').addEventListener('pointercancel', soltar);

  // ================= janelas estilo Win98 =================
  let zTopo = 100;

  function fecharJanela(j) {
    if (!j || !j.isConnected) return;
    j.remove();
    if (typeof j._aoFechar === 'function') j._aoFechar();
  }

  function abrirJanela(id, titulo, largura, aoFechar, aEsquerda) {
    fecharJanela(document.getElementById('jan-' + id));
    const abertas = document.querySelectorAll('.janela').length;
    const j = document.createElement('section');
    j.className = 'janela';
    j.id = 'jan-' + id;
    j.setAttribute('role', 'dialog');
    j.setAttribute('aria-label', titulo);
    j.style.width = largura + 'px';
    j.style.zIndex = ++zTopo;
    j._aoFechar = aoFechar;
    j.innerHTML = `<header class="janela-titulo"><span>${esc(titulo)}</span>
      <button class="btn98 janela-fechar" aria-label="Fechar">X</button></header>
      <div class="janela-corpo"></div>`;
    document.getElementById('janelas').appendChild(j);
    const w = Math.min(largura, innerWidth - 16);
    j.style.left = (aEsquerda ? 8 : Math.max(8, (innerWidth - w) / 2 + abertas * 24)) + 'px';
    j.style.top = Math.max(8, Math.min(70, innerHeight * 0.08) + abertas * 24) + 'px';
    j.querySelector('.janela-fechar').addEventListener('click', () => fecharJanela(j));
    j.addEventListener('pointerdown', () => { j.style.zIndex = ++zTopo; });
    arrastavel(j);
    j.querySelector('.janela-fechar').focus();
    return j.querySelector('.janela-corpo');
  }

  function arrastavel(j) {
    const barra = j.querySelector('.janela-titulo');
    barra.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const r = j.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      barra.setPointerCapture(e.pointerId);
      const mover = ev => {
        j.style.left = limitar(ev.clientX - dx, 0, innerWidth - 60) + 'px';
        j.style.top = limitar(ev.clientY - dy, 0, innerHeight - 30) + 'px';
      };
      const parar = () => {
        barra.removeEventListener('pointermove', mover);
        barra.removeEventListener('pointerup', parar);
      };
      barra.addEventListener('pointermove', mover);
      barra.addEventListener('pointerup', parar);
    });
  }

  const campo = (rotulo, nome, valor, tipo = 'text', extra = '') =>
    `<label class="campo"><span>${rotulo}</span><input type="${tipo}" name="${nome}" value="${esc(valor)}" ${extra}></label>`;
  const opcoes = (obj, atual) => Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === atual ? 'selected' : ''}>${esc(v)}</option>`).join('');

  const JANELAS = {
    estante: {
      titulo: '📀 Estante de DVDs', largura: 480,
      html() {
        const p = perfil();
        return `<p>${p.assistidos.length} filme(s) na estante</p>
          ${p.assistidos.length ? `<ul class="lista-filmes">${p.assistidos.map((f, i) => `
            <li><span class="lombada" style="background:${corDe(f.titulo)}"></span>
              <span><b>${esc(f.titulo)}</b> <small>${f.ano ? '(' + esc(f.ano) + ')' : ''} ${fmtData(f.data)}</small>
                ${(() => { const m = window.Filmes.metaDe(f); return m && m.generos.length ? `<br><small class="generos">${m.generos.slice(0, 3).map(esc).join(' · ')}</small>` : ''; })()}
                ${f.comentario ? `<span class="comentario-estante">“${esc(f.comentario)}”</span>` : ''}</span>
              <span class="estrelas" title="${f.nota} de 5">${estrelas(f.nota)}</span>
              ${ehMeu() ? `<button class="btn98 mini" data-tirar="${i}" aria-label="Tirar ${esc(f.titulo)} da estante">x</button>` : ''}
            </li>`).join('')}</ul>` : '<p class="vazio">estante vazia... bora assistir algo!</p>'}
          ${ehMeu() ? `<form class="form98" id="f-filme">
            <fieldset><legend>Guardar filme na estante</legend>
              <div class="linha">
                ${campo('Título (digite pra buscar)', 'titulo', '', 'text', 'required maxlength="80" placeholder="ex.: matrix"')}
                <span class="curto">${campo('Ano', 'ano', '', 'number', 'min="1888" max="2100"')}</span>
                <label class="campo curto"><span>Nota</span><select name="nota">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${'★'.repeat(n)}</option>`).join('')}</select></label>
              </div>
              <label class="campo"><span>O que achou? (opcional)</span><textarea name="comentario" maxlength="280" rows="2" placeholder="ex.: chorei no final, recomendo demais"></textarea></label>
              <button class="btn98" type="submit">Guardar</button>
            </fieldset>
          </form>` : ''}`;
      },
      bind(corpo, redesenhar) {
        let escolhido = null; // filme escolhido na busca (com ano, gêneros etc.)
        const form = corpo.querySelector('#f-filme');
        if (form) {
          window.Busca.anexar(form.elements.titulo, {
            aoEscolher(det) {
              escolhido = det;
              if (det.ano) form.elements.ano.value = det.ano;
              form.elements.nota.focus();
            }
          });
        }
        corpo.onsubmit = e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const titulo = String(fd.get('titulo')).trim();
          if (!titulo) return;
          const novo = { titulo, ano: Number(fd.get('ano')) || '', nota: Number(fd.get('nota')) || 3, data: hoje() };
          const comentario = String(fd.get('comentario') || '').trim().slice(0, 280);
          if (comentario) novo.comentario = comentario;
          if (escolhido && escolhido.meta && escolhido.titulo === titulo) novo.meta = escolhido.meta;
          perfil().assistidos.unshift(novo);
          mudou(); redesenhar();
          corpo.querySelector('input[name=titulo]').focus();
        };
        corpo.onclick = e => {
          const b = e.target.closest('[data-tirar]');
          if (!b || !ehMeu()) return;
          perfil().assistidos.splice(Number(b.dataset.tirar), 1);
          mudou(); redesenhar();
        };
      }
    },

    posteres: {
      titulo: '🖼️ Favoritos', largura: 620,
      html(idx) {
        return `<div class="cartoes-posteres">${perfil().posteres.map((p, i) => {
          const img = urlSegura(p.imagem);
          const fundo = img ? `background-image:url('${esc(img)}')` : `background-color:${corValida(p.cor, '#444444')}`;
          return `<article class="cartao-poster ${String(i) === String(idx) ? 'ativo' : ''}">
            <div class="mini-poster" style="${fundo}">${img ? '' : esc(p.titulo)}</div>
            <h3>#${i + 1} ${esc(p.titulo)}</h3>
            ${p.ano ? `<p><small>${esc(p.ano)}</small></p>` : ''}
            <p>${esc(p.motivo) || '<span class="vazio">sem comentário</span>'}</p>
          </article>`;
        }).join('')}</div>
        ${ehMeu() ? '<p><small>Troque os pôsteres em “Decorar e mudar a vibe”.</small></p>' : ''}`;
      }
    },

    tv: {
      titulo: '📺 Na TV agora', largura: 440,
      html() {
        const a = perfil().assistindo || {};
        const prog = window.Filmes.progressoDe(a);
        return a.titulo ? `
          <div class="tela-crt">
            <div class="canal">CANAL 03 ▸ AO VIVO</div>
            <h3>${esc(a.titulo)}</h3>
            <p>${esc(a.detalhe)}</p>
          </div>
          ${a.comentario ? `<p class="comentario-tv">💬 “${esc(a.comentario)}”</p>` : ''}
          <p>Progresso: ${prog}%</p>
          <div class="barra98"><div style="width:${prog}%"></div></div>
          <p>${htmlSomTV()}</p>`
          : `<div class="tela-crt"><div class="canal">CANAL 03</div><h3>sem sinal...</h3></div>`;
      }
    },

    computador: {
      titulo: '💾 Meu Computador', largura: 500, aba: 'listas',
      html() {
        const p = perfil();
        const abaBtn = (id, rotulo) => `<button class="aba" role="tab" aria-selected="${this.aba === id}" data-aba="${id}">${rotulo}</button>`;
        let painel;
        if (this.aba === 'listas') {
          painel = `<p class="caminho">C:\\Meus Documentos\\Listas</p>
            ${p.listas.map((l, i) => `
              <fieldset><legend>📋 ${esc(l.nome)}</legend>
                ${l.itens.length ? `<ol class="itens-lista">${l.itens.map((it, j) => `<li>${esc(it)}${ehMeu() ? `<button class="btn98 mini" data-tirar-item="${i}:${j}" aria-label="Remover ${esc(it)}">x</button>` : ''}</li>`).join('')}</ol>` : '<p class="vazio">lista vazia</p>'}
                ${ehMeu() ? `<form class="form98 linha" data-lista="${i}">
                  <input type="text" name="item" placeholder="adicionar..." required maxlength="80" aria-label="Novo item em ${esc(l.nome)}" style="flex:1">
                  <button class="btn98" type="submit">+</button>
                </form>` : ''}
              </fieldset>`).join('')}
            ${ehMeu() ? `<form class="form98 linha" data-nova-lista>
              <input type="text" name="nome" placeholder="nome da nova lista" required maxlength="40" aria-label="Nome da nova lista" style="flex:1">
              <button class="btn98" type="submit">Nova lista</button>
            </form>` : ''}`;
        } else {
          painel = `<p class="caminho">C:\\Meus Documentos\\diario.txt</p>
            ${ehMeu() ? `<form class="form98" data-diario>
              <textarea name="texto" placeholder="querido diário, hoje eu assisti..." required maxlength="1000" aria-label="Nova página do diário"></textarea>
              <p><button class="btn98" type="submit">Escrever</button></p>
            </form>` : ''}
            ${p.diario.map(d => `<div class="entrada-diario"><time>${fmtData(d.data)}</time><p>${esc(d.texto)}</p></div>`).join('') || '<p class="vazio">nenhuma página ainda</p>'}`;
        }
        return `<div class="abas" role="tablist">${abaBtn('listas', '📋 Listas')}${abaBtn('diario', '📓 Diário')}</div>
          <div class="painel">${painel}</div>`;
      },
      bind(corpo, redesenhar) {
        corpo.onclick = e => {
          const aba = e.target.closest('[data-aba]');
          if (aba) { JANELAS.computador.aba = aba.dataset.aba; redesenhar(); return; }
          const tirar = e.target.closest('[data-tirar-item]');
          if (tirar && ehMeu()) {
            const [i, j] = tirar.dataset.tirarItem.split(':').map(Number);
            perfil().listas[i].itens.splice(j, 1);
            mudou(); redesenhar();
          }
        };
        corpo.onsubmit = e => {
          e.preventDefault();
          if (!ehMeu()) return;
          const f = e.target, fd = new FormData(f), p = perfil();
          if (f.dataset.lista !== undefined) p.listas[Number(f.dataset.lista)].itens.push(String(fd.get('item')).trim());
          else if (f.hasAttribute('data-nova-lista')) p.listas.push({ nome: String(fd.get('nome')).trim(), itens: [] });
          else if (f.hasAttribute('data-diario')) p.diario.unshift({ data: hoje(), texto: String(fd.get('texto')).trim() });
          mudou(); redesenhar();
        };
      }
    },

    mural: {
      titulo: '📌 Mural', largura: 460,
      html() {
        const p = perfil();
        return `<table class="ficha">
            <tr><th>nome</th><td>${esc(p.nome)}</td></tr>
            <tr><th>humor</th><td>${esc(p.humor)}</td></tr>
            <tr><th>cidade</th><td>${esc(p.cidade)}</td></tr>
            <tr><th>filmes</th><td>${p.assistidos.length} na estante</td></tr>
          </table>
          <form class="form98" id="f-recado">
            <fieldset><legend>Deixe um recado!</legend>
              ${estadoConta === 'dentro' ? `<p>recado como <b>@${esc(perfis.eu.usuario)}</b></p>` : campo('Seu nome', 'de', ehMeu() ? '' : perfis.eu.nome, 'text', 'required maxlength="30"')}
              <label class="campo"><span>Recado</span><textarea name="texto" required maxlength="300"></textarea></label>
              <button class="btn98" type="submit">Colar no mural</button>
            </fieldset>
          </form>
          <div>${p.recados.map(r => `<div class="recado"><time>${fmtData(r.data)}</time><b>${esc(r.de)}</b> disse:<p>${esc(r.texto)}</p></div>`).join('') || '<p class="vazio">nenhum recado ainda :(</p>'}</div>`;
      },
      bind(corpo, redesenhar) {
        corpo.onsubmit = e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const texto = String(fd.get('texto')).trim();
          if (estadoConta === 'dentro' && perfil().uid) {
            const alvo = perfil();
            window.Conta.enviarRecado(alvo.uid, texto)
              .then(r => { alvo.recados.unshift(recadoDaLinha(r)); renderTudo(); redesenhar(); })
              .catch(err => avisar('⚠ ' + err.message));
            return;
          }
          perfil().recados.unshift({ de: String(fd.get('de')).trim(), texto, data: hoje() });
          mudou(); redesenhar();
        };
      }
    },

    trofeus: {
      titulo: '🏆 Troféus', largura: 480,
      html() {
        const p = perfil();
        const n = TROFEUS.filter(t => t.ok(p)).length;
        return `<p>${n} de ${TROFEUS.length} conquistas</p>
          <div class="grade-trofeus">${TROFEUS.map(t => {
            const ok = t.ok(p);
            return `<div class="trofeu ${ok ? '' : 'bloqueado'}"><span class="icone" aria-hidden="true">${ok ? t.icone : '🔒'}</span>
              <b>${ok ? t.nome : '???'}</b><small>${t.desc}</small></div>`;
          }).join('')}</div>`;
      }
    },

    arrumar: {
      titulo: '🪑 Arrumar móveis', largura: 330, soDono: true, aEsquerda: true,
      aoAbrir() {
        modoEdicao = true; renderQuarto();
        // no celular a janela fica embaixo: sobe a tela até o quarto
        if (innerWidth <= 700) document.querySelector('.moldura-quarto').scrollIntoView({ behavior: 'smooth' });
      },
      aoFechar() { modoEdicao = false; selecionado = null; JANELAS.arrumar._redesenhar = null; renderQuarto(); },
      html() {
        const ctx = contexto(perfil());
        const sel = itemSelecionado();
        let painelSel = '<p class="vazio">clique num móvel do quarto pra selecionar</p>';
        if (sel) {
          const d = defDe(sel);
          const f = forma(sel);
          const vars = d.variantes ? `<div class="variantes">${Object.entries(d.variantes).map(([k, v]) =>
            `<button type="button" class="variante ${(sel.v || Object.keys(d.variantes)[0]) === k ? 'ativa' : ''}" data-variante="${k}" title="${esc(v.nome)}" aria-label="${esc(v.nome)}" style="background:${v.amostra}"></button>`).join('')}</div>` : '';
          const modelos = d.modelos ? `<p class="rotulo-campo">Modelo</p><div class="modelos">${Object.entries(d.modelos).map(([k, m]) =>
            `<button type="button" class="item-catalogo modelo ${f.modelo === k ? 'ativo' : ''}" data-modelo="${k}" aria-pressed="${f.modelo === k}">
              <span class="thumb">${window.Sprites.miniatura(sel.id, sel.v, ctx, k)}</span><span>${esc(m.rotulo)}</span></button>`).join('')}</div>` : '';
          painelSel = `<div class="selecao">
              <span class="thumb">${window.Sprites.miniatura(sel.id, sel.v, ctx, sel.m, sel.r)}</span>
              <div><b>${esc(d.nome)}</b>${vars}</div>
            </div>
            ${modelos}
            <p class="linha">
              ${podeGirar(sel) ? `<button class="btn98" data-girar title="Atalho: tecla R">⟳ Girar</button> <small class="direcao">(${nomeDirecao(sel)})</small>` : ''}
              <button class="btn98" data-remover>🗑 Tirar do quarto</button>
            </p>`;
        }
        const cats = {};
        for (const [id, d] of Object.entries(CATALOGO)) (cats[d.categoria] = cats[d.categoria] || []).push([id, d]);
        return `<p class="dica-edicao">Arraste os móveis pelo quarto. Com um selecionado: setas ajustam a posição, R gira e Delete tira do quarto.</p>
          <fieldset><legend>Selecionado</legend>${painelSel}</fieldset>
          ${Object.entries(cats).map(([cat, lista]) => `
            <fieldset><legend>+ ${cat}</legend><div class="catalogo">${lista.map(([id, d]) => {
              const ok = podeAdicionar(id);
              return `<button type="button" class="item-catalogo" data-add="${id}" ${ok ? '' : 'disabled'} title="${ok ? 'Adicionar ' + esc(d.nome) : 'Já está no quarto'}">
                <span class="thumb">${window.Sprites.miniatura(id, undefined, ctx)}</span><span>${esc(d.nome)}</span></button>`;
            }).join('')}</div></fieldset>`).join('')}
          <p><button class="btn98" data-pronto>✔ Pronto</button></p>`;
      },
      bind(corpo) {
        corpo.onclick = e => {
          const add = e.target.closest('[data-add]');
          if (add) { adicionar(add.dataset.add); return; }
          const v = e.target.closest('[data-variante]');
          const sel = itemSelecionado();
          if (v && sel) { sel.v = v.dataset.variante; mudou(); return; }
          const mod = e.target.closest('[data-modelo]');
          if (mod && sel) {
            sel.m = mod.dataset.modelo;
            if (!podeGirar(sel)) sel.r = 0;
            prender(sel); mudou(); return;
          }
          if (e.target.closest('[data-girar]') && sel) { girarSelecionado(); return; }
          if (e.target.closest('[data-remover]') && sel) { removerSelecionado(); return; }
          if (e.target.closest('[data-pronto]')) fecharJanela(document.getElementById('jan-arrumar'));
        };
      }
    },

    tmdb: {
      titulo: '⚙️ Conectar ao TMDB', largura: 480,
      html() {
        const tem = window.Filmes.temChave();
        return `<p>O <b>TMDB</b> é uma base gratuita de filmes e séries. Conectando, a busca encontra qualquer título,
          com capa, gêneros, duração, diretor e elenco, e as estatísticas ficam completas.</p>
          <ol class="passos">
            <li>Crie uma conta grátis em <a href="https://www.themoviedb.org/signup" target="_blank" rel="noopener">themoviedb.org</a>.</li>
            <li>Vá em <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">Configurações → API</a> e peça uma chave (uso pessoal).</li>
            <li>Cole aqui a <b>Chave da API</b> ou o <b>Token de leitura</b>:</li>
          </ol>
          <form class="form98" id="f-tmdb">
            <label class="campo"><span>Chave do TMDB</span>
              <input type="password" name="chave" autocomplete="off" spellcheck="false" placeholder="${tem ? '•••••••• (já conectado)' : 'cole aqui'}"></label>
            <p class="linha">
              <button class="btn98" type="submit">🔌 Testar e salvar</button>
              ${tem ? '<button class="btn98" type="button" data-desconectar>Desconectar</button>' : ''}
              <span class="msg" role="status">${tem ? '✔ conectado' : 'usando o catálogo de exemplo'}</span>
            </p>
          </form>
          <p><small>${estadoConta === 'dentro'
            ? 'A chave fica guardada na sua conta (só você vê) e volta sozinha quando você entra em outro navegador.'
            : 'Sem conta, a chave fica guardada só neste navegador (e neste endereço). Entrando na sua conta, ela vai junto pra qualquer navegador.'}
            Não compartilhe a sua chave com ninguém.</small></p>`;
      },
      bind(corpo, redesenhar) {
        corpo.onsubmit = async e => {
          e.preventDefault();
          const valor = String(new FormData(e.target).get('chave') || '').trim();
          const msg = corpo.querySelector('.msg');
          if (!valor) { msg.textContent = 'cole a chave primeiro'; return; }
          msg.textContent = 'testando...';
          try {
            await window.Filmes.testar(valor);
            atualizarRodapeTmdb();
            if (estadoConta === 'dentro') window.Conta.guardarPreferencia('tmdbChave', valor).catch(err => avisar('⚠ não guardei a chave na conta: ' + err.message));
            redesenhar();
            corpo.querySelector('.msg').textContent = '✔ conectado! a busca agora usa o TMDB';
            if (tela === 'stats') rota();
          } catch (err) {
            msg.textContent = '⚠ ' + err.message;
          }
        };
        corpo.onclick = e => {
          if (!e.target.closest('[data-desconectar]')) return;
          window.Filmes.definirChave('');
          atualizarRodapeTmdb();
          if (estadoConta === 'dentro') window.Conta.guardarPreferencia('tmdbChave', null).catch(err => avisar('⚠ ' + err.message));
          redesenhar();
          if (tela === 'stats') rota();
        };
      }
    },

    decorar: {
      titulo: '🖌️ Decorar e mudar a vibe', largura: 580, soDono: true,
      html() {
        const p = perfil();
        const a = p.assistindo || {};
        const pet = p.pet || { tipo: 'nenhum' };
        const amostras = (nome, obj, atual) => `<div class="swatches">${Object.entries(obj).map(([k, v]) => `
          <label class="swatch"><input type="radio" name="${nome}" value="${k}" ${k === atual ? 'checked' : ''}>
            <span class="amostra amostra-${nome}-${k}"></span>${esc(v)}</label>`).join('')}</div>`;
        const faixas = { nenhuma: '🔇 Nenhuma' };
        for (const [k, f] of Object.entries(window.Musica.FAIXAS)) faixas[k] = f.nome;
        const tiposPet = { nenhum: 'Nenhum' };
        for (const [k, t] of Object.entries(PETS)) tiposPet[k] = t.nome;
        return `<form class="form98" id="f-decorar">
          <p class="dica-edicao">As mudanças são salvas na hora ✔</p>
          <fieldset><legend>✨ Vibe</legend>
            <p>Luz</p>${amostras('luz', LUZES, p.luz)}
            <div class="linha">
              <label class="campo"><span>Efeito</span><select name="efeito">${opcoes(EFEITOS, p.efeito)}</select></label>
              <label class="campo"><span>Música do quarto</span><select name="musica">${opcoes(faixas, p.musica)}</select></label>
              <button class="btn98" type="button" data-ouvir>▶ ouvir</button>
            </div>
          </fieldset>
          <fieldset><legend>🐾 Bichinho</legend>
            <div class="linha">
              <label class="campo"><span>Tipo</span><select name="pet_tipo">${opcoes(tiposPet, PETS[pet.tipo] ? pet.tipo : 'nenhum')}</select></label>
              <label class="campo"><span>Cor</span><select name="pet_cor">${opcoesCorPet(pet.tipo, pet.cor)}</select></label>
              ${campo('Nome', 'pet_nome', pet.nome || '', 'text', 'maxlength="20"')}
            </div>
          </fieldset>
          <fieldset><legend>Papel de parede</legend>${amostras('papel', PAPEIS, p.papel)}</fieldset>
          <fieldset><legend>Chão</legend>${amostras('piso', PISOS, p.piso)}</fieldset>
          <fieldset><legend>Você</legend>
            <div class="linha">${campo('Nome', 'nome', p.nome, 'text', 'required maxlength="30"')}${campo('Humor', 'humor', p.humor, 'text', 'maxlength="40"')}</div>
            <div class="linha">${campo('Cidade', 'cidade', p.cidade, 'text', 'maxlength="40"')}
              <label class="campo curto"><span>Cor do perfil</span><input type="color" name="corDestaque" value="${corValida(p.corDestaque, '#ff66cc')}"></label></div>
            <div class="poster-imagem">
              <div class="previa-avatar">${urlSegura(p.avatar) ? `<img src="${esc(urlSegura(p.avatar))}" alt="Sua foto">` : avatarPadrao(p)}</div>
              <div class="poster-imagem-campos">
                <span>Foto do perfil</span>
                <input type="hidden" name="avatar" value="${esc(p.avatar)}">
                <label class="btn98 botao-arquivo">📁 Enviar foto
                  <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-upload-avatar>
                </label>
                ${p.avatar ? '<button class="btn98" type="button" data-tirar-avatar>Remover foto</button>' : ''}
                ${campo('ou cole um link', 'avatar_link', ehUpload(p.avatar) ? '' : p.avatar, 'text', 'placeholder="https://... ou assets/foto.png" data-avatar-link')}
                <small class="aviso-upload" data-aviso="avatar" role="status"></small>
              </div>
            </div>
            <label class="campo"><span>Sobre mim</span><textarea name="sobre" maxlength="500">${esc(p.sobre)}</textarea></label>
          </fieldset>
          ${p.posteres.map((po, i) => `
            <fieldset><legend>Pôster ${i + 1}</legend>
              <div class="linha">${campo('Filme', `p${i}_titulo`, po.titulo, 'text', 'maxlength="60"')}
                <span class="curto">${campo('Ano', `p${i}_ano`, po.ano, 'number', 'min="1888" max="2100"')}</span>
                <label class="campo curto"><span>Cor</span><input type="color" name="p${i}_cor" value="${corValida(po.cor, '#444444')}"></label></div>
              <div class="poster-imagem">
                <div class="previa-poster" style="${urlSegura(po.imagem) ? `background-image:url('${esc(urlSegura(po.imagem))}')` : `background-color:${corValida(po.cor, '#444444')}`}">${urlSegura(po.imagem) ? '' : 'sem<br>imagem'}</div>
                <div class="poster-imagem-campos">
                  <input type="hidden" name="p${i}_imagem" value="${esc(po.imagem)}">
                  <label class="btn98 botao-arquivo">📁 Enviar imagem
                    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" data-upload="${i}">
                  </label>
                  ${po.imagem ? `<button class="btn98" type="button" data-tirar-imagem="${i}">Remover imagem</button>` : ''}
                  ${campo('ou cole um link', `p${i}_link`, ehUpload(po.imagem) ? '' : po.imagem, 'text', `placeholder="https://... ou assets/poster.png" data-link="${i}"`)}
                  <small class="aviso-upload" data-aviso="${i}" role="status"></small>
                </div>
              </div>
              ${campo('Por que é favorito?', `p${i}_motivo`, po.motivo, 'text', 'maxlength="140"')}
            </fieldset>`).join('')}
          <fieldset><legend>Na TV agora</legend>
            <div class="linha">${campo('Título (digite pra buscar)', 'tv_titulo', a.titulo, 'text', 'maxlength="60"')}${campo('Detalhe', 'tv_detalhe', a.detalhe, 'text', 'maxlength="60" placeholder="T1 · E05"')}</div>
            <div class="linha seletor-episodio" data-seletor-tv hidden></div>
            ${(() => {
              const auto = window.Filmes.progressoCalculado(a);
              return `<label class="campo"><span>Progresso: <output name="tv_saida">${window.Filmes.progressoDe(a)}</output>%
                ${auto !== null ? '<small>(calculado pela temporada e episódio)</small>' : ''}</span>
                <input type="range" name="tv_progresso" min="0" max="100" value="${window.Filmes.progressoDe(a)}" ${auto !== null ? 'disabled' : ''}></label>`;
            })()}
          </fieldset>
          <div class="linha">
            <button class="btn98" type="button" data-restaurar>Restaurar padrão</button>
            <span class="msg" role="status"></span>
          </div>
        </form>`;
      },
      bind(corpo, redesenhar) {
        const form = corpo.querySelector('form');
        form.oninput = e => {
          if (e.target.name === 'tv_progresso') form.elements.tv_saida.value = e.target.value;
        };
        // busca de filmes nos pôsteres (já traz ano e capa) e na TV
        perfil().posteres.forEach((_, i) => {
          window.Busca.anexar(form.elements[`p${i}_titulo`], {
            aoEscolher(det) {
              if (det.ano) form.elements[`p${i}_ano`].value = det.ano;
              if (det.meta && det.meta.poster) form.elements[`p${i}_imagem`].value = det.meta.poster;
              salvarForm(); redesenhar();
            }
          });
        });
        escolhaTv = null;
        window.Busca.anexar(form.elements.tv_titulo, { aoEscolher(det) { escolhaTv = det; salvarForm(); redesenhar(); } });
        // série com temporadas conhecidas: escolhe temporada/episódio em vez de digitar
        {
          const a = perfil().assistindo || {};
          const meta = a.titulo && window.Filmes.metaDe(a);
          const atual = window.Filmes.episodioDe(a.detalhe);
          const acabouDeEscolher = escolhaTv && escolhaTv.titulo === a.titulo;
          let pronto = !atual && acabouDeEscolher; // série nova: já grava "Temporada 1 · Episódio 1"
          if (meta && meta.temporadas && meta.temporadas.length && (atual || acabouDeEscolher || !String(a.detalhe || '').trim())) {
            window.Busca.seletorEpisodio(corpo.querySelector('[data-seletor-tv]'), meta.temporadas, atual, texto => {
              if (!pronto) return;
              form.elements.tv_detalhe.value = texto;
              salvarForm();
              const a2 = perfil().assistindo;
              form.elements.tv_saida.value = window.Filmes.progressoDe(a2);
              form.elements.tv_progresso.value = window.Filmes.progressoDe(a2);
              form.elements.tv_progresso.disabled = window.Filmes.progressoCalculado(a2) !== null;
            });
          }
          pronto = true;
        }
        form.onsubmit = e => e.preventDefault();
        const aviso = (i, texto) => { const a = corpo.querySelector(`[data-aviso="${i}"]`); if (a) a.textContent = texto; };
        const salvarForm = () => {
          const ok = aplicarDecorar(form);
          corpo.querySelector('.msg').textContent = ok ? 'salvo ✔' : '⚠ não deu pra salvar: o navegador está sem espaço';
          return ok;
        };
        form.onchange = async e => {
          const t = e.target;
          if (t.dataset.upload !== undefined) {
            const i = t.dataset.upload;
            const arquivo = t.files && t.files[0];
            if (!arquivo) return;
            aviso(i, 'carregando...');
            try {
              const dados = await guardarImagem(await imagemParaPoster(arquivo));
              const antes = form.elements[`p${i}_imagem`].value;
              form.elements[`p${i}_imagem`].value = dados;
              if (salvarForm()) { redesenhar(); }
              else { form.elements[`p${i}_imagem`].value = antes; aplicarDecorar(form); aviso(i, '⚠ sem espaço no navegador pra essa imagem'); }
            } catch (err) {
              aviso(i, '⚠ ' + err.message);
            }
            return;
          }
          if (t.dataset.uploadAvatar !== undefined) {
            const arquivo = t.files && t.files[0];
            if (!arquivo) return;
            aviso('avatar', 'carregando...');
            try {
              // recorta quadrado, 128x128 (o tamanho da caixa de perfil)
              const dados = await guardarImagem(await imagemParaPoster(arquivo, 128, 128));
              const antes = form.elements.avatar.value;
              form.elements.avatar.value = dados;
              if (salvarForm()) { redesenhar(); }
              else { form.elements.avatar.value = antes; aplicarDecorar(form); aviso('avatar', '⚠ sem espaço no navegador pra essa imagem'); }
            } catch (err) {
              aviso('avatar', '⚠ ' + err.message);
            }
            return;
          }
          if (t.dataset.avatarLink !== undefined) form.elements.avatar.value = t.value.trim();
          if (t.dataset.link !== undefined) form.elements[`p${t.dataset.link}_imagem`].value = t.value.trim();
          if (t.name === 'pet_tipo') form.elements.pet_cor.innerHTML = opcoesCorPet(t.value);
          salvarForm();
          if (t.name === 'tv_titulo' || t.name === 'tv_detalhe') {
            // a barra de progresso passa a ser automática quando dá pra calcular pela temporada/episódio
            const a = perfil().assistindo;
            const auto = window.Filmes.progressoCalculado(a);
            form.elements.tv_saida.value = window.Filmes.progressoDe(a);
            form.elements.tv_progresso.value = window.Filmes.progressoDe(a);
            form.elements.tv_progresso.disabled = auto !== null;
          }
        };
        corpo.onclick = e => {
          if (e.target.closest('[data-tirar-avatar]')) {
            form.elements.avatar.value = '';
            salvarForm(); redesenhar();
            return;
          }
          const tirar = e.target.closest('[data-tirar-imagem]');
          if (tirar) {
            form.elements[`p${tirar.dataset.tirarImagem}_imagem`].value = '';
            salvarForm(); redesenhar();
            return;
          }
          if (e.target.closest('[data-ouvir]')) {
            const m = form.elements.musica.value;
            if (window.Musica.FAIXAS[m]) window.Musica.tocar(m); else window.Musica.parar();
            return;
          }
          if (!e.target.closest('[data-restaurar]')) return;
          if (!confirm('Voltar seu quarto para o padrão? Isso apaga suas mudanças.')) return;
          { const antes = perfis.eu; perfis.eu = clonar(window.QUARTINHO_DADOS.perfis.eu); if (antes.uid) Object.assign(perfis.eu, { id: "eu", uid: antes.uid, usuario: antes.usuario, recados: antes.recados }); }
          Pet.estado = null;
          mudou(); redesenhar();
        };
      }
    }
  };

  JANELAS.blog = window.Blog.janela({ perfil, salvar, renderTudo: () => { renderTudo(); atualizarArrumar(); }, guardarImagem: d => guardarImagem(d) });

  function opcoesCorPet(tipo, atual) {
    const t = PETS[tipo];
    if (!t) return '<option value="">—</option>';
    return Object.entries(t.cores).map(([k, c]) => `<option value="${k}" ${k === atual ? 'selected' : ''}>${esc(c.nome)}</option>`).join('');
  }

  let escolhaTv = null; // série/filme escolhido na busca do campo "Na TV agora"
  function aplicarDecorar(form) {
    const p = perfil();
    const fd = new FormData(form);
    const s = k => String(fd.get(k) || '').trim();
    const musicaAntes = p.musica;
    p.nome = s('nome') || 'sem_nome';
    p.humor = s('humor');
    p.cidade = s('cidade');
    p.corDestaque = corValida(s('corDestaque'), '#ff66cc');
    p.avatar = s('avatar');
    p.sobre = s('sobre');
    p.papel = PAPEIS[s('papel')] ? s('papel') : 'listras';
    p.piso = PISOS[s('piso')] ? s('piso') : 'madeira';
    p.luz = LUZES[s('luz')] ? s('luz') : 'dia';
    p.efeito = EFEITOS[s('efeito')] ? s('efeito') : 'nenhum';
    p.musica = window.Musica.FAIXAS[s('musica')] ? s('musica') : 'nenhuma';
    const tipoPet = PETS[s('pet_tipo')] ? s('pet_tipo') : 'nenhum';
    if (!p.pet || p.pet.tipo !== tipoPet) Pet.estado = null;
    p.pet = { tipo: tipoPet, cor: s('pet_cor'), nome: s('pet_nome') };
    p.posteres = p.posteres.map((_, i) => ({
      titulo: s(`p${i}_titulo`),
      ano: Number(s(`p${i}_ano`)) || '',
      cor: corValida(s(`p${i}_cor`), '#444444'),
      imagem: s(`p${i}_imagem`),
      motivo: s(`p${i}_motivo`)
    }));
    // mantém as informações da série (temporadas) se o título não mudou
    const tvAntes = p.assistindo || {};
    const tvNovo = { titulo: s('tv_titulo'), detalhe: s('tv_detalhe'), progresso: Number(s('tv_progresso')) || 0 };
    if (tvAntes.meta && tvAntes.titulo === tvNovo.titulo) tvNovo.meta = tvAntes.meta;
    if (tvAntes.comentario && tvAntes.titulo === tvNovo.titulo) tvNovo.comentario = tvAntes.comentario;
    if (escolhaTv && escolhaTv.titulo === tvNovo.titulo && escolhaTv.meta) tvNovo.meta = escolhaTv.meta;
    const auto = window.Filmes.progressoCalculado(tvNovo);
    if (auto !== null) tvNovo.progresso = auto;
    p.assistindo = tvNovo;
    p.decorou = true;
    if (musicaAntes !== p.musica && window.Musica.tocando()) {
      if (window.Musica.FAIXAS[p.musica]) window.Musica.tocar(p.musica); else window.Musica.parar();
    }
    const ok = salvar();
    renderTudo(); atualizarArrumar();
    return ok;
  }

  // Gira 90° mantendo o centro do pé do móvel no mesmo lugar.
  function girarSelecionado() {
    const it = itemSelecionado();
    if (!it || !podeGirar(it)) return;
    const antes = caixa(it);
    it.r = proximaDirecao(it);
    const depois = caixa(it);
    it.x = antes.x + (antes.w - depois.w) / 2;
    it.y = antes.y + (antes.h - depois.h) / 2;
    prender(it);
    mudou();
  }

  function removerSelecionado() {
    const p = perfil();
    p.quarto = p.quarto.filter(it => it.uid !== selecionado);
    selecionado = null;
    mudou();
  }

  function abrir(acao, extra) {
    if (acao === 'musica') { alternarRadio(); return; }
    const def = JANELAS[acao];
    if (!def || (def.soDono && !ehMeu())) return;
    const corpo = abrirJanela(acao, def.titulo, def.largura, def.aoFechar, def.aEsquerda);
    const redesenhar = () => {
      const rolagem = corpo.scrollTop;
      corpo.innerHTML = def.html.call(def, extra);
      if (def.bind) def.bind.call(def, corpo, redesenhar, extra);
      corpo.scrollTop = rolagem;
    };
    def._redesenhar = redesenhar;
    if (def.aoAbrir) def.aoAbrir();
    redesenhar();
  }

  // ================= eventos globais =================
  document.addEventListener('click', e => {
    if (e.target.closest('#pet') && !modoEdicao) { carinho(); return; }
    const visita = e.target.closest('[data-visitar]');
    if (visita) { location.hash = linkQuarto(visita.dataset.visitar); return; }
    if (e.target.closest('[data-radio]')) { alternarRadio(); return; }
    const alvo = e.target.closest('[data-acao]');
    if (alvo && !alvo.closest('.janela')) abrir(alvo.dataset.acao, alvo.dataset.idx);
  });

  document.addEventListener('change', e => {
    if (e.target.matches('[data-som-tv]')) {
      definirSomTV(e.target.checked);
      document.querySelectorAll('[data-som-tv]').forEach(c => { c.checked = somTvPref; });
    }
  });

  document.addEventListener('input', e => {
    if (e.target.matches('[data-volume]')) {
      const v = Number(e.target.value);
      window.Musica.definirVolume(v);
      try { localStorage.setItem(CHAVE_VOLUME, String(v)); } catch (err) { /* ignora */ }
    }
  });

  document.addEventListener('keydown', e => {
    const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (modoEdicao && selecionado && !digitando) {
      const passos = { ArrowLeft: [-GRADE, 0], ArrowRight: [GRADE, 0], ArrowUp: [0, -GRADE], ArrowDown: [0, GRADE] };
      if (passos[e.key]) {
        e.preventDefault();
        const it = itemSelecionado();
        if (it) { it.x += passos[e.key][0]; it.y += passos[e.key][1]; prender(it); mudou(); }
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removerSelecionado(); return; }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); girarSelecionado(); return; }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('hotspot')) {
      e.preventDefault();
      abrir(e.target.dataset.acao, e.target.dataset.idx);
    }
    if (e.key === 'Escape') {
      const janelas = [...document.querySelectorAll('.janela')];
      if (!janelas.length) return;
      fecharJanela(janelas.sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0]);
    }
  });

  const dica = document.getElementById('dica');
  const quarto = document.getElementById('quarto');
  quarto.addEventListener('mousemove', e => {
    const h = e.target.closest('[data-dica]');
    if (!h || arraste) { dica.hidden = true; return; }
    dica.textContent = h.dataset.dica;
    dica.hidden = false;
    dica.style.left = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 8) + 'px';
    dica.style.top = (e.clientY + 18) + 'px';
  });
  quarto.addEventListener('mouseleave', () => { dica.hidden = true; });

  // ================= telas: feed (início) e quarto =================
  // Endereços: #feed, #quarto (o meu), #quarto/ana, #quarto/ana/mural (abre uma janela ao chegar).
  const linkQuarto = (id, janela) => (id === 'eu' ? '#quarto' : '#quarto/' + id) + (janela ? (id === 'eu' ? '/eu/' : '/') + janela : '');

  function mostrarTela(t) {
    tela = t;
    document.getElementById('tela-quarto').hidden = t !== 'quarto';
    document.getElementById('tela-feed').hidden = t !== 'feed';
    document.getElementById('tela-stats').hidden = t !== 'stats';
    document.querySelectorAll('.menu-topo [data-tela]').forEach(a => {
      const ativo = a.dataset.tela === t && (t === 'feed' || atualId === 'eu');
      a.classList.toggle('ativo', ativo);
      if (ativo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function rota() {
    const partes = decodeURIComponent(location.hash.replace(/^#/, '')).split('/');
    if (partes[0] === 'quarto') {
      if (partes[1] && partes[1] !== 'eu' && !perfis[partes[1]] && estadoConta === 'dentro') { visitarRemoto(partes[1], partes[2]); return; }
      const id = perfis[partes[1]] ? partes[1] : 'eu';
      mostrarTela('quarto');
      if (id !== atualId) visitar(id); else renderTudo();
      mostrarTela('quarto');
      if (partes[2] && JANELAS[partes[2]]) abrir(partes[2]);
      return;
    }
    // fora do quarto: bichinho para, janelas do quarto fecham, som da TV desliga
    const sairDoQuarto = () => {
      cancelAnimationFrame(Pet.raf);
      window.Blog.limpar();
      document.querySelectorAll('.janela:not(#jan-tmdb):not(#jan-conta):not(#jan-amigos)').forEach(fecharJanela);
      atualizarSomTV();
    };
    if (partes[0] === 'stats') {
      const id = perfis[partes[1]] ? partes[1] : 'eu';
      mostrarTela('stats');
      sairDoQuarto();
      document.querySelectorAll('.menu-topo [data-tela="stats"]').forEach(a => a.classList.add('ativo'));
      document.title = `estatísticas de ${id === 'eu' ? 'você' : perfis[id].nome} · quartinho.net`;
      window.Stats.render(id);
      window.scrollTo(0, 0);
      return;
    }
    mostrarTela('feed');
    sairDoQuarto();
    document.title = 'início · quartinho.net';
    const amigos = Object.values(perfis).filter(p => p.id !== 'eu');
    document.getElementById('letreiro-texto').textContent =
      `~*~ bem-vindo(a) de volta, ${perfis.eu.nome}!!! ~*~ ${amigos.length} amigos no quartinho.net ~*~ ` +
      amigos.filter(p => p.assistindo && p.assistindo.titulo).map(p => `${p.nome} tá vendo ${p.assistindo.titulo}`).join(' ~*~ ') + ' ~*~';
    window.Feed.render();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', rota);

  // ================= contas (Supabase) =================
  // Sem conta: modo demonstração (localStorage + amigos de exemplo).
  // Com conta: "eu" é o meu perfil do banco e os outros são quem eu sigo (a chave no mapa é o @usuario).
  const Conta = window.Conta;
  let seguindo = new Set();
  let estadoConta = Conta.configurado ? 'carregando' : 'demo'; // demo | carregando | fora | dentro

  function perfilNovo(nome) {
    const p = clonar(window.QUARTINHO_DADOS.perfis.eu);
    Object.assign(p, {
      nome, humor: '✨ novo por aqui', cidade: '', sobre: 'acabei de me mudar pro quartinho.net!', avatar: '',
      assistidos: [], listas: [], diario: [], recados: [], decorou: false,
      assistindo: { titulo: '', detalhe: '', progresso: 0 }
    });
    p.posteres = (p.posteres || []).map(() => ({ titulo: '', ano: '', cor: '#444444', imagem: '', motivo: '' }));
    return p;
  }
  // O que vai pro banco: o perfil sem os campos que o próprio banco guarda.
  function dadosParaBanco(p) {
    const { id, uid, usuario, recados, soVisita, ...resto } = p;
    return clonar(resto);
  }
  const recadoDaLinha = r => ({ id: r.id, deUid: r.de, de: (r.autor && r.autor.usuario) || '?', texto: r.texto, data: String(r.criado_em).slice(0, 10) });
  function perfilDaLinha(linha, idLocal, recados) {
    const p = Object.assign(perfilNovo(linha.usuario), linha.dados || {});
    Object.assign(p, { id: idLocal, uid: linha.id, usuario: linha.usuario });
    p.recados = recados.filter(r => r.para === linha.id).map(recadoDaLinha);
    if (!Array.isArray(p.posteres) || p.posteres.length < 3) p.posteres = perfilNovo('').posteres;
    return p;
  }
  // Troca as imagens enviadas (que estão dentro dos dados) por links no armazenamento do Supabase.
  async function subirImagens(d) {
    const sobe = async u => (ehUpload(u) ? Conta.enviarImagem(u) : u);
    d.avatar = await sobe(d.avatar);
    for (const po of d.posteres || []) po.imagem = await sobe(po.imagem);
    if (d.blog) {
      d.blog.imagem = await sobe(d.blog.imagem);
      for (const s of d.blog.stickers || []) if (s.src) s.src = await sobe(s.src);
    }
    return d;
  }
  // Usado pelos envios de imagem: com conta, a imagem vai pro armazenamento e volta como link.
  const guardarImagem = async dataUrl => (Conta.logado() ? Conta.enviarImagem(dataUrl) : dataUrl);

  // O botão do rodapé mostra se o TMDB já está conectado.
  function atualizarRodapeTmdb() {
    const b = document.querySelector('.rodape [data-acao="tmdb"]');
    if (b) b.textContent = window.Filmes.temChave() ? '✔ TMDB conectado' : '⚙️ conectar ao TMDB';
  }
  // Ao entrar: a chave salva na conta volta pra este navegador; se só este navegador tinha a chave, ela sobe pra conta.
  function sincronizarTmdb() {
    const naConta = Conta.preferencia('tmdbChave');
    let local = '';
    try { local = localStorage.getItem('quartinho:tmdbChave') || ''; } catch (e) { /* ignora */ }
    if (naConta && naConta !== local) window.Filmes.definirChave(naConta);
    else if (!naConta && local) Conta.guardarPreferencia('tmdbChave', local).catch(() => { /* tenta de novo no próximo login */ });
    atualizarRodapeTmdb();
  }

  let avisoTimer = null;
  function avisar(texto) {
    let el = document.getElementById('aviso-geral');
    if (!el) {
      el = document.createElement('div');
      el.id = 'aviso-geral';
      el.className = 'aviso-geral';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { el.hidden = true; }, 4500);
  }

  function atualizarBotaoConta() {
    const b = document.getElementById('botao-conta');
    if (!b) return;
    b.textContent = estadoConta === 'dentro' ? '👤 @' + perfis.eu.usuario
      : estadoConta === 'carregando' ? '👤 ...' : '👤 Entrar';
    b.classList.toggle('logado', estadoConta === 'dentro');
  }

  async function recarregarRede() {
    if (!Conta.logado()) {
      estadoConta = Conta.configurado ? 'fora' : 'demo';
      perfis = carregar();
      seguindo = new Set();
      atualId = 'eu'; Pet.estado = null;
      atualizarBotaoConta(); rota();
      return;
    }
    estadoConta = 'carregando'; atualizarBotaoConta();
    try {
      let rede = await Conta.carregarRede();
      if (!rede.eu) {
        // primeiro login depois de confirmar o email: cria o perfil agora
        const meta = (Conta.usuario().user_metadata) || {};
        await criarPerfilInicial(meta.usuario, meta.levarLocal !== false);
        rede = await Conta.carregarRede();
      }
      const novos = { eu: perfilDaLinha(rede.eu, 'eu', rede.recados) };
      for (const l of rede.amigos) novos[l.usuario] = perfilDaLinha(l, l.usuario, rede.recados);
      perfis = novos;
      seguindo = rede.seguindo;
      estadoConta = 'dentro';
      sincronizarTmdb();
      atualId = 'eu'; Pet.estado = null;
    } catch (e) {
      estadoConta = 'fora';
      avisar('⚠ ' + e.message);
    }
    atualizarBotaoConta();
    document.querySelectorAll('.janela').forEach(j => { const id = j.id.replace('jan-', ''); if (JANELAS[id] && JANELAS[id]._redesenhar && j.isConnected) JANELAS[id]._redesenhar(); });
    rota();
  }

  async function criarPerfilInicial(nomeUsuario, levarLocal) {
    let nome = nomeUsuario;
    if (!Conta.USUARIO_OK.test(nome || '')) nome = 'user' + Math.random().toString(36).slice(2, 8);
    const base = levarLocal ? carregar().eu : perfilNovo(nome);
    if (levarLocal) base.recados = []; // recados de exemplo não vão pro banco
    const dados = await subirImagens(dadosParaBanco(base));
    await Conta.criarPerfil(nome, dados);
  }

  async function visitarRemoto(nomeUsuario, janela) {
    try {
      const r = await Conta.carregarPerfil(nomeUsuario);
      if (!r) { avisar('Não achei ninguém com o usuário @' + nomeUsuario); location.hash = '#feed'; return; }
      if (r.linha.id === Conta.uid()) { location.hash = '#quarto'; return; }
      perfis[nomeUsuario] = perfilDaLinha(r.linha, nomeUsuario, r.recados);
      perfis[nomeUsuario].soVisita = !seguindo.has(r.linha.id);
      rota();
      if (janela && JANELAS[janela]) abrir(janela);
    } catch (e) { avisar('⚠ ' + e.message); }
  }

  async function alternarSeguir(id) {
    const p = Object.values(perfis).find(x => x.uid === id);
    try {
      if (seguindo.has(id)) { await Conta.deixarDeSeguir(id); seguindo.delete(id); if (p) p.soVisita = true; }
      else { await Conta.seguir(id); seguindo.add(id); if (p) p.soVisita = false; }
    } catch (e) { avisar('⚠ ' + e.message); return; }
    if (tela === 'quarto') renderTudo();
    if (JANELAS.amigos._redesenhar && document.getElementById('jan-amigos')) JANELAS.amigos._redesenhar();
  }

  const btnSeguir = p => (estadoConta === 'dentro' && p.uid && p.id !== 'eu')
    ? `<button class="btn98 mini-seguir" data-seguir="${esc(p.uid)}">${seguindo.has(p.uid) ? '✓ seguindo' : '+ seguir'}</button>` : '';

  JANELAS.conta = {
    titulo: '👤 Minha conta', largura: 380, aba: 'entrar',
    html() {
      if (!Conta.configurado) {
        return `<p>As contas ainda não estão ligadas neste site.</p>
          <p>Pra ligar: crie um projeto no <b>Supabase</b>, rode o arquivo <code>supabase/schema.sql</code> e preencha
          <code>js/supabase-config.js</code>. O passo a passo está no README.</p>
          <p class="vazio">Enquanto isso, tudo funciona no modo demonstração (salvo só neste navegador).</p>`;
      }
      if (estadoConta === 'dentro') {
        const u = Conta.usuario();
        return `<p>Você está dentro como <b>@${esc(perfis.eu.usuario)}</b>.</p>
          <p><small>${esc(u.email || '')}</small></p>
          <p>Seu quartinho é salvo na nuvem automaticamente. <span class="estado-salvo" role="status"></span></p>
          <div class="linha"><button class="btn98" type="button" data-acao-conta="amigos">👥 procurar amigos</button>
          <button class="btn98" type="button" data-acao-conta="sair">Sair</button></div>`;
      }
      if (estadoConta === 'carregando') return '<p>carregando sua conta...</p>';
      const aba = (id, rotulo) => `<button class="aba" type="button" role="tab" aria-selected="${this.aba === id}" data-aba="${id}">${rotulo}</button>`;
      const entrar = `<form class="form98" id="f-entrar">
          ${campo('Email', 'email', '', 'email', 'required autocomplete="email"')}
          ${campo('Senha', 'senha', '', 'password', 'required minlength="6" autocomplete="current-password"')}
          <button class="btn98" type="submit">Entrar</button>
          <p class="msg" role="status"></p>
        </form>`;
      const criar = `<form class="form98" id="f-criar">
          ${campo('Nome de usuário', 'usuario', '', 'text', 'required minlength="3" maxlength="20" pattern="[a-z0-9_.]{3,20}" placeholder="ex.: cinefilo_2003" autocapitalize="none"')}
          <small>letras minúsculas, números, _ e ponto. É o seu endereço: quartinho/#quarto/<i>usuario</i></small>
          ${campo('Email', 'email', '', 'email', 'required autocomplete="email"')}
          ${campo('Senha (mínimo 6)', 'senha', '', 'password', 'required minlength="6" autocomplete="new-password"')}
          <label class="som-tv"><input type="checkbox" name="levar" checked>
            <span>Levar o quartinho deste navegador pra conta<small>móveis, blog, estante, diário... (desmarque pra começar do zero)</small></span></label>
          <button class="btn98" type="submit">Criar conta</button>
          <p class="msg" role="status"></p>
        </form>`;
      return `<div class="abas" role="tablist">${aba('entrar', '🔑 Entrar')}${aba('criar', '✨ Criar conta')}</div>
        <div class="painel">${this.aba === 'entrar' ? entrar : criar}</div>`;
    },
    bind(corpo, redesenhar) {
      const msg = t => { const m = corpo.querySelector('.msg'); if (m) m.textContent = t; };
      corpo.onclick = async e => {
        const ab = e.target.closest('[data-aba]');
        if (ab) { JANELAS.conta.aba = ab.dataset.aba; redesenhar(); return; }
        const ac = e.target.closest('[data-acao-conta]');
        if (!ac) return;
        if (ac.dataset.acaoConta === 'amigos') { abrir('amigos'); return; }
        if (ac.dataset.acaoConta === 'sair') {
          try { await Conta.sair(); } catch (err) { avisar('⚠ ' + err.message); }
        }
      };
      corpo.onsubmit = async e => {
        e.preventDefault();
        const f = e.target;
        const botao = f.querySelector('[type=submit]');
        botao.disabled = true;
        msg('um instante...');
        try {
          if (f.id === 'f-entrar') {
            await Conta.entrar(f.elements.email.value.trim(), f.elements.senha.value);
            // o resto acontece em recarregarRede (aviso de login)
          } else {
            const usuario = f.elements.usuario.value.trim().toLowerCase();
            const entrou = await Conta.criarConta(f.elements.email.value.trim(), f.elements.senha.value, usuario, f.elements.levar.checked);
            if (!entrou) msg('Quase lá! Mandamos um link pro seu email. Confirme e depois entre aqui. 💌');
          }
        } catch (err) {
          msg('⚠ ' + err.message);
        }
        botao.disabled = false;
      };
    }
  };

  JANELAS.amigos = {
    titulo: '👥 Procurar amigos', largura: 400,
    html() {
      if (estadoConta !== 'dentro') return '<p>Entre na sua conta pra procurar e seguir amigos.</p><button class="btn98" data-acao-amigos="conta">👤 Entrar</button>';
      const meus = Object.values(perfis).filter(p => p.id !== 'eu' && seguindo.has(p.uid));
      return `<form class="form98" id="f-procurar">
          <div class="linha">${campo('Nome de usuário', 'busca', this.busca || '', 'search', 'minlength="2" placeholder="ex.: ana_luz" autocapitalize="none"')}
          <button class="btn98" type="submit">🔎 procurar</button></div>
        </form>
        <div class="resultados-pessoas">${this.resultados ? (this.resultados.length ? `<ul class="lista-pessoas">${this.resultados.map(r => `
          <li><b>@${esc(r.usuario)}</b>${r.nome && r.nome !== r.usuario ? ` <small>(${esc(r.nome)})</small>` : ''}<br><small>${esc(r.humor || '')}</small>
            <span class="acoes"><a class="btn98" href="#quarto/${esc(r.usuario)}">🚪 visitar</a>
            <button class="btn98" data-seguir="${esc(r.id)}">${seguindo.has(r.id) ? '✓ seguindo' : '+ seguir'}</button></span></li>`).join('')}</ul>`
          : '<p class="vazio">ninguém com esse nome...</p>') : ''}</div>
        <fieldset><legend>Quem você segue (${meus.length})</legend>
          ${meus.length ? `<ul class="lista-pessoas">${meus.map(p => `<li><b>@${esc(p.usuario)}</b>
            <span class="acoes"><a class="btn98" href="#quarto/${esc(p.usuario)}">🚪 visitar</a>
            <button class="btn98" data-seguir="${esc(p.uid)}">deixar de seguir</button></span></li>`).join('')}</ul>`
          : '<p class="vazio">ninguém ainda. Procure seus amigos pelo nome de usuário!</p>'}
        </fieldset>`;
    },
    bind(corpo, redesenhar) {
      corpo.onsubmit = async e => {
        e.preventDefault();
        JANELAS.amigos.busca = e.target.elements.busca.value.trim();
        try { JANELAS.amigos.resultados = await Conta.buscarPessoas(JANELAS.amigos.busca); }
        catch (err) { avisar('⚠ ' + err.message); }
        redesenhar();
      };
      corpo.onclick = e => {
        if (e.target.closest('[data-acao-amigos]')) abrir('conta');
      };
    }
  };

  // seguir / deixar de seguir (no quarto, na janela de amigos)
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-seguir]');
    if (b) { e.preventDefault(); b.disabled = true; alternarSeguir(b.dataset.seguir); }
  });
  Conta.aoSalvar(err => {
    const el = document.querySelector('#jan-conta .estado-salvo');
    if (err) avisar('⚠ não salvou na nuvem: ' + err.message);
    else if (el) el.textContent = 'salvo ✔';
  });

  async function iniciarConta() {
    if (!Conta.configurado) return;
    atualizarBotaoConta();
    try {
      await Conta.iniciar();
      Conta.aoMudar(recarregarRede);
      await recarregarRede();
    } catch (e) {
      estadoConta = 'fora';
      atualizarBotaoConta();
      avisar('⚠ ' + e.message);
    }
  }

  // O que o feed pode usar daqui.
  window.Quartinho = {
    perfis: () => perfis,
    salvar,
    avatar: p => urlSegura(p.avatar) ? `<img src="${esc(urlSegura(p.avatar))}" alt="">` : avatarPadrao(p),
    linkQuarto,
    trofeus: p => TROFEUS.filter(t => t.ok(p))
  };

  contarVisita();
  atualizarRodapeTmdb();
  rota();
  iniciarConta();
})();
