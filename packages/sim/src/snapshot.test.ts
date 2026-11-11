import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS } from './characters';
import { createGame, stepGame, type GameState } from './game';
import { cloneState, deserializeState, hashState, restoreState, serializeState } from './snapshot';
import { RandomInputs } from './testing';

const RULES = { stocks: 99, timeLimitTicks: 0 };

/** Luta no meio da ação: dano, projéteis e eventos no estado. */
function busyGame(ticks = 900): { game: GameState; inputs: RandomInputs } {
  const game = createGame({ characters: [...PLAYABLE_CHARACTERS], rules: RULES, seed: 7 });
  const inputs = new RandomInputs(42);
  for (let t = 0; t < ticks; t++) stepGame(game, inputs.next());
  return { game, inputs };
}

/** Avança até o estado ter o que a condição pede (para os testes não dependerem da sorte). */
function runUntil(game: GameState, inputs: RandomInputs, ok: (g: GameState) => boolean): void {
  for (let t = 0; t < 20000 && !ok(game); t++) stepGame(game, inputs.next());
  expect(ok(game)).toBe(true);
}

const withProjectileAndEvent = (g: GameState): boolean =>
  g.projectiles.length > 0 && g.events.length > 0;

describe('cloneState', () => {
  it('copia tudo, igual à cópia por JSON', () => {
    const { game, inputs } = busyGame();
    runUntil(game, inputs, withProjectileAndEvent);
    expect(cloneState(game)).toEqual(JSON.parse(JSON.stringify(game)));
  });

  it('a cópia não divide lutadores, projéteis nem eventos com o original', () => {
    const { game, inputs } = busyGame();
    runUntil(game, inputs, withProjectileAndEvent);
    const copy = cloneState(game);
    expect(copy.rules).not.toBe(game.rules);
    expect(copy.fighters).not.toBe(game.fighters);
    expect(copy.fighters[0]).not.toBe(game.fighters[0]);
    expect(copy.projectiles[0]).not.toBe(game.projectiles[0]);
    expect(copy.projectiles[0]?.hit).not.toBe(game.projectiles[0]?.hit);
    expect(copy.events[0]).not.toBe(game.events[0]);
  });

  it('avançar o original não muda a cópia', () => {
    const { game, inputs } = busyGame();
    const copy = cloneState(game);
    const before = serializeState(copy);
    for (let t = 0; t < 300; t++) stepGame(game, inputs.next());
    expect(serializeState(copy)).toBe(before);
  });
});

describe('restoreState', () => {
  it('volta no tempo e a luta segue igual com os mesmos inputs', () => {
    const { game, inputs } = busyGame();
    const snapshot = cloneState(game);
    const tape = Array.from({ length: 600 }, () => inputs.next());

    for (const frame of tape) stepGame(game, frame);
    const first = hashState(game);

    restoreState(game, snapshot);
    expect(hashState(game)).toBe(hashState(snapshot));
    for (const frame of tape) stepGame(game, frame);
    expect(hashState(game)).toBe(first);
  });

  it('mantém o mesmo objeto de estado e não gasta o snapshot', () => {
    const { game, inputs } = busyGame();
    const same = game;
    const snapshot = cloneState(game);
    const hash = hashState(snapshot);
    for (let i = 0; i < 3; i++) {
      for (let t = 0; t < 120; t++) stepGame(game, inputs.next());
      restoreState(game, snapshot);
      expect(game).toBe(same);
      expect(hashState(game)).toBe(hash);
      expect(hashState(snapshot)).toBe(hash);
    }
  });
});

describe('serializeState', () => {
  it('ida e volta por texto dá o mesmo estado e a luta segue igual', () => {
    const { game, inputs } = busyGame();
    const loaded = deserializeState(serializeState(game));
    expect(loaded).toEqual(cloneState(game));
    expect(hashState(loaded)).toBe(hashState(game));
    for (let t = 0; t < 600; t++) {
      const frame = inputs.next();
      stepGame(game, frame);
      stepGame(loaded, frame);
    }
    expect(hashState(loaded)).toBe(hashState(game));
  });
});

describe('hashState', () => {
  it('é um inteiro de 32 bits sem sinal e não muda sem o estado mudar', () => {
    const { game } = busyGame();
    const h = hashState(game);
    expect(Number.isInteger(h) && h >= 0 && h <= 0xffffffff).toBe(true);
    expect(hashState(game)).toBe(h);
    expect(hashState(cloneState(game))).toBe(h);
  });

  it('muda com qualquer diferença pequena', () => {
    const { game } = busyGame();
    const h = hashState(game);
    const first = (g: GameState) => {
      const f = g.fighters[0];
      if (!f) throw new Error('sem lutador');
      return f;
    };
    const edits: ((g: GameState) => void)[] = [
      (g) => {
        g.tick++;
      },
      (g) => {
        g.rng++;
      },
      (g) => {
        g.timeLeft--;
      },
      (g) => {
        g.suddenDeath = !g.suddenDeath;
      },
      (g) => {
        g.winner = 0;
      },
      (g) => {
        first(g).x += 1;
      },
      (g) => {
        first(g).facing = first(g).facing === 1 ? -1 : 1;
      },
      (g) => {
        first(g).state = first(g).state === 'idle' ? 'run' : 'idle';
      },
      (g) => {
        first(g).grounded = !first(g).grounded;
      },
      (g) => {
        first(g).prevInput ^= 1;
      },
    ];
    for (const edit of edits) {
      const copy = cloneState(game);
      edit(copy);
      expect(hashState(copy)).not.toBe(h);
    }
  });

  it('distingue valores trocados entre campos e números grandes', () => {
    const a = createGame();
    const b = createGame();
    const fa = a.fighters[0];
    const fb = b.fighters[0];
    if (!fa || !fb) throw new Error('sem lutador');
    fa.x = 10;
    fa.y = 20;
    fb.x = 20;
    fb.y = 10;
    expect(hashState(a)).not.toBe(hashState(b));
    fa.x = 5;
    fa.y = 0;
    fb.x = 5 + 0x100000000;
    fb.y = 0;
    expect(hashState(a)).not.toBe(hashState(b));
  });

  it('seeds diferentes dão estados (e hashes) diferentes', () => {
    expect(hashState(createGame({ seed: 1 }))).not.toBe(hashState(createGame({ seed: 2 })));
    expect(hashState(createGame({ seed: 5 }))).toBe(hashState(createGame({ seed: 5 })));
  });
});
