import { describe, expect, it } from 'vitest';
import { defineCharacter, type CharacterSheet } from './character';
import { BASE_CHARACTER_ID, getCharacter, registerCharacter } from './characters';
import { canBeHit, comboHitIndex, resolveHits, resolveProjectileHits } from './combat';
import { px } from './constants';
import {
  canUseSpecial,
  createFighter,
  DEFAULT_STATS,
  effectiveWeight,
  hasAura,
  isVanished,
  moveFrame,
  stepFighter,
  TELEPORT_EDGE_MARGIN,
  teleportSpots,
  type Fighter,
} from './fighter';
import type { GameEvent } from './events';
import { createGame, stepGame, type GameState } from './game';
import { Button } from './input';
import type { ProjectileDef } from './moves';
import { overlaps, type Solid } from './physics';
import { spawnProjectile, stepProjectiles, type Projectile } from './projectile';
import { seedRng } from './rng';
import { TEST_STAGE } from './stage';

const { LEFT, SPECIAL } = Button;

const solids: Solid[] = [{ kind: 'solid', x: px(-2000), y: 0, w: px(4000), h: px(500) }];
const hit = { damage: 12, angle: 30, baseKnockback: 10, knockbackScale: 0.2 };

/** Registra um personagem de teste com o especial dado e devolve o id. */
function character(id: string, special: CharacterSheet['special']): string {
  registerCharacter(
    defineCharacter({
      id,
      name: id,
      colors: { primary: '#123456', secondary: '#abcdef' },
      stats: {
        weight: 100,
        walkSpeed: 6.5,
        airSpeed: 5.5,
        jumpHeight: 175,
        airJumps: 1,
        hurtbox: { w: 48, h: 96 },
      },
      special,
      taunt: { text: 'Opa!', sound: 'teste', animation: 'teste' },
    }),
  );
  return id;
}

const DASHER = character('t-dash', {
  name: 'Arrancada',
  startup: 10,
  active: 8,
  recovery: 12,
  oncePerAir: true,
  hoverStartup: true,
  blocks: [{ type: 'dash', speed: 15, airSpeed: 9, box: { x: 30, y: 0, w: 60, h: 80 }, hit }],
});

const AREA = character('t-area', {
  name: 'Explosão',
  startup: 6,
  active: 4,
  recovery: 10,
  cooldownTicks: 60,
  blocks: [{ type: 'area', box: { x: 0, y: 0, w: 220, h: 120 }, hit }],
});

/** Avança os lutadores e resolve os acertos, como o stepGame. */
function run(fs: Fighter[], inputs: number[], ticks = 1): void {
  for (let t = 0; t < ticks; t++) {
    for (const f of fs) stepFighter(f, inputs[f.id] ?? 0, solids);
    resolveHits(fs);
  }
}

function onGround(id: number, character: string, x = 0): Fighter {
  const f = createFighter(id, { x: px(x), y: 0 }, character);
  f.facing = 1;
  run([f], [0], 2);
  return f;
}

function inAir(character: string): Fighter {
  const f = createFighter(0, { x: 0, y: px(-800) }, character);
  f.facing = 1;
  run([f], [0], 2);
  return f;
}

