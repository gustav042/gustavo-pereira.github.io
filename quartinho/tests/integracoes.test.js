const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const codigo = nome => fs.readFileSync(path.join(__dirname, '..', 'js', nome), 'utf8');

function carregarLetterboxd(filmes) {
  const contexto = {
    window: {
      Filmes: filmes || {
        temChave: () => false,
        norm: s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
      },
      U: { novoId: () => 'novo-id' }
    }
  };
  vm.createContext(contexto);
  vm.runInContext(codigo('letterboxd.js'), contexto);
  return contexto.window.Letterboxd;
}

const cabecalho = 'Date,Name,Year,Letterboxd URI,Rating\n';
const linha = '2023-07-30,"Are You There God? It\'s Me, Margaret.",2023,https://boxd.it/kiYC,3.5';

test('CSV aceita vírgulas, aspas, CRLF e preserva data e meia estrela', () => {
  const api = carregarLetterboxd();
  const itens = api.ler('\uFEFF' + cabecalho.replace('\n', '\r\n') + linha + '\r\n');
  assert.equal(itens.length, 1);
  assert.equal(itens[0].titulo, "Are You There God? It's Me, Margaret.");
  assert.equal(itens[0].nota, 3.5);
  assert.equal(itens[0].data, '2023-07-30');
  assert.equal(api.ler(cabecalho + '2021-01-01,"A ""quoted"" title",2000,https://boxd.it/a,5')[0].titulo, 'A "quoted" title');
});

test('CSV inválido é rejeitado antes da importação', () => {
  const api = carregarLetterboxd();
  assert.throws(() => api.ler('Name,Rating\nfoo,5'), /colunas/);
  assert.throws(() => api.ler(cabecalho + '2023-02-29,Film,2020,https://boxd.it/a,3'), /linha 2/);
  assert.throws(() => api.ler(cabecalho + '2023-01-01,"Film,2020,https://boxd.it/a,3'), /aspas/);
  assert.throws(() => api.ler(cabecalho + '2023-01-01,Film,2020,https://boxd.it/a,'), /linha 2/);
});

test('preserva registros e identifica duplicatas por URI, título, ano, tradução e ID', () => {
  const api = carregarLetterboxd();
  const base = { titulo: 'Old', ano: 2020, data: '2021-01-01', nota: 4, letterboxdUri: 'https://boxd.it/a' };
  const itens = [
    { ...base },
    { ...base, titulo: 'Something else', letterboxdUri: 'https://boxd.it/b', meta: { fonte: 'tmdb', tipo: 'filme', id: 8 } },
    { ...base, titulo: 'Movie in English', traduzido: 'Filme em Português', letterboxdUri: 'https://boxd.it/c' },
    { ...base, titulo: 'New', letterboxdUri: 'https://boxd.it/d' },
    { ...base, titulo: 'new', letterboxdUri: 'https://boxd.it/e' },
    { ...base, titulo: 'New', ano: 2021, letterboxdUri: 'https://boxd.it/f' }
  ];
  const existentes = [
    { titulo: 'Whatever', letterboxdUri: 'https://boxd.it/a' },
    { titulo: 'Outro', meta: { fonte: 'tmdb', tipo: 'filme', id: 8 } },
    { titulo: 'Filme em Português', ano: 2020 }
  ];
  const r = api.separar(itens, existentes);
  assert.equal(r.duplicados, 4);
  assert.equal(r.novos.length, 2);
  assert.equal(r.novos[0].quando, '2021-01-01T12:00:00');
  assert.equal(existentes.length, 3);
});

test('só usa TMDB para correspondências exatas e propaga erros', async () => {
  const norm = s => String(s || '').toLowerCase();
  const filmes = {
    norm, temChave: () => true,
    buscar: async nome => nome === 'Movie' ? [{ id: 42, tipo: 'filme', ano: '2020', original: 'Movie', titulo: 'Filme' }] : [],
    detalhes: async () => ({ titulo: 'Filme', meta: { fonte: 'tmdb', tipo: 'filme', id: 42 } })
  };
  const api = carregarLetterboxd(filmes);
  const dados = api.ler(cabecalho + '2023-01-01,Movie,2020,https://boxd.it/a,5\n2023-01-01,Missing,2020,https://boxd.it/b,3');
  const r = await api.preparar(dados, () => {});
  assert.equal(r[0].meta.id, 42);
  assert.equal(r[0].traduzido, 'Filme');
  assert.equal(r[1].meta, null);
  filmes.buscar = async () => { throw new Error('offline'); };
  await assert.rejects(api.preparar(dados, () => {}), /offline/);
});

