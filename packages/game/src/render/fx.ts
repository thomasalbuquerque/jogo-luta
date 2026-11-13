import Phaser from 'phaser';
import { fanfareTicks } from '../audio/fanfare';
import type { SfxName } from '../audio/sfxSynth';

/**
 * Efeitos do especial de cada personagem, com as peças da folha de efeitos
 * (`4-efeitos.png`, recortadas pelo `pnpm art` com nomes `fx_*`). Só visual: o
 * sim não sabe deles.
 */
export interface CharacterFx {
  /** Fumaça perto dos pés enquanto o especial carrega (startup). */
  chargePuffs?: readonly string[];
  /** Marca no chão quando o especial começa. */
  chargeMark?: string;
  /** Linhas de velocidade atrás do corpo durante o active. */
  activeStreaks?: readonly string[];
  /**
   * Projétil: quadros em ciclo, rastro atrás e fumacinhas soltando. `scale`: tamanho
   * em relação ao personagem (padrão 0.85).
   */
  projectile?: {
    frames: readonly string[];
    trail?: string;
    puffs?: readonly string[];
    scale?: number;
  };
  /** Clarão na boca da arma (socket `muzzle` da peça na mão) no 1º frame ativo. */
  muzzleFlash?: string;
  /** Fumacinha na mão quando a peça segurada aparece ou some. */
  propPuffs?: readonly string[];
  /** Peças seguradas que aparecem e somem sem a fumacinha (a chave tirada do bolso). */
  quietProps?: readonly string[];
  /** Som do tiro, no 1º frame ativo. */
  shotSound?: SfxName;
  /**
   * Mira (só aviso visual, o sim não sabe dela): da fração `from` do startup até o
   * tiro, uma linha fininha na cor `color` (com contorno de tinta) sai da boca da arma (socket `muzzle` da peça na mão) na
   * direção do cano, cada vez mais forte, piscando no fim; e um brilho (`glint`) na
   * luneta (socket `scope`) quando a mira começa e pouco antes do tiro.
   */
  aim?: { from: number; color: number; glint?: string };
  /** Cápsula saltando do ferrolho (socket `bolt`), `delay` ticks depois do tiro. */
  shellCasing?: { frame: string; delay: number; sound?: SfxName };
  /**
   * A mão `taunt` segura um objeto (o trompete do Tauba): a fumacinha de `propPuffs`
   * sai também quando ela aparece ou some.
   */
  heldInTauntHand?: boolean;
  /** Teleporte sorteado: quadradinhos quando o corpo se desfaz (some) e se junta (volta). */
  vanishSquares?: readonly string[];
  /**
   * Provocação: peças que saem do socket `bell` da mão (notas do trompete), nos `ticks`
   * contados a partir do `voiceAt` da ficha.
   */
  tauntNotes?: { frames: readonly string[]; ticks: readonly number[] };
  /**
   * Contra-ataque: na janela, anéis (`glow`) sobem dos pés à cabeça, como quem
   * avalia a postura (no lugar do contorno branco). Quando pega alguém (golpe ou
   * projétil), um brilho (`ding`) perto da cabeça; no golpe devolvido, um estalo
   * (`burst`) e linhas de impacto (`lines`) no ponto do acerto, com o som `sound`.
   */
  counter?: { glow: string; ding?: string; burst?: string; lines?: string; sound?: SfxName };
  /**
   * Pancada no chão (área): um brilho (`shine`) no socket `shine` da peça na mão
   * quando ela chega lá em cima; no 1º frame ativo, nuvens de farinha (`cloud`) para
   * os dois lados, migalhas (`crumbs`) voando, um tremor `trauma` da câmera e o som
   * `sound`. No ar, a nuvem sai de onde a peça estiver.
   */
  slam?: {
    shine?: string;
    cloud: string;
    crumbs: readonly string[];
    trauma: number;
    sound?: SfxName;
  };
  /** Provocação: migalhas caindo do socket `biscuit` da mão no tick `at` (a mordida). */
  tauntCrumbs?: { frames: readonly string[]; at: number };
  /**
   * Bonequinho que aparece no ponto da área e bate por ele (o Gabs jogando): em pé
   * (`stand`) no startup, num dos `strikes` (sorteado) do 1º frame ativo até o meio
   * do recovery, e some. Surge e some piscando, com linhas de varredura (`scanlines`);
   * faísca (`spark`) no golpe. Se o dono apanhar no meio, some na hora. `height`:
   * altura em relação à hurtbox do dono. A origem de cada quadro é o `pivot` dele (o
   * meio do corpo, no chão). Só visual: o sim só tem a hitbox da área.
   */
  summon?: {
    stand: string;
    strikes: readonly string[];
    scanlines: readonly string[];
    spark: string;
    height: number;
    spawnSound?: SfxName;
    hitSound?: SfxName;
    despawnSound?: SfxName;
  };
  /**
   * Tragada e aura (bloco buff com `invulnerable`, a Tragadinha da Marília). Enquanto a
   * mão segura o palheiro, uma brasa (`emberColor`) pisca no socket `ember` da mão,
   * soltando fumacinhas cinzas (`smoke`), mais na tragada (`inhale`: fração do startup
   * em que ela começa e acaba, com o som `dragSound`). No 1º frame ativo, a baforada:
   * fumaça pintada de `color` espalhando em volta do corpo e o som `exhaleSound`. Com a
   * aura ligada, o boneco ganha um brilho `color` colado na silhueta (o Glow do Phaser,
   * acompanha cada pose) e fiapos (`wisps`) sobem em volta; nos últimos `blinkTicks` o
   * brilho pisca. Golpe que passa pela aura (evento `aura` do sim): estrelinha
   * (`sparkle`) e o som `passSound`. Quando a mão solta o palheiro (o peteleco do
   * recovery, ou um golpe no meio da tragada), a peça `cig` cai girando.
   */
  aura?: {
    color: number;
    emberColor: number;
    smoke: readonly string[];
    inhale: { from: number; to: number };
    wisps: readonly string[];
    sparkle: string;
    cig: string;
    blinkTicks: number;
    dragSound?: SfxName;
    exhaleSound?: SfxName;
    passSound?: SfxName;
  };
  /**
   * Agarrão com combo (o Comando do Meia). O comando aparece em cima da cabeça
   * (`render/command.ts`, desenhado pelo `CommandView`) e acende no startup; errar
   * deixa ele vermelho, com o X, e toca `missSound`. A cada golpe do combo (evento
   * `hit` de tipo `combo`): uma faísca (`sparks`) na altura do golpe, uma linha de
   * velocidade (`streaks`), o som `hitSound`, um tremor leve e um tranco no agarrado,
   * e o contador "N HITS" sobe. O arremesso fecha com a explosão `burst`, fumaça
   * (`smoke`) e o som `finishSound`.
   */
  combo?: {
    sparks: readonly string[];
    streaks: readonly string[];
    burst: string;
    smoke: readonly string[];
    hitSound?: SfxName;
    finishSound?: SfxName;
    missSound?: SfxName;
  };
}