describe('especial', () => {
  it('sai com Especial e vira para o lado apertado', () => {
    const f = onGround(0, DASHER);
    run([f], [LEFT | SPECIAL]);
    expect(f.state).toBe('attack');
    expect(f.move).toBe('special');
    expect(f.facing).toBe(-1);
  });

  it('investida: parada no startup, depois dispara reto no active', () => {
    const f = onGround(0, DASHER);
    const x0 = f.x;
    run([f], [SPECIAL]);
    run([f], [0], 9);
    expect(f.x).toBe(x0);
    run([f], [0], 8);
    expect(moveFrame(f)).toBe(18);
    expect(f.x - x0).toBe(px(15) * 8);
  });

  it('investida freia no fim: não escorrega longe', () => {
    const f = onGround(0, DASHER);
    run([f], [SPECIAL]);
    run([f], [0], 17);
    expect(f.vx).toBe(px(15));
    run([f], [0]);
    expect(Math.abs(f.vx)).toBeLessThanOrEqual(DEFAULT_STATS.walkSpeed);
  });

  it('investida acerta quem está no caminho', () => {
    const a = onGround(0, DASHER);
    const b = onGround(1, DASHER, 150);
    b.facing = -1;
    run([a, b], [SPECIAL, 0]);
    run([a, b], [0, 0], 20);
    expect(b.damage).toBe(12);
    expect(b.kbx).toBeGreaterThan(0);
  });

  it('no ar: parada no startup, sem cair no active, mais curta e 1 vez por ar', () => {
    const f = inAir(DASHER);
    run([f], [SPECIAL]);
    const x0 = f.x;
    const y0 = f.y;
    run([f], [0], 17);
    expect(f.y).toBe(y0);
    expect(f.x - x0).toBe(px(9) * 8);
    expect(f.specialUsed).toBe(true);
    run([f], [0], 13);
    expect(f.state).toBe('fall');
    expect(canUseSpecial(f)).toBe(false);
    run([f], [SPECIAL]);
    expect(f.move).toBeNull();
    // tocar o chão devolve
    let guard = 0;
    while (!f.grounded) {
      run([f], [0]);
      if (++guard > 200) throw new Error('não pousou');
    }
    expect(canUseSpecial(f)).toBe(true);
  });

  it('recarga: não repete antes do cooldown', () => {
    const f = onGround(0, AREA);
    run([f], [SPECIAL]);
    run([f], [0], 25);
    expect(f.state).toBe('idle');
    expect(f.specialCooldown).toBeGreaterThan(6);
    run([f], [SPECIAL]);
    expect(f.move).toBeNull();
    run([f], [0], 40);
    run([f], [SPECIAL]);
    expect(f.move).toBe('special');
  });

  it('área acerta dos dois lados, arremessando para longe do centro', () => {
    const a = onGround(0, AREA);
    const left = onGround(1, AREA, -80);
    const right = onGround(2, AREA, 80);
    run([a, left, right], [SPECIAL, 0, 0]);
    run([a, left, right], [0, 0, 0], 8);
    expect(left.damage).toBe(12);
    expect(right.damage).toBe(12);
    expect(left.kbx).toBeLessThan(0);
    expect(right.kbx).toBeGreaterThan(0);
  });
});

const SHOOTER = character('t-shoot', {
  name: 'Frango',
  startup: 8,
  active: 1,
  recovery: 10,
  cooldownTicks: 30,
  blocks: [
    {
      type: 'projectile',
      speed: 10,
      lifetimeTicks: 60,
      size: { w: 20, h: 12 },
      hit: { damage: 5, angle: 20, baseKnockback: 6, knockbackScale: 0.05 },
    },
  ],
});

