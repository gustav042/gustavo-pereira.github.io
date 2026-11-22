const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ler = nome => fs.readFileSync(path.join(__dirname, '..', 'js', nome), 'utf8');

test('volta ao mundo mostra até vinte países com os filmes de cada um, sem limitar o resumo', () => {
  const paises = ['BR', 'US', 'FR', 'JP', 'KR', 'DE', 'IT', 'CA', 'GB', 'MX', 'AR', 'ES', 'PT', 'AU', 'NL', 'SE', 'CH', 'NO', 'DK', 'FI', 'IE', 'GR'];
  const p = {
    id: 'eu', nome: 'teste', assistidos: paises.map((pais, i) => ({
      titulo: 'filme ' + i, ano: 1940 + (i % 12) * 10, nota: 4,
      meta: { tipo: 'filme', generos: [], elenco: [], pais: [pais], nota: 0 }
    }))
  };
  const ctx = {
    window: {
      U: { esc: String, estrelas: () => '', limitar: (v, min, max) => Math.min(max, Math.max(min, v)) },
      Filmes: { metaDe: f => f.meta, norm: String, temChave: () => true },
      Quartinho: { perfis: () => ({ eu: p }) }
    },
    document: { getElementById: () => ctx.raiz, addEventListener() {} }
  };
  ctx.raiz = {};
  vm.createContext(ctx);
  vm.runInContext(ler('estatisticas.js'), ctx);
  assert.equal(ctx.window.Stats.resumo(p).paises.length, 22);
  const quarto = ctx.window.Stats.cartoesDoQuarto('eu');
  const paisesHtml = quarto.match(/<ul class="paises">([\s\S]*?)<\/ul>/)[1];
  assert.equal((paisesHtml.match(/<li /g) || []).length, 20);
  assert.match(paisesHtml, /https:\/\/flagcdn\.com\/w40\/br\.png/);
  assert.match(paisesHtml, /title="filme 0"/);
  assert.match(quarto, /decadas-largo/);
  assert.match(quarto, /--colunas:12/);
  ctx.window.Stats.render('eu');
  assert.equal((ctx.raiz.innerHTML.match(/<ul class="paises">([\s\S]*?)<\/ul>/)[1].match(/<li /g) || []).length, 20);
});

