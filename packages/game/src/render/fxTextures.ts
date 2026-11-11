import type Phaser from 'phaser';

/**
 * Texturas dos efeitos genéricos (impacto, fumaça, KO), desenhadas em código no
 * boot: brancas, para tingir com a cor que quiser.
 */
export const FX_TEXTURE = {
  /** Brilho redondo e macio. */
  glow: 'fx-glow',
  /** Faísca comprida (aponta para a direita). */
  spark: 'fx-spark',
  /** Anel da onda de choque. */
  ring: 'fx-ring',
  /** Estrela de impacto, estilo quadrinho. */
  star: 'fx-star',
  /** Nuvem de fumaça/poeira. */
  smoke: 'fx-smoke',
} as const;

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  draw(tex.getContext(), w, h);
  tex.refresh();
}

function radial(
  ctx: CanvasRenderingContext2D,
  r: number,
  stops: readonly (readonly [number, number])[],
): void {
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  for (const [at, alpha] of stops) g.addColorStop(at, `rgba(255,255,255,${String(alpha)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r * 2, r * 2);
}

export function createFxTextures(scene: Phaser.Scene): void {
  make(scene, FX_TEXTURE.glow, 64, 64, (ctx) => {
    radial(ctx, 32, [
      [0, 1],
      [0.35, 0.6],
      [1, 0],
    ]);
  });

  make(scene, FX_TEXTURE.spark, 64, 12, (ctx) => {
    // círculo esticado na horizontal: miolo forte, pontas finas
    ctx.scale(64 / 12, 1);
    radial(ctx, 6, [
      [0, 1],
      [0.4, 0.85],
      [1, 0],
    ]);
  });

  make(scene, FX_TEXTURE.ring, 128, 128, (ctx) => {
    ctx.strokeStyle = '#ffffff';
    for (const [width, alpha] of [
      [14, 0.25],
      [8, 0.6],
      [4, 1],
    ] as const) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(64, 64, 54, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  make(scene, FX_TEXTURE.star, 128, 128, (ctx) => {
    const points = 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      // pontas de tamanhos alternados, como um "POW" de quadrinho
      const r = i % 2 === 1 ? 20 : i % 4 === 0 ? 62 : 44;
      const a = (i / (points * 2)) * Math.PI * 2;
      const x = 64 + Math.cos(a) * r;
      const y = 64 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });

  make(scene, FX_TEXTURE.smoke, 64, 64, (ctx) => {
    // bolhas sobrepostas: borda irregular, mais "nuvem" que o glow
    for (const [x, y, r] of [
      [32, 34, 22],
      [22, 28, 15],
      [42, 26, 14],
      [30, 22, 13],
      [44, 38, 12],
    ] as const) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.75)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
