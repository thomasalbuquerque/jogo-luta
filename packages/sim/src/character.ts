import { z } from 'zod';
import { px } from './constants';
import { idiv } from './math';
import {
  BASE_MOVE_IDS,
  MOVES,
  type BaseMoveId,
  type HitboxDef,
  type HitboxFrames,
  type HitProps,
  type MoveDef,
} from './moves';
import { DEFAULT_STATS, type FighterStats } from './stats';

/**
 * Ficha de personagem: personagem é dado, não código (CLAUDE.md, regra 6).
 *
 * A ficha é escrita em unidades fáceis de ajustar (px, px/tick, ticks, %) e
 * validada com zod. `defineCharacter` valida e converte para o que o `sim` usa
 * (subpx inteiro). Os números vêm em cima do padrão: o que a ficha não muda fica
 * igual para todos.
 */

/** Animações que cada personagem pode ter. Os ids são da arte (Etapa 4). */
export const ANIMATION_KEYS = [
  'idle',
  'run',
  'jump',
  'fall',
  'wallslide',
  'dash',
  'dodge',
  'landing',
  'ledge',
  'hitstun',
  'grabbed',
  'ko',
  'taunt',
  ...BASE_MOVE_IDS,
  'special',
] as const;

export type AnimationKey = (typeof ANIMATION_KEYS)[number];

// ---------------------------------------------------------------------------
// Schema (unidades da ficha)

const int = (min: number, max: number) => z.number().int().min(min).max(max);
const num = (min: number, max: number) => z.number().min(min).max(max);

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'cor no formato #rrggbb');
/** Id de arquivo de arte ou som: minúsculas, números e _. */
const AssetId = z.string().regex(/^[a-z0-9_]+$/, 'id em minúsculas, números e _');

/** Acerto: dano em %, ângulo em graus, knockback em px/tick (escala: px/tick por % do alvo). */
const HitSchema = z.strictObject({
  damage: int(0, 60),
  angle: int(0, 359),
  baseKnockback: num(0, 30),
  knockbackScale: num(0, 0.6),
});

/** Caixa em px, relativa ao centro do corpo: x para a frente, y para baixo. */
const BoxSchema = z.strictObject({
  x: num(-200, 200),
  y: num(-200, 200),
  w: num(1, 400),
  h: num(1, 400),
});

/** Ajustes num golpe do moveset base. Só o que mudar; o resto vem de `moves.ts`. */
const MoveTweakSchema = z
  .strictObject({
    startup: int(0, 60),
    active: int(1, 60),
    recovery: int(0, 90),
    damage: int(0, 60),
    angle: int(0, 359),
    baseKnockback: num(0, 30),
    knockbackScale: num(0, 0.6),
    landingLag: int(0, 30),
    canWalk: z.boolean(),
    /** Alcance horizontal das hitboxes, em % (100 = padrão). */
    reach: int(50, 200),
  })
  .partial();

const MovesSchema = z
  .strictObject({
    neutralLight: MoveTweakSchema,
    sideLight: MoveTweakSchema,
    downLight: MoveTweakSchema,
    neutralAir: MoveTweakSchema,
    sideAir: MoveTweakSchema,
    downAir: MoveTweakSchema,
    recovery: MoveTweakSchema,
    groundPound: MoveTweakSchema,
    groundPoundLand: MoveTweakSchema,
  })
  .partial();

// Blocos de especial. Os instantâneos (projétil, buff, teleporte) disparam no 1º
// frame ativo; os contínuos (investida, área, contra-ataque, agarrão) duram o active.

const ProjectileBlock = z.strictObject({
  type: z.literal('projectile'),
  /** px/tick. */
  speed: num(1, 40),
  /** Graus: 0 = reto para a frente, 90 = para cima. */
  launchAngle: int(0, 359).default(0),
  /** px/tick² (0 = linha reta). */
  gravity: num(0, 2).default(0),
  lifetimeTicks: int(1, 600),
  size: z.strictObject({ w: num(4, 200), h: num(4, 200) }),
  /** Onde nasce, em relação ao centro do corpo. */
  offset: z.strictObject({ x: num(-100, 100), y: num(-100, 100) }).default({ x: 30, y: 0 }),
  hit: HitSchema,
});

const DashBlock = z.strictObject({
  type: z.literal('dash'),
  /** px/tick no chão. */
  speed: num(1, 40),
  /** px/tick no ar (menor = não vira recuperação infinita). */
  airSpeed: num(0, 40),
  box: BoxSchema,
  hit: HitSchema,
});

