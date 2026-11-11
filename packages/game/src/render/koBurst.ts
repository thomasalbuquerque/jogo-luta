import Phaser from 'phaser';
import type { EdgePoint } from './koEdge';

/** Duração da explosão do KO (tempo real). */
const KO_BURST_MS = 900;

interface Burst {
  at: EdgePoint;
  color: number;
  age: number;
  /** Raios em volta do feixe: ângulo relativo e comprimento. */
  rays: { angle: number; length: number }[];
}

/**
 * Explosão do KO na borda da tela: feixe na cor do jogador saindo da borda,
 * raios, anel e um clarão rápido na tela toda. Desenhada em coordenadas de
 * tela (numa cena sem zoom, como o HUD).
 */
export class KoBurstLayer {
  /** Cor do jogador (mistura normal: aditiva sobre o céu claro vira só branco). */
  private readonly gfx: Phaser.GameObjects.Graphics;
  /** Miolo brilhante, aditivo. */
  private readonly glow: Phaser.GameObjects.Graphics;
  private readonly flash: Phaser.GameObjects.Rectangle;
  private readonly bursts: Burst[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    const { width, height } = scene.scale;
    this.flash = scene.add.rectangle(0, 0, width, height, 0xffffff, 0).setOrigin(0, 0).setDepth(-1);
    this.gfx = scene.add.graphics().setDepth(-1);
    this.glow = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setDepth(-1);
  }

  spawn(at: EdgePoint, color: number): void {
    const rays = Array.from({ length: 9 }, () => ({
      angle: (Math.random() - 0.5) * 2.4,
      length: 0.5 + Math.random() * 0.6,
    }));
    this.bursts.push({ at, color, age: 0, rays });
  }

  update(dtMs: number): void {
    this.gfx.clear();
    this.glow.clear();
    let flash = 0;
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      if (!b) continue;
      b.age += dtMs;
      const t = b.age / KO_BURST_MS;
      if (t >= 1) {
        this.bursts.splice(i, 1);
        continue;
      }
      flash = Math.max(flash, 0.3 * (1 - t * 6));
      this.drawBurst(b, t);
    }
    this.flash.setFillStyle(0xffffff, Math.max(0, flash));
  }

  private drawBurst(b: Burst, t: number): void {
    const g = this.gfx;
    const { x, y, angle } = b.at;
    const grow = 1 - (1 - Math.min(t * 2.5, 1)) ** 3;
    const fade = (1 - t) ** 1.5;
    const reach = Math.hypot(this.scene.scale.width, this.scene.scale.height) * 0.55;

    // feixe largo e raios na cor do jogador
    // camadas: borda transparente, centro forte (parece um degradê)
    for (const [half, alpha, len] of [
      [0.4, 0.3, 0.85],
      [0.26, 0.45, 1],
      [0.14, 0.6, 1.1],
    ] as const) {
      cone(g, x, y, angle, half * (1 - t * 0.5), reach * len * grow, b.color, alpha * fade);
    }
    for (const r of b.rays) {
      cone(g, x, y, angle + r.angle, 0.03, reach * r.length * grow, b.color, 0.9 * fade);
    }
    g.lineStyle(12 * fade + 2, b.color, fade);
    g.strokeCircle(x, y, 40 + 260 * grow);
    g.fillStyle(b.color, 0.85 * fade);
    g.fillCircle(x, y, 140 * (1 - t * 0.7));
    // miolo branco brilhante, mais fino
    cone(this.glow, x, y, angle, 0.07 * (1 - t * 0.6), reach * 1.05 * grow, 0xffffff, 0.55 * fade);
    this.glow.fillStyle(0xffffff, 0.7 * fade);
    this.glow.fillCircle(x, y, 70 * (1 - t) + 8);
  }

  destroy(): void {
    this.gfx.destroy();
    this.glow.destroy();
    this.flash.destroy();
  }
}

/** Triângulo saindo de (x, y) na direção `angle`, com meia abertura `half` (rad). */
function cone(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  angle: number,
  half: number,
  length: number,
  color: number,
  alpha: number,
): void {
  g.fillStyle(color, alpha);
  g.fillTriangle(
    x,
    y,
    x + Math.cos(angle - half) * length,
    y + Math.sin(angle - half) * length,
    x + Math.cos(angle + half) * length,
    y + Math.sin(angle + half) * length,
  );
}
