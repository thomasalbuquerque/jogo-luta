/**
 * Nome de quem joga neste navegador: digitado na 1ª vez que abre o jogo e
 * salvo no localStorage (dá para trocar no menu, em "Alterar nome"). Aparece
 * em cima do lutador, na seleção, no HUD e no resultado; online, vai para a sala.
 */

export const NAME_STORAGE_KEY = 'jogo-luta:nome';
/** Letras no máximo (cabe em cima do lutador e no painel do HUD). */
export const MAX_NAME_LENGTH = 12;

/**
 * Nome limpo: sem caracteres de controle, espaços seguidos viram um só, sem
 * espaço nas pontas e no máximo `MAX_NAME_LENGTH` letras (conta emoji e
 * acento como uma letra só).
 */
export function cleanName(raw: string): string {
  const text = raw
    .normalize('NFC')
    .replace(/\p{Cc}|\p{Cf}/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
  return letters(text).slice(0, MAX_NAME_LENGTH).join('').trim();
}

const segmenter = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' });

/** As letras do texto como a pessoa vê (emoji e letra com acento contam uma). */
export function letters(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

/** Nome salvo no navegador (null = ainda não digitou ou ficou vazio). */
export function parseSavedName(saved: string | null): string | null {
  const name = cleanName(saved ?? '');
  return name === '' ? null : name;
}

/** Como o jogador aparece: o nome, ou "P2" para quem não tem nome. */
export function playerTag(index: number, name: string | null | undefined): string {
  return name ? name : `P${String(index + 1)}`;
}

// ---------------------------------------------------------------------------
// Nome atual (lido do navegador na 1ª vez)

let current: string | null | undefined;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // aba privada ou site bloqueado
  }
}

export function getPlayerName(): string | null {
  if (current === undefined) {
    try {
      current = parseSavedName(storage()?.getItem(NAME_STORAGE_KEY) ?? null);
    } catch {
      current = null;
    }
  }
  return current;
}

/**
 * Troca o nome e salva no navegador (sem localStorage: vale até fechar a aba).
 * Devolve o nome limpo (null se ficou vazio: não troca nada).
 */
export function setPlayerName(raw: string): string | null {
  const name = parseSavedName(raw);
  if (name === null) return null;
  current = name;
  try {
    storage()?.setItem(NAME_STORAGE_KEY, name);
  } catch {
    // só não lembra na próxima vez
  }
  return name;
}

/** Nomes dos jogadores no mesmo PC: o do navegador é o P1; os outros ficam "P2", "P3"… */
export function localNames(): (string | null)[] {
  return [getPlayerName()];
}
