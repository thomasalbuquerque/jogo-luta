import { z } from 'zod';
import { hasCharacter, INPUT_BITS, MAX_INPUT_DELAY, STAGES } from '@jogo-luta/sim';
import { MAX_PACKET_INPUTS, type InputBatch } from './lockstep';

/**
 * Versão do protocolo do online. Muda quando uma mensagem muda de formato: os
 * dois lados precisam da mesma (e do mesmo build do jogo, para a luta ser igual).
 */
export const NET_VERSION = 1;

const uint32 = z.number().int().min(0).max(0xffffffff);
const characters = z
  .array(z.string().refine(hasCharacter, { error: 'personagem desconhecido' }))
  .length(2);
const stageId = z.string().refine((id) => STAGES.some((s) => s.id === id), {
  error: 'mapa desconhecido',
});

/**
 * Em que tela a sala está. Quem manda é o host; o outro lado segue. `seq` cresce
 * a cada mudança (na luta, é o id da partida).
 */
const ScreenSchema = z.discriminatedUnion('name', [
  z.object({ name: z.literal('select'), seq: uint32 }),
  z.object({ name: z.literal('stage'), seq: uint32, characters, stageId }),
  z.object({
    name: z.literal('fight'),
    seq: uint32,
    characters,
    stageId,
    seed: uint32,
    /** Atraso de input da partida, em ticks. */
    delay: z.number().int().min(1).max(MAX_INPUT_DELAY),
  }),
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
    client: z.string().min(1).max(40),
  }),
  z.object({ t: z.literal('welcome') }),
  z.object({ t: z.literal('refuse'), reason: z.enum(['full', 'version']) }),
  z.object({ t: z.literal('screen'), screen: ScreenSchema }),
  /** Seleção de personagem: onde está o cursor de quem mandou e se já confirmou. */
  z.object({
    t: z.literal('sel'),
    seq: uint32,
    cursor: z.number().int().min(0).max(63),
    ready: z.boolean(),
  }),
  /** Pedido para voltar à seleção de personagem. */
  z.object({ t: z.literal('goto'), screen: z.literal('select') }),
  /** Voto de revanche na partida `seq`. */
  z.object({ t: z.literal('rematch'), seq: uint32 }),
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
/** tipo (1) + seq, ack e start (4 cada) + quantidade (1) */
const INPUT_HEADER = 14;

/** [tipo][seq u32][ack u32][start u32][n u8][n × u16], little-endian. */
export function encodeInputPacket(seq: number, batch: InputBatch): Uint8Array<ArrayBuffer> {
  const count = Math.min(batch.masks.length, MAX_PACKET_INPUTS);
  const bytes = new Uint8Array(new ArrayBuffer(INPUT_HEADER + count * 2));
  const view = new DataView(bytes.buffer);
  view.setUint8(0, TYPE_INPUT);
  view.setUint32(1, seq, true);
  view.setUint32(5, batch.ack, true);
  view.setUint32(9, batch.start, true);
  view.setUint8(13, count);
  for (let i = 0; i < count; i++) view.setUint16(INPUT_HEADER + i * 2, batch.masks[i] ?? 0, true);
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
  const count = view.getUint8(13);
  if (count > MAX_PACKET_INPUTS || bytes.length !== INPUT_HEADER + count * 2) return null;
  const masks: number[] = [];
  for (let i = 0; i < count; i++) {
    masks.push(view.getUint16(INPUT_HEADER + i * 2, true) & INPUT_BITS);
  }
  return {
    type: 'input',
    seq: view.getUint32(1, true),
    ack: view.getUint32(5, true),
    start: view.getUint32(9, true),
    masks,
  };
}
