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
