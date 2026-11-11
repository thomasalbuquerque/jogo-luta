import Phaser from 'phaser';
import { getStage } from '@jogo-luta/sim';
import { frameTargets, type Rect } from '../render/camera';
import { StageView } from '../render/stageView';

/** Enquadramento do mapa vazio (o mesmo da luta quando ninguém está em cena). */
const STAGE_VIEW: Rect = { x: -450, y: -200, w: 900, h: 200 };
/** Balanço lento da câmera no fundo da tela inicial (px de mundo e ms por volta). */
const DRIFT_PX = 140;
const DRIFT_PERIOD_MS = 26000;

export interface BackdropData {
  stageId: string;
  /** Pedaço da tela onde o mapa aparece (px); sem isso, a tela toda. */
  viewport?: Rect;
  /** Câmera balançando devagar de um lado para o outro. */
  drift?: boolean;
}

/**
 * Cenário de verdade (com parallax) como fundo de menu ou miniatura do mapa.
 * Cena própria para ter câmera própria: fica atrás da tela que a abriu.
 */
export class BackdropScene extends Phaser.Scene {
  private view!: StageView;
  private drift = false;
  private viewportScale = 1;

  constructor() {
    super('backdrop');
  }

  create(data: BackdropData): void {
    const { width, height } = this.scale;
    const vp = data.viewport ?? { x: 0, y: 0, w: width, h: height };
    this.drift = data.drift ?? false;
    this.viewportScale = vp.w / width;
    this.cameras.main.setViewport(vp.x, vp.y, vp.w, vp.h);
    this.view = new StageView(this, getStage(data.stageId), {
      background: -10,
      stage: 0,
      decoration: 2,
    });
    this.place(0);
  }

  override update(time: number): void {
    this.place(time);
  }

  private place(time: number): void {
    const { width, height } = this.scale;
    const target = frameTargets([STAGE_VIEW], width, height);
    const x =
      target.x + (this.drift ? Math.sin((time / DRIFT_PERIOD_MS) * Math.PI * 2) * DRIFT_PX : 0);
    const cam = this.cameras.main;
    cam.setZoom(target.zoom * this.viewportScale);
    cam.centerOn(x, target.y);
    this.view.update({ x, y: target.y, zoom: target.zoom, width, height });
  }
}
