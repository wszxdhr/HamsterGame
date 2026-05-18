import './style.css';
import type { GameState, PlayerId, Piece, BoardCoordinate, PlayerState } from './game';
import {
  createInitialState, rollDice, applyDiceRoll, selectMove,
  getPieceCoordinate, COMMON_TRACK_COORDS, FINISH_LANE_COORDS, BASE_COORDS,
  BOARD_SIZE, SAFE_TRACK_INDICES,
} from './game';
import type { GameSettings, PlayerColor } from './settings';
import { DEFAULT_SETTINGS, SETTING_LABELS, COLOR_VALUES, COLOR_LABELS } from './settings';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('App root element was not found.');
}
const appRoot = app;

const currentSettings: GameSettings = { ...DEFAULT_SETTINGS };
let gameState: GameState | null = null;
let victoryToastShown = false;
let isRolling = false;

const trackIndexMap = new Map<string, number>();
COMMON_TRACK_COORDS.forEach((coord, index) => {
  trackIndexMap.set(`${coord.row},${coord.col}`, index);
});

const finishMap = new Map<string, { color: PlayerColor; step: number }>();
(Object.entries(FINISH_LANE_COORDS) as [PlayerColor, BoardCoordinate[]][]).forEach(
  ([color, coords]) => {
    coords.forEach((coord, step) => {
      finishMap.set(`${coord.row},${coord.col}`, { color, step });
    });
  },
);

const baseMap = new Map<string, PlayerColor>();
(Object.entries(BASE_COORDS) as [PlayerColor, BoardCoordinate[]][]).forEach(
  ([color, coords]) => {
    coords.forEach((coord) => {
      baseMap.set(`${coord.row},${coord.col}`, color);
    });
  },
);

const homeCoord: BoardCoordinate = { row: 7, col: 7 };

function createRadioGroup(
  _name: string,
  options: { value: string; label: string }[],
  selectedValue: string,
  onChange: (value: string) => void,
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'radio-group';

  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'radio-btn';
    btn.dataset.value = option.value;
    btn.textContent = option.label;

    if (option.value === selectedValue) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      group.querySelectorAll('.radio-btn').forEach((b) => {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      onChange(option.value);
    });

    group.appendChild(btn);
  });

  return group;
}

function createSettingItem(label: string, control: HTMLElement): HTMLElement {
  const item = document.createElement('div');
  item.className = 'setting-item';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;

  item.appendChild(labelEl);
  item.appendChild(control);

  return item;
}

function renderSettingsPage(): void {
  appRoot.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'settings-page';

  const title = document.createElement('h1');
  title.textContent = '飞行棋设置';

  const card = document.createElement('div');
  card.className = 'settings-card';

  const directionGroup = createRadioGroup(
    'directionMode',
    SETTING_LABELS.directionMode.options.map((o) => ({ value: o.value, label: o.label })),
    currentSettings.directionMode,
    (value) => {
      currentSettings.directionMode = value as GameSettings['directionMode'];
    },
  );
  card.appendChild(createSettingItem(SETTING_LABELS.directionMode.label, directionGroup));

  const playerCountGroup = createRadioGroup(
    'playerCount',
    SETTING_LABELS.playerCount.options.map((o) => ({ value: o.value, label: o.label })),
    String(currentSettings.playerCount),
    (value) => {
      currentSettings.playerCount = Number(value) as GameSettings['playerCount'];
    },
  );
  card.appendChild(createSettingItem(SETTING_LABELS.playerCount.label, playerCountGroup));

  const takeoffGroup = createRadioGroup(
    'takeoffCondition',
    SETTING_LABELS.takeoffCondition.options.map((o) => ({ value: o.value, label: o.label })),
    currentSettings.takeoffCondition,
    (value) => {
      currentSettings.takeoffCondition = value as GameSettings['takeoffCondition'];
    },
  );
  card.appendChild(createSettingItem(SETTING_LABELS.takeoffCondition.label, takeoffGroup));

  const consecutiveGroup = createRadioGroup(
    'consecutiveRolls',
    SETTING_LABELS.consecutiveRolls.options.map((o) => ({ value: o.value, label: o.label })),
    currentSettings.consecutiveRolls,
    (value) => {
      currentSettings.consecutiveRolls = value as GameSettings['consecutiveRolls'];
    },
  );
  card.appendChild(createSettingItem(SETTING_LABELS.consecutiveRolls.label, consecutiveGroup));

  const collisionGroup = createRadioGroup(
    'collisionRule',
    SETTING_LABELS.collisionRule.options.map((o) => ({ value: o.value, label: o.label })),
    currentSettings.collisionRule,
    (value) => {
      currentSettings.collisionRule = value as GameSettings['collisionRule'];
    },
  );
  card.appendChild(createSettingItem(SETTING_LABELS.collisionRule.label, collisionGroup));

  const finishGroup = createRadioGroup(
    'finishRule',
    SETTING_LABELS.finishRule.options.map((o) => ({ value: o.value, label: o.label })),
    currentSettings.finishRule,
    (value) => {
      currentSettings.finishRule = value as GameSettings['finishRule'];
    },
  );
  card.appendChild(createSettingItem(SETTING_LABELS.finishRule.label, finishGroup));

  const startBtn = document.createElement('button');
  startBtn.className = 'start-btn';
  startBtn.textContent = '开始游戏';
  startBtn.addEventListener('click', startGame);

  container.appendChild(title);
  container.appendChild(card);
  container.appendChild(startBtn);
  appRoot.appendChild(container);
}