const AreaBlock = z.strictObject({
  type: z.literal('area'),
  box: BoxSchema,
  hit: HitSchema,
});

const CounterBlock = z.strictObject({
  type: z.literal('counter'),
  /** O acerto devolvido em quem bateu. */
  hit: HitSchema,
});

const BuffBlock = z.strictObject({
  type: z.literal('buff'),
  durationTicks: int(1, 1800),
  damagePercent: int(50, 300).default(100),
  speedPercent: int(50, 300).default(100),
  weightPercent: int(50, 300).default(100),
  /**
   * Aura: enquanto o buff dura, golpes, projéteis e agarrões passam pelo lutador
   * (sem dano, sem knockback). Não salva da blast zone.
   */
  invulnerable: z.boolean().default(false),
});

const TeleportBlock = z.strictObject({
  type: z.literal('teleport'),
  /**
   * `direction`: vai `distance` px na direção apertada, no 1º frame ativo.
   * `random`: some durante o active e reaparece, no fim dele, num chão sorteado do
   * palco (o jogador não escolhe). Usa o RNG da luta: replay e online continuam iguais.
   */
  target: z.enum(['direction', 'random']).default('direction'),
  /** px (só no `direction`). */
  distance: num(10, 600).default(200),
  invulnTicks: int(0, 60).default(0),
  /** `random`: quantos pontos do palco sorteia. */
  candidates: int(1, 8).default(3),
  /** `random`: chance (%) de ir para o ponto mais perto do adversário; senão, o mais longe. */
  nearChance: int(0, 100).default(25),
});

const GrabBlock = z.strictObject({
  type: z.literal('grab'),
  box: BoxSchema,
  holdTicks: int(1, 120),
  /** O arremesso, ao soltar. */
  hit: HitSchema,
});

const BlockSchema = z.discriminatedUnion('type', [
  ProjectileBlock,
  DashBlock,
  AreaBlock,
  CounterBlock,
  BuffBlock,
  TeleportBlock,
  GrabBlock,
]);

export type SpecialBlockType = z.infer<typeof BlockSchema>['type'];

/** Blocos que ligam a hitbox do especial: só cabe 1 por especial. */
const HITBOX_BLOCKS: readonly SpecialBlockType[] = ['dash', 'area', 'grab'];

const SpecialSchema = z
  .strictObject({
    name: z.string().min(1).max(40),
    startup: int(1, 60),
    active: int(1, 120),
    recovery: int(0, 90),
    /** Ticks sem poder repetir, contados do começo do especial. */
    cooldownTicks: int(0, 600).default(0),
    /** No ar, só 1 vez até tocar o chão, agarrar a borda ou levar golpe. */
    oncePerAir: z.boolean().default(false),
    /** No ar, fica parado durante o startup (sem cair). */
    hoverStartup: z.boolean().default(false),
    blocks: z.array(BlockSchema).min(1).max(4),
  })
  .superRefine((s, ctx) => {
    const types = s.blocks.map((b) => b.type);
    if (new Set(types).size !== types.length) {
      ctx.addIssue({ code: 'custom', path: ['blocks'], message: 'cada bloco aparece 1 vez só' });
    }
    if (types.filter((t) => HITBOX_BLOCKS.includes(t)).length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['blocks'],
        message: 'no máximo 1 bloco com hitbox (dash, area ou grab)',
      });
    }
  });

const StatsSchema = z.strictObject({
  /** 100 = médio; maior = voa menos. */
  weight: int(50, 200),
  /** px/tick. */
  walkSpeed: num(2, 15),
  airSpeed: num(2, 15),
  /** px. */
  jumpHeight: num(60, 320),
  /** px; sem isso, 80% do pulo do chão. */
  airJumpHeight: num(40, 320).optional(),
  airJumps: int(0, 3),
  /** Corpo do lutador (colisão e hurtbox), em px. */
  hurtbox: z.strictObject({ w: num(24, 120), h: num(40, 180) }),
  /** px/tick² e px/tick. */
  gravity: num(0.2, 2).optional(),
  maxFallSpeed: num(4, 30).optional(),
  fastFallSpeed: num(6, 40).optional(),
  dashSpeed: num(4, 30).optional(),
});

const TauntSchema = z
  .strictObject({
    /** Bordão (aparece no balão enquanto não há áudio gravado). */
    text: z.string().min(1).max(60),
    sound: AssetId,
    animation: AssetId,
    durationTicks: int(20, 240).default(60),
    /** Tick da provocação em que a voz sai e o balão aparece (0 = logo no começo). */
    voiceAt: int(0, 239).default(0),
  })
  .refine((t) => t.voiceAt < t.durationTicks, {
    path: ['voiceAt'],
    message: 'a voz tem que sair antes de a provocação acabar',
  });

