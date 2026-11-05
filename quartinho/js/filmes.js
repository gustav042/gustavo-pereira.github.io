// Informações de filmes e séries: busca no TMDB (quando há chave) ou num catálogo de exemplo (offline).
//
// Cada filme guardado pode ter um `meta` com: tipo ('filme' | 'serie'), generos, duracao (min),
// diretor, elenco, pais (códigos ISO), nota (média do TMDB, 0–10), poster (URL) e temporadas (séries).
window.Filmes = (function () {
  'use strict';
  const CHAVE_LS = 'quartinho:tmdbChave';
  const CHAVE_CACHE = 'quartinho:tmdbCache';
  const API = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/w185';

  // Catálogo de exemplo: usado sem chave e para completar os perfis de demonstração.
  // Durações e notas são aproximadas.
  const EXEMPLO = [
    { titulo: 'Matrix', ano: 1999, tipo: 'filme', generos: ['Ação', 'Ficção científica'], duracao: 136, diretor: 'Lana e Lilly Wachowski', pais: ['US'], nota: 8.2 },
    { titulo: 'A Viagem de Chihiro', ano: 2001, tipo: 'filme', generos: ['Animação', 'Fantasia', 'Família'], duracao: 125, diretor: 'Hayao Miyazaki', pais: ['JP'], nota: 8.5 },
    { titulo: 'Cidade de Deus', ano: 2002, tipo: 'filme', generos: ['Crime', 'Drama'], duracao: 130, diretor: 'Fernando Meirelles', pais: ['BR'], nota: 8.4 },
    { titulo: 'Donnie Darko', ano: 2001, tipo: 'filme', generos: ['Drama', 'Ficção científica', 'Mistério'], duracao: 113, diretor: 'Richard Kelly', pais: ['US'], nota: 7.8 },
    { titulo: 'O Senhor dos Anéis', ano: 2001, tipo: 'filme', generos: ['Aventura', 'Fantasia'], duracao: 178, diretor: 'Peter Jackson', pais: ['NZ', 'US'], nota: 8.4 },
    { titulo: 'Shrek', ano: 2001, tipo: 'filme', generos: ['Animação', 'Comédia', 'Fantasia'], duracao: 90, diretor: 'Andrew Adamson e Vicky Jenson', pais: ['US'], nota: 7.7 },
    { titulo: 'Kill Bill', ano: 2003, tipo: 'filme', generos: ['Ação', 'Crime'], duracao: 111, diretor: 'Quentin Tarantino', pais: ['US'], nota: 8.0 },
    { titulo: 'Procurando Nemo', ano: 2003, tipo: 'filme', generos: ['Animação', 'Família'], duracao: 100, diretor: 'Andrew Stanton', pais: ['US'], nota: 7.8 },
    { titulo: 'Brilho Eterno', ano: 2004, tipo: 'filme', generos: ['Romance', 'Drama', 'Ficção científica'], duracao: 108, diretor: 'Michel Gondry', pais: ['US'], nota: 8.1 },
    { titulo: 'Meninas Malvadas', ano: 2004, tipo: 'filme', generos: ['Comédia'], duracao: 97, diretor: 'Mark Waters', pais: ['US'], nota: 7.2 },
    { titulo: 'O Chamado', ano: 2002, tipo: 'filme', generos: ['Terror', 'Mistério'], duracao: 115, diretor: 'Gore Verbinski', pais: ['US'], nota: 6.6 },
    { titulo: 'Homem-Aranha', ano: 2002, tipo: 'filme', generos: ['Ação', 'Aventura'], duracao: 121, diretor: 'Sam Raimi', pais: ['US'], nota: 7.3 },
    { titulo: 'Pânico 3', ano: 2000, tipo: 'filme', generos: ['Terror', 'Mistério'], duracao: 116, diretor: 'Wes Craven', pais: ['US'], nota: 6.0 },
    { titulo: 'Simplesmente Amor', ano: 2003, tipo: 'filme', generos: ['Romance', 'Comédia'], duracao: 135, diretor: 'Richard Curtis', pais: ['GB'], nota: 7.1 },
    { titulo: 'O Diário de Bridget Jones', ano: 2001, tipo: 'filme', generos: ['Comédia', 'Romance'], duracao: 97, diretor: 'Sharon Maguire', pais: ['GB'], nota: 6.8 },
    { titulo: 'Encontros e Desencontros', ano: 2003, tipo: 'filme', generos: ['Drama', 'Romance'], duracao: 102, diretor: 'Sofia Coppola', pais: ['US', 'JP'], nota: 7.4 },
    { titulo: 'A Noiva Cadáver', ano: 2005, tipo: 'filme', generos: ['Animação', 'Fantasia'], duracao: 77, diretor: 'Tim Burton e Mike Johnson', pais: ['GB', 'US'], nota: 7.5 },
    { titulo: 'Os Excêntricos Tenenbaums', ano: 2001, tipo: 'filme', generos: ['Comédia', 'Drama'], duracao: 110, diretor: 'Wes Anderson', pais: ['US'], nota: 7.4 },
    { titulo: 'Velozes e Furiosos', ano: 2001, tipo: 'filme', generos: ['Ação', 'Crime'], duracao: 106, diretor: 'Rob Cohen', pais: ['US'], nota: 7.0 },
    { titulo: 'Piratas do Caribe', ano: 2003, tipo: 'filme', generos: ['Aventura', 'Fantasia', 'Ação'], duracao: 143, diretor: 'Gore Verbinski', pais: ['US'], nota: 7.8 },
    { titulo: 'Os Incríveis', ano: 2004, tipo: 'filme', generos: ['Animação', 'Ação', 'Família'], duracao: 115, diretor: 'Brad Bird', pais: ['US'], nota: 7.7 },
    { titulo: 'Van Helsing', ano: 2004, tipo: 'filme', generos: ['Terror', 'Ação', 'Fantasia'], duracao: 131, diretor: 'Stephen Sommers', pais: ['US'], nota: 5.9 },
    { titulo: 'Batman Begins', ano: 2005, tipo: 'filme', generos: ['Ação', 'Crime', 'Drama'], duracao: 140, diretor: 'Christopher Nolan', pais: ['US', 'GB'], nota: 7.7 },
    { titulo: 'O Diabo Veste Prada', ano: 2006, tipo: 'filme', generos: ['Comédia', 'Drama'], duracao: 109, diretor: 'David Frankel', pais: ['US'], nota: 7.4 },
    { titulo: 'Como Perder um Homem em 10 Dias', ano: 2003, tipo: 'filme', generos: ['Comédia', 'Romance'], duracao: 116, diretor: 'Donald Petrie', pais: ['US'], nota: 6.9 },
    { titulo: 'De Repente 30', ano: 2004, tipo: 'filme', generos: ['Comédia', 'Romance', 'Fantasia'], duracao: 98, diretor: 'Gary Winick', pais: ['US'], nota: 6.7 },
    { titulo: 'Legalmente Loira', ano: 2001, tipo: 'filme', generos: ['Comédia', 'Romance'], duracao: 96, diretor: 'Robert Luketic', pais: ['US'], nota: 6.6 },
    { titulo: 'Sinais', ano: 2002, tipo: 'filme', generos: ['Ficção científica', 'Terror', 'Mistério'], duracao: 106, diretor: 'M. Night Shyamalan', pais: ['US'], nota: 6.6 },
    { titulo: 'O Sexto Sentido', ano: 1999, tipo: 'filme', generos: ['Mistério', 'Terror', 'Drama'], duracao: 107, diretor: 'M. Night Shyamalan', pais: ['US'], nota: 7.9 },
    { titulo: 'Contatos Imediatos', ano: 1977, tipo: 'filme', generos: ['Ficção científica', 'Drama'], duracao: 135, diretor: 'Steven Spielberg', pais: ['US'], nota: 7.4 },
    { titulo: 'A Bruxa de Blair', ano: 1999, tipo: 'filme', generos: ['Terror', 'Mistério'], duracao: 81, diretor: 'Daniel Myrick e Eduardo Sánchez', pais: ['US'], nota: 6.3 },
    { titulo: 'Amélie', ano: 2001, tipo: 'filme', generos: ['Comédia', 'Romance'], duracao: 122, diretor: 'Jean-Pierre Jeunet', pais: ['FR'], nota: 7.9 },
    { titulo: 'O Labirinto do Fauno', ano: 2006, tipo: 'filme', generos: ['Fantasia', 'Drama'], duracao: 118, diretor: 'Guillermo del Toro', pais: ['MX', 'ES'], nota: 7.8 },
    { titulo: 'Oldboy', ano: 2003, tipo: 'filme', generos: ['Ação', 'Mistério', 'Drama'], duracao: 120, diretor: 'Park Chan-wook', pais: ['KR'], nota: 8.2 },
    { titulo: 'Os Outros', ano: 2001, tipo: 'filme', generos: ['Terror', 'Mistério'], duracao: 101, diretor: 'Alejandro Amenábar', pais: ['ES', 'US'], nota: 7.6 },
    { titulo: 'Extermínio', ano: 2002, tipo: 'filme', generos: ['Terror', 'Ficção científica'], duracao: 113, diretor: 'Danny Boyle', pais: ['GB'], nota: 7.2 },
    { titulo: 'Akira', ano: 1988, tipo: 'filme', generos: ['Animação', 'Ficção científica'], duracao: 124, diretor: 'Katsuhiro Otomo', pais: ['JP'], nota: 7.9 },
    { titulo: 'Gladiador', ano: 2000, tipo: 'filme', generos: ['Ação', 'Drama'], duracao: 155, diretor: 'Ridley Scott', pais: ['US', 'GB'], nota: 8.2 },
    { titulo: 'Alien', ano: 1979, tipo: 'filme', generos: ['Terror', 'Ficção científica'], duracao: 117, diretor: 'Ridley Scott', pais: ['GB', 'US'], nota: 8.1 },
    { titulo: 'De Volta para o Futuro', ano: 1985, tipo: 'filme', generos: ['Aventura', 'Comédia', 'Ficção científica'], duracao: 116, diretor: 'Robert Zemeckis', pais: ['US'], nota: 8.3 },
    { titulo: 'O Iluminado', ano: 1980, tipo: 'filme', generos: ['Terror'], duracao: 146, diretor: 'Stanley Kubrick', pais: ['GB', 'US'], nota: 8.2 },
    { titulo: 'Lost', ano: 2004, tipo: 'serie', generos: ['Drama', 'Mistério'], duracao: 44, diretor: 'J.J. Abrams e Damon Lindelof', pais: ['US'], nota: 7.9, temporadas: [25, 24, 23, 14, 17, 18] },
    { titulo: 'Gilmore Girls', ano: 2000, tipo: 'serie', generos: ['Comédia', 'Drama'], duracao: 44, diretor: 'Amy Sherman-Palladino', pais: ['US'], nota: 8.1, temporadas: [21, 22, 22, 22, 22, 22, 22] },
    { titulo: 'Friends', ano: 1994, tipo: 'serie', generos: ['Comédia'], duracao: 22, diretor: 'David Crane e Marta Kauffman', pais: ['US'], nota: 8.4, temporadas: [24, 24, 25, 24, 24, 25, 24, 24, 24, 18] },
    { titulo: 'Arquivo X', ano: 1993, tipo: 'serie', generos: ['Mistério', 'Ficção científica', 'Drama'], duracao: 44, diretor: 'Chris Carter', pais: ['US'], nota: 8.4, temporadas: [24, 25, 24, 24, 20, 22, 22, 21, 20, 6, 10] },
    { titulo: 'Dragon Ball Z', ano: 1989, tipo: 'serie', generos: ['Animação', 'Ação'], duracao: 24, diretor: 'Akira Toriyama', pais: ['JP'], nota: 8.3 }
  ];

  // Normaliza para comparar títulos: minúsculas, sem acento, sem pontuação.
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const porTitulo = new Map(EXEMPLO.map(e => [norm(e.titulo), e]));

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
  const metaExemplo = e => ({
    fonte: 'exemplo', tipo: e.tipo, generos: e.generos, duracao: e.duracao, diretor: e.diretor,
    elenco: [], pais: e.pais, nota: e.nota, poster: '',
    temporadas: e.temporadas ? e.temporadas.map((n, i) => ({ n: i + 1, episodios: n })) : null
  });
  function metaDe(f) {
    if (!f) return null;
    if (f.meta) return f.meta;
    const e = porTitulo.get(norm(f.titulo));
    return e ? metaExemplo(e) : null;
  }

  // ---------- busca ----------
  async function buscar(texto, tipos = 'tudo') {
    texto = String(texto || '').trim();
    if (texto.length < 2) return [];
    if (!temChave()) {
      const n = norm(texto);
      return EXEMPLO
        .filter(e => norm(e.titulo).includes(n) && (tipos === 'tudo' || e.tipo === tipos))
        .slice(0, 8)
        .map(e => ({ fonte: 'exemplo', titulo: e.titulo, ano: String(e.ano), tipo: e.tipo, poster: '', ref: e }));
    }
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
    if (item.fonte === 'exemplo') return { titulo: item.titulo, ano: item.ano, meta: metaExemplo(item.ref) };
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

  return { metaDe, buscar, detalhes, temChave, chave, definirChave, testar, norm };
})();
