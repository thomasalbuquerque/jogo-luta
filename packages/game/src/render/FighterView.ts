import Phaser from 'phaser';
import {
  DRAW_ORDER,
  fitRig,
  poseBounds,
  skinFromAtlas,
  solvePose,
  type BoneId,
  type PlacedBone,
  type Pose,
  type RigFit,
  type Skin,
} from '../rig/skeleton';

/** Chave da textura (atlas) de um personagem. */
export function characterTextureKey(id: string): string {
  return `char-${id}`;
}

/** Atlas de cada personagem, gerados pelo `pnpm art` (ver `docs/ARTE.md`). */
export function characterAtlasPath(id: string): string {
  return `characters/${id}`;
}

/** Y mais baixo dos pés na pose (px da textura, quadril em 0). */
function lowestFoot(skin: Skin, placed: readonly PlacedBone[]): number {
  const feet = placed.filter((p) => p.bone === 'footNear' || p.bone === 'footFar');
  return poseBounds(skin, feet).maxY;
}

/** Arte um pouco mais alta que a hurtbox: o cabelo e o boné passam do topo. */
const ART_HEIGHT_FACTOR = 1.12;

const skins = new Map<string, { skin: Skin; fit: RigFit }>();

/** Peças e medidas de um personagem, lidas do atlas já carregado. */
export function skinOf(scene: Phaser.Scene, id: string): { skin: Skin; fit: RigFit } {
  const cached = skins.get(id);
  if (cached) return cached;
  const texture = scene.textures.get(characterTextureKey(id));
  const frames: Record<string, unknown> = {};
  for (const name of texture.getFrameNames()) {
    const frame = texture.get(name);
    frames[name] = { frame: { w: frame.width, h: frame.height }, ...frame.customData };
  }
  const skin = skinFromAtlas(frames);
  const entry = { skin, fit: fitRig(skin) };
  skins.set(id, entry);
  return entry;
}

/**
 * O lutador desenhado com as peças da skin: um container com uma imagem por osso,
 * reposicionadas a cada frame pela pose (cinemática em `rig/skeleton.ts`).
 */
export class FighterView {
  readonly container: Phaser.GameObjects.Container;
  /** px de mundo por px da textura. */
  readonly scale: number;
  /** Altura da arte em px de mundo. */
  readonly height: number;
  private readonly images = new Map<BoneId, Phaser.GameObjects.Image>();
  private readonly skin: Skin;
  private readonly fit: RigFit;
  private readonly textureKey: string;

  constructor(scene: Phaser.Scene, characterId: string, hurtboxHeight: number) {
    const { skin, fit } = skinOf(scene, characterId);
    this.skin = skin;
    this.fit = fit;
    this.textureKey = characterTextureKey(characterId);
    this.height = hurtboxHeight * ART_HEIGHT_FACTOR;
    this.scale = this.height / fit.height;
    this.container = scene.add.container(0, 0);
    for (const bone of DRAW_ORDER) {
      const img = scene.add.image(0, 0, this.textureKey);
      this.images.set(bone, img);
      this.container.add(img);
    }
  }

  /**
   * Desenha a pose com os pés em (x, y) (px de mundo), virado para `facing`.
   * `plant`: no chão, desce ou sobe o corpo até o pé mais baixo encostar no chão
   * (as animações não precisam acertar a altura das pernas dobradas).
   */
  setPose(pose: Pose, x: number, y: number, facing: -1 | 1, plant = false): void {
    const placed = solvePose(this.skin, pose);
    const lift = plant ? this.fit.groundY - lowestFoot(this.skin, placed) : 0;
    for (const p of placed) {
      const img = this.images.get(p.bone);
      if (!img) continue;
      if (img.frame.name !== p.frame) img.setFrame(p.frame);
      img.setOrigin(p.originX, p.originY);
      img.setPosition(p.x, p.y - this.fit.groundY + lift);
      img.setRotation(p.rotation);
    }
    const unit = this.height / 100;
    this.container.setPosition(x + pose.x * unit * facing, y + pose.y * unit);
    this.container.setScale(this.scale * facing, this.scale);
  }

  setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    return this;
  }

  setAlpha(alpha: number): this {
    this.container.setAlpha(alpha);
    return this;
  }

  /** Tinge as peças (0xffffff = cor normal). */
  setTint(color: number): this {
    for (const img of this.images.values()) {
      if (color === 0xffffff) img.clearTint();
      else img.setTint(color);
    }
    return this;
  }

  setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  destroy(): void {
    this.container.destroy();
  }
}
