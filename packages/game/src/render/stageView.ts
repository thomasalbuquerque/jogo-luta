import Phaser from 'phaser';
import { toPx, type Stage } from '@jogo-luta/sim';
import { placeLayer, type CameraView, type ParallaxLayer } from './parallax';

/**
 * Arte do cenário (Etapa 4): camadas do fundo com parallax atrás; o chão (prédio)
 * e as plataformas (tábuas) por cima das caixas de colisão do sim. Gerado pelo
 * `pnpm art` a partir de `art/cenario-<mapa>/`.
 */

interface LayerArt extends ParallaxLayer {
  key: string;
  originX: number;
  originY: number;
  /** Cor que continua a camada para baixo (quando a câmera desce, não aparece buraco). */
  fillBelow?: number;
  /**
   * Camada com o piso que continua esta para baixo, repetido até o pé do chão do
   * mapa (a parede que dá para agarrar); dali para baixo fica a cor `fillBelow`.
   * Vem da arte da camada estendida para baixo (Expansão generativa), então emenda
   * sem linha; só se repete se a câmera pedir mais piso que a imagem tem. Começa
   * `FLOOR_OVERLAP` px da textura acima do pé da camada (as mesmas linhas dela),
   * e o jogo encaixa por essa sobra: sem fresta e sem degrau no desenho.
   */
  floor?: string;
  /**
   * Repete a camada dos lados (a imagem é mais estreita que o necessário):
   * `mirror` espelhada, `repeat` igual (quando o espelho deixaria a mesma peça
   * duas vezes lado a lado na emenda).
   */
  tiles?: 'mirror' | 'repeat';
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
  /**
   * Névoa clara por cima das camadas do fundo: separa o palco (escuro) do fundo
   * quando os dois têm as mesmas cores (a passarela na frente da bancada).
   */
  haze?: { color: number; alpha: number };
  /**
   * Peça repetida para cima a partir de cada socket `chain*` da plataforma,
   * até sair da tela (a corrente que pendura a passarela da oficina). A peça tem
   * o pivô embaixo e o socket `top` em cima, no mesmo ponto da corrente.
   */
  chain?: string;
}

/**
 * Px da arte por px de mundo nas peças e camadas dos cenários: a arte foi
 * ampliada 2× (Real-ESRGAN, ver docs/ARTE.md), então as escalas abaixo dividem
 * por isso.
 */
const ART_RES = 2;

/** Linhas da textura do piso que repetem o pé da camada de cima (ver `floor`). */
const FLOOR_OVERLAP = 8;

/** Até onde a corrente sobe (px de mundo): acima do que a câmera mostra. */
const CHAIN_TOP = -1400;

const LAJE: StageArt = {
  atlas: 'stages/laje',
  ref: { x: 0, y: -88 },
  layers: [
    {
      key: 'sky',
      depth: 0,
      anchorX: 640,
      anchorY: 360,
      scale: 0.9 / ART_RES,
      originX: 0.5,
      originY: 0.5,
    },
    {
      key: 'far',
      depth: 0.12,
      anchorX: 640,
      anchorY: 620,
      scale: 1.1 / ART_RES,
      originX: 0.5,
      originY: 1,
      fillBelow: 0x8d6a86,
    },
    {
      key: 'mid',
      depth: 0.32,
      anchorX: 640,
      anchorY: -215,
      scale: 1 / ART_RES,
      originX: 0.5,
      originY: 0,
      fillBelow: 0x424b26,
      tiles: 'mirror',
    },
  ],
  wall: { color: 0x8a6a64, shadow: 0x2b2230, outline: 0x2b1a22 },
  decorations: [
    { frame: 'tank', x: -250, y: -16, scale: 0.36 / ART_RES },
    { frame: 'grill', x: -360, y: -6, scale: 0.34 / ART_RES },
    { frame: 'chair', x: 300, y: -10, scale: 0.34 / ART_RES, flipX: true },
    { frame: 'cooler', x: 365, y: -6, scale: 0.34 / ART_RES },
  ],
};

