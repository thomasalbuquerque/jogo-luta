import type { Clip } from './animation';

/**
 * Clipes próprios de cada personagem (especial e provocação), pelo id de
 * animação da ficha (`<id>_special`, `taunt.animation`).
 */
export const CHARACTER_CLIPS: Readonly<Record<string, Clip>> = {};