test('rankings exibem até vinte gêneros e trinta diretores e listam os títulos da década correta', () => {
  const filmes = Array.from({ length: 32 }, (_, i) => ({
    titulo: 'Título ' + i, ano: i < 2 ? 2001 + i : 1990 + i % 10, nota: 4,
    meta: { tipo: 'filme', generos: ['Gênero ' + i], diretor: 'Diretor ' + String(i).padStart(2, '0'), elenco: [], pais: [], nota: 0 }
  }));
  filmes.push({ titulo: 'Sem ano', ano: '', nota: 4 });
  const p = { id: 'eu', nome: 'teste', assistidos: filmes };
  const ctx = {
    window: {
      U: { esc: s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'), estrelas: () => '', limitar: (v, min, max) => Math.min(max, Math.max(min, v)) },
      Filmes: { metaDe: f => f.meta, norm: String, temChave: () => true },
      Quartinho: { perfis: () => ({ eu: p }) }
    },
    document: { addEventListener() {} }
  };
  vm.createContext(ctx);
  vm.runInContext(ler('estatisticas.js'), ctx);
  const html = ctx.window.Stats.cartoesDoQuarto('eu');
  const generos = html.match(/data-cartao="stats-generos"[\s\S]*?<\/section>/)[0];
  const diretores = html.match(/data-cartao="stats-diretores"[\s\S]*?<\/section>/)[0];
  assert.equal((generos.match(/<li /g) || []).length, 20);
  assert.equal(ctx.window.Stats.resumo(p).diretores.length, 30);
  assert.equal((diretores.match(/<li /g) || []).length, 30);
  assert.match(diretores, /Diretor 29/);
  assert.doesNotMatch(diretores, /Diretor 30/);
  assert.match(diretores, /lista-top-rolagem/);
  const decada = ctx.window.Stats.resumo(p).decadas.find(d => d.nome === '2000s');
  assert.equal(decada.n, 2);
  assert.deepEqual(Array.from(decada.filmes, f => f.titulo), ['Título 0', 'Título 1']);
  assert.match(html, /data-decada="2000s"/);
  assert(!html.includes('Sem ano'));
});

test('rankings roláveis e média de notas aparecem no quarto e no relatório', () => {
  const atores = Array.from({ length: 32 }, (_, i) => 'Ator ' + String(i).padStart(2, '0'));
  const filmes = Array.from({ length: 2 }, (_, i) => ({
    titulo: 'Filme ' + i, ano: 2000, nota: i ? 4.5 : 3,
    meta: { tipo: 'filme', generos: [], diretor: 'Diretor', elenco: atores, pais: [], nota: 0 }
  }));
  filmes.push({ titulo: 'Sem metadados', nota: 4 }, { titulo: 'Sem nota', nota: null },
    { titulo: 'Inválido', nota: 6 });
  const p = { id: 'eu', nome: 'teste', assistidos: filmes };
  const ctx = {
    window: {
      U: { esc: String, estrelas: () => '', limitar: (v, min, max) => Math.min(max, Math.max(min, v)) },
      Filmes: { metaDe: f => f.meta, norm: String, temChave: () => true },
      Quartinho: { perfis: () => ({ eu: p }) }
    },
    document: { getElementById: () => ctx.raiz, addEventListener() {} }, raiz: {}
  };
  vm.createContext(ctx);
  vm.runInContext(ler('estatisticas.js'), ctx);
  const stats = ctx.window.Stats;
  assert.equal(stats.resumo(p).atores.length, 30);
  assert.equal(stats.resumo(p).totalNotas, 3);
  for (const html of [stats.cartoesDoQuarto('eu'), (stats.render('eu'), ctx.raiz.innerHTML)]) {
    const atoresHtml = html.match(/atores que mais aparecem[\s\S]*?<\/section>/)[0];
    assert.match(atoresHtml, /lista-top-rolagem/);
    assert.equal((atoresHtml.match(/<li>/g) || []).length, 30);
    assert.match(atoresHtml, /Ator 29/);
    assert.doesNotMatch(atoresHtml, /Ator 30/);
    assert.match(html, /média das notas: <b>3,83 \/ 5 ★<\/b>/);
  }
  p.assistidos = [];
  const vazio = stats.cartoesDoQuarto('eu');
  assert.match(vazio, /sem notas ainda/);
  assert.doesNotMatch(vazio, /NaN/);
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'estilo.css'), 'utf8');
  assert.match(css, /\.lista-top-rolagem\s*\{[^}]*max-height:[^}]*overflow-y:\s*auto/);
  assert.match(css, /\.lista-top-rolagem\s*\{[^}]*list-style-position:\s*inside/);
});

