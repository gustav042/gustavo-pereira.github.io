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
  const estrelas = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  return { esc, urlSegura, ehUpload, imagemParaPoster, corValida, limitar, hash, corDe, hoje, fmtData, estrelas };
})();
