import { describe, expect, it } from 'vitest';
import { launch } from './combat';
import { px } from './constants';
import { createGame, stepGame } from './game';
import { Button } from './input';
import { overlaps, surfaceUnder } from './physics';
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

describe('confeitaria: a rampa de biscoito', () => {
  /** Lutador 0 parado em `x` (px) na bancada; o outro longe. */
  function setup(x: number) {
    const g = createGame({ characters: ['darllan', 'crocko'], stage: CONFEITARIA_STAGE });
    const [f, other] = g.fighters;
    if (!f || !other) throw new Error('sem lutador');
    other.x = px(-450);
    f.x = px(x);
    for (let i = 0; i < 30; i++) stepGame(g, [0, 0]);
    expect(f.grounded).toBe(true);
    return { g, f };
  }

  it('vai da bancada ao forno e volta só andando, sempre no chão', () => {
    const forno = CONFEITARIA_STAGE.solids[1];
    if (!forno) throw new Error('mapa sem forno');
    const { g, f } = setup(-150);
    expect(f.y + f.h).toBe(0);
    let ticks = 0;
    while (f.x < forno.x + px(60) && ticks < 200) {
      stepGame(g, [Button.RIGHT, 0]);
      expect(f.grounded, `tick ${String(ticks)}`).toBe(true);
      ticks++;
    }
    expect(f.y + f.h).toBe(forno.y);
    ticks = 0;
    while (f.x > px(-150) && ticks < 200) {
      stepGame(g, [Button.LEFT, 0]);
      expect(f.grounded, `tick ${String(ticks)}`).toBe(true);
      ticks++;
    }
    expect(f.y + f.h).toBe(0);
  });

  it('↓ em cima dela não desce para a bancada', () => {
    const { g, f } = setup(-150);
    while (f.x < px(60)) stepGame(g, [Button.RIGHT, 0]);
    // parado em cima dela
    for (let i = 0; i < 30; i++) stepGame(g, [0, 0]);
    const feet = f.y + f.h;
    expect(feet).toBeLessThan(0);
    stepGame(g, [Button.DOWN, 0]);
    for (let i = 0; i < 40; i++) {
      stepGame(g, [Button.DOWN, 0]);
      expect(f.grounded, `tick ${String(i)}`).toBe(true);
    }
    expect(f.y + f.h).toBe(feet);
  });

  it('arremessado de cima dela, para qualquer lado e com qualquer força, nunca passa para baixo', () => {
    const ramp = CONFEITARIA_STAGE.solids.find((s) => s.kind === 'ramp');
    if (!ramp) throw new Error('mapa sem rampa');
    const fails: string[] = [];
    for (const x of [60, 120, 160]) {
      for (let angle = 0; angle < 360; angle += 15) {
        for (const damage of [0, 80, 150]) {
          for (const side of [-1, 1] as const) {
            const { g, f } = setup(x);
            // em cima dela, parado
            f.y = surfaceUnder(ramp, f) - f.h - px(100);
            for (let i = 0; i < 30; i++) stepGame(g, [0, 0]);
            f.damage = damage;
            launch(
              f,
              {
                damage: 10,
                angle,
                baseKnockback: px(8),
                knockbackScale: px(0.08),
                knockbackDir: 'facing',
              },
              side,
              10,
            );
            for (let t = 0; t < 120 && f.state !== 'ko'; t++) {
              stepGame(g, [0, 0]);
              const over = f.x > ramp.x && f.x + f.w < ramp.x + ramp.w;
              if (over && f.y + f.h > surfaceUnder(ramp, f)) {
                fails.push(
                  `x ${String(x)}, ${String(angle)}°, ${String(damage)}%, lado ${String(side)}`,
                );
                break;
              }
            }
          }
        }
      }
    }
    expect(fails).toEqual([]);
  });
});
