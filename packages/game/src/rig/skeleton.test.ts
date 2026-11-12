import { describe, expect, it } from 'vitest';
import {
  BONE_IDS,
  DRAW_ORDER,
  drawOrder,
  fitRig,
  frameFor,
  placedPoint,
  REST_POSE,
  skinFromAtlas,
  solvePose,
  solveProp,
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

  it('com o cotovelo dobrado o antebraço vai para a frente do braço, atrás da mão', () => {
    expect(drawOrder(REST_POSE)).toEqual([...DRAW_ORDER]);
    const bent = drawOrder({ ...REST_POSE, rot: { forearmNear: -120, forearmFar: -40 } });
    const at = (bone: (typeof BONE_IDS)[number]) => bent.indexOf(bone);
    expect(at('forearmNear')).toBeGreaterThan(at('upperArmNear'));
    expect(at('forearmNear')).toBeLessThan(at('handNear'));
    // o braço de trás, pouco dobrado, continua com a manga na frente
    expect(at('forearmFar')).toBeLessThan(at('upperArmFar'));
    expect([...bent].sort()).toEqual([...BONE_IDS].sort());
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

  it('a peça segurada fica no meio da mão e aponta para onde a mão aponta', () => {
    const skin = new Map(testSkin());
    // arma desenhada deitada: cabo no pivô, cano para a direita, boca na ponta
    skin.set('gun', { w: 20, h: 10, pivot: [2, 8], tip: [12, 8], sockets: { muzzle: [20, 2] } });
    expect(solveProp(skin, solvePose(skin, REST_POSE), REST_POSE)).toBeNull();

    const pose = { ...REST_POSE, rot: { upperArmNear: -90 }, prop: 'gun' };
    const placed = solvePose(skin, pose);
    const hand = placed.find((p) => p.bone === 'handNear');
    const gun = solveProp(skin, placed, pose);
    if (!hand || !gun) throw new Error('sem mão ou arma');
    // braço esticado para a frente: a mão aponta para a direita (0°), como a arma
    expect(near(Math.cos(gun.rotation), 1)).toBe(true);
    expect(near(gun.x, hand.x + 2.5)).toBe(true);
    expect(near(gun.y, hand.y)).toBe(true);
    // a boca fica à frente e acima do cabo
    const anchors = skin.get('gun');
    if (!anchors) throw new Error('sem arma');
    const [mx, my] = placedPoint(anchors, gun, 'muzzle');
    expect(near(mx, gun.x + 18)).toBe(true);
    expect(near(my, gun.y - 6)).toBe(true);

    // girada meia volta em volta do cabo: aponta para trás, no mesmo lugar
    const spun = solveProp(skin, placed, { ...pose, propSpin: 180 });
    if (!spun) throw new Error('sem arma');
    expect(near(Math.cos(spun.rotation), -1)).toBe(true);
    expect(near(spun.x, gun.x)).toBe(true);
    expect(near(spun.y, gun.y)).toBe(true);
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
