import { describe, expect, it } from 'vitest';
import { activeHitboxes, applyHit, findHits, hurtbox, knockback, resolveHits } from './combat';
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

  it('findHits lista o acerto sem aplicar nada (antes do resolve)', () => {
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

/** Lutador parado no ar (sem chão), para medir o arremesso. */
function floating(id: number, x = 0): Fighter {
  const f = createFighter(id, { x: px(x), y: px(-2000) });
  f.facing = 1;
  return f;
}

/** Distância horizontal que o alvo voa (sem chão) depois de levar o golpe. */
function flight(damage: number, weight = 100): number {
  const a = floating(0);
  const b = floating(1, 40);
  b.damage = damage;
  b.stats = { ...b.stats, weight };
  const x0 = b.x;
  applyHit(a, b, 'sideAir');
  for (let t = 0; t < 120; t++) stepFighter(b, 0, []);
  return b.x - x0;
}

describe('dano e knockback', () => {
  it('fórmula: (base + dano × escala) × 100 ÷ peso', () => {
    const m = MOVES.sideAir;
    expect(knockback(m, 0, 100)).toBe(m.baseKnockback);
    expect(knockback(m, 100, 100)).toBe(m.baseKnockback + 100 * m.knockbackScale);
    expect(knockback(m, 50, 200)).toBe((m.baseKnockback + 50 * m.knockbackScale) / 2);
  });

  it('cresce com o % do alvo', () => {
    const m = MOVES.neutralLight;
    expect(knockback(m, 80, 100)).toBeGreaterThan(knockback(m, 20, 100));
  });

  it('o golpe soma o dano e arremessa na direção do ângulo, para o lado de quem bate', () => {
    const a = floating(0);
    const b = floating(1, 40);
    applyHit(a, b, 'sideAir');
    expect(b.damage).toBe(MOVES.sideAir.damage);
    expect(b.kbx).toBeGreaterThan(0);
    expect(b.kby).toBeLessThan(0); // 35° para cima
    expect(b.facing).toBe(-1); // vira para quem bateu

    const c = floating(2, -40);
    a.facing = -1;
    applyHit(a, c, 'sideAir');
    expect(c.kbx).toBeLessThan(0);
  });

  it('golpe "away" arremessa para longe do centro de quem bate', () => {
    const a = floating(0);
    const behind = floating(1, -30);
    applyHit(a, behind, 'neutralAir');
    expect(behind.kbx).toBeLessThan(0);
  });

  it('com mais %, voa mais longe; mais pesado voa menos', () => {
    expect(flight(100)).toBeGreaterThan(flight(0) * 2);
    expect(flight(100, 150)).toBeLessThan(flight(100));
  });

  it('spike em quem está no chão quica para cima', () => {
    const [a, b] = duel(40);
    applyHit(a, b, 'downAir');
    expect(b.kby).toBeLessThan(0);
  });

  it('o arremesso freia até parar', () => {
    const a = floating(0);
    const b = floating(1, 40);
    applyHit(a, b, 'sideLight');
    for (let t = 0; t < 200; t++) stepFighter(b, 0, []);
    expect(b.kbx).toBe(0);
    expect(b.kby).toBe(0);
  });
});
