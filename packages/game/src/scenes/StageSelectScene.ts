import Phaser from 'phaser';
import { STAGES } from '@jogo-luta/sim';
import { playSfx } from '../audio/sfx';
import { addAudioHint } from '../audio/unlock';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { fadeIn, panel, titleText, UI, uiText } from '../ui/theme';
import type { BackdropData } from './BackdropScene';
import type { MatchSetup } from './FightScene';

const PLAYERS = 2;
/** Miniatura do mapa (16:9, como a tela). */
const THUMB_W = 720;
const THUMB_H = 405;
const THUMB_Y = 110;

/** Nome e descrição de cada mapa (o sim só conhece o id). */
const STAGE_INFO: Readonly<Record<string, { name: string; blurb: string }>> = {
  test: {
    name: 'Laje',
    blurb: 'Laje no fim de tarde, com 2 tábuas para subir. Caiu do prédio, perdeu a vida.',
  },
};

export function stageName(id: string): string {
  return STAGE_INFO[id]?.name ?? id;
}

/**
 * Seleção de mapa: um cursor só, qualquer jogador mexe. ←/→ troca (quando houver
 * mais de um), Ataque/Pulo/Enter luta, Especial/Esc volta para os personagens.
 */
export class StageSelectScene extends Phaser.Scene {
  private controls!: MenuInput;
  private setup: MatchSetup = { characters: [], stageId: '' };
  private index = 0;
  private name!: Phaser.GameObjects.Text;
  private blurb!: Phaser.GameObjects.Text;
  private arrows: Phaser.GameObjects.Text[] = [];

  constructor() {
    super('stage');
  }

  init(data: Partial<MatchSetup>): void {
    this.index = Math.max(
      0,
      STAGES.findIndex((s) => s.id === data.stageId),
    );
    this.setup = { characters: data.characters ?? [], stageId: STAGES[this.index]?.id ?? '' };
  }

  create(): void {
    this.controls = new MenuInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.scene.stop('backdrop');
    });
    fadeIn(this);
    addAudioHint(this, 2);
    const { width, height } = this.scale;
    titleText(this, width / 2, 50, 'ESCOLHA O MAPA', 38);

    const x = (width - THUMB_W) / 2;
    // a miniatura é a cena do fundo (atrás desta): o painel deixa o buraco dela
    const g = this.add.graphics();
    panel(g, x - 12, THUMB_Y + THUMB_H, THUMB_W + 24, 120, UI.panel, 1, 16);
    g.fillRect(x - 12, THUMB_Y + THUMB_H, THUMB_W + 24, 20);
    g.lineStyle(12, UI.panel, 1);
    g.strokeRect(x - 6, THUMB_Y - 6, THUMB_W + 12, THUMB_H + 12);
    g.lineStyle(4, UI.accent, 1);
    g.strokeRect(x - 2, THUMB_Y - 2, THUMB_W + 4, THUMB_H + 4);

    this.name = uiText(this, width / 2, THUMB_Y + THUMB_H + 30, '', {
      fontFamily: UI.titleFont,
      fontSize: '32px',
    }).setOrigin(0.5);
    this.blurb = uiText(this, width / 2, THUMB_Y + THUMB_H + 74, '', {
      fontSize: '18px',
      color: '#ced4da',
    }).setOrigin(0.5);
    if (STAGES.length > 1) {
      this.arrows = [-1, 1].map((side) =>
        uiText(
          this,
          width / 2 + side * (THUMB_W / 2 + 50),
          THUMB_Y + THUMB_H / 2,
          side < 0 ? '◀' : '▶',
          {
            fontSize: '44px',
            color: '#ffd166',
          },
        ).setOrigin(0.5),
      );
    }
    uiText(
      this,
      width / 2,
      height - 22,
      'Ataque, Pulo ou Enter: lutar      Especial ou Esc: trocar lutador',
      { fontSize: '15px', color: UI.muted },
    ).setOrigin(0.5);
    this.show();
  }

  override update(_time: number, delta: number): void {
    const actions = this.controls.poll(PLAYERS, delta).any;
    const n = STAGES.length;
    if (n > 1 && actions & (Menu.LEFT | Menu.RIGHT)) {
      this.index = (this.index + (actions & Menu.LEFT ? n - 1 : 1)) % n;
      playSfx(this, 'ui_move');
      this.show();
    }
    if (actions & Menu.BACK) {
      playSfx(this, 'ui_back');
      this.scene.start('select', this.setup);
      return;
    }
    if (actions & (Menu.CONFIRM | Menu.START)) {
      playSfx(this, 'ui_confirm');
      this.scene.start('fight', this.setup);
    }
  }

  /** Mostra o mapa escolhido: o cenário de verdade na miniatura, nome e descrição. */
  private show(): void {
    const stage = STAGES[this.index];
    if (!stage) return;
    this.setup = { ...this.setup, stageId: stage.id };
    this.name.setText(stageName(stage.id));
    this.blurb.setText(STAGE_INFO[stage.id]?.blurb ?? '');
    const viewport = { x: (this.scale.width - THUMB_W) / 2, y: THUMB_Y, w: THUMB_W, h: THUMB_H };
    this.scene.stop('backdrop');
    this.scene.launch('backdrop', { stageId: stage.id, viewport } satisfies BackdropData);
    for (const a of this.arrows) a.setVisible(STAGES.length > 1);
  }
}
