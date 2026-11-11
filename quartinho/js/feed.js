// Feed (início): o que os amigos andam assistindo, estilo "atualizações dos amigos" dos anos 2000.
window.Feed = (function () {
  'use strict';
  const { esc, corDe, fmtData, estrelas, hash, corValida, hoje, limitar } = window.U;
  const CHAVE_CURTIDAS = 'quartinho:curtidas';
  const POR_PAGINA = 12;

  let curtidas = {};
  try { curtidas = JSON.parse(localStorage.getItem(CHAVE_CURTIDAS) || '{}') || {}; } catch (e) { /* ignora */ }
  let pagina = 1;

  const Q = () => window.Quartinho;
  const eu = () => Q().perfis().eu;
  const nomeDe = p => p.id === 'eu' ? 'você' : p.nome;

  // ---------- montando os acontecimentos ----------
  // Momento do acontecimento, pra ordenar: a hora exata quando existe (`quando`); itens antigos só
  // têm a data, então ficam no começo do dia, mantendo a ordem em que estão na lista (mais novo primeiro).
  const momento = (x, idx) => {
    const t = Date.parse(x.quando || '');
    if (!isNaN(t)) return t;
    const d = Date.parse((x.data || '1970-01-01') + 'T00:00:00');
    return (isNaN(d) ? 0 : d) - idx;
  };
  function eventos() {
    const perfis = Object.values(Q().perfis()).filter(p => !p.soVisita);
    const porNome = {};
    for (const p of perfis) { porNome[p.nome] = p; if (p.usuario) porNome[p.usuario] = p; }
    const evs = [];
    for (const p of perfis) {
      (p.assistidos || []).forEach((f, i) => evs.push({ id: `a|${p.id}|${f.titulo}|${f.data}`, tipo: 'assistiu', p, f, data: f.data, quando: f.quando, t: momento(f, i) }));
      (p.diario || []).forEach((d, i) => evs.push({ id: `d|${p.id}|${d.data}|${hash(d.texto)}`, tipo: 'diario', p, d, data: d.data, quando: d.quando, t: momento(d, i) }));
      (p.recados || []).forEach((r, i) => {
        const autor = porNome[r.de];
        if (autor && autor.id !== p.id) evs.push({ id: `r|${p.id}|${r.data}|${hash(r.texto)}`, tipo: 'recado', p: autor, para: p, r, data: r.data, quando: r.quando, t: momento(r, i) });
      });
    }
    // do mais recente pro mais antigo
    return evs.sort((a, b) => b.t - a.t || hash(b.id) - hash(a.id));
  }

  // "hoje", "ontem" ou a data, com a hora de verdade (itens antigos sem hora ganham uma inventada, sempre a mesma).
  function quando(ev) {
    const real = ev.quando ? new Date(ev.quando) : null;
    const temHora = real && !isNaN(real);
    const iso = temHora ? `${real.getFullYear()}-${String(real.getMonth() + 1).padStart(2, '0')}-${String(real.getDate()).padStart(2, '0')}` : ev.data;
    const d0 = new Date(hoje() + 'T00:00:00'), d1 = new Date(iso + 'T00:00:00');
    const dias = Math.round((d0 - d1) / 86400000);
    const dia = dias === 0 ? 'hoje' : dias === 1 ? 'ontem' : `em ${fmtData(iso)}`;
    const h = hash(ev.id);
    const hora = temHora
      ? `${String(real.getHours()).padStart(2, '0')}:${String(real.getMinutes()).padStart(2, '0')}`
      : `${String(8 + (h % 16)).padStart(2, '0')}:${String((h >>> 4) % 60).padStart(2, '0')}`;
    return { dia, hora, novo: dias <= 1 };
  }

  const qtdCurtidas = id => (curtidas[id] ? 1 : 0); // curtidas ainda ficam só neste navegador

  function naListaQueroVer(titulo) {
    const t = titulo.toLowerCase();
    const p = eu();
    return (p.listas || []).some(l => l.itens.some(i => typeof i === 'string' && i.toLowerCase() === t)) || (p.assistidos || []).some(f => f.titulo.toLowerCase() === t);
  }

  // ---------- pedaços de HTML ----------
  const miniAvatar = p => `<span class="mini-av" style="border-color:${corValida(p.corDestaque, '#ff66cc')}">${Q().avatar(p)}</span>`;
  const linkNome = p => `<a class="post-nome" href="${Q().linkQuarto(p.id)}">${esc(nomeDe(p))}</a>`;

  function htmlPost(ev) {
    const { dia, hora, novo } = quando(ev);
    const p = ev.p;
    let acao = '', corpo = '', extra = '';
    if (ev.tipo === 'assistiu') {
      const f = ev.f;
      const meta = window.Filmes.metaDe(f);
      acao = meta && meta.tipo === 'serie' ? 'terminou uma série' : 'assistiu um filme';
      const capa = meta && meta.poster
        ? `<img class="capa-feed" src="${esc(meta.poster)}" alt="Capa de ${esc(f.titulo)}" loading="lazy">`
        : `<div class="caixinha-dvd" style="background:${corDe(f.titulo)}"><span>${esc(f.titulo)}</span></div>`;
      corpo = `<div class="post-filme">
          ${capa}
          <div>
            <p class="titulo-filme">${esc(f.titulo)} ${f.ano ? `<small>(${esc(f.ano)})</small>` : ''}</p>
            ${meta && meta.generos.length ? `<p class="tags-genero">${meta.generos.slice(0, 3).map(g => `<span>${esc(g)}</span>`).join('')}</p>` : ''}
            <p class="estrelas-feed" aria-label="nota ${f.nota} de 5">${estrelas(f.nota)}</p>
            ${meta && meta.sinopse ? (meta.sinopse.length > 240
              ? `<details class="sinopse-filme"><summary>${esc(meta.sinopse.slice(0, 237))}… <span>ler sinopse completa</span></summary><p>${esc(meta.sinopse.slice(237))}</p></details>`
              : `<p class="sinopse-filme">${esc(meta.sinopse)}</p>`) : ''}
            ${f.comentario
              ? `<blockquote class="comentario-filme">“${esc(f.comentario)}”</blockquote>`
              : ''}
          </div>
        </div>`;
      if (p.id !== 'eu') {
        extra = naListaQueroVer(f.titulo)
          ? `<button class="btn98" disabled>✔ na sua lista</button>`
          : `<button class="btn98" data-quero-ver="${esc(f.titulo)}">+ quero ver</button>`;
      }
    } else if (ev.tipo === 'diario') {
      acao = 'escreveu no diário';
      corpo = `<blockquote class="texto-diario">${esc(ev.d.texto)}</blockquote>`;
    } else {
      const para = ev.para;
      acao = `deixou um recado no mural de ${para.id === 'eu' ? 'você' : `<a href="${Q().linkQuarto(para.id)}">${esc(para.nome)}</a>`}`;
      corpo = `<div class="texto-recado">${esc(ev.r.texto)}</div>`;
      extra = `<a class="btn98" href="${Q().linkQuarto(para.id, 'mural')}">💬 ver mural</a>`;
    }
    const curtido = !!curtidas[ev.id];
    const coments = ev.tipo === 'assistiu' ? C().doPost(p, ev.f) : [];
    if (ev.tipo === 'assistiu') postsNaTela.set(ev.id, { p, f: ev.f });
    const editandoPost = editandoPosts.has(ev.id);
    return `<article class="post post-${ev.tipo}">
      <header class="post-topo">
        ${miniAvatar(p)}
        <p>${linkNome(p)} <span class="post-acao">${acao}</span> ${novo ? '<span class="novo">NOVO!</span>' : ''}<br>
        <time>${dia} às ${hora}</time></p>
      </header>
      <div class="post-corpo">${corpo}</div>
      <footer class="post-rodape">
        <button class="btn98 ${curtido ? 'curtido' : ''}" data-curtir="${esc(ev.id)}" aria-pressed="${curtido}">👍 ${curtido ? 'curtiu' : 'curtir'} ${qtdCurtidas(ev.id) ? `(${qtdCurtidas(ev.id)})` : ""}</button>
        ${extra}
        ${ev.tipo === 'assistiu' && p.id === 'eu' ? `<button class="btn98" data-editar-post="${esc(ev.id)}">${editandoPost ? '✖ cancelar edição' : '✏️ editar post'}</button>` : ''}
        ${ev.tipo === 'assistiu' && C().ligados() ? `<button class="btn98" data-comentar="${esc(ev.id)}" aria-expanded="${abertos.has(ev.id)}">💬 comentar${coments.length ? ` (${coments.length})` : ''}</button>` : ''}
        <a class="btn98" href="${Q().linkQuarto(p.id)}">🚪 ${p.id === 'eu' ? 'meu quartinho' : 'visitar quartinho'}</a>
      </footer>
      ${editandoPost ? `<form class="form-editar-post" data-editar-post-form="${esc(ev.id)}">
        <label class="campo"><span>Título</span><input type="text" name="titulo" maxlength="80" required value="${esc(ev.f.titulo)}"></label>
        <div class="linha">
          <label class="campo curto"><span>Ano</span><input type="number" name="ano" min="1888" max="2100" value="${esc(ev.f.ano || '')}"></label>
          <label class="campo"><span>Nota</span>${window.U.campoNota(ev.f.nota)}</label>
        </div>
        <label class="campo"><span>Comentário (opcional)</span><textarea name="comentario" maxlength="280" rows="2">${esc(ev.f.comentario || '')}</textarea></label>
        <button class="btn98" type="submit">Salvar alterações</button>
      </form>` : ''}
      ${ev.tipo === 'assistiu' ? htmlComentarios(ev, coments) : ''}
    </article>`;
  }

  // ---------- comentários nos posts ----------
  const C = () => Q().comentarios;
  const abertos = new Set(); // posts com a caixinha de comentar aberta
  const editandoPosts = new Set();
  const editandoComentarios = new Set();
  const postsNaTela = new Map(); // id do post → { p, f } (pra saber onde comentar)
  function htmlComentarios(ev, coments) {
    if (!C().ligados() || (!coments.length && !abertos.has(ev.id))) return '';
    const meu = C().meuUid();
    const lista = coments.map(c => {
      const d = new Date(c.quando);
      const qnd = isNaN(d) ? '' : `${fmtData(c.quando.slice(0, 10))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const podeApagar = c.deUid === meu || ev.p.uid === meu;
      const editando = editandoComentarios.has(String(c.id));
      const autor = { id: c.deUid, nome: c.de, avatar: c.avatar, corDestaque: '#ff66cc' };
      return `<li>${miniAvatar(autor)}<span class="comentario-conteudo">${editando
        ? `<form class="form-comentario form-editar-comentario" data-editar-coment="${esc(String(c.id))}">
            <input type="text" name="texto" maxlength="300" required value="${esc(c.texto)}" aria-label="Editar comentário">
            <button class="btn98" type="submit">salvar</button>
            <button class="btn98" type="button" data-cancelar-edicao-coment="${esc(String(c.id))}">cancelar</button>
          </form>`
        : `<a class="post-nome" href="${Q().linkQuarto(c.deUid === meu ? 'eu' : c.de)}">@${esc(c.de)}</a> ${esc(c.texto)}
          <small>${qnd}</small>${c.deUid === meu ? ` <button class="link-botao" data-editar-coment="${esc(String(c.id))}" aria-label="Editar comentário">editar</button>` : ''}
          ${podeApagar ? ` <button class="link-botao apagar-coment" data-apagar-coment="${esc(String(c.id))}" aria-label="Apagar comentário">x</button>` : ''}`}</span></li>`;
    }).join('');
    const form = abertos.has(ev.id)
      ? (C().tabelaOk()
        ? `<form class="form-comentario" data-post="${esc(ev.id)}">
            <input type="text" name="texto" maxlength="300" required placeholder="escreva um comentário..." aria-label="Comentário">
            <button class="btn98" type="submit">enviar</button></form>`
        : '<p class="aviso-coment">⚠ Os comentários ainda não foram ativados no banco (falta rodar <code>supabase/comentarios.sql</code> no Supabase).</p>')
      : '';
    return `<div class="comentarios-post">${lista ? `<ul>${lista}</ul>` : ''}${form}</div>`;
  }

  function htmlTvs() {
    const perfis = Object.values(Q().perfis()).filter(p => p.id !== 'eu' && !p.soVisita && p.assistindo && p.assistindo.titulo);
    if (!perfis.length) return '';
    return `<section class="caixa-feed">
      <h2 class="titulo-caixa">📺 na TV dos amigos agora</h2>
      <div class="tvs">${perfis.map(p => {
        const a = p.assistindo, prog = window.Filmes.progressoDe(a);
        return `<a class="mini-tv" href="${Q().linkQuarto(p.id)}" title="Visitar o quartinho de ${esc(p.nome)}">
          <span class="mini-tv-tela"><b>${esc(a.titulo)}</b><small>${esc(a.detalhe)}</small><i style="width:${prog}%"></i></span>
          ${a.comentario ? `<em class="mini-tv-comentario" title="${esc(a.comentario)}">💬 ${esc(a.comentario)}</em>` : ''}
          <span class="mini-tv-dono">${miniAvatar(p)} ${esc(p.nome)}</span>
          <span class="mini-tv-link">🚪 visitar</span>
        </a>`;
      }).join('')}</div>
    </section>`;
  }

  function htmlStatus() {
    const a = eu().assistindo || {};
    return `<section class="caixa-feed caixa-status">
      <h2 class="titulo-caixa">✏️ o que você tá vendo?</h2>
      <form class="form98 status-form" id="f-status">
        <div class="linha">
          <label class="campo"><span>Título (digite pra buscar)</span><input type="text" name="titulo" maxlength="60" required value="${esc(a.titulo || '')}" placeholder="ex.: lost"></label>
          <label class="campo"><span>Episódio/detalhe</span><input type="text" name="detalhe" maxlength="60" value="${esc(a.detalhe || '')}" placeholder="ex.: T1 · E06"></label>
        </div>
        <div class="linha seletor-episodio" hidden></div>
        <label class="campo"><span>Comentário (opcional)</span><textarea name="comentario" maxlength="280" rows="2" placeholder="ex.: esse episódio me destruiu 😭"></textarea></label>
        <div class="linha">
          <button class="btn98" type="submit" name="acao" value="vendo">📺 tô assistindo</button>
          <span class="ou">ou</span>
          <label class="campo"><span>Nota</span>${window.U.campoNota(3)}</label>
          <button class="btn98" type="submit" name="acao" value="terminei">✔ terminei de ver</button>
          <span class="msg" role="status"></span>
        </div>
      </form>
    </section>`;
  }

  function htmlLateral() {
    const perfis = Object.values(Q().perfis()).filter(p => !p.soVisita);
    const meu = eu();
    const amigos = perfis.filter(p => p.id !== 'eu');
    // status do MSN inventado (mas estável durante a hora)
    const hora = new Date().getHours();
    const status = p => ['online', 'online', 'ausente', 'offline'][(hash(p.id) + hora) % 4];
    const rotulo = { online: 'Online', ausente: 'Ausente', offline: 'Offline' };
    // mais vistos pela galera
    const contagem = {};
    for (const p of perfis) for (const f of p.assistidos || []) contagem[f.titulo] = (contagem[f.titulo] || 0) + 1;
    const top = Object.entries(contagem).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5);
    return `
      <section class="caixa">
        <div class="caixa-titulo">você</div>
        <div class="eu-feed">
          ${miniAvatar(meu)}
          <p><b>${esc(meu.nome)}</b><br><small>${esc(meu.humor)}</small></p>
        </div>
        <p><a class="btn98 btn-lateral" href="#quarto">🚪 ir pro meu quartinho</a>
          <a class="btn98 btn-lateral" href="#stats">📊 minhas estatísticas</a></p>
      </section>
      <section class="caixa msn">
        <div class="msn-topo">🦋 Messenger — amigos (${amigos.length})</div>
        <ul class="msn-lista">${amigos.map(p => {
          const s = status(p);
          return `<li><a href="${Q().linkQuarto(p.id)}" class="msn-${s}">
            <span class="msn-bolinha" aria-label="${rotulo[s]}"></span>
            <span><b>${esc(p.nome)}</b> <small>(${rotulo[s]})</small><br><i>${esc(p.humor)}</i>
              <br><small class="compat-msn" title="compatibilidade de gosto com você">💞 ${window.Stats.compat(meu, p).pct}% compatível</small></span>
          </a></li>`;
        }).join('')}</ul>
        <p class="msn-rodape"><button class="btn98" data-acao="amigos">👥 procurar amigos</button></p>
      </section>
      <section class="caixa">
        <div class="caixa-titulo">🔥 mais vistos pela galera</div>
        <ol class="top-vistos">${top.map(([t, n]) => `<li>${esc(t)} <small>(${n}x)</small></li>`).join('')}</ol>
      </section>`;
  }

  // Busca no campo de status; se for série, mostra temporada/episódio pra escolher.
  let escolhaStatus = null;
  function prepararStatus() {
    const form = document.getElementById('f-status');
    if (!form) return;
    escolhaStatus = null;
    const seletor = form.querySelector('.seletor-episodio');
    const porDetalhe = texto => { form.elements.detalhe.value = texto; };
    window.Busca.anexar(form.elements.titulo, {
      aoEscolher(det) {
        escolhaStatus = det;
        const temps = det.meta && det.meta.temporadas;
        if (!temps || !temps.length) { form.elements.detalhe.value = ''; }
        window.Busca.seletorEpisodio(seletor, temps, null, porDetalhe);
      }
    });
    // Já está vendo uma série? O formulário abre nela, no episódio atual (é só apertar "próximo ep.").
    const a = eu().assistindo || {};
    const meta = a.titulo && window.Filmes.metaDe(a);
    // (sem episódio salvo ainda, começa no T1 · E1; nada é gravado até apertar "tô assistindo")
    const mostrarSerie = m => {
      escolhaStatus = { titulo: a.titulo, ano: '', meta: m };
      window.Busca.seletorEpisodio(seletor, m.temporadas, window.Filmes.episodioDe(a.detalhe), porDetalhe);
    };
    if (meta && meta.temporadas && meta.temporadas.length) mostrarSerie(meta);
    else if (a.titulo && !meta) {
      // título digitado sem escolher da lista: procura a série pelo nome exato
      window.Filmes.buscar(a.titulo, 'tudo').then(async res => {
        const n = window.Filmes.norm(a.titulo);
        const achou = res.find(x => x.tipo === 'serie' && window.Filmes.norm(x.titulo) === n);
        if (!achou) return;
        const det = await window.Filmes.detalhes(achou);
        const form2 = document.getElementById('f-status');
        if (form2 !== form || form.elements.titulo.value.trim() !== a.titulo) return; // a pessoa já mudou algo
        if (det && det.meta && det.meta.temporadas && det.meta.temporadas.length) mostrarSerie(det.meta);
      }).catch(() => { /* sem conexão: fica só o campo de texto */ });
    }
    // Trocou o título na mão (sem escolher da lista)? O seletor da série anterior some.
    form.elements.titulo.addEventListener('input', () => {
      if (escolhaStatus && form.elements.titulo.value.trim() !== escolhaStatus.titulo) { seletor.hidden = true; seletor.innerHTML = ''; }
    });
  }

  function htmlPessoasParaSeguir() {
    const q = Q();
    if (!q.contaLogada()) {
      return `<section class="caixa-feed">
        <h2 class="titulo-caixa">🤝 pessoas para seguir</h2>
        <p>Entre na sua conta para descobrir pessoas e seguir outros quartinhos.</p>
        <button class="btn98" data-acao="conta">👤 entrar ou criar conta</button>
      </section>`;
    }
    if (q.erroSugestoes()) {
      return `<section class="caixa-feed"><h2 class="titulo-caixa">🤝 pessoas para seguir</h2>
        <p>Não foi possível carregar sugestões agora.</p></section>`;
    }
    const seguindo = q.seguindoIds();
    const pessoas = q.pessoasParaSeguir().filter(p => !seguindo.has(p.id));
    const lista = pessoas.length ? `<ul class="lista-seguir-feed">${pessoas.map(p => `
      <li><a class="seguir-feed-perfil" href="${q.linkQuarto(p.usuario)}">
        <span class="mini-av">${q.avatar(p)}</span>
        <span><b>${esc(p.nome || p.usuario)}</b><small>@${esc(p.usuario)}${p.humor ? ` · ${esc(p.humor)}` : ''}</small></span>
      </a><button class="btn98" data-seguir="${esc(p.id)}">+ seguir</button></li>`).join('')}</ul>`
      : `<p>${q.sugestoesCarregando() ? 'procurando pessoas...' : 'não há novas pessoas para seguir por enquanto.'}</p>`;
    return `<section class="caixa-feed"><h2 class="titulo-caixa">🤝 pessoas para seguir</h2>${lista}</section>`;
  }

  // ---------- render ----------
  function render() {
    const raiz = document.getElementById('tela-feed');
    const todos = eventos();
    const total = Math.max(1, Math.ceil(todos.length / POR_PAGINA));
    pagina = limitar(pagina, 1, total);
    const posts = todos.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
    raiz.innerHTML = `
      <div class="feed-grade">
        <aside class="perfil-lateral feed-lateral">${htmlLateral()}</aside>
        <div class="feed-centro">
          ${htmlStatus()}
          ${htmlTvs()}
          ${htmlPessoasParaSeguir()}
          <section class="caixa-feed">
            <h2 class="titulo-caixa">✨ atualizações dos amigos</h2>
            <div class="posts">${posts.map(htmlPost).join('<div class="divisor" aria-hidden="true">~*~*~*~</div>')}</div>
            <nav class="paginacao" aria-label="Páginas do feed">
              <button class="btn98" data-pagina="${pagina - 1}" ${pagina <= 1 ? 'disabled' : ''}>« anteriores</button>
              <span>página ${pagina} de ${total}</span>
              <button class="btn98" data-pagina="${pagina + 1}" ${pagina >= total ? 'disabled' : ''}>mais antigas »</button>
            </nav>
          </section>
        </div>
      </div>`;
    window.U.prepararNotas(raiz);
    prepararStatus();
  }

  // ---------- ações ----------
  document.addEventListener('click', e => {
    const raiz = document.getElementById('tela-feed');
    if (!raiz || !raiz.contains(e.target)) return;
    const curtir = e.target.closest('[data-curtir]');
    if (curtir) {
      const id = curtir.dataset.curtir;
      if (curtidas[id]) delete curtidas[id]; else curtidas[id] = true;
      try { localStorage.setItem(CHAVE_CURTIDAS, JSON.stringify(curtidas)); } catch (err) { /* ignora */ }
      render();
      return;
    }
    const quero = e.target.closest('[data-quero-ver]');
    if (quero) {
      const p = eu();
      let lista = p.listas.find(l => l.nome.toLowerCase() === 'quero ver');
      if (!lista) { lista = { nome: 'Quero ver', itens: [] }; p.listas.unshift(lista); }
      lista.itens.push(quero.dataset.queroVer);
      Q().salvar();
      render();
      return;
    }
    const comentar = e.target.closest('[data-comentar]');
    if (comentar) {
      const id = comentar.dataset.comentar;
      if (abertos.has(id)) abertos.delete(id); else abertos.add(id);
      render();
      const campo = [...document.querySelectorAll('.form-comentario')].find(f => f.dataset.post === id);
      if (campo) campo.elements.texto.focus();
      return;
    }
    const editarPost = e.target.closest('[data-editar-post]');
    if (editarPost) {
      const id = editarPost.dataset.editarPost;
      if (editandoPosts.has(id)) editandoPosts.delete(id); else editandoPosts.add(id);
      render();
      return;
    }
    const editarComentario = e.target.closest('[data-editar-coment]');
    if (editarComentario) {
      const id = editarComentario.dataset.editarComent;
      editandoComentarios.add(id);
      render();
      const form = [...document.querySelectorAll('.form-editar-comentario')].find(x => x.dataset.editarComent === id);
      if (form) form.elements.texto.focus();
      return;
    }
    const cancelarComentario = e.target.closest('[data-cancelar-edicao-coment]');
    if (cancelarComentario) {
      editandoComentarios.delete(cancelarComentario.dataset.cancelarEdicaoComent);
      render();
      return;
    }
    const apagar = e.target.closest('[data-apagar-coment]');
    if (apagar) {
      if (!confirm('Apagar esse comentário?')) return;
      C().apagar(apagar.dataset.apagarComent).then(render).catch(err => alert('Não deu pra apagar: ' + err.message));
      return;
    }
    const pag = e.target.closest('[data-pagina]');
    if (pag) { pagina = Number(pag.dataset.pagina); render(); raiz.querySelector('.posts').scrollIntoView({ behavior: 'smooth' }); }
  });

  // enviar comentário
  document.addEventListener('submit', e => {
    const editarPost = e.target.closest && e.target.closest('.form-editar-post');
    if (editarPost) {
      e.preventDefault();
      const alvo = postsNaTela.get(editarPost.dataset.editarPostForm);
      if (!alvo || alvo.p.id !== 'eu') return;
      const f = alvo.f;
      const titulo = editarPost.elements.titulo.value.trim();
      if (!titulo) return;
      if (titulo !== f.titulo) {
        if (!f.id && !f.postKey) f.postKey = `${f.titulo}|${f.data}`;
        delete f.meta;
        f.titulo = titulo;
      }
      f.ano = Number(editarPost.elements.ano.value) || '';
      f.nota = Number(editarPost.elements.nota.value) || 0.5;
      const comentario = editarPost.elements.comentario.value.trim().slice(0, 280);
      if (comentario) f.comentario = comentario; else delete f.comentario;
      editandoPosts.delete(editarPost.dataset.editarPostForm);
      Q().salvar();
      render();
      return;
    }
    const editarComentario = e.target.closest && e.target.closest('.form-editar-comentario');
    if (editarComentario) {
      e.preventDefault();
      const id = editarComentario.dataset.editarComent;
      const texto = editarComentario.elements.texto.value.trim().slice(0, 300);
      if (!texto) return;
      const botao = editarComentario.querySelector('[type=submit]');
      botao.disabled = true;
      C().editar(id, texto).then(() => {
        editandoComentarios.delete(id);
        render();
      }).catch(err => {
        botao.disabled = false;
        alert('Não deu pra editar: ' + err.message);
      });
      return;
    }
    const form = e.target.closest && e.target.closest('.form-comentario');
    if (!form) return;
    e.preventDefault();
    const alvo = postsNaTela.get(form.dataset.post);
    const texto = form.elements.texto.value.trim().slice(0, 300);
    if (!alvo || !texto) return;
    const botao = form.querySelector('button');
    botao.disabled = true;
    C().enviar(alvo.p, alvo.f, texto)
      .then(() => { render(); })
      .catch(err => { botao.disabled = false; alert('Não deu pra comentar: ' + err.message); });
  });

  document.addEventListener('submit', e => {
    if (e.target.id !== 'f-status') return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const acao = e.submitter ? e.submitter.value : 'vendo';
    const titulo = String(fd.get('titulo') || '').trim();
    const detalhe = String(fd.get('detalhe') || '').trim();
    const comentario = String(fd.get('comentario') || '').trim().slice(0, 280);
    if (!titulo) return;
    const p = eu();
    // informações do filme/série: da busca, ou do que já estava na TV
    const anterior = p.assistindo && p.assistindo.titulo === titulo ? p.assistindo : null;
    const meta = escolhaStatus && escolhaStatus.titulo === titulo ? escolhaStatus.meta : (anterior && anterior.meta) || null;
    const ano = escolhaStatus && escolhaStatus.titulo === titulo ? escolhaStatus.ano : '';
    if (acao === 'terminei') {
      const novo = { id: window.U.novoId(), titulo, ano: Number(ano) || '', nota: Number(fd.get('nota')) || 3, data: hoje(), quando: new Date().toISOString() };
      if (comentario) novo.comentario = comentario;
      if (meta) novo.meta = meta;
      p.assistidos.unshift(novo);
      if (anterior) p.assistindo = { titulo: '', detalhe: '', progresso: 0 };
    } else {
      p.assistindo = { titulo, detalhe, progresso: anterior ? anterior.progresso : 0 };
      if (comentario) p.assistindo.comentario = comentario; // vale pro episódio atual
      if (meta) p.assistindo.meta = meta;
      // série: o progresso sai da temporada/episódio escolhidos
      const auto = window.Filmes.progressoCalculado(p.assistindo);
      if (auto !== null) p.assistindo.progresso = auto;
    }
    Q().salvar();
    pagina = 1;
    render();
    const msg = document.querySelector('#f-status .msg');
    if (msg) msg.textContent = acao === 'terminei' ? 'guardado na estante ✔' : 'status atualizado ✔';
  });

  return { render };
})();
