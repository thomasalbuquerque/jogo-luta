import Phaser from 'phaser';
import { characterTextureKey } from '../render/FighterView';

/** Figurinha do personagem (frame `portrait` do atlas), cabendo num quadrado de `size`. */
export function addPortrait(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  size: number,
): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, characterTextureKey(id), 'portrait');
  img.setScale(size / Math.max(img.width, img.height));
  return img;
}

/**
 * Silhueta de cabeça e ombros (personagem que ainda não existe), centrada em
 * (cx, cy), com altura ~`size`.
 */
export function drawSilhouette(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  color = 0x0e121b,
  alpha = 1,
): void {
  const s = size / 100;
  g.fillStyle(color, alpha);
  // cabeça
  g.fillEllipse(cx, cy - 16 * s, 46 * s, 54 * s);
  // pescoço e ombros
  g.fillRect(cx - 9 * s, cy + 6 * s, 18 * s, 12 * s);
  g.fillRoundedRect(cx - 40 * s, cy + 14 * s, 80 * s, 38 * s, {
    tl: 26 * s,
    tr: 26 * s,
    bl: 0,
    br: 0,
  });
}