describe('bloco projétil', () => {
  it('sai no 1º frame ativo, voa reto e some quando o tempo acaba', () => {
    const f = onGround(0, SHOOTER);
    const shots: Projectile[] = [];
    stepFighter(f, SPECIAL, solids, shots);
    for (let i = 0; i < 7; i++) stepFighter(f, 0, solids, shots);
    expect(shots).toHaveLength(0);
    stepFighter(f, 0, solids, shots);
    expect(shots).toHaveLength(1);
    const p = shots[0];
    expect(p?.owner).toBe(0);
    expect(p?.vx).toBe(px(10));
    expect(p?.vy).toBe(0);
    expect((p?.x ?? 0) + (p?.w ?? 0) / 2).toBe(f.x + f.w / 2 + px(30));
    const x0 = p?.x ?? 0;
    const y0 = p?.y;
    for (let i = 0; i < 59; i++) stepProjectiles(shots, [], OPEN);
    expect(shots[0]?.y).toBe(y0);
    expect(shots[0]?.x).toBe(x0 + px(10) * 59);
    stepProjectiles(shots, [], OPEN);
    expect(shots).toHaveLength(0);
  });

  it('acerta o alvo e some; só o alvo congela', () => {
    const g = createGame({ characters: [SHOOTER, BASE_CHARACTER_ID] });
    const [a, b] = g.fighters as [Fighter, Fighter];
    stepGame(g, [0, 0]);
    stepGame(g, [SPECIAL, 0]);
    let guard = 0;
    while (b.damage === 0) {
      stepGame(g, [0, 0]);
      if (++guard > 60) throw new Error('não acertou');
    }
    expect(b.damage).toBe(5);
    expect(b.state).toBe('hitstun');
    expect(b.kbx).toBeGreaterThan(0);
    expect(b.hitstop).toBeGreaterThan(0);
    expect(a.hitstop).toBe(0);
    expect(g.projectiles).toHaveLength(0);
  });

  it('não acerta o dono e some ao bater em bloco sólido', () => {
    const f = onGround(0, SHOOTER);
    const shots = [spawnProjectile(f, { ...shotDef(), offsetX: 0 })];
    resolveProjectileHits([f], shots);
    expect(shots).toHaveLength(1);
    expect(f.damage).toBe(0);
    const wall: Solid = { kind: 'solid', x: f.x + px(60), y: px(-300), w: px(20), h: px(300) };
    for (let i = 0; i < 10; i++) stepProjectiles(shots, [wall], OPEN);
    expect(shots).toHaveLength(0);
  });

  it('com ângulo e gravidade faz um arco', () => {
    const f = onGround(0, SHOOTER);
    const shots = [spawnProjectile(f, { ...shotDef(), launchAngle: 45, gravity: px(0.5) })];
    const p = shots[0];
    expect(p?.vy).toBeLessThan(0);
    for (let i = 0; i < 40; i++) stepProjectiles(shots, [], OPEN);
    expect(shots[0]?.vy).toBeGreaterThan(0);
  });
});

const OPEN = { x: px(-5000), y: px(-5000), w: px(10000), h: px(10000) };

function shotDef(): ProjectileDef {
  const def = getCharacter(SHOOTER).special?.move.projectile;
  if (!def) throw new Error('sem projétil');
  return { ...def, lifetimeTicks: 100 };
}

const BUFFER = character('t-buff', {
  name: 'Marra',
  startup: 5,
  active: 1,
  recovery: 10,
  blocks: [
    { type: 'buff', durationTicks: 120, damagePercent: 150, speedPercent: 130, weightPercent: 150 },
  ],
});

const TELEPORTER = character('t-tele', {
  name: 'Sumiço',
  startup: 6,
  active: 4,
  recovery: 12,
  blocks: [{ type: 'teleport', distance: 200, invulnTicks: 10 }],
});

describe('bloco buff', () => {
  it('mais dano, mais rápido e mais pesado por um tempo', () => {
    const f = onGround(0, BUFFER);
    run([f], [SPECIAL]);
    run([f], [0], 5);
    expect(f.buffTicks).toBe(120);
    expect(effectiveWeight(f)).toBe(150);
    run([f], [0], 12);
    expect(f.state).toBe('idle');
    run([f], [Button.RIGHT], 30);
    expect(f.vx).toBe(Math.trunc((DEFAULT_STATS.walkSpeed * 130) / 100));

    const target = onGround(1, BUFFER, toPxX(f) + 60);
    f.facing = 1;
    run([f, target], [Button.ATTACK, 0]);
    run([f, target], [0, 0], 10);
    expect(target.damage).toBe(7); // 5% × 150%

    run([f, target], [0, 0], 120);
    expect(f.buffTicks).toBe(0);
    expect(f.buffDamage).toBe(100);
    expect(effectiveWeight(f)).toBe(100);
  });
});

const AURA = character('t-aura', {
  name: 'Tragadinha',
  startup: 5,
  active: 1,
  recovery: 10,
  blocks: [{ type: 'buff', durationTicks: 120, invulnerable: true }],
});

/** Lutador com a aura ligada, parado no chão. */
function withAura(f: Fighter): Fighter {
  const press: number[] = [];
  press[f.id] = SPECIAL;
  run([f], press);
  run([f], [0], 16);
  expect(f.state).toBe('idle');
  expect(hasAura(f)).toBe(true);
  return f;
}