export const CharacterSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id em minúsculas, números e -'),
  name: z.string().min(1).max(24),
  /** Estilo de luta em 1 linha (tela de seleção). */
  blurb: z.string().max(80).default(''),
  colors: z.strictObject({ primary: HexColor, secondary: HexColor }),
  stats: StatsSchema,
  moves: MovesSchema.default({}),
  /** Só o boneco de teste não tem especial. */
  special: SpecialSchema.optional(),
  taunt: TauntSchema,
  /** Voz do amigo no KO (áudio em `audio/vozes/`). Sem isso: `<id com _>_ko`. */
  koSound: AssetId.optional(),
  animations: z.partialRecord(z.enum(ANIMATION_KEYS), AssetId).default({}),
});

/** O que se escreve na ficha (campos com padrão podem faltar). */
export type CharacterSheet = z.input<typeof CharacterSchema>;
type ParsedSheet = z.output<typeof CharacterSchema>;
type MoveTweak = z.output<typeof MoveTweakSchema>;
type ParsedSpecial = z.output<typeof SpecialSchema>;

// ---------------------------------------------------------------------------
// Personagem compilado (unidades do sim)

export interface Special {
  name: string;
  cooldownTicks: number;
  oncePerAir: boolean;
  /** O especial vira um golpe como os outros, com os blocos como campos extras. */
  move: MoveDef;
}

export interface Taunt {
  text: string;
  sound: string;
  animation: string;
  durationTicks: number;
  voiceAt: number;
}

export interface Character {
  id: string;
  name: string;
  blurb: string;
  colors: { primary: string; secondary: string };
  stats: FighterStats;
  moves: Readonly<Record<BaseMoveId, MoveDef>>;
  special: Special | null;
  taunt: Taunt;
  /** Id do áudio da voz no KO; sem o arquivo, o jogo toca um grito sintetizado. */
  koSound: string;
  animations: Readonly<Partial<Record<AnimationKey, string>>>;
}

/** Valida a ficha e converte para o `sim`. Ficha inválida para o jogo na hora (erro legível). */
export function defineCharacter(sheet: CharacterSheet): Character {
  const parsed = CharacterSchema.safeParse(sheet);
  if (!parsed.success) {
    throw new Error(`Ficha inválida (${sheet.id}):\n${z.prettifyError(parsed.error)}`);
  }
  return compileCharacter(parsed.data);
}

function compileCharacter(s: ParsedSheet): Character {
  const moves = {} as Record<BaseMoveId, MoveDef>;
  for (const id of BASE_MOVE_IDS) moves[id] = tweakMove(MOVES[id], s.moves[id]);
  return {
    id: s.id,
    name: s.name,
    blurb: s.blurb,
    colors: { ...s.colors },
    stats: compileStats(s.stats),
    moves,
    special: s.special ? compileSpecial(s.special) : null,
    taunt: { ...s.taunt },
    koSound: s.koSound ?? `${s.id.replaceAll('-', '_')}_ko`,
    animations: { ...s.animations },
  };
}

/** Id da animação de um personagem: o da ficha ou `<id>_<chave>` (padrão da Etapa 4). */
export function animationId(c: Character, key: AnimationKey): string {
  return c.animations[key] ?? `${c.id.replaceAll('-', '_')}_${key}`;
}

function opt(value: number | undefined, fallback: number): number {
  return value === undefined ? fallback : px(value);
}

function compileStats(s: ParsedSheet['stats']): FighterStats {
  const jumpHeight = px(s.jumpHeight);
  return {
    ...DEFAULT_STATS,
    width: px(s.hurtbox.w),
    height: px(s.hurtbox.h),
    weight: s.weight,
    walkSpeed: px(s.walkSpeed),
    airSpeed: px(s.airSpeed),
    jumpHeight,
    airJumpHeight: opt(s.airJumpHeight, idiv(jumpHeight * 4, 5)),
    airJumps: s.airJumps,
    gravity: opt(s.gravity, DEFAULT_STATS.gravity),
    maxFallSpeed: opt(s.maxFallSpeed, DEFAULT_STATS.maxFallSpeed),
    fastFallSpeed: opt(s.fastFallSpeed, DEFAULT_STATS.fastFallSpeed),
    dashSpeed: opt(s.dashSpeed, DEFAULT_STATS.dashSpeed),
  };
}

