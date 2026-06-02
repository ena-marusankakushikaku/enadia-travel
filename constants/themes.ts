import type { ConquestThemeCategory } from '@/types/app';

export type DefaultConquestTheme = {
  name: string;
  emoji: string;
  category: ConquestThemeCategory;
};

export const DEFAULT_CONQUEST_THEMES: DefaultConquestTheme[] = [
  { name: '地酒', emoji: '🍶', category: 'drink' },
  { name: 'ラーメン', emoji: '🍜', category: 'food' },
  { name: '温泉', emoji: '♨️', category: 'nature' },
  { name: '城', emoji: '🏯', category: 'culture' },
  { name: 'カフェ', emoji: '☕', category: 'food' },
  { name: '神社仏閣', emoji: '⛩️', category: 'culture' },
  { name: 'スイーツ', emoji: '🍰', category: 'food' },
  { name: '絶景', emoji: '🗻', category: 'nature' },
  { name: '釣りスポット', emoji: '🎣', category: 'activity' },
  { name: 'ペット旅', emoji: '🐶', category: 'activity' },
  { name: 'カスタム', emoji: '🎯', category: 'custom' }
];
