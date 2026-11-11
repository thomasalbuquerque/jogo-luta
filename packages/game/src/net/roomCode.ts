/** Letras do código da sala. */
export const ROOM_CODE_LENGTH = 4;

/** Sem I e O: lidos em voz alta ou no celular, confundem com 1 e 0. */
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/** Prefixo do id da sala no servidor de sinalização (o código sozinho bateria com outros apps). */
const PEER_PREFIX = 'jlda-v1-sala-';

/** Código novo de sala: 4 letras para mandar no grupo. */
export function randomRoomCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += LETTERS[Math.floor(random() * LETTERS.length) % LETTERS.length] ?? 'A';
  }
  return code;
}

/** O que foi digitado ou colado vira código: só letras, maiúsculas, no máximo 4. */
export function normalizeRoomCode(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

export function isRoomCode(code: string): boolean {
  return /^[A-Z]{4}$/.test(code);
}

/** Id do host da sala no servidor de sinalização. */
export function roomPeerId(code: string): string {
  return `${PEER_PREFIX}${code}`;
}

/** Sala pedida na URL (`?sala=ABCD`); null se não tiver ou não for um código. */
export function roomFromSearch(search: string): string | null {
  const code = normalizeRoomCode(new URLSearchParams(search).get('sala') ?? '');
  return isRoomCode(code) ? code : null;
}

/** Link que já entra na sala (o endereço atual com `?sala=ABCD`). */
export function roomLink(href: string, code: string): string {
  const url = new URL(href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('sala', code);
  return url.toString();
}
