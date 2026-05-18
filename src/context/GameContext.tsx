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
import { initializeSeed } from "../utils/random";

const defaultBaseGameSettings = {
  useGlobalPackFilter: true,
  filteredPacks: [],
  includeWeakness: false,
  includeSignatures: true,
  includeBondedCard: false,
  maxGuesses: 6,
};

const defaultSettings: AppSettings = {
  filteredPacks: [],
  includeWeakness: false,
  includeSignatures: true,
  includeBondedCard: false,
  includeEncounter: false,
  showCampaignCards: true,
  enableHints: true,
  streakDisplayType: "global",
  wordle: { ...defaultBaseGameSettings },
  picGuesser: {
    ...defaultBaseGameSettings,
    difficulty: "Normal",
    typeFilters: {
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
  },
  investigatordle: { ...defaultBaseGameSettings },
  storyGuesser: {
    ...defaultBaseGameSettings,
    scrambleWords: true,
    scrambleLetters: false,
    sliceScale: 0.5,
    hideName: true,
  },
  traitGuesser: {
    ...defaultBaseGameSettings,
    typeFilters: {
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
    minCards: 3,
    maxCards: 0,
    requirementType: "Fixed Number",
    requirementValue: 3,
  },
  flavourGuesser: {
    ...defaultBaseGameSettings,
    typeFilters: {
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
    inputMode: 'Multiple Choice',
  },
  campaignPackGuesser: {
    ...defaultBaseGameSettings,
    blurAmount: 3,
  },
  guessCardByTrait: {
    ...defaultBaseGameSettings,
    inputMode: 'Multiple Choice',
    poolFilter: 'Player Cards Only',
  },
  countGuesser: {
    ...defaultBaseGameSettings,
    inputMode: 'Multiple Choice',
    poolFilter: 'Player Cards Only',
  },
  iconGuesser: { ...defaultBaseGameSettings },
  trueOrFalse: { 
    ...defaultBaseGameSettings,
    enemyStatsMode: true,
    traitMode: true,
    locationTraitsMode: true,
    actTraitsMode: true,
    agendaTraitsMode: true,
    treacheryTraitsMode: true,
    nameAndPicMode: true,
  },
  randomTrivia: {
    enabledModes: {
      WordleGame: false,
      PicGuesser: false,
      Investigatordle: false,
      StoryGuesser: true,
      TraitGuesser: true,
      FlavourGuesser: true,
      CampaignPackGuesser: true,
      GuessCardByTrait: true,
      CountGuesser: true,
      IconGuesser: true,
      TrueOrFalse: true,
    }
  },
  scoringConfig: {
    wordle: { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2, 6: 1 },
    retry: {
      picGuesser: 5,
      storyGuesser: 5,
      traitGuesser: 5,
      flavourGuesser: 5,
      campaignPackGuesser: 3,
      countGuesser: 5,
    },
    retryPenalty: {
      picGuesser: 1,
      storyGuesser: 1,
      traitGuesser: 1,
      flavourGuesser: 1,
      campaignPackGuesser: 1,
      countGuesser: 1,
    },
    singleAttempt: {
      trueOrFalse: 1,
      multipleChoice: 1,
      iconGuesser: 3,
    },
  },
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cards, setCards] = useState<TransformedCard[]>([]);

  const [packs, setPacks] = useState<string[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");

  const setSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    localforage.setItem("arkhamdle_settings", newSettings);
    initializeSeed(newSettings.seed);
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
      if (savedSettings && savedSettings.wordle) {
        // Deeply merge scoringConfig to protect new fields like retryPenalty
        const mergedScoringConfig = {
          ...defaultSettings.scoringConfig,
          ...(savedSettings.scoringConfig || {}),
          retry: {
            ...defaultSettings.scoringConfig.retry,
            ...(savedSettings.scoringConfig?.retry || {}),
          },
          retryPenalty: {
            ...defaultSettings.scoringConfig.retryPenalty,
            ...(savedSettings.scoringConfig?.retryPenalty || {}),
          },
          singleAttempt: {
            ...defaultSettings.scoringConfig.singleAttempt,
            ...(savedSettings.scoringConfig?.singleAttempt || {}),
          }
        };

        setSettingsState({
          ...defaultSettings,
          ...savedSettings,
          scoringConfig: mergedScoringConfig,
        });
        initializeSeed(savedSettings.seed);
        loadData(false, savedSettings.includeEncounter ?? false);
      } else {
        // If no settings or old structure, revert to defaults
        setSettingsState(defaultSettings);
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
    const isBonded = !!card.bonded_to;
    const passBonded = settings.includeBondedCard || !isBonded;
    const isCampaign = !!(card.encounter_code || card.encounter_name);
    const passCampaign = settings.showCampaignCards || !isCampaign;
    return passPack && passWeakness && passSignature && passBonded && passCampaign;
  });



  const [seedVersion, setSeedVersion] = useState(0);

  const applySeed = (seed: string) => {
    const newSettings = { ...settings, seed };
    setSettingsState(newSettings);
    localforage.setItem("arkhamdle_settings", newSettings);
    initializeSeed(seed);
    setSeedVersion((v) => v + 1);
  };

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
        seedVersion,
        applySeed,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};