describe('bloco buff com aura (invulnerable)', () => {
  it('golpe passa sem dano nem knockback, com 1 evento aura por golpe', () => {
    const b = withAura(onGround(1, AURA, 60));
    const a = onGround(0, BASE_CHARACTER_ID);
    a.facing = 1;
    const events: GameEvent[] = [];
    stepFighter(a, Button.ATTACK, solids);
    for (let i = 0; i < 20; i++) {
      stepFighter(a, 0, solids);
      stepFighter(b, 0, solids);
      resolveHits([a, b], events);
    }
    expect(b.damage).toBe(0);
    expect(b.state).toBe('idle');
    expect(b.kbx).toBe(0);
    expect(events.filter((e) => e.type === 'aura')).toEqual([
      expect.objectContaining({ type: 'aura', attacker: 0, victim: 1 }),
    ]);
  });

  it('agarrão também passa', () => {
    const g = closeGame([GRABBER, AURA]);
    const [a, b] = g.fighters as [Fighter, Fighter];
    steps(g, [0, SPECIAL]);
    steps(g, [0, 0], 16);
    expect(hasAura(b)).toBe(true);
    steps(g, [SPECIAL, 0]);
    steps(g, [0, 0], 6);
    expect(b.state).not.toBe('grabbed');
    expect(a.grabTicks).toBe(0);
  });

  it('projétil atravessa e segue voando, com 1 evento aura', () => {
    const b = withAura(onGround(1, AURA, 60));
    const shooter = onGround(0, SHOOTER, -40);
    const shots = [spawnProjectile(shooter, shotDef())];
    const events: GameEvent[] = [];
    for (let i = 0; i < 20; i++) {
      stepProjectiles(shots, [], OPEN);
      resolveProjectileHits([shooter, b], shots, events);
    }
    expect(b.damage).toBe(0);
    expect(shots).toHaveLength(1);
    expect(events.filter((e) => e.type === 'aura')).toHaveLength(1);
  });

  it('acaba no fim do tempo e volta a tomar golpe', () => {
    const b = withAura(onGround(1, AURA, 60));
    run([b], [0], 120);
    expect(hasAura(b)).toBe(false);
    expect(canBeHit(b)).toBe(true);
    const a = onGround(0, BASE_CHARACTER_ID);
    a.facing = 1;
    run([a, b], [Button.ATTACK, 0]);
    run([a, b], [0, 0], 10);
    expect(b.damage).toBeGreaterThan(0);
  });

  it('se apanhar no startup, o especial cai e a aura não liga', () => {
    const b = onGround(1, AURA, 60);
    const a = onGround(0, BASE_CHARACTER_ID);
    a.facing = 1;
    run([a, b], [Button.ATTACK, SPECIAL]);
    run([a, b], [0, 0], 30);
    expect(b.damage).toBeGreaterThan(0);
    expect(hasAura(b)).toBe(false);
  });
});

describe('bloco teleporte', () => {
  it('sem direção, vai para a frente e fica invencível um pouco', () => {
    const f = onGround(0, TELEPORTER);
    const x0 = f.x;
    run([f], [SPECIAL]);
    run([f], [0], 6);
    expect(f.x - x0).toBe(px(200));
    expect(f.invulnTicks).toBeGreaterThan(0);
  });

  it('vai na direção apertada (para cima sai do chão)', () => {
    const f = onGround(0, TELEPORTER);
    const y0 = f.y;
    run([f], [SPECIAL]);
    run([f], [Button.UP], 6);
    expect(y0 - f.y).toBeGreaterThan(px(190));
    expect(f.grounded).toBe(false);
  });

  it('não atravessa bloco sólido', () => {
    const wall: Solid = { kind: 'solid', x: px(100), y: px(-400), w: px(50), h: px(400) };
    const f = createFighter(0, { x: 0, y: 0 }, TELEPORTER);
    f.facing = 1;
    const world = [...solids, wall];
    for (let i = 0; i < 2; i++) stepFighter(f, 0, world);
    stepFighter(f, SPECIAL, world);
    for (let i = 0; i < 6; i++) stepFighter(f, 0, world);
    expect(f.x + f.w).toBe(wall.x);
  });
});

/** Centro do lutador em px. */
function toPxX(f: Fighter): number {
  return (f.x + f.w / 2) / 100;
}

