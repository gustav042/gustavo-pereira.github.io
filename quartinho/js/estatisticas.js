// Estatísticas do perfil (#stats, #stats/ana): gêneros, décadas, horas de tela, exigência,
// diretores, países e compatibilidade com os amigos.
window.Stats = (function () {
  'use strict';
  const { esc, estrelas, limitar } = window.U;
  const Q = () => window.Quartinho;
  const meta = f => window.Filmes.metaDe(f);
  const norm = s => window.Filmes.norm(s);
  const media = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const CORES = ['#ff66cc', '#4fc3f7', '#ffd23f', '#6bb366', '#9a76d4', '#ff7043', '#26a69a', '#e57373'];
  const PERSONALIDADE = {
    'Terror': 'alma corajosa do sofá 👻', 'Comédia': 'fábrica de risadas 😂', 'Romance': 'coração mole 💘',
    'Animação': 'criança interior intacta 🧸', 'Ação': 'pura adrenalina 💥', 'Ficção científica': 'viagem pelas galáxias 🚀',
    'Drama': 'lencinho sempre à mão 🥲', 'Fantasia': 'passaporte pra Terra Média 🧙', 'Mistério': 'detetive de pijama 🔎',
    'Crime': 'mente criminosa (só na ficção) 🕵️', 'Aventura': 'mochila nas costas 🗺️', 'Família': 'sessão da tarde raiz 🍿'
  };
  const bandeira = iso => /^[A-Z]{2}$/.test(iso) ? String.fromCodePoint(...[...iso].map(c => 127397 + c.charCodeAt(0))) : '🏳️';
  const nomePais = iso => {
    try { return new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(iso); } catch (e) { return iso; }
  };

  function contar(lista) {
    const c = {};
    for (const x of lista) if (x) c[x] = (c[x] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  // ---------- números de um perfil ----------
  function resumo(p) {
    const itens = (p.assistidos || []).map(f => ({ f, m: meta(f) }));
    const com = itens.filter(x => x.m);
    const filmes = com.filter(x => x.m.tipo !== 'serie');
    const generos = contar(com.flatMap(x => x.m.generos));
    const totalGeneros = generos.reduce((s, [, n]) => s + n, 0) || 1;
    const decadas = contar(itens.map(x => Number(x.f.ano) ? Math.floor(Number(x.f.ano) / 10) * 10 : null))
      .sort((a, b) => Number(a[0]) - Number(b[0]));
    const minutos = filmes.reduce((s, x) => s + (Number(x.m.duracao) || 0), 0);
    const comNotaTmdb = com.filter(x => x.m.nota > 0);
    const minhaMedia = media(comNotaTmdb.map(x => x.f.nota * 2));
    const mediaMundo = media(comNotaTmdb.map(x => x.m.nota));
    return {
      total: itens.length,
      semInfo: itens.length - com.length,
      series: com.length - filmes.length,
      generos: generos.map(([g, n]) => ({ nome: g, n, pct: Math.round(n / totalGeneros * 100) })),
      decadas: decadas.map(([d, n]) => ({ nome: d + 's', n })),
      minutos,
      mediaNotas: media(itens.map(x => x.f.nota)),
      exigencia: comNotaTmdb.length ? { minha: minhaMedia, mundo: mediaMundo, diferenca: minhaMedia - mediaMundo, base: comNotaTmdb.length } : null,
      diretores: contar(com.flatMap(x => x.m.diretor ? [x.m.diretor] : [])).slice(0, 5),
      atores: contar(com.flatMap(x => x.m.elenco || [])).filter(([, n]) => n > 1).slice(0, 5),
      paises: contar(com.flatMap(x => x.m.pais || [])),
      notas: [5, 4, 3, 2, 1].map(n => ({ n, qtd: itens.filter(x => x.f.nota === n).length }))
    };
  }

  // ---------- compatibilidade entre dois perfis (0–100) ----------
  function vetorGeneros(p) {
    const v = {};
    for (const f of p.assistidos || []) { const m = meta(f); if (m) for (const g of m.generos) v[g] = (v[g] || 0) + 1; }
    return v;
  }
  function compat(a, b) {
    const va = vetorGeneros(a), vb = vetorGeneros(b);
    let dot = 0, na = 0, nb = 0;
    for (const g of new Set([...Object.keys(va), ...Object.keys(vb)])) {
      dot += (va[g] || 0) * (vb[g] || 0); na += (va[g] || 0) ** 2; nb += (vb[g] || 0) ** 2;
    }
    const cosseno = na && nb ? dot / Math.sqrt(na * nb) : 0;
    const notasA = new Map((a.assistidos || []).map(f => [norm(f.titulo), f]));
    const comuns = (b.assistidos || []).filter(f => notasA.has(norm(f.titulo)));
    const parecidas = comuns.map(f => 1 - Math.abs(f.nota - notasA.get(norm(f.titulo)).nota) / 4);
    let s = parecidas.length ? 0.55 * cosseno + 0.45 * media(parecidas) : cosseno * 0.85;
    s += Math.min(0.1, comuns.length * 0.03);
    const pct = Math.round(limitar(s, 0, 1) * 100);
    const frase = pct >= 80 ? 'almas gêmeas cinéfilas 💞' : pct >= 60 ? 'combinam muito ✨'
      : pct >= 40 ? 'gostos diferentes, mas dá pra dividir a pipoca 🍿' : 'opostos completos ⚔️';
    return { pct, frase, comuns: comuns.map(f => f.titulo) };
  }

  // ---------- pedaços visuais ----------
  function barrasH(itens, total) {
    if (!itens.length) return '<p class="vazio">sem dados ainda</p>';
    const max = Math.max(...itens.map(i => i.n));
    return `<ul class="barras-h">${itens.map((it, k) => `
      <li><span class="rotulo">${esc(it.nome)}</span>
        <span class="trilho"><span class="barra" style="width:${Math.max(4, it.n / max * 100)}%;--cor:${CORES[k % CORES.length]}"></span></span>
        <span class="valor">${total ? it.pct + '%' : it.n}</span></li>`).join('')}</ul>`;
  }
  function barrasV(itens) {
    if (!itens.length) return '<p class="vazio">sem dados ainda</p>';
    const max = Math.max(...itens.map(i => i.n));
    return `<div class="barras-v" role="img" aria-label="${itens.map(i => `${i.nome}: ${i.n}`).join(', ')}">${itens.map((it, k) => `
      <div class="coluna"><span class="num">${it.n}</span>
        <span class="barra" style="height:${Math.max(6, it.n / max * 100)}%;--cor:${CORES[k % CORES.length]}"></span>
        <span class="rotulo">${esc(it.nome)}</span></div>`).join('')}</div>`;
  }
  function tempo(min) {
    const h = Math.floor(min / 60), d = Math.floor(h / 24);
    return d ? `${d} dia${d > 1 ? 's' : ''} e ${h % 24}h` : `${h}h${String(min % 60).padStart(2, '0')}`;
  }
  const janela = (titulo, corpo, classe = '') => `<section class="relatorio ${classe}"><h3 class="titulo-caixa">${titulo}</h3><div class="relatorio-corpo">${corpo}</div></section>`;

  // ---------- página ----------
  function render(id) {
    const perfis = Q().perfis();
    const p = perfis[id] || perfis.eu;
    const eu = perfis.eu;
    const ehEu = p.id === 'eu';
    const r = resumo(p);
    const topo = r.generos[0];
    const voce = ehEu ? 'você' : esc(p.nome);

    const ex = r.exigencia;
    let exigencia = '<p class="vazio">precisa de filmes com nota do TMDB</p>';
    if (ex) {
      const d = ex.diferenca;
      const frase = d <= -1 ? `${voce} é <b>exigente</b>: dá ${Math.abs(d).toFixed(1)} pontos a menos que o resto do mundo 🍅`
        : d >= 1 ? `${voce} <b>pega leve</b>: dá ${d.toFixed(1)} pontos a mais que o resto do mundo 💖`
        : `${voce} pensa igual à galera do mundo todo 🤝`;
      exigencia = `<div class="medidor">
          <div><span>${ehEu ? 'suas notas' : 'notas de ' + esc(p.nome)}</span><b>${ex.minha.toFixed(1)}</b></div>
          <div><span>média do mundo</span><b>${ex.mundo.toFixed(1)}</b></div>
        </div><p>${frase}</p><p><small>com base em ${ex.base} filme(s); notas convertidas de ★ para 0–10</small></p>`;
    }

    const outros = Object.values(perfis).filter(x => x.id !== p.id);
    const compatHtml = `<ul class="compat">${outros.map(o => {
      const c = compat(p, o);
      return `<li>
        <a href="${Q().linkQuarto(o.id)}">${esc(o.id === 'eu' ? 'você' : o.nome)}</a>
        <span class="trilho"><span class="barra" style="width:${c.pct}%;--cor:${c.pct >= 60 ? '#ff66cc' : '#9aa4c8'}"></span></span>
        <b>${c.pct}%</b><br><small>${c.frase}${c.comuns.length ? ` · em comum: ${c.comuns.slice(0, 3).map(esc).join(', ')}` : ''}</small>
      </li>`;
    }).join('')}</ul>`;

    const raiz = document.getElementById('tela-stats');
    raiz.innerHTML = `
      <div class="stats-topo">
        <h2>📊 relatório cinéfilo de ${voce}</h2>
        <nav class="stats-pessoas" aria-label="Ver estatísticas de">${Object.values(perfis).map(x =>
          `<a href="#stats/${x.id}" class="${x.id === p.id ? 'ativo' : ''}" ${x.id === p.id ? 'aria-current="page"' : ''}>${esc(x.id === 'eu' ? 'você' : x.nome)}</a>`).join('')}</nav>
      </div>
      ${topo ? `<div class="manchete">${voce} é <b>${topo.pct}% ${esc(topo.nome)}</b><br><span>${PERSONALIDADE[topo.nome] || 'gosto único 🌈'}</span></div>` : ''}
      <div class="stats-grade">
        ${janela('🔢 em números', `
          <dl class="numeros">
            <div><dt>filmes e séries</dt><dd>${r.total}</dd></div>
            <div><dt>horas de filme</dt><dd>${tempo(r.minutos)}</dd></div>
            <div><dt>nota média</dt><dd class="estrelas-feed">${estrelas(Math.round(r.mediaNotas))}</dd></div>
            <div><dt>gêneros diferentes</dt><dd>${r.generos.length}</dd></div>
          </dl>
          ${r.semInfo ? `<p><small>${r.semInfo} título(s) sem informações — guarde pela busca pra entrarem nas contas</small></p>` : ''}`)}
        ${janela('🎭 gêneros favoritos', barrasH(r.generos.slice(0, 7), true))}
        ${janela('📅 por década', barrasV(r.decadas))}
        ${janela('🍅 exigente ou pega leve?', exigencia)}
        ${janela('⭐ como ' + voce + ' dá notas', barrasH(r.notas.map(x => ({ nome: '★'.repeat(x.n), n: x.qtd })), false))}
        ${janela('🎬 diretores mais vistos', r.diretores.length ? `<ol class="lista-top">${r.diretores.map(([d, n]) => `<li>${esc(d)} <small>(${n})</small></li>`).join('')}</ol>` : '<p class="vazio">sem dados ainda</p>')}
        ${janela('🌍 volta ao mundo', r.paises.length ? `<ul class="paises">${r.paises.map(([iso, n]) => `<li><span class="bandeira" aria-hidden="true">${bandeira(iso)}</span> ${esc(nomePais(iso))} <small>(${n})</small></li>`).join('')}</ul>` : '<p class="vazio">sem dados ainda</p>')}
        ${r.atores.length ? janela('🌟 atores que mais aparecem', `<ol class="lista-top">${r.atores.map(([a, n]) => `<li>${esc(a)} <small>(${n})</small></li>`).join('')}</ol>`) : ''}
        ${janela(ehEu ? '🤝 compatibilidade com os amigos' : `🤝 compatibilidade de ${esc(p.nome)}`, compatHtml, 'largo')}
      </div>
      <p class="fonte-dados">${window.Filmes.temChave() ? 'Informações dos filmes: TMDB.' : 'A busca de filmes está desligada.'} <button class="btn98" data-acao="tmdb">⚙️ ${window.Filmes.temChave() ? 'conexão com o TMDB' : 'conectar ao TMDB'}</button></p>`;
  }

  return { render, resumo, compat };
})();
