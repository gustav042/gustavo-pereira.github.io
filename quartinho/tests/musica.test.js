const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('cada bichinho toca seu efeito sem interromper a música e limita cliques repetidos', () => {
  const osciladores = [];
  let audio;
  const parametro = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  class No {
    constructor() { this.gain = parametro(); this.frequency = parametro(); this.Q = parametro(); }
    connect() { return this; }
    start() {}
    stop() {}
    disconnect() {}
  }
  class AudioContext {
    constructor() { audio = this; this.sampleRate = 10; this.currentTime = 0; this.destination = {}; }
    createGain() { return new No(); }
    createBuffer() { return { getChannelData: () => new Float32Array(10) }; }
    createOscillator() { const n = new No(); osciladores.push(n); return n; }
    createBiquadFilter() { return new No(); }
    createBufferSource() { return new No(); }
    resume() { return Promise.resolve(); }
  }
  const ctx = { window: { AudioContext }, setInterval: () => 1, clearInterval() {}, setTimeout() {}, console, Math };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'musica.js'), 'utf8'), ctx);
  const musica = ctx.window.Musica;
  musica.tocar('domingo');
  for (const tipo of ['gato', 'cachorro', 'coelho', 'hamster']) {
    audio.currentTime += 1;
    const antes = osciladores.length;
    musica.somPet(tipo);
    assert(osciladores.length > antes);
    assert.equal(musica.tocando(), 'domingo');
    const depois = osciladores.length;
    musica.somPet(tipo);
    assert.equal(osciladores.length, depois);
  }
  const antes = osciladores.length;
  musica.somPet('nenhum');
  assert.equal(osciladores.length, antes);
});
