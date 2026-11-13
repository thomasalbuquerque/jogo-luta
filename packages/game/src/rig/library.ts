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
 * Especial de contra-ataque que pegou alguém (o sim marca no `moveHits`): toca o
 * clipe `<id do especial>_counter` (o golpe devolvido), se existir; senão, o especial.
 */
export const COUNTER_KEY = 'counter';

/**
 * Qual clipe tocar: o id da ficha (`animations`, ou `<id>_<chave>`) se existir um
 * clipe com esse nome, senão o clipe do esqueleto base. A provocação usa o id
 * `taunt.animation` da ficha.
 */
export function clipFor(c: Character, key: string): Clip {
  if (key === COUNTER_KEY) {
    return CHARACTER_CLIPS[`${animationId(c, 'special')}_counter`] ?? clipFor(c, 'special');
  }
  const id = key === 'taunt' ? c.taunt.animation : animationId(c, key as AnimationKey);
  return CHARACTER_CLIPS[id] ?? BASE_CLIPS[key] ?? BASE_CLIPS.idle ?? { timing: 'once', keys: [] };
}

function isBaseMove(key: string): key is BaseMoveId {
  return (BASE_MOVE_IDS as readonly string[]).includes(key);
}

/** O golpe do personagem que o clipe anima (null se não for golpe). */
export function moveForClip(c: Character, key: string): MoveDef | null {
  if (key === 'special' || key === COUNTER_KEY) return c.special?.move ?? null;
  return isBaseMove(key) ? c.moves[key] : null;
}

/**
 * Personagens de manga curta com o cotovelo de pele: o antebraço é desenhado sempre na
 * frente do braço (`drawOrder`). A ponta do braço fica com o contorno do cotovelo e a do
 * antebraço some aos poucos (`fade` no `recortes.json`), sem linha atravessada.
 */
export const FOREARM_IN_FRONT: ReadonlySet<string> = new Set(['darllan']);

/** Nomes dos clipes, na ordem do visualizador. */
export function clipNames(): string[] {
  return [...new Set([...Object.keys(BASE_CLIPS), 'special', COUNTER_KEY, 'taunt'])];
}
