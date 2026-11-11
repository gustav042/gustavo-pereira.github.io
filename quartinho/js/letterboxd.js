// Importação de avaliações exportadas pelo Letterboxd.
window.Letterboxd = (function () {
  'use strict';

  function linhasCsv(texto) {
    const linhas = [], linha = [];
    let campo = '', aspas = false, depoisDasAspas = false;
    texto = texto.replace(/^\uFEFF/, '');
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (aspas) {
        if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') { aspas = false; depoisDasAspas = true; }
        else campo += c;
      } else if (c === ',' || c === '\n' || c === '\r') {
        linha.push(campo); campo = ''; depoisDasAspas = false;
        if (c !== ',') {
          if (c === '\r' && texto[i + 1] === '\n') i++;
          linhas.push(linha.splice(0));
        }
      } else if (c === '"' && !campo && !depoisDasAspas) aspas = true;
      else if (c === '"' || depoisDasAspas) throw new Error('CSV inválido: aspas em posição inesperada.');
      else campo += c;
    }
    if (aspas) throw new Error('CSV inválido: aspas não foram fechadas.');
    if (campo || linha.length || depoisDasAspas) { linha.push(campo); linhas.push(linha); }
    return linhas.filter(l => l.some(c => c.trim()));
  }

  function ler(texto) {
    const linhas = linhasCsv(texto);
    if (!linhas.length) throw new Error('O CSV está vazio.');
    const cabecalho = linhas.shift().map(c => c.trim());
    const colunas = ['Date', 'Name', 'Year', 'Letterboxd URI', 'Rating'];
    const indices = colunas.map(c => cabecalho.indexOf(c));
    if (indices.some(i => i < 0)) throw new Error('O CSV precisa das colunas Date, Name, Year, Letterboxd URI e Rating.');
    return linhas.map((linha, i) => {
      const [data, titulo, ano, uri, nota] = indices.map(indice => String(linha[indice] || '').trim());
      const dt = /^\d{4}-\d{2}-\d{2}$/.test(data) ? new Date(data + 'T00:00:00Z') : null;
      if (!titulo || !dt || isNaN(dt) || dt.toISOString().slice(0, 10) !== data ||
          !/^\d{4}$/.test(ano) || !/^https:\/\/(boxd\.it|letterboxd\.com)\//i.test(uri) ||
          !/^(?:[1-4](?:\.5)?|0\.5|5(?:\.0)?)$/.test(nota)) {
        throw new Error('Confira os dados da linha ' + (i + 2) + ': título, data, ano, link e nota de 0,5 a 5 são obrigatórios.');
      }
      return { titulo, ano: Number(ano), data, nota: Number(nota), letterboxdUri: uri };
    });
  }

  function mesmoFilme(a, b) {
    if (a.letterboxdUri && b.letterboxdUri && a.letterboxdUri === b.letterboxdUri) return true;
    if (a.meta && b.meta && a.meta.fonte === 'tmdb' && b.meta.fonte === 'tmdb' &&
        a.meta.tipo === b.meta.tipo && a.meta.id === b.meta.id) return true;
    const nomesA = [a.titulo, a.original, a.traduzido].filter(Boolean).map(window.Filmes.norm);
    const nomesB = [b.titulo, b.original, b.traduzido].filter(Boolean).map(window.Filmes.norm);
    return nomesA.some(n => n && nomesB.includes(n)) && (!a.ano || !b.ano || Number(a.ano) === Number(b.ano));
  }

  async function preparar(itens, progresso) {
    if (!window.Filmes.temChave()) return itens.map(item => ({ ...item }));
    let proximo = 0, concluidos = 0, falhou = false;
    const resultado = new Array(itens.length);
    async function trabalhador() {
      try {
        while (!falhou && proximo < itens.length) {
          const i = proximo++, item = itens[i];
          const encontrados = await window.Filmes.buscar(item.titulo, 'filme');
          const exatos = encontrados.filter(f => Number(f.ano) === item.ano &&
            [f.titulo, f.original].some(nome => window.Filmes.norm(nome) === window.Filmes.norm(item.titulo)));
          const unico = exatos.length === 1 ? exatos[0] : null;
          const detalhes = unico ? await window.Filmes.detalhes(unico) : null;
          if (falhou) return;
          resultado[i] = { ...item, original: unico && unico.original, traduzido: detalhes && detalhes.titulo, meta: detalhes && detalhes.meta };
          progresso(++concluidos, itens.length);
        }
      } catch (erro) {
        falhou = true;
        throw erro;
      }
    }
    await Promise.all(Array.from({ length: Math.min(4, itens.length) }, trabalhador));
    return resultado;
  }

  function separar(itens, existentes) {
    const conhecidos = existentes.slice(), novos = [], ignorados = [];
    let duplicados = 0, semInfo = 0;
    for (const item of itens) {
      if (conhecidos.some(f => mesmoFilme(f, item))) { duplicados++; ignorados.push(item); continue; }
      const novo = {
        id: window.U.novoId(), titulo: item.titulo, ano: item.ano, nota: item.nota,
        data: item.data, quando: item.data + 'T12:00:00', letterboxdUri: item.letterboxdUri
      };
      if (item.meta) novo.meta = item.meta; else semInfo++;
      conhecidos.push({ ...novo, original: item.original, traduzido: item.traduzido });
      novos.push(novo);
    }
    return { novos, duplicados, semInfo, ignorados };
  }

  return { ler, preparar, separar };
})();
