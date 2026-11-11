import { describe, expect, it } from 'vitest';
import { animationId, defineCharacter, type CharacterSheet } from './character';
import { BASE_CHARACTER_ID, getCharacter, registerCharacter } from './characters';
import { px } from './constants';
import { createFighter } from './fighter';
import { MOVES } from './moves';
import { DEFAULT_STATS } from './stats';

/** Ficha mínima válida, com os ajustes do teste por cima. */
function sheet(extra: Partial<CharacterSheet> = {}): CharacterSheet {
  return {
    id: 'teste',
    name: 'Teste',
    colors: { primary: '#112233', secondary: '#ffeedd' },
    stats: {
      weight: 100,
      walkSpeed: 6.5,
      airSpeed: 5.5,
      jumpHeight: 175,
      airJumps: 1,
      hurtbox: { w: 48, h: 96 },
    },
    taunt: { text: 'Opa!', sound: 'teste_bordao', animation: 'teste_taunt' },
    ...extra,
  };
}

describe('ficha de personagem', () => {
  it('o boneco de teste usa os números padrão e o moveset base sem cópia', () => {
    const base = getCharacter(BASE_CHARACTER_ID);
    expect(base.stats).toEqual(DEFAULT_STATS);
    expect(base.moves.sideAir).toBe(MOVES.sideAir);
    expect(base.special).toBeNull();
  });

  it('converte px para subpx e completa o que falta com o padrão', () => {
    const c = defineCharacter(
      sheet({
        stats: {
          weight: 120,
          walkSpeed: 7.25,
          airSpeed: 5,
          jumpHeight: 150,
          airJumps: 2,
          hurtbox: { w: 52, h: 100 },
          gravity: 0.7,
        },
      }),
    );
    expect(c.stats.weight).toBe(120);
    expect(c.stats.walkSpeed).toBe(725);
    expect(c.stats.width).toBe(px(52));
    expect(c.stats.height).toBe(px(100));
    expect(c.stats.airJumps).toBe(2);
    expect(c.stats.gravity).toBe(px(0.7));
    // pulo aéreo sem valor = 80% do pulo do chão
    expect(c.stats.airJumpHeight).toBe(px(120));
    expect(c.stats.maxFallSpeed).toBe(DEFAULT_STATS.maxFallSpeed);
    expect(c.taunt.durationTicks).toBe(60);
  });

  it('recusa campo desconhecido (erro de digitação) com mensagem legível', () => {
    const bad = sheet();
    (bad.stats as Record<string, unknown>).wieght = 90;
    expect(() => defineCharacter(bad)).toThrow(/Ficha inválida \(teste\)[\s\S]*wieght/);
  });

  it('recusa números fora da faixa e cor inválida', () => {
    const heavy = sheet();
    heavy.stats.weight = 500;
    expect(() => defineCharacter(heavy)).toThrow(/weight/);
    expect(() =>
      defineCharacter(sheet({ colors: { primary: 'azul', secondary: '#000000' } })),
    ).toThrow(/rrggbb/);
  });

  it('ajuste de golpe muda só o que a ficha diz', () => {
    const c = defineCharacter(sheet({ moves: { sideLight: { damage: 10, baseKnockback: 9.5 } } }));
    expect(c.moves.sideLight.damage).toBe(10);
    expect(c.moves.sideLight.baseKnockback).toBe(px(9.5));
    expect(c.moves.sideLight.knockbackScale).toBe(MOVES.sideLight.knockbackScale);
    expect(c.moves.sideLight.hitboxes).toEqual(MOVES.sideLight.hitboxes);
    expect(c.moves.neutralLight).toBe(MOVES.neutralLight);
  });

  it('mudar o startup desloca hitboxes e impulso', () => {
    const c = defineCharacter(sheet({ moves: { sideLight: { startup: 5 } } }));
    const m = c.moves.sideLight;
    const base = MOVES.sideLight;
    expect(m.hitboxes[0]?.from).toBe((base.hitboxes[0]?.from ?? 0) - 2);
    expect(m.hitboxes[0]?.to).toBe((base.hitboxes[0]?.to ?? 0) - 2);
    expect(m.impulse?.frame).toBe((base.impulse?.frame ?? 0) - 2);
  });

  it('mudar o active corta ou estica a última janela de hitbox', () => {
    const short = defineCharacter(sheet({ moves: { sideAir: { active: 2 } } })).moves.sideAir;
    expect(short.hitboxes).toHaveLength(1);
    expect(short.hitboxes[0]?.to).toBe(short.startup + 2);
    const long = defineCharacter(sheet({ moves: { sideAir: { active: 6 } } })).moves.sideAir;
    expect(long.hitboxes).toHaveLength(2);
    expect(long.hitboxes[1]?.to).toBe(long.startup + 6);
  });

  it('reach escala o alcance horizontal das hitboxes', () => {
    const m = defineCharacter(sheet({ moves: { neutralLight: { reach: 150 } } })).moves
      .neutralLight;
    const [box] = m.hitboxes[0]?.boxes ?? [];
    const [baseBox] = MOVES.neutralLight.hitboxes[0]?.boxes ?? [];
    expect(box?.x).toBe(((baseBox?.x ?? 0) * 3) / 2);
    expect(box?.w).toBe(((baseBox?.w ?? 0) * 3) / 2);
    expect(box?.h).toBe(baseBox?.h);
  });

  it('id de animação: o da ficha ou <id>_<chave>', () => {
    const c = defineCharacter(sheet({ id: 'joao-teste', animations: { idle: 'joao_parado' } }));
    expect(animationId(c, 'idle')).toBe('joao_parado');
    expect(animationId(c, 'run')).toBe('joao_teste_run');
    expect(animationId(c, 'special')).toBe('joao_teste_special');
  });

  it('voz de KO: a da ficha ou <id>_ko', () => {
    expect(defineCharacter(sheet({ id: 'joao-teste' })).koSound).toBe('joao_teste_ko');
    expect(defineCharacter(sheet({ koSound: 'grito' })).koSound).toBe('grito');
  });

  it('o lutador usa o tamanho e os números da ficha', () => {
    registerCharacter(
      defineCharacter(
        sheet({
          id: 'grandao',
          stats: { ...sheet().stats, weight: 140, hurtbox: { w: 64, h: 120 } },
        }),
      ),
    );
    const f = createFighter(0, { x: 0, y: 0 }, 'grandao');
    expect(f.character).toBe('grandao');
    expect(f.w).toBe(px(64));
    expect(f.h).toBe(px(120));
    expect(f.y).toBe(-px(120));
    expect(f.stats.weight).toBe(140);
  });

  it('personagem desconhecido é erro', () => {
    expect(() => createFighter(0, { x: 0, y: 0 }, 'ninguem')).toThrow(/ninguem/);
  });
});

