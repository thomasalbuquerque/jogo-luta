import Phaser from 'phaser';
import { characterTextureKey } from './FighterView';

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
  /** Projétil: quadros em ciclo, rastro atrás e fumacinhas soltando. */
  projectile?: { frames: readonly string[]; trail?: string; puffs?: readonly string[] };
}

export const CHARACTER_FX: Readonly<Record<string, CharacterFx>> = {
  schummaki: {
    chargePuffs: ['fx_smoke1', 'fx_smoke2', 'fx_smoke3', 'fx_smoke4'],
    chargeMark: 'fx_skid',
    activeStreaks: ['fx_streak1', 'fx_streak2'],
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
  character: string;
  frame: string;
  x: number;
  y: number;
  /** px de mundo por tick. */
  vx?: number;
  vy?: number;
  /** Duração em ticks. */
  life: number;
  /** Escala (px de mundo por px da textura) no começo e no fim. */
  scale: number;
  scaleEnd?: number;
  alpha?: number;
  flipX?: boolean;
  /** Origem da imagem (padrão: centro). */
  originX?: number;
  originY?: number;
}

interface Particle extends Required<Omit<ParticleSpec, 'character' | 'frame' | 'flipX'>> {
  img: Phaser.GameObjects.Image;
  age: number;
}

/** Partículas simples (fumaça, linhas de velocidade), avançadas a cada tick. */
export class FxLayer {
  private readonly particles: Particle[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly depth: number,
  ) {}

  spawn(spec: ParticleSpec): void {
    const img = this.scene.add
      .image(spec.x, spec.y, characterTextureKey(spec.character), spec.frame)
      .setOrigin(spec.originX ?? 0.5, spec.originY ?? 0.5)
      .setDepth(this.depth)
      .setFlipX(spec.flipX ?? false);
    this.particles.push({
      img,
      age: 0,
      x: spec.x,
      y: spec.y,
      vx: spec.vx ?? 0,
      vy: spec.vy ?? 0,
      life: spec.life,
      scale: spec.scale,
      scaleEnd: spec.scaleEnd ?? spec.scale,
      alpha: spec.alpha ?? 1,
      originX: spec.originX ?? 0.5,
      originY: spec.originY ?? 0.5,
    });
    this.apply(this.particles[this.particles.length - 1]);
  }

  /** Um tick: move, cresce e apaga; tira as que acabaram. */
  step(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      p.age++;
      p.x += p.vx;
      p.y += p.vy;
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

  private apply(p: Particle | undefined): void {
    if (!p) return;
    const k = p.age / p.life;
    p.img.setPosition(p.x, p.y);
    p.img.setScale(p.scale + (p.scaleEnd - p.scale) * k);
    p.img.setAlpha(p.alpha * (1 - k));
  }
}