function getPlayerBarHTML(playerId: PlayerId, variant: 'full' | 'compact'): string {
  if (!gameState) return '';

  const player = gameState.players.find((p) => p.id === playerId);
  if (!player) return '';

  const isCurrent = gameState.currentPlayer === playerId;
  const color = player.color;
  const colorName = COLOR_LABELS[color];
  const colorValue = COLOR_VALUES[color];

  const baseCount = gameState.pieces.filter(
    (p) => p.playerId === playerId && p.location.kind === 'base',
  ).length;
  const homeCount = gameState.pieces.filter(
    (p) => p.playerId === playerId && p.location.kind === 'home',
  ).length;

  let status = '等待';
  if (gameState.status === 'finished') {
    status = gameState.winner === playerId ? '胜利!' : '结束';
  } else if (isCurrent) {
    status = gameState.status === 'waiting-roll' ? '掷骰子' : '选择棋子';
  }

  if (variant === 'compact') {
    return `
      <div class="player-bar compact ${color}${isCurrent ? ' current' : ''}" data-player-id="${playerId}">
        <div class="player-color-indicator" style="background:${colorValue}"></div>
        <div class="player-bar-info">
          <span class="player-name">${colorName}</span>
          <span class="player-status">${status}</span>
        </div>
        <div class="player-bar-stats">
          <span>基地 ${baseCount}</span>
          <span>终点 ${homeCount}</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="player-bar ${color}${isCurrent ? ' current' : ''}" data-player-id="${playerId}">
      <div class="player-info">
        <span class="player-name">${colorName}</span>
        <span class="player-status">${status}</span>
      </div>
      <div class="player-stats">
        <div class="stat">
          <span class="stat-label">基地</span>
          <span class="stat-value">${baseCount}</span>
        </div>
        <div class="stat">
          <span class="stat-label">终点</span>
          <span class="stat-value">${homeCount}</span>
        </div>
      </div>
      <div class="player-actions">
        <button class="action-btn" data-action="reset">重新开始</button>
        <button class="action-btn" data-action="settings">返回首页</button>
      </div>
    </div>
  `;
}

function getDicePanelHTML(): string {
  if (!gameState) return '';

    const currentPlayer = gameState.players.find((p) => p.id === gameState.currentPlayer);
  const canRoll = gameState.status === 'waiting-roll' && !isRolling;
  const diceValue = gameState.diceValue ?? 1;

  const dotsHTML = Array.from({ length: 9 }, (_, i) => `<div class="dice-dot" data-dot="${i}"></div>`).join('');

  return `
    <div class="dice-panel">
      <div class="current-player-info">
        <span class="current-player-name" style="color:${currentPlayer ? COLOR_VALUES[currentPlayer.color] : '#fff'}">
          ${currentPlayer ? COLOR_LABELS[currentPlayer.color] : ''}
        </span>
        <span class="current-player-action">
          ${gameState.status === 'waiting-roll' ? '请掷骰子' : gameState.status === 'waiting-piece' ? '请选择棋子' : ''}
        </span>
      </div>
      <div class="dice-display" data-value="${diceValue}">
        ${dotsHTML}
      </div>
      <button class="roll-btn" ${canRoll ? '' : 'disabled'}>掷骰子</button>
    </div>
  `;
}

function getTwoPlayerLayout(): string {
  if (!gameState) return '';
  const p2 = gameState.players[1];
  const p1 = gameState.players[0];
  return `
    ${getPlayerBarHTML(p2.id, 'full')}
    <div class="board-area">
      <div class="board" role="grid"></div>
    </div>
    ${getDicePanelHTML()}
    ${getPlayerBarHTML(p1.id, 'full')}
  `;
}

function getMultiPlayerLayout(): string {
  if (!gameState) return '';
  const bars = gameState.players
    .map((p) => getPlayerBarHTML(p.id, 'compact'))
    .join('');
  return `
    <div class="player-bars-row">
      ${bars}
    </div>
    <div class="board-area">
      <div class="board" role="grid"></div>
    </div>
    ${getDicePanelHTML()}
  `;
}

function createBoardCells(boardEl: HTMLElement): void {
  boardEl.innerHTML = '';

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const btn = document.createElement('button');
      btn.className = 'board-cell';
      btn.dataset.row = String(row);
      btn.dataset.col = String(col);

      const key = `${row},${col}`;
      const trackIndex = trackIndexMap.get(key);

      if (trackIndex !== undefined) {
        btn.dataset.cellType = 'track';
        btn.dataset.trackIndex = String(trackIndex);
        if (SAFE_TRACK_INDICES.has(trackIndex)) {
          btn.classList.add('safe-square');
        }
      } else if (finishMap.has(key)) {
        const info = finishMap.get(key);
        if (info) {
          btn.dataset.cellType = 'finish';
          btn.dataset.finishColor = info.color;
          btn.dataset.finishStep = String(info.step);
        }
      } else if (baseMap.has(key)) {
        const color = baseMap.get(key);
        if (color) {
          btn.dataset.cellType = 'base';
          btn.dataset.baseColor = color;
        }
      } else if (row === homeCoord.row && col === homeCoord.col) {
        btn.dataset.cellType = 'home';
      } else {
        btn.dataset.cellType = 'empty';
      }

      boardEl.appendChild(btn);
    }
  }
}

