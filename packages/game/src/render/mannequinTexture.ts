import Phaser from 'phaser';
import { BASE_CHARACTER_ID } from '@jogo-luta/sim';
import { characterTextureKey } from './FighterView';
import { MANNEQUIN_PIECES, packPieces, SHEET } from './mannequin';

/**
 * Cria a textura do boneco (`char-base`) com os frames e as juntas, no formato
 * que `skinOf` lê. Chame uma vez, no boot.
 */
export function createMannequinTexture(scene: Phaser.Scene): void {
  const key = characterTextureKey(BASE_CHARACTER_ID);
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, SHEET, SHEET);
  if (!texture) return;
  const ctx = texture.context;
  for (const { piece, x, y } of packPieces(MANNEQUIN_PIECES)) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.rect(0, 0, piece.w, piece.h);
    ctx.clip();
    piece.draw(ctx);
    ctx.restore();
    const frame = texture.add(piece.name, 0, x, y, piece.w, piece.h);
    if (frame) {
      frame.customData = {
        anchors: { pivot: piece.pivot, tip: piece.tip, sockets: piece.sockets ?? {} },
      };
    }
  }
  texture.refresh();
}
