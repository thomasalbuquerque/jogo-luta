import {
  animationId,
  BASE_MOVE_IDS,
  type AnimationKey,
  type BaseMoveId,
  type Character,
  type MoveDef,
} from '@jogo-luta/sim';
import type { Clip } from './animation';
import { BASE_CLIPS } from './clips';
import { CHARACTER_CLIPS } from './characterClips';

/**
 * Qual clipe tocar: o id da ficha (`animations`, ou `<id>_<chave>`) se existir um
 * clipe com esse nome, senão o clipe do esqueleto base. A provocação usa o id
 * `taunt.animation` da ficha.
 */
export function clipFor(c: Character, key: string): Clip {
  const id = key === 'taunt' ? c.taunt.animation : animationId(c, key as AnimationKey);
  return CHARACTER_CLIPS[id] ?? BASE_CLIPS[key] ?? BASE_CLIPS.idle ?? { timing: 'once', keys: [] };
}

function isBaseMove(key: string): key is BaseMoveId {
  return (BASE_MOVE_IDS as readonly string[]).includes(key);
}

/** O golpe do personagem que o clipe anima (null se não for golpe). */
export function moveForClip(c: Character, key: string): MoveDef | null {
  if (key === 'special') return c.special?.move ?? null;
  return isBaseMove(key) ? c.moves[key] : null;
}

/** Nomes dos clipes, na ordem do visualizador. */
export function clipNames(): string[] {
  return [...new Set([...Object.keys(BASE_CLIPS), 'special', 'taunt'])];
}