const OFICINA: StageArt = {
  atlas: 'stages/oficina',
  ref: { x: 0, y: -88 },
  layers: [
    {
      key: 'back',
      depth: 0.05,
      anchorX: 640,
      anchorY: 330,
      scale: 0.85 / ART_RES,
      originX: 0.5,
      originY: 0.5,
      fillBelow: 0x8f8a8d,
    },
    {
      key: 'far',
      depth: 0.15,
      anchorX: 640,
      anchorY: 640,
      scale: 0.6 / ART_RES,
      originX: 0.5,
      originY: 1,
      fillBelow: 0x8c8b8f,
      tiles: 'repeat',
    },
    {
      key: 'mid',
      depth: 0.35,
      anchorX: 640,
      anchorY: 470,
      scale: 0.5 / ART_RES,
      originX: 0.5,
      originY: 1,
      fillBelow: 0x8f8d90,
      tiles: 'repeat',
      floor: 'floor',
    },
  ],
  wall: { color: 0x8c827e, shadow: 0x2a2a30, outline: 0x26262b },
  decorations: [
    { frame: 'tires', x: -440, y: -24, scale: 0.34 / ART_RES },
    { frame: 'drum', x: -375, y: -24, scale: 0.3 / ART_RES },
    { frame: 'cart', x: 445, y: -24, scale: 0.3 / ART_RES },
  ],
  chain: 'chain',
  haze: { color: 0xeae6e1, alpha: 0.25 },
};

/** Arte de cada mapa do sim, pelo id do mapa. */
const STAGE_ART: Readonly<Record<string, StageArt>> = { test: LAJE, oficina: OFICINA };

const TEXTURE_PREFIX = 'stage-';