test('gêneros e diretores mostram os títulos correspondentes com caracteres escapados', () => {
  const filme = (titulo, generos, diretor) => ({ titulo, ano: 2000, nota: 4,
    meta: { tipo: 'filme', generos, diretor, elenco: [], pais: [], nota: 0 } });
  const p = { id: 'eu', nome: 'teste', assistidos: [
    filme('Primeiro "filme"', ['Drama', 'Comédia'], 'Diretora'),
    filme('Segundo <filme>', ['Drama'], 'Diretora'),
    filme('Outro', ['Comédia'], 'Outro diretor')
  ] };
  const ctx = {
    window: {
      U: { esc: s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'), estrelas: () => '', limitar: (v, min, max) => Math.min(max, Math.max(min, v)) },
      Filmes: { metaDe: f => f.meta, norm: String, temChave: () => true },
      Quartinho: { perfis: () => ({ eu: p }) }
    },
    document: { getElementById: () => ctx.raiz, addEventListener() {} }, raiz: {}
  };
  vm.createContext(ctx);
  vm.runInContext(ler('estatisticas.js'), ctx);
  for (const html of [ctx.window.Stats.cartoesDoQuarto('eu'), (ctx.window.Stats.render('eu'), ctx.raiz.innerHTML)]) {
    const generos = html.match(/gêneros favoritos[\s\S]*?<\/section>/)[0];
    const diretores = html.match(/diretores mais vistos[\s\S]*?<\/section>/)[0];
    assert.match(generos, /title="Primeiro &quot;filme&quot;\nSegundo &lt;filme>"><span class="rotulo">Drama/);
    assert.match(generos, /title="Primeiro &quot;filme&quot;\nOutro"><span class="rotulo">Comédia/);
    assert.match(diretores, /title="Primeiro &quot;filme&quot;\nSegundo &lt;filme>">Diretora/);
    assert.match(diretores, /title="Outro">Outro diretor/);
  }
});

test('gêneros mais bem avaliados usam notas pessoais e respeitam a seleção de cartões', () => {
  const filme = (nota, generos) => ({ titulo: 'Filme', ano: 2000, nota,
    meta: { tipo: 'filme', generos, elenco: [], pais: [], nota: 8 } });
  const p = { id: 'eu', nome: 'Eu', assistidos: [
    filme(5, ['Drama', 'Ação', 'Drama']), filme(4, ['Drama']),
    filme(5, ['Comédia']), filme(5, ['Ação']), filme(3, ['Terror']),
    filme(null, ['Terror']), filme(0, ['Terror']), filme(6, ['Terror']),
    { titulo: 'Sem metadados', nota: 5 }
  ] };
  const amigo = { ...p, id: 'amigo', nome: 'Amigo' };
  const perfis = { eu: p, amigo };
  const ctx = {
    window: {
      U: { esc: String, estrelas: () => '', limitar: (v, min, max) => Math.min(max, Math.max(min, v)) },
      Filmes: { metaDe: f => f.meta, norm: String, temChave: () => true },
      Quartinho: { perfis: () => perfis, linkQuarto: () => '#' }
    },
    document: { getElementById: () => ctx.raiz, addEventListener() {} }, raiz: {}
  };
  vm.createContext(ctx);
  vm.runInContext(ler('estatisticas.js'), ctx);
  const stats = ctx.window.Stats;
  assert.deepEqual(Array.from(stats.resumo(p).generosNotas, g => [g.nome, g.media, g.n]), [
    ['Ação', 5, 2], ['Comédia', 5, 1], ['Drama', 4.5, 2]
  ]);
  const html = stats.cartoesDoQuarto('eu');
  const cartao = html.match(/data-cartao="stats-generos-notas"[\s\S]*?<\/section>/)[0];
  assert.match(cartao, /Ação — <b>5,00 \/ 5<\/b> <small>\(2 títulos\)/);
  assert.match(cartao, /Drama — <b>4,50 \/ 5<\/b>/);
  assert.equal((cartao.match(/<li>/g) || []).length, 3);
  stats.render('amigo');
  assert.match(ctx.raiz.innerHTML, /gêneros mais bem avaliados/);
  assert.match(stats.cartoesDoQuarto('amigo', false), /stats-generos-notas/);
  p.statsCards = ['generos'];
  assert.doesNotMatch(stats.cartoesDoQuarto('eu'), /stats-generos-notas/);
  assert.match(stats.opcoesCartoes(p.statsCards), /name="statsCards" value="generos-notas" > Gêneros mais bem avaliados/);
  p.statsCards.push('generos-notas');
  assert.match(stats.cartoesDoQuarto('eu'), /stats-generos-notas/);
  p.assistidos = [];
  assert.match(stats.cartoesDoQuarto('eu'), /sem títulos avaliados com gênero/);
});

test('gráfico abre e fecha a lista por mouse, teclado e toque, escapando títulos', () => {
  const eventos = {};
  const botoes = [];
  const painel = { hidden: true, innerHTML: '' };
  const grafico = {
    querySelector: () => painel,
    querySelectorAll: () => botoes,
    contains: el => el === botao,
    matches: () => false
  };
  const botao = {
    dataset: { decada: '2000s', filmesDecada: JSON.stringify([{ titulo: '<img src=x>', ano: 2001 }]) },
    closest: seletor => seletor === '[data-decada]' ? botao : seletor === '.grafico-decadas' ? grafico : null,
    setAttribute: (nome, valor) => { botao[nome] = valor; }
  };
  botoes.push(botao);
  const ctx = {
    window: { U: { esc: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), estrelas() {}, limitar() {} }, Filmes: {} },
    document: { activeElement: null, addEventListener: (tipo, fn) => { eventos[tipo] = fn; } }
  };
  vm.createContext(ctx);
  vm.runInContext(ler('estatisticas.js'), ctx);
  eventos.pointerover({ target: botao, pointerType: 'mouse' });
  assert.equal(painel.hidden, false);
  assert.match(painel.innerHTML, /&lt;img src=x>/);
  assert.equal(botao['aria-expanded'], 'true');
  eventos.pointerout({ target: botao, relatedTarget: null });
  assert.equal(painel.hidden, true);
  eventos.focusin({ target: botao });
  assert.equal(painel.hidden, false);
  eventos.keydown({ target: botao, key: 'Escape' });
  assert.equal(painel.hidden, true);
  eventos.pointerover({ target: botao, pointerType: 'touch' });
  assert.equal(painel.hidden, true);
  eventos.click({ target: botao });
  assert.equal(painel.hidden, false);
  eventos.click({ target: { closest: seletor => seletor === '.fechar-decada' ? { closest: () => grafico } : null } });
  assert.equal(painel.hidden, true);
});