function updateBoard(boardEl: HTMLElement): void {
  if (!gameState) return;

  const cells = boardEl.querySelectorAll<HTMLButtonElement>('.board-cell');

  cells.forEach((btn) => {
    const row = Number(btn.dataset.row);
    const col = Number(btn.dataset.col);
    const isLastMove = gameState.lastMove?.path.some((c) => c.row === row && c.col === col);
    btn.classList.toggle('last-move', !!isLastMove);
  });
}

const PIECE_OFFSETS: Record<number, { x: number; y: number }[]> = {
  2: [
    { x: -18, y: 0 },
    { x: 18, y: 0 },
  ],
  3: [
    { x: -18, y: -12 },
    { x: 18, y: -12 },
    { x: 0, y: 14 },
  ],
  4: [
    { x: -18, y: -12 },
    { x: 18, y: -12 },
    { x: -18, y: 14 },
    { x: 18, y: 14 },
  ],
};

function renderPieces(boardEl: HTMLElement): void {
  boardEl.querySelectorAll('.game-piece').forEach((el) => {
    el.remove();
  });

  if (!gameState) return;

  const piecesByCoord = new Map<string, { piece: Piece; player: PlayerState }[]>();

  for (const piece of gameState.pieces) {
    const player = gameState.players.find((p) => p.id === piece.playerId);
    if (!player) continue;

    const coord = getPieceCoordinate(piece, player);
    if (!coord) continue;

    const key = `${coord.row},${coord.col}`;
    if (!piecesByCoord.has(key)) {
      piecesByCoord.set(key, []);
    }
    const arr = piecesByCoord.get(key);
    if (arr) {
      arr.push({ piece, player });
    }
  }

  piecesByCoord.forEach((items, key) => {
    const [row, col] = key.split(',').map(Number);
    const count = items.length;

    items.forEach(({ piece, player }, index) => {
      const pieceEl = document.createElement('div');
      pieceEl.className = 'game-piece';
      pieceEl.dataset.pieceId = piece.id;

      const hasValidMove = gameState.validMoves.some((m) => m.pieceId === piece.id);
      if (hasValidMove && gameState.status === 'waiting-piece') {
        pieceEl.classList.add('highlighted');
      }

      pieceEl.style.left = `calc(${col} * 100% / ${BOARD_SIZE})`;
      pieceEl.style.top = `calc(${row} * 100% / ${BOARD_SIZE})`;

      const circle = document.createElement('div');
      circle.className = 'piece-circle';
      circle.style.backgroundColor = COLOR_VALUES[player.color];

      if (count > 1) {
        const offsets = PIECE_OFFSETS[count]?.[index] ?? { x: 0, y: 0 };
        circle.style.transform = `translate(${offsets.x}%, ${offsets.y}%) scale(0.72)`;
      }

      pieceEl.appendChild(circle);
      boardEl.appendChild(pieceEl);
    });
  });
}

