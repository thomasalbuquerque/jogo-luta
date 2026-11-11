import { describe, expect, it } from 'vitest';
import { renderSong, songSeconds, SONGS } from './musicSynth';
import { renderKoYell, renderSfx, SFX_NAMES } from './sfxSynth';

const SR = 16000;

function peak(buf: Float32Array): number {
  let max = 0;
  for (const v of buf) {
    expect(Number.isFinite(v)).toBe(true);
    max = Math.max(max, Math.abs(v));
  }
  return max;
}

describe('efeitos sonoros gerados', () => {
  it.each(SFX_NAMES)('%s: curto, audível e sem estourar', (name) => {
    const buf = renderSfx(name, SR);
    expect(buf.length).toBeGreaterThan(SR * 0.05);
    expect(buf.length).toBeLessThan(SR * 2);
    const p = peak(buf);
    expect(p).toBeGreaterThan(0.5);
    expect(p).toBeLessThanOrEqual(1);
  });

  it('sai sempre igual (RNG com seed)', () => {
    expect(renderSfx('hit_heavy', SR)).toEqual(renderSfx('hit_heavy', SR));
  });

  it('golpe forte dura mais que golpe fraco', () => {
    expect(renderSfx('hit_heavy', SR).length).toBeGreaterThan(renderSfx('hit_light', SR).length);
  });

  it('o grito de KO muda com o personagem', () => {
    const a = renderKoYell('schummaki', SR);
    const b = renderKoYell('joao-frango', SR);
    expect(peak(a)).toBeLessThanOrEqual(1);
    expect(a).not.toEqual(b);
  });
});

describe('música gerada', () => {
  it.each(Object.entries(SONGS))('%s: loop com a duração exata dos compassos', (_name, song) => {
    const buf = renderSong(song, 8000);
    expect(buf.length).toBe(Math.round(songSeconds(song) * 8000));
    expect(peak(buf)).toBeGreaterThan(0.5);
  });

  it('os padrões têm 16 passos', () => {
    for (const song of Object.values(SONGS)) {
      for (const p of [song.kick, song.snare, song.hat, song.bass, song.fill ?? song.snare]) {
        expect(p).toHaveLength(16);
      }
    }
  });
});