test('formulário para guardar filme aparece antes da lista, apenas no próprio quarto', () => {
  const app = ler('app.js');
  const trecho = app.slice(app.indexOf('    estante: {'), app.indexOf('    posteres: {'));
  const p = { assistidos: [{ titulo: 'Filme', ano: 2000, data: '2023-01-01', nota: 4, meta: { poster: 'https://example.com/poster.jpg', generos: [] } }] };
  let dono = true;
  const ctx = {
    perfil: () => p, ehMeu: () => dono, esc: String, corDe: () => '#fff', fmtData: String,
    estrelas: () => '', campo: () => '',
    window: { U: { campoNota: () => '' }, Filmes: { metaDe: f => f.meta } },
    urlSegura: s => /^https:\/\//.test(s) ? s : ''
  };
  vm.createContext(ctx);
  vm.runInContext('this.estante = ({' + trecho + '}).estante;', ctx);
  const html = ctx.estante.html();
  assert(html.indexOf('id="f-filme"') < html.indexOf('class="lista-filmes"'));
  assert(html.indexOf('class="lista-filmes"') < html.indexOf('id="f-letterboxd"'));
  assert.match(html, /src="https:\/\/example\.com\/poster\.jpg" alt="Pôster de Filme"/);
  assert.match(html, /class="capa-estante"/);
  dono = false;
  assert(!ctx.estante.html().includes('id="f-filme"'));
  assert(ctx.estante.html().includes('Filme'));
});

