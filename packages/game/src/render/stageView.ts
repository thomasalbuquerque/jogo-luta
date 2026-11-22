import Phaser from 'phaser';
import { toPx, type Stage } from '@jogo-luta/sim';
import { placeLayer, type CameraView, type ParallaxLayer } from './parallax';

/**
 * Arte do cenário (Etapa 4): camadas do fundo com parallax atrás; o chão (prédio)
 * e as plataformas (tábuas) por cima das caixas de colisão do sim. Gerado pelo
 * `pnpm art` a partir de `art/cenario-<mapa>/`.
 */

interface LayerArt extends Omit<ParallaxLayer, 'scale'> {
  key: string;
  /**
   * Largura da camada na tela (px), com a câmera de referência e zoom 1. A escala
   * sai daqui e do tamanho da textura: a arte pode ser gravada em qualquer resolução.
   */
  width: number;
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

interface BlockArt {
  /** Peça do atlas, com `wallLeft` e `wallRight` (as paredes da caixa). */
  frame: string;
  /** Cor abaixo da arte (padrão: `wall.color`). */
  color?: number;
  /** Desenha atrás dos outros blocos (o forno atrás da ponta da bancada). */
  behind?: boolean;
}

interface StageArt {
  atlas: string;
  /** Câmera de referência das camadas (a do começo da luta). */
  ref: { x: number; y: number };
  layers: readonly LayerArt[];
  /** Parede que continua abaixo da arte do prédio e escurece. */
  wall: {
    color: number;
    shadow: number;
    outline: number;
    /**
     * Onde a arte acaba: `top` (padrão) escurece num degradê a partir de 120 px
     * abaixo do topo, por cima do pé da arte; `foot` corta a arte exatamente no pé
     * da caixa de colisão (onde a parede de agarrar acaba) e dali para baixo é a
     * cor da parede (`color`, a média do concreto), quando a arte desce até lá.
     */
    shadowFrom?: 'top' | 'foot';
    /**
     * Com `shadowFrom: 'foot'`: contorno (`outline`) dos lados da cor de baixo, para a
     * parede não "abrir" onde a arte acaba.
     */
    sides?: boolean;
  };
  /**
   * Arte de cada bloco sólido do sim, na ordem dos blocos (padrão: `building` em
   * todos, com a cor `wall.color`). A confeitaria tem dois: a bancada e o forno.
   */
  blocks?: readonly BlockArt[];
  decorations: readonly Decoration[];
  /**
   * Peça repetida para cima a partir de cada socket `chain*` da plataforma,
   * até sair da tela (a corrente que pendura a passarela da oficina). A peça tem
   * o pivô embaixo e o socket `top` em cima, no mesmo ponto da corrente.
   */
  chain?: string;
}

/**
 * Px da arte por px de mundo nas peças dos cenários: a arte foi ampliada 2×
 * (Real-ESRGAN, ver docs/ARTE.md), então as escalas das decorações dividem por isso.
 */
const ART_RES = 2;

/**
 * Os enfeites da confeitaria saem da folha numa escala menor (0,75, ver o
 * `recortes.json` dela), para o atlas caber em 4096 × 2048; a escala deles divide
 * por isso. Na tela eles ficam menores que a arte mesmo assim.
 */
const DECOR_RES = 0.75;

/** Linhas da folha (ampliada) que o piso repete do pé da camada de cima (ver `floor`). */
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
      width: 1382.4,
      originX: 0.5,
      originY: 0.5,
    },
    {
      key: 'far',
      depth: 0.12,
      anchorX: 640,
      anchorY: 620,
      width: 1689.6,
      originX: 0.5,
      originY: 1,
      fillBelow: 0x8d6a86,
    },
    {
      key: 'mid',
      depth: 0.32,
      anchorX: 640,
      anchorY: -215,
      width: 1536,
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
      width: 1421.2,
      originX: 0.5,
      originY: 0.5,
      fillBelow: 0xa6a1a2,
    },
    {
      key: 'far',
      depth: 0.15,
      anchorX: 640,
      anchorY: 640,
      width: 1002.6,
      originX: 0.5,
      originY: 1,
      fillBelow: 0xa4a2a4,
      tiles: 'repeat',
    },
    {
      key: 'mid',
      depth: 0.35,
      anchorX: 640,
      anchorY: 470,
      width: 836,
      originX: 0.5,
      originY: 1,
      fillBelow: 0xa6a3a4,
      tiles: 'repeat',
      floor: 'floor',
    },
  ],
  // a arte do bloco foi estendida até o pé da caixa (ver docs/ARTE.md)
  wall: {
    color: 0x8f847f,
    shadow: 0x2a2a30,
    outline: 0x26262b,
    shadowFrom: 'foot',
  },
  decorations: [
    // em cima da face de cima do bloco (um trapézio: a borda de trás, em y -34, é
    // mais estreita), atrás dos lutadores
    { frame: 'tires', x: -412, y: -8, scale: 0.34 / ART_RES },
    { frame: 'drum', x: -358, y: -8, scale: 0.3 / ART_RES },
    { frame: 'cart', x: 410, y: -8, scale: 0.3 / ART_RES },
  ],
  chain: 'chain',
};

