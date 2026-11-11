import Phaser from 'phaser';

/** Cores e fontes dos menus e do HUD. */
export const UI = {
  font: 'sans-serif',
  /** Títulos: grossa onde existir (Windows/Mac), senão a sans-serif em negrito. */
  titleFont: '"Arial Black", "Segoe UI Black", "Helvetica Neue", sans-serif',
  bg: 0x1d2333,
  panel: 0x2b3245,
  panelDark: 0x161b27,
  accent: 0xffd166,
  text: '#ffffff',
  muted: '#adb5bd',
  dim: '#6c757d',
} as const;

/** Cor de cada jogador (marcador, molduras e HUD); a cor do corpo vem da arte. */
export const PLAYER_COLORS = [0xe63946, 0x4cc9f0, 0x80ed99, 0xffd166];

export function playerColor(id: number): number {
  return PLAYER_COLORS[id % PLAYER_COLORS.length] ?? 0xffffff;
}

/** 0xrrggbb → '#rrggbb' (cor de texto do Phaser). */
export function cssColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Texto com o estilo dos menus. */
export function uiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  value: string | string[],
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, value, { fontFamily: UI.font, color: UI.text, ...style });
}

/** Título grande com contorno. */
export function titleText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  value: string,
  size = 44,
  color: string = UI.text,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, value, {
      fontFamily: UI.titleFont,
      fontSize: `${String(size)}px`,
      color,
      stroke: '#0b0e16',
      strokeThickness: Math.round(size / 6),
    })
    .setOrigin(0.5);
}

/** Entrada de tela: escurece e clareia rápido. */
export function fadeIn(scene: Phaser.Scene, ms = 180): void {
  scene.cameras.main.fadeIn(ms, 0, 0, 0);
}

/** Painel escuro de cantos redondos. */
export function panel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number = UI.panel,
  alpha = 1,
  radius = 14,
): void {
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x, y, w, h, radius);
}
