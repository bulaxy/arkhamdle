import localforage from "localforage";
import React, { useEffect, useState } from "react";
import { PACK_STRUCTURE } from "../data/packStructure";
import {
  fetchCards,
  transformCards,
} from "../services/ArkhamDbService";
import type {
  AppSettings,
  TransformedCard,
} from "../types";
import { TypeName as TypeNameEnum } from "../types/arkham";

import { GameContext } from './GameContextDefinition';

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cards, setCards] = useState<TransformedCard[]>([]);

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
      [TypeNameEnum.ASSET]: true,
      [TypeNameEnum.EVENT]: true,
      [TypeNameEnum.SKILL]: true,
      [TypeNameEnum.ENEMY]: true,
      [TypeNameEnum.TREACHERY]: true,
      [TypeNameEnum.LOCATION]: true,
      [TypeNameEnum.STORY]: true,
      [TypeNameEnum.INVESTIGATOR]: true,
      [TypeNameEnum.SCENARIO]: true,
      [TypeNameEnum.AGENDA]: true,
      [TypeNameEnum.ACT]: true,
      [TypeNameEnum.KEY]: true,
      [TypeNameEnum.ENEMY_LOCATION]: true,
      [TypeNameEnum.OTHER]: true,
    },
    traitGuesserTypeFilters: {
      [TypeNameEnum.ASSET]: true,
      [TypeNameEnum.EVENT]: true,
      [TypeNameEnum.SKILL]: true,
      [TypeNameEnum.ENEMY]: false,
      [TypeNameEnum.TREACHERY]: false,
      [TypeNameEnum.LOCATION]: false,
      [TypeNameEnum.STORY]: false,
      [TypeNameEnum.INVESTIGATOR]: true,
      [TypeNameEnum.SCENARIO]: false,
      [TypeNameEnum.AGENDA]: false,
      [TypeNameEnum.ACT]: false,
      [TypeNameEnum.KEY]: false,
      [TypeNameEnum.ENEMY_LOCATION]: false,
      [TypeNameEnum.OTHER]: false,
    },
    picGuesserTypeFilters: {
      [TypeNameEnum.ASSET]: true,
      [TypeNameEnum.EVENT]: true,
      [TypeNameEnum.SKILL]: true,
      [TypeNameEnum.ENEMY]: false,
      [TypeNameEnum.TREACHERY]: false,
      [TypeNameEnum.LOCATION]: false,
      [TypeNameEnum.STORY]: false,
      [TypeNameEnum.SCENARIO]: false,
      [TypeNameEnum.AGENDA]: false,
      [TypeNameEnum.ACT]: false,
      [TypeNameEnum.KEY]: false,
      [TypeNameEnum.ENEMY_LOCATION]: false,
      [TypeNameEnum.INVESTIGATOR]: false,
      [TypeNameEnum.OTHER]: false,
    },
    traitGuesserMinCards: 3,
    traitGuesserMaxCards: 0,
    traitGuesserRequirementType: "Fixed Number",
    traitGuesserRequirementValue: 3,
    includeEncounter: false,
    enableHints: true,

    wordleUseGlobalPackFilter: true,
    wordleFilteredPacks: [],
    wordleIncludeWeakness: false,
    wordleIncludeSignatures: true,

    picGuesserUseGlobalPackFilter: true,
    picGuesserFilteredPacks: [],
    picGuesserIncludeWeakness: false,
    picGuesserIncludeSignatures: true,

    investigatordleUseGlobalPackFilter: true,
    investigatordleFilteredPacks: [],
    investigatordleIncludeWeakness: false,
    investigatordleIncludeSignatures: true,

    storyGuesserUseGlobalPackFilter: true,
    storyGuesserFilteredPacks: [],
    storyGuesserIncludeWeakness: false,
    storyGuesserIncludeSignatures: true,

    traitGuesserUseGlobalPackFilter: true,
    traitGuesserFilteredPacks: [],
    traitGuesserIncludeWeakness: false,
    traitGuesserIncludeSignatures: true,

    flavourGuesserUseGlobalPackFilter: true,
    flavourGuesserFilteredPacks: [],
    flavourGuesserIncludeWeakness: false,
    flavourGuesserIncludeSignatures: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  const setSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    localforage.setItem("arkhamdle_settings", newSettings);
  };

  const loadData = React.useCallback(async (forceRefresh = false, includeEncounter = settings.includeEncounter) => {
    setIsLoading(true);
    try {
      setLoadingMessage(
        includeEncounter ? "Loading all cards including encounter data (~11MB)..." : "Loading player cards data (~3MB)..."
      );
      const cardsData = await fetchCards(includeEncounter, forceRefresh);

      setLoadingMessage("Processing cards...");
      const transformed = transformCards(cardsData);
      setCards(transformed);

      // Build pack groups list from structure + detect "OTHER"
      const groupNames = Object.keys(PACK_STRUCTURE).map(k => k.toUpperCase());
      const allCards = transformed;
      const hasOther = allCards.some((c) => c.pack_name === "OTHER");
      if (transformed.filter(c => c.pack_name === "OTHER").length > 0) {
        console.error("Other card should not exist", transformed.filter(c => c.pack_name === "OTHER"))
      }
      setPacks(hasOther ? [...groupNames, "OTHER"] : groupNames);
    } catch (error) {
      console.error("Failed to load ArkhamDB data", error);
      setLoadingMessage(
        "Error loading data. Please try again or check your connection.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [settings.includeEncounter]);

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
            [TypeNameEnum.ASSET]: true,
            [TypeNameEnum.EVENT]: true,
            [TypeNameEnum.SKILL]: true,
            [TypeNameEnum.ENEMY]: true,
            [TypeNameEnum.TREACHERY]: true,
            [TypeNameEnum.LOCATION]: true,
            [TypeNameEnum.STORY]: true,
            [TypeNameEnum.INVESTIGATOR]: true,
            [TypeNameEnum.SCENARIO]: true,
            [TypeNameEnum.AGENDA]: true,
            [TypeNameEnum.ACT]: true,
            [TypeNameEnum.KEY]: true,
            [TypeNameEnum.ENEMY_LOCATION]: true,
            [TypeNameEnum.OTHER]: true,
          },
          traitGuesserTypeFilters: savedSettings.traitGuesserTypeFilters || {
            [TypeNameEnum.ASSET]: true,
            [TypeNameEnum.EVENT]: true,
            [TypeNameEnum.SKILL]: true,
            [TypeNameEnum.ENEMY]: false,
            [TypeNameEnum.TREACHERY]: false,
            [TypeNameEnum.LOCATION]: false,
            [TypeNameEnum.STORY]: false,
            [TypeNameEnum.INVESTIGATOR]: true,
            [TypeNameEnum.SCENARIO]: false,
            [TypeNameEnum.AGENDA]: false,
            [TypeNameEnum.ACT]: false,
            [TypeNameEnum.KEY]: false,
            [TypeNameEnum.ENEMY_LOCATION]: false,
            [TypeNameEnum.OTHER]: false,
          },
          picGuesserTypeFilters: savedSettings.picGuesserTypeFilters || {
            [TypeNameEnum.ASSET]: true,
            [TypeNameEnum.EVENT]: true,
            [TypeNameEnum.SKILL]: true,
            [TypeNameEnum.ENEMY]: false,
            [TypeNameEnum.TREACHERY]: false,
            [TypeNameEnum.LOCATION]: false,
            [TypeNameEnum.STORY]: false,
            [TypeNameEnum.SCENARIO]: false,
            [TypeNameEnum.AGENDA]: false,
            [TypeNameEnum.ACT]: false,
            [TypeNameEnum.KEY]: false,
            [TypeNameEnum.ENEMY_LOCATION]: false,
            [TypeNameEnum.INVESTIGATOR]: false,
            [TypeNameEnum.OTHER]: false,
          },
          traitGuesserMinCards: savedSettings.traitGuesserMinCards ?? 3,
          traitGuesserMaxCards: savedSettings.traitGuesserMaxCards ?? 0,
          traitGuesserRequirementType: savedSettings.traitGuesserRequirementType || "Fixed Number",
          traitGuesserRequirementValue: savedSettings.traitGuesserRequirementValue ?? 3,
          includeEncounter: savedSettings.includeEncounter ?? false,
          enableHints: savedSettings.enableHints ?? true,

          wordleUseGlobalPackFilter: savedSettings.wordleUseGlobalPackFilter ?? true,
          wordleFilteredPacks: savedSettings.wordleFilteredPacks || [],
          wordleIncludeWeakness: savedSettings.wordleIncludeWeakness ?? false,
          wordleIncludeSignatures: savedSettings.wordleIncludeSignatures ?? true,

          picGuesserUseGlobalPackFilter: savedSettings.picGuesserUseGlobalPackFilter ?? true,
          picGuesserFilteredPacks: savedSettings.picGuesserFilteredPacks || [],
          picGuesserIncludeWeakness: savedSettings.picGuesserIncludeWeakness ?? false,
          picGuesserIncludeSignatures: savedSettings.picGuesserIncludeSignatures ?? true,

          investigatordleUseGlobalPackFilter: savedSettings.investigatordleUseGlobalPackFilter ?? true,
          investigatordleFilteredPacks: savedSettings.investigatordleFilteredPacks || [],
          investigatordleIncludeWeakness: savedSettings.investigatordleIncludeWeakness ?? false,
          investigatordleIncludeSignatures: savedSettings.investigatordleIncludeSignatures ?? true,

          storyGuesserUseGlobalPackFilter: savedSettings.storyGuesserUseGlobalPackFilter ?? true,
          storyGuesserFilteredPacks: savedSettings.storyGuesserFilteredPacks || [],
          storyGuesserIncludeWeakness: savedSettings.storyGuesserIncludeWeakness ?? false,
          storyGuesserIncludeSignatures: savedSettings.storyGuesserIncludeSignatures ?? true,

          traitGuesserUseGlobalPackFilter: savedSettings.traitGuesserUseGlobalPackFilter ?? true,
          traitGuesserFilteredPacks: savedSettings.traitGuesserFilteredPacks || [],
          traitGuesserIncludeWeakness: savedSettings.traitGuesserIncludeWeakness ?? false,
          traitGuesserIncludeSignatures: savedSettings.traitGuesserIncludeSignatures ?? true,

          flavourGuesserUseGlobalPackFilter: savedSettings.flavourGuesserUseGlobalPackFilter ?? true,
          flavourGuesserFilteredPacks: savedSettings.flavourGuesserFilteredPacks || [],
          flavourGuesserIncludeWeakness: savedSettings.flavourGuesserIncludeWeakness ?? false,
          flavourGuesserIncludeSignatures: savedSettings.flavourGuesserIncludeSignatures ?? true,
        });
        loadData(false, savedSettings.includeEncounter ?? false);
      } else {
        loadData();
      }
    };
    init();
  }, [loadData]);

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
      }}
    >
      {children}
    </GameContext.Provider>
  );
};


