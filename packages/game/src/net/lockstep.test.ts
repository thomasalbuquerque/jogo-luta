import { describe, expect, it } from 'vitest';
import { Button, NO_INPUT } from '@jogo-luta/sim';
import { Lockstep, MAX_PACKET_INPUTS } from './lockstep';

/** Roda os dois lados com entrega perfeita por `ticks` e devolve os inputs que cada sim viu. */
function runPair(a: Lockstep, b: Lockstep, ticks: number, press: (tick: number) => number[]) {
  const seen: number[][][] = [[], []];
  for (let t = 0; t < ticks; t++) {
    const [pa, pb] = press(t);
    a.addLocal(pa ?? 0);
    b.addLocal(pb ?? 0);
    b.receive(a.outgoing());
    a.receive(b.outgoing());
    if (a.ready()) seen[0]?.push(a.step());
    if (b.ready()) seen[1]?.push(b.step());
  }
  return seen;
}

describe('Lockstep', () => {
  it('os primeiros ticks (o atraso) rodam sem input de ninguém', () => {
    const a = new Lockstep(0, 3);
    for (let t = 0; t < 3; t++) {
      expect(a.ready()).toBe(true);
      expect(a.step()).toEqual([NO_INPUT, NO_INPUT]);
    }
    // o tick 3 precisa do input do outro lado
    a.addLocal(Button.LEFT);
    expect(a.ready()).toBe(false);
    expect(() => a.step()).toThrow();
  });

  it('o input local só vale depois do atraso, e igual nos dois lados', () => {
    const a = new Lockstep(0, 2);
    const b = new Lockstep(1, 2);
    const seen = runPair(a, b, 10, (t) => [t === 0 ? Button.JUMP : 0, t === 1 ? Button.ATTACK : 0]);
    expect(seen[0]).toEqual(seen[1]);
    expect(seen[0]?.[2]).toEqual([Button.JUMP, NO_INPUT]);
    expect(seen[0]?.[3]).toEqual([NO_INPUT, Button.ATTACK]);
  });

  it('lê o input local uma vez por tick, mesmo parado esperando', () => {
    const a = new Lockstep(0, 2);
    a.addLocal(Button.LEFT);
    expect(a.needsLocal()).toBe(false);
    a.addLocal(Button.RIGHT); // ignorado: o tick ainda não andou
    a.step();
    expect(a.needsLocal()).toBe(true);
    expect(a.outgoing().masks).toEqual([Button.LEFT]);
  });

  it('reenvia o que não foi confirmado e para quando confirmam', () => {
    const a = new Lockstep(0, 2);
    const b = new Lockstep(1, 2);
    a.addLocal(1);
    a.step();
    a.addLocal(2);
    expect(a.outgoing()).toEqual({ ack: 2, start: 2, masks: [1, 2] });
    // pacote perdido: o seguinte traz os mesmos inputs e mais um
    a.step();
    a.addLocal(4);
    b.receive(a.outgoing());
    expect(b.outgoing().ack).toBe(5);
    a.receive(b.outgoing());
    expect(a.outgoing().masks).toEqual([]);
    expect(a.unacked).toBe(0);
  });

  it('ignora pacote repetido, atrasado ou com buraco', () => {
    const b = new Lockstep(1, 1);
    b.receive({ ack: 1, start: 1, masks: [1, 2] });
    b.receive({ ack: 1, start: 1, masks: [1, 2] }); // repetido
    b.receive({ ack: 1, start: 1, masks: [1] }); // atrasado
    b.receive({ ack: 1, start: 5, masks: [7] }); // buraco: espera o reenvio
    expect(b.remoteLead).toBe(3);
    b.receive({ ack: 1, start: 2, masks: [2, 3, 4] }); // emenda no que já tinha
    expect(b.remoteLead).toBe(5);
    b.addLocal(0);
    b.step();
    expect(b.step()).toEqual([1, NO_INPUT]);
  });

  it('não aceita confirmação de input que ainda não existe', () => {
    const a = new Lockstep(0, 2);
    a.addLocal(1);
    a.receive({ ack: 99, start: 2, masks: [] });
    expect(a.outgoing().start).toBe(2);
  });

  it('corta bits que não são botões e limita o tamanho do pacote', () => {
    const a = new Lockstep(0, 0);
    const b = new Lockstep(1, 0);
    b.receive({ ack: 0, start: 0, masks: [0xffff] });
    b.addLocal(0xfe00 | Button.JUMP);
    expect(b.step()).toEqual([0x1ff, Button.JUMP]);
    for (let t = 0; t < 100; t++) {
      a.addLocal(1);
      a.receive({ ack: 0, start: t, masks: [0] });
      a.step();
    }
    expect(a.outgoing().masks).toHaveLength(MAX_PACKET_INPUTS);
  });

  it('não guarda input de um lado que diz estar muito à frente', () => {
    const b = new Lockstep(1, 0);
    for (let start = 0; start < 2000; start += 50) {
      b.receive({ ack: 0, start, masks: Array.from({ length: 50 }, () => 1) });
    }
    expect(b.remoteLead).toBe(600);
  });
});
