import { describe, expect, it } from 'vitest';
import { findHits, resolveProjectileHits } from './combat';
import { px } from './constants';
import { createFighter, stepFighter, type Fighter } from './fighter';
import { createGame, spawnSlots, stepGame, type GameState } from './game';
import { Button } from './input';
import type { Solid } from './physics';
import type { Projectile } from './projectile';
import { createReplay, decodeReplay, encodeReplay, replayGame } from './replay';
import { TEST_STAGE } from './stage';

const solids: Solid[] = [{ kind: 'solid', x: px(-1000), y: 0, w: px(2000), h: px(500) }];

function fighter(g: GameState, id: number): Fighter {
  const f = g.fighters[id];
  if (!f) throw new Error(`sem lutador ${String(id)}`);
  return f;
}

/** P1 colado em P2, os dois no chão; P1 começa um leve neutro e chega aos frames ativos. */
function jabAtPartner(): [Fighter, Fighter] {
  const a = createFighter(0, { x: 0, y: 0 });
  const b = createFighter(1, { x: px(40), y: 0 });
  a.team = 0;
  b.team = 0;
  a.facing = 1;
  for (let t = 0; t < 2; t++) for (const f of [a, b]) stepFighter(f, 0, solids);
  stepFighter(a, Button.ATTACK, solids);
  for (let t = 0; t < 20 && findHits([a, b]).length === 0; t++) {
    stepFighter(a, 0, solids);
    stepFighter(b, 0, solids);
  }
  return [a, b];
}

/** Joga o lutador para fora da blast zone (KO no próximo tick). */
function throwOut(f: Fighter): void {
  f.y = px(1500);
}

const FOUR = ['base', 'base', 'base', 'base'];

describe('times', () => {
  it('sem times, cada um é o próprio time', () => {
    const g = createGame({ characters: FOUR });
    expect(g.fighters.map((f) => f.team)).toEqual([0, 1, 2, 3]);
  });

  it('companheiros nascem do mesmo lado do mapa', () => {
    expect(spawnSlots([0, 1, 2, 3])).toEqual([0, 1, 2, 3]);
    expect(spawnSlots([0, 1, 0, 1])).toEqual([0, 1, 2, 3]);
    expect(spawnSlots([0, 0, 1, 1])).toEqual([0, 2, 1, 3]);
    expect(spawnSlots([1, 0, 0, 1])).toEqual([1, 0, 2, 3]);
    const g = createGame({ characters: FOUR, teams: [0, 0, 1, 1] });
    const side = (f: Fighter) => Math.sign(f.x);
    expect(side(fighter(g, 0))).toBe(side(fighter(g, 1)));
    expect(side(fighter(g, 2))).toBe(side(fighter(g, 3)));
    expect(side(fighter(g, 0))).not.toBe(side(fighter(g, 2)));
  });

  it('sem fogo amigo, golpe não acerta o companheiro; com fogo amigo, acerta', () => {
    const [a, b] = jabAtPartner();
    expect(findHits([a, b], false)).toHaveLength(0);
    expect(findHits([a, b], true)).toHaveLength(1);
    b.team = 1;
    expect(findHits([a, b], false)).toHaveLength(1);
  });

  it('projétil passa pelo companheiro do dono (sem fogo amigo)', () => {
    const owner = createFighter(0, { x: px(-300), y: 0 });
    const mate = createFighter(1, { x: 0, y: 0 });
    owner.team = 0;
    mate.team = 0;
    const shot = (): Projectile[] => [
      {
        owner: 0,
        x: mate.x,
        y: mate.y,
        w: px(20),
        h: px(20),
        vx: px(5),
        vy: 0,
        gravity: 0,
        facing: 1,
        ticksLeft: 30,
        hit: {
          damage: 8,
          angle: 30,
          baseKnockback: 300,
          knockbackScale: 6,
          knockbackDir: 'facing',
        },
      },
    ];
    const passing = shot();
    resolveProjectileHits([owner, mate], passing, [], false);
    expect(passing).toHaveLength(1);
    expect(mate.damage).toBe(0);
    const hitting = shot();
    resolveProjectileHits([owner, mate], hitting, [], true);
    expect(hitting).toHaveLength(0);
    expect(mate.damage).toBe(8);
  });

  it('a luta só acaba quando sobra um time; o time vence junto', () => {
    const g = createGame({
      characters: FOUR,
      teams: [0, 1, 0, 1],
      rules: { stocks: 1, timeLimitTicks: 0 },
    });
    throwOut(fighter(g, 0));
    throwOut(fighter(g, 1));
    stepGame(g, [0, 0, 0, 0]);
    expect(g.phase).toBe('fight');
    throwOut(fighter(g, 3));
    stepGame(g, [0, 0, 0, 0]);
    expect(g.phase).toBe('over');
    expect(g.winnerTeam).toBe(0);
    expect(g.winner).toBe(2);
  });

  it('todos contra todos: winnerTeam é o time (= id) do vencedor', () => {
    const g = createGame({ rules: { stocks: 1, timeLimitTicks: 0 } });
    throwOut(fighter(g, 0));
    stepGame(g, [0, 0]);
    expect(g.winner).toBe(1);
    expect(g.winnerTeam).toBe(1);
  });

  it('fim do tempo: soma os stocks do time', () => {
    const g = createGame({
      characters: FOUR,
      teams: [0, 0, 1, 1],
      rules: { stocks: 3, timeLimitTicks: 5 },
    });
    // time 0: 3 + 1 = 4; time 1: 2 + 2 = 4 → empate em stocks; menor % somado vence
    fighter(g, 1).stocks = 1;
    fighter(g, 2).stocks = 2;
    fighter(g, 3).stocks = 2;
    fighter(g, 0).damage = 100;
    fighter(g, 2).damage = 50;
    fighter(g, 3).damage = 49;
    for (let i = 0; i < 5; i++) stepGame(g, [0, 0, 0, 0]);
    expect(g.phase).toBe('over');
    expect(g.winnerTeam).toBe(1);
  });

  it('fim do tempo empatado entre times: morte súbita para todos os vivos dos dois times', () => {
    const g = createGame({
      characters: FOUR,
      teams: [0, 0, 1, 1],
      rules: { stocks: 2, timeLimitTicks: 5 },
    });
    for (let i = 0; i < 5; i++) stepGame(g, [0, 0, 0, 0]);
    expect(g.suddenDeath).toBe(true);
    expect(g.fighters.every((f) => f.stocks === 1)).toBe(true);
  });

  it('o replay grava os times e o fogo amigo, e volta igual do arquivo', () => {
    const replay = createReplay({
      characters: FOUR,
      stageId: TEST_STAGE.id,
      rules: { stocks: 3, timeLimitTicks: 0, friendlyFire: true },
      seed: 7,
      teams: [0, 1, 1, 0],
    });
    const back = decodeReplay(encodeReplay(replay));
    expect(back.teams).toEqual([0, 1, 1, 0]);
    expect(back.rules.friendlyFire).toBe(true);
    const g = replayGame(back);
    expect(g.fighters.map((f) => f.team)).toEqual([0, 1, 1, 0]);
    expect(g.rules.friendlyFire).toBe(true);
  });

  it('replay sem times continua todos contra todos', () => {
    const replay = createReplay({
      characters: ['base', 'base'],
      stageId: TEST_STAGE.id,
      rules: { stocks: 3, timeLimitTicks: 0 },
      seed: 7,
    });
    const back = decodeReplay(encodeReplay(replay));
    expect(back.teams).toBeUndefined();
    expect(replayGame(back).fighters.map((f) => f.team)).toEqual([0, 1]);
  });
});