test('estante filtra filmes pela nota pessoal, incluindo meia estrela e sem nota', () => {
  const app = ler('app.js');
  const trecho = app.slice(app.indexOf('    estante: {'), app.indexOf('    posteres: {'));
  const p = { assistidos: [{ titulo: 'Cinco', nota: 5 }, { titulo: 'Meia', nota: 2.5 }, { titulo: 'Sem nota' }] };
  const itens = p.assistidos.map(f => ({ dataset: { nota: f.nota == null ? '' : String(f.nota) }, hidden: false }));
  const avisoVazio = { hidden: true };
  const corpo = {
    querySelector: () => null,
    querySelectorAll: () => itens
  };
  const ctx = {
    perfil: () => p, ehMeu: () => true, esc: String, corDe: () => '#fff', fmtData: String,
    estrelas: () => '', campo: () => {}, mudou() {},
    window: { U: { campoNota: () => '' }, Filmes: { metaDe: () => null } },
    urlSegura: () => ''
  };
  vm.createContext(ctx);
  vm.runInContext('this.estante = ({' + trecho + '}).estante;', ctx);
  const html = ctx.estante.html();
  assert.match(html, /aria-label="Filtrar filmes por nota"/);
  assert.match(html, /<option value="2\.5">2,5 ★<\/option>/);
  assert.match(html, /data-nota="5"/);
  corpo.querySelector = seletor => seletor === '[data-filtro-vazio]' ? avisoVazio : null;
  ctx.estante.bind(corpo, () => {});

  corpo.onchange({ target: { id: 'filtro-nota', value: '2.5' } });
  assert.deepEqual(itens.map(item => item.hidden), [true, false, true]);
  assert.equal(avisoVazio.hidden, true);
  corpo.onchange({ target: { id: 'filtro-nota', value: '4.5' } });
  assert.deepEqual(itens.map(item => item.hidden), [true, true, true]);
  assert.equal(avisoVazio.hidden, false);
  corpo.onchange({ target: { id: 'filtro-nota', value: 'sem-nota' } });
  assert.deepEqual(itens.map(item => item.hidden), [true, true, false]);
  assert.equal(avisoVazio.hidden, true);
  corpo.onchange({ target: { id: 'filtro-nota', value: 'todas' } });
  assert.deepEqual(itens.map(item => item.hidden), [false, false, false]);
  assert.equal(avisoVazio.hidden, true);
});

test('estante ordena por nota e ano sem alterar os filmes ou o filtro', () => {
  const app = ler('app.js');
  const trecho = app.slice(app.indexOf('    estante: {'), app.indexOf('    posteres: {'));
  const p = { assistidos: [
    { titulo: 'A', nota: 4, ano: 2000 }, { titulo: 'B', nota: 2.5, ano: 1990 },
    { titulo: 'C', nota: 4, ano: 2020 }, { titulo: 'D', nota: null, ano: '' },
    { titulo: 'E', nota: null, ano: 2000 }
  ] };
  const itens = p.assistidos.map((f, i) => ({
    dataset: { indice: String(i), nota: f.nota == null ? '' : String(f.nota), ano: String(f.ano) }, hidden: false
  }));
  const lista = { children: [...itens], append(...novos) { this.children = novos; } };
  const aviso = { hidden: true };
  const corpo = {
    querySelector: seletor => seletor === '.lista-filmes' ? lista : seletor === '[data-filtro-vazio]' ? aviso : null,
    querySelectorAll: () => lista.children
  };
  const ctx = {
    perfil: () => p, ehMeu: () => false, esc: String, corDe: () => '#fff', fmtData: String,
    estrelas: () => '', urlSegura: () => '',
    window: { Filmes: { metaDe: () => null } }
  };
  vm.createContext(ctx);
  vm.runInContext('this.estante = ({' + trecho + '}).estante;', ctx);
  const html = ctx.estante.html();
  assert.match(html, /aria-label="Ordenar filmes"/);
  assert.match(html, /data-indice="0" data-ano="2000" data-nota="4"/);
  ctx.estante.bind(corpo, () => {});
  const ordem = valor => corpo.onchange({ target: { id: 'ordem-estante', value: valor } });
  const indices = () => lista.children.map(item => Number(item.dataset.indice));
  ordem('nota-desc');
  assert.deepEqual(indices(), [0, 2, 1, 3, 4]);
  ordem('nota-asc');
  assert.deepEqual(indices(), [1, 0, 2, 3, 4]);
  corpo.onchange({ target: { id: 'filtro-nota', value: '4' } });
  ordem('ano-desc');
  assert.deepEqual(indices(), [2, 0, 4, 1, 3]);
  assert.deepEqual(itens.map(item => item.hidden), [false, true, false, true, true]);
  ordem('ano-asc');
  assert.deepEqual(indices(), [1, 0, 4, 2, 3]);
  ordem('original');
  assert.deepEqual(indices(), [0, 1, 2, 3, 4]);
  assert.deepEqual(p.assistidos.map(f => f.titulo), ['A', 'B', 'C', 'D', 'E']);
});

