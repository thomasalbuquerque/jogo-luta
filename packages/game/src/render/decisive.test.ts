import { describe, expect, it } from 'vitest';
import { createGame, launch, MOVES, px, type GameState } from '@jogo-luta/sim';
import { isDecisiveHit } from './decisive';

/** Luta 1x1 com o P2 no último stock, acertado agora pelo aéreo lado com `damage`%. */
function hitLastStock(damage: number, stocks = 1): GameState {
  const g = createGame({ rules: { stocks: 3, timeLimitTicks: 0 } });
  const victim = g.fighters[1];
  if (!victim) throw new Error('sem P2');
  victim.stocks = stocks;
  victim.damage = damage;
  victim.y = px(-200);
  victim.grounded = false;
  launch(victim, MOVES.sideAir, 1, MOVES.sideAir.damage);
  return g;
}

describe('isDecisiveHit', () => {
  it('golpe forte no último stock com % alto decide a luta', () => {
    expect(isDecisiveHit(hitLastStock(250), 1)).toBe(true);
  });

  it('golpe fraco (pouco %) não decide', () => {
    expect(isDecisiveHit(hitLastStock(0), 1)).toBe(false);
  });

  it('com stock sobrando não decide, mesmo voando longe', () => {
    expect(isDecisiveHit(hitLastStock(250, 2), 1)).toBe(false);
  });

  it('não mexe no estado da luta', () => {
    const g = hitLastStock(250);
    const before = JSON.stringify(g);
    isDecisiveHit(g, 1);
    expect(JSON.stringify(g)).toBe(before);
  });
});
