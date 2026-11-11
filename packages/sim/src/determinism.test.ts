import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS } from './characters';
import { createGame, stepGame, type GameState } from './game';
import { cloneState, hashState, restoreState } from './snapshot';
import { RandomInputs } from './testing';

const TICKS = 10_000;
/** Sem fim de luta: os 10 mil ticks são de luta de verdade. */
const RULES = { stocks: 999, timeLimitTicks: 0 };

function newGame(seed: number, characters: readonly string[] = PLAYABLE_CHARACTERS): GameState {
  return createGame({ characters: [...characters], rules: RULES, seed });
}

/** Roda a luta e devolve o hash do estado a cada tick. */
function play(seed: number, characters?: readonly string[]): { hashes: number[]; game: GameState } {
  const game = newGame(seed, characters);
  const inputs = new RandomInputs(seed);
  const hashes: number[] = [];
  for (let t = 0; t < TICKS; t++) {
    stepGame(game, inputs.next());
    hashes.push(hashState(game));
  }
  return { hashes, game };
}

/** Todo número do estado: inteiro seguro e nunca -0 (que o JSON transforma em 0). */
function badNumbers(value: unknown, path = 'state'): string[] {
  if (typeof value === 'number') {
    const ok = Number.isSafeInteger(value) && !Object.is(value, -0);
    return ok ? [] : [`${path} = ${String(value)}`];
  }
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, item]) => badNumbers(item, `${path}.${key}`));
}

describe('determinismo', () => {
  it('10 mil ticks com inputs aleatórios dão o mesmo hash nas duas vezes', () => {
    const a = play(2024);
    const b = play(2024);
    expect(a.hashes.at(-1)).toBe(b.hashes.at(-1));
    // igual tick a tick, não só no fim
    expect(a.hashes.findIndex((h, t) => h !== b.hashes[t])).toBe(-1);
    expect(a.game).toEqual(b.game);
  });

  it('a luta do teste tem de tudo: golpes, KOs e projéteis', () => {
    const game = newGame(2024);
    const inputs = new RandomInputs(2024);
    const seen = new Set<string>();
    let projectiles = 0;
    for (let t = 0; t < TICKS; t++) {
      stepGame(game, inputs.next());
      for (const e of game.events) seen.add(e.type === 'hit' ? `hit:${e.kind}` : e.type);
      projectiles = Math.max(projectiles, game.projectiles.length);
    }
    expect([...seen]).toEqual(expect.arrayContaining(['hit:hit', 'ko', 'respawn', 'action']));
    expect(projectiles).toBeGreaterThan(0);
    expect(game.fighters.every((f) => f.stocks < RULES.stocks)).toBe(true);
  });

  it('inputs diferentes dão lutas diferentes (o hash não é sempre igual)', () => {
    const a = play(1);
    const b = play(2);
    expect(a.hashes.at(-1)).not.toBe(b.hashes.at(-1));
  });

  it.each([
    ['jogadores trocados', [...PLAYABLE_CHARACTERS].reverse()],
    ['espelho', [PLAYABLE_CHARACTERS[0] ?? '', PLAYABLE_CHARACTERS[0] ?? '']],
  ])('vale para outras combinações de personagens: %s', (_name, characters) => {
    expect(play(77, characters).hashes.at(-1)).toBe(play(77, characters).hashes.at(-1));
  });

  it('o estado só tem inteiros, do começo ao fim', () => {
    const game = newGame(31337);
    const inputs = new RandomInputs(31337);
    expect(badNumbers(game)).toEqual([]);
    for (let t = 0; t < TICKS; t++) {
      stepGame(game, inputs.next());
      const bad = badNumbers(game);
      if (bad.length > 0) throw new Error(`tick ${String(t)}: ${bad.join(', ')}`);
    }
  });

  it('voltar a um snapshot e re-simular chega ao mesmo estado (base do rollback)', () => {
    const reference = play(555).hashes;
    const game = newGame(555);
    const inputs = new RandomInputs(555);
    const tape = Array.from({ length: TICKS }, () => inputs.next());
    // a cada 7 ticks: guarda, avança 7, volta e refaz
    for (let t = 0; t < TICKS; t += 7) {
      const snapshot = cloneState(game);
      const end = Math.min(t + 7, TICKS);
      for (let i = t; i < end; i++) stepGame(game, tape[i] ?? []);
      restoreState(game, snapshot);
      for (let i = t; i < end; i++) stepGame(game, tape[i] ?? []);
      expect(hashState(game)).toBe(reference[end - 1]);
    }
  });
});
