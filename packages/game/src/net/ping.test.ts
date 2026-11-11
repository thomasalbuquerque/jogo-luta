import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NET_DELAY,
  delayForPing,
  MAX_NET_DELAY,
  MIN_NET_DELAY,
  pingLabel,
  PingMeter,
  pingQuality,
  starPing,
} from './ping';

describe('PingMeter', () => {
  it('a 1ª medida vale inteira; as seguintes entram na média', () => {
    const p = new PingMeter();
    expect(p.rtt).toBeNull();
    p.add(40);
    expect(p.rtt).toBe(40);
    p.add(90);
    expect(p.rtt).toBe(50);
    expect(p.jitter).toBe(10);
  });

  it('ping estável converge e a variação some', () => {
    const p = new PingMeter();
    p.add(200);
    for (let i = 0; i < 100; i++) p.add(30);
    expect(p.rtt).toBeCloseTo(30, 3);
    expect(p.jitter).toBeLessThan(0.01);
  });

  it('ignora medida inválida e limita engasgo', () => {
    const p = new PingMeter();
    p.add(-5);
    p.add(Number.NaN);
    expect(p.rtt).toBeNull();
    p.add(60000);
    expect(p.rtt).toBe(2000);
    p.reset();
    expect(p.rtt).toBeNull();
  });
});

describe('delayForPing', () => {
  it('ping baixo dá 2 a 3 ticks', () => {
    expect(delayForPing(8)).toBe(2);
    expect(delayForPing(30)).toBe(2);
    expect(delayForPing(40)).toBe(3);
    expect(delayForPing(60)).toBe(3);
  });

  it('sobe com o ping e com a variação, até o limite', () => {
    expect(delayForPing(90)).toBe(4);
    expect(delayForPing(30, 20)).toBe(4);
    expect(delayForPing(1000)).toBe(MAX_NET_DELAY);
    expect(delayForPing(0)).toBe(MIN_NET_DELAY);
  });

  it('sem medida, usa o padrão', () => {
    expect(delayForPing(null)).toBe(DEFAULT_NET_DELAY);
  });
});

describe('starPing', () => {
  it('com um só que entrou, é o ping dele', () => {
    expect(starPing([{ rtt: 30, jitter: 4 }])).toEqual({ rtt: 30, jitter: 4 });
  });

  it('entre dois que entraram, o input passa pelo host: soma os dois maiores', () => {
    const pings = [
      { rtt: 20, jitter: 1 },
      { rtt: 50, jitter: 2 },
      { rtt: 30, jitter: 9 },
    ];
    expect(starPing(pings)).toEqual({ rtt: 80, jitter: 11 });
    expect(delayForPing(80, 11)).toBeGreaterThan(delayForPing(50, 2));
  });

  it('sem medida de alguém (ou de ninguém), fica sem medida', () => {
    expect(starPing([]).rtt).toBeNull();
    expect(
      starPing([
        { rtt: 20, jitter: 0 },
        { rtt: null, jitter: 0 },
      ]).rtt,
    ).toBeNull();
  });
});

describe('indicador de ping', () => {
  it('cor pelo ping', () => {
    expect(pingQuality(20)).toBe('good');
    expect(pingQuality(100)).toBe('ok');
    expect(pingQuality(200)).toBe('bad');
    expect(pingQuality(null)).toBe('ok');
  });

  it('texto', () => {
    expect(pingLabel(23.4)).toBe('ping 23 ms');
    expect(pingLabel(null)).toBe('ping …');
  });
});
