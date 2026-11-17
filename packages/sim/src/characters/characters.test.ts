import { describe, expect, it } from 'vitest';
import { resolveHits } from '../combat';
import { createFighter, hasAura, stepFighter, type Fighter } from '../fighter';
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
  it('Schummaki, João Frango, Dadazinho, Tauba, Tchula, Crocko, Darllan, Gabs, Marília, Meia, Igão e Thom4o, cada um com especial e provocação', () => {
    expect(PLAYABLE_CHARACTERS).toEqual([
      'schummaki',
      'joao-frango',
      'dadazinho',
      'tauba',
      'tchula',
      'crocko',
      'darllan',
      'gabs',
      'marilia',
      'meia',
      'igao',
      'thom4o',
    ]);
    for (const c of [
      SCHUMMAKI,
      JOAO,
      DADA,
      TAUBA,
      TCHULA,
      CROCKO,
      DARLLAN,
      getCharacter('gabs'),
      getCharacter('marilia'),
      getCharacter('meia'),
      getCharacter('igao'),
      getCharacter('thom4o'),
    ]) {
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

  it('Dadazinho pune de perto: tiro curto, forte e lento; leve e rápido', () => {
    const shot = DADA.special?.move.projectile;
    const chicken = JOAO.special?.move.projectile;
    if (!shot || !chicken) throw new Error('sem projétil');
    // alcance: velocidade × duração
    expect(shot.speed * shot.lifetimeTicks).toBeLessThan(
      (chicken.speed * chicken.lifetimeTicks) / 2,
    );
    // forte: bem mais que o frango (que subiu para 8%, na 2ª rodada de balanceamento)
    expect(shot.hit.damage).toBeGreaterThan(chicken.hit.damage * 1.5);
    expect(DADA.special?.move.startup).toBeGreaterThan(JOAO.special?.move.startup ?? 0);
    expect(DADA.special?.cooldownTicks).toBeGreaterThan(JOAO.special?.cooldownTicks ?? 0);
    expect(DADA.stats.weight).toBeLessThan(100);
    expect(DADA.stats.walkSpeed).toBeGreaterThan(JOAO.stats.walkSpeed);
    expect(DADA.stats.height).toBe(JOAO.stats.height);
  });

  it('Tauba foge: some e reaparece na ponta do palco, sem bater; recarga longa', () => {
    const special = TAUBA.special;
    expect(special?.move.teleport?.edge).toEqual({ inset: px(60) });
    expect(special?.move.teleport?.random).toBeUndefined();
    expect(special?.move.hitboxes).toEqual([]);
    expect(special?.move.projectile).toBeUndefined();
    expect(special?.oncePerAir).toBe(true);
    expect(special?.cooldownTicks).toBe(300);
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

  it('Crocko espera vir: contra-ataque de 1 s, forte, com recarga; alto, pesado e de braço comprido', () => {
    const special = CROCKO.special;
    const base = getCharacter('base');
    if (!special?.move.counter) throw new Error('sem contra-ataque');
    // entra rápido na pose, espera 1 s e, se ninguém bater, fica exposto
    expect(special.move.startup).toBeLessThanOrEqual(8);
    expect(special.move.active).toBe(60);
    expect(special.move.recovery).toBeGreaterThanOrEqual(20);
    // não vira escudo: a janela fica aberta no máximo metade do tempo, e sobra um
    // respiro sem contra-ataque depois de cada uso
    expect(special.move.active * 2).toBeLessThanOrEqual(special.cooldownTicks);
    expect(special.cooldownTicks).toBeGreaterThan(
      special.move.startup + special.move.active + special.move.recovery + 20,
    );
    // só o contra-ataque: nada de hitbox ou projétil próprio
    expect(special.move.hitboxes).toEqual([]);
    expect(special.move.projectile).toBeUndefined();
    expect(special.move.counter.damage).toBeGreaterThanOrEqual(12);
    for (const c of [JOAO, DADA, TAUBA, TCHULA]) {
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
      expect(target.damage).toBe(13);
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
      expect(GABS.stats.height).toBe(DADA.stats.height);
      expect(GABS.stats.height).toBeGreaterThan(TAUBA.stats.height);
      expect(GABS.special?.move.knockbackDir).toBe('away');
    });
  });

  describe('Marília', () => {
    const MARILIA = getCharacter('marilia');
    const floor: Solid[] = [{ kind: 'solid', x: px(-2000), y: 0, w: px(4000), h: px(500) }];
    const run = (fs: Fighter[], inputs: number[], ticks = 1) => {
      for (let t = 0; t < ticks; t++) {
        for (const f of fs) stepFighter(f, inputs[f.id] ?? 0, floor);
        resolveHits(fs);
      }
    };
    /** Marília no chão e um adversário colado olhando para ela. */
    const setup = () => {
      const marilia = createFighter(0, { x: 0, y: 0 }, 'marilia');
      const foe = createFighter(1, { x: 0, y: 0 }, 'base');
      run([marilia, foe], [0, 0], 2);
      marilia.facing = 1;
      foe.facing = -1;
      foe.x = marilia.x + marilia.w / 2 + px(50) - foe.w / 2;
      return { marilia, foe };
    };

    it('jogável, com especial e provocação', () => {
      expect(PLAYABLE_CHARACTERS).toContain('marilia');
      expect(MARILIA.special?.name).toBe('Tragadinha');
      expect(MARILIA.taunt.text).toBe('Gentiii!');
      expect(MARILIA.blurb.length).toBeGreaterThan(0);
    });

    /** O soco lateral do lutador base (8%) na Marília, que está parada. */
    const sideLight = (marilia: Fighter, foe: Fighter) => {
      run([marilia, foe], [0, Button.ATTACK | Button.LEFT]);
      run([marilia, foe], [0, 0], 30);
    };

    it('com a aura, leva o golpe (knockback) mas só 60% do dano; quando ela acaba, dano inteiro', () => {
      const { marilia, foe } = setup();
      run([marilia, foe], [Button.SPECIAL, 0]);
      run([marilia, foe], [0, 0], 40);
      expect(marilia.buffTicks).toBeGreaterThan(0);
      expect(hasAura(marilia)).toBe(false);
      const x0 = marilia.x;
      sideLight(marilia, foe);
      // 8% × 60% = 4,8 → 4%, e foi arremessada para longe do golpe
      expect(marilia.damage).toBe(4);
      expect(marilia.x).toBeLessThan(x0 - px(20));
      // a aura dura 350 ticks (quase 6 s)
      run([marilia, foe], [0, 0], 350);
      expect(marilia.buffTicks).toBe(0);
      const before = marilia.damage;
      foe.x = marilia.x + marilia.w / 2 + px(50) - foe.w / 2;
      sideLight(marilia, foe);
      expect(marilia.damage - before).toBe(8);
    });

    it('vulnerável no startup: apanhando, a aura não liga', () => {
      const { marilia, foe } = setup();
      run([marilia, foe], [Button.SPECIAL, 0], 1);
      run([marilia, foe], [0, Button.ATTACK]);
      run([marilia, foe], [0, 0], 60);
      expect(marilia.damage).toBeGreaterThan(0);
      expect(marilia.buffTicks).toBe(0);
    });

    it('baixinha, leve, rápida no chão e golpes um pouco mais fracos', () => {
      const base = getCharacter('base');
      expect(MARILIA.stats.height).toBe(TAUBA.stats.height);
      expect(MARILIA.stats.weight).toBeLessThan(base.stats.weight);
      expect(MARILIA.stats.walkSpeed).toBeGreaterThan(base.stats.walkSpeed);
      expect(MARILIA.stats.jumpHeight).toBeGreaterThan(base.stats.jumpHeight);
      expect(MARILIA.moves.sideAir.damage).toBeLessThan(base.moves.sideAir.damage);
      expect(MARILIA.special?.cooldownTicks).toBe(450);
    });
  });

  describe('Meia', () => {
    const MEIA = getCharacter('meia');
    /** Meia e um alvo no chão do mapa de teste, com os centros a `gap` px. */
    const setup = (gap: number) => {
      const g = createGame({
        characters: ['meia', 'base'],
        rules: { stocks: 3, timeLimitTicks: 0 },
      });
      const [meia, foe] = g.fighters as [Fighter, Fighter];
      stepGame(g, [0, 0]);
      for (let i = 0; i < 40; i++) stepGame(g, [0, 0]);
      meia.x = px(-100) - meia.w / 2;
      foe.x = meia.x + meia.w / 2 + px(gap) - foe.w / 2;
      meia.facing = 1;
      foe.facing = -1;
      stepGame(g, [0, 0]);
      return { g, meia, foe };
    };
    const hitsOf = (g: ReturnType<typeof createGame>, ticks: number) => {
      const hits: { kind: string; combo?: number; knockback: number }[] = [];
      for (let i = 0; i < ticks; i++) {
        stepGame(g, [0, 0]);
        for (const e of g.events) if (e.type === 'hit') hits.push(e);
      }
      return hits;
    };

    it('jogável, com especial e provocação', () => {
      expect(PLAYABLE_CHARACTERS).toContain('meia');
      expect(MEIA.special?.name).toBe('Comando');
      expect(MEIA.special?.move.grab?.combo).toEqual({ hits: 4, damage: 2 });
      expect(MEIA.special?.move.grab?.holdTicks).toBe(30);
      expect(MEIA.taunt.text).toBe('Vem!');
      expect(MEIA.blurb.length).toBeGreaterThan(0);
    });

    it('colado, pega e solta o combo: 5 golpes e 15%', () => {
      const { g, foe } = setup(56);
      stepGame(g, [Button.SPECIAL, 0]);
      const hits = hitsOf(g, 90);
      expect(hits.map((h) => h.combo)).toEqual([1, 2, 3, 4, 5]);
      expect(hits.at(-1)?.kind).toBe('throw');
      expect(foe.damage).toBe(15);
      expect(hits.at(-1)?.knockback).toBeGreaterThan(0);
    });

    it('alcance curto: de longe erra e fica exposto no recovery', () => {
      const { g, meia, foe } = setup(110);
      stepGame(g, [Button.SPECIAL, 0]);
      const hits = hitsOf(g, 30);
      expect(hits).toEqual([]);
      expect(foe.state).not.toBe('grabbed');
      // ainda no recovery do especial
      expect(meia.state).toBe('attack');
      expect(meia.move).toBe('special');
    });

    it('leve, rápido, golpes base mais rápidos e mais fracos', () => {
      const base = getCharacter('base');
      expect(MEIA.stats.height).toBe(getCharacter('gabs').stats.height);
      expect(MEIA.stats.width).toBeLessThan(base.stats.width);
      expect(MEIA.stats.weight).toBeLessThan(base.stats.weight);
      expect(MEIA.stats.walkSpeed).toBeGreaterThan(base.stats.walkSpeed);
      // o Schummaki continua o mais rápido no chão
      expect(MEIA.stats.walkSpeed).toBeLessThan(SCHUMMAKI.stats.walkSpeed);
      expect(MEIA.stats.dashSpeed).toBeLessThan(SCHUMMAKI.stats.dashSpeed);
      for (const id of ['neutralLight', 'sideLight', 'sideAir'] as const) {
        expect(MEIA.moves[id].startup).toBeLessThan(base.moves[id].startup);
        expect(MEIA.moves[id].damage).toBeLessThan(base.moves[id].damage);
      }
    });
  });

  describe('Igão', () => {
    const IGAO = getCharacter('igao');
    /**
     * Igão saca da ponta esquerda do chão do mapa de teste, com o outro lutador fora do
     * caminho (na plataforma da direita); devolve os quiques e quanto a bola andou.
     */
    const serve = () => {
      const g = createGame({
        characters: ['igao', 'base'],
        rules: { stocks: 3, timeLimitTicks: 0 },
      });
      const [igao, other] = g.fighters as [Fighter, Fighter];
      for (let i = 0; i < 41; i++) stepGame(g, [0, 0]);
      other.x = px(265) - other.w / 2;
      other.y = px(-150) - other.h;
      igao.x = px(-400) - igao.w / 2;
      igao.facing = 1;
      stepGame(g, [Button.SPECIAL, 0]);
      const bounces: { x: number; peak: number }[] = [];
      let startX: number | null = null;
      let endX = 0;
      let peak = 0;
      for (let i = 0; i < 140; i++) {
        stepGame(g, [0, 0]);
        const p = g.projectiles[0];
        if (p) {
          startX ??= p.x;
          endX = p.x;
          if (bounces.length > 0) peak = Math.max(peak, -(p.y + p.h));
        }
        for (const e of g.events) {
          if (e.type !== 'bounce') continue;
          const last = bounces.at(-1);
          if (last) last.peak = peak;
          bounces.push({ x: e.x, peak: 0 });
          peak = 0;
        }
      }
      const last = bounces.at(-1);
      if (last) last.peak = peak;
      return { g, igao, bounces, travel: endX - (startX ?? 0) };
    };

    it('jogável, com especial e provocação', () => {
      expect(PLAYABLE_CHARACTERS).toContain('igao');
      expect(IGAO.special?.name).toBe('Saque');
      expect(IGAO.special?.move.projectile?.bounces).toBe(4);
      expect(IGAO.taunt.text).toBe('Cê tá miolo né nê?');
      expect(IGAO.blurb.length).toBeGreaterThan(0);
    });

    it('a bola sai para baixo e para a frente e quica 4 vezes, cada vez mais baixo', () => {
      const { bounces, travel } = serve();
      expect(bounces).toHaveLength(4);
      const peaks = bounces.map((b) => b.peak) as [number, number, number, number];
      const [first, second, third, fourth] = peaks;
      // o 1º não passa por cima de quem está parado (os mais baixos têm 90 px)
      const shortest = Math.min(...PLAYABLE_CHARACTERS.map((id) => getCharacter(id).stats.height));
      expect(shortest).toBe(px(90));
      expect(first).toBeGreaterThan(px(65));
      expect(first).toBeLessThan(shortest);
      expect(second).toBeLessThan(first);
      expect(third).toBeLessThan(second);
      expect(fourth).toBeLessThan(third);
      expect(fourth).toBeLessThan(px(25));
      // anda quase o palco inteiro
      expect(travel).toBeGreaterThan(px(700));
      expect(travel).toBeLessThan(px(900));
    });

    it('acerta quem está em pé no caminho', () => {
      const g = createGame({
        characters: ['igao', 'base'],
        rules: { stocks: 3, timeLimitTicks: 0 },
      });
      const [igao, foe] = g.fighters as [Fighter, Fighter];
      for (let i = 0; i < 41; i++) stepGame(g, [0, 0]);
      igao.x = px(-300) - igao.w / 2;
      foe.x = px(0) - foe.w / 2;
      igao.facing = 1;
      stepGame(g, [Button.SPECIAL, 0]);
      for (let i = 0; i < 90 && foe.damage === 0; i++) stepGame(g, [0, 0]);
      expect(foe.damage).toBe(11);
      expect(foe.kbx).toBeGreaterThan(0);
    });

    it.each([150, 300, 500])(
      'o Crocko no contra-ataque a %i px devolve a bola, que volta e acerta o Igão parado',
      (gap) => {
        const g = createGame({
          characters: ['igao', 'crocko'],
          rules: { stocks: 3, timeLimitTicks: 0 },
        });
        const [igao, crocko] = g.fighters as [Fighter, Fighter];
        for (let i = 0; i < 41; i++) stepGame(g, [0, 0]);
        igao.x = px(-300) - igao.w / 2;
        crocko.x = px(-300 + gap) - crocko.w / 2;
        igao.facing = 1;
        crocko.facing = -1;
        stepGame(g, [Button.SPECIAL, 0]);
        const reflects: { fighter: number; from: number }[] = [];
        let countering = false;
        for (let i = 0; i < 400 && igao.damage === 0; i++) {
          // o Crocko entra no contra-ataque quando a bola está chegando
          const p = g.projectiles[0];
          const near = p !== undefined && p.owner === 0 && crocko.x - (p.x + p.w) < px(120);
          stepGame(g, [0, near && !countering ? Button.SPECIAL : 0]);
          if (near) countering = true;
          for (const e of g.events) if (e.type === 'reflect') reflects.push(e);
        }
        expect(reflects).toEqual([expect.objectContaining({ fighter: 1, from: 0 })]);
        expect(crocko.damage).toBe(0);
        expect(igao.damage).toBe(11);
      },
    );

    it('a 2ª bola só sai depois de a 1ª quicar 3 vezes', () => {
      const g = createGame({
        characters: ['igao', 'base'],
        rules: { stocks: 3, timeLimitTicks: 0 },
      });
      const [igao, other] = g.fighters as [Fighter, Fighter];
      for (let i = 0; i < 41; i++) stepGame(g, [0, 0]);
      other.x = px(265) - other.w / 2;
      other.y = px(-150) - other.h;
      igao.x = px(-400) - igao.w / 2;
      igao.facing = 1;
      let bounces = 0;
      let bouncesAtSecond = -1;
      for (let i = 0; i < 200 && bouncesAtSecond < 0; i++) {
        // aperta o especial de novo a cada 2 ticks: sai assim que recarregar
        stepGame(g, [i % 2 === 0 ? Button.SPECIAL : 0, 0]);
        for (const e of g.events) if (e.type === 'bounce') bounces++;
        if (g.projectiles.length > 1) bouncesAtSecond = bounces;
      }
      expect(bouncesAtSecond).toBeGreaterThanOrEqual(3);
    });

    it('o pulo mais alto e o mais alto do elenco, junto com o Schummaki; aéreos com mais alcance', () => {
      const base = getCharacter('base');
      for (const id of PLAYABLE_CHARACTERS) {
        if (id === 'igao') continue;
        const c = getCharacter(id);
        expect(IGAO.stats.jumpHeight).toBeGreaterThan(c.stats.jumpHeight);
        expect(IGAO.stats.airJumpHeight).toBeGreaterThan(c.stats.airJumpHeight);
        expect(IGAO.stats.height).toBeGreaterThanOrEqual(c.stats.height);
      }
      expect(IGAO.stats.height).toBe(SCHUMMAKI.stats.height);
      expect(IGAO.stats.weight).toBe(base.stats.weight);
      expect(IGAO.stats.walkSpeed).toBeLessThan(base.stats.walkSpeed);
      expect(IGAO.moves.downAir.damage).toBeGreaterThan(base.moves.downAir.damage);
      for (const id of ['neutralAir', 'sideAir', 'downAir'] as const) {
        const reach = (m: typeof base.moves.sideAir) =>
          Math.max(...m.hitboxes.flatMap((w) => w.boxes.map((b) => b.x + b.w)));
        expect(reach(IGAO.moves[id])).toBeGreaterThan(reach(base.moves[id]));
      }
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