/** Carrega a arte de todos os mapas (atlas + camadas do fundo). */
export function loadStages(load: Phaser.Loader.LoaderPlugin): void {
  for (const art of new Set(Object.values(STAGE_ART))) {
    load.atlas(`${TEXTURE_PREFIX}${art.atlas}`, `${art.atlas}.webp`, `${art.atlas}.json`);
    const keys = art.layers.flatMap((layer) =>
      layer.floor ? [layer.key, layer.floor] : [layer.key],
    );
    for (const key of keys) {
      load.image(`${TEXTURE_PREFIX}${art.atlas}-${key}`, `${art.atlas}-${key}.webp`);
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
  /** Piso repetido abaixo da camada (null = sem piso). */
  floor: { key: string; depth: number; tiles: Phaser.GameObjects.Image[] } | null;
}

/** Desenha o cenário e reposiciona o fundo a cada frame, conforme a câmera. */
export class StageView {
  private readonly layers: PlacedLayer[] = [];
  private readonly art: StageArt | undefined;
  /** Pé do chão sólido do mapa (px de mundo): até onde vai o piso das camadas. */
  private readonly groundBottom: number;

  constructor(
    private readonly scene: Phaser.Scene,
    stage: Stage,
    depths: { background: number; stage: number; decoration: number },
  ) {
    this.art = STAGE_ART[stage.id];
    this.groundBottom = Math.max(
      0,
      ...stage.solids.filter((s) => s.kind === 'solid').map((s) => toPx(s.y + s.h)),
    );
    const art = this.art;
    if (!art) {
      this.drawPlaceholder(stage, depths.stage);
      return;
    }
    const atlas = `${TEXTURE_PREFIX}${art.atlas}`;

    art.layers.forEach((layer, i) => {
      const key = `${TEXTURE_PREFIX}${art.atlas}-${layer.key}`;
      const depth = depths.background + i * 0.1;
      const copies = layer.tiles ? [-1, 0, 1] : [0];
      const images = copies.map((c) =>
        scene.add
          .image(0, 0, key)
          .setOrigin(layer.originX, layer.originY)
          .setFlipX(c !== 0 && layer.tiles === 'mirror')
          .setDepth(depth + 0.01),
      );
      const fill = layer.fillBelow
        ? scene.add.rectangle(0, 0, 1, 1, layer.fillBelow).setOrigin(0.5, 0).setDepth(depth)
        : null;
      const floor = layer.floor
        ? { key: `${TEXTURE_PREFIX}${art.atlas}-${layer.floor}`, depth: depth + 0.005, tiles: [] }
        : null;
      this.layers.push({ art: layer, images, fill, floor });
    });
    if (art.haze) {
      // presa na tela e bem maior que ela: cobre o fundo com qualquer zoom
      scene.add
        .rectangle(0, 0, 40000, 40000, art.haze.color, art.haze.alpha)
        .setScrollFactor(0)
        .setDepth(depths.background + art.layers.length * 0.1);
    }

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
    for (const { art: layer, images, fill, floor } of this.layers) {
      const p = placeLayer(layer, cam, art.ref);
      const first = images[0];
      const w = first ? first.width * p.scale : 0;
      const h = first ? first.height * p.scale : 0;
      images.forEach((img, i) => {
        const offset = images.length > 1 ? (i - 1) * w : 0;
        img.setPosition(p.x + offset, p.y).setScale(p.scale);
      });
      // começa um pouco antes do pé da camada (sem fresta)
      const bottom = p.y + h * (1 - layer.originY) - 2;
      let fillTop = bottom;
      if (floor) {
        const top = p.y + h * (1 - layer.originY) - FLOOR_OVERLAP * p.scale;
        this.placeFloor(floor, p.x, top, p.scale, images.length);
        fillTop = Math.max(bottom, this.groundBottom);
      }
      // e a cor vai até bem abaixo da tela
      fill?.setPosition(p.x, fillTop).setSize(w * images.length, cam.height / cam.zoom + 4000);
    }
  }

  /**
   * Piso abaixo de uma camada: fileiras da textura (que já emenda com ela mesma)
   * do pé da camada até o pé do chão do mapa, uma coluna por cópia da camada. A
   * última fileira é cortada no pé do chão. Imagens comuns, não TileSprite: no
   * Phaser 3 ele redesenha um canvas do tamanho dele quando o tamanho muda.
   */
  private placeFloor(
    floor: NonNullable<PlacedLayer['floor']>,
    x: number,
    top: number,
    scale: number,
    columns: number,
  ): void {
    const source = this.scene.textures.get(floor.key).getSourceImage();
    const rowH = source.height * scale;
    const colW = source.width * scale;
    const floorH = Math.max(0, this.groundBottom - top);
    const rows = Math.ceil(floorH / rowH);
    let n = 0;
    for (let r = 0; r < rows; r++) {
      const visibleH = Math.min(rowH, floorH - r * rowH) / scale;
      for (let c = 0; c < columns; c++) {
        let tile = floor.tiles[n];
        if (!tile) {
          tile = this.scene.add.image(0, 0, floor.key).setOrigin(0.5, 0).setDepth(floor.depth);
          floor.tiles.push(tile);
        }
        n++;
        const offset = columns > 1 ? (c - (columns - 1) / 2) * colW : 0;
        tile
          .setVisible(true)
          .setPosition(x + offset, top + r * rowH)
          .setScale(scale)
          .setCrop(0, 0, source.width, Math.ceil(visibleH));
      }
    }
    for (let i = n; i < floor.tiles.length; i++) floor.tiles[i]?.setVisible(false);
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
        if (art.chain) {
          for (const [name, p] of Object.entries(a.sockets)) {
            if (!name.startsWith('chain')) continue;
            this.drawChain(
              atlas,
              art.chain,
              x + (p[0] - a.pivot[0]) * scale,
              y + (p[1] - a.pivot[1]) * scale,
              scale,
              depth - 0.02,
            );
          }
        }
      }
    }
    // a sombra cobre o pé da arte do prédio, para não aparecer a emenda
    g.setDepth(depth + 0.01);
  }

  /** Corrente repetida do ponto (x, y) para cima, até sair da tela. */
  private drawChain(
    atlas: string,
    frame: string,
    x: number,
    y: number,
    scale: number,
    depth: number,
  ): void {
    const f = this.scene.textures.getFrame(atlas, frame);
    const a = anchorsOf(f);
    const top = a.sockets.top ?? [a.pivot[0], 0];
    const step = (a.pivot[1] - top[1]) * scale;
    if (step <= 0) return;
    for (let bottom = y; bottom > CHAIN_TOP; bottom -= step) {
      this.scene.add
        .image(x, bottom, atlas, frame)
        .setOrigin(a.pivot[0] / f.width, a.pivot[1] / f.height)
        .setScale(scale)
        .setDepth(depth);
    }
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