describe('especial montado com blocos', () => {
  const hit = { damage: 10, angle: 40, baseKnockback: 8, knockbackScale: 0.1 };

  it('investida liga a hitbox no active e guarda as velocidades', () => {
    const c = defineCharacter(
      sheet({
        special: {
          name: 'Arrancada',
          startup: 10,
          active: 8,
          recovery: 12,
          blocks: [
            { type: 'dash', speed: 15, airSpeed: 9, box: { x: 30, y: 0, w: 60, h: 80 }, hit },
          ],
        },
      }),
    );
    const s = c.special;
    expect(s?.name).toBe('Arrancada');
    expect(s?.cooldownTicks).toBe(0);
    expect(s?.oncePerAir).toBe(false);
    const m = s?.move;
    expect(m?.dash).toEqual({ speed: px(15), airSpeed: px(9) });
    expect(m?.hitboxes).toEqual([
      { from: 11, to: 18, boxes: [{ x: px(30), y: 0, w: px(60), h: px(80) }] },
    ]);
    expect(m?.damage).toBe(10);
    expect(m?.baseKnockback).toBe(px(8));
    expect(m?.knockbackDir).toBe('facing');
    expect(m?.turns).toBe(true);
  });

  it('área arremessa para longe do centro; projétil e buff viram campos do golpe', () => {
    const m = defineCharacter(
      sheet({
        special: {
          name: 'Combo',
          startup: 6,
          active: 4,
          recovery: 10,
          blocks: [
            { type: 'area', box: { x: 0, y: 0, w: 160, h: 120 }, hit },
            { type: 'projectile', speed: 8, lifetimeTicks: 40, size: { w: 20, h: 10 }, hit },
            { type: 'buff', durationTicks: 300, damagePercent: 120 },
          ],
        },
      }),
    ).special?.move;
    expect(m?.knockbackDir).toBe('away');
    expect(m?.projectile).toMatchObject({
      speed: px(8),
      launchAngle: 0,
      gravity: 0,
      offsetX: px(30),
      w: px(20),
    });
    expect(m?.buff).toEqual({
      durationTicks: 300,
      damagePercent: 120,
      speedPercent: 100,
      weightPercent: 100,
    });
  });

  it('recusa bloco repetido e mais de 1 bloco com hitbox', () => {
    const area = { type: 'area' as const, box: { x: 0, y: 0, w: 10, h: 10 }, hit };
    const base = { name: 'X', startup: 5, active: 5, recovery: 5 };
    expect(() => defineCharacter(sheet({ special: { ...base, blocks: [area, area] } }))).toThrow(
      /1 vez/,
    );
    expect(() =>
      defineCharacter(
        sheet({
          special: {
            ...base,
            blocks: [area, { type: 'grab', box: area.box, holdTicks: 10, hit }],
          },
        }),
      ),
    ).toThrow(/hitbox/);
  });

  it('recusa bloco desconhecido', () => {
    expect(() =>
      defineCharacter(
        sheet({
          special: {
            name: 'X',
            startup: 5,
            active: 5,
            recovery: 5,
            blocks: [{ type: 'laser' } as never],
          },
        }),
      ),
    ).toThrow(/Ficha inválida/);
  });
});
