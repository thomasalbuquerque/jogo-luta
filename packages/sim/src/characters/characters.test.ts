import { describe, expect, it } from 'vitest';
import { resolveHits } from '../combat';
import { createFighter, stepFighter, type Fighter } from '../fighter';
import { createGame, stepGame } from '../game';
import type { Solid } from '../physics';
import { cloneState } from '../snapshot';
import { px } from '../constants';
import { Button } from '../input';
import { getCharacter, PLAYABLE_CHARACTERS } from './index';

const [SCHUMMAKI, JOAO, DADA, TAUBA, TCHULA, CROCKO, DARLLAN] =
  PLAYABLE_CHARACTERS.map(getCharacter);
if (!SCHUMMAKI || !JOAO || !DADA || !TAUBA || !TCHULA || !CROCKO || !DARLLAN)
  throw new Error('elenco incompleto');

describe('elenco', () => {
  it('Schummaki, João Frango, Dadazinho, Tauba, Tchula, Crocko, Darllan e Gabs, cada um com especial e provocação', () => {
    expect(PLAYABLE_CHARACTERS).toEqual([
      'schummaki',
      'joao-frango',
      'dadazinho',
      'tauba',
      'tchula',
      'crocko',
      'darllan',
      'gabs',
    ]);
    for (const c of [SCHUMMAKI, JOAO, DADA, TAUBA, TCHULA, CROCKO, DARLLAN, getCharacter('gabs')]) {
      expect(c.special).not.toBeNull();
      expect(c.taunt.text.length).toBeGreaterThan(0);
      expect(c.blurb.length).toBeGreaterThan(0);
    }
  });

  it('Schummaki vai para cima: investida, mais rápido no chão e mais pesado', () => {
    expect(SCHUMMAKI.special?.move.dash).toBeDefined();
    expect(SCHUMMAKI.special?.oncePerAir).toBe(true);
    expect(SCHUMMAKI.stats.walkSpeed).toBeGreaterThan(JOAO.stats.walkSpeed);
    expect(SCHUMMAKI.stats.weight).toBeGreaterThan(100);
  });

  it('João Frango controla de longe: projétil, leve e melhor no ar', () => {
    expect(JOAO.special?.move.projectile).toBeDefined();
    expect(JOAO.special?.cooldownTicks).toBeGreaterThan(0);
    expect(JOAO.stats.weight).toBeLessThan(100);
    expect(JOAO.stats.airJumps).toBeGreaterThan(SCHUMMAKI.stats.airJumps);
    expect(JOAO.stats.airSpeed).toBeGreaterThan(SCHUMMAKI.stats.airSpeed);
  });

  it('Dadazinho pune de perto: tiro curto, forte e lento; leve, rápido e baixinho', () => {
    const shot = DADA.special?.move.projectile;
    const chicken = JOAO.special?.move.projectile;
    if (!shot || !chicken) throw new Error('sem projétil');
    // alcance: velocidade × duração
    expect(shot.speed * shot.lifetimeTicks).toBeLessThan(
      (chicken.speed * chicken.lifetimeTicks) / 2,
    );
    expect(shot.hit.damage).toBeGreaterThan(chicken.hit.damage * 2);
    expect(DADA.special?.move.startup).toBeGreaterThan(JOAO.special?.move.startup ?? 0);
    expect(DADA.special?.cooldownTicks).toBeGreaterThan(JOAO.special?.cooldownTicks ?? 0);
    expect(DADA.stats.weight).toBeLessThan(100);
    expect(DADA.stats.walkSpeed).toBeGreaterThan(JOAO.stats.walkSpeed);
    expect(DADA.stats.height).toBeLessThan(JOAO.stats.height);
  });

  it('Tauba foge: some e reaparece num lugar sorteado, sem bater; recarga longa', () => {
    const special = TAUBA.special;
    expect(special?.move.teleport?.random).toEqual({ candidates: 3, nearChance: 25 });
    expect(special?.move.hitboxes).toEqual([]);
    expect(special?.move.projectile).toBeUndefined();
    expect(special?.oncePerAir).toBe(true);
    expect(special?.cooldownTicks).toBeGreaterThanOrEqual(240);
    expect(TAUBA.stats.weight).toBeLessThan(100);
    expect(TAUBA.stats.weight).toBeGreaterThan(DADA.stats.weight);
    // golpes do moveset base, sem ajuste
    expect(TAUBA.moves.sideLight).toBe(getCharacter('base').moves.sideLight);
  });

  it('Tchula pune de longe: tiro rápido, fino e forte que atravessa o palco; pesado e lento', () => {
    const special = TCHULA.special;
    const shot = special?.move.projectile;
    const pellets = DADA.special?.move.projectile;
    const chicken = JOAO.special?.move.projectile;
    if (!special || !shot || !pellets || !chicken) throw new Error('sem projétil');
    // atravessa o palco de 900 px, reto e sem cair
    expect(shot.speed * shot.lifetimeTicks).toBeGreaterThan(px(900));
    expect(shot.launchAngle).toBe(0);
    expect(shot.gravity).toBe(0);
    expect(shot.speed).toBeGreaterThan(chicken.speed * 3);
    // fino: dá para desviar pulando ou abaixando; comprido: não atravessa a hurtbox sem acertar
    expect(shot.h).toBeLessThan(TCHULA.stats.height / 4);
    expect(shot.w).toBeGreaterThan(shot.speed);
    // mata de longe: mais dano que a doze, e bem telegrafado (mira e recarga longas)
    expect(shot.hit.damage).toBeGreaterThan(pellets.hit.damage);
    expect(special.move.startup).toBeGreaterThan(DADA.special?.move.startup ?? 0);
    expect(special.cooldownTicks).toBeGreaterThanOrEqual(150);
    // braço de mecânico: pesado e lento
    expect(TCHULA.stats.weight).toBeGreaterThan(100);
    expect(TCHULA.stats.walkSpeed).toBeLessThan(getCharacter('base').stats.walkSpeed);
    expect(TCHULA.stats.airSpeed).toBeLessThan(getCharacter('base').stats.airSpeed);
    expect(TCHULA.moves.sideLight.damage).toBeGreaterThan(
      getCharacter('base').moves.sideLight.damage,
    );
  });

  it('Crocko espera vir: contra-ataque curto e forte com recarga; o mais alto, pesado e de braço comprido', () => {
    const special = CROCKO.special;
    const base = getCharacter('base');
    if (!special?.move.counter) throw new Error('sem contra-ataque');
    // entra rápido na pose, espera ~1/3 s e, se ninguém bater, fica exposto
    expect(special.move.startup).toBeLessThanOrEqual(8);
    expect(special.move.active).toBeGreaterThanOrEqual(15);
    expect(special.move.recovery).toBeGreaterThan(special.move.active);
    // não vira escudo infinito
    expect(special.cooldownTicks).toBeGreaterThan(
      special.move.startup + special.move.active + special.move.recovery,
    );
    // só o contra-ataque: nada de hitbox ou projétil próprio
    expect(special.move.hitboxes).toEqual([]);
    expect(special.move.projectile).toBeUndefined();
    expect(special.move.counter.damage).toBeGreaterThanOrEqual(12);
    for (const c of [SCHUMMAKI, JOAO, DADA, TAUBA, TCHULA]) {
      expect(CROCKO.stats.height).toBeGreaterThan(c.stats.height);
    }
    expect(CROCKO.stats.weight).toBeGreaterThan(100);
    expect(CROCKO.stats.walkSpeed).toBeLessThan(base.stats.walkSpeed);
    expect(CROCKO.moves.sideLight.hitboxes[0]?.boxes[0]?.w).toBeGreaterThan(
      base.moves.sideLight.hitboxes[0]?.boxes[0]?.w ?? Infinity,
    );
  });

  it('Darllan bate em volta: área dos dois lados, lenta de sair e de voltar; o mais pesado', () => {
    const special = DARLLAN.special;
    const base = getCharacter('base');
    if (!special) throw new Error('sem especial');
    const { move } = special;
    // o rolo subindo avisa; quem esquivar pune
    expect(move.startup).toBeGreaterThanOrEqual(15);
    expect(move.active).toBeLessThanOrEqual(8);
    expect(move.recovery).toBeGreaterThan(move.startup);
    expect(special.cooldownTicks).toBeGreaterThan(move.startup + move.active);
    // a área: centrada no corpo, da cintura para baixo, ~80 px de cada lado
    const box = move.hitboxes[0]?.boxes[0];
    if (!box) throw new Error('sem hitbox');
    expect(box.x).toBe(0);
    expect(box.w - DARLLAN.stats.width).toBeGreaterThanOrEqual(px(150));
    expect(box.y).toBeGreaterThan(0);
    expect(move.knockbackDir).toBe('away');
    expect(move.damage).toBeGreaterThanOrEqual(14);
    expect(move.dash).toBeUndefined();
    expect(move.projectile).toBeUndefined();
    for (const c of [SCHUMMAKI, JOAO, DADA, TAUBA, TCHULA, CROCKO]) {
      expect(DARLLAN.stats.weight).toBeGreaterThan(c.stats.weight);
      expect(DARLLAN.stats.walkSpeed).toBeLessThan(c.stats.walkSpeed);
      expect(DARLLAN.stats.jumpHeight).toBeLessThan(c.stats.jumpHeight);
    }
    expect(DARLLAN.stats.height).toBe(CROCKO.stats.height);
    expect(DARLLAN.moves.sideLight.damage).toBeGreaterThan(base.moves.sideLight.damage);
  });

  describe('Gabs', () => {
    const GABS = getCharacter('gabs');
    const floor: Solid[] = [{ kind: 'solid', x: px(-2000), y: 0, w: px(4000), h: px(500) }];
    const run = (fs: Fighter[], inputs: number[], ticks = 1) => {
      for (let t = 0; t < ticks; t++) {
        for (const f of fs) stepFighter(f, inputs[f.id] ?? 0, floor);
        resolveHits(fs);
      }
    };
    /** Gabs no chão olhando para a direita e um alvo com o centro a `gap` px do dele. */
    const setup = (gap: number) => {
      const gabs = createFighter(0, { x: 0, y: 0 }, 'gabs');
      const target = createFighter(1, { x: 0, y: 0 }, 'base');
      run([gabs, target], [0, 0], 2);
      gabs.facing = 1;
      target.x = gabs.x + gabs.w / 2 + px(gap) - target.w / 2;
      run([gabs, target], [Button.SPECIAL, 0]);
      run([gabs, target], [0, 0], 24);
      return target;
    };

    it('jogável, com especial e provocação', () => {
      expect(PLAYABLE_CHARACTERS).toContain('gabs');
      expect(GABS.special?.name).toBe('Controle na mão');
      expect(GABS.taunt.text.length).toBeGreaterThan(0);
      expect(GABS.blurb.length).toBeGreaterThan(0);
    });

    it('o bonequinho acerta a média distância e arremessa para a frente', () => {
      const target = setup(150);
      expect(target.damage).toBe(11);
      expect(target.kbx).toBeGreaterThan(0);
    });

    it('não acerta quem está colado nem quem está atrás', () => {
      expect(setup(60).damage).toBe(0);
      expect(setup(-150).damage).toBe(0);
    });

    it('altura média, um pouco pesado e lento no chão', () => {
      const base = getCharacter('base');
      expect(GABS.stats.weight).toBeGreaterThan(base.stats.weight);
      expect(GABS.stats.weight).toBeLessThan(DARLLAN.stats.weight);
      expect(GABS.stats.walkSpeed).toBeLessThan(base.stats.walkSpeed);
      expect(GABS.stats.height).toBeLessThan(CROCKO.stats.height);
      expect(GABS.stats.height).toBeGreaterThan(DADA.stats.height);
      expect(GABS.special?.move.knockbackDir).toBe('away');
    });
  });

  it.each(PLAYABLE_CHARACTERS)('%s alcança a plataforma atravessável com 1 pulo', (id) => {
    const g = createGame({ characters: [id, id] });
    stepGame(g, [0, 0]);
    for (let i = 0; i < 30; i++) stepGame(g, [Button.JUMP, 0]);
    for (let i = 0; i < 90; i++) stepGame(g, [0, 0]);
    expect(g.fighters[0]?.onPlatform).toBe(true);
  });

  it('uma luta com inputs pseudoaleatórios roda igual duas vezes', () => {
    const play = () => {
      const g = createGame({ characters: [...PLAYABLE_CHARACTERS] });
      let seed = 12345;
      const next = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed % 512;
      };
      for (let t = 0; t < 3000; t++) stepGame(g, [next(), next()]);
      return g;
    };
    const a = play();
    const b = play();
    expect(cloneState(a)).toEqual(cloneState(b));
    expect(a.fighters.some((f) => f.damage > 0 || f.stocks < 3)).toBe(true);
  });
});
