// Contas de verdade, usando o Supabase (login, perfis, recados, quem segue quem e imagens).
// Sem configuração (js/supabase-config.js vazio), o site continua no modo demonstração.
window.Conta = (function () {
  'use strict';
  const cfg = window.QUARTINHO_SUPABASE || {};
  const configurado = !!(cfg.url && cfg.chave);
  const BIBLIOTECA = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

  let sb = null;
  let sessao = null;
  const ouvintes = [];

  // Carrega a biblioteca do Supabase só quando precisa (no modo demo, nada é baixado).
  function carregarBiblioteca() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise((ok, falha) => {
      const s = document.createElement('script');
      s.src = BIBLIOTECA;
      s.onload = ok;
      s.onerror = () => falha(new Error('Não consegui carregar o Supabase (sem internet?).'));
      document.head.appendChild(s);
    });
  }

  async function iniciar() {
    if (!configurado) return null;
    await carregarBiblioteca();
    sb = window.supabase.createClient(cfg.url, cfg.chave);
    const { data } = await sb.auth.getSession();
    sessao = data.session;
    sb.auth.onAuthStateChange((evento, nova) => {
      const antes = sessao && sessao.user && sessao.user.id;
      const depois = nova && nova.user && nova.user.id;
      sessao = nova;
      if (antes !== depois) ouvintes.forEach(f => f(evento));
    });
    return usuario();
  }

  const usuario = () => (sessao && sessao.user) || null;
  const uid = () => { const u = usuario(); return u ? u.id : null; };
  const logado = () => !!uid();
  const aoMudar = f => ouvintes.push(f);

  // Mensagens de erro do Supabase em português.
  function erro(e) {
    const m = String((e && (e.message || e.error_description)) || e || '');
    const mapa = [
      [/invalid login credentials/i, 'Email ou senha errados.'],
      [/email not confirmed/i, 'Falta confirmar o email: abre o link que mandamos pra você.'],
      [/user already registered/i, 'Já existe uma conta com esse email.'],
      [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
      [/rate limit|too many/i, 'Muitas tentativas seguidas. Espera um pouquinho e tenta de novo.'],
      [/duplicate key.*usuario|perfis_usuario_key/i, 'Esse nome de usuário já tem dono.'],
      [/unable to validate email|invalid email/i, 'Esse email não parece válido.'],
      [/failed to fetch|network/i, 'Sem conexão com o servidor.']
    ];
    for (const [re, txt] of mapa) if (re.test(m)) return new Error(txt);
    return new Error(m || 'Algo deu errado.');
  }
  const checar = ({ data, error }) => { if (error) throw erro(error); return data; };

  // ---------- conta ----------
  const USUARIO_OK = /^[a-z0-9_.]{3,20}$/;
  async function usuarioLivre(nome) {
    const linha = checar(await sb.from('perfis').select('id').eq('usuario', nome).maybeSingle());
    return !linha;
  }
  // Devolve true se já entrou direto (confirmação de email desligada no Supabase).
  async function criarConta(email, senha, nomeUsuario, levarLocal) {
    if (!USUARIO_OK.test(nomeUsuario) || nomeUsuario === 'eu') throw new Error('Usuário: 3 a 20 letras minúsculas, números, _ ou ponto.');
    if (!(await usuarioLivre(nomeUsuario))) throw new Error('Esse nome de usuário já tem dono.');
    const data = checar(await sb.auth.signUp({
      email, password: senha,
      options: { data: { usuario: nomeUsuario, levarLocal: !!levarLocal }, emailRedirectTo: location.origin + location.pathname }
    }));
    return !!data.session;
  }
  async function entrar(email, senha) { checar(await sb.auth.signInWithPassword({ email, password: senha })); }
  async function sair() { checar(await sb.auth.signOut()); }

  // ---------- perfis ----------
  async function meuPerfil() {
    return checar(await sb.from('perfis').select('id, usuario, dados').eq('id', uid()).maybeSingle());
  }
  async function criarPerfil(nomeUsuario, dados) {
    return checar(await sb.from('perfis').insert({ id: uid(), usuario: nomeUsuario, dados }).select('id, usuario, dados').single());
  }
  // Salvar é "agrupado": várias mudanças seguidas viram um envio só.
  let timerSalvar = null, pendente = null;
  const aoSalvarOuvintes = [];
  function salvarPerfil(dados) {
    pendente = dados;
    clearTimeout(timerSalvar);
    timerSalvar = setTimeout(enviarPendente, 900);
  }
  async function enviarPendente() {
    if (!pendente || !logado()) return;
    const dados = pendente;
    pendente = null;
    try {
      checar(await sb.from('perfis').update({ dados, atualizado_em: new Date().toISOString() }).eq('id', uid()));
      aoSalvarOuvintes.forEach(f => f(null));
    } catch (e) {
      aoSalvarOuvintes.forEach(f => f(e));
    }
  }
  window.addEventListener('beforeunload', () => { if (pendente) enviarPendente(); });

  // Meu perfil + quem eu sigo + recados de todo mundo que aparece.
  async function carregarRede() {
    const eu = await meuPerfil();
    const seg = checar(await sb.from('seguindo').select('seguido').eq('seguidor', uid()));
    const ids = seg.map(s => s.seguido);
    const amigos = ids.length ? checar(await sb.from('perfis').select('id, usuario, dados').in('id', ids)) : [];
    const [recados, comentarios] = await Promise.all([recadosDe([uid(), ...ids]), comentariosDe([uid(), ...ids])]);
    return { eu, amigos, seguindo: new Set(ids), recados, comentarios };
  }
  async function carregarPerfil(nomeUsuario) {
    const linha = checar(await sb.from('perfis').select('id, usuario, dados').eq('usuario', nomeUsuario).maybeSingle());
    if (!linha) return null;
    return { linha, recados: await recadosDe([linha.id]) };
  }
  async function carregarSeguidores(idPerfil) {
    return checar(await sb.from('seguindo')
      .select('seguidor, quem:perfis!seguindo_seguidor_fkey(usuario, nome:dados->>nome, avatar:dados->>avatar)')
      .eq('seguido', idPerfil)
      .order('criado_em', { ascending: false })
      .limit(200));
  }
  async function sugestoes(seguindoIds, limite) {
    let consulta = sb.from('perfis')
      .select('id, usuario, nome:dados->>nome, humor:dados->>humor, avatar:dados->>avatar')
      .neq('id', uid())
      .order('criado_em', { ascending: false })
      .limit(limite || 6);
    if (seguindoIds.length) consulta = consulta.not('id', 'in', `(${seguindoIds.join(',')})`);
    return checar(await consulta);
  }
  async function registrarVisita(idPerfil) {
    return Number(checar(await sb.rpc('registrar_visita_quarto', { p_perfil: idPerfil })));
  }
  async function buscarPessoas(texto) {
    const t = String(texto || '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
    if (t.length < 2) return [];
    return checar(await sb.from('perfis')
      .select('id, usuario, nome:dados->>nome, humor:dados->>humor')
      .ilike('usuario', `%${t.replace(/_/g, '\\_')}%`)
      .neq('id', uid())
      .limit(12));
  }
  async function seguir(id) { checar(await sb.from('seguindo').insert({ seguidor: uid(), seguido: id })); }
  async function deixarDeSeguir(id) { checar(await sb.from('seguindo').delete().eq('seguidor', uid()).eq('seguido', id)); }

  // ---------- seguidores e notificações ----------
  // Quem me segue (mais recentes primeiro) e os últimos recados que outras pessoas deixaram no meu mural.
  async function novidades() {
    const [seg, rec, com] = await Promise.all([
      sb.from('seguindo')
        .select('seguidor, criado_em, quem:perfis!seguindo_seguidor_fkey(usuario, nome:dados->>nome)')
        .eq('seguido', uid()).order('criado_em', { ascending: false }).limit(200),
      sb.from('recados')
        .select('id, de, texto, criado_em, autor:perfis!recados_de_fkey(usuario)')
        .eq('para', uid()).neq('de', uid()).order('criado_em', { ascending: false }).limit(30),
      comentariosNoMeu()
    ]);
    return { seguidores: checar(seg), recados: checar(rec), comentarios: com };
  }

  // ---------- comentários nos posts do feed ----------
  // Se a tabela ainda não existe (falta rodar supabase/comentarios.sql), devolve null em vez de quebrar.
  const SEL_COMENT = 'id, dono, post, de, texto, criado_em, autor:perfis!comentarios_de_fkey(usuario, avatar:dados->>avatar)';
  async function comentariosDe(donos) {
    if (!donos.length) return [];
    const { data, error } = await sb.from('comentarios').select(SEL_COMENT)
      .in('dono', donos).order('criado_em', { ascending: true }).limit(1000);
    return error ? null : data;
  }
  async function enviarComentario(dono, post, texto) {
    return checar(await sb.from('comentarios').insert({ dono, post, de: uid(), texto }).select(SEL_COMENT).single());
  }
  async function editarComentario(id, texto) {
    return checar(await sb.from('comentarios').update({ texto }).eq('id', Number(id)).select(SEL_COMENT).single());
  }
  async function apagarComentario(id) { checar(await sb.from('comentarios').delete().eq('id', Number(id))); }
  async function comentariosNoMeu() {
    const { data, error } = await sb.from('comentarios').select(SEL_COMENT)
      .eq('dono', uid()).neq('de', uid()).order('criado_em', { ascending: false }).limit(30);
    return error ? [] : data;
  }

  // ---------- recados ----------
  async function recadosDe(ids) {
    if (!ids.length) return [];
    return checar(await sb.from('recados')
      .select('id, para, de, texto, criado_em, autor:perfis!recados_de_fkey(usuario)')
      .in('para', ids).order('criado_em', { ascending: false }).limit(300));
  }
  async function enviarRecado(para, texto) {
    return checar(await sb.from('recados').insert({ para, de: uid(), texto })
      .select('id, para, de, texto, criado_em, autor:perfis!recados_de_fkey(usuario)').single());
  }
  async function apagarRecado(id) { checar(await sb.from('recados').delete().eq('id', id)); }

  // ---------- preferências particulares ----------
  // Ficam nos dados da conta (user_metadata), que só a própria pessoa enxerga — ao contrário da
  // tabela "perfis", que é pública. Usado pra chave do TMDB acompanhar a pessoa em qualquer navegador.
  const preferencia = k => { const u = usuario(); return (u && u.user_metadata && u.user_metadata[k]) || null; };
  async function guardarPreferencia(k, v) {
    if (!logado()) return;
    const data = checar(await sb.auth.updateUser({ data: { [k]: v || null } }));
    if (data && data.user && sessao) sessao.user = data.user;
  }

  // ---------- imagens ----------
  // Recebe uma imagem em "data URL" (o que o site gera ao reduzir a foto) e devolve o link público.
  async function enviarImagem(dataUrl) {
    const m = /^data:(image\/(png|jpeg|gif|webp));base64,(.+)$/.exec(String(dataUrl));
    if (!m) return dataUrl;
    const bin = atob(m[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
    const caminho = `${uid()}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.${ext}`;
    checar(await sb.storage.from('imagens').upload(caminho, new Blob([bytes], { type: m[1] }), { contentType: m[1], upsert: false }));
    return sb.storage.from('imagens').getPublicUrl(caminho).data.publicUrl;
  }

  return {
    configurado, iniciar, usuario, uid, logado, aoMudar,
    usuarioLivre, criarConta, entrar, sair,
    meuPerfil, criarPerfil, salvarPerfil, aoSalvar: f => aoSalvarOuvintes.push(f),
    carregarRede, carregarPerfil, carregarSeguidores, buscarPessoas, sugestoes, registrarVisita, seguir, deixarDeSeguir, novidades,
    comentariosDe, enviarComentario, editarComentario, apagarComentario,
    enviarRecado, apagarRecado, enviarImagem, preferencia, guardarPreferencia,
    USUARIO_OK
  };
})();
