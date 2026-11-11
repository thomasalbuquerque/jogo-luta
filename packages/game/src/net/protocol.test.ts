import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS, STAGES } from '@jogo-luta/sim';
import { MAX_PACKET_INPUTS } from './lockstep';
import { decodePacket, encodeInputPacket, encodeTimePacket, parseControl } from './protocol';

const characters = [PLAYABLE_CHARACTERS[0] ?? '', PLAYABLE_CHARACTERS[1] ?? ''];
const stageId = STAGES[0]?.id ?? '';

describe('mensagens de controle', () => {
  it('aceita as mensagens do protocolo', () => {
    const messages = [
      { t: 'hello', v: 1, build: 'dev', client: 'abc' },
      { t: 'welcome' },
      { t: 'refuse', reason: 'full' },
      { t: 'screen', screen: { name: 'select', seq: 1 } },
      { t: 'screen', screen: { name: 'stage', seq: 2, characters, stageId } },
      { t: 'screen', screen: { name: 'fight', seq: 3, characters, stageId, seed: 7, delay: 3 } },
      { t: 'sel', seq: 1, cursor: 2, ready: true },
      { t: 'goto', screen: 'select' },
      { t: 'rematch', seq: 3 },
      { t: 'hash', seq: 3, tick: 30, hash: 0xdeadbeef },
      { t: 'bye' },
    ];
    for (const m of messages) expect(parseControl(JSON.parse(JSON.stringify(m)))).toEqual(m);
  });

  it('recusa o que não é do protocolo', () => {
    const fight = { name: 'fight', seq: 3, characters, stageId, seed: 7, delay: 3 };
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
    ];
    for (const m of bad) expect(parseControl(m)).toBeNull();
  });
});

describe('pacotes', () => {
  it('inputs vão e voltam iguais', () => {
    const batch = { ack: 1234, start: 70000, masks: [0, 1, 0x1ff, 16] };
    const bytes = encodeInputPacket(9, batch);
    expect(bytes).toHaveLength(14 + 8);
    expect(decodePacket(bytes)).toEqual({ type: 'input', seq: 9, ...batch });
    expect(decodePacket(encodeInputPacket(0, { ack: 0, start: 0, masks: [] }))).toEqual({
      type: 'input',
      seq: 0,
      ack: 0,
      start: 0,
      masks: [],
    });
  });

  it('pacote de inputs não passa do limite', () => {
    const masks = Array.from({ length: 200 }, () => 1);
    const packet = decodePacket(encodeInputPacket(1, { ack: 0, start: 0, masks }));
    expect(packet?.type === 'input' && packet.masks.length).toBe(MAX_PACKET_INPUTS);
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
    const input = encodeInputPacket(1, { ack: 0, start: 0, masks: [1, 2] });
    expect(decodePacket(input.subarray(0, input.length - 1))).toBeNull();
    const lying = new Uint8Array(input);
    lying[13] = 200; // diz que tem mais inputs do que tem
    expect(decodePacket(lying)).toBeNull();
    const nan = encodeTimePacket('ping', Number.NaN);
    expect(decodePacket(nan)).toBeNull();
  });

  it('corta bits que não são botões', () => {
    const packet = decodePacket(encodeInputPacket(1, { ack: 0, start: 0, masks: [0xffff] }));
    expect(packet?.type === 'input' && packet.masks).toEqual([0x1ff]);
  });
});
