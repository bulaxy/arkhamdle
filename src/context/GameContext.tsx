import localforage from "localforage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { PACK_STRUCTURE } from "../data/packStructure";
import {
  fetchCards,
  transformCards,
  transformInvestigators,
} from "../services/ArkhamDbService";
import type {
  AppSettings,
  TransformedCard,
  TransformedInvestigator,
} from "../types";

interface GameContextType {
  cards: TransformedCard[];
  packs: string[];
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  isLoading: boolean;
  loadingMessage: string;
  refreshData: () => Promise<void>;
  filteredCards: TransformedCard[];
  investigators: TransformedInvestigator[];
  filteredInvestigators: TransformedInvestigator[];
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cards, setCards] = useState<TransformedCard[]>([]);
  const [investigators, setInvestigators] = useState<TransformedInvestigator[]>(
    [],
  );
  const [packs, setPacks] = useState<string[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    filteredPacks: [],
    picGuesserDifficulty: "Hard",
    storyGuesserScrambleWords: true,
    storyGuesserScrambleLetters: false,
    storyGuesserSliceScale: 0.5,
    storyGuesserHideName: true,
    includeWeakness: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  const setSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    localforage.setItem("arkhamdle_settings", newSettings);
  };

  const loadData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      setLoadingMessage(
        "Loading cards data (This may take a moment for the first time, ~3MB)...",
      );
      const cardsData = await fetchCards(forceRefresh);

      setLoadingMessage("Processing cards...");
      const transformed = transformCards(cardsData);
      setCards(transformed);

      const transformedInvestigators = transformInvestigators(cardsData);
      setInvestigators(transformedInvestigators);

      // Build pack groups list from structure + detect "other"
      const groupNames = Object.keys(PACK_STRUCTURE);
      const allCards = [...transformed, ...transformedInvestigators];
      const hasOther = allCards.some((c) => c.pack_name === "other");
      setPacks(hasOther ? [...groupNames, "other"] : groupNames);
    } catch (error) {
      console.error("Failed to load ArkhamDB data", error);
      setLoadingMessage(
        "Error loading data. Please try again or check your connection.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const savedSettings =
        await localforage.getItem<AppSettings>("arkhamdle_settings");
      if (savedSettings) {
        setSettingsState({
          ...savedSettings,
          picGuesserDifficulty: savedSettings.picGuesserDifficulty || "Hard",
          storyGuesserScrambleWords:
            savedSettings.storyGuesserScrambleWords ?? true,
          storyGuesserScrambleLetters:
            savedSettings.storyGuesserScrambleLetters ?? false,
          storyGuesserSliceScale: savedSettings.storyGuesserSliceScale ?? 0.5,
          storyGuesserHideName: savedSettings.storyGuesserHideName ?? true,
          includeWeakness: savedSettings.includeWeakness ?? false,
        });
      }
      await loadData();
    };
    init();
  }, []);

  // Compute filtered cards based on settings — now filtering by pack group name and weakness
  const filteredCards = cards.filter((card) => {
    const passPack =
      settings.filteredPacks.length === 0 ||
      !settings.filteredPacks.includes(card.pack_name);
    const isWeakness =
      card.subtype_code === "basicweakness" || card.subtype_code === "weakness";
    const passWeakness = settings.includeWeakness || !isWeakness;
    return passPack && passWeakness;
  });

  const filteredInvestigators = investigators.filter((inv) => {
    const passPack =
      settings.filteredPacks.length === 0 ||
      !settings.filteredPacks.includes(inv.pack_name);
    const isWeakness =
      inv.subtype_code === "basicweakness" || inv.subtype_code === "weakness";
    const passWeakness = settings.includeWeakness || !isWeakness;
    return passPack && passWeakness;
  });

  return (
    <GameContext.Provider
      value={{
        cards,
        packs,
        settings,
        setSettings,
        isLoading,
        loadingMessage,
        refreshData: () => loadData(true),
        filteredCards,
        investigators,
        filteredInvestigators,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