function updateDicePanel(): void {
  if (!gameState) return;

  const diceEl = appRoot.querySelector<HTMLElement>('.dice-display');
  const rollBtn = appRoot.querySelector<HTMLButtonElement>('.roll-btn');
  const actionEl = appRoot.querySelector<HTMLElement>('.current-player-action');
  const nameEl = appRoot.querySelector<HTMLElement>('.current-player-name');

  if (diceEl) {
    const value = gameState.diceValue ?? 1;
    diceEl.dataset.value = String(value);
  }

  if (rollBtn) {
    rollBtn.disabled = gameState.status !== 'waiting-roll' || isRolling;
  }

  if (actionEl) {
    actionEl.textContent =
      gameState.status === 'waiting-roll'
        ? '请掷骰子'
        : gameState.status === 'waiting-piece'
          ? '请选择棋子'
          : '';
  }

  if (nameEl) {
  const currentPlayer = gameState.players.find((p) => p.id === gameState.currentPlayer);
    if (currentPlayer) {
      nameEl.textContent = COLOR_LABELS[currentPlayer.color];
      nameEl.style.color = COLOR_VALUES[currentPlayer.color];
    }
  }
}

function startGame(): void {
  gameState = createInitialState(currentSettings);
  victoryToastShown = false;
  isRolling = false;

  const isTwoPlayer = currentSettings.playerCount === 2;

  appRoot.innerHTML = `
    <main class="game-container ${isTwoPlayer ? 'two-player' : 'multi-player'}">
      ${isTwoPlayer ? getTwoPlayerLayout() : getMultiPlayerLayout()}
    </main>
  `;

  const boardEl = appRoot.querySelector<HTMLElement>('.board');
  if (!boardEl) return;

  createBoardCells(boardEl);
  boardEl.addEventListener('click', handleBoardClick);

  const rollBtn = appRoot.querySelector<HTMLButtonElement>('.roll-btn');
  if (rollBtn) {
    rollBtn.addEventListener('click', handleRollDice);
  }

  const playerBars = appRoot.querySelectorAll<HTMLElement>('.player-bar');
  playerBars.forEach((bar) => {
    bar.addEventListener('click', handlePlayerBarClick);
  });

  renderGame();
}

