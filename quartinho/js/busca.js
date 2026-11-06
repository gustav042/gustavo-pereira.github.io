// Caixa de busca com sugestões de filmes/séries (autocomplete), reutilizável.
// Uso: Busca.anexar(input, { tipos: 'tudo' | 'filme' | 'serie', aoEscolher(detalhes, item) {} })
window.Busca = (function () {
  'use strict';
  const { esc } = window.U;
  let contador = 0;

  function anexar(input, { tipos = 'tudo', aoEscolher }) {
    if (!input || input.dataset.buscaPronta) return;
    input.dataset.buscaPronta = '1';
    const id = 'busca-' + (++contador);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', id);

    const caixa = document.createElement('div');
    caixa.className = 'busca-caixa';
    input.parentNode.insertBefore(caixa, input);
    caixa.appendChild(input);
    const lista = document.createElement('ul');
    lista.className = 'busca-lista';
    lista.id = id;
    lista.setAttribute('role', 'listbox');
    lista.hidden = true;
    caixa.appendChild(lista);

    let itens = [], ativo = -1, timer = 0, pedido = 0;

    function fechar() {
      lista.hidden = true;
      ativo = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }
    function mensagem(texto) {
      itens = [];
      lista.innerHTML = `<li class="busca-msg">${texto}</li>`;
      lista.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    function desenhar() {
      lista.innerHTML = itens.map((it, i) => `
        <li role="option" id="${id}-${i}" data-i="${i}" aria-selected="${i === ativo}" class="${i === ativo ? 'ativo' : ''}">
          ${it.poster ? `<img src="${esc(it.poster)}" alt="" loading="lazy">` : '<span class="sem-capa" aria-hidden="true">🎬</span>'}
          <span><b>${esc(it.titulo)}</b><small>${it.ano ? esc(it.ano) + ' · ' : ''}${it.tipo === 'serie' ? 'série' : 'filme'}</small></span>
        </li>`).join('')
        + (window.Filmes.temChave() ? '' : '<li class="busca-msg">a busca de filmes está desligada (falta a chave do TMDB)</li>');
      lista.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      if (ativo >= 0) input.setAttribute('aria-activedescendant', `${id}-${ativo}`);
      else input.removeAttribute('aria-activedescendant');
    }

    async function escolher(i) {
      const it = itens[i];
      if (!it) return;
      fechar();
      input.value = it.titulo;
      let det;
      try { det = await window.Filmes.detalhes(it); } catch (e) { det = { titulo: it.titulo, ano: it.ano, meta: null }; }
      input.value = det.titulo;
      aoEscolher(det, it);
    }

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const texto = input.value;
      if (texto.trim().length < 2) { fechar(); return; }
      timer = setTimeout(async () => {
        const meu = ++pedido;
        mensagem('buscando...');
        try {
          const r = await window.Filmes.buscar(texto, tipos);
          if (meu !== pedido) return;
          itens = r;
          ativo = -1;
          if (r.length) desenhar(); else mensagem('nada encontrado — pode deixar o nome digitado mesmo');
        } catch (e) {
          if (meu === pedido) mensagem('⚠ ' + esc(e.message));
        }
      }, 300);
    });
    input.addEventListener('keydown', e => {
      if (lista.hidden || !itens.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); ativo = (ativo + 1) % itens.length; desenhar(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); ativo = (ativo - 1 + itens.length) % itens.length; desenhar(); }
      else if (e.key === 'Enter' && ativo >= 0) { e.preventDefault(); escolher(ativo); }
      else if (e.key === 'Escape') { e.preventDefault(); fechar(); }
    });
    // mousedown (e não click) pra escolher antes do campo perder o foco
    lista.addEventListener('mousedown', e => {
      const li = e.target.closest('[data-i]');
      if (li) { e.preventDefault(); escolher(Number(li.dataset.i)); }
    });
    input.addEventListener('blur', () => setTimeout(fechar, 150));
  }

  // Seletor de temporada + episódio (com botão de próximo episódio) dentro de `caixa`.
  // temps: [{ n, episodios }]; atual: { t, e } ou null; aoMudar(texto) recebe "Temporada X · Episódio Y".
  function seletorEpisodio(caixa, temps, atual, aoMudar) {
    if (!temps || !temps.length) { caixa.hidden = true; caixa.innerHTML = ''; return; }
    const tIni = atual && temps.some(t => t.n === atual.t) ? atual.t : temps[0].n;
    caixa.innerHTML = `
      <label class="campo curto"><span>Temporada</span><select name="temporada">${temps.map(t => `<option value="${t.n}" ${t.n === tIni ? 'selected' : ''}>${t.n}</option>`).join('')}</select></label>
      <label class="campo curto"><span>Episódio</span><select name="episodio"></select></label>
      <button class="btn98" type="button" data-proximo-ep title="Pular pro próximo episódio">⏭ próximo ep.</button>`;
    caixa.hidden = false;
    const selT = caixa.querySelector('[name=temporada]'), selE = caixa.querySelector('[name=episodio]');
    const preencherEps = e => {
      const t = temps.find(x => String(x.n) === selT.value);
      const total = (t && t.episodios) || 1;
      selE.innerHTML = Array.from({ length: total }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
      selE.value = String(Math.min(Math.max(1, e || 1), total));
    };
    const avisar = () => aoMudar(`Temporada ${selT.value} · Episódio ${selE.value}`);
    selT.onchange = () => { preencherEps(1); avisar(); };
    selE.onchange = avisar;
    caixa.querySelector('[data-proximo-ep]').onclick = () => {
      const i = temps.findIndex(x => String(x.n) === selT.value);
      if (Number(selE.value) < selE.options.length) selE.value = String(Number(selE.value) + 1);
      else if (i < temps.length - 1) { selT.value = String(temps[i + 1].n); preencherEps(1); }
      avisar();
    };
    preencherEps(atual && atual.t === tIni ? atual.e : 1);
    avisar();
  }

  return { anexar, seletorEpisodio };
})();
