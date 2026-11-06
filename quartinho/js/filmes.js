// Informações de filmes e séries: busca no TMDB (a chave do site fica em js/config.js).
//
// Cada filme guardado pode ter um `meta` com: tipo ('filme' | 'serie'), generos, duracao (min),
// diretor, elenco, pais (códigos ISO), nota (média do TMDB, 0–10), poster (URL) e temporadas (séries).
window.Filmes = (function () {
  'use strict';
  const CHAVE_LS = 'quartinho:tmdbChave';
  const CHAVE_CACHE = 'quartinho:tmdbCache';
  const API = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/w185';

  // Normaliza para comparar títulos: minúsculas, sem acento, sem pontuação.
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  // ---------- chave ----------
  function chave() {
    try { const c = localStorage.getItem(CHAVE_LS); if (c) return c.trim(); } catch (e) { /* ignora */ }
    return String((window.QUARTINHO_CONFIG && window.QUARTINHO_CONFIG.tmdbChave) || '').trim();
  }
  function definirChave(c) {
    try {
      if (c) localStorage.setItem(CHAVE_LS, c.trim()); else localStorage.removeItem(CHAVE_LS);
    } catch (e) { /* ignora */ }
  }
  const temChave = () => !!chave();

  async function chamar(caminho, params = {}) {
    const c = chave();
    if (!c) throw new Error('Sem chave do TMDB.');
    const url = new URL(API + caminho);
    url.searchParams.set('language', 'pt-BR');
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const headers = { accept: 'application/json' };
    // token v4 vai no cabeçalho; chave v3 vai na URL
    if (c.startsWith('eyJ')) headers.Authorization = 'Bearer ' + c; else url.searchParams.set('api_key', c);
    let r;
    try { r = await fetch(url, { headers }); } catch (e) { throw new Error('Sem conexão com o TMDB.'); }
    if (r.status === 401) throw new Error('A chave do TMDB não foi aceita.');
    if (r.status === 429) throw new Error('Muitas buscas seguidas, espera um pouquinho.');
    if (!r.ok) throw new Error('O TMDB respondeu com erro ' + r.status + '.');
    return r.json();
  }

  // ---------- informações de um filme guardado ----------
  function metaDe(f) {
    if (!f) return null;
    return f.meta || null;
  }

  // Progresso (0–100) de quem está vendo uma série: episódios até o atual / total de episódios.
  // Lê "Temporada 3 · Episódio 7" (ou "T3 E7") do detalhe. Sem temporadas conhecidas, usa o número salvo.
  // progressoCalculado devolve null quando não dá pra calcular (filme, série sem temporadas, detalhe livre).
  // Lê temporada e episódio de "Temporada 3 · Episódio 7" ou "T3 E7". Devolve { t, e } ou null.
  function episodioDe(detalhe) {
    const det = String(detalhe || '');
    const m = /temporada\s*(\d+)\D+?epis[oó]dio\s*(\d+)/i.exec(det) || /\bT\s*(\d+)\s*[·.,\-]?\s*E[Pp]?\s*(\d+)/.exec(det);
    return m ? { t: Number(m[1]), e: Number(m[2]) } : null;
  }
  function progressoCalculado(a) {
    if (!a || !a.titulo) return null;
    const meta = metaDe(a);
    const temps = meta && meta.temporadas;
    const ep = episodioDe(a.detalhe);
    if (!temps || !temps.length || !ep) return null;
    const { t, e } = ep;
    let antes = 0, total = 0;
    for (const s of temps) {
      const n = Number(s.episodios) || 0;
      total += n;
      if (s.n < t) antes += n;
    }
    if (!total) return null;
    return Math.round(Math.max(0, Math.min(100, (antes + e) / total * 100)));
  }
  function progressoDe(a) {
    if (!a || !a.titulo) return 0;
    const calc = progressoCalculado(a);
    return calc !== null ? calc : Math.max(0, Math.min(100, Number(a.progresso) || 0));
  }

  // ---------- busca ----------
  async function buscar(texto, tipos = 'tudo') {
    texto = String(texto || '').trim();
    if (texto.length < 2) return [];
    if (!temChave()) return [];
    const d = await chamar('/search/multi', { query: texto, include_adult: 'false', page: '1' });
    return (d.results || [])
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .map(r => ({
        fonte: 'tmdb', id: r.id, tipo: r.media_type === 'movie' ? 'filme' : 'serie',
        titulo: r.title || r.name, original: r.original_title || r.original_name,
        ano: String(r.release_date || r.first_air_date || '').slice(0, 4),
        poster: r.poster_path ? IMG + r.poster_path : ''
      }))
      .filter(r => tipos === 'tudo' || r.tipo === tipos)
      .slice(0, 8);
  }

  // ---------- detalhes (com cache no navegador) ----------
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(CHAVE_CACHE) || '{}') || {}; } catch (e) { /* ignora */ }

  async function detalhes(item) {
    const k = item.tipo + ':' + item.id;
    if (cache[k]) return cache[k];
    const filme = item.tipo === 'filme';
    const d = await chamar(filme ? `/movie/${item.id}` : `/tv/${item.id}`, { append_to_response: 'credits' });
    const creditos = d.credits || {};
    const meta = {
      fonte: 'tmdb', id: d.id, tipo: item.tipo,
      generos: (d.genres || []).map(g => g.name),
      duracao: filme ? (d.runtime || 0) : ((d.episode_run_time || [])[0] || 0),
      diretor: filme
        ? (creditos.crew || []).filter(c => c.job === 'Director').map(c => c.name).join(' e ')
        : (d.created_by || []).map(c => c.name).join(' e '),
      elenco: (creditos.cast || []).slice(0, 5).map(c => c.name),
      pais: filme ? (d.production_countries || []).map(p => p.iso_3166_1) : (d.origin_country || []),
      nota: Math.round((d.vote_average || 0) * 10) / 10,
      poster: d.poster_path ? IMG + d.poster_path : '',
      temporadas: filme ? null : (d.seasons || []).filter(s => s.season_number > 0).map(s => ({ n: s.season_number, episodios: s.episode_count }))
    };
    const res = { titulo: d.title || d.name, ano: String(d.release_date || d.first_air_date || '').slice(0, 4), meta };
    cache[k] = res;
    try { localStorage.setItem(CHAVE_CACHE, JSON.stringify(cache)); } catch (e) { cache = { [k]: res }; }
    return res;
  }

  // Testa uma chave nova; só guarda se funcionar.
  async function testar(c) {
    const antes = chave();
    definirChave(c);
    try { await chamar('/configuration'); return true; } catch (e) { definirChave(antes); throw e; }
  }

  return { metaDe, progressoDe, progressoCalculado, episodioDe, buscar, detalhes, temChave, chave, definirChave, testar, norm };
})();
