import { z } from 'zod';
import { hasCharacter, INPUT_BITS, MAX_INPUT_DELAY, STAGES } from '@jogo-luta/sim';
import { MAX_PACKET_INPUTS, type InputBatch, type InputRun } from './lockstep';

/**
 * Versão do protocolo do online. Muda quando uma mensagem muda de formato: os
 * lados precisam da mesma (e do mesmo build do jogo, para a luta ser igual).
 */
export const NET_VERSION = 3;

/** Jogadores numa sala online, no máximo (o host e mais 3). */
export const MAX_ROOM_PLAYERS = 4;

const uint32 = z.number().int().min(0).max(0xffffffff);
const characters = z
  .array(z.string().refine(hasCharacter, { error: 'personagem desconhecido' }))
  .min(2)
  .max(MAX_ROOM_PLAYERS);
const stageId = z.string().refine((id) => STAGES.some((s) => s.id === id), {
  error: 'mapa desconhecido',
});

/** Id de cada um na sala (sorteado ao abrir; serve para reconhecer a reconexão). */
const clientId = z.string().min(1).max(40);
/** Time de cada lugar (0 ou 1; null = todos contra todos). */
const teams = z.array(z.number().int().min(0).max(1)).min(2).max(MAX_ROOM_PLAYERS).nullable();
const sameSize = (s: { characters: string[]; teams: number[] | null }) =>
  s.teams === null || s.teams.length === s.characters.length;

const SelectionSchema = z.object({ cursor: z.number().int().min(0).max(63), ready: z.boolean() });

/**
 * Em que tela a sala está. Quem manda é o host; os outros seguem. `seq` cresce
 * a cada mudança (na luta, é o id da partida).
 */
const ScreenSchema = z.discriminatedUnion('name', [
  z.object({ name: z.literal('select'), seq: uint32 }),
  /** `characters`: o de cada lugar da sala, na ordem. `teams` e `friendlyFire`: o que o host escolheu. */
  z
    .object({
      name: z.literal('stage'),
      seq: uint32,
      characters,
      stageId,
      teams,
      friendlyFire: z.boolean(),
    })
    .refine(sameSize, { error: 'times não batem com os personagens' }),
  z
    .object({
      name: z.literal('fight'),
      seq: uint32,
      characters,
      stageId,
      seed: uint32,
      /** Atraso de input da partida, em ticks. */
      delay: z.number().int().min(1).max(MAX_INPUT_DELAY),
      /** Quem joga com cada lutador (o id de cada um, na ordem de `characters`). */
      clients: z.array(clientId).min(2).max(MAX_ROOM_PLAYERS),
      teams,
      friendlyFire: z.boolean(),
    })
    .refine(sameSize, { error: 'times não batem com os personagens' })
    .refine(
      (s) =>
        s.clients.length === s.characters.length && new Set(s.clients).size === s.clients.length,
      { error: 'jogadores da partida não batem com os personagens' },
    ),
]);

export type Screen = z.infer<typeof ScreenSchema>;
export type FightScreen = Extract<Screen, { name: 'fight' }>;

/** Mensagens do canal confiável (lobby e controle da partida). */
const ControlSchema = z.discriminatedUnion('t', [
  /** Quem entrou se apresenta: versão, build e um id para poder reconectar. */
  z.object({
    t: z.literal('hello'),
    v: z.number().int(),
    build: z.string().max(80),
    client: clientId,
  }),
  z.object({ t: z.literal('welcome') }),
  z.object({ t: z.literal('refuse'), reason: z.enum(['full', 'version', 'busy']) }),
  /** Host: quem está na sala, na ordem dos lugares (o 1º é o host). */
  z.object({ t: z.literal('roster'), clients: z.array(clientId).min(1).max(MAX_ROOM_PLAYERS) }),
  z.object({ t: z.literal('screen'), screen: ScreenSchema }),
  /** Seleção de personagem de quem mandou (para o host): onde está o cursor e se confirmou. */
  z.object({ t: z.literal('sel'), seq: uint32, ...SelectionSchema.shape }),
  /** Host: a seleção de cada lugar da sala (null = ainda não mandou). */
  z.object({
    t: z.literal('sels'),
    seq: uint32,
    sels: z.array(SelectionSchema.nullable()).max(MAX_ROOM_PLAYERS),
  }),
  /** Pedido para voltar à seleção de personagem. */
  z.object({ t: z.literal('goto'), screen: z.literal('select') }),
  /** Voto de revanche na partida `seq` (para o host). */
  z.object({ t: z.literal('rematch'), seq: uint32 }),
  /** Host: quantos já votaram na revanche da partida `seq`. */
  z.object({
    t: z.literal('votes'),
    seq: uint32,
    count: z.number().int().min(0).max(MAX_ROOM_PLAYERS),
  }),
  /** Hash do estado depois do tick `tick` da partida `seq` (checagem de dessincronização). */
  z.object({ t: z.literal('hash'), seq: uint32, tick: uint32, hash: uint32 }),
  /** Saiu da sala de propósito. */
  z.object({ t: z.literal('bye') }),
]);