const COUNTER = character('t-counter', {
  name: 'Devolve',
  startup: 3,
  active: 20,
  recovery: 20,
  blocks: [
    { type: 'counter', hit: { damage: 10, angle: 45, baseKnockback: 12, knockbackScale: 0.2 } },
  ],
});

const QUITTER = character('t-quit', {
  name: 'Silent quit',
  startup: 14,
  active: 20,
  recovery: 18,
  oncePerAir: true,
  blocks: [{ type: 'teleport', target: 'random' }],
});

/** Sempre para o ponto mais longe (0%) ou o mais perto (100%) do adversário. */
const FAR_QUITTER = character('t-quit-far', {
  name: 'Longe',
  startup: 14,
  active: 20,
  recovery: 18,
  blocks: [{ type: 'teleport', target: 'random', candidates: 6, nearChance: 0 }],
});
const NEAR_QUITTER = character('t-quit-near', {
  name: 'Perto',
  startup: 14,
  active: 20,
  recovery: 18,
  blocks: [{ type: 'teleport', target: 'random', candidates: 6, nearChance: 100 }],
});

/** Luta no mapa de teste com o lutador 0 já parado no chão; o 1 é o boneco. */
function quitGame(id: string, seed: number): GameState {
  const g = createGame({ characters: [id, BASE_CHARACTER_ID], seed });
  for (let i = 0; i < 5; i++) stepGame(g, [0, 0]);
  return g;
}

/** Aperta o especial e avança até o fim do sumiço (1º frame do recovery). */
function quit(g: GameState): void {
  stepGame(g, [SPECIAL, 0]);
  for (let i = 0; i < 14 + 20; i++) stepGame(g, [0, 0]);
}

/** O Tauba de teste (0) e o boneco (1). */
function pair(g: GameState): [Fighter, Fighter] {
  const [f, foe] = g.fighters;
  if (!f || !foe) throw new Error('sem lutadores');
  return [f, foe];
}

function feetOf(f: Fighter): { x: number; y: number } {
  return { x: f.x + f.w / 2, y: f.y + f.h };
}

