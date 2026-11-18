import { isBotLevel, type BotLevel } from '@jogo-luta/sim';

/**
 * Nível do bot escolhido por último (tela de mapa), salvo no navegador: a próxima
 * luta contra o bot já começa nele.
 */

export const BOT_LEVEL_STORAGE_KEY = 'jogo-luta:bot-nivel';
export const DEFAULT_BOT_LEVEL: BotLevel = 'medium';

let current: BotLevel | undefined;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // aba privada ou site bloqueado
  }
}

/** Nível salvo (texto qualquer, ou nada, vira o padrão). */
export function parseBotLevel(saved: string | null): BotLevel {
  return isBotLevel(saved) ? saved : DEFAULT_BOT_LEVEL;
}

export function getBotLevel(): BotLevel {
  if (current === undefined) {
    try {
      current = parseBotLevel(storage()?.getItem(BOT_LEVEL_STORAGE_KEY) ?? null);
    } catch {
      current = DEFAULT_BOT_LEVEL;
    }
  }
  return current;
}

/** Troca o nível e salva (sem localStorage: vale até fechar a aba). */
export function setBotLevel(level: BotLevel): void {
  current = level;
  try {
    storage()?.setItem(BOT_LEVEL_STORAGE_KEY, level);
  } catch {
    // só não lembra na próxima vez
  }
}
