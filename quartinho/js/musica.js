// Rádio do quarto: músicas chiptune originais, tocadas com a Web Audio API (sem arquivos de áudio).
// Cada faixa tem vozes; cada voz é uma sequência de colcheias ("-" = pausa, "x" = batida).
window.Musica = (function () {
  'use strict';

  const seq = s => s.trim().split(/\s+/).filter(t => t !== '|').map(t => t === '-' ? null : t);

  const FAIXAS = {
    domingo: {
      nome: 'Tarde de domingo (lo-fi)', bpm: 76,
      vozes: [
        { tipo: 'triangle', vol: 0.07, dur: 2, notas: seq('C4 E4 G4 B4 G4 E4 C4 E4 | A3 C4 E4 G4 E4 C4 A3 C4 | D4 F4 A4 C5 A4 F4 D4 F4 | G3 B3 D4 F4 D4 B3 G3 B3') },
        { tipo: 'sine', vol: 0.16, dur: 7, notas: seq('C2 - - - - - - - | A1 - - - - - - - | D2 - - - - - - - | G1 - - - - - - -') },
        { tipo: 'square', vol: 0.022, dur: 2, notas: seq('- - E5 - D5 - C5 - | - - - - E5 - G5 - | - - F5 - E5 - D5 - | - - - - B4 - - -') },
        { tipo: 'chimbal', vol: 0.03, notas: seq('- - x - - - x -') },
        { tipo: 'bumbo', vol: 0.25, notas: seq('x - - - - x - -') }
      ]
    },
    fliperama: {
      nome: 'Fliperama (8-bit)', bpm: 150,
      vozes: [
        { tipo: 'square', vol: 0.045, dur: 1, notas: seq('C5 E5 G5 E5 C5 E5 G5 C6 | A4 C5 E5 C5 A4 C5 E5 A5 | F4 A4 C5 A4 F4 A4 C5 F5 | G4 B4 D5 B4 G4 B4 D5 G5') },
        { tipo: 'triangle', vol: 0.13, dur: 1, notas: seq('C3 - C3 - C3 - C3 G2 | A2 - A2 - A2 - A2 E2 | F2 - F2 - F2 - F2 C3 | G2 - G2 - G2 - B2 D3') },
        { tipo: 'bumbo', vol: 0.3, notas: seq('x - - - x - - -') },
        { tipo: 'chimbal', vol: 0.025, notas: seq('- x') }
      ]
    },
    chuva: {
      nome: 'Chuva na janela', bpm: 60, chuva: true,
      vozes: [
        { tipo: 'sine', vol: 0.06, dur: 8, notas: seq('A3 - - - - - - - | F3 - - - - - - - | C4 - - - - - - - | G3 - - - - - - -') },
        { tipo: 'sine', vol: 0.04, dur: 8, notas: seq('E4 - - - - - - - | C4 - - - - - - - | G4 - - - - - - - | D4 - - - - - - -') },
        { tipo: 'sine', vol: 0.035, dur: 2, notas: seq('- - - E5 - - - - | - - C5 - - - - A5 | - - - - G5 - - - | - D5 - - - - - -') }
      ]
    },
    caixinha: {
      nome: 'Caixinha de música', bpm: 110,
      vozes: [
        { tipo: 'sine', vol: 0.07, dur: 3, notas: seq('E5 - G5 - C6 - | B5 - G5 - D5 - | C5 - E5 - A5 - | G5 - - - - - | F5 - A5 - C6 - | E5 - G5 - C6 - | D5 - F5 - B5 - | C6 - - - - -') },
        { tipo: 'triangle', vol: 0.05, dur: 5, notas: seq('C4 - - - - - | G3 - - - - - | A3 - - - - - | E3 - - - - - | F3 - - - - - | C4 - - - - - | G3 - - - - - | C4 - - - - -') }
      ]
    }
  };

  let ctx = null, volumeGeral = null, sessao = null, timer = null, chuvaFonte = null;
  let faixa = null, passo = 0, proximo = 0, volume = 0.6, bufRuido = null;
  const ouvintes = [];

  function freq(n) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
    if (!m) return 440;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return 440 * Math.pow(2, ((Number(m[3]) + 1) * 12 + base - 69) / 12);
  }

  function iniciarAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    volumeGeral = ctx.createGain();
    volumeGeral.gain.value = volume;
    volumeGeral.connect(ctx.destination);
    bufRuido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = bufRuido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tom(t, f, dur, tipo, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(sessao);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function chimbal(t, vol) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = bufRuido; f.type = 'highpass'; f.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f).connect(g).connect(sessao);
    s.start(t, Math.random() * 0.5); s.stop(t + 0.07);
  }
  function bumbo(t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(sessao);
    o.start(t); o.stop(t + 0.25);
  }

  function agendar() {
    const f = FAIXAS[faixa];
    if (!f) return;
    const dPasso = 60 / f.bpm / 2;
    while (proximo < ctx.currentTime + 0.15) {
      for (const v of f.vozes) {
        const n = v.notas[passo % v.notas.length];
        if (!n) continue;
        if (v.tipo === 'bumbo') bumbo(proximo, v.vol);
        else if (v.tipo === 'chimbal') chimbal(proximo, v.vol);
        else tom(proximo, freq(n), dPasso * (v.dur || 1), v.tipo, v.vol);
      }
      proximo += dPasso;
      passo++;
    }
  }

  function ligarChuva() {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = bufRuido; s.loop = true;
    f.type = 'lowpass'; f.frequency.value = 1400;
    g.gain.value = 0.07;
    s.connect(f).connect(g).connect(sessao);
    s.start();
    chuvaFonte = s;
  }

  function pararInterno() {
    clearInterval(timer); timer = null;
    if (chuvaFonte) { try { chuvaFonte.stop(); } catch (e) { /* já parou */ } chuvaFonte = null; }
    if (sessao) {
      const velha = sessao;
      velha.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      setTimeout(() => velha.disconnect(), 400);
      sessao = null;
    }
  }

  function avisar() { ouvintes.forEach(fn => fn(faixa)); }

  function tocar(id) {
    if (!FAIXAS[id]) { parar(); return; }
    iniciarAudio();
    ctx.resume();
    pararInterno();
    sessao = ctx.createGain();
    sessao.connect(volumeGeral);
    faixa = id; passo = 0; proximo = ctx.currentTime + 0.06;
    if (FAIXAS[id].chuva) ligarChuva();
    agendar();
    timer = setInterval(agendar, 25);
    avisar();
  }
  function parar() {
    if (ctx) pararInterno();
    faixa = null;
    avisar();
  }
  function definirVolume(v) {
    volume = v;
    if (volumeGeral) volumeGeral.gain.value = v;
  }

  let ultimoSomPet = -Infinity;
  function somPet(tipo) {
    const sons = {
      gato: [[0, 0.32, 620, 880, 480, 'sawtooth']],
      cachorro: [[0, 0.13, 420, 220, 150, 'triangle'], [0.2, 0.13, 390, 200, 140, 'triangle']],
      coelho: [[0, 0.10, 620, 780, 650, 'sine'], [0.15, 0.10, 700, 840, 660, 'sine']],
      hamster: [[0, 0.09, 1300, 1800, 1200, 'sine'], [0.12, 0.08, 1500, 2000, 1400, 'sine']]
    };
    if (!sons[tipo]) return;
    iniciarAudio();
    const retomada = ctx.resume();
    const agora = ctx.currentTime;
    if (agora - ultimoSomPet < 0.5) return retomada;
    ultimoSomPet = agora;
    for (const [atraso, duracao, inicio, meio, fim, onda] of sons[tipo]) {
      const t = agora + atraso, osc = ctx.createOscillator(), ganho = ctx.createGain();
      osc.type = onda;
      osc.frequency.setValueAtTime(inicio, t);
      osc.frequency.exponentialRampToValueAtTime(meio, t + duracao * 0.35);
      osc.frequency.exponentialRampToValueAtTime(fim, t + duracao);
      ganho.gain.setValueAtTime(0.0001, t);
      ganho.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.0001, t + duracao);
      osc.connect(ganho).connect(volumeGeral);
      osc.start(t); osc.stop(t + duracao + 0.01);
    }
    return retomada;
  }

  // ================= som ambiente da TV =================
  // Chiado de TV de tubo.
  let tv = null;

  function ligarTV() {
    iniciarAudio();
    ctx.resume();
    if (tv) return;
    const saida = ctx.createGain();
    saida.gain.value = 0;
    saida.gain.setTargetAtTime(1, ctx.currentTime, 0.4);
    saida.connect(volumeGeral);
    const nivel = ctx.createGain();
    nivel.gain.value = 1;
    nivel.connect(saida);

    const chiado = ctx.createBufferSource();
    chiado.buffer = bufRuido; chiado.loop = true;
    const hp = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), gChiado = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 3000;
    lp.type = 'lowpass'; lp.frequency.value = 9000;
    gChiado.gain.value = 0.012;
    chiado.connect(hp).connect(lp).connect(gChiado).connect(nivel);
    chiado.start();

    tv = { saida, nivel, chiado };
    avisar();
  }

  function desligarTV() {
    if (!tv) return;
    const velho = tv;
    tv = null;
    velho.saida.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    setTimeout(() => {
      try { velho.chiado.stop(); } catch (e) { /* já parou */ }
      velho.saida.disconnect();
    }, 600);
    avisar();
  }

  // Abaixa a TV quando a música está tocando (0 a 1).
  function nivelTV(v) {
    if (tv) tv.nivel.gain.setTargetAtTime(v, ctx.currentTime, 0.2);
  }

  return {
    tv: { ligar: ligarTV, desligar: desligarTV, ligada: () => !!tv, nivel: nivelTV },
    FAIXAS,
    tocar,
    parar,
    somPet,
    tocando: () => faixa,
    definirVolume,
    volume: () => volume,
    aoMudar: fn => ouvintes.push(fn)
  };
})();
