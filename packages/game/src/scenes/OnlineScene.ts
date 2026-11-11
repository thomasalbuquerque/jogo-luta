import Phaser from 'phaser';
import { STAGES } from '@jogo-luta/sim';
import { music } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { addAudioHint } from '../audio/unlock';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { closeOnline, getOnline, hostRoom, joinRoom } from '../net/online';
import { isRoomCode, normalizeRoomCode, ROOM_CODE_LENGTH, roomLink } from '../net/roomCode';
import { onlineRoute } from '../net/route';
import { endMessage, type EndReason } from '../net/transport';
import { MenuList } from '../ui/MenuList';
import { fadeIn, titleText, UI, uiText } from '../ui/theme';
import type { BackdropData } from './BackdropScene';

export interface OnlineData {
  /** Voltando de uma sala que acabou: mostra o motivo. */
  ended?: EndReason;
  /** Já entra nesta sala (link com `?sala=ABCD`). */
  code?: string;
}

/** menu: criar ou entrar; host: sala criada, esperando; join: digitando o código; dialing: entrando. */
type Mode = 'menu' | 'host' | 'join' | 'dialing';

const PLAYERS = 2;
/** Código sorteado que já existe: sorteia outro, até este tanto de vezes. */
const MAX_ROOM_TRIES = 5;

/**
 * Jogar online: criar uma sala (aparece um código de 4 letras para mandar no
 * grupo) ou entrar na sala de um amigo com o código. Com alguém na sala, vai
 * para a seleção de personagem.
 */
export class OnlineScene extends Phaser.Scene {
  private controls!: MenuInput;
  private menu!: MenuList;
  private note!: Phaser.GameObjects.Text;
  private label!: Phaser.GameObjects.Text;
  private codeText!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private mode: Mode = 'menu';
  /** Código sendo digitado (ou o da sala em que está entrando). */
  private typed = '';
  private roomTries = 0;
  private copied = false;
  private startData: OnlineData = {};

  constructor() {
    super('online');
  }

  init(data: OnlineData): void {
    this.startData = data;
    this.mode = 'menu';
    this.typed = '';
    this.roomTries = 0;
    this.copied = false;
  }

