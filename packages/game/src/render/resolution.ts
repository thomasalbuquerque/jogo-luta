import Phaser from 'phaser';
import { pickRenderScale, VIEW } from './view';

/**
 * Resolução de renderização. O layout de todas as telas é pensado em 1280×720
 * (`VIEW`), mas o canvas tem `RENDER_SCALE` vezes isso: num monitor grande o
 * navegador não precisa esticar a imagem (o que deixava tudo embaçado). Cada
 * câmera ganha esse zoom a mais e os textos são desenhados nessa resolução.
 */

export { VIEW } from './view';

function detectRenderScale(): number {
  // ?resolucao=1 força a escala (para comparar com o jeito antigo)
  const param = new URLSearchParams(window.location.search).get('resolucao');
  return pickRenderScale(
    window.screen.width,
    window.screen.height,
    window.devicePixelRatio || 1,
    param === null ? undefined : Number(param),
  );
}

/** Escala de renderização desta sessão (escolhida uma vez, no carregamento). */
export const RENDER_SCALE = detectRenderScale();

/** Câmera que mostra a tela lógica inteira (menus, HUD). */
export function fitCamera(cam: Phaser.Cameras.Scene2D.Camera): void {
  cam.setZoom(RENDER_SCALE).centerOn(VIEW.width / 2, VIEW.height / 2);
}

/**
 * Plugin de cena: toda cena começa com a câmera principal mostrando a tela
 * lógica, e todo texto criado é desenhado em `RENDER_SCALE` (senão ficaria
 * embaçado com o zoom). Cenas com câmera própria (luta, fundo) multiplicam o
 * zoom delas por `RENDER_SCALE`.
 */
export class RenderScalePlugin extends Phaser.Plugins.ScenePlugin {
  override boot(): void {
    const events = this.systems?.events;
    events?.on(Phaser.Scenes.Events.START, () => {
      const cam = this.systems?.cameras.main;
      if (cam) fitCamera(cam);
    });
    events?.on(Phaser.Scenes.Events.ADDED_TO_SCENE, (obj: Phaser.GameObjects.GameObject) => {
      if (obj instanceof Phaser.GameObjects.Text && obj.style.resolution === 1) {
        obj.setResolution(RENDER_SCALE);
      }
    });
  }
}
