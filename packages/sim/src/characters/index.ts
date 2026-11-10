import type { Character } from '../character';
import { BASE } from './base';

const REGISTRY = new Map<string, Character>();

/** Coloca um personagem no elenco (as fichas abaixo; testes podem registrar outros). */
export function registerCharacter(c: Character): void {
  REGISTRY.set(c.id, c);
}

for (const c of [BASE]) registerCharacter(c);

/** Personagem usado quando nenhum é escolhido (e nos testes). */
export const BASE_CHARACTER_ID = BASE.id;

/** Personagens da tela de seleção, na ordem. */
export const PLAYABLE_CHARACTERS: readonly string[] = [];

export function hasCharacter(id: string): boolean {
  return REGISTRY.has(id);
}

export function getCharacter(id: string): Character {
  const c = REGISTRY.get(id);
  if (!c) throw new Error(`Personagem desconhecido: ${id}`);
  return c;
}