test('janela da análise pede senha ao atingir o limite e mostra o texto escapado', () => {
  const app = ler('app.js');
  const ini = app.indexOf('    analiseIa: {');
  const trecho = app.slice(ini, app.indexOf('    tv: {'));
  const ctx = {
    esc: s => String(s).replace(/</g, '&lt;'),
    formatarAnalise: s => String(s).replace(/</g, '&lt;'),
    analiseIa: { fase: 'limite', erro: 'Limite atingido', texto: '', restantes: null }
  };
  vm.createContext(ctx);
  vm.runInContext('this.janela = ({' + trecho + '}).analiseIa;', ctx);
  assert.match(ctx.janela.html(), /data-liberar-analise/);
  ctx.analiseIa.fase = 'pronta';
  ctx.analiseIa.texto = '<b>oi</b>';
  ctx.analiseIa.restantes = 3;
  const html = ctx.janela.html();
  assert.match(html, /&lt;b>oi/);
  assert.match(html, /Restam 3/);
});

function carregarBanner(extra) {
  const app = ler('app.js');
  const ini = app.indexOf('  function filmesParaAnalise()');
  const fim = app.indexOf('  function renderTudo()');
  const ctx = Object.assign({ esc: String }, extra);
  vm.createContext(ctx);
  vm.runInContext(app.slice(ini, fim) + ';this.htmlBannerIa = htmlBannerIa; this.selecao = filmesParaAnalise; this.iniciar = iniciarAnaliseDosFilmes;', ctx);
  return ctx;
}

test('chamada da análise por IA fica fora da estante e só aparece no próprio quarto', () => {
  const app = ler('app.js');
  const estante = app.slice(app.indexOf('    estante: {'), app.indexOf('    posteres: {'));
  assert.doesNotMatch(estante, /data-analisar-filmes/);
  let dono = true;
  const ctx = carregarBanner({ perfil: () => ({ assistidos: [1, 2, 3].map(n => ({ titulo: 'F' + n, nota: n })) }), ehMeu: () => dono });
  assert.match(ctx.htmlBannerIa(), /data-analisar-filmes/);
  assert.match(ctx.htmlBannerIa(), /Google Gemini/);
  dono = false;
  assert.equal(ctx.htmlBannerIa(), '');
});

test('análise envia os 20 filmes de maior e os 20 de menor nota, sem repetir', () => {
  let enviados;
  const assistidos = Array.from({ length: 60 }, (_, i) => ({ titulo: 'F' + i, ano: 2000, nota: ((i % 10) + 1) / 2 }));
  assistidos.push({ titulo: 'Sem nota', ano: 1999 });
  const ctx = carregarBanner({
    perfil: () => ({ assistidos }), ehMeu: () => true, avisar() {},
    abrirAnaliseIa: filmes => { enviados = filmes; },
    Conta: { logado: () => true }
  });
  ctx.iniciar();
  const lista = JSON.parse(JSON.stringify(enviados));
  assert.equal(lista.length, 40);
  assert.equal(new Set(lista.map(x => x.titulo)).size, 40);
  assert.ok(lista.slice(0, 20).every(x => x.nota >= 3.5));
  assert.ok(lista.slice(20).every(x => x.nota <= 2));
  assert.ok(!lista.some(x => x.titulo === 'Sem nota'));
  const curta = carregarBanner({ perfil: () => ({ assistidos: assistidos.slice(0, 5) }), ehMeu: () => true });
  assert.equal(curta.selecao().length, 5);
});
