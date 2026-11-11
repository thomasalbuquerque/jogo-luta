import { describe, expect, it } from 'vitest';
import type { GameEvent } from '@jogo-luta/sim';
import { createStats, recordEvents } from './stats';

function hit(attacker: number, victim: number, damage: number): GameEvent {
  return { type: 'hit', kind: 'hit', attacker, victim, damage, knockback: 0, x: 0, y: 0 };
}

function ko(fighter: number): GameEvent {
  return { type: 'ko', fighter, x: 0, y: 0, stocksLeft: 0 };
}

describe('estatísticas da luta', () => {
  it('soma dano, golpes e o maior golpe de quem bate', () => {
    const s = createStats(2);
    recordEvents(s, [hit(0, 1, 7), hit(0, 1, 13)]);
    recordEvents(s, [hit(1, 0, 5)]);
    expect(s.players[0]).toMatchObject({ damageDealt: 20, hits: 2, bestHit: 13 });
    expect(s.players[1]).toMatchObject({ damageDealt: 5, hits: 1, bestHit: 5 });
  });

  it('KO conta para o último que bateu; cair sozinho é só queda', () => {
    const s = createStats(2);
    recordEvents(s, [hit(0, 1, 10), hit(1, 0, 3)]);
    recordEvents(s, [ko(1)]);
    expect(s.players[0]?.kos).toBe(1);
    expect(s.players[1]?.falls).toBe(1);
    // reapareceu e caiu sem ninguém bater
    recordEvents(s, [ko(1)]);
    expect(s.players[0]?.kos).toBe(1);
    expect(s.players[1]?.falls).toBe(2);
  });
});
