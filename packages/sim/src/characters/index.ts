import type { Character } from '../character';
import { BASE } from './base';
import { DADAZINHO } from './dadazinho';
import { JOAO_FRANGO } from './joao-frango';
import { SCHUMMAKI } from './schummaki';

const REGISTRY = new Map<string, Character>();

/** Coloca um personagem no elenco (as fichas abaixo; testes podem registrar outros). */
export function registerCharacter(c: Character): void {
  REGISTRY.set(c.id, c);
}

for (const c of [BASE, SCHUMMAKI, JOAO_FRANGO, DADAZINHO]) registerCharacter(c);

/** Personagem usado quando nenhum é escolhido (e nos testes). */
export const BASE_CHARACTER_ID = BASE.id;

/** Personagens da tela de seleção, na ordem. */
export const PLAYABLE_CHARACTERS: readonly string[] = [SCHUMMAKI.id, JOAO_FRANGO.id, DADAZINHO.id];

export function hasCharacter(id: string): boolean {
  return REGISTRY.has(id);
}

export function getCharacter(id: string): Character {
  const c = REGISTRY.get(id);
  if (!c) throw new Error(`Personagem desconhecido: ${id}`);
  return c;
}
