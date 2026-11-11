import { describe, expect, it } from 'vitest';
import {
  isRoomCode,
  normalizeRoomCode,
  randomRoomCode,
  roomFromSearch,
  roomLink,
  roomPeerId,
} from './roomCode';

describe('código da sala', () => {
  it('tem 4 letras maiúsculas, sem I nem O', () => {
    let n = 0;
    const random = (): number => (n++ % 97) / 97;
    for (let i = 0; i < 200; i++) {
      const code = randomRoomCode(random);
      expect(isRoomCode(code)).toBe(true);
      expect(code).not.toMatch(/[IO]/);
    }
  });

  it('aceita o valor máximo do sorteio sem sair da tabela', () => {
    expect(randomRoomCode(() => 0.999999)).toBe('ZZZZ');
    expect(randomRoomCode(() => 0)).toBe('AAAA');
  });

  it('normaliza o que foi digitado ou colado', () => {
    expect(normalizeRoomCode('ab cd')).toBe('ABCD');
    expect(normalizeRoomCode(' x1y-z! ')).toBe('XYZ');
    expect(normalizeRoomCode('abcdef')).toBe('ABCD');
  });

  it('só é código com 4 letras', () => {
    expect(isRoomCode('ABCD')).toBe(true);
    expect(isRoomCode('ABC')).toBe(false);
    expect(isRoomCode('abcd')).toBe(false);
  });

  it('lê a sala da URL', () => {
    expect(roomFromSearch('?sala=abcd')).toBe('ABCD');
    expect(roomFromSearch('?atraso=3&sala=WXYZ')).toBe('WXYZ');
    expect(roomFromSearch('?sala=ab')).toBeNull();
    expect(roomFromSearch('')).toBeNull();
  });

  it('monta o link da sala sem os outros parâmetros', () => {
    expect(roomLink('https://exemplo.dev/jogo/?atraso=3#x', 'ABCD')).toBe(
      'https://exemplo.dev/jogo/?sala=ABCD',
    );
  });

  it('o id no servidor de sinalização leva o código', () => {
    expect(roomPeerId('ABCD')).toMatch(/ABCD$/);
    expect(roomPeerId('ABCD')).not.toBe(roomPeerId('ABCE'));
  });
});