export const CHARACTER_FX: Readonly<Record<string, CharacterFx>> = {
  schummaki: {
    chargePuffs: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3', 'fx_smoke4'],
    chargeMark: 'fx_skid',
    activeStreaks: ['fx_streak1', 'fx_streak2'],
  },
  dadazinho: {
    projectile: { frames: ['fx_pellets'], scale: 1.3 },
    muzzleFlash: 'fx_flash',
    propPuffs: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'],
  },
  tchula: {
    projectile: { frames: ['fx_trail'], scale: 1.3 },
    muzzleFlash: 'fx_flash',
    shotSound: 'rifle_shot',
    propPuffs: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'],
    quietProps: ['fx_wrench'],
    aim: { from: 0.45, color: 0xfff4e0, glint: 'fx_glint' },
    shellCasing: { frame: 'fx_casing', delay: 8, sound: 'rifle_bolt' },
  },
  tauba: {
    vanishSquares: ['fx_square1', 'fx_square2', 'fx_square3'],
    // uma nota em cada nota da fanfarra, e mais 3 durante o Sol longo
    tauntNotes: {
      frames: ['fx_note1', 'fx_note2', 'fx_note3'],
      ticks: [...fanfareTicks(), 68, 82, 96],
    },
    propPuffs: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'],
    heldInTauntHand: true,
  },
  crocko: {
    counter: {
      glow: 'fx_ring',
      ding: 'fx_ding',
      burst: 'fx_crack',
      lines: 'fx_lines',
      sound: 'spine_crack',
    },
  },
  darllan: {
    slam: {
      shine: 'fx_shine',
      cloud: 'fx_flour',
      crumbs: ['fx_crumb1', 'fx_crumb2', 'fx_crumb3', 'fx_crumb4'],
      trauma: 0.38,
      sound: 'flour_thump',
    },
    tauntCrumbs: { frames: ['fx_crumb2', 'fx_crumb3', 'fx_crumb4'], at: 28 },
  },
  gabs: {
    propPuffs: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'],
    heldInTauntHand: true,
    summon: {
      stand: 'fx_pixel_stand',
      strikes: ['fx_pixel_punch', 'fx_pixel_kick'],
      scanlines: ['fx_scan1', 'fx_scan2', 'fx_scan3', 'fx_scan4'],
      spark: 'fx_spark',
      height: 0.8,
      spawnSound: 'pixel_spawn',
      hitSound: 'pixel_hit',
      despawnSound: 'pixel_despawn',
    },
  },
  marilia: {
    aura: {
      color: 0xb5f2c6,
      emberColor: 0xff8a2a,
      smoke: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'],
      // no clipe, o palheiro chega na boca em t ≈ 0.42 e sai em t ≈ 0.9
      inhale: { from: 0.45, to: 0.88 },
      wisps: ['fx_wisp1', 'fx_wisp2', 'fx_wisp3', 'fx_wisp4'],
      sparkle: 'fx_sparkle',
      cig: 'fx_cig',
      blinkTicks: 30,
      dragSound: 'drag_sizzle',
      exhaleSound: 'exhale_puff',
      passSound: 'aura_pass',
    },
  },
  meia: {
    // poeirinha nos pés quando ele entra colado no startup
    chargePuffs: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'],
    combo: {
      sparks: ['fx_spark1', 'fx_spark2', 'fx_spark3', 'fx_spark4'],
      streaks: ['fx_streak1', 'fx_streak2', 'fx_streak3'],
      burst: 'fx_burst',
      smoke: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3'],
      hitSound: 'combo_hit',
      finishSound: 'combo_finish',
      missSound: 'command_miss',
    },
  },
  'joao-frango': {
    projectile: {
      frames: ['fx_chicken1', 'fx_chicken2', 'fx_chicken3'],
      trail: 'fx_trail',
      puffs: ['fx_steam1', 'fx_steam2', 'fx_steam3'],
    },
  },
};