const CONFEITARIA: StageArt = {
  atlas: 'stages/confeitaria',
  ref: { x: 0, y: -88 },
  layers: [
    {
      key: 'back',
      depth: 0.05,
      anchorX: 640,
      anchorY: 330,
      width: 1421.2,
      originX: 0.5,
      originY: 0.5,
      fillBelow: 0xf0d8c1,
    },
    {
      key: 'far',
      depth: 0.15,
      anchorX: 640,
      anchorY: 640,
      width: 1003.2,
      originX: 0.5,
      originY: 1,
      fillBelow: 0xe1c3aa,
      tiles: 'mirror',
    },
    {
      key: 'mid',
      depth: 0.35,
      anchorX: 640,
      anchorY: 500,
      width: 919.6,
      originX: 0.5,
      originY: 1,
      // a cor do pé do piso estendido (escurece embaixo), já com o tom da camada
      fillBelow: 0xa18870,
      tiles: 'mirror',
      floor: 'floor',
    },
  ],
  // a bancada e o forno foram estendidos até o pé da caixa (ver docs/ARTE.md)
  wall: {
    color: 0xf3c59a,
    shadow: 0x3a2618,
    outline: 0x2e1d12,
    shadowFrom: 'foot',
    sides: true,
  },
  blocks: [{ frame: 'building' }, { frame: 'oven', color: 0xb89d85, behind: true }],
  decorations: [
    // em cima da bancada e do forno, atrás dos lutadores
    { frame: 'flour', x: -440, y: -4, scale: 0.3 / ART_RES / DECOR_RES },
    { frame: 'jar', x: -355, y: -4, scale: 0.28 / ART_RES / DECOR_RES },
    { frame: 'mixer', x: -60, y: -4, scale: 0.32 / ART_RES / DECOR_RES },
    { frame: 'stand', x: 470, y: -69, scale: 0.3 / ART_RES / DECOR_RES },
  ],
};

/** Arte de cada mapa do sim, pelo id do mapa. */
const STAGE_ART: Readonly<Record<string, StageArt>> = {
  test: LAJE,
  oficina: OFICINA,
  confeitaria: CONFEITARIA,
};

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

/**
 * Contorno dos lados do bloco, na linha do pé (x de fora e de dentro da linha
 * escura, em px da peça): sockets `edgeLeft`/`edgeLeftIn` e `edgeRightIn`/`edgeRight`.
 * Abaixo do pé, a cor e o contorno do bloco continuam desses x. Sem eles, vão da
 * borda da caixa.
 */
function edgesOf(a: FrameAnchors): { left: [number, number]; right: [number, number] } | null {
  const s = a.sockets;
  if (!s.edgeLeft || !s.edgeLeftIn || !s.edgeRightIn || !s.edgeRight) return null;
  return { left: [s.edgeLeft[0], s.edgeLeftIn[0]], right: [s.edgeRightIn[0], s.edgeRight[0]] };
}

/** Tamanho e corte de uma camada gravada (o `layers` do JSON do atlas, do `pnpm art`). */
interface LayerInfo {
  /** Tamanho da camada inteira, em px da textura (antes de cortar o vazio de cima). */
  w: number;
  h: number;
  /** Linhas vazias cortadas de cima: a textura tem `h - top` de altura. */
  top: number;
  /** px da textura por px da folha. */
  scale: number;
}

function layerInfo(scene: Phaser.Scene, atlas: string, name: string, key: string): LayerInfo {
  const data = scene.textures.get(atlas).customData as {
    layers?: Record<string, Partial<LayerInfo>>;
  };
  const info = data.layers?.[name];
  const source = scene.textures.get(key).getSourceImage();
  return {
    w: info?.w ?? source.width,
    h: info?.h ?? source.height,
    top: info?.top ?? 0,
    scale: info?.scale ?? 1,
  };
}

