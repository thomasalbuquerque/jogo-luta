import { describe, expect, it } from 'vitest';
import { px } from './constants';
import { Cue, cueNames, type GameEvent, type HitEvent } from './events';
import type { Fighter } from './fighter';
import { createGame, RESPAWN_DELAY_TICKS, stepGame, type GameState } from './game';
import { Button } from './input';
import { MOVES } from './moves';

function fighter(g: GameState, id: number): Fighter {
  const f = g.fighters[id];
  if (!f) throw new Error(`sem lutador ${String(id)}`);
  return f;
}

function actions(events: readonly GameEvent[], id: number): string[] {
  return events.flatMap((e) => (e.type === 'action' && e.fighter === id ? [e.action] : []));
}

/** Luta com os 2 no chão, P2 a `dist` px na frente de P1. */
function closeGame(dist: number): GameState {
  const g = createGame();
  for (let i = 0; i < 3; i++) stepGame(g, [0, 0]);
  const a = fighter(g, 0);
  const b = fighter(g, 1);
  b.x = a.x + px(dist);
  stepGame(g, [0, 0]);
  return g;
}

describe('eventos do tick', () => {
  it('cueNames lista os bits ligados na ordem de Cue', () => {
    expect(cueNames(0)).toEqual([]);
    expect(cueNames(Cue.LAND | Cue.JUMP)).toEqual(['JUMP', 'LAND']);
  });

  it('pulo do chão, pulo aéreo e pouso viram ações; a lista zera no tick seguinte', () => {
    const g = closeGame(300);
    stepGame(g, [Button.JUMP, 0]);
    expect(actions(g.events, 0)).toEqual(['JUMP']);
    stepGame(g, [0, 0]);
    expect(g.events).toEqual([]);
    for (let i = 0; i < 5; i++) stepGame(g, [0, 0]);
    stepGame(g, [Button.JUMP, 0]);
    expect(actions(g.events, 0)).toEqual(['AIR_JUMP']);
    const seen: string[] = [];
    for (let i = 0; i < 200 && !fighter(g, 0).grounded; i++) {
      stepGame(g, [0, 0]);
      seen.push(...actions(g.events, 0));
    }
    expect(seen).toContain('LAND');
  });

  it('dash no chão e golpe começando também viram ações', () => {
    const g = closeGame(300);
    stepGame(g, [Button.DODGE, 0]);
    expect(actions(g.events, 0)).toEqual(['DASH']);
    for (let i = 0; i < 30; i++) stepGame(g, [0, 0]);
    stepGame(g, [Button.ATTACK, 0]);
    expect(actions(g.events, 0)).toEqual(['SWING']);
  });

  it('golpe que acerta vira evento com dano, força e ponto do impacto', () => {
    const g = closeGame(60);
    const a = fighter(g, 0);
    const b = fighter(g, 1);
    const hits: HitEvent[] = [];
    stepGame(g, [Button.ATTACK, 0]);
    for (let i = 0; i < MOVES.neutralLight.startup + 2; i++) {
      stepGame(g, [0, 0]);
      for (const e of g.events) if (e.type === 'hit') hits.push(e);
    }
    expect(hits).toHaveLength(1);
    const [hit] = hits;
    expect(hit).toMatchObject({ kind: 'hit', attacker: 0, victim: 1 });
    expect(hit?.damage).toBe(MOVES.neutralLight.damage);
    expect(hit?.knockback).toBeGreaterThan(0);
    // impacto entre o centro de quem bate e o fundo de quem leva
    expect(hit?.x).toBeGreaterThan(a.x + a.w / 2);
    expect(hit?.x).toBeLessThanOrEqual(b.x + b.w);
  });

  it('KO vira evento com a posição de saída e os stocks que sobram; depois, respawn', () => {
    const g = createGame();
    const f = fighter(g, 0);
    f.x = px(-1500);
    stepGame(g, [0, 0]);
    const ko = g.events.find((e) => e.type === 'ko');
    expect(ko).toMatchObject({ fighter: 0, stocksLeft: g.rules.stocks - 1 });
    expect(ko?.type === 'ko' && ko.x).toBeLessThan(px(-1400));
    let respawned = false;
    for (let i = 0; i < RESPAWN_DELAY_TICKS; i++) {
      stepGame(g, [0, 0]);
      respawned ||= g.events.some((e) => e.type === 'respawn' && e.fighter === 0);
    }
    expect(respawned).toBe(true);
  });
});