function hitProps(h: z.output<typeof HitSchema>, dir: HitProps['knockbackDir']): HitProps {
  return {
    damage: h.damage,
    angle: h.angle,
    baseKnockback: px(h.baseKnockback),
    knockbackScale: px(h.knockbackScale),
    knockbackDir: dir,
  };
}

function toBox(b: z.output<typeof BoxSchema>): HitboxDef {
  return { x: px(b.x), y: px(b.y), w: px(b.w), h: px(b.h) };
}

/**
 * Aplica os ajustes da ficha num golpe base. Sem ajuste, devolve o próprio golpe.
 * Mudar o startup desloca as hitboxes e o impulso; mudar o active corta ou
 * estica a última janela de hitbox; `reach` escala o alcance horizontal.
 */
function tweakMove(base: MoveDef, t: MoveTweak | undefined): MoveDef {
  if (!t || Object.keys(t).length === 0) return base;
  const startup = t.startup ?? base.startup;
  const active = t.active ?? base.active;
  const shift = startup - base.startup;
  const lastActive = startup + active;
  const reach = t.reach ?? 100;

  const hitboxes: HitboxFrames[] = [];
  for (const w of base.hitboxes) {
    const from = w.from + shift;
    if (from > lastActive) continue;
    hitboxes.push({
      from,
      to: Math.min(w.to + shift, lastActive),
      boxes: w.boxes.map((b) => ({ ...b, x: idiv(b.x * reach, 100), w: idiv(b.w * reach, 100) })),
    });
  }
  const last = hitboxes.at(-1);
  if (last && active > base.active) last.to = lastActive;

  const move: MoveDef = {
    ...base,
    startup,
    active,
    recovery: t.recovery ?? base.recovery,
    hitboxes,
    damage: t.damage ?? base.damage,
    angle: t.angle ?? base.angle,
    baseKnockback: opt(t.baseKnockback, base.baseKnockback),
    knockbackScale: opt(t.knockbackScale, base.knockbackScale),
    landingLag: t.landingLag ?? base.landingLag,
    canWalk: t.canWalk ?? base.canWalk,
  };
  if (base.impulse)
    move.impulse = { ...base.impulse, frame: Math.max(1, base.impulse.frame + shift) };
  return move;
}

/** Monta o especial: um golpe com os números da ficha e os blocos como campos. */
function compileSpecial(s: ParsedSpecial): Special {
  const move: MoveDef = {
    startup: s.startup,
    active: s.active,
    recovery: s.recovery,
    hitboxes: [],
    damage: 0,
    angle: 0,
    baseKnockback: 0,
    knockbackScale: 0,
    knockbackDir: 'facing',
    aerial: false,
    landingLag: 0,
    turns: true,
    canWalk: false,
  };
  if (s.hoverStartup) move.hoverStartup = true;
  const window = (box: z.output<typeof BoxSchema>): HitboxFrames[] => [
    { from: s.startup + 1, to: s.startup + s.active, boxes: [toBox(box)] },
  ];
  for (const b of s.blocks) {
    switch (b.type) {
      case 'dash':
        Object.assign(move, hitProps(b.hit, 'facing'), { hitboxes: window(b.box) });
        move.dash = { speed: px(b.speed), airSpeed: px(b.airSpeed) };
        break;
      case 'area':
        Object.assign(move, hitProps(b.hit, 'away'), { hitboxes: window(b.box) });
        break;
      case 'grab':
        Object.assign(move, hitProps(b.hit, 'facing'), { hitboxes: window(b.box) });
        move.grab = { holdTicks: b.holdTicks };
        break;
      case 'projectile':
        move.projectile = {
          speed: px(b.speed),
          launchAngle: b.launchAngle,
          gravity: px(b.gravity),
          lifetimeTicks: b.lifetimeTicks,
          w: px(b.size.w),
          h: px(b.size.h),
          offsetX: px(b.offset.x),
          offsetY: px(b.offset.y),
          hit: hitProps(b.hit, 'facing'),
        };
        break;
      case 'counter':
        move.counter = hitProps(b.hit, 'away');
        break;
      case 'buff':
        move.buff = {
          durationTicks: b.durationTicks,
          damagePercent: b.damagePercent,
          speedPercent: b.speedPercent,
          weightPercent: b.weightPercent,
          invulnerable: b.invulnerable,
        };
        break;
      case 'teleport':
        move.teleport = { distance: px(b.distance), invulnTicks: b.invulnTicks };
        if (b.target === 'random') {
          move.teleport.random = { candidates: b.candidates, nearChance: b.nearChance };
        }
        break;
    }
  }
  return { name: s.name, cooldownTicks: s.cooldownTicks, oncePerAir: s.oncePerAir, move };
}
