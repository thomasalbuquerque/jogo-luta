import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS, STAGES } from '@jogo-luta/sim';
import { MAX_PACKET_INPUTS } from './lockstep';
import {
  decodePacket,
  encodeInputPacket,
  encodeTimePacket,
  MAX_INPUT_PACKET_BYTES,
  MAX_ROOM_PLAYERS,
  parseControl,
} from './protocol';

const characters = [PLAYABLE_CHARACTERS[0] ?? '', PLAYABLE_CHARACTERS[1] ?? ''];
const stageId = STAGES[0]?.id ?? '';
const four = [...characters, ...characters];

describe('mensagens de controle', () => {
  it('aceita as mensagens do protocolo', () => {
    const fight = {
      name: 'fight',
      seq: 3,
      characters,
      stageId,
      seed: 7,
      delay: 3,
      clients: ['a', 'b'],
    };
    const messages = [
      { t: 'hello', v: 1, build: 'dev', client: 'abc' },
      { t: 'welcome' },
      { t: 'refuse', reason: 'full' },
      { t: 'refuse', reason: 'busy' },
      { t: 'roster', clients: ['a', 'b', 'c', 'd'] },
      { t: 'screen', screen: { name: 'select', seq: 1 } },
      { t: 'screen', screen: { name: 'stage', seq: 2, characters, stageId } },
      { t: 'screen', screen: fight },
      { t: 'screen', screen: { ...fight, characters: four, clients: ['a', 'b', 'c', 'd'] } },
      { t: 'sel', seq: 1, cursor: 2, ready: true },
      { t: 'sels', seq: 1, sels: [{ cursor: 2, ready: true }, null, { cursor: 0, ready: false }] },
      { t: 'goto', screen: 'select' },
      { t: 'rematch', seq: 3 },
      { t: 'votes', seq: 3, count: 2 },
      { t: 'hash', seq: 3, tick: 30, hash: 0xdeadbeef },
      { t: 'bye' },
    ];
    for (const m of messages) expect(parseControl(JSON.parse(JSON.stringify(m)))).toEqual(m);
  });

  it('recusa o que não é do protocolo', () => {
    const fight = {
      name: 'fight',
      seq: 3,
      characters,
      stageId,
      seed: 7,
      delay: 3,
      clients: ['a', 'b'],
    };
    const bad: unknown[] = [
      null,
      'oi',
      {},
      { t: 'nada' },
      { t: 'sel', seq: 1, cursor: -1, ready: true },
      { t: 'sel', seq: 1, cursor: 2, ready: 'sim' },
      { t: 'hash', seq: 3, tick: 1.5, hash: 1 },
      { t: 'screen', screen: { ...fight, characters: ['ninguem', 'ninguem'] } },
      { t: 'screen', screen: { ...fight, characters: [characters[0]] } },
      { t: 'screen', screen: { ...fight, stageId: 'lua' } },
      { t: 'screen', screen: { ...fight, delay: 0 } },
      { t: 'screen', screen: { ...fight, delay: 99 } },
      { t: 'screen', screen: { ...fight, seed: -1 } },
      { t: 'screen', screen: { ...fight, clients: ['a'] } },
      { t: 'screen', screen: { ...fight, clients: ['a', 'a'] } },
      { t: 'screen', screen: { ...fight, characters: [...four, characters[0]] } },
      { t: 'roster', clients: [] },
      { t: 'roster', clients: ['a', 'b', 'c', 'd', 'e'] },
      { t: 'sels', seq: 1, sels: [null, null, null, null, null] },
      { t: 'votes', seq: 1, count: 5 },
      { t: 'refuse', reason: 'cansei' },
    ];
    for (const m of bad) expect(parseControl(m)).toBeNull();
  });
});

describe('pacotes', () => {
  it('inputs vão e voltam iguais', () => {
    const batch = {
      have: [70004, 1234, 99, 0],
      runs: [
        { player: 0, start: 70000, masks: [0, 1, 0x1ff, 16] },
        { player: 2, start: 98, masks: [5] },
      ],
    };
    const bytes = encodeInputPacket(9, batch);
    expect(bytes).toHaveLength(6 + 4 * 4 + 1 + (6 + 8) + (6 + 2));
    expect(decodePacket(bytes)).toEqual({ type: 'input', seq: 9, ...batch });
    const empty = { have: [0, 0], runs: [] };
    expect(decodePacket(encodeInputPacket(0, empty))).toEqual({ type: 'input', seq: 0, ...empty });
  });

  it('pacote de inputs não passa do limite', () => {
    const masks = Array.from({ length: 200 }, () => 1);
    const runs = [0, 1, 2, 3, 4].map((player) => ({ player, start: 0, masks }));
    const bytes = encodeInputPacket(1, { have: [0, 0, 0, 0, 0], runs });
    expect(bytes.length).toBeLessThanOrEqual(MAX_INPUT_PACKET_BYTES);
    const packet = decodePacket(bytes);
    expect(packet?.type === 'input' && packet.have).toHaveLength(MAX_ROOM_PLAYERS);
    expect(packet?.type === 'input' && packet.runs.map((r) => r.masks.length)).toEqual(
      Array.from({ length: MAX_ROOM_PLAYERS }, () => MAX_PACKET_INPUTS),
    );
  });

  it('ping e pong levam a hora', () => {
    expect(decodePacket(encodeTimePacket('ping', 1234.5))).toEqual({ type: 'ping', time: 1234.5 });
    expect(decodePacket(encodeTimePacket('pong', 0.25))).toEqual({ type: 'pong', time: 0.25 });
  });

  it('lê um pacote que está no meio de um buffer maior', () => {
    const packet = encodeTimePacket('ping', 42);
    const big = new Uint8Array(20);
    big.set(packet, 5);
    expect(decodePacket(big.subarray(5, 14))).toEqual({ type: 'ping', time: 42 });
  });

  it('recusa pacote estranho', () => {
    expect(decodePacket(new Uint8Array([]))).toBeNull();
    expect(decodePacket(new Uint8Array([9, 1, 2]))).toBeNull();
    expect(decodePacket(new Uint8Array([2, 1, 2]))).toBeNull();
    const input = encodeInputPacket(1, {
      have: [0, 0],
      runs: [{ player: 1, start: 0, masks: [1, 2] }],
    });
    expect(decodePacket(input.subarray(0, input.length - 1))).toBeNull();
    const longer = new Uint8Array(input.length + 1);
    longer.set(input);
    expect(decodePacket(longer)).toBeNull();
    const lying = new Uint8Array(input);
    lying[input.length - 5] = 200; // diz que tem mais inputs do que tem
    expect(decodePacket(lying)).toBeNull();
    const stranger = new Uint8Array(input);
    stranger[input.length - 10] = 7; // jogador que não existe
    expect(decodePacket(stranger)).toBeNull();
    const crowd = new Uint8Array(input);
    crowd[5] = 9; // jogadores demais
    expect(decodePacket(crowd)).toBeNull();
    const nan = encodeTimePacket('ping', Number.NaN);
    expect(decodePacket(nan)).toBeNull();
  });

  it('recusa o mesmo jogador duas vezes no pacote', () => {
    const run = { player: 1, start: 0, masks: [1] };
    expect(decodePacket(encodeInputPacket(1, { have: [0, 0], runs: [run, run] }))).toBeNull();
  });

  it('corta bits que não são botões', () => {
    const runs = [{ player: 0, start: 0, masks: [0xffff] }];
    const packet = decodePacket(encodeInputPacket(1, { have: [0, 0], runs }));
    expect(packet?.type === 'input' && packet.runs[0]?.masks).toEqual([0x1ff]);
  });
});