describe('bloco teleporte sorteado (Silent quit)', () => {
  it('some no active: parado, intangível e sem levar golpe', () => {
    const g = quitGame(QUITTER, 7);
    const [f] = pair(g);
    stepGame(g, [SPECIAL, 0]);
    for (let i = 0; i < 13; i++) stepGame(g, [0, 0]);
    expect(isVanished(f)).toBe(false); // startup: ainda dá para bater
    expect(canBeHit(f)).toBe(true);
    stepGame(g, [0, 0]);
    expect(isVanished(f)).toBe(true);
    expect(canBeHit(f)).toBe(false);
    const x = f.x;
    const y = f.y;
    for (let i = 0; i < 19; i++) {
      stepGame(g, [Button.RIGHT, 0]);
      expect(isVanished(f)).toBe(true);
      expect([f.x, f.y]).toEqual([x, y]);
    }
    stepGame(g, [0, 0]);
    expect(isVanished(f)).toBe(false);
    expect(canBeHit(f)).toBe(true); // volta sem invencibilidade: se cair perto, apanha
  });

  it('reaparece em pé em cima de um chão do palco, longe das pontas', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = quitGame(QUITTER, seed);
      const [f] = pair(g);
      quit(g);
      stepGame(g, [0, 0]);
      expect(f.grounded).toBe(true);
      const feet = feetOf(f);
      const floor = TEST_STAGE.solids.find(
        (s) => s.y === feet.y && feet.x >= s.x && feet.x <= s.x + s.w,
      );
      expect(floor).toBeDefined();
      if (!floor) continue;
      expect(feet.x - f.w / 2).toBeGreaterThanOrEqual(floor.x + TELEPORT_EDGE_MARGIN);
      expect(feet.x + f.w / 2).toBeLessThanOrEqual(floor.x + floor.w - TELEPORT_EDGE_MARGIN);
    }
  });

  it('a mesma seed cai no mesmo lugar; seeds diferentes variam', () => {
    const spot = (seed: number) => {
      const g = quitGame(QUITTER, seed);
      quit(g);
      return feetOf(pair(g)[0]);
    };
    expect(spot(3)).toEqual(spot(3));
    const spots = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => JSON.stringify(spot(s))));
    expect(spots.size).toBeGreaterThan(3);
  });

  it('vira para o adversário ao reaparecer', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const g = quitGame(QUITTER, seed);
      quit(g);
      const [f, foe] = pair(g);
      const dx = feetOf(foe).x - feetOf(f).x;
      if (dx !== 0) expect(f.facing).toBe(Math.sign(dx));
    }
  });

  it('em geral vai para longe do adversário; com nearChance 100, para perto', () => {
    let far = 0;
    let near = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const a = quitGame(FAR_QUITTER, seed);
      quit(a);
      far += Math.abs(feetOf(pair(a)[0]).x - feetOf(pair(a)[1]).x);
      const b = quitGame(NEAR_QUITTER, seed);
      quit(b);
      near += Math.abs(feetOf(pair(b)[0]).x - feetOf(pair(b)[1]).x);
    }
    expect(far / 30).toBeGreaterThan(px(350));
    expect(near / 30).toBeLessThan(px(200));
  });

  it('do ar, 1 vez só: cai num chão e serve de recuperação', () => {
    const g = quitGame(QUITTER, 11);
    const [f] = pair(g);
    // fora do palco, caindo
    f.x = px(-700);
    f.y = px(200);
    f.grounded = false;
    stepGame(g, [0, 0]);
    expect(canUseSpecial(f)).toBe(true);
    quit(g);
    for (let i = 0; i < 20; i++) stepGame(g, [0, 0]);
    expect(f.grounded).toBe(true);
    expect(f.state).toBe('idle');
  });

  it('sem a luta (lutador solto), não sai do lugar', () => {
    const f = onGround(0, QUITTER);
    const x0 = f.x;
    run([f], [SPECIAL]);
    run([f], [0], 40);
    expect(f.x).toBe(x0);
  });

  it('os pontos nunca põem o corpo dentro de um bloco sólido', () => {
    const floor: Solid = { kind: 'solid', x: px(-400), y: 0, w: px(800), h: px(200) };
    const pillar: Solid = { kind: 'solid', x: px(-100), y: px(-300), w: px(200), h: px(300) };
    const platform: Solid = { kind: 'platform', x: px(-300), y: px(-150), w: px(600), h: px(16) };
    const world = [floor, pillar, platform];
    const body = { w: px(48), h: px(96) };
    const rng = { rng: seedRng(5) };
    for (let i = 0; i < 50; i++) {
      for (const p of teleportSpots(body, world, 3, rng)) {
        const box = { x: p.x - body.w / 2, y: p.y - body.h, ...body };
        expect(world.some((s) => s.kind === 'solid' && overlaps(box, s))).toBe(false);
        expect(world.some((s) => s.y === p.y)).toBe(true);
      }
    }
  });
});

describe('bloco contra-ataque', () => {
  it('quem bate durante a janela leva o golpe; quem contra-ataca não leva nada', () => {
    const a = onGround(0, COUNTER);
    const b = onGround(1, BASE_CHARACTER_ID, 60);
    b.facing = -1;
    run([a, b], [SPECIAL, 0]);
    run([a, b], [0, 0], 4);
    run([a, b], [0, Button.ATTACK]);
    run([a, b], [0, 0], 10);
    expect(a.damage).toBe(0);
    expect(b.damage).toBe(10);
    expect(b.state).toBe('hitstun');
    expect(b.kbx).toBeGreaterThan(0); // para longe de quem contra-atacou
    // a janela fecha depois de contra-atacar
    expect(moveFrame(a)).toBeGreaterThan(3 + 20);
    // e fica marcado quem ele pegou (o render toca o golpe devolvido)
    expect(a.moveHits).toBe(1 << b.id);
  });

  it('errar deixa exposto no recovery', () => {
    const a = onGround(0, COUNTER);
    const b = onGround(1, BASE_CHARACTER_ID, 60);
    b.facing = -1;
    run([a, b], [SPECIAL, 0]);
    run([a, b], [0, 0], 23);
    expect(moveFrame(a)).toBe(24);
    run([a, b], [0, Button.ATTACK]);
    run([a, b], [0, 0], 10);
    expect(a.damage).toBeGreaterThan(0);
    expect(b.damage).toBe(0);
    expect(a.moveHits).toBe(0);
  });

  it('devolve projétil: vira o dono e volta', () => {
    const a = onGround(0, COUNTER);
    run([a], [SPECIAL]);
    run([a], [0], 4);
    const shot = spawnProjectile(a, { ...shotDef(), offsetX: 0 });
    shot.owner = 1;
    shot.vx = -px(10);
    const shots = [shot];
    resolveProjectileHits([a], shots);
    expect(a.damage).toBe(0);
    expect(shots).toHaveLength(1);
    expect(shot.owner).toBe(0);
    expect(shot.vx).toBe(px(10));
    expect(a.moveHits).toBe(1 << 1);
  });
});

