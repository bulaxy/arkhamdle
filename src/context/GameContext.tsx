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
import { TypeCode as TypeCodeEnum } from "../types/arkham";

interface GameContextType {
  cards: TransformedCard[];
  packs: string[];
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  isLoading: boolean;
  loadingMessage: string;
  refreshData: (includeEncounter?: boolean) => Promise<void>;
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
    includeSignatures: true,
    flavourGuesserTypeFilters: {
      [TypeCodeEnum.ASSET]: true,
      [TypeCodeEnum.EVENT]: true,
      [TypeCodeEnum.SKILL]: true,
      [TypeCodeEnum.ENEMY]: true,
      [TypeCodeEnum.TREACHERY]: true,
      [TypeCodeEnum.LOCATION]: true,
      [TypeCodeEnum.STORY]: true,
      [TypeCodeEnum.INVESTIGATOR]: true,
    },
    traitGuesserTypeFilters: {
      [TypeCodeEnum.ASSET]: true,
      [TypeCodeEnum.EVENT]: true,
      [TypeCodeEnum.SKILL]: true,
      [TypeCodeEnum.ENEMY]: false,
      [TypeCodeEnum.TREACHERY]: false,
      [TypeCodeEnum.LOCATION]: false,
      [TypeCodeEnum.STORY]: false,
      [TypeCodeEnum.INVESTIGATOR]: true,
    },
    picGuesserTypeFilters: {
      [TypeCodeEnum.ASSET]: true,
      [TypeCodeEnum.EVENT]: true,
      [TypeCodeEnum.SKILL]: true,
      [TypeCodeEnum.ENEMY]: false,
      [TypeCodeEnum.TREACHERY]: false,
      [TypeCodeEnum.LOCATION]: false,
      [TypeCodeEnum.STORY]: false,
      [TypeCodeEnum.INVESTIGATOR]: false,
    },
    traitGuesserMinCards: 3,
    traitGuesserMaxCards: 0,
    traitGuesserRequirementType: "Fixed Number",
    traitGuesserRequirementValue: 3,
    includeEncounter: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  const setSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    localforage.setItem("arkhamdle_settings", newSettings);
  };

  const loadData = async (forceRefresh = false, includeEncounter = settings.includeEncounter) => {
    setIsLoading(true);
    try {
      setLoadingMessage(
        includeEncounter ? "Loading all cards including encounter data (~11MB)..." : "Loading player cards data (~3MB)..."
      );
      const cardsData = await fetchCards(includeEncounter, forceRefresh);

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
          includeSignatures: savedSettings.includeSignatures ?? true,
          flavourGuesserTypeFilters: savedSettings.flavourGuesserTypeFilters || {
            [TypeCodeEnum.ASSET]: true,
            [TypeCodeEnum.EVENT]: true,
            [TypeCodeEnum.SKILL]: true,
            [TypeCodeEnum.ENEMY]: true,
            [TypeCodeEnum.TREACHERY]: true,
            [TypeCodeEnum.LOCATION]: true,
            [TypeCodeEnum.STORY]: true,
            [TypeCodeEnum.INVESTIGATOR]: true,
          },
          traitGuesserTypeFilters: savedSettings.traitGuesserTypeFilters || {
            [TypeCodeEnum.ASSET]: true,
            [TypeCodeEnum.EVENT]: true,
            [TypeCodeEnum.SKILL]: true,
            [TypeCodeEnum.ENEMY]: false,
            [TypeCodeEnum.TREACHERY]: false,
            [TypeCodeEnum.LOCATION]: false,
            [TypeCodeEnum.STORY]: false,
            [TypeCodeEnum.INVESTIGATOR]: true,
          },
          picGuesserTypeFilters: savedSettings.picGuesserTypeFilters || {
            [TypeCodeEnum.ASSET]: true,
            [TypeCodeEnum.EVENT]: true,
            [TypeCodeEnum.SKILL]: true,
            [TypeCodeEnum.ENEMY]: false,
            [TypeCodeEnum.TREACHERY]: false,
            [TypeCodeEnum.LOCATION]: false,
            [TypeCodeEnum.STORY]: false,
            [TypeCodeEnum.INVESTIGATOR]: false,
          },
          traitGuesserMinCards: savedSettings.traitGuesserMinCards ?? 3,
          traitGuesserMaxCards: savedSettings.traitGuesserMaxCards ?? 0,
          traitGuesserRequirementType: savedSettings.traitGuesserRequirementType || "Fixed Number",
          traitGuesserRequirementValue: savedSettings.traitGuesserRequirementValue ?? 3,
          includeEncounter: savedSettings.includeEncounter ?? false,
        });
        loadData(false, savedSettings.includeEncounter ?? false);
      } else {
        loadData();
      }
    };
    init();
  }, []);

  // Compute filtered cards based on settings — filtering by pack group name, weakness, and signatures
  const filteredCards = cards.filter((card) => {
    const passPack =
      settings.filteredPacks.length === 0 ||
      !settings.filteredPacks.includes(card.pack_name);
    const isWeakness =
      card.subtype_code === "basicweakness" || card.subtype_code === "weakness";
    const passWeakness = settings.includeWeakness || !isWeakness;
    const isSignature = card.restrictions?.investigator;
    const passSignature = settings.includeSignatures || !isSignature;
    return passPack && passWeakness && passSignature;
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
        refreshData: (includeEnc?: boolean) => loadData(true, includeEnc ?? settings.includeEncounter),
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
