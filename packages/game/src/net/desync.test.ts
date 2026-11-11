import { describe, expect, it } from 'vitest';
import { DesyncDetector } from './desync';

describe('DesyncDetector', () => {
  it('hashes iguais no mesmo tick: tudo certo, em qualquer ordem de chegada', () => {
    const d = new DesyncDetector();
    expect(d.addLocal(30, 111)).toBeNull();
    expect(d.addRemote(1, 30, 111)).toBeNull();
    expect(d.addRemote(1, 60, 222)).toBeNull();
    expect(d.addLocal(60, 222)).toBeNull();
    expect(d.checked).toBe(2);
    expect(d.first).toBeNull();
  });

  it('hashes diferentes no mesmo tick: dessincronizou', () => {
    const d = new DesyncDetector();
    d.addLocal(30, 111);
    expect(d.addRemote(1, 30, 999)).toEqual({ tick: 30, player: 1, local: 111, remote: 999 });
    expect(d.first).toEqual({ tick: 30, player: 1, local: 111, remote: 999 });
  });

  it('guarda quem é local e quem é remoto quando o remoto chega antes', () => {
    const d = new DesyncDetector();
    d.addRemote(1, 30, 999);
    expect(d.addLocal(30, 111)).toEqual({ tick: 30, player: 1, local: 111, remote: 999 });
  });

  it('só registra a 1ª divergência', () => {
    const d = new DesyncDetector();
    d.addLocal(30, 1);
    d.addRemote(1, 30, 2);
    d.addLocal(60, 3);
    expect(d.addRemote(1, 60, 4)).toBeNull();
    expect(d.first?.tick).toBe(30);
    expect(d.checked).toBe(2);
  });

  it('ticks diferentes não se comparam', () => {
    const d = new DesyncDetector();
    d.addLocal(30, 1);
    expect(d.addRemote(1, 60, 2)).toBeNull();
    expect(d.checked).toBe(0);
  });

  it('compara com cada um dos outros lados, e diz quem divergiu', () => {
    const d = new DesyncDetector();
    d.addRemote(1, 30, 7);
    d.addRemote(3, 30, 7);
    expect(d.addLocal(30, 7)).toBeNull();
    expect(d.checked).toBe(2);
    // o local fica guardado para quem ainda não mandou
    expect(d.addRemote(2, 30, 8)).toEqual({ tick: 30, player: 2, local: 7, remote: 8 });
    expect(d.checked).toBe(3);
  });

  it('não guarda hash para sempre se o outro lado sumir', () => {
    const d = new DesyncDetector();
    for (let tick = 0; tick < 1000; tick++) d.addLocal(tick, tick);
    // os mais velhos saíram: o par deles não é mais comparado
    expect(d.addRemote(1, 0, 12345)).toBeNull();
    expect(d.addRemote(1, 999, 999)).toBeNull();
    expect(d.checked).toBe(1);
    for (let tick = 0; tick < 1000; tick++) d.addRemote(2, 5000 + tick, tick);
    expect(d.addLocal(5000, 0)).toBeNull();
    expect(d.checked).toBe(1);
  });
});
