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
        + (window.Filmes.temChave() ? '' : '<li class="busca-msg">catálogo de exemplo · conecte o TMDB pra buscar tudo</li>');
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

  return { anexar };
})();
