import { describe, expect, it } from 'vitest';
import { DesyncDetector } from './desync';

describe('DesyncDetector', () => {
  it('hashes iguais no mesmo tick: tudo certo, em qualquer ordem de chegada', () => {
    const d = new DesyncDetector();
    expect(d.addLocal(30, 111)).toBeNull();
    expect(d.addRemote(30, 111)).toBeNull();
    expect(d.addRemote(60, 222)).toBeNull();
    expect(d.addLocal(60, 222)).toBeNull();
    expect(d.checked).toBe(2);
    expect(d.first).toBeNull();
  });

  it('hashes diferentes no mesmo tick: dessincronizou', () => {
    const d = new DesyncDetector();
    d.addLocal(30, 111);
    expect(d.addRemote(30, 999)).toEqual({ tick: 30, local: 111, remote: 999 });
    expect(d.first).toEqual({ tick: 30, local: 111, remote: 999 });
  });

  it('guarda quem é local e quem é remoto quando o remoto chega antes', () => {
    const d = new DesyncDetector();
    d.addRemote(30, 999);
    expect(d.addLocal(30, 111)).toEqual({ tick: 30, local: 111, remote: 999 });
  });

  it('só registra a 1ª divergência', () => {
    const d = new DesyncDetector();
    d.addLocal(30, 1);
    d.addRemote(30, 2);
    d.addLocal(60, 3);
    expect(d.addRemote(60, 4)).toBeNull();
    expect(d.first?.tick).toBe(30);
    expect(d.checked).toBe(2);
  });

  it('ticks diferentes não se comparam', () => {
    const d = new DesyncDetector();
    d.addLocal(30, 1);
    expect(d.addRemote(60, 2)).toBeNull();
    expect(d.checked).toBe(0);
  });

  it('não guarda hash para sempre se o outro lado sumir', () => {
    const d = new DesyncDetector();
    for (let tick = 0; tick < 1000; tick++) d.addLocal(tick, tick);
    // os mais velhos saíram: o par deles não é mais comparado
    expect(d.addRemote(0, 12345)).toBeNull();
    expect(d.addRemote(999, 999)).toBeNull();
    expect(d.checked).toBe(1);
  });
});