function renderGame(): void {
  if (!gameState) return;

  const boardEl = appRoot.querySelector<HTMLElement>('.board');
  if (boardEl) {
    updateBoard(boardEl);
    renderPieces(boardEl);
  }

  const isTwoPlayer = gameState.settings.playerCount === 2;
  if (isTwoPlayer) {
    const bars = appRoot.querySelectorAll<HTMLElement>('.player-bar');
    bars.forEach((bar) => {
      const pid = Number(bar.dataset.playerId) as PlayerId;
      const newHTML = getPlayerBarHTML(pid, 'full');
      const temp = document.createElement('div');
      temp.innerHTML = newHTML;
      const fresh = temp.firstElementChild as HTMLElement;
      if (fresh) {
        bar.className = fresh.className;
        bar.innerHTML = fresh.innerHTML;
        bar.dataset.playerId = String(pid);
      }
    });
  } else {
    const row = appRoot.querySelector<HTMLElement>('.player-bars-row');
    if (row) {
      row.innerHTML = gameState.players.map((p) => getPlayerBarHTML(p.id, 'compact')).join('');
      row.querySelectorAll<HTMLElement>('.player-bar').forEach((bar) => {
        bar.addEventListener('click', handlePlayerBarClick);
      });
    }
  }

  updateDicePanel();

  const boardAreaEl = appRoot.querySelector<HTMLElement>('.board-area');
  if (boardAreaEl && gameState.status === 'finished' && !victoryToastShown) {
    showVictoryToast(boardAreaEl);
    victoryToastShown = true;
  }
}

function handleRollDice(): void {
  if (!gameState || gameState.status !== 'waiting-roll' || isRolling) return;

  isRolling = true;

  const diceEl = appRoot.querySelector<HTMLElement>('.dice-display');
  const rollBtn = appRoot.querySelector<HTMLButtonElement>('.roll-btn');
  if (rollBtn) rollBtn.disabled = true;

  let count = 0;
  const max = 10;
  const interval = window.setInterval(() => {
    if (diceEl) {
      diceEl.dataset.value = String(Math.floor(Math.random() * 6) + 1);
    }
    count++;
    if (count >= max) {
      window.clearInterval(interval);
      const roll = rollDice();
      if (diceEl) diceEl.dataset.value = String(roll);
      const state = gameState;
      if (state) {
        gameState = applyDiceRoll(state, roll);
      }
      isRolling = false;
      renderGame();
    }
  }, 50);
}

function handleBoardClick(e: Event): void {
  if (!gameState || gameState.status !== 'waiting-piece') return;

  const target = e.target as HTMLElement;
  const pieceEl = target.closest<HTMLElement>('.game-piece');
  if (!pieceEl) return;

  const pieceId = pieceEl.dataset.pieceId;
  if (!pieceId) return;

  const move = gameState.validMoves.find((m) => m.pieceId === pieceId);
  if (!move) return;

  gameState = selectMove(gameState, move);
  renderGame();
}

function handlePlayerBarClick(e: Event): void {
  const target = e.target as HTMLElement;
  const action = target.dataset.action;
  if (!action) return;

  switch (action) {
    case 'reset':
      showConfirmationDialog('确定要重新开始吗？', () => {
        if (!gameState) return;
        gameState = createInitialState(currentSettings);
        victoryToastShown = false;
        isRolling = false;
        startGame();
      });
      break;
    case 'settings':
      showConfirmationDialog('确定要返回首页吗？', () => {
        renderSettingsPage();
      });
      break;
  }
}

function showVictoryToast(boardAreaEl: HTMLElement): void {
  boardAreaEl.querySelector('.victory-toast')?.remove();

  if (!gameState || !gameState.winner) return;

  const winnerId = gameState.winner;
  const winner = winnerId ? gameState.players.find((p) => p.id === winnerId) : undefined;
  if (!winner) return;

  const toast = document.createElement('div');
  toast.className = `victory-toast ${winner.color}-win`;
  toast.textContent = `${COLOR_LABELS[winner.color]}胜利!`;

  boardAreaEl.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 3000);
}

function showConfirmationDialog(message: string, onConfirm: () => void): void {
  const dialog = document.createElement('dialog');
  dialog.className = 'confirm-dialog';

  dialog.innerHTML = `
    <div class="confirm-content">
      <p class="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button class="confirm-btn cancel">取消</button>
        <button class="confirm-btn ok">确定</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  const cancelBtn = dialog.querySelector<HTMLButtonElement>('.cancel');
  const okBtn = dialog.querySelector<HTMLButtonElement>('.ok');

  if (!cancelBtn || !okBtn) {
    dialog.remove();
    return;
  }

  cancelBtn.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
  });

  okBtn.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
    onConfirm();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
      dialog.remove();
    }
  });
}

renderSettingsPage();
