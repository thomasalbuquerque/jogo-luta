import Phaser from 'phaser';
import {
  artAngle,
  DRAW_ORDER,
  drawOrder,
  fitRig,
  placedPoint,
  poseBounds,
  skinFromAtlas,
  solvePose,
  solveProp,
  type BoneId,
  type DrawOrderOptions,
  type PlacedBone,
  type Pose,
  type RigFit,
  type Skin,
} from '../rig/skeleton';
import { FOOT_BEHIND, FOREARM_IN_FRONT, SHIN_IN_FRONT } from '../rig/library';
import { FX_TEXTURE } from './fxTextures';

/** Lado da textura do brilho redondo (`FX_TEXTURE.glow`), em px. */
const GLOW_TEXTURE_SIZE = 64;

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

/**
 * Acessório preso no pulso da frente (o relógio do Thom4o): a peça `wristwatch` vai no
 * socket `watch` do antebraço, atravessada nele, só no braço da frente (o antebraço é
 * a mesma peça nos dois braços).
 */
export const WRIST_FRAME = 'wristwatch';
const WRIST_SOCKET = 'watch';

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
  /** Peça segurada na mão da frente (a arma do especial), escondida sem peça. */
  private readonly propImage: Phaser.GameObjects.Image;
  /** Acessório do pulso da frente (`WRIST_FRAME`), se a skin tiver. */
  private readonly wristImage: Phaser.GameObjects.Image | null;
  /** Onde a peça segurada foi desenhada por último (px da textura, sem o lift). */
  private placedProp: { placed: PlacedBone; lift: number } | null = null;
  /** Mão da frente na última pose (para saber onde a peça aparece e some). */
  private placedHand: { placed: PlacedBone; lift: number } | null = null;
  /** Mão de trás na última pose (de onde a bola sai no saque do Igão). */
  private placedHandFar: { placed: PlacedBone; lift: number } | null = null;
  /** Cabeça na última pose (a boca, de onde sai a fumaça). */
  private placedHead: { placed: PlacedBone; lift: number } | null = null;
  /**
   * Brilho atrás do boneco inteiro (a aura da Marília): imagem aditiva criada no 1º uso
   * e depois só mostrada ou escondida.
   */
  private auraGlow: Phaser.GameObjects.Image | null = null;
  private readonly skin: Skin;
  private readonly fit: RigFit;
  private readonly textureKey: string;
  /** Ordem de desenho atual (muda quando o cotovelo dobra). */
  private order = '';
  /**
   * Trocas fixas na ordem de desenho do personagem: antebraço sempre na frente do braço
   * (`FOREARM_IN_FRONT`), canela na frente da coxa (`SHIN_IN_FRONT`), pé atrás da canela
   * (`FOOT_BEHIND`).
   */
  private readonly orderOptions: DrawOrderOptions;

  constructor(scene: Phaser.Scene, characterId: string, hurtboxHeight: number) {
    const { skin, fit } = skinOf(scene, characterId);
    this.skin = skin;
    this.fit = fit;
    this.textureKey = characterTextureKey(characterId);
    this.orderOptions = {
      forearmFront: FOREARM_IN_FRONT.has(characterId),
      shinFront: SHIN_IN_FRONT.has(characterId),
      footBehind: FOOT_BEHIND.has(characterId),
    };
    this.height = hurtboxHeight * ART_HEIGHT_FACTOR;
    this.scale = this.height / fit.height;
    this.container = scene.add.container(0, 0);
    for (const bone of DRAW_ORDER) {
      const img = scene.add.image(0, 0, this.textureKey);
      this.images.set(bone, img);
      this.container.add(img);
    }
    this.propImage = scene.add.image(0, 0, this.textureKey).setVisible(false);
    this.container.add(this.propImage);
    const wrist = skin.get(WRIST_FRAME);
    const forearm = skin.get('forearm');
    this.wristImage =
      wrist && forearm?.sockets[WRIST_SOCKET]
        ? scene.add
            .image(0, 0, this.textureKey, WRIST_FRAME)
            .setOrigin(wrist.pivot[0] / wrist.w, wrist.pivot[1] / wrist.h)
        : null;
    if (this.wristImage) this.container.add(this.wristImage);
    this.setTint(0xffffff);
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
    const hand = placed.find((p) => p.bone === 'handNear');
    this.placedHand = hand ? { placed: hand, lift } : null;
    const handFar = placed.find((p) => p.bone === 'handFar');
    this.placedHandFar = handFar ? { placed: handFar, lift } : null;
    const head = placed.find((p) => p.bone === 'head');
    this.placedHead = head ? { placed: head, lift } : null;
    const prop = solveProp(this.skin, placed, pose);
    this.placedProp = prop ? { placed: prop, lift } : null;
    this.propImage.setVisible(prop !== null);
    if (prop) {
      if (this.propImage.frame.name !== prop.frame) this.propImage.setFrame(prop.frame);
      this.propImage.setOrigin(prop.originX, prop.originY);
      this.propImage.setPosition(prop.x, prop.y - this.fit.groundY + lift);
      this.propImage.setRotation(prop.rotation);
    }
    this.placeWrist(placed, lift);
    const order = drawOrder(pose, this.orderOptions);
    const key = order.join();
    if (key !== this.order) {
      this.order = key;
      for (const bone of order) {
        const img = this.images.get(bone);
        if (img) this.container.bringToTop(img);
        // o relógio fica logo na frente do antebraço (e atrás da mão)
        if (bone === 'forearmNear' && this.wristImage) this.container.bringToTop(this.wristImage);
      }
    }
    // a peça fica atrás da mão que segura, na frente do resto (inclusive da outra mão,
    // que apoia a arma por baixo). `moveBelow` não sobe a peça quando ela já está
    // abaixo da mão (no fundo, depois de reordenar os ossos): por isso os dois no topo.
    const handImg = this.images.get('handNear');
    this.container.bringToTop(this.propImage);
    if (handImg) this.container.bringToTop(handImg);
    const unit = this.height / 100;
    this.container.setPosition(x + pose.x * unit * facing, y + pose.y * unit);
    this.container.setScale(this.scale * facing, this.scale);
  }

  /** Põe o acessório do pulso no socket do antebraço da frente, atravessado nele. */
  private placeWrist(placed: readonly PlacedBone[], lift: number): void {
    const img = this.wristImage;
    const forearm = placed.find((p) => p.bone === 'forearmNear');
    const anchors = forearm && this.skin.get(forearm.frame);
    const wrist = this.skin.get(WRIST_FRAME);
    if (!img || !forearm || !anchors || !wrist) return;
    const [x, y] = placedPoint(anchors, forearm, WRIST_SOCKET);
    img.setPosition(x, y - this.fit.groundY + lift);
    // direção do antebraço na tela, girada 90°: a pulseira dá a volta no pulso
    const deg = (forearm.rotation * 180) / Math.PI + artAngle(anchors) - 90 - artAngle(wrist);
    img.setRotation((deg * Math.PI) / 180);
  }

  /**
   * Um ponto da peça segurada (`pivot`, `tip` ou um socket, como a boca da arma) em px de
   * mundo, na última pose desenhada. Sem peça na mão: null.
   */
  propPoint(socket: string): { x: number; y: number } | null {
    const p = this.placedProp;
    const anchors = p && this.skin.get(p.placed.frame);
    if (!p || !anchors) return null;
    return this.toWorld(placedPoint(anchors, p.placed, socket), p.lift);
  }

  /**
   * O meio da mão da frente em px de mundo, na última pose desenhada. Com `socket`, um
   * encaixe da peça da mão, se ela tiver (a boca do trompete do Tauba).
   */
  handPoint(socket?: string): { x: number; y: number } | null {
    const p = this.placedHand;
    const anchors = p && this.skin.get(p.placed.frame);
    if (!p || !anchors) return null;
    if (socket && anchors.sockets[socket]) {
      return this.toWorld(placedPoint(anchors, p.placed, socket), p.lift);
    }
    const [px, py] = placedPoint(anchors, p.placed, 'pivot');
    const [tx, ty] = placedPoint(anchors, p.placed, 'tip');
    return this.toWorld([(px + tx) / 2, (py + ty) / 2], p.lift);
  }

  /** O meio da mão de trás em px de mundo, na última pose desenhada. */
  farHandPoint(): { x: number; y: number } | null {
    const p = this.placedHandFar;
    const anchors = p && this.skin.get(p.placed.frame);
    if (!p || !anchors) return null;
    const [px, py] = placedPoint(anchors, p.placed, 'pivot');
    const [tx, ty] = placedPoint(anchors, p.placed, 'tip');
    return this.toWorld([(px + tx) / 2, (py + ty) / 2], p.lift);
  }

  /**
   * Um encaixe da mão da frente em px de mundo, só se a peça da mão tiver esse encaixe
   * (a brasa do palheiro só existe na mão com o palheiro). Sem ele: null.
   */
  handSocket(socket: string): { x: number; y: number } | null {
    const p = this.placedHand;
    const anchors = p && this.skin.get(p.placed.frame);
    if (!p || !anchors?.sockets[socket]) return null;
    return this.toWorld(placedPoint(anchors, p.placed, socket), p.lift);
  }

  /** Um encaixe da cabeça (a `mouth`) em px de mundo; sem ele na cabeça atual: null. */
  headPoint(socket: string): { x: number; y: number } | null {
    const p = this.placedHead;
    const anchors = p && this.skin.get(p.placed.frame);
    if (!p || !anchors?.sockets[socket]) return null;
    return this.toWorld(placedPoint(anchors, p.placed, socket), p.lift);
  }

  /**
   * Brilho macio atrás do boneco, do tamanho do corpo (mais alto que largo), pintado
   * de `color`. `pulse` de 0 a 1 faz ele respirar (escala e alpha); `null` esconde.
   * É um sprite aditivo com `tint`: barato, ao contrário do Glow do Phaser
   * (pós-processamento no container), que derrubava o desempenho em tela cheia.
   */
  setAura(color: number, pulse: number | null): this {
    if (pulse === null) {
      this.auraGlow?.setVisible(false);
      return this;
    }
    if (!this.auraGlow) {
      const img = this.container.scene.add.image(0, 0, FX_TEXTURE.glow);
      img.setBlendMode(Phaser.BlendModes.ADD);
      // fica sempre atrás das peças: a troca de ordem só sobe as peças (`bringToTop`)
      this.container.addAt(img, 0);
      this.auraGlow = img;
    }
    const h = this.fit.height;
    const grow = 1 + 0.07 * pulse;
    this.auraGlow
      .setVisible(true)
      .setTint(color)
      .setAlpha(0.55 + 0.3 * pulse)
      .setPosition(0, -h * 0.5)
      .setScale((h * 0.95 * grow) / GLOW_TEXTURE_SIZE, (h * 1.45 * grow) / GLOW_TEXTURE_SIZE);
    return this;
  }

  private toWorld([x, y]: readonly [number, number], lift: number): { x: number; y: number } {
    const c = this.container;
    return { x: c.x + x * c.scaleX, y: c.y + (y - this.fit.groundY + lift) * c.scaleY };
  }

  setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    return this;
  }

  setAlpha(alpha: number): this {
    this.container.setAlpha(alpha);
    return this;
  }

  /**
   * Tinge as peças (0xffffff = cor normal). Todas recebem a mesma cor: os membros de
   * trás ficam na cor original da arte, sem sombra extra.
   */
  setTint(color: number): this {
    for (const img of this.allImages()) {
      if (color === 0xffffff) img.clearTint();
      else img.setTint(color);
    }
    return this;
  }

  /** Clarão do impacto: pinta as peças inteiras de `color` (desfaz com `setTint`). */
  setFlash(color = 0xffffff): this {
    for (const img of this.allImages()) img.setTintFill(color);
    return this;
  }

  private allImages(): Phaser.GameObjects.Image[] {
    const all = [...this.images.values(), this.propImage];
    if (this.wristImage) all.push(this.wristImage);
    return all;
  }

  setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  destroy(): void {
    this.container.destroy();
  }
}
