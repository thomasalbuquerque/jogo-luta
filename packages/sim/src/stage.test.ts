import { describe, expect, it } from 'vitest';
import { px } from './constants';
import { createGame, stepGame } from './game';
import { Button } from './input';
import { overlaps } from './physics';
import { CONFEITARIA_STAGE, STAGES } from './stage';

describe('mapas', () => {
  it('ids diferentes', () => {
    const ids = STAGES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(STAGES.map((s) => [s.id, s] as const))(
    '%s: cada lutador começa em pé em cima de um bloco ou plataforma',
    (_, stage) => {
      for (const spawn of stage.spawns) {
        const under = stage.solids.filter(
          (s) => s.y === spawn.y && spawn.x > s.x && spawn.x < s.x + s.w,
        );
        expect(under.length, `spawn em ${String(spawn.x)}, ${String(spawn.y)}`).toBe(1);
      }
    },
  );

  it.each(STAGES.map((s) => [s.id, s] as const))(
    '%s: o reaparecimento fica fora dos blocos e dentro da blast zone',
    (_, stage) => {
      for (const r of stage.respawns) {
        const body = { x: r.x - 1, y: r.y - 1, w: 2, h: 2 };
        expect(stage.solids.some((s) => overlaps(body, s))).toBe(false);
        expect(overlaps(body, stage.blastZone)).toBe(true);
      }
    },
  );

  it('confeitaria: o forno encosta na bancada, mais alto, com o pé na mesma linha', () => {
    const [bancada, forno] = CONFEITARIA_STAGE.solids;
    expect(bancada && forno).toBeTruthy();
    if (!bancada || !forno) return;
    expect(forno.x).toBe(bancada.x + bancada.w);
    expect(forno.y).toBeLessThan(bancada.y);
    expect(forno.y + forno.h).toBe(bancada.y + bancada.h);
  });
});

describe('confeitaria: o forno', () => {
  it('o Darllan (quem pula menos) sobe da bancada no forno com um pulo só', () => {
    const g = createGame({ characters: ['darllan', 'crocko'], stage: CONFEITARIA_STAGE });
    const [d, other] = g.fighters;
    const forno = CONFEITARIA_STAGE.solids[1];
    if (!d || !other || !forno) throw new Error('mapa sem forno');
    other.x = px(-450);
    // parado na bancada, perto do forno
    d.x = forno.x - px(120);
    for (let i = 0; i < 30; i++) stepGame(g, [0, 0]);
    expect(d.grounded).toBe(true);
    const airJumps = d.airJumpsLeft;
    let minAirJumps = airJumps;
    for (let i = 0; i < 90; i++) {
      stepGame(g, [Button.RIGHT | Button.JUMP, 0]);
      minAirJumps = Math.min(minAirJumps, d.airJumpsLeft);
    }
    expect(minAirJumps).toBe(airJumps);
    expect(d.grounded).toBe(true);
    expect(d.y + d.h).toBe(forno.y);
  });
});
