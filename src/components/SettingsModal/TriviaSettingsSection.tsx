import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import RandomTriviaSection from "./RandomTriviaSection";
import TrueOrFalseSection from "./TrueOrFalseSection";
import GuessCardByTraitSection from "./GuessCardByTraitSection";
import CountGuesserSection from "./CountGuesserSection";
import StoryGuesserSection from "./StoryGuesserSection";
import TraitGuesserSection from "./TraitGuesserSection";
import FlavourGuesserTypeFiltersSection from "./FlavourGuesserTypeFiltersSection";
import CampaignPackGuesserSection from "./CampaignPackGuesserSection";
import IconGuesserSection from "./IconGuesserSection";
import type { AppSettings } from "../../types";

interface TriviaSettingsSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  packs: string[];
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
}

export default function TriviaSettingsSection({
  isOpen,
  onToggle,
  packs,
  settings,
  setSettings,
}: TriviaSettingsSectionProps) {
  const [openSubSection, setOpenSubSection] = useState<string>("");

  const toggleSubSection = (section: string) => {
    setOpenSubSection(openSubSection === section ? "" : section);
  };

  return (
    <div className="settings-section trivia-group">
      <div className="settings-section-header group-header" onClick={onToggle}>
        <h3>Trivia Games Settings</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isOpen && (
        <div className="settings-section-content trivia-group-content fade-in">
          <RandomTriviaSection
            isOpen={openSubSection === "randomTrivia"}
            onToggle={() => toggleSubSection("randomTrivia")}
            settings={settings.randomTrivia}
            onChange={(newSettings) => setSettings({ ...settings, randomTrivia: newSettings })}
          />

          <TrueOrFalseSection
            isOpen={openSubSection === "trueOrFalse"}
            onToggle={() => toggleSubSection("trueOrFalse")}
            packs={packs}
            settings={settings.trueOrFalse}
            onChange={(newSettings) => setSettings({ ...settings, trueOrFalse: newSettings })}
          />

          <GuessCardByTraitSection
            isOpen={openSubSection === "guessCardByTrait"}
            onToggle={() => toggleSubSection("guessCardByTrait")}
            inputMode={settings.guessCardByTrait.inputMode}
            onInputModeChange={(value) => setSettings({ ...settings, guessCardByTrait: { ...settings.guessCardByTrait, inputMode: value } })}
            poolFilter={settings.guessCardByTrait.poolFilter}
            onPoolFilterChange={(value) => setSettings({ ...settings, guessCardByTrait: { ...settings.guessCardByTrait, poolFilter: value } })}
            packs={packs}
            settings={settings.guessCardByTrait}
            onChange={(newSettings) => setSettings({ ...settings, guessCardByTrait: newSettings })}
          />

          <CountGuesserSection
            isOpen={openSubSection === "countGuesser"}
            onToggle={() => toggleSubSection("countGuesser")}
            inputMode={settings.countGuesser.inputMode}
            onInputModeChange={(value) => setSettings({ ...settings, countGuesser: { ...settings.countGuesser, inputMode: value } })}
            poolFilter={settings.countGuesser.poolFilter}
            onPoolFilterChange={(value) => setSettings({ ...settings, countGuesser: { ...settings.countGuesser, poolFilter: value } })}
            packs={packs}
            settings={settings.countGuesser}
            onChange={(newSettings) => setSettings({ ...settings, countGuesser: newSettings })}
          />

          <StoryGuesserSection
            isOpen={openSubSection === "storyGuesser"}
            onToggle={() => toggleSubSection("storyGuesser")}
            scrambleWords={settings.storyGuesser.scrambleWords}
            scrambleLetters={settings.storyGuesser.scrambleLetters}
            hideName={settings.storyGuesser.hideName}
            sliceScale={settings.storyGuesser.sliceScale}
            onScrambleWordsChange={(value) => setSettings({ ...settings, storyGuesser: { ...settings.storyGuesser, scrambleWords: value } })}
            onScrambleLettersChange={(value) => setSettings({ ...settings, storyGuesser: { ...settings.storyGuesser, scrambleLetters: value } })}
            onHideNameChange={(value) => setSettings({ ...settings, storyGuesser: { ...settings.storyGuesser, hideName: value } })}
            onSliceScaleChange={(value) => setSettings({ ...settings, storyGuesser: { ...settings.storyGuesser, sliceScale: value } })}
            packs={packs}
            settings={settings.storyGuesser}
            onChange={(newSettings) => setSettings({ ...settings, storyGuesser: newSettings })}
          />

          <TraitGuesserSection
            isOpen={openSubSection === "traitGuesser"}
            onToggle={() => toggleSubSection("traitGuesser")}
            minCards={settings.traitGuesser.minCards}
            maxCards={settings.traitGuesser.maxCards}
            requirementType={settings.traitGuesser.requirementType}
            requirementValue={settings.traitGuesser.requirementValue}
            typeFilters={settings.traitGuesser.typeFilters}
            onMinCardsChange={(value) => setSettings({ ...settings, traitGuesser: { ...settings.traitGuesser, minCards: value } })}
            onMaxCardsChange={(value) => setSettings({ ...settings, traitGuesser: { ...settings.traitGuesser, maxCards: value } })}
            onRequirementTypeChange={(value) => setSettings({ ...settings, traitGuesser: { ...settings.traitGuesser, requirementType: value } })}
            onRequirementValueChange={(value) => setSettings({ ...settings, traitGuesser: { ...settings.traitGuesser, requirementValue: value } })}
            onTypeFilterChange={(typeCode, include) => setSettings({
              ...settings,
              traitGuesser: { ...settings.traitGuesser, typeFilters: { ...settings.traitGuesser.typeFilters, [typeCode]: include } }
            })}
            packs={packs}
            settings={settings.traitGuesser}
            onChange={(newSettings) => setSettings({ ...settings, traitGuesser: newSettings })}
          />

          <FlavourGuesserTypeFiltersSection
            isOpen={openSubSection === "flavourGuesser"}
            onToggle={() => toggleSubSection("flavourGuesser")}
            typeFilters={settings.flavourGuesser.typeFilters}
            onTypeFilterChange={(typeCode, include) => setSettings({
              ...settings,
              flavourGuesser: { ...settings.flavourGuesser, typeFilters: { ...settings.flavourGuesser.typeFilters, [typeCode]: include } }
            })}
            inputMode={settings.flavourGuesser.inputMode}
            onInputModeChange={(value) => setSettings({ ...settings, flavourGuesser: { ...settings.flavourGuesser, inputMode: value } })}
            packs={packs}
            settings={settings.flavourGuesser}
            onChange={(newSettings) => setSettings({ ...settings, flavourGuesser: newSettings })}
          />

          <CampaignPackGuesserSection
            isOpen={openSubSection === "campaignPackGuesser"}
            onToggle={() => toggleSubSection("campaignPackGuesser")}
            blurAmount={settings.campaignPackGuesser.blurAmount}
            onBlurAmountChange={(value) => setSettings({ ...settings, campaignPackGuesser: { ...settings.campaignPackGuesser, blurAmount: value } })}
            packs={packs}
            settings={settings.campaignPackGuesser}
            onChange={(newSettings) => setSettings({ ...settings, campaignPackGuesser: newSettings })}
          />

          <IconGuesserSection
            isOpen={openSubSection === "iconGuesser"}
            onToggle={() => toggleSubSection("iconGuesser")}
            packs={packs}
            settings={settings.iconGuesser}
            onChange={(newSettings) => setSettings({ ...settings, iconGuesser: newSettings })}
          />
        </div>
      )}
    </div>
  );
}