export interface ParticleSpec {
  /** Textura (atlas do personagem ou uma de `FX_TEXTURE`) e quadro, se for atlas. */
  texture: string;
  frame?: string;
  x: number;
  y: number;
  /** px de mundo por tick. */
  vx?: number;
  vy?: number;
  /** Somado a `vy` a cada tick. */
  gravity?: number;
  /** Fração da velocidade que sobra a cada tick (1 = não freia). */
  drag?: number;
  /** Duração em ticks. */
  life: number;
  /** Escala (px de mundo por px da textura) no começo e no fim. */
  scale: number;
  scaleEnd?: number;
  /** Estica na horizontal (faíscas): escala X = escala × stretch. */
  stretch?: number;
  alpha?: number;
  /** Rotação inicial e giro por tick, em radianos. */
  rotation?: number;
  spin?: number;
  /** Gira junto com a velocidade (faíscas apontam para onde vão). */
  alignToVelocity?: boolean;
  tint?: number;
  /** Mistura aditiva: brilha por cima do que estiver atrás. */
  additive?: boolean;
  flipX?: boolean;
  /** Origem da imagem (padrão: centro). */
  originX?: number;
  originY?: number;
}

interface Particle {
  img: Phaser.GameObjects.Image;
  age: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  life: number;
  scale: number;
  scaleEnd: number;
  stretch: number;
  alpha: number;
  rotation: number;
  spin: number;
  alignToVelocity: boolean;
}

/** Partículas simples (fumaça, faíscas, linhas de velocidade), avançadas a cada tick. */
export class FxLayer {
  private readonly particles: Particle[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
  ) {}

  spawn(spec: ParticleSpec): void {
    const img = this.scene.add
      .image(spec.x, spec.y, spec.texture, spec.frame)
      .setOrigin(spec.originX ?? 0.5, spec.originY ?? 0.5)
      .setDepth(this.depth)
      .setFlipX(spec.flipX ?? false);
    if (spec.tint !== undefined) img.setTint(spec.tint);
    if (spec.additive) img.setBlendMode(Phaser.BlendModes.ADD);
    const p: Particle = {
      img,
      age: 0,
      x: spec.x,
      y: spec.y,
      vx: spec.vx ?? 0,
      vy: spec.vy ?? 0,
      gravity: spec.gravity ?? 0,
      drag: spec.drag ?? 1,
      life: spec.life,
      scale: spec.scale,
      scaleEnd: spec.scaleEnd ?? spec.scale,
      stretch: spec.stretch ?? 1,
      alpha: spec.alpha ?? 1,
      rotation: spec.rotation ?? 0,
      spin: spec.spin ?? 0,
      alignToVelocity: spec.alignToVelocity ?? false,
    };
    this.particles.push(p);
    this.apply(p);
  }

  /** Um tick: move, cresce e apaga; tira as que acabaram. */
  step(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      p.age++;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      if (p.age >= p.life) {
        p.img.destroy();
        this.particles.splice(i, 1);
      } else {
        this.apply(p);
      }
    }
  }

  clear(): void {
    for (const p of this.particles) p.img.destroy();
    this.particles.length = 0;
  }

  private apply(p: Particle): void {
    const k = p.age / p.life;
    const scale = p.scale + (p.scaleEnd - p.scale) * k;
    p.img.setPosition(p.x, p.y);
    p.img.setScale(scale * p.stretch, scale);
    p.img.setRotation(p.alignToVelocity ? Math.atan2(p.vy, p.vx) : p.rotation);
    p.img.setAlpha(p.alpha * (1 - k));
  }
}
