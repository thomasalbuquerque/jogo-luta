import Phaser from 'phaser';
import { PLAYABLE_CHARACTERS, STAGES } from '@jogo-luta/sim';
import { music } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { addAudioHint } from '../audio/unlock';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { pickReplayFile, readReplayFile } from '../match/replayFile';
import { MenuList } from '../ui/MenuList';
import { addPortrait } from '../ui/portrait';
import { fadeIn, titleText, UI, uiText } from '../ui/theme';
import type { BackdropData } from './BackdropScene';
import type { FightData } from './FightScene';

export interface TitleData {
  /** Voltando de outra tela: já abre no menu (sem o "aperte para começar"). */
  menu?: boolean;
}

/** Jogadores que podem mexer no menu (teclado e controle de cada um). */
const PLAYERS = 2;

/**
 * Tela inicial: nome do jogo e "aperte para começar" (o 1º aperto também libera
 * o som); depois o menu de modo: mesmo PC, online (em breve), ver um replay
 * salvo (escolhendo o arquivo ou arrastando para a janela) e controles.
 */
export class TitleScene extends Phaser.Scene {
  private controls!: MenuInput;
  private menu!: MenuList;
  private press!: Phaser.GameObjects.Text;
  private note!: Phaser.GameObjects.Text;
  private inMenu = false;

  constructor() {
    super('title');
  }

  init(data: TitleData): void {
    this.inMenu = data.menu ?? false;
  }

  create(): void {
    const { width, height } = this.scale;
    this.controls = new MenuInput();
    // arrastar um arquivo de replay para a janela abre o replay
    const onDragOver = (e: DragEvent): void => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent): void => {
      e.preventDefault();
      const file = e.dataTransfer?.files[0];
      if (file) this.openReplay(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.scene.stop('backdrop');
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    });
    const stageId = STAGES[0]?.id;
    if (stageId) this.scene.launch('backdrop', { stageId, drift: true } satisfies BackdropData);
    music.play(this, 'menu');
    fadeIn(this, 300);

    // escurece o fundo embaixo, onde fica o menu
    const shade = this.add.graphics();
    shade.fillGradientStyle(0x0b0e16, 0x0b0e16, 0x0b0e16, 0x0b0e16, 0.15, 0.15, 0.8, 0.8);
    shade.fillRect(0, 0, width, height);

    // os 2 primeiros, um de cada lado do nome
    PLAYABLE_CHARACTERS.slice(0, 2).forEach((id, i) => {
      const side = i === 0 ? -1 : 1;
      const img = addPortrait(this, id, width / 2 + side * 400, 210, 250).setFlipX(side === 1);
      img.setAngle(side * 6);
      this.tweens.add({
        targets: img,
        y: img.y - 10,
        duration: 1400 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });
    titleText(this, width / 2, 150, 'JOGO DE LUTA', 76, '#ffd166').setAngle(-3);
    titleText(this, width / 2, 238, 'DOS AMIGOS', 52).setAngle(-3);

    this.press = uiText(this, width / 2, 470, 'Aperte qualquer tecla para começar', {
      fontSize: '30px',
      fontStyle: 'bold',
      stroke: '#0b0e16',
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.press, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });

    this.menu = new MenuList(
      this,
      [
        {
          label: 'Jogar no mesmo PC',
          onSelect: () => {
            this.go('select');
          },
        },
        { label: 'Jogar online', disabled: 'em breve' },
        {
          label: 'Ver replay',
          onSelect: () => {
            this.note.setText('Escolha o arquivo do replay (ou arraste o arquivo para o jogo).');
            pickReplayFile((file) => {
              this.openReplay(file);
            });
          },
        },
        {
          label: 'Controles',
          onSelect: () => {
            this.go('controls');
          },
        },
      ],
      { x: width / 2, y: 392, width: 420, height: 54, fontSize: 26 },
    );
    this.note = uiText(this, width / 2, 336, '', {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffd166',
      stroke: '#0b0e16',
      strokeThickness: 5,
    }).setOrigin(0.5);
    uiText(this, width / 2, height - 24, 'M liga e desliga o som', {
      fontSize: '15px',
      color: UI.muted,
    }).setOrigin(0.5);
    addAudioHint(this);

    // qualquer tecla (menos M, o mudo) ou clique começa
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (!this.inMenu && e.code !== 'KeyM' && !e.repeat) this.openMenu();
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (!this.inMenu) this.openMenu();
    });
    this.showMenu(this.inMenu);
  }

  override update(_time: number, delta: number): void {
    const frame = this.controls.poll(PLAYERS, delta);
    if (!this.inMenu) {
      // controle: qualquer botão
      if (frame.any !== 0) this.openMenu();
      return;
    }
    if (frame.any & Menu.BACK) {
      playSfx(this, 'ui_back');
      this.showMenu(false);
      return;
    }
    this.menu.handle(frame.any);
  }

  private openMenu(): void {
    playSfx(this, 'ui_confirm');
    this.showMenu(true);
    this.controls.reset();
  }

  private showMenu(visible: boolean): void {
    this.inMenu = visible;
    this.menu.setVisible(visible);
    this.press.setVisible(!visible);
    this.note.setVisible(visible);
  }

  /** Abre um arquivo de replay e assiste; arquivo estranho só mostra o motivo. */
  private openReplay(file: File): void {
    readReplayFile(file).then(
      (replay) => {
        if (!this.scene.isActive()) return;
        this.scene.start('fight', { replay } satisfies FightData);
      },
      (error: unknown) => {
        if (!this.scene.isActive()) return;
        this.showMenu(true);
        this.note.setText(error instanceof Error ? error.message : 'Replay inválido.');
        playSfx(this, 'ui_error');
      },
    );
  }

  private go(scene: 'select' | 'controls'): void {
    this.scene.start(scene);
  }
}
