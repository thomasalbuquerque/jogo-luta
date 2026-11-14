import { describe, expect, it } from 'vitest';
import { MAX_RENDER_SCALE, pickRenderScale } from './view';

describe('pickRenderScale', () => {
  it('1280×720 não amplia', () => {
    expect(pickRenderScale(1280, 720, 1)).toBe(1);
  });

  it('cobre a tela em tela cheia, pelo lado que limita', () => {
    expect(pickRenderScale(1920, 1080, 1)).toBe(1.5);
    // ultrawide: a altura limita (2560×1440 dentro de 3440×1440)
    expect(pickRenderScale(3440, 1440, 1)).toBe(2);
    // notebook com zoom do Windows em 150%
    expect(pickRenderScale(1280, 720, 1.5)).toBe(1.5);
  });

  it('arredonda para cima em passos de 0,25', () => {
    expect(pickRenderScale(1366, 768, 1)).toBe(1.25);
  });

  it('fica entre 1 e o máximo', () => {
    expect(pickRenderScale(800, 600, 1)).toBe(1);
    expect(pickRenderScale(3840, 2160, 2)).toBe(MAX_RENDER_SCALE);
  });

  it('aceita um valor forçado (da URL)', () => {
    expect(pickRenderScale(3440, 1440, 1, 1)).toBe(1);
    expect(pickRenderScale(3440, 1440, 1, 10)).toBe(MAX_RENDER_SCALE);
    expect(pickRenderScale(3440, 1440, 1, Number('abc'))).toBe(2);
  });
});
