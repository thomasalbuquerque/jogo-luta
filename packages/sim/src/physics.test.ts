import { describe, expect, it } from 'vitest';
import { moveAndCollide, overlaps, touchingWall, type Body, type Solid } from './physics';

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
