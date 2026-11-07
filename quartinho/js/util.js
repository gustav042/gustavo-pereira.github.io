// Funções pequenas usadas em vários arquivos.
window.U = (function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  // Só aceita imagens http(s), da pasta assets/ do projeto, ou enviadas pela pessoa (data URL de imagem).
  function urlSegura(u) {
    u = String(u || '').trim();
    if (/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(u)) return u;
    return /^https?:\/\//i.test(u) || /^assets\/[\w\-./]+$/i.test(u) ? u : '';
  }
  const ehUpload = u => /^data:image\//.test(String(u || ''));

  // Lê um arquivo de imagem, recorta no formato 2:3 (pôster) e reduz pra caber no navegador.
  function imagemParaPoster(arquivo, largura = 160, altura = 240) {
    return new Promise((ok, falha) => {
      if (!arquivo || !/^image\//.test(arquivo.type)) return falha(new Error('Esse arquivo não é uma imagem.'));
      if (arquivo.size > 15 * 1024 * 1024) return falha(new Error('Imagem grande demais (máx. 15 MB).'));
      const url = URL.createObjectURL(arquivo);
      const img = new Image();
      img.onload = () => {
        const escala = Math.max(largura / img.width, altura / img.height);
        const w = largura / escala, h = altura / escala;
        const canvas = document.createElement('canvas');
        canvas.width = largura; canvas.height = altura;
        const g = canvas.getContext('2d');
        g.fillStyle = '#000';
        g.fillRect(0, 0, largura, altura);
        g.drawImage(img, (img.width - w) / 2, (img.height - h) / 2, w, h, 0, 0, largura, altura);
        URL.revokeObjectURL(url);
        ok(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); falha(new Error('Não consegui abrir essa imagem.')); };
      img.src = url;
    });
  }
  const corValida = (c, padrao) => /^#[0-9a-f]{6}$/i.test(c || '') ? c : padrao;
  const limitar = (n, min, max) => Math.min(max, Math.max(min, n));

  function hash(str) {
    let h = 0;
    for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
  }
  const CORES_LOMBADA = ['#c0392b', '#2e86de', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#d35400', '#e84393', '#34495e', '#e1b12c'];
  const corDe = titulo => CORES_LOMBADA[hash(titulo) % CORES_LOMBADA.length];

  function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmtData(iso) {
    const [a, m, d] = String(iso || '').split('-');
    return d ? `${d}/${m}/${a}` : '';
  }
  const normalizarNota = n => {
    const valor = Number(n);
    return Math.round(Math.max(0.5, Math.min(5, Number.isFinite(valor) ? valor : 3)) * 2) / 2;
  };
  const textoNota = n => `${Number(n).toLocaleString('pt-BR')} ${Number(n) === 1 ? 'estrela' : 'estrelas'}`;
  function campoNota(n = 3) {
    const nota = normalizarNota(n);
    return `<div class="nota-interativa" data-nota-control role="slider" tabindex="0"
        aria-label="Nota do filme" aria-valuemin="0.5" aria-valuemax="5"
        aria-valuenow="${nota}" aria-valuetext="${textoNota(nota)}">
      <input type="hidden" name="nota" value="${nota}">
      ${Array.from({ length: 5 }, (_, i) => `<span class="nota-alvo" data-nota-indice="${i + 1}"><span class="nota-estrela" aria-hidden="true">★</span></span>`).join('')}
      <output>${textoNota(nota)}</output>
    </div>`;
  }
  function prepararNotas(raiz) {
    if (!raiz) return;
    raiz.querySelectorAll('[data-nota-control]:not([data-nota-pronto])').forEach(controle => {
      controle.dataset.notaPronto = '1';
      const entrada = controle.querySelector('input[name="nota"]');
      const alvos = [...controle.querySelectorAll('[data-nota-indice]')];
      const desenhar = (valor, previa = false) => {
        const n = normalizarNota(valor);
        const efetiva = previa ? n : Number(entrada.value);
        controle.setAttribute('aria-valuenow', efetiva);
        controle.setAttribute('aria-valuetext', textoNota(efetiva));
        controle.querySelector('output').textContent = textoNota(efetiva);
        alvos.forEach((alvo, i) => {
          const estado = efetiva >= i + 1 ? 'cheia' : efetiva >= i + 0.5 ? 'metade' : 'vazia';
          alvo.querySelector('.nota-estrela').className = `nota-estrela estrela-${estado}`;
        });
      };
      const valorPonteiro = (e, alvo) => {
        const ret = alvo.getBoundingClientRect();
        return Number(alvo.dataset.notaIndice) - (e.clientX < ret.left + ret.width / 2 ? 0.5 : 0);
      };
      controle.addEventListener('pointermove', e => {
        const alvo = e.target.closest('[data-nota-indice]');
        if (alvo) desenhar(valorPonteiro(e, alvo), true);
      });
      controle.addEventListener('pointerleave', () => desenhar(entrada.value));
      controle.addEventListener('click', e => {
        const alvo = e.target.closest('[data-nota-indice]');
        if (!alvo) return;
        entrada.value = String(valorPonteiro(e, alvo));
        desenhar(entrada.value);
      });
      controle.addEventListener('keydown', e => {
        let n = Number(entrada.value);
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n += 0.5;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n -= 0.5;
        else if (e.key === 'Home') n = 0.5;
        else if (e.key === 'End') n = 5;
        else return;
        e.preventDefault();
        entrada.value = String(normalizarNota(n));
        desenhar(entrada.value);
      });
      desenhar(entrada.value);
    });
  }
  const estrelas = n => {
    const nota = Math.max(0, Math.min(5, Number(n) || 0));
    return Array.from({ length: 5 }, (_, i) => {
      const estado = nota >= i + 1 ? 'cheia' : nota >= i + 0.5 ? 'metade' : 'vazia';
      return `<span class="estrela estrela-${estado}" aria-hidden="true">★</span>`;
    }).join('');
  };

  // id curtinho e único (pra filmes da estante, comentários...)
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  return {
    esc, urlSegura, ehUpload, imagemParaPoster, corValida, limitar, hash, corDe, hoje, fmtData,
    estrelas, campoNota, prepararNotas, novoId
  };
})();