test('Wikidata pesquisa em português, valida resultados e mostra erros', async () => {
  let url;
  const ctx = { window: {}, URL, fetch: async u => {
    url = u;
    return { ok: true, json: async () => ({ search: [{ id: 'Q42', label: 'Nome', description: 'personagem' }, { id: 'invalid', label: 'X' }] }) };
  } };
  vm.createContext(ctx);
  vm.runInContext(codigo('wikidata.js'), ctx);
  const r = await ctx.window.Wikidata.buscar('Nome');
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'Q42');
  assert.equal(url.searchParams.get('origin'), '*');
  assert.equal(url.searchParams.get('language'), 'pt');
  ctx.fetch = async () => ({ ok: false, status: 429 });
  await assert.rejects(ctx.window.Wikidata.buscar('Nome'), /Muitas buscas/);
});

test('fotos do Commons mantêm licença e autor, aceitam ausência e reutilizam cache', async () => {
  const chamadas = [];
  const ctx = {
    window: {}, URL,
    document: { createElement: () => ({ set innerHTML(valor) { this.textContent = valor.replace(/<[^>]*>/g, ''); } }) },
    fetch: async url => {
      chamadas.push(url);
      if (url.hostname === 'www.wikidata.org') return { ok: true, json: async () => ({
        entities: { Q1: { claims: { P18: [{ rank: 'normal', mainsnak: { datavalue: { value: 'Example.jpg' } } }] } }, Q2: { claims: {} } }
      }) };
      return { ok: true, json: async () => ({ query: { pages: [{ title: 'File:Example.jpg', imageinfo: [{
        thumburl: 'https://upload.wikimedia.org/example.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
        extmetadata: { Artist: { value: '<b>Autor</b>' }, LicenseShortName: { value: 'CC BY 4.0' }, LicenseUrl: { value: 'https://creativecommons.org/licenses/by/4.0/' } }
      }] }] } }) };
    }
  };
  vm.createContext(ctx);
  vm.runInContext(codigo('wikidata.js'), ctx);
  const fotos = await ctx.window.Wikidata.imagens(['Q1', 'Q2', 'Q1']);
  assert.equal(fotos.get('Q1').autor, 'Autor');
  assert.equal(fotos.get('Q1').licenca, 'CC BY 4.0');
  assert.match(fotos.get('Q1').licencaUrl, /creativecommons/);
  assert.equal(fotos.get('Q2'), null);
  await ctx.window.Wikidata.imagens(['Q1', 'Q2']);
  assert.equal(chamadas.length, 2);
});

test('listas aceitam personagens e ignoram respostas antigas sem quebrar o feed', async () => {
  const app = codigo('app.js');
  const computador = app.slice(app.indexOf('    computador: {'), app.indexOf('    mural: {'));
  const perfil = { listas: [{ nome: 'Lista', itens: ['Filme antigo'] }], diario: [] };
  const pendentes = [];
  const ctx = {
    perfil: () => perfil, ehMeu: () => true, urlSegura: s => s || '',
    esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    mudou() {}, fmtData: s => s, hoje: () => '',
    window: { Wikidata: { buscar: q => new Promise(resolve => pendentes.push({ q, resolve })) } },
    FormData: class { constructor(f) { this.form = f; } get(k) { return this.form.elements[k].value; } }
  };
  vm.createContext(ctx);
  vm.runInContext('const JANELAS = {' + computador + '}; this.computador = JANELAS.computador;', ctx);
  const corpo = { querySelectorAll: () => [] };
  ctx.computador.bind(corpo, () => {});
  const saida = { textContent: '', innerHTML: '' };
  const form = {
    dataset: { personagens: '0' }, isConnected: true,
    elements: { personagem: { value: 'Harry' } }, querySelector: () => saida
  };
  const evento = { preventDefault() {}, target: form };
  const buscaAntiga = corpo.onsubmit(evento);
  form.elements.personagem.value = 'Hermione';
  corpo.oninput({ target: { closest: () => form } });
  const buscaNova = corpo.onsubmit(evento);
  pendentes[0].resolve([{ id: 'Q1', nome: 'Antigo', descricao: '' }]);
  await buscaAntiga;
  assert.equal(saida.textContent, 'Buscando no Wikidata...');
  pendentes[1].resolve([{ id: 'Q2', nome: '<Hermione>', descricao: 'personagem' }]);
  await buscaNova;
  assert.match(saida.innerHTML, /&lt;Hermione&gt;/);
  corpo.onclick({ target: { closest: seletor => seletor === '[data-personagem-resultado]'
    ? { dataset: { personagemResultado: '0' }, closest: () => form } : null } });
  assert.equal(perfil.listas[0].itens[1].id, 'Q2');
  assert.match(ctx.computador.html(), /wikidata.org\/wiki\/Q2/);
  assert.match(ctx.computador.html(), /Filme antigo/);

  const feed = codigo('feed.js');
  const inicio = feed.indexOf('  function naListaQueroVer');
  const fim = feed.indexOf('  const miniAvatar', inicio);
  const feedCtx = { eu: () => perfil };
  vm.createContext(feedCtx);
  vm.runInContext(feed.slice(inicio, fim) + ';this.verifica = naListaQueroVer;', feedCtx);
  assert.equal(feedCtx.verifica('filme antigo'), true);
  assert.equal(feedCtx.verifica('outro filme'), false);
});
