import { describe, expect, it } from 'vitest';
import { exitDirection, koEdgePoint } from './koEdge';

const blast = { x: -1000, y: -800, w: 2000, h: 1300 };
const view = { x: -640, y: -500, w: 1280, h: 720 };

describe('KO na borda', () => {
  it('sabe por qual lado da blast zone saiu', () => {
    expect(exitDirection(blast, -1100, 0)).toEqual({ x: -1, y: 0 });
    expect(exitDirection(blast, 0, 600)).toEqual({ x: 0, y: 1 });
    expect(exitDirection(blast, 1100, -900)).toEqual({ x: 1, y: -1 });
  });

  it('saindo pela esquerda, explode na borda esquerda apontando para a direita', () => {
    const p = koEdgePoint(view, 1280, 720, -1100, -140, { x: -1, y: 0 });
    expect(p.x).toBe(0);
    expect(p.y).toBeCloseTo(360);
    expect(p.angle).toBeCloseTo(0);
  });

  it('caindo, explode embaixo apontando para cima, na altura da tela', () => {
    const p = koEdgePoint(view, 1280, 720, 5000, 900, { x: 0, y: 1 });
    expect(p.y).toBe(720);
    expect(p.x).toBe(1280);
    expect(p.angle).toBeCloseTo(-Math.PI / 2);
  });

  it('no canto, aponta na diagonal para dentro', () => {
    const p = koEdgePoint(view, 1280, 720, 1500, -900, { x: 1, y: -1 });
    expect(p).toMatchObject({ x: 1280, y: 0 });
    expect(p.angle).toBeCloseTo((3 * Math.PI) / 4);
  });
});