  create(): void {
    const { width, height } = this.scale;
    // chegar aqui é estar fora de qualquer sala
    closeOnline();
    this.controls = new MenuInput();
    const onPaste = (e: ClipboardEvent): void => {
      if (this.mode === 'join') this.setTyped(e.clipboardData?.getData('text') ?? '');
    };
    window.addEventListener('paste', onPaste);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.scene.stop('backdrop');
      window.removeEventListener('paste', onPaste);
    });
    const stageId = STAGES[0]?.id;
    if (stageId) this.scene.launch('backdrop', { stageId, drift: true } satisfies BackdropData);
    music.play(this, 'menu');
    fadeIn(this);
    addAudioHint(this);
    this.add.rectangle(0, 0, width, height, 0x0b0e16, 0.6).setOrigin(0);
    titleText(this, width / 2, 84, 'JOGAR ONLINE', 54, '#ffd166');

    this.note = uiText(this, width / 2, 160, '', {
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffd166',
      stroke: '#0b0e16',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.menu = new MenuList(
      this,
      [
        {
          label: 'Criar sala',
          onSelect: () => {
            this.createRoom();
          },
        },
        {
          label: 'Entrar com código',
          onSelect: () => {
            this.setTyped('');
            this.setMode('join');
          },
        },
        {
          label: 'Voltar',
          onSelect: () => {
            this.scene.start('title', { menu: true });
          },
        },
      ],
      { x: width / 2, y: 290, width: 420, height: 54, fontSize: 26 },
    );
    this.label = uiText(this, width / 2, 228, '', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: UI.muted,
    }).setOrigin(0.5);
    this.codeText = titleText(this, width / 2, 330, '', 120);
    this.status = uiText(this, width / 2, 450, '', {
      fontSize: '26px',
      fontStyle: 'bold',
      stroke: '#0b0e16',
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.status, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
    this.hint = uiText(this, width / 2, 520, '', {
      fontSize: '18px',
      color: '#ced4da',
      align: 'center',
    }).setOrigin(0.5, 0);
    uiText(
      this,
      width / 2,
      height - 24,
      'Um cria a sala e manda o código; até 3 amigos entram com ele. Cada um joga no seu PC.',
      { fontSize: '15px', color: UI.muted },
    ).setOrigin(0.5);

    // digitar o código (as letras também são teclas de jogo: aqui valem como letras)
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (this.mode === 'join') {
        if (e.key === 'Backspace') this.setTyped(this.typed.slice(0, -1));
        else if (/^[a-zA-Z]$/.test(e.key)) this.setTyped(this.typed + e.key);
      } else if (this.mode === 'host' && e.code === 'KeyC') {
        this.copyLink();
      }
    });
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => {
      if (this.mode === 'host') this.copyLink();
    });

    this.setMode('menu');
    if (this.startData.ended) this.note.setText(endMessage(this.startData.ended));
    if (this.startData.code) this.join(this.startData.code);
  }

  override update(_time: number, delta: number): void {
    const frame = this.controls.poll(PLAYERS, delta);
    switch (this.mode) {
      case 'menu':
        if (frame.any & Menu.BACK) {
          playSfx(this, 'ui_back');
          this.scene.start('title', { menu: true });
          return;
        }
        this.menu.handle(frame.any);
        break;
      case 'join':
        if (frame.system & Menu.BACK) this.cancel();
        else if (frame.system & Menu.CONFIRM) this.join(this.typed);
        break;
      case 'host':
      case 'dialing':
        if (frame.system & Menu.BACK) this.cancel();
        else this.followRoom();
        break;
    }
  }

  private setMode(mode: Mode): void {
    this.mode = mode;
    const inMenu = mode === 'menu';
    this.menu.setVisible(inMenu);
    for (const t of [this.label, this.codeText, this.status, this.hint]) t.setVisible(!inMenu);
    this.controls.reset();
    this.refresh();
  }

  private setTyped(text: string): void {
    this.typed = normalizeRoomCode(text);
    this.refresh();
  }

  /** Textos da tela para o modo atual. */
  private refresh(): void {
    const net = getOnline();
    switch (this.mode) {
      case 'menu':
        break;
      case 'host': {
        const code = net?.roomReady ? net.code : null;
        const ready = code !== null;
        this.label.setText('CÓDIGO DA SALA');
        this.codeText.setText(code ?? '····');
        this.status.setText(ready ? 'Esperando os amigos entrarem…' : 'Criando a sala…');
        this.hint.setText(
          ready
            ? `Mande o código no grupo.\n${this.copied ? 'Link da sala copiado!' : 'C (ou clique) copia o link que já entra na sala.'}\nEsc: cancelar`
            : 'Esc: cancelar',
        );
        break;
      }
      case 'join':
        this.label.setText('DIGITE O CÓDIGO DA SALA');
        this.codeText.setText(this.typed.padEnd(ROOM_CODE_LENGTH, '_').split('').join(' '));
        this.status.setText('');
        this.hint.setText('Enter: entrar      Esc: voltar');
        break;
      case 'dialing':
        this.label.setText('SALA');
        this.codeText.setText(this.typed);
        this.status.setText('Entrando na sala…');
        this.hint.setText('Esc: cancelar');
        break;
    }
  }

  private createRoom(): void {
    this.note.setText('');
    this.copied = false;
    hostRoom();
    this.setMode('host');
  }

  private join(code: string): void {
    this.setTyped(code);
    if (!isRoomCode(this.typed)) {
      playSfx(this, 'ui_error');
      this.note.setText(`O código da sala tem ${String(ROOM_CODE_LENGTH)} letras.`);
      this.setMode('join');
      return;
    }
    playSfx(this, 'ui_confirm');
    this.note.setText('');
    joinRoom(this.typed);
    this.setMode('dialing');
  }

  /** Esc: sai da sala (ou da digitação) e volta às opções. */
  private cancel(): void {
    playSfx(this, 'ui_back');
    closeOnline();
    this.roomTries = 0;
    this.setMode('menu');
  }

  /** Com a sala aberta: espera o outro jogador e segue para a tela da sala. */
  private followRoom(): void {
    const net = getOnline();
    if (!net) return;
    if (net.ended) {
      this.onRoomEnded(net.ended);
      return;
    }
    // os dois na sala: o host abre a seleção de personagem
    if (net.role === 'host' && net.status === 'connected' && !net.screen) net.openSelect();
    const route = onlineRoute(net, 'online');
    if (route) {
      playSfx(this, 'ui_confirm');
      this.scene.start(route.scene, route.data);
      return;
    }
    this.refresh();
  }

  private onRoomEnded(reason: EndReason): void {
    closeOnline();
    if (reason === 'taken' && this.roomTries < MAX_ROOM_TRIES) {
      this.roomTries++;
      hostRoom();
      return;
    }
    playSfx(this, 'ui_error');
    this.note.setText(endMessage(reason === 'taken' ? 'error' : reason));
    this.roomTries = 0;
    this.setMode(this.mode === 'dialing' ? 'join' : 'menu');
  }

  private copyLink(): void {
    const net = getOnline();
    if (!net?.roomReady) return;
    const done = (): void => {
      this.copied = true;
    };
    const failed = (): void => {
      // sem permissão para copiar: o código na tela já basta
    };
    try {
      navigator.clipboard.writeText(roomLink(window.location.href, net.code)).then(done, failed);
    } catch {
      failed();
    }
  }
}