export type ControlMessage = z.infer<typeof ControlSchema>;

/** Confere uma mensagem que veio da rede. Formato estranho: null. */
export function parseControl(data: unknown): ControlMessage | null {
  const parsed = ControlSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** Pacotes do canal sem garantia (inputs e ping), em binário. */
export type Packet =
  | ({ type: 'input'; seq: number } & InputBatch)
  | { type: 'ping'; time: number }
  | { type: 'pong'; time: number };

const TYPE_INPUT = 1;
const TYPE_PING = 2;
const TYPE_PONG = 3;
/** tipo (1) + seq (4) + jogadores (1) */
const INPUT_HEADER = 6;
/** jogador (1) + start (4) + quantidade (1) */
const RUN_HEADER = 6;

/** Maior pacote de inputs possível, em bytes. */
export const MAX_INPUT_PACKET_BYTES =
  INPUT_HEADER + MAX_ROOM_PLAYERS * 4 + 1 + MAX_ROOM_PLAYERS * (RUN_HEADER + MAX_PACKET_INPUTS * 2);

/**
 * [tipo][seq u32][n u8][n × have u32][pedaços u8], e cada pedaço
 * [jogador u8][start u32][k u8][k × u16], tudo little-endian.
 */
export function encodeInputPacket(seq: number, batch: InputBatch): Uint8Array<ArrayBuffer> {
  const players = Math.min(batch.have.length, MAX_ROOM_PLAYERS);
  const runs = batch.runs
    .filter((run) => run.player < players)
    .slice(0, players)
    .map((run) => ({ ...run, masks: run.masks.slice(0, MAX_PACKET_INPUTS) }));
  const size =
    INPUT_HEADER +
    players * 4 +
    1 +
    runs.reduce((total, run) => total + RUN_HEADER + run.masks.length * 2, 0);
  const bytes = new Uint8Array(new ArrayBuffer(size));
  const view = new DataView(bytes.buffer);
  view.setUint8(0, TYPE_INPUT);
  view.setUint32(1, seq, true);
  view.setUint8(5, players);
  let at = INPUT_HEADER;
  for (let p = 0; p < players; p++, at += 4) view.setUint32(at, batch.have[p] ?? 0, true);
  view.setUint8(at++, runs.length);
  for (const run of runs) {
    view.setUint8(at, run.player);
    view.setUint32(at + 1, run.start, true);
    view.setUint8(at + 5, run.masks.length);
    at += RUN_HEADER;
    for (const mask of run.masks) {
      view.setUint16(at, mask, true);
      at += 2;
    }
  }
  return bytes;
}

/** [tipo][hora f64]: o pong devolve a hora do ping, e a diferença é o ping. */
export function encodeTimePacket(type: 'ping' | 'pong', time: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(9));
  const view = new DataView(bytes.buffer);
  view.setUint8(0, type === 'ping' ? TYPE_PING : TYPE_PONG);
  view.setFloat64(1, time, true);
  return bytes;
}

/** Lê um pacote que veio da rede. Tamanho ou conteúdo estranho: null. */
export function decodePacket(bytes: Uint8Array): Packet | null {
  if (bytes.length < 1) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const type = view.getUint8(0);
  if (type === TYPE_PING || type === TYPE_PONG) {
    if (bytes.length !== 9) return null;
    const time = view.getFloat64(1, true);
    if (!Number.isFinite(time)) return null;
    return { type: type === TYPE_PING ? 'ping' : 'pong', time };
  }
  if (type !== TYPE_INPUT || bytes.length < INPUT_HEADER) return null;
  const players = view.getUint8(5);
  if (players < 1 || players > MAX_ROOM_PLAYERS) return null;
  let at = INPUT_HEADER;
  if (bytes.length < at + players * 4 + 1) return null;
  const have: number[] = [];
  for (let p = 0; p < players; p++, at += 4) have.push(view.getUint32(at, true));
  const count = view.getUint8(at++);
  if (count > players) return null;
  const runs: InputRun[] = [];
  for (let r = 0; r < count; r++) {
    if (bytes.length < at + RUN_HEADER) return null;
    const player = view.getUint8(at);
    const start = view.getUint32(at + 1, true);
    const k = view.getUint8(at + 5);
    at += RUN_HEADER;
    if (player >= players || k > MAX_PACKET_INPUTS || bytes.length < at + k * 2) return null;
    if (runs.some((run) => run.player === player)) return null;
    const masks: number[] = [];
    for (let i = 0; i < k; i++, at += 2) masks.push(view.getUint16(at, true) & INPUT_BITS);
    runs.push({ player, start, masks });
  }
  if (at !== bytes.length) return null;
  return { type: 'input', seq: view.getUint32(1, true), have, runs };
}