const GRABBER = character('t-grab', {
  name: 'Abraço',
  startup: 4,
  active: 6,
  recovery: 18,
  blocks: [
    {
      type: 'grab',
      box: { x: 40, y: 0, w: 50, h: 80 },
      holdTicks: 20,
      hit: { damage: 9, angle: 40, baseKnockback: 10, knockbackScale: 0.18 },
    },
  ],
});

/** Luta com os lutadores lado a lado no chão do mapa de teste, `gap` px entre os centros. */
function closeGame(characters: string[], gap = 60): GameState {
  const g = createGame({ characters, rules: { stocks: 3, timeLimitTicks: 0 } });
  for (const [i, f] of g.fighters.entries()) {
    f.x = px(-100 + i * gap) - f.w / 2;
    f.facing = i === 0 ? 1 : -1;
  }
  stepGame(g, []);
  stepGame(g, []);
  return g;
}

function steps(g: GameState, inputs: number[], ticks = 1): void {
  for (let i = 0; i < ticks; i++) stepGame(g, inputs);
}

describe('bloco agarrão', () => {
  it('agarra quem está na frente, segura e arremessa', () => {
    const g = closeGame([GRABBER, BASE_CHARACTER_ID]);
    const [a, b] = g.fighters as [Fighter, Fighter];
    steps(g, [SPECIAL, 0]);
    steps(g, [0, 0], 4);
    expect(b.state).toBe('grabbed');
    expect(b.grabbedBy).toBe(0);
    expect(a.grabTicks).toBeGreaterThan(0);
    // preso colado na frente
    expect(b.x).toBe(a.x + a.w);
    steps(g, [0, Button.ATTACK | Button.JUMP], 10);
    expect(b.state).toBe('grabbed');
    expect(b.damage).toBe(0);
    steps(g, [0, 0], 12);
    expect(b.state).toBe('hitstun');
    expect(b.grabbedBy).toBe(-1);
    expect(b.damage).toBe(9);
    expect(b.kbx).toBeGreaterThan(0);
    expect(a.grabTicks).toBe(0);
    expect(moveFrame(a)).toBeGreaterThan(4 + 6);
  });

  it('segurando, ←/→ escolhe para onde arremessar', () => {
    const g = closeGame([GRABBER, BASE_CHARACTER_ID]);
    const [a, b] = g.fighters as [Fighter, Fighter];
    steps(g, [SPECIAL, 0]);
    steps(g, [0, 0], 4);
    steps(g, [LEFT, 0], 3);
    expect(a.facing).toBe(-1);
    expect(b.x + b.w).toBe(a.x);
    steps(g, [0, 0], 30);
    expect(b.damage).toBe(9);
    expect(b.kbx).toBeLessThan(0);
  });

  it('quem segura leva golpe: o agarrado fica livre', () => {
    const g = closeGame([GRABBER, BASE_CHARACTER_ID, BASE_CHARACTER_ID], 60);
    const [a, b, c] = g.fighters as [Fighter, Fighter, Fighter];
    // c fica atrás de a, virado para ele
    c.x = a.x - px(60);
    c.facing = 1;
    steps(g, [SPECIAL, 0, 0]);
    steps(g, [0, 0, 0], 4);
    expect(b.state).toBe('grabbed');
    steps(g, [0, 0, Button.ATTACK]);
    steps(g, [0, 0, 0], 6);
    expect(a.state).toBe('hitstun');
    expect(b.state).not.toBe('grabbed');
    expect(b.grabbedBy).toBe(-1);
    expect(b.damage).toBe(0);
  });

  it('ganha do contra-ataque', () => {
    const g = closeGame([GRABBER, COUNTER]);
    const [a, b] = g.fighters as [Fighter, Fighter];
    steps(g, [0, SPECIAL]);
    steps(g, [SPECIAL, 0]);
    steps(g, [0, 0], 4);
    expect(b.state).toBe('grabbed');
    expect(a.damage).toBe(0);
  });
});

