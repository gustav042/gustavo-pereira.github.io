const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ler = nome => fs.readFileSync(path.join(__dirname, '..', 'js', nome), 'utf8');

test('volta ao mundo mostra até sete países sem limitar o resumo', () => {
  const paises = ['BR', 'US', 'FR', 'JP', 'KR', 'DE', 'IT', 'CA', 'GB'];
  const p = {
    id: 'eu', nome: 'teste', assistidos: paises.map((pais, i) => ({
      titulo: 'filme ' + i, ano: 1940 + i * 10, nota: 4,
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
  assert.equal(ctx.window.Stats.resumo(p).paises.length, 9);
  const quarto = ctx.window.Stats.cartoesDoQuarto('eu');
  const paisesHtml = quarto.match(/<ul class="paises">([\s\S]*?)<\/ul>/)[1];
  assert.equal((paisesHtml.match(/<li>/g) || []).length, 7);
  assert.match(paisesHtml, /https:\/\/flagcdn\.com\/w40\/br\.png/);
  assert.match(quarto, /decadas-largo/);
  assert.match(quarto, /--colunas:9/);
  ctx.window.Stats.render('eu');
  assert.equal((ctx.raiz.innerHTML.match(/<ul class="paises">([\s\S]*?)<\/ul>/)[1].match(/<li>/g) || []).length, 7);
});

test('rankings exibem dez diretores e gêneros e listam os títulos da década correta', () => {
  const filmes = Array.from({ length: 12 }, (_, i) => ({
    titulo: 'Título ' + i, ano: i < 2 ? 2001 + i : 1990 + i % 10, nota: 4,
    meta: { tipo: 'filme', generos: ['Gênero ' + i], diretor: 'Diretor ' + i, elenco: [], pais: [], nota: 0 }
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
  assert.equal((generos.match(/<li>/g) || []).length, 10);
  assert.equal((diretores.match(/<li>/g) || []).length, 10);
  const decada = ctx.window.Stats.resumo(p).decadas.find(d => d.nome === '2000s');
  assert.equal(decada.n, 2);
  assert.deepEqual(Array.from(decada.filmes, f => f.titulo), ['Título 0', 'Título 1']);
  assert.match(html, /data-decada="2000s"/);
  assert(!html.includes('Sem ano'));
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
  const p = { assistidos: [{ titulo: 'Filme', ano: 2000, data: '2023-01-01', nota: 4 }] };
  let dono = true;
  const ctx = {
    perfil: () => p, ehMeu: () => dono, esc: String, corDe: () => '#fff', fmtData: String,
    estrelas: () => '', campo: () => '',
    window: { U: { campoNota: () => '' }, Filmes: { metaDe: () => null } }
  };
  vm.createContext(ctx);
  vm.runInContext('this.estante = ({' + trecho + '}).estante;', ctx);
  const html = ctx.estante.html();
  assert(html.indexOf('id="f-filme"') < html.indexOf('class="lista-filmes"'));
  assert(html.indexOf('class="lista-filmes"') < html.indexOf('id="f-letterboxd"'));
  dono = false;
  assert(!ctx.estante.html().includes('id="f-filme"'));
  assert(ctx.estante.html().includes('Filme'));
});
