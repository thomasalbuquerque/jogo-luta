import { describe, expect, it } from 'vitest';
import {
  BONE_IDS,
  DRAW_ORDER,
  fitRig,
  frameFor,
  REST_POSE,
  skinFromAtlas,
  solvePose,
  type FrameAnchors,
  type Skin,
} from './skeleton';

/** Peça de teste: retângulo vertical com o pivô em cima e a ponta embaixo. */
function limb(len: number, extra: Partial<FrameAnchors> = {}): FrameAnchors {
  return { w: 10, h: len + 10, pivot: [5, 5], tip: [5, 5 + len], sockets: {}, ...extra };
}

/** Skin mínima: quadril e tronco "em pé" (pivô embaixo), membros pendurados. */
function testSkin(): Skin {
  const up = (h: number, sockets: Record<string, readonly [number, number]>): FrameAnchors => ({
    w: 40,
    h,
    pivot: [20, h],
    tip: [20, 0],
    sockets,
  });
  const skin = new Map<string, FrameAnchors>([
    ['hips', up(20, { legNear: [15, 20], legFar: [25, 20] })],
    ['torso', up(40, { neck: [20, 0], shoulderNear: [10, 5], shoulderFar: [30, 5] })],
    ['head_normal', up(30, {})],
    ['upperArm', limb(20)],
    ['forearm', limb(20)],
    ['hand_fist', limb(5)],
    ['thigh', limb(30)],
    ['shin', limb(30)],
    // pé desenhado deitado: pivô no tornozelo, ponta para a frente
    ['foot', { w: 30, h: 10, pivot: [5, 0], tip: [25, 0], sockets: {} }],
  ]);
  return skin;
}

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('esqueleto', () => {
  it('todo osso aparece na ordem de desenho e o pai vem antes do filho', () => {
    expect([...DRAW_ORDER].sort()).toEqual([...BONE_IDS].sort());
    const placed = solvePose(testSkin(), REST_POSE);
    expect(placed.map((p) => p.bone)).toEqual([...BONE_IDS]);
  });

  it('em repouso as pernas descem retas a partir do quadril', () => {
    const placed = solvePose(testSkin(), REST_POSE);
    const thigh = placed.find((p) => p.bone === 'thighNear');
    const shin = placed.find((p) => p.bone === 'shinNear');
    // quadril: pivô em (20, 20); perna da frente em (15, 20) → 5 à esquerda, 0 abaixo
    expect(thigh && [thigh.x, thigh.y]).toEqual([-5, 0]);
    expect(shin && near(shin.x, -5) && near(shin.y, 30)).toBe(true);
  });

  it('girar o quadril leva os filhos junto', () => {
    const placed = solvePose(testSkin(), { ...REST_POSE, rot: { hips: 90 } });
    const torso = placed.find((p) => p.bone === 'torso');
    const head = placed.find((p) => p.bone === 'head');
    // tronco "deitado" para a frente: o pescoço fica 40 px à direita
    expect(torso && near(torso.x, 0) && near(torso.y, 0)).toBe(true);
    expect(head && near(head.x, 40) && near(head.y, 0)).toBe(true);
  });

  it('a rotação de um osso é a do pai mais a dele', () => {
    const placed = solvePose(testSkin(), {
      ...REST_POSE,
      rot: { upperArmNear: -90, forearmNear: -90 },
    });
    const upper = placed.find((p) => p.bone === 'upperArmNear');
    const fore = placed.find((p) => p.bone === 'forearmNear');
    expect(upper && near(upper.rotation, -Math.PI / 2)).toBe(true);
    expect(fore && near(fore.rotation, -Math.PI)).toBe(true);
    // braço esticado para a frente: o cotovelo fica 20 px à frente do ombro
    expect(fore && upper && near(fore.x - upper.x, 20) && near(fore.y, upper.y)).toBe(true);
  });

  it('acha o chão na sola do pé e a altura até o topo da cabeça', () => {
    const fit = fitRig(testSkin());
    // quadril 0 → coxa 30 → canela 30 → pé (pivô no topo, 10 de altura)
    expect(near(fit.groundY, 70)).toBe(true);
    // topo: pescoço em -40 e a cabeça tem 30
    expect(near(fit.height, 70 + 70)).toBe(true);
  });

  it('usa a peça "2" para o lado de trás quando existe', () => {
    const skin = new Map(testSkin());
    skin.set('thigh2', limb(25));
    expect(frameFor(skin, 'thighFar', REST_POSE)).toBe('thigh2');
    expect(frameFor(skin, 'thighNear', REST_POSE)).toBe('thigh');
    expect(frameFor(skin, 'shinFar', REST_POSE)).toBe('shin');
    expect(frameFor(skin, 'head', { ...REST_POSE, expression: 'ko' })).toBe('head_ko');
  });

  it('lê os pontos do JSON do atlas', () => {
    const skin = skinFromAtlas({
      torso: { frame: { w: 40, h: 50 }, anchors: { pivot: [20, 50], sockets: { neck: [20, 2] } } },
      fx_smoke1: { frame: { w: 10, h: 10 } },
    });
    expect(skin.has('fx_smoke1')).toBe(false);
    expect(skin.get('torso')).toEqual({
      w: 40,
      h: 50,
      pivot: [20, 50],
      tip: [20, 49],
      sockets: { neck: [20, 2] },
    });
  });
});