const COMBO_GRABBER = character('t-combo', {
  name: 'Combo',
  startup: 4,
  active: 4,
  recovery: 20,
  blocks: [
    {
      type: 'grab',
      box: { x: 40, y: 0, w: 50, h: 80 },
      holdTicks: 30,
      combo: { hits: 4, damage: 1 },
      hit: { damage: 7, angle: 40, baseKnockback: 10, knockbackScale: 0.18 },
    },
  ],
});

describe('agarrão com combo', () => {
  it('espalha os golpes por igual e não repete nenhum', () => {
    const at = Array.from({ length: 31 }, (_, t) => comboHitIndex(30, 4, t));
    expect(at.flatMap((n, t) => (n > 0 ? [[t, n]] : []))).toEqual([
      [6, 1],
      [12, 2],
      [18, 3],
      [24, 4],
    ]);
    expect(comboHitIndex(60, 9, 6)).toBe(1);
    expect(comboHitIndex(60, 9, 54)).toBe(9);
    expect(comboHitIndex(60, 9, 60)).toBe(0);
  });

  it('dá os golpes do combo sem soltar e fecha com o arremesso', () => {
    const g = closeGame([COMBO_GRABBER, BASE_CHARACTER_ID]);
    const [a, b] = g.fighters as [Fighter, Fighter];
    const events: GameEvent[] = [];
    steps(g, [SPECIAL, 0]);
    for (let i = 0; i < 50; i++) {
      stepGame(g, [0, 0]);
      events.push(...g.events);
      if (b.state === 'grabbed') {
        // sem knockback nem congelar durante o combo
        expect(b.kbx).toBe(0);
        expect(a.hitstop).toBe(0);
      }
    }
    const hits = events.filter((e) => e.type === 'hit');
    expect(hits.map((e) => [e.kind, e.combo, e.damage])).toEqual([
      ['combo', 1, 1],
      ['combo', 2, 1],
      ['combo', 3, 1],
      ['combo', 4, 1],
      ['throw', 5, 7],
    ]);
    expect(b.damage).toBe(11);
    expect(b.state).toBe('hitstun');
    expect(b.kbx).toBeGreaterThan(0);
  });

  it('quem segura leva golpe no meio do combo: solta e o combo para', () => {
    const g = closeGame([COMBO_GRABBER, BASE_CHARACTER_ID, BASE_CHARACTER_ID], 60);
    const [a, b, c] = g.fighters as [Fighter, Fighter, Fighter];
    c.x = a.x - px(60);
    c.facing = 1;
    // c pousa antes, para bater com o golpe do chão
    steps(g, [0, 0, 0], 30);
    steps(g, [SPECIAL, 0, 0]);
    steps(g, [0, 0, 0], 4 + 13);
    expect(b.state).toBe('grabbed');
    expect(b.damage).toBe(2);
    steps(g, [0, 0, Button.ATTACK]);
    steps(g, [0, 0, 0], 40);
    expect(a.damage).toBeGreaterThan(0);
    expect(b.grabbedBy).toBe(-1);
    expect(b.damage).toBeLessThan(5);
  });

  it('a ficha recusa um combo com mais golpes que ticks', () => {
    expect(() =>
      character('t-combo-ruim', {
        name: 'Ruim',
        startup: 4,
        active: 4,
        recovery: 20,
        blocks: [
          {
            type: 'grab',
            box: { x: 40, y: 0, w: 50, h: 80 },
            holdTicks: 5,
            combo: { hits: 5, damage: 1 },
            hit,
          },
        ],
      }),
    ).toThrow(/combo/);
  });
});
