import { describe, expect, it } from 'vitest';
import { fitRig, REST_POSE, solvePose, type FrameAnchors, type Skin } from '../rig/skeleton';
import { MANNEQUIN_PIECES, packPieces } from './mannequin';

function skin(): Skin {
  return new Map<string, FrameAnchors>(
    MANNEQUIN_PIECES.map((p) => [
      p.name,
      { w: p.w, h: p.h, pivot: p.pivot, tip: p.tip, sockets: p.sockets ?? {} },
    ]),
  );
}

describe('boneco de treino', () => {
  it('tem todas as peças que o esqueleto usa, em toda expressão e mão', () => {
    const s = skin();
    for (const expression of ['normal', 'hurt', 'taunt', 'ko'] as const) {
      for (const hand of ['fist', 'open', 'taunt'] as const) {
        const pose = { ...REST_POSE, expression, handNear: hand, handFar: hand };
        expect(() => solvePose(s, pose)).not.toThrow();
      }
    }
  });

  it('fica em pé: pés embaixo e altura de gente', () => {
    const fit = fitRig(skin());
    expect(fit.groundY).toBeGreaterThan(0);
    expect(fit.height).toBeGreaterThan(400);
  });

  it('cabe na folha sem peças sobrepostas', () => {
    const placed = packPieces(MANNEQUIN_PIECES);
    for (const a of placed) {
      expect(a.x + a.piece.w).toBeLessThanOrEqual(1024);
      expect(a.y + a.piece.h).toBeLessThanOrEqual(1024);
      for (const b of placed) {
        if (a === b) continue;
        const apart =
          a.x + a.piece.w <= b.x ||
          b.x + b.piece.w <= a.x ||
          a.y + a.piece.h <= b.y ||
          b.y + b.piece.h <= a.y;
        expect(apart).toBe(true);
      }
    }
  });
});
