import { describe, expect, it } from 'vitest';
import { Button, NO_INPUT } from '@jogo-luta/sim';
import { Lockstep, MAX_PACKET_INPUTS } from './lockstep';

/** Jogadores que o host manda para quem está no lugar `to`: todos menos ele. */
function others(players: number, to: number): number[] {
  return Array.from({ length: players }, (_, p) => p).filter((p) => p !== to);
}

/**
 * Uma sala em estrela com entrega perfeita: o lado 0 é o host; os outros só
 * falam com ele. Roda `ticks` quadros e devolve os inputs que cada sim viu.
 */
function runStar(sides: Lockstep[], ticks: number, press: (tick: number) => number[]) {
  const [host, ...guests] = sides;
  if (!host) throw new Error('sem host');
  const n = sides.length;
  const seen: number[][][] = sides.map(() => []);
  for (let t = 0; t < ticks; t++) {
    const pressed = press(t);
    sides.forEach((s, i) => {
      s.addLocal(pressed[i] ?? 0);
    });
    // cada um manda o seu ao host; o host repassa tudo a cada um
    for (const g of guests) host.receive(g.local, g.outgoing(0, [g.local]), [g.local]);
    for (const g of guests)
      g.receive(0, host.outgoing(g.local, others(n, g.local)), others(n, g.local));
    sides.forEach((s, i) => {
      if (s.ready()) seen[i]?.push(s.step());
    });
  }
  return seen;
}

