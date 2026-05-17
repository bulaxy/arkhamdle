import { createContext } from 'react';
import type { TransformedCard, AppSettings } from '../types';

export interface GameContextType {
  cards: TransformedCard[];
  packs: string[];
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  isLoading: boolean;
  loadingMessage: string;
  refreshData: (includeEncounter?: boolean) => Promise<void>;
  filteredCards: TransformedCard[];
  seedVersion: number;
  applySeed: (seed: string) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);
