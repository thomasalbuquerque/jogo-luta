import { describe, expect, it } from 'vitest';
import { activeHitboxes, findHits, hurtbox, resolveHits } from './combat';
import { px } from './constants';
import { createFighter, stepFighter, type Fighter } from './fighter';
import { Button } from './input';
import { MOVES } from './moves';
import { overlaps, type Solid } from './physics';

const { ATTACK } = Button;

const solids: Solid[] = [{ kind: 'solid', x: px(-1000), y: 0, w: px(2000), h: px(500) }];

/** Dois lutadores no chão, P1 em x=0 virado para P2 a `dist` px. */
function duel(dist: number): [Fighter, Fighter] {
  const a = createFighter(0, { x: 0, y: 0 });
  const b = createFighter(1, { x: px(dist), y: 0 });
  a.facing = 1;
  b.facing = -1;
  step([a, b], [0, 0], 2);
  return [a, b];
}

/** Avança os lutadores e resolve os acertos, como o stepGame. */
function step(fs: Fighter[], inputs: number[], ticks = 1): void {
  for (let t = 0; t < ticks; t++) {
    for (const f of fs) stepFighter(f, inputs[f.id] ?? 0, solids);
    resolveHits(fs);
  }
}

describe('hitbox × hurtbox', () => {
  it('a hurtbox é o corpo do lutador', () => {
    const [a] = duel(200);
    expect(hurtbox(a)).toEqual({ x: a.x, y: a.y, w: a.w, h: a.h });
  });

  it('hitbox só aparece nos frames ativos, na frente de quem bate', () => {
    const [a] = duel(400);
    step([a], [ATTACK]);
    expect(activeHitboxes(a)).toHaveLength(0); // startup
    step([a], [0], MOVES.neutralLight.startup);
    const [box] = activeHitboxes(a);
    expect(box).toBeDefined();
    expect((box?.x ?? 0) + (box?.w ?? 0) / 2).toBeGreaterThan(a.x + a.w / 2);
  });

  it('virado para a esquerda, a hitbox espelha', () => {
    const [a] = duel(400);
    a.facing = -1;
    step([a], [ATTACK]);
    step([a], [0], MOVES.neutralLight.startup);
    const [box] = activeHitboxes(a);
    expect((box?.x ?? 0) + (box?.w ?? 0) / 2).toBeLessThan(a.x + a.w / 2);
  });

  it('leve neutro acerta quem está perto: soma o dano 1 vez por golpe', () => {
    const [a, b] = duel(60);
    step([a, b], [ATTACK, 0]);
    step([a, b], [0, 0], MOVES.neutralLight.startup + MOVES.neutralLight.active);
    expect(b.damage).toBe(MOVES.neutralLight.damage);
    expect(a.damage).toBe(0);
  });

  it('não acerta quem está longe', () => {
    const [a, b] = duel(200);
    step([a, b], [ATTACK, 0], 20);
    expect(b.damage).toBe(0);
  });

  it('não acerta quem está invencível', () => {
    const [a, b] = duel(60);
    b.invulnTicks = 100;
    step([a, b], [ATTACK, 0], 20);
    expect(b.damage).toBe(0);
  });

  it('dois golpes no mesmo tick trocam: os dois levam', () => {
    const [a, b] = duel(60);
    step([a, b], [ATTACK, ATTACK]);
    step([a, b], [0, 0], MOVES.neutralLight.startup);
    expect(a.damage).toBe(MOVES.neutralLight.damage);
    expect(b.damage).toBe(MOVES.neutralLight.damage);
  });

  it('findHits lista o acerto sem aplicar nada', () => {
    const [a, b] = duel(60);
    for (let t = 0; t <= MOVES.neutralLight.startup; t++) {
      stepFighter(a, t === 0 ? ATTACK : 0, solids);
      stepFighter(b, 0, solids);
    }
    expect(activeHitboxes(a).some((box) => overlaps(box, hurtbox(b)))).toBe(true);
    expect(findHits([a, b])).toEqual([{ attacker: 0, victim: 1, move: 'neutralLight' }]);
    expect(b.damage).toBe(0);
  });
});
