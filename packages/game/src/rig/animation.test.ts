import { describe, expect, it } from 'vitest';
import { movePhaseTime, sampleClip, type Clip } from './animation';

describe('movePhaseTime', () => {
  it('o 1º frame ativo é exatamente t = 1 e o último é t = 2', () => {
    for (const [s, a, r] of [
      [4, 3, 7],
      [9, 4, 18],
      [3, 12, 12],
      [10, 1, 16],
      [0, 4, 16],
    ] as const) {
      expect(movePhaseTime(s + 1, s, a, r)).toBe(1);
      expect(movePhaseTime(s + a, s, a, r)).toBe(a === 1 ? 1 : 2);
      expect(movePhaseTime(s + a + r, s, a, r)).toBe(3);
    }
  });

  it('o startup fica entre 0 e 1, sem chegar no golpe', () => {
    expect(movePhaseTime(1, 4, 3, 7)).toBeGreaterThan(0);
    expect(movePhaseTime(4, 4, 3, 7)).toBeLessThan(1);
  });
});

describe('sampleClip', () => {
  const clip: Clip = {
    timing: 'loop',
    length: 20,
    keys: [
      { t: 0, rot: { torso: 0 }, handNear: 'open' },
      { t: 10, rot: { torso: 10 }, y: 4, expression: 'hurt' },
    ],
  };

  it('interpola entre as chaves e volta para a primeira no loop', () => {
    expect(sampleClip(clip, 5).rot.torso).toBe(5);
    expect(sampleClip(clip, 10).rot.torso).toBe(10);
    expect(sampleClip(clip, 15).rot.torso).toBe(5);
    expect(sampleClip(clip, 25).rot.torso).toBe(5);
    expect(sampleClip(clip, 5).y).toBe(2);
  });

  it('expressão e mão trocam em degrau e ficam até outra chave mudar', () => {
    expect(sampleClip(clip, 9).expression).toBe('normal');
    expect(sampleClip(clip, 12).expression).toBe('hurt');
    expect(sampleClip(clip, 12).handNear).toBe('open');
    expect(sampleClip(clip, 12).handFar).toBe('fist');
  });

  it('a peça na mão aparece e é guardada em degrau', () => {
    const c: Clip = {
      timing: 'move',
      keys: [
        { t: 0, rot: {} },
        { t: 0.4, rot: {}, prop: 'fx_gun' },
        { t: 2.6, rot: {}, prop: null },
        { t: 3, rot: {} },
      ],
    };
    expect(sampleClip(c, 0.2).prop).toBeNull();
    expect(sampleClip(c, 1).prop).toBe('fx_gun');
    expect(sampleClip(c, 2.8).prop).toBeNull();
  });

  it('o giro da peça na mão é interpolado (sem valor = 0)', () => {
    const c: Clip = {
      timing: 'once',
      length: 20,
      keys: [
        { t: 0, rot: {}, prop: 'fx_wrench' },
        { t: 10, rot: {}, propSpin: 720 },
        { t: 20, rot: {} },
      ],
    };
    expect(sampleClip(c, 0).propSpin).toBe(0);
    expect(sampleClip(c, 5).propSpin).toBe(360);
    expect(sampleClip(c, 10).propSpin).toBe(720);
    expect(sampleClip(c, 15).propSpin).toBe(360);
  });

  it('clipe "once" para na última chave', () => {
    const once: Clip = { ...clip, timing: 'once' };
    expect(sampleClip(once, 50).rot.torso).toBe(10);
  });

  it('osso que falta numa chave vale 0', () => {
    const c: Clip = {
      timing: 'move',
      keys: [
        { t: 0, rot: { head: 20 } },
        { t: 1, rot: {} },
      ],
    };
    expect(sampleClip(c, 0.5).rot.head).toBe(10);
  });
});
