import type {
  CollisionRule,
  ConsecutiveRolls,
  DirectionMode,
  FinishRule,
  GameSettings,
  PlayerColor,
  PlayerCount,
  TakeoffCondition,
} from './settings.ts';
import { canTakeOff, getActivePlayers, getPiecesToWin } from './settings.ts';

export type PlayerId = 1 | 2 | 3 | 4;

export type GameStatus = 'waiting-roll' | 'waiting-piece' | 'animating' | 'finished';

export type PieceLocation =
  | { kind: 'base' }
  | { kind: 'track'; progress: number }
  | { kind: 'finish-lane'; step: number }
  | { kind: 'home' };

export interface Piece {
  id: string;
  playerId: PlayerId;
  location: PieceLocation;
}

export interface BoardCoordinate {
  row: number;
  col: number;
}

export interface MoveOption {
  pieceId: string;
  from: PieceLocation;
  to: PieceLocation;
  path: BoardCoordinate[];
  capturedPieceIds: string[];
}

export interface PlayerState {
  id: PlayerId;
  color: PlayerColor;
  direction: 1 | -1;
  startTrackIndex: number;
  finishEntryIndex: number;
}

export interface GameHistoryEntry {
  pieces: Piece[];
  currentPlayer: PlayerId;
  diceValue: number | null;
  status: GameStatus;
  winner: PlayerId | null;
  turnNumber: number;
  consecutiveSixes: number;
}

export interface GameState {
  settings: GameSettings;
  players: PlayerState[];
  pieces: Piece[];
  currentPlayer: PlayerId;
  status: GameStatus;
  diceValue: number | null;
  validMoves: MoveOption[];
  winner: PlayerId | null;
  turnNumber: number;
  consecutiveSixes: number;
  lastMove: MoveOption | null;
  history: GameHistoryEntry[];
}

export const BOARD_SIZE = 15;
export const COMMON_TRACK_LENGTH = 52;
export const FINISH_LANE_LENGTH = 6;
export const PIECES_PER_PLAYER = 4;

export const COMMON_TRACK_COORDS: BoardCoordinate[] = [
  { row: 13, col: 6 },
  { row: 12, col: 6 },
  { row: 11, col: 6 },
  { row: 10, col: 6 },
  { row: 9, col: 6 },
  { row: 8, col: 5 },
  { row: 8, col: 4 },
  { row: 8, col: 3 },
  { row: 8, col: 2 },
  { row: 8, col: 1 },
  { row: 8, col: 0 },
  { row: 7, col: 0 },
  { row: 6, col: 0 },
  { row: 6, col: 1 },
  { row: 6, col: 2 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
  { row: 6, col: 5 },
  { row: 5, col: 6 },
  { row: 4, col: 6 },
  { row: 3, col: 6 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  { row: 0, col: 7 },
  { row: 0, col: 8 },
  { row: 1, col: 8 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
  { row: 4, col: 8 },
  { row: 5, col: 8 },
  { row: 6, col: 9 },
  { row: 6, col: 10 },
  { row: 6, col: 11 },
  { row: 6, col: 12 },
  { row: 6, col: 13 },
  { row: 6, col: 14 },
  { row: 7, col: 14 },
  { row: 8, col: 14 },
  { row: 8, col: 13 },
  { row: 8, col: 12 },
  { row: 8, col: 11 },
  { row: 8, col: 10 },
  { row: 8, col: 9 },
  { row: 9, col: 8 },
  { row: 10, col: 8 },
  { row: 11, col: 8 },
  { row: 12, col: 8 },
  { row: 13, col: 8 },
  { row: 14, col: 8 },
  { row: 14, col: 7 },
  { row: 14, col: 6 },
];

export const FINISH_LANE_COORDS: Record<PlayerColor, BoardCoordinate[]> = {
  red: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
    { row: 8, col: 7 },
  ],
  yellow: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 },
  ],
  blue: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
    { row: 6, col: 7 },
  ],
  green: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
    { row: 7, col: 8 },
  ],
};

