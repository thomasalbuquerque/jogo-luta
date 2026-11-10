import { describe, expect, it } from 'vitest';
import { cloneState, createGame, stepGame } from './game';
import { Button } from './input';

describe('game', () => {
  it('cria 2 lutadores no chão do mapa de teste, virados um para o outro', () => {
    const g = createGame();
    expect(g.fighters).toHaveLength(2);
    for (let i = 0; i < 3; i++) stepGame(g, [0, 0]);
    expect(g.tick).toBe(3);
    expect(g.fighters.every((f) => f.grounded)).toBe(true);
    expect(g.fighters[0]?.facing).toBe(1);
    expect(g.fighters[1]?.facing).toBe(-1);
  });

  it('um pulo cheio alcança a plataforma atravessável', () => {
    const g = createGame();
    stepGame(g, [0, 0]); // primeiro tick: encosta no chão
    for (let i = 0; i < 30; i++) stepGame(g, [Button.JUMP, 0]);
    for (let i = 0; i < 60; i++) stepGame(g, [0, 0]);
    const f = g.fighters[0];
    expect(f?.grounded).toBe(true);
    expect(f?.onPlatform).toBe(true);
  });

  it('quem cai do mapa volta ao spawn', () => {
    const g = createGame();
    for (let i = 0; i < 600; i++) stepGame(g, [Button.LEFT, 0]);
    const f = g.fighters[0];
    expect(f).toBeDefined();
    // andou para fora, caiu, voltou e andou de novo: sempre dentro da blast zone
    expect(Math.abs(f?.x ?? 0)).toBeLessThan(130_000);
  });

  it('é determinístico: mesmos inputs, mesmo estado', () => {
    const inputs: [number, number][] = [];
    let seed = 12345;
    for (let i = 0; i < 2000; i++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      inputs.push([seed & 0xff, (seed >> 8) & 0xff]);
    }
    const a = createGame();
    const b = createGame();
    for (const inp of inputs) stepGame(a, inp);
    for (const inp of inputs) stepGame(b, inp);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // tudo inteiro: nada de fração no estado
    for (const f of a.fighters) {
      for (const v of [f.x, f.y, f.vx, f.vy]) expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('cloneState gera cópia independente', () => {
    const g = createGame();
    const snap = cloneState(g);
    stepGame(g, [Button.RIGHT, 0]);
    expect(snap.tick).toBe(0);
    expect(snap.fighters[0]?.x).not.toBe(g.fighters[0]?.x);
  });
});
