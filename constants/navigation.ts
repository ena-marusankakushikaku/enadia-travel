import { Camera, Map, Plus, ScrollText, UserRound } from 'lucide-react';
import type { NavItem } from '@/types/app';

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: '/trips', label: '旅', icon: Camera },
  { href: '/conquest', label: '制覇', icon: Map },
  { href: '/trips/new', label: '追加', icon: Plus, isPrimary: true },
  { href: '/travel-log', label: 'ログ', icon: ScrollText },
  { href: '/profile', label: 'マイ', icon: UserRound }
];