describe('Lockstep', () => {
  it('os primeiros ticks (o atraso) rodam sem input de ninguém', () => {
    const a = new Lockstep(2, 0, 3);
    for (let t = 0; t < 3; t++) {
      expect(a.ready()).toBe(true);
      expect(a.step()).toEqual([NO_INPUT, NO_INPUT]);
    }
    // o tick 3 precisa do input do outro lado
    a.addLocal(Button.LEFT);
    expect(a.ready()).toBe(false);
    expect(a.waiting()).toEqual([1]);
    expect(() => a.step()).toThrow();
  });

  it('o input local só vale depois do atraso, e igual nos dois lados', () => {
    const a = new Lockstep(2, 0, 2);
    const b = new Lockstep(2, 1, 2);
    const seen = runStar([a, b], 10, (t) => [
      t === 0 ? Button.JUMP : 0,
      t === 1 ? Button.ATTACK : 0,
    ]);
    expect(seen[0]).toEqual(seen[1]);
    expect(seen[0]?.[2]).toEqual([Button.JUMP, NO_INPUT]);
    expect(seen[0]?.[3]).toEqual([NO_INPUT, Button.ATTACK]);
  });

  it('com 4, o host repassa e todos veem os mesmos inputs', () => {
    const sides = [0, 1, 2, 3].map((p) => new Lockstep(4, p, 2));
    const seen = runStar(sides, 40, (t) => [t, t * 2, t * 3, t * 5].map((n) => n & 0x1ff));
    expect(seen[0]).toHaveLength(40);
    for (const s of seen) expect(s).toEqual(seen[0]);
    expect(seen[0]?.[12]).toEqual([10, 20, 30, 50]);
  });

  it('lê o input local uma vez por tick, mesmo parado esperando', () => {
    const a = new Lockstep(2, 0, 2);
    a.addLocal(Button.LEFT);
    expect(a.needsLocal()).toBe(false);
    a.addLocal(Button.RIGHT); // ignorado: o tick ainda não andou
    a.step();
    expect(a.needsLocal()).toBe(true);
    expect(a.outgoing(1, [0]).runs).toEqual([{ player: 0, start: 2, masks: [Button.LEFT] }]);
  });

  it('reenvia o que não foi confirmado e para quando confirmam', () => {
    const a = new Lockstep(2, 0, 2);
    const b = new Lockstep(2, 1, 2);
    a.addLocal(1);
    a.step();
    a.addLocal(2);
    expect(a.outgoing(1, [0])).toEqual({
      have: [4, 2],
      runs: [{ player: 0, start: 2, masks: [1, 2] }],
    });
    expect(a.unacked).toBe(2);
    // pacote perdido: o seguinte traz os mesmos inputs e mais um
    a.step();
    a.addLocal(4);
    b.receive(0, a.outgoing(1, [0]), [0]);
    expect(b.outgoing(0, [1]).have).toEqual([5, 2]);
    a.receive(1, b.outgoing(0, [1]), [1]);
    expect(a.outgoing(1, [0]).runs).toEqual([]);
    expect(a.unacked).toBe(0);
  });

  it('confirmação é de cada par: o host reenvia só para quem não confirmou', () => {
    const host = new Lockstep(3, 0, 1);
    host.addLocal(7);
    host.receive(1, { have: [2, 1, 1], runs: [] }, [1]);
    expect(host.outgoing(1, [0, 2]).runs).toEqual([]);
    expect(host.outgoing(2, [0, 1]).runs).toEqual([{ player: 0, start: 1, masks: [7] }]);
    expect(host.unacked).toBe(1);
  });

  it('ignora pacote repetido, atrasado ou com buraco', () => {
    const b = new Lockstep(2, 1, 1);
    const from = (start: number, masks: number[]) => ({
      have: [1, 1],
      runs: [{ player: 0, start, masks }],
    });
    expect(b.receive(0, from(1, [1, 2]), [0])).toBe(2);
    expect(b.receive(0, from(1, [1, 2]), [0])).toBe(0); // repetido
    b.receive(0, from(1, [1]), [0]); // atrasado
    b.receive(0, from(5, [7]), [0]); // buraco: espera o reenvio
    expect(b.remoteLead).toBe(3);
    b.receive(0, from(2, [2, 3, 4]), [0]); // emenda no que já tinha
    expect(b.remoteLead).toBe(5);
    b.addLocal(0);
    b.step();
    expect(b.step()).toEqual([1, NO_INPUT]);
  });

  it('só aceita de cada par as fitas que ele pode mandar', () => {
    const host = new Lockstep(3, 0, 0);
    // quem está no lugar 1 tenta mandar input do 2 e do host: só o dele entra
    const added = host.receive(
      1,
      {
        have: [0, 1, 0],
        runs: [
          { player: 1, start: 0, masks: [Button.JUMP] },
          { player: 2, start: 0, masks: [Button.LEFT] },
          { player: 0, start: 0, masks: [Button.RIGHT] },
        ],
      },
      [1],
    );
    expect(added).toBe(1);
    expect(host.waiting()).toEqual([0, 2]);
    // e ninguém escreve na fita local, nem quem pode mandar todas
    const guest = new Lockstep(3, 1, 0);
    guest.receive(0, { have: [0, 0, 0], runs: [{ player: 1, start: 0, masks: [1] }] }, [0, 1, 2]);
    expect(guest.needsLocal()).toBe(true);
  });

  it('quem saiu fica parado: a fita dele acompanha a local com input vazio', () => {
    const host = new Lockstep(3, 0, 2);
    for (let t = 0; t < 5; t++) {
      host.addLocal(Button.ATTACK);
      host.fillAbsent(2);
      host.receive(1, { have: [0, 0, 0], runs: [{ player: 1, start: 2 + t, masks: [1] }] }, [1]);
      expect(host.step()).toEqual(t < 2 ? [0, 0, 0] : [Button.ATTACK, 1, NO_INPUT]);
    }
    expect(host.outgoing(1, [0, 2]).runs.find((r) => r.player === 2)?.masks).toEqual([
      0, 0, 0, 0, 0,
    ]);
  });

  it('não aceita confirmação de input que ainda não existe', () => {
    const a = new Lockstep(2, 0, 2);
    a.addLocal(1);
    a.receive(1, { have: [99, 2], runs: [] }, [1]);
    expect(a.outgoing(1, [0]).runs[0]?.start).toBe(2);
  });

  it('corta bits que não são botões e limita o tamanho do pacote', () => {
    const a = new Lockstep(2, 0, 0);
    const b = new Lockstep(2, 1, 0);
    b.receive(0, { have: [0, 0], runs: [{ player: 0, start: 0, masks: [0xffff] }] }, [0]);
    b.addLocal(0xfe00 | Button.JUMP);
    expect(b.step()).toEqual([0x1ff, Button.JUMP]);
    for (let t = 0; t < 100; t++) {
      a.addLocal(1);
      a.receive(1, { have: [0, 0], runs: [{ player: 1, start: t, masks: [0] }] }, [1]);
      a.step();
    }
    expect(a.outgoing(1, [0]).runs[0]?.masks).toHaveLength(MAX_PACKET_INPUTS);
  });

  it('não guarda input de um lado que diz estar muito à frente', () => {
    const b = new Lockstep(2, 1, 0);
    for (let start = 0; start < 2000; start += 50) {
      const masks = Array.from({ length: 50 }, () => 1);
      b.receive(0, { have: [0, 0], runs: [{ player: 0, start, masks }] }, [0]);
    }
    expect(b.remoteLead).toBe(600);
  });
});