interface PlacedLayer {
  art: LayerArt;
  /** A camada para o parallax, com a escala da textura dela. */
  place: ParallaxLayer;
  info: LayerInfo;
  images: Phaser.GameObjects.Image[];
  fill: Phaser.GameObjects.Rectangle | null;
  /** Piso repetido abaixo da camada (null = sem piso). */
  floor: {
    key: string;
    depth: number;
    /** Linhas da textura do piso que repetem o pé da camada. */
    overlap: number;
    tiles: Phaser.GameObjects.Image[];
  } | null;
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
      const info = layerInfo(scene, atlas, layer.key, key);
      const depth = depths.background + i * 0.1;
      const copies = layer.tiles ? [-1, 0, 1] : [0];
      // a textura não tem o vazio de cima da camada: a origem conta a partir dele
      const originY = (layer.originY * info.h - info.top) / (info.h - info.top);
      const images = copies.map((c) =>
        scene.add
          .image(0, 0, key)
          .setOrigin(layer.originX, originY)
          .setFlipX(c !== 0 && layer.tiles === 'mirror')
          .setDepth(depth + 0.01),
      );
      const fill = layer.fillBelow
        ? scene.add.rectangle(0, 0, 1, 1, layer.fillBelow).setOrigin(0.5, 0).setDepth(depth)
        : null;
      const floor = layer.floor ? this.floorOf(atlas, layer.floor, depth + 0.005) : null;
      const place = { ...layer, scale: layer.width / info.w };
      this.layers.push({ art: layer, place, info, images, fill, floor });
    });

    // a rampa fica na frente dos enfeites (o biscoito encostado na frente do pote)
    this.drawBuilding(stage, atlas, depths.stage, depths.decoration + 0.5);
    for (const d of art.decorations) {
      scene.add
        .image(d.x, d.y, atlas, d.frame)
        .setOrigin(...originOf(scene, atlas, d.frame))
        .setScale(d.scale)
        .setFlipX(d.flipX ?? false)
        .setDepth(depths.decoration);
    }
  }

  private floorOf(atlas: string, name: string, depth: number): NonNullable<PlacedLayer['floor']> {
    const key = `${atlas}-${name}`;
    const overlap = FLOOR_OVERLAP * layerInfo(this.scene, atlas, name, key).scale;
    return { key, depth, overlap, tiles: [] };
  }

  /** Reposiciona as camadas do fundo para a câmera atual. */
  update(cam: CameraView): void {
    const art = this.art;
    if (!art) return;
    for (const { art: layer, place, info, images, fill, floor } of this.layers) {
      const p = placeLayer(place, cam, art.ref);
      const w = info.w * p.scale;
      const h = info.h * p.scale;
      images.forEach((img, i) => {
        const offset = images.length > 1 ? (i - 1) * w : 0;
        img.setPosition(p.x + offset, p.y).setScale(p.scale);
      });
      // começa um pouco antes do pé da camada (sem fresta)
      const bottom = p.y + h * (1 - layer.originY) - 2;
      let fillTop = bottom;
      if (floor) {
        const foot = p.y + h * (1 - layer.originY);
        this.placeFloor(floor, p.x, foot, w, images.length, layer.tiles === 'mirror');
        fillTop = Math.max(bottom, this.groundBottom);
      }
      // e a cor vai até bem abaixo da tela
      fill?.setPosition(p.x, fillTop).setSize(w * images.length, cam.height / cam.zoom + 4000);
    }
  }

  /**
   * Piso abaixo de uma camada: fileiras da textura (que já emenda com ela mesma)
   * do pé da camada até o pé do chão do mapa, uma coluna por cópia da camada
   * (espelhada como ela, com `mirror`). A última fileira é cortada no pé do chão.
   * Imagens comuns, não TileSprite: no Phaser 3 ele redesenha um canvas do tamanho
   * dele quando o tamanho muda.
   */
  private placeFloor(
    floor: NonNullable<PlacedLayer['floor']>,
    x: number,
    layerFoot: number,
    colW: number,
    columns: number,
    mirror: boolean,
  ): void {
    const source = this.scene.textures.get(floor.key).getSourceImage();
    // cada coluna do piso tem a largura da camada, seja qual for a resolução da textura
    const scale = colW / source.width;
    const rowH = source.height * scale;
    const top = layerFoot - floor.overlap * scale;
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
          .setFlipX(mirror && c !== (columns - 1) / 2)
          .setCrop(0, 0, source.width, Math.ceil(visibleH));
      }
    }
    for (let i = n; i < floor.tiles.length; i++) floor.tiles[i]?.setVisible(false);
  }

  /** Prédio por cima da plataforma principal; tábuas por cima das plataformas finas e das rampas. */
  private drawBuilding(stage: Stage, atlas: string, depth: number, rampDepth: number): void {
    const scene = this.scene;
    const art = this.art;
    if (!art) return;
    const plank = scene.textures.getFrame(atlas, 'plank');
    const g = scene.add.graphics().setDepth(depth - 0.01);
    let blockIndex = 0;

    for (const s of stage.solids) {
      const x = toPx(s.x);
      const y = toPx(s.y);
      const w = toPx(s.w);
      if (s.kind === 'solid') {
        const block = art.blocks?.[blockIndex] ?? { frame: 'building' };
        blockIndex++;
        const building = scene.textures.getFrame(atlas, block.frame);
        const a = anchorsOf(building);
        const left = a.sockets.wallLeft ?? [0, 0];
        const right = a.sockets.wallRight ?? [building.width, 0];
        const scale = w / (right[0] - left[0]);
        // o pivô (meio do topo, onde se pisa) vai no meio do topo da caixa
        const image = scene.add
          .image(x + w / 2, y, atlas, block.frame)
          .setOrigin(a.pivot[0] / building.width, a.pivot[1] / building.height)
          .setScale(scale)
          .setDepth(block.behind ? depth - 0.005 : depth);
        if (art.wall.shadowFrom === 'foot') {
          const foot = y + toPx(s.h);
          // a arte acaba no pé da caixa (1 px a mais some debaixo da sombra, sem fresta)
          // ou antes, se ela não chega até lá; dali para baixo é a cor do bloco
          const cropH = Math.min(building.height, Math.ceil(a.pivot[1] + (foot - y) / scale) + 1);
          image.setCrop(0, 0, building.width, cropH);
          const fillTop = Math.min(foot, y + (cropH - a.pivot[1]) * scale - 2);
          // x de mundo de um ponto da peça
          const worldX = (px: number): number => x + w / 2 + (px - a.pivot[0]) * scale;
          const edges = edgesOf(a);
          // o contorno da arte (quando marcado) diz onde a cor começa e acaba
          const left = edges ? worldX(edges.left[0]) : x;
          const right = edges ? worldX(edges.right[1]) : x + w;
          g.fillStyle(block.color ?? art.wall.color, 1);
          g.fillRect(left, fillTop, right - left, 4000);
          if (art.wall.sides) {
            // o contorno continua da arte para baixo, no mesmo lugar e da mesma grossura
            const t = Math.max(2, Math.round(10 * scale));
            const [l0, l1] = edges ? [left, worldX(edges.left[1])] : [x, x + t];
            const [r0, r1] = edges ? [worldX(edges.right[0]), right] : [x + w - t, x + w];
            g.fillStyle(art.wall.outline, 1);
            g.fillRect(l0, fillTop, l1 - l0, 4000);
            g.fillRect(r0, fillTop, r1 - r0, 4000);
          }
          continue;
        }
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
      } else if (s.kind === 'ramp') {
        // a mesma tábua (o biscoito gigante, na confeitaria) deitada na diagonal:
        // o topo dela, onde se pisa, vai da quina de baixo à de cima da caixa
        const h = toPx(s.h);
        const a = anchorsOf(plank);
        const right = a.sockets.right ?? [plank.width, a.pivot[1]];
        const scale = Math.hypot(w, h) / (right[0] - a.pivot[0]);
        // grossa como a plataforma do mapa (a rampa é curta: na escala dela, a
        // tábua viraria um palito); só o comprimento encolhe
        const platform = stage.solids.find((p) => p.kind === 'platform');
        const thick = platform ? toPx(platform.w) / (right[0] - a.pivot[0]) : scale;
        const up = s.up ?? 1;
        scene.add
          .image(x, up === 1 ? y + h : y, atlas, 'plank')
          .setOrigin(a.pivot[0] / plank.width, a.pivot[1] / plank.height)
          .setScale(scale, Math.max(scale, thick))
          .setRotation(up * -Math.atan2(h, w))
          .setDepth(rampDepth);
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
      if (s.kind === 'ramp') {
        const [x0, x1, y0, y1] = [toPx(s.x), toPx(s.x + s.w), toPx(s.y), toPx(s.y + s.h)];
        // triângulo embaixo da diagonal
        if (s.up === -1) g.fillTriangle(x0, y0, x1, y1, x0, y1);
        else g.fillTriangle(x0, y1, x1, y0, x1, y1);
        continue;
      }
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
