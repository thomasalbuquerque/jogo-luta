import type { GameState } from './game';

/**
 * Snapshot do estado da luta: copiar, restaurar, serializar e tirar o hash.
 * Base dos replays, da checagem de dessincronização e do rollback (Etapa 12).
 *
 * O estado é só dado simples (números inteiros, textos, booleanos, listas e
 * objetos), então a cópia é feita campo a campo, sem JSON: é barata o bastante
 * para rodar todo tick.
 */

/**
 * Cópia independente do estado. `Fighter.stats` é a única parte compartilhada
 * com o original: vem da ficha do personagem e ninguém altera durante a luta.
 */
export function cloneState(state: GameState): GameState {
  return {
    ...state,
    rules: { ...state.rules },
    fighters: state.fighters.map((f) => ({ ...f })),
    projectiles: state.projectiles.map((p) => ({ ...p, hit: { ...p.hit } })),
    events: state.events.map((e) => ({ ...e })),
  };
}

/**
 * Volta `target` ao que estava em `snapshot`, sem trocar o objeto (quem guarda
 * uma referência ao estado continua valendo). O snapshot não é alterado e pode
 * ser restaurado de novo.
 */
export function restoreState(target: GameState, snapshot: GameState): void {
  Object.assign(target, cloneState(snapshot));
}

/** Estado em texto (JSON), para salvar ou mandar pela rede. */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

/** Estado a partir do texto de `serializeState`. Só para textos gerados pelo próprio jogo. */
export function deserializeState(text: string): GameState {
  return JSON.parse(text) as GameState;
}

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
/** 2³², para separar a parte alta de números que não cabem em 32 bits. */
const TWO_32 = 0x100000000;

function mix(h: number, n: number): number {
  return Math.imul(h ^ n, FNV_PRIME);
}

function hashString(h: number, text: string): number {
  let out = mix(h, text.length);
  for (let i = 0; i < text.length; i++) out = mix(out, text.charCodeAt(i));
  return out;
}

function hashValue(h: number, value: unknown): number {
  switch (typeof value) {
    case 'number': {
      const out = mix(h, value | 0);
      // quase tudo cabe em 32 bits; o que não cabe entra em 2 partes
      return value === (value | 0) ? out : mix(out, Math.trunc(value / TWO_32) | 0);
    }
    case 'string':
      return hashString(mix(h, 1), value);
    case 'boolean':
      return mix(h, value ? 2 : 3);
    case 'object': {
      if (value === null) return mix(h, 4);
      if (Array.isArray(value)) {
        let out = mix(h, 5 + value.length);
        for (const item of value) out = hashValue(out, item);
        return out;
      }
      let out = mix(h, 6);
      const record = value as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        const item = record[key];
        // campo opcional sem valor é igual a campo ausente (como no JSON)
        if (item === undefined) continue;
        out = hashValue(hashString(out, key), item);
      }
      return out;
    }
    default:
      return mix(h, 7);
  }
}

/**
 * Hash de 32 bits do estado inteiro (FNV-1a com mistura final). Dois estados
 * iguais dão o mesmo hash em qualquer máquina; se dois jogadores online tiverem
 * hashes diferentes no mesmo tick, a luta dessincronizou.
 */
export function hashState(state: GameState): number {
  let h = hashValue(FNV_OFFSET, state);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
