// Busca de entidades para listas de personagens, sem chave de API.
window.Wikidata = (function () {
  'use strict';

  async function consultar(endereco, params) {
    const url = new URL(endereco);
    for (const [nome, valor] of Object.entries(params)) url.searchParams.set(nome, valor);
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    let resposta;
    try { resposta = await fetch(url); } catch (e) { throw new Error('Sem conexão com o Wikidata.'); }
    if (resposta.status === 429) throw new Error('Muitas buscas no Wikidata. Tente novamente daqui a pouco.');
    if (!resposta.ok) throw new Error('O Wikidata respondeu com erro ' + resposta.status + '.');
    const dados = await resposta.json();
    if (dados.error) throw new Error('O Wikidata não conseguiu fazer a busca: ' + (dados.error.info || dados.error.code));
    return dados;
  }

  async function buscar(texto) {
    const dados = await consultar('https://www.wikidata.org/w/api.php', {
      action: 'wbsearchentities', search: texto.trim(), language: 'pt', uselang: 'pt',
      type: 'item', limit: '20'
    });
    if (!Array.isArray(dados.search)) throw new Error('O Wikidata retornou uma resposta inesperada.');
    return dados.search
      .filter(item => /^Q[1-9]\d*$/.test(item.id) && typeof item.label === 'string' && item.label.trim())
      .map(item => ({ id: item.id, nome: item.label, descricao: item.description || '' }));
  }

  const cacheImagens = new Map();
  async function imagens(ids) {
    const unicos = [...new Set(ids)].filter(id => /^Q[1-9]\d*$/.test(id));
    const faltantes = unicos.filter(id => !cacheImagens.has(id));
    for (let inicio = 0; inicio < faltantes.length; inicio += 50) {
      const lote = faltantes.slice(inicio, inicio + 50);
      const dados = await consultar('https://www.wikidata.org/w/api.php', {
        action: 'wbgetentities', ids: lote.join('|'), props: 'claims'
      });
      if (!dados.entities) throw new Error('O Wikidata retornou uma resposta inesperada.');
      const arquivos = new Map();
      for (const id of lote) {
        const entidade = dados.entities[id];
        const claims = entidade && entidade.claims && entidade.claims.P18 || [];
        const claim = claims.find(c => c.rank !== 'deprecated' && c.mainsnak && c.mainsnak.datavalue && typeof c.mainsnak.datavalue.value === 'string');
        if (claim) arquivos.set(id, 'File:' + claim.mainsnak.datavalue.value);
      }
      const infoPorArquivo = new Map();
      if (arquivos.size) {
        const dadosCommons = await consultar('https://commons.wikimedia.org/w/api.php', {
          action: 'query', prop: 'imageinfo', titles: [...new Set(arquivos.values())].join('|'),
          iiprop: 'url|extmetadata', iiurlwidth: '320', formatversion: '2'
        });
        if (!dadosCommons.query || !Array.isArray(dadosCommons.query.pages)) throw new Error('O Wikimedia Commons retornou uma resposta inesperada.');
        for (const pagina of dadosCommons.query.pages) {
          const info = pagina.imageinfo && pagina.imageinfo[0];
          if (info) infoPorArquivo.set(pagina.title.replace(/_/g, ' '), info);
        }
      }
      for (const id of lote) {
        const arquivo = arquivos.get(id);
        const info = arquivo && infoPorArquivo.get(arquivo.replace(/_/g, ' '));
        const meta = info && info.extmetadata;
        const url = info && info.thumburl;
        const pagina = info && info.descriptionurl;
        if (url && /^https:\/\/upload\.wikimedia\.org\//.test(url) &&
            pagina && /^https:\/\/commons\.wikimedia\.org\//.test(pagina) &&
            meta && meta.LicenseShortName && meta.Artist) {
          const texto = html => { const el = document.createElement('div'); el.innerHTML = html || ''; return el.textContent.trim(); };
          const licencaUrl = meta.LicenseUrl && meta.LicenseUrl.value;
          cacheImagens.set(id, { url, pagina, autor: texto(meta.Artist.value), licenca: texto(meta.LicenseShortName.value),
            licencaUrl: /^https?:\/\/creativecommons\.org\//.test(licencaUrl || '') ? licencaUrl : '' });
        } else cacheImagens.set(id, null);
      }
    }
    return new Map(unicos.map(id => [id, cacheImagens.get(id)]));
  }

  return { buscar, imagens };
})();
