import Phaser from 'phaser';
import { toPx, type Stage } from '@jogo-luta/sim';
import { placeLayer, type CameraView, type ParallaxLayer } from './parallax';

/**
 * Arte do cenário (Etapa 4): céu, morros e lajes vizinhas com parallax atrás; o
 * prédio e as tábuas por cima das caixas de colisão do sim. Gerado pelo
 * `pnpm art` a partir de `art/cenario-laje/`.
 */

interface LayerArt extends ParallaxLayer {
  key: string;
  originX: number;
  originY: number;
  /** Cor que continua a camada para baixo (quando a câmera desce, não aparece buraco). */
  fillBelow?: number;
  /** Repete a camada espelhada dos lados (a imagem é mais estreita que o necessário). */
  mirrorTiles?: boolean;
}

interface Decoration {
  frame: string;
  /** Pé da peça, em px de mundo. */
  x: number;
  y: number;
  scale: number;
  flipX?: boolean;
}

interface StageArt {
  atlas: string;
  /** Câmera de referência das camadas (a do começo da luta). */
  ref: { x: number; y: number };
  layers: readonly LayerArt[];
  /** Parede que continua abaixo da arte do prédio e escurece. */
  wall: { color: number; shadow: number; outline: number };
  decorations: readonly Decoration[];
}

const LAJE: StageArt = {
  atlas: 'stages/laje',
  ref: { x: 0, y: -88 },
  layers: [
    { key: 'sky', depth: 0, anchorX: 640, anchorY: 360, scale: 0.9, originX: 0.5, originY: 0.5 },
    {
      key: 'far',
      depth: 0.12,
      anchorX: 640,
      anchorY: 620,
      scale: 1.1,
      originX: 0.5,
      originY: 1,
      fillBelow: 0x8d6a86,
    },
    {
      key: 'mid',
      depth: 0.32,
      anchorX: 640,
      anchorY: -215,
      scale: 1,
      originX: 0.5,
      originY: 0,
      fillBelow: 0x424b26,
      mirrorTiles: true,
    },
  ],
  wall: { color: 0x8a6a64, shadow: 0x2b2230, outline: 0x2b1a22 },
  decorations: [
    { frame: 'tank', x: -250, y: -16, scale: 0.36 },
    { frame: 'grill', x: -360, y: -6, scale: 0.34 },
    { frame: 'chair', x: 300, y: -10, scale: 0.34, flipX: true },
    { frame: 'cooler', x: 365, y: -6, scale: 0.34 },
  ],
};

/** Arte de cada mapa do sim, pelo id do mapa. */
const STAGE_ART: Readonly<Record<string, StageArt>> = { test: LAJE };

const TEXTURE_PREFIX = 'stage-';

/** Carrega a arte de todos os mapas (atlas + camadas do fundo). */
export function loadStages(load: Phaser.Loader.LoaderPlugin): void {
  for (const art of new Set(Object.values(STAGE_ART))) {
    load.atlas(`${TEXTURE_PREFIX}${art.atlas}`, `${art.atlas}.webp`, `${art.atlas}.json`);
    for (const layer of art.layers) {
      load.image(`${TEXTURE_PREFIX}${art.atlas}-${layer.key}`, `${art.atlas}-${layer.key}.webp`);
    }
  }
}

interface FrameAnchors {
  pivot: [number, number];
  sockets: Record<string, [number, number]>;
}

function anchorsOf(frame: Phaser.Textures.Frame): FrameAnchors {
  const data = frame.customData as { anchors?: Partial<FrameAnchors> };
  return {
    pivot: data.anchors?.pivot ?? [0, 0],
    sockets: data.anchors?.sockets ?? {},
  };
}

interface PlacedLayer {
  art: LayerArt;
  images: Phaser.GameObjects.Image[];
  fill: Phaser.GameObjects.Rectangle | null;
}

/** Desenha o cenário e reposiciona o fundo a cada frame, conforme a câmera. */
export class StageView {
  private readonly layers: PlacedLayer[] = [];
  private readonly art: StageArt | undefined;

  constructor(
    private readonly scene: Phaser.Scene,
    stage: Stage,
    depths: { background: number; stage: number; decoration: number },
  ) {
    this.art = STAGE_ART[stage.id];
    const art = this.art;
    if (!art) {
      this.drawPlaceholder(stage, depths.stage);
      return;
    }
    const atlas = `${TEXTURE_PREFIX}${art.atlas}`;

    art.layers.forEach((layer, i) => {
      const key = `${TEXTURE_PREFIX}${art.atlas}-${layer.key}`;
      const depth = depths.background + i * 0.1;
      const copies = layer.mirrorTiles ? [-1, 0, 1] : [0];
      const images = copies.map((c) =>
        scene.add
          .image(0, 0, key)
          .setOrigin(layer.originX, layer.originY)
          .setFlipX(c !== 0)
          .setDepth(depth + 0.01),
      );
      const fill = layer.fillBelow
        ? scene.add.rectangle(0, 0, 1, 1, layer.fillBelow).setOrigin(0.5, 0).setDepth(depth)
        : null;
      this.layers.push({ art: layer, images, fill });
    });

    this.drawBuilding(stage, atlas, depths.stage);
    for (const d of art.decorations) {
      scene.add
        .image(d.x, d.y, atlas, d.frame)
        .setOrigin(...originOf(scene, atlas, d.frame))
        .setScale(d.scale)
        .setFlipX(d.flipX ?? false)
        .setDepth(depths.decoration);
    }
  }

