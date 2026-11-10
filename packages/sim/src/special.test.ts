import { describe, expect, it } from 'vitest';
import { defineCharacter, type CharacterSheet } from './character';
import { BASE_CHARACTER_ID, getCharacter, registerCharacter } from './characters';
import { resolveHits, resolveProjectileHits } from './combat';
import { px } from './constants';
import { canUseSpecial, createFighter, moveFrame, stepFighter, type Fighter } from './fighter';
import { createGame, stepGame } from './game';
import { Button } from './input';
import type { ProjectileDef } from './moves';
import type { Solid } from './physics';
import { spawnProjectile, stepProjectiles, type Projectile } from './projectile';

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
