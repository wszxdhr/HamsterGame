export type DirectionMode = 'same-direction' | 'face-to-face';
export type PlayerCount = 2 | 3 | 4;
export type TakeoffCondition = 'six-only' | 'five-or-six' | 'even-number';
export type ConsecutiveRolls = 'enabled' | 'disabled';

export type CollisionRule =
  | 'classic' // enemy returns to base on non-safe square
  | 'stack-counter' // both return on stack collision
  | 'no-collision' // all squares safe
  | 'reverse-collision' // victim sends attacker back
  | 'collision-with-stack'; // classic + stack-counter combined

export type FinishRule =
  | 'exact-landing' // must roll exact number
  | 'overshoot-bounce' // bounce back from overshoot
  | 'direct-enter' // any overshoot counts
  | 'partial-victory'; // 2 pieces home wins

export type PlayerColor = 'red' | 'yellow' | 'blue' | 'green';

export interface GameSettings {
  directionMode: DirectionMode;
  playerCount: PlayerCount;
  takeoffCondition: TakeoffCondition;
  consecutiveRolls: ConsecutiveRolls;
  collisionRule: CollisionRule;
  finishRule: FinishRule;
}

export const DEFAULT_SETTINGS: GameSettings = {
  directionMode: 'same-direction',
  playerCount: 2,
  takeoffCondition: 'six-only',
  consecutiveRolls: 'enabled',
  collisionRule: 'classic',
  finishRule: 'exact-landing',
};

export const PLAYER_COLORS: readonly PlayerColor[] = [
  'red',
  'yellow',
  'blue',
  'green',
] as const;

export const COLOR_LABELS: Record<PlayerColor, string> = {
  red: '红方',
  yellow: '黄方',
  blue: '蓝方',
  green: '绿方',
};

export const COLOR_VALUES: Record<PlayerColor, string> = {
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
};

export function getActivePlayers(count: PlayerCount): PlayerColor[] {
  switch (count) {
    case 2:
      return ['red', 'blue'];
    case 3:
      return ['red', 'yellow', 'blue'];
    case 4:
      return [...PLAYER_COLORS];
  }
}

export const SETTING_LABELS = {
  directionMode: {
    label: '对局方向',
    options: [
      { value: 'same-direction' as const, label: '同向' },
      { value: 'face-to-face' as const, label: '对向' },
    ],
  },
  playerCount: {
    label: '玩家数量',
    options: [
      { value: '2' as const, label: '2人' },
      { value: '3' as const, label: '3人' },
      { value: '4' as const, label: '4人' },
    ],
  },
  takeoffCondition: {
    label: '起飞条件',
    options: [
      { value: 'six-only' as const, label: '6才能起飞' },
      { value: 'five-or-six' as const, label: '5或6起飞' },
      { value: 'even-number' as const, label: '偶数起飞' },
    ],
  },
  consecutiveRolls: {
    label: '连投',
    options: [
      { value: 'enabled' as const, label: '是' },
      { value: 'disabled' as const, label: '否' },
    ],
  },
  collisionRule: {
    label: '撞子规则',
    options: [
      { value: 'classic' as const, label: '经典撞子' },
      { value: 'stack-counter' as const, label: '叠子对抗' },
      { value: 'no-collision' as const, label: '无撞子' },
      { value: 'reverse-collision' as const, label: '反向撞子' },
      { value: 'collision-with-stack' as const, label: '撞子+叠子' },
    ],
  },
  finishRule: {
    label: '终点规则',
    options: [
      { value: 'exact-landing' as const, label: '精确着陆' },
      { value: 'overshoot-bounce' as const, label: '超步折返' },
      { value: 'direct-enter' as const, label: '超步直接进' },
      { value: 'partial-victory' as const, label: '部分胜利' },
    ],
  },
} as const;

export function canTakeOff(roll: number, condition: TakeoffCondition): boolean {
  switch (condition) {
    case 'six-only':
      return roll === 6;
    case 'five-or-six':
      return roll === 5 || roll === 6;
    case 'even-number':
      return roll % 2 === 0;
  }
}

export function getPiecesToWin(finishRule: FinishRule): number {
  return finishRule === 'partial-victory' ? 2 : 4;
}