  /** Reposiciona as camadas do fundo para a câmera atual. */
  update(cam: CameraView): void {
    const art = this.art;
    if (!art) return;
    for (const { art: layer, images, fill } of this.layers) {
      const p = placeLayer(layer, cam, art.ref);
      const first = images[0];
      const w = first ? first.width * p.scale : 0;
      const h = first ? first.height * p.scale : 0;
      images.forEach((img, i) => {
        const offset = images.length > 1 ? (i - 1) * w : 0;
        img.setPosition(p.x + offset, p.y).setScale(p.scale);
      });
      if (fill) {
        // começa um pouco antes do pé da camada (sem fresta) e vai até bem abaixo da tela
        const bottom = p.y + h * (1 - layer.originY) - 2;
        fill.setPosition(p.x, bottom).setSize(w * images.length, cam.height / cam.zoom + 4000);
      }
    }
  }

  /** Prédio por cima da plataforma principal; tábuas por cima das plataformas finas. */
  private drawBuilding(stage: Stage, atlas: string, depth: number): void {
    const scene = this.scene;
    const art = this.art;
    if (!art) return;
    const building = scene.textures.getFrame(atlas, 'building');
    const plank = scene.textures.getFrame(atlas, 'plank');
    const g = scene.add.graphics().setDepth(depth - 0.01);

    for (const s of stage.solids) {
      const x = toPx(s.x);
      const y = toPx(s.y);
      const w = toPx(s.w);
      if (s.kind === 'solid') {
        const a = anchorsOf(building);
        const left = a.sockets.wallLeft ?? [0, 0];
        const right = a.sockets.wallRight ?? [building.width, 0];
        const scale = w / (right[0] - left[0]);
        // o pivô (meio do topo, onde se pisa) vai no meio do topo da caixa
        scene.add
          .image(x + w / 2, y, atlas, 'building')
          .setOrigin(a.pivot[0] / building.width, a.pivot[1] / building.height)
          .setScale(scale)
          .setDepth(depth);
        // a parede continua para baixo e some na sombra
        const artBottom = y + (building.height - a.pivot[1]) * scale;
        const top = artBottom - 4;
        const shadowTop = y + 120;
        const deep = 4000;
        g.fillStyle(art.wall.color, 1);
        g.fillRect(x, top, w, shadowTop + 260 - top);
        g.fillGradientStyle(
          art.wall.shadow,
          art.wall.shadow,
          art.wall.shadow,
          art.wall.shadow,
          0,
          0,
          1,
          1,
        );
        g.fillRect(x, shadowTop, w, 260);
        g.fillStyle(art.wall.shadow, 1);
        g.fillRect(x, shadowTop + 259, w, deep);
        g.fillStyle(art.wall.outline, 1);
        g.fillRect(x, top, 3, deep);
        g.fillRect(x + w - 3, top, 3, deep);
      } else {
        const a = anchorsOf(plank);
        const right = a.sockets.right ?? [plank.width, a.pivot[1]];
        const scale = w / (right[0] - a.pivot[0]);
        scene.add
          .image(x, y, atlas, 'plank')
          .setOrigin(a.pivot[0] / plank.width, a.pivot[1] / plank.height)
          .setScale(scale)
          .setDepth(depth);
      }
    }
    // a sombra cobre o pé da arte do prédio, para não aparecer a emenda
    g.setDepth(depth + 0.01);
  }

  /** Mapa sem arte: as caixas de colisão em cinza (como na Etapa 1). */
  private drawPlaceholder(stage: Stage, depth: number): void {
    const g = this.scene.add.graphics().setDepth(depth);
    for (const s of stage.solids) {
      g.fillStyle(s.kind === 'solid' ? 0x5c677d : 0x8d99ae, 1);
      g.fillRect(toPx(s.x), toPx(s.y), toPx(s.w), toPx(s.h));
    }
  }
}

/** Origem da imagem no pivô da peça (o pé, nas decorações). */
function originOf(scene: Phaser.Scene, atlas: string, frame: string): [number, number] {
  const f = scene.textures.getFrame(atlas, frame);
  const a = anchorsOf(f);
  return [a.pivot[0] / f.width, a.pivot[1] / f.height];
}
