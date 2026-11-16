import Phaser from 'phaser';
import { STAGES } from '@jogo-luta/sim';
import { music } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { getPlayerName, letters, MAX_NAME_LENGTH, setPlayerName } from '../profile/playerName';
import { VIEW } from '../render/view';
import { fadeIn, panel, titleText, UI, uiText } from '../ui/theme';
import type { BackdropData } from './BackdropScene';
import type { OnlineData } from './OnlineScene';

export interface NameData {
  /** 1ª vez (ainda sem nome): não dá para voltar sem digitar. */
  first?: boolean;
  /** Veio por um link de sala (`?sala=ABCD`): depois do nome, entra nela. */
  room?: string;
}

const BOX_W = 560;
const BOX_H = 96;
const BOX_Y = 330;

/**
 * Digitar o nome de quem joga neste navegador (fica salvo para a próxima vez).
 * O texto vai num `<input>` escondido: assim acento, colar e o teclado do
 * celular funcionam; a cena só desenha o que está nele.
 */
export class NameScene extends Phaser.Scene {
  private field!: HTMLInputElement;
  private nameText!: Phaser.GameObjects.Text;
  private caret!: Phaser.GameObjects.Rectangle;
  private note!: Phaser.GameObjects.Text;
  private first = false;
  private room: string | null = null;

  constructor() {
    super('name');
  }

  init(data: NameData): void {
    this.first = data.first === true || getPlayerName() === null;
    this.room = data.room ?? null;
  }

  create(): void {
    const { width, height } = VIEW;
    const stageId = STAGES[0]?.id;
    if (stageId) this.scene.launch('backdrop', { stageId, drift: true } satisfies BackdropData);
    music.play(this, 'menu');
    fadeIn(this);
    this.add.rectangle(0, 0, width, height, 0x0b0e16, 0.6).setOrigin(0);

    titleText(
      this,
      width / 2,
      150,
      this.first ? 'QUAL É O SEU NOME?' : 'ALTERAR NOME',
      54,
      '#ffd166',
    );
    uiText(this, width / 2, 222, 'Ele aparece em cima do seu lutador e para os amigos no online.', {
      fontSize: '20px',
      color: '#ced4da',
    }).setOrigin(0.5);

    const g = this.add.graphics();
    panel(g, width / 2 - BOX_W / 2, BOX_Y - BOX_H / 2, BOX_W, BOX_H, UI.panelDark, 0.92, 16);
    g.lineStyle(4, UI.accent, 1);
    g.strokeRoundedRect(width / 2 - BOX_W / 2, BOX_Y - BOX_H / 2, BOX_W, BOX_H, 16);
    this.nameText = titleText(this, width / 2, BOX_Y, '', 48);
    this.caret = this.add.rectangle(0, BOX_Y, 5, 54, 0xffffff).setOrigin(0, 0.5);
    this.tweens.add({ targets: this.caret, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    this.note = uiText(this, width / 2, BOX_Y + 84, '', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffd166',
      stroke: '#0b0e16',
      strokeThickness: 5,
    }).setOrigin(0.5);
    uiText(
      this,
      width / 2,
      BOX_Y + 140,
      this.first ? 'Enter: confirmar' : 'Enter: confirmar      Esc: voltar',
      { fontSize: '20px', color: '#ced4da' },
    ).setOrigin(0.5);
    uiText(
      this,
      width / 2,
      height - 24,
      `Até ${String(MAX_NAME_LENGTH)} letras. Fica salvo neste navegador; dá para trocar no menu, em "Alterar nome".`,
      { fontSize: '15px', color: UI.muted },
    ).setOrigin(0.5);

    this.field = this.makeField(getPlayerName() ?? '');
    // clicar no jogo tira o foco do campo: devolve
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.field.focus();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.field.remove();
      this.scene.stop('backdrop');
    });
    this.refresh();
  }

  /** Campo de texto escondido (fora da vista) que recebe o que é digitado. */
  private makeField(value: string): HTMLInputElement {
    const field = document.createElement('input');
    field.type = 'text';
    field.value = value;
    field.autocomplete = 'off';
    field.spellcheck = false;
    field.setAttribute('aria-label', 'Seu nome');
    Object.assign(field.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '1px',
      height: '1px',
      opacity: '0',
      border: '0',
      padding: '0',
    });
    field.addEventListener('input', () => {
      // não passa do máximo (o resto da limpeza é ao confirmar)
      const typed = letters(field.value);
      if (typed.length > MAX_NAME_LENGTH) field.value = typed.slice(0, MAX_NAME_LENGTH).join('');
      this.note.setText('');
      this.refresh();
    });
    field.addEventListener('keydown', (e) => {
      // as teclas não vão para o jogo enquanto digita
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.back();
      } else if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)
      ) {
        // o cursor fica sempre no fim (é onde ele aparece)
        e.preventDefault();
      }
    });
    field.addEventListener('blur', () => {
      // perde o foco quando a janela perde; volta quando ela volta
      window.setTimeout(() => {
        if (this.scene.isActive()) field.focus({ preventScroll: true });
      }, 0);
    });
    document.body.appendChild(field);
    field.focus({ preventScroll: true });
    field.setSelectionRange(field.value.length, field.value.length);
    return field;
  }

  private refresh(): void {
    const value = this.field.value;
    this.nameText.setText(value);
    const right = value === '' ? VIEW.width / 2 : this.nameText.x + this.nameText.width / 2;
    this.caret.setX(right + 4);
  }

  private confirm(): void {
    const name = setPlayerName(this.field.value);
    if (name === null) {
      playSfx(this, 'ui_error');
      this.note.setText('Digite um nome.');
      return;
    }
    playSfx(this, 'ui_confirm');
    this.leave();
  }

  private back(): void {
    if (this.first) {
      playSfx(this, 'ui_error');
      this.note.setText('Digite um nome para começar.');
      return;
    }
    playSfx(this, 'ui_back');
    this.leave();
  }

  private leave(): void {
    if (this.room) this.scene.start('online', { code: this.room } satisfies OnlineData);
    else this.scene.start('title', { menu: true });
  }
}
