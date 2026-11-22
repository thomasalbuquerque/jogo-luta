import { describe, expect, it } from 'vitest';
import {
  moveAndCollide,
  overlaps,
  surfaceAt,
  touchingWall,
  type Body,
  type Solid,
} from './physics';

const ground: Solid = { kind: 'solid', x: 0, y: 1000, w: 1000, h: 500 };
const plat: Solid = { kind: 'platform', x: 0, y: 500, w: 300, h: 20 };

function body(x: number, y: number, vx: number, vy: number): Body {
  return { x, y, w: 50, h: 100, vx, vy };
}

describe('physics', () => {
  it('detecta sobreposição sem contar encostar', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('pousa no chão e zera vy', () => {
    const b = body(100, 880, 0, 50);
    const r = moveAndCollide(b, [ground], false);
    expect(r.landed).toBe(true);
    expect(r.floorKind).toBe('solid');
    expect(b.y).toBe(900);
    expect(b.vy).toBe(0);
  });

  it('não atravessa o chão em alta velocidade', () => {
    const b = body(100, 0, 0, 5000);
    moveAndCollide(b, [ground], false);
    expect(b.y).toBe(900);
  });

  it('pousa na superfície mais alta quando a queda cruza duas', () => {
    const b = body(100, 0, 0, 5000);
    const r = moveAndCollide(b, [ground, plat], false);
    expect(b.y).toBe(400);
    expect(r.floorKind).toBe('platform');
  });

  it('bate na parede lateral de um sólido', () => {
    const b = body(1010, 1100, -40, 0);
    const r = moveAndCollide(b, [ground], false);
    expect(r.hitWall).toBe(-1);
    expect(b.x).toBe(1000);
    expect(b.vx).toBe(0);
    expect(touchingWall(b, [ground])).toBe(-1);
  });

  it('bate a cabeça embaixo de um sólido', () => {
    const b = body(100, 1520, 0, -50);
    const r = moveAndCollide(b, [ground], false);
    expect(r.hitCeiling).toBe(true);
    expect(b.y).toBe(1500);
  });

  it('plataforma segura quem cai por cima', () => {
    const b = body(100, 390, 0, 20);
    const r = moveAndCollide(b, [plat], false);
    expect(r.landed).toBe(true);
    expect(r.floorKind).toBe('platform');
    expect(b.y).toBe(400);
  });

  it('plataforma deixa passar quem sobe e quem desce com dropThrough', () => {
    const subindo = body(100, 520, 0, -50);
    expect(moveAndCollide(subindo, [plat], false).hitCeiling).toBe(false);
    expect(subindo.y).toBe(470);

    const descendo = body(100, 400, 0, 20);
    expect(moveAndCollide(descendo, [plat], true).landed).toBe(false);
    expect(descendo.y).toBe(420);
  });

  it('plataforma não é parede', () => {
    const b = body(310, 480, -40, 0);
    expect(moveAndCollide(b, [plat], false).hitWall).toBe(0);
    expect(b.x).toBe(270);
  });
});

describe('rampa', () => {
  // chão em y 1000 até x 800; em cima dele, rampa de x 400 a 800 subindo 200 para a
  // direita; degrau em y 800 depois dela
  const floor: Solid = { kind: 'solid', x: 0, y: 1000, w: 800, h: 500 };
  const ramp: Solid = { kind: 'ramp', x: 400, y: 800, w: 400, h: 200, up: 1 };
  const step: Solid = { kind: 'solid', x: 800, y: 800, w: 400, h: 700 };
  const world = [floor, ramp, step];

  /** Anda no chão por `ticks` ticks com velocidade vx (gravidade 5); devolve se ficou no chão. */
  function walk(b: Body, vx: number, ticks: number): boolean {
    let grounded = true;
    for (let i = 0; i < ticks; i++) {
      b.vx = vx;
      b.vy += 5;
      const r = moveAndCollide(b, world, false, grounded);
      if (!r.landed) return false;
      grounded = true;
    }
    return grounded;
  }

  it('a altura é a da diagonal, e a da ponta fora dela', () => {
    expect(surfaceAt(ramp, 400)).toBe(1000);
    expect(surfaceAt(ramp, 600)).toBe(900);
    expect(surfaceAt(ramp, 800)).toBe(800);
    expect(surfaceAt(ramp, 0)).toBe(1000);
    expect(surfaceAt({ ...ramp, up: -1 }, 600)).toBe(900);
    expect(surfaceAt({ ...ramp, up: -1 }, 400)).toBe(800);
  });

  it('sobe andando do chão até o degrau, sem bater na quina', () => {
    const b = body(300, 900, 0, 0);
    expect(walk(b, 37, 18)).toBe(true);
    expect(b.x).toBeGreaterThan(800);
    expect(b.y + b.h).toBe(800);
  });

  it('desce andando colada, sem decolar', () => {
    const b = body(1000, 700, 0, 0);
    expect(walk(b, -37, 20)).toBe(true);
    expect(b.x).toBeLessThan(400);
    expect(b.y + b.h).toBe(1000);
  });

  it('quem anda no chão embaixo dela passa por baixo', () => {
    const b = body(600, 900, 0, 0);
    expect(walk(b, 20, 5)).toBe(true);
    expect(b.y + b.h).toBe(1000);
  });

  it('segura quem cai por cima, na altura da diagonal', () => {
    const b = body(560, 760, 0, 60);
    const r = moveAndCollide(b, world, false);
    expect(r.landed).toBe(true);
    expect(r.floorKind).toBe('ramp');
    // o pé do lado alto (x 610) fica na linha
    expect(b.y + b.h).toBe(surfaceAt(ramp, 610));
  });

  it('deixa passar quem pula de baixo', () => {
    const subindo = body(560, 950, 0, -80);
    expect(moveAndCollide(subindo, world, false).hitCeiling).toBe(false);
    expect(subindo.y).toBe(870);
  });

  it('não se atravessa por cima, nem com dropThrough', () => {
    const y = surfaceAt(ramp, 610) - 100;
    const b = body(560, y, 0, 10);
    const r = moveAndCollide(b, world, true, true);
    expect(r.landed).toBe(true);
    expect(r.floorKind).toBe('ramp');
    expect(b.y).toBe(y);
  });
});
