import { describe, expect, it } from 'vitest';
import { DEFAULT_VOLUME, parseVolume, volumeAt, volumeGain, volumeLabel } from './volume';

describe('volume', () => {
  it('lê o volume salvo e limita entre 0 e 1', () => {
    expect(parseVolume('0.35', null)).toBe(0.35);
    expect(parseVolume('3', null)).toBe(1);
    expect(parseVolume('-1', null)).toBe(0);
  });

  it('sem nada salvo (ou lixo): padrão; quem tinha o mudo antigo ligado começa em 0', () => {
    expect(parseVolume(null, null)).toBe(DEFAULT_VOLUME);
    expect(parseVolume('abc', null)).toBe(DEFAULT_VOLUME);
    expect(parseVolume('', null)).toBe(DEFAULT_VOLUME);
    expect(parseVolume(null, '1')).toBe(0);
    expect(parseVolume(null, '0')).toBe(DEFAULT_VOLUME);
    // o volume salvo vale mais que o mudo antigo
    expect(parseVolume('0.5', '1')).toBe(0.5);
  });

  it('posição na barra vira volume em passos de 5%', () => {
    expect(volumeAt(100, 100, 120)).toBe(0);
    expect(volumeAt(220, 100, 120)).toBe(1);
    expect(volumeAt(160, 100, 120)).toBe(0.5);
    expect(volumeAt(161, 100, 120)).toBe(0.5);
    // arrastando para fora da barra
    expect(volumeAt(40, 100, 120)).toBe(0);
    expect(volumeAt(500, 100, 120)).toBe(1);
  });

  it('ganho ao quadrado e texto em %', () => {
    expect(volumeGain(0.5)).toBe(0.25);
    expect(volumeGain(1)).toBe(1);
    expect(volumeLabel(0.8)).toBe('80%');
    expect(volumeLabel(0)).toBe('0%');
  });
});
