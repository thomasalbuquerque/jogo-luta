import { describe, expect, it } from 'vitest';
import { Button } from './input';
import {
  hitboxesAt,
  isActiveFrame,
  MOVES,
  selectAttack,
  selectSpecial,
  totalFrames,
  BASE_MOVE_IDS,
} from './moves';

const { LEFT, RIGHT, UP, DOWN } = Button;
const ids = BASE_MOVE_IDS;

describe('moves', () => {
  it.each(ids)('%s: frames e hitboxes coerentes', (id) => {
    const m = MOVES[id];
    expect(m.active).toBeGreaterThan(0);
    expect(totalFrames(m)).toBe(m.startup + m.active + m.recovery);
    expect(m.hitboxes.length).toBeGreaterThan(0);
    for (const w of m.hitboxes) {
      // toda hitbox fica dentro da janela ativa
      expect(isActiveFrame(m, w.from)).toBe(true);
      expect(isActiveFrame(m, w.to)).toBe(true);
      expect(w.to).toBeGreaterThanOrEqual(w.from);
      for (const b of w.boxes) {
        expect(b.w).toBeGreaterThan(0);
        expect(b.h).toBeGreaterThan(0);
      }
    }
    expect(m.damage).toBeGreaterThan(0);
    expect(m.baseKnockback).toBeGreaterThan(0);
    if (m.impulse) expect(m.impulse.frame).toBeLessThanOrEqual(totalFrames(m));
    if (m.landMove) expect(MOVES[m.landMove]).toBeDefined();
  });

  it('hitbox só existe nos frames ativos', () => {
    const jab = MOVES.neutralLight;
    expect(hitboxesAt(jab, jab.startup)).toHaveLength(0);
    expect(hitboxesAt(jab, jab.startup + 1)).toHaveLength(1);
    expect(hitboxesAt(jab, jab.startup + jab.active)).toHaveLength(1);
    expect(hitboxesAt(jab, jab.startup + jab.active + 1)).toHaveLength(0);
  });

  it('aéreo lado troca de hitbox no meio da janela ativa', () => {
    const m = MOVES.sideAir;
    const early = hitboxesAt(m, m.startup + 1)[0];
    const late = hitboxesAt(m, m.startup + m.active)[0];
    expect(early).toBeDefined();
    expect(late).toBeDefined();
    expect(early).not.toEqual(late);
  });

  it('escolhe o golpe do chão pela direção', () => {
    expect(selectAttack(true, 0, true)).toBe('neutralLight');
    expect(selectAttack(true, LEFT, true)).toBe('sideLight');
    expect(selectAttack(true, RIGHT | DOWN, true)).toBe('downLight');
    expect(selectAttack(true, UP, true)).toBe('recovery');
    expect(selectAttack(true, RIGHT | UP, true)).toBe('recovery');
  });

  it('escolhe o aéreo pela direção; ↑ sem recuperação vira aéreo neutro', () => {
    expect(selectAttack(false, 0, true)).toBe('neutralAir');
    expect(selectAttack(false, RIGHT, true)).toBe('sideAir');
    expect(selectAttack(false, DOWN | LEFT, true)).toBe('downAir');
    expect(selectAttack(false, UP, true)).toBe('recovery');
    expect(selectAttack(false, UP, false)).toBe('neutralAir');
  });

  it('Especial + ↓ no ar é o ground pound; o resto é o especial, se disponível', () => {
    expect(selectSpecial(false, DOWN, true)).toBe('groundPound');
    expect(selectSpecial(false, DOWN, false)).toBe('groundPound');
    expect(selectSpecial(true, DOWN, true)).toBe('special');
    expect(selectSpecial(false, RIGHT, true)).toBe('special');
    expect(selectSpecial(true, 0, false)).toBeNull();
    expect(selectSpecial(false, 0, false)).toBeNull();
  });
});
