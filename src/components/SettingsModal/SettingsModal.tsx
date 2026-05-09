import { ExternalLink, Mail, X } from "lucide-react";
import { useState } from "react";
import { useGameContext } from "../../hooks/useGameContext";
import PackFiltersSection from "./PackFiltersSection";
import PicGuesserSection from "./PicGuesserSection";
import "./SettingsModal.scss";
import StoryGuesserSection from "./StoryGuesserSection";
import FlavourGuesserTypeFiltersSection from "./FlavourGuesserTypeFiltersSection";
import TraitGuesserSection from "./TraitGuesserSection";
import GeneralSettingsSection from "./GeneralSettingsSection";
import WordleSection from "./WordleSection";
import InvestigatordleSection from "./InvestigatordleSection";
import TriviaGuesserTypeFiltersSection from "./TriviaGuesserTypeFiltersSection";
import EncounterGuesserSection from "./EncounterGuesserSection";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { packs, settings, setSettings } = useGameContext();
  const [openSection, setOpenSection] = useState<string>("");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings <small className="version-tag">v{APP_VERSION}</small></h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <GeneralSettingsSection
            isOpen={openSection === "general"}
            onToggle={() => toggleSection("general")}
            onClose={onClose}
          />

          <PackFiltersSection
            packs={packs}
            filteredPacks={settings.filteredPacks}
            includeWeakness={settings.includeWeakness}
            includeSignatures={settings.includeSignatures}
            isOpen={openSection === "packs"}
            onToggle={() => toggleSection("packs")}
            onPackToggle={(packGroup) => {
              const newFiltered = settings.filteredPacks.includes(packGroup)
                ? settings.filteredPacks.filter((p) => p !== packGroup)
                : [...settings.filteredPacks, packGroup];
              setSettings({ ...settings, filteredPacks: newFiltered });
            }}
            onSelectAll={() => setSettings({ ...settings, filteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, filteredPacks: packs })}
            onIncludeWeaknessChange={(include) =>
              setSettings({ ...settings, includeWeakness: include })
            }
            onIncludeSignaturesChange={(include) =>
              setSettings({ ...settings, includeSignatures: include })
            }
            includeBondedCard={settings.includeBondedCard}
            onIncludeBondedCardChange={(include) =>
              setSettings({ ...settings, includeBondedCard: include })
            }
          />

          <WordleSection
            isOpen={openSection === "wordle"}
            onToggle={() => toggleSection("wordle")}
            packs={packs}
            useGlobalPackFilter={settings.wordleUseGlobalPackFilter}
            filteredPacks={settings.wordleFilteredPacks}
            includeWeakness={settings.wordleIncludeWeakness}
            includeSignatures={settings.wordleIncludeSignatures}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, wordleUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.wordleFilteredPacks.includes(pack)
                ? settings.wordleFilteredPacks.filter(p => p !== pack)
                : [...settings.wordleFilteredPacks, pack];
              setSettings({ ...settings, wordleFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, wordleFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, wordleFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, wordleIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, wordleIncludeSignatures: value })}
            includeBondedCard={settings.wordleIncludeBondedCard}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, wordleIncludeBondedCard: value })}
          />

          <PicGuesserSection
            isOpen={openSection === "picGuesser"}
            onToggle={() => toggleSection("picGuesser")}
            difficulty={settings.picGuesserDifficulty}
            typeFilters={settings.picGuesserTypeFilters}
            onDifficultyChange={(diff) => setSettings({ ...settings, picGuesserDifficulty: diff })}
            onTypeFilterChange={(typeCode, include) => setSettings({
              ...settings,
              picGuesserTypeFilters: { ...settings.picGuesserTypeFilters, [typeCode]: include }
            })}
            packs={packs}
            useGlobalPackFilter={settings.picGuesserUseGlobalPackFilter}
            filteredPacks={settings.picGuesserFilteredPacks}
            includeWeakness={settings.picGuesserIncludeWeakness}
            includeSignatures={settings.picGuesserIncludeSignatures}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, picGuesserUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.picGuesserFilteredPacks.includes(pack)
                ? settings.picGuesserFilteredPacks.filter(p => p !== pack)
                : [...settings.picGuesserFilteredPacks, pack];
              setSettings({ ...settings, picGuesserFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, picGuesserFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, picGuesserFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, picGuesserIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, picGuesserIncludeSignatures: value })}
            includeBondedCard={settings.picGuesserIncludeBondedCard}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, picGuesserIncludeBondedCard: value })}
          />

          <InvestigatordleSection
            isOpen={openSection === "investigatordle"}
            onToggle={() => toggleSection("investigatordle")}
            packs={packs}
            useGlobalPackFilter={settings.investigatordleUseGlobalPackFilter}
            filteredPacks={settings.investigatordleFilteredPacks}
            includeWeakness={settings.investigatordleIncludeWeakness}
            includeSignatures={settings.investigatordleIncludeSignatures}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, investigatordleUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.investigatordleFilteredPacks.includes(pack)
                ? settings.investigatordleFilteredPacks.filter(p => p !== pack)
                : [...settings.investigatordleFilteredPacks, pack];
              setSettings({ ...settings, investigatordleFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, investigatordleFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, investigatordleFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, investigatordleIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, investigatordleIncludeSignatures: value })}
            includeBondedCard={settings.investigatordleIncludeBondedCard}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, investigatordleIncludeBondedCard: value })}
          />

          <StoryGuesserSection
            isOpen={openSection === "storyGuesser"}
            onToggle={() => toggleSection("storyGuesser")}
            scrambleWords={settings.storyGuesserScrambleWords}
            scrambleLetters={settings.storyGuesserScrambleLetters}
            hideName={settings.storyGuesserHideName}
            sliceScale={settings.storyGuesserSliceScale}
            onScrambleWordsChange={(value) => setSettings({ ...settings, storyGuesserScrambleWords: value })}
            onScrambleLettersChange={(value) => setSettings({ ...settings, storyGuesserScrambleLetters: value })}
            onHideNameChange={(value) => setSettings({ ...settings, storyGuesserHideName: value })}
            onSliceScaleChange={(value) => setSettings({ ...settings, storyGuesserSliceScale: value })}
            packs={packs}
            useGlobalPackFilter={settings.storyGuesserUseGlobalPackFilter}
            filteredPacks={settings.storyGuesserFilteredPacks}
            includeWeakness={settings.storyGuesserIncludeWeakness}
            includeSignatures={settings.storyGuesserIncludeSignatures}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, storyGuesserUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.storyGuesserFilteredPacks.includes(pack)
                ? settings.storyGuesserFilteredPacks.filter(p => p !== pack)
                : [...settings.storyGuesserFilteredPacks, pack];
              setSettings({ ...settings, storyGuesserFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, storyGuesserFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, storyGuesserFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, storyGuesserIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, storyGuesserIncludeSignatures: value })}
            includeBondedCard={settings.storyGuesserIncludeBondedCard}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, storyGuesserIncludeBondedCard: value })}
          />

          <TraitGuesserSection
            isOpen={openSection === "traitGuesser"}
            onToggle={() => toggleSection("traitGuesser")}
            minCards={settings.traitGuesserMinCards}
            maxCards={settings.traitGuesserMaxCards}
            requirementType={settings.traitGuesserRequirementType}
            requirementValue={settings.traitGuesserRequirementValue}
            typeFilters={settings.traitGuesserTypeFilters}
            onMinCardsChange={(value) => setSettings({ ...settings, traitGuesserMinCards: value })}
            onMaxCardsChange={(value) => setSettings({ ...settings, traitGuesserMaxCards: value })}
            onRequirementTypeChange={(value) => setSettings({ ...settings, traitGuesserRequirementType: value })}
            onRequirementValueChange={(value) => setSettings({ ...settings, traitGuesserRequirementValue: value })}
            onTypeFilterChange={(typeCode, include) => setSettings({
              ...settings,
              traitGuesserTypeFilters: { ...settings.traitGuesserTypeFilters, [typeCode]: include }
            })}
            packs={packs}
            useGlobalPackFilter={settings.traitGuesserUseGlobalPackFilter}
            filteredPacks={settings.traitGuesserFilteredPacks}
            includeWeakness={settings.traitGuesserIncludeWeakness}
            includeSignatures={settings.traitGuesserIncludeSignatures}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, traitGuesserUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.traitGuesserFilteredPacks.includes(pack)
                ? settings.traitGuesserFilteredPacks.filter(p => p !== pack)
                : [...settings.traitGuesserFilteredPacks, pack];
              setSettings({ ...settings, traitGuesserFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, traitGuesserFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, traitGuesserFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, traitGuesserIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, traitGuesserIncludeSignatures: value })}
            includeBondedCard={settings.traitGuesserIncludeBondedCard}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, traitGuesserIncludeBondedCard: value })}
          />

          <FlavourGuesserTypeFiltersSection
            isOpen={openSection === "flavourGuesser"}
            onToggle={() => toggleSection("flavourGuesser")}
            typeFilters={settings.flavourGuesserTypeFilters}
            onTypeFilterChange={(typeCode, include) => setSettings({
              ...settings,
              flavourGuesserTypeFilters: { ...settings.flavourGuesserTypeFilters, [typeCode]: include }
            })}
            packs={packs}
            useGlobalPackFilter={settings.flavourGuesserUseGlobalPackFilter}
            filteredPacks={settings.flavourGuesserFilteredPacks}
            includeWeakness={settings.flavourGuesserIncludeWeakness}
            includeSignatures={settings.flavourGuesserIncludeSignatures}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, flavourGuesserUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.flavourGuesserFilteredPacks.includes(pack)
                ? settings.flavourGuesserFilteredPacks.filter(p => p !== pack)
                : [...settings.flavourGuesserFilteredPacks, pack];
              setSettings({ ...settings, flavourGuesserFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, flavourGuesserFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, flavourGuesserFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, flavourGuesserIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, flavourGuesserIncludeSignatures: value })}
            includeBondedCard={settings.flavourGuesserIncludeBondedCard}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, flavourGuesserIncludeBondedCard: value })}
          />

          <EncounterGuesserSection
            isOpen={openSection === "encounterGuesser"}
            onToggle={() => toggleSection("encounterGuesser")}
            blurAmount={settings.encounterGuesserBlurAmount}
            onBlurAmountChange={(value) => setSettings({ ...settings, encounterGuesserBlurAmount: value })}
            packs={packs}
            useGlobalPackFilter={settings.encounterGuesserUseGlobalPackFilter}
            filteredPacks={settings.encounterGuesserFilteredPacks}
            includeWeakness={settings.encounterGuesserIncludeWeakness}
            includeSignatures={settings.encounterGuesserIncludeSignatures}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, encounterGuesserUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.encounterGuesserFilteredPacks.includes(pack)
                ? settings.encounterGuesserFilteredPacks.filter(p => p !== pack)
                : [...settings.encounterGuesserFilteredPacks, pack];
              setSettings({ ...settings, encounterGuesserFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, encounterGuesserFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, encounterGuesserFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, encounterGuesserIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, encounterGuesserIncludeSignatures: value })}
            includeBondedCard={settings.encounterGuesserIncludeBondedCard}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, encounterGuesserIncludeBondedCard: value })}
          />

          <TriviaGuesserTypeFiltersSection
            isOpen={openSection === "triviaGuesser"}
            onToggle={() => toggleSection("triviaGuesser")}
            questionType={settings.triviaGuesserQuestionType}
            onQuestionTypeChange={(value) => setSettings({ ...settings, triviaGuesserQuestionType: value })}
            inputMode={settings.triviaGuesserInputMode}
            onInputModeChange={(value) => setSettings({ ...settings, triviaGuesserInputMode: value })}
            poolFilter={settings.triviaGuesserPoolFilter}
            onPoolFilterChange={(value) => setSettings({ ...settings, triviaGuesserPoolFilter: value })}
            packs={packs}
            useGlobalPackFilter={settings.triviaGuesserUseGlobalPackFilter}
            filteredPacks={settings.triviaGuesserFilteredPacks}
            includeWeakness={settings.triviaGuesserIncludeWeakness}
            includeSignatures={settings.triviaGuesserIncludeSignatures}
            includeBondedCard={settings.triviaGuesserIncludeBondedCard}
            onUseGlobalPackFilterChange={(value) => setSettings({ ...settings, triviaGuesserUseGlobalPackFilter: value })}
            onPackToggle={(pack) => {
              const newPacks = settings.triviaGuesserFilteredPacks.includes(pack)
                ? settings.triviaGuesserFilteredPacks.filter(p => p !== pack)
                : [...settings.triviaGuesserFilteredPacks, pack];
              setSettings({ ...settings, triviaGuesserFilteredPacks: newPacks });
            }}
            onSelectAll={() => setSettings({ ...settings, triviaGuesserFilteredPacks: [] })}
            onFilterAll={() => setSettings({ ...settings, triviaGuesserFilteredPacks: packs })}
            onIncludeWeaknessChange={(value) => setSettings({ ...settings, triviaGuesserIncludeWeakness: value })}
            onIncludeSignaturesChange={(value) => setSettings({ ...settings, triviaGuesserIncludeSignatures: value })}
            onIncludeBondedCardChange={(value) => setSettings({ ...settings, triviaGuesserIncludeBondedCard: value })}
    
          />

          <div className="footer-buttons">
            <button className="premium-btn" onClick={onClose}>
              Close Settings
            </button>
            <div className="footer-links">
              <a
                href="https://github.com/bulaxy/arkhamdle"
                target="_blank"
                rel="noopener noreferrer"
                className="external-link"
              >
                <ExternalLink size={18} /> GitHub
              </a>
              <a
                href="mailto:feedback@arkhamdle.com"
                className="external-link"
              >
                <Mail size={18} /> Feedback
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