export const BASE_COORDS: Record<PlayerColor, BoardCoordinate[]> = {
  red: [
    { row: 10, col: 1 },
    { row: 10, col: 3 },
    { row: 12, col: 1 },
    { row: 12, col: 3 },
  ],
  yellow: [
    { row: 1, col: 1 },
    { row: 1, col: 3 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
  ],
  blue: [
    { row: 1, col: 11 },
    { row: 1, col: 13 },
    { row: 3, col: 11 },
    { row: 3, col: 13 },
  ],
  green: [
    { row: 10, col: 11 },
    { row: 10, col: 13 },
    { row: 12, col: 11 },
    { row: 12, col: 13 },
  ],
};

export const SAFE_TRACK_INDICES: Set<number> = new Set([0, 13, 26, 39]);

const PLAYER_IDS: readonly PlayerId[] = [1, 2, 3, 4];

const START_TRACK_INDICES: Record<PlayerColor, number> = {
  red: 0,
  yellow: 13,
  blue: 26,
  green: 39,
};

const CLOCKWISE_FINISH_ENTRY_INDICES: Record<PlayerColor, number> = {
  red: 50,
  yellow: 11,
  blue: 24,
  green: 37,
};

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function createInitialState(settings: GameSettings): GameState {
  const players = createPlayers(settings.playerCount, settings.directionMode);
  const pieces = players.flatMap((player) => createPlayerPieces(player));

  return {
    settings,
    players,
    pieces,
    currentPlayer: players[0].id,
    status: 'waiting-roll',
    diceValue: null,
    validMoves: [],
    winner: null,
    turnNumber: 1,
    consecutiveSixes: 0,
    lastMove: null,
    history: [],
  };
}

export function applyDiceRoll(state: GameState, roll: number): GameState {
  if (state.status !== 'waiting-roll' || state.winner !== null || !isValidDiceRoll(roll)) {
    return state;
  }

  const consecutiveSixes = roll === 6 ? state.consecutiveSixes + 1 : 0;
  const rolledState: GameState = {
    ...state,
    diceValue: roll,
    consecutiveSixes,
  };
  const validMoves = getValidMoves(rolledState, roll);

  if (validMoves.length > 0) {
    return {
      ...rolledState,
      status: 'waiting-piece',
      validMoves,
    };
  }

  const currentPlayer = shouldRollAgain(roll, state.settings.consecutiveRolls)
    ? state.currentPlayer
    : getNextActivePlayerId(state, state.currentPlayer);

  return {
    ...rolledState,
    currentPlayer,
    status: 'waiting-roll',
    diceValue: null,
    validMoves: [],
    turnNumber: state.turnNumber + 1,
    consecutiveSixes: currentPlayer === state.currentPlayer ? consecutiveSixes : 0,
  };
}

export function selectMove(state: GameState, move: MoveOption): GameState {
  if (state.status !== 'waiting-piece' || state.diceValue === null || state.winner !== null) {
    return state;
  }

  const selectedMove = state.validMoves.find((validMove) => isSameMove(validMove, move));

  if (!selectedMove) {
    return state;
  }

  const historyEntry = createHistoryEntry(state);
  const capturedPieceIds = new Set(selectedMove.capturedPieceIds);
  const pieces = state.pieces.map((piece) => {
    if (capturedPieceIds.has(piece.id)) {
      return { ...piece, location: { kind: 'base' } as PieceLocation };
    }

    if (piece.id === selectedMove.pieceId) {
      return { ...piece, location: cloneLocation(selectedMove.to) };
    }

    return { ...piece, location: cloneLocation(piece.location) };
  });
  const winner = getWinnerAfterMove(pieces, state.currentPlayer, state.settings.finishRule);
  const nextPlayer = winner
    ? state.currentPlayer
    : getNextPlayerAfterMove(state, state.currentPlayer, state.diceValue);
  const keepsTurn = nextPlayer === state.currentPlayer && winner === null;

  return {
    ...state,
    pieces,
    currentPlayer: nextPlayer,
    status: winner ? 'finished' : 'waiting-roll',
    diceValue: null,
    validMoves: [],
    winner,
    turnNumber: state.turnNumber + 1,
    consecutiveSixes: keepsTurn ? state.consecutiveSixes : 0,
    lastMove: cloneMove(selectedMove),
    history: [...state.history, historyEntry],
  };
}

export function getValidMoves(state: GameState, roll: number): MoveOption[] {
  if (state.winner !== null || !isValidDiceRoll(roll)) {
    return [];
  }

  const player = getPlayer(state, state.currentPlayer);

  if (!player) {
    return [];
  }

  return state.pieces
    .filter((piece) => piece.playerId === player.id)
    .map((piece) => createMoveOption(state, player, piece, roll))
    .filter((move): move is MoveOption => move !== null);
}

export function getPieceCoordinate(piece: Piece, player: PlayerState): BoardCoordinate | null {
  switch (piece.location.kind) {
    case 'base':
      return getBaseCoordinate(piece, player);
    case 'track':
      return COMMON_TRACK_COORDS[normalizeTrackIndex(piece.location.progress)] ?? null;
    case 'finish-lane':
      return FINISH_LANE_COORDS[player.color][piece.location.step] ?? null;
    case 'home':
      return null;
  }
}

export function isSafeSquare(trackIndex: number, playerColor: PlayerColor): boolean {
  const startIndex = START_TRACK_INDICES[playerColor];
  const safeIndices = new Set<number>(SAFE_TRACK_INDICES);

  for (let offset = 0; offset < 4; offset++) {
    safeIndices.add(normalizeTrackIndex(startIndex + offset));
  }

  return safeIndices.has(normalizeTrackIndex(trackIndex));
}

function createPlayers(playerCount: PlayerCount, directionMode: DirectionMode): PlayerState[] {
  return getActivePlayers(playerCount).map((color, index) => {
    const direction = getPlayerDirection(index, directionMode);
    const startTrackIndex = START_TRACK_INDICES[color];

    return {
      id: PLAYER_IDS[index],
      color,
      direction,
      startTrackIndex,
      finishEntryIndex: getFinishEntryIndex(color, direction),
    };
  });
}

function createPlayerPieces(player: PlayerState): Piece[] {
  return Array.from({ length: PIECES_PER_PLAYER }, (_, index) => ({
    id: `${player.color}-${index + 1}`,
    playerId: player.id,
    location: { kind: 'base' },
  }));
}

function getPlayerDirection(index: number, directionMode: DirectionMode): 1 | -1 {
  if (directionMode === 'same-direction') {
    return 1;
  }

  return index % 2 === 0 ? 1 : -1;
}

function getFinishEntryIndex(playerColor: PlayerColor, direction: 1 | -1): number {
  if (direction === 1) {
    return CLOCKWISE_FINISH_ENTRY_INDICES[playerColor];
  }

  return normalizeTrackIndex(START_TRACK_INDICES[playerColor] - direction * 2);
}

function createMoveOption(
  state: GameState,
  player: PlayerState,
  piece: Piece,
  roll: number
): MoveOption | null {
  const move = calculateMove(
    player,
    piece.location,
    roll,
    state.settings.takeoffCondition,
    state.settings.finishRule
  );

  if (!move) {
    return null;
  }

  return {
    pieceId: piece.id,
    from: cloneLocation(piece.location),
    to: cloneLocation(move.to),
    path: clonePath(move.path),
    capturedPieceIds: getCapturedPieceIds(state, player, piece, move.to, state.settings.collisionRule),
  };
}

function calculateMove(
  player: PlayerState,
  location: PieceLocation,
  roll: number,
  takeoffCondition: TakeoffCondition,
  finishRule: FinishRule
): { to: PieceLocation; path: BoardCoordinate[] } | null {
  switch (location.kind) {
    case 'base':
      return calculateTakeoffMove(player, roll, takeoffCondition);
    case 'track':
      return calculateTrackMove(player, location.progress, roll, finishRule);
    case 'finish-lane':
      return calculateFinishLaneMove(player, location.step, roll, finishRule);
    case 'home':
      return null;
  }
}

function calculateTakeoffMove(
  player: PlayerState,
  roll: number,
  takeoffCondition: TakeoffCondition
): { to: PieceLocation; path: BoardCoordinate[] } | null {
  if (!canTakeOffByCondition(roll, takeoffCondition)) {
    return null;
  }

  const progress = player.startTrackIndex;

  return {
    to: { kind: 'track', progress },
    path: [COMMON_TRACK_COORDS[progress]],
  };
}

function calculateTrackMove(
  player: PlayerState,
  progress: number,
  roll: number,
  finishRule: FinishRule
): { to: PieceLocation; path: BoardCoordinate[] } | null {
  const normalizedProgress = normalizeTrackIndex(progress);
  const stepsToEntry = getStepsBetweenTrackIndices(
    normalizedProgress,
    player.finishEntryIndex,
    player.direction
  );

  if (roll <= stepsToEntry) {
    const toProgress = normalizeTrackIndex(normalizedProgress + player.direction * roll);

    return {
      to: { kind: 'track', progress: toProgress },
      path: getTrackPath(normalizedProgress, roll, player.direction),
    };
  }

  const trackPath = getTrackPath(normalizedProgress, stepsToEntry, player.direction);
  const finishMove = moveAlongFinishLane(player, -1, roll - stepsToEntry, finishRule);

  if (!finishMove) {
    return null;
  }

  return {
    to: finishMove.to,
    path: [...trackPath, ...finishMove.path],
  };
}

function calculateFinishLaneMove(
  player: PlayerState,
  step: number,
  roll: number,
  finishRule: FinishRule
): { to: PieceLocation; path: BoardCoordinate[] } | null {
  if (step < 0 || step >= FINISH_LANE_LENGTH) {
    return null;
  }

  return moveAlongFinishLane(player, step, roll, finishRule);
}

function moveAlongFinishLane(
  player: PlayerState,
  startPosition: number,
  steps: number,
  finishRule: FinishRule
): { to: PieceLocation; path: BoardCoordinate[] } | null {
  const distanceToHome = FINISH_LANE_LENGTH - startPosition;

  if (steps > distanceToHome && isExactLandingRule(finishRule)) {
    return null;
  }

  if (finishRule === 'direct-enter' && steps >= distanceToHome) {
    return {
      to: { kind: 'home' },
      path: getDirectFinishPath(player, startPosition),
    };
  }

  if (finishRule === 'overshoot-bounce') {
    return getBouncedFinishMove(player, startPosition, steps);
  }

  return getExactFinishMove(player, startPosition, steps);
}

function getExactFinishMove(
  player: PlayerState,
  startPosition: number,
  steps: number
): { to: PieceLocation; path: BoardCoordinate[] } {
  const finalPosition = startPosition + steps;

  if (finalPosition === FINISH_LANE_LENGTH) {
    return {
      to: { kind: 'home' },
      path: getForwardFinishPath(player, startPosition, FINISH_LANE_LENGTH - 1),
    };
  }

  return {
    to: { kind: 'finish-lane', step: finalPosition },
    path: getForwardFinishPath(player, startPosition, finalPosition),
  };
}

function getBouncedFinishMove(
  player: PlayerState,
  startPosition: number,
  steps: number
): { to: PieceLocation; path: BoardCoordinate[] } {
  let position = startPosition;
  let direction: 1 | -1 = 1;
  const path: BoardCoordinate[] = [];

  for (let step = 0; step < steps; step++) {
    position += direction;

    if (position === FINISH_LANE_LENGTH) {
      if (step === steps - 1) {
        return { to: { kind: 'home' }, path };
      }

      direction = -1;
      continue;
    }

    if (position >= 0 && position < FINISH_LANE_LENGTH) {
      path.push(FINISH_LANE_COORDS[player.color][position]);
    }
  }

  return {
    to: { kind: 'finish-lane', step: position },
    path,
  };
}

function getDirectFinishPath(player: PlayerState, startPosition: number): BoardCoordinate[] {
  return getForwardFinishPath(player, startPosition, FINISH_LANE_LENGTH - 1);
}

function getForwardFinishPath(
  player: PlayerState,
  startPosition: number,
  endPosition: number
): BoardCoordinate[] {
  const path: BoardCoordinate[] = [];

  for (let position = startPosition + 1; position <= endPosition; position++) {
    if (position >= 0 && position < FINISH_LANE_LENGTH) {
      path.push(FINISH_LANE_COORDS[player.color][position]);
    }
  }

  return path;
}

function getCapturedPieceIds(
  state: GameState,
  player: PlayerState,
  movingPiece: Piece,
  landing: PieceLocation,
  collisionRule: CollisionRule
): string[] {
  if (landing.kind !== 'track' || collisionRule === 'no-collision') {
    return [];
  }

  const landingTrackIndex = normalizeTrackIndex(landing.progress);

  if (isSafeForAnyPlayer(landingTrackIndex)) {
    return [];
  }

  const enemyPieceIds = state.pieces
    .filter(
      (piece) =>
        piece.playerId !== player.id &&
        piece.location.kind === 'track' &&
        normalizeTrackIndex(piece.location.progress) === landingTrackIndex
    )
    .map((piece) => piece.id);

  if (enemyPieceIds.length === 0) {
    return [];
  }

  switch (collisionRule) {
    case 'classic':
      return enemyPieceIds;
    case 'stack-counter':
      return enemyPieceIds.length >= 2 ? [...enemyPieceIds, movingPiece.id] : [];
    case 'reverse-collision':
      return [movingPiece.id];
    case 'collision-with-stack':
      return enemyPieceIds.length >= 2 ? [...enemyPieceIds, movingPiece.id] : enemyPieceIds;
  }
}

function getWinnerAfterMove(
  pieces: Piece[],
  playerId: PlayerId,
  finishRule: FinishRule
): PlayerId | null {
  const homePieces = pieces.filter(
    (piece) => piece.playerId === playerId && piece.location.kind === 'home'
  ).length;

  return homePieces >= getPiecesToWin(finishRule) ? playerId : null;
}

function getNextPlayerAfterMove(state: GameState, playerId: PlayerId, roll: number): PlayerId {
  if (shouldRollAgain(roll, state.settings.consecutiveRolls)) {
    return playerId;
  }

  return getNextActivePlayerId(state, playerId);
}

function getNextActivePlayerId(state: GameState, playerId: PlayerId): PlayerId {
  const currentIndex = state.players.findIndex((player) => player.id === playerId);

  if (currentIndex === -1) {
    return state.players[0].id;
  }

  for (let offset = 1; offset <= state.players.length; offset++) {
    const player = state.players[(currentIndex + offset) % state.players.length];

    if (hasPiecesOutsideHome(state.pieces, player.id)) {
      return player.id;
    }
  }

  return playerId;
}

function shouldRollAgain(roll: number, consecutiveRolls: ConsecutiveRolls): boolean {
  return consecutiveRolls === 'enabled' && roll === 6;
}

function canTakeOffByCondition(roll: number, takeoffCondition: TakeoffCondition): boolean {
  return canTakeOff(roll, takeoffCondition);
}

function hasPiecesOutsideHome(pieces: Piece[], playerId: PlayerId): boolean {
  return pieces.some((piece) => piece.playerId === playerId && piece.location.kind !== 'home');
}

function getPlayer(state: GameState, playerId: PlayerId): PlayerState | undefined {
  return state.players.find((player) => player.id === playerId);
}

function getBaseCoordinate(piece: Piece, player: PlayerState): BoardCoordinate | null {
  const pieceIndex = getPlayerPieceIndex(piece.id);

  return BASE_COORDS[player.color][pieceIndex] ?? BASE_COORDS[player.color][0] ?? null;
}

function getPlayerPieceIndex(pieceId: string): number {
  const index = Number(pieceId.split('-').at(-1));

  return Number.isInteger(index) && index > 0 ? index - 1 : 0;
}

function getStepsBetweenTrackIndices(from: number, to: number, direction: 1 | -1): number {
  if (direction === 1) {
    return normalizeTrackIndex(to - from);
  }

  return normalizeTrackIndex(from - to);
}

function getTrackPath(from: number, steps: number, direction: 1 | -1): BoardCoordinate[] {
  return Array.from({ length: steps }, (_, index) => {
    const progress = normalizeTrackIndex(from + direction * (index + 1));

    return COMMON_TRACK_COORDS[progress];
  });
}

function normalizeTrackIndex(index: number): number {
  return ((index % COMMON_TRACK_LENGTH) + COMMON_TRACK_LENGTH) % COMMON_TRACK_LENGTH;
}

function isExactLandingRule(finishRule: FinishRule): boolean {
  return finishRule === 'exact-landing' || finishRule === 'partial-victory';
}

function isSafeForAnyPlayer(trackIndex: number): boolean {
  return Object.keys(START_TRACK_INDICES).some((color) =>
    isSafeSquare(trackIndex, color as PlayerColor)
  );
}

function isValidDiceRoll(roll: number): boolean {
  return Number.isInteger(roll) && roll >= 1 && roll <= 6;
}

function isSameMove(left: MoveOption, right: MoveOption): boolean {
  return (
    left.pieceId === right.pieceId &&
    isSameLocation(left.from, right.from) &&
    isSameLocation(left.to, right.to) &&
    hasSameCapturedPieces(left.capturedPieceIds, right.capturedPieceIds)
  );
}

function isSameLocation(left: PieceLocation, right: PieceLocation): boolean {
  if (left.kind !== right.kind) {
    return false;
  }

  switch (left.kind) {
    case 'base':
    case 'home':
      return true;
    case 'track':
      return right.kind === 'track' && left.progress === right.progress;
    case 'finish-lane':
      return right.kind === 'finish-lane' && left.step === right.step;
  }
}

function hasSameCapturedPieces(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightPieces = new Set(right);

  return left.every((pieceId) => rightPieces.has(pieceId));
}

function createHistoryEntry(state: GameState): GameHistoryEntry {
  return {
    pieces: clonePieces(state.pieces),
    currentPlayer: state.currentPlayer,
    diceValue: state.diceValue,
    status: state.status,
    winner: state.winner,
    turnNumber: state.turnNumber,
    consecutiveSixes: state.consecutiveSixes,
  };
}

function clonePieces(pieces: Piece[]): Piece[] {
  return pieces.map((piece) => ({
    ...piece,
    location: cloneLocation(piece.location),
  }));
}

function cloneMove(move: MoveOption): MoveOption {
  return {
    pieceId: move.pieceId,
    from: cloneLocation(move.from),
    to: cloneLocation(move.to),
    path: clonePath(move.path),
    capturedPieceIds: [...move.capturedPieceIds],
  };
}

function cloneLocation(location: PieceLocation): PieceLocation {
  switch (location.kind) {
    case 'base':
      return { kind: 'base' };
    case 'track':
      return { kind: 'track', progress: location.progress };
    case 'finish-lane':
      return { kind: 'finish-lane', step: location.step };
    case 'home':
      return { kind: 'home' };
  }
}

function clonePath(path: BoardCoordinate[]): BoardCoordinate[] {
  return path.map((coordinate) => ({ ...coordinate }));
}
