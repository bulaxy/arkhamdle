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
import CampaignPackGuesserSection from "./CampaignPackGuesserSection";
import IconGuesserSection from "./IconGuesserSection";
import RandomTriviaSection from "./RandomTriviaSection";

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
            settings={settings.wordle}
            onChange={(newSettings) => setSettings({ ...settings, wordle: newSettings })}
          />

          <PicGuesserSection
            isOpen={openSection === "picGuesser"}
            onToggle={() => toggleSection("picGuesser")}
            difficulty={settings.picGuesser.difficulty}
            typeFilters={settings.picGuesser.typeFilters}
            onDifficultyChange={(diff) => setSettings({ ...settings, picGuesser: { ...settings.picGuesser, difficulty: diff } })}
            onTypeFilterChange={(typeCode, include) => setSettings({
              ...settings,
              picGuesser: { ...settings.picGuesser, typeFilters: { ...settings.picGuesser.typeFilters, [typeCode]: include } }
            })}
            packs={packs}
            settings={settings.picGuesser}
            onChange={(newSettings) => setSettings({ ...settings, picGuesser: newSettings })}
          />

          <InvestigatordleSection
            isOpen={openSection === "investigatordle"}
            onToggle={() => toggleSection("investigatordle")}
            packs={packs}
            settings={settings.investigatordle}
            onChange={(newSettings) => setSettings({ ...settings, investigatordle: newSettings })}
          />

          <StoryGuesserSection
            isOpen={openSection === "storyGuesser"}
            onToggle={() => toggleSection("storyGuesser")}
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
            isOpen={openSection === "traitGuesser"}
            onToggle={() => toggleSection("traitGuesser")}
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
            isOpen={openSection === "flavourGuesser"}
            onToggle={() => toggleSection("flavourGuesser")}
            typeFilters={settings.flavourGuesser.typeFilters}
            onTypeFilterChange={(typeCode, include) => setSettings({
              ...settings,
              flavourGuesser: { ...settings.flavourGuesser, typeFilters: { ...settings.flavourGuesser.typeFilters, [typeCode]: include } }
            })}
            packs={packs}
            settings={settings.flavourGuesser}
            onChange={(newSettings) => setSettings({ ...settings, flavourGuesser: newSettings })}
          />

          <CampaignPackGuesserSection
            isOpen={openSection === "campaignPackGuesser"}
            onToggle={() => toggleSection("campaignPackGuesser")}
            blurAmount={settings.campaignPackGuesser.blurAmount}
            onBlurAmountChange={(value) => setSettings({ ...settings, campaignPackGuesser: { ...settings.campaignPackGuesser, blurAmount: value } })}
            packs={packs}
            settings={settings.campaignPackGuesser}
            onChange={(newSettings) => setSettings({ ...settings, campaignPackGuesser: newSettings })}
          />

          <IconGuesserSection
            isOpen={openSection === "iconGuesser"}
            onToggle={() => toggleSection("iconGuesser")}
            packs={packs}
            settings={settings.iconGuesser}
            onChange={(newSettings) => setSettings({ ...settings, iconGuesser: newSettings })}
          />

          <TriviaGuesserTypeFiltersSection
            isOpen={openSection === "triviaGuesser"}
            onToggle={() => toggleSection("triviaGuesser")}
            questionType={settings.triviaGuesser.questionType}
            onQuestionTypeChange={(value) => setSettings({ ...settings, triviaGuesser: { ...settings.triviaGuesser, questionType: value } })}
            inputMode={settings.triviaGuesser.inputMode}
            onInputModeChange={(value) => setSettings({ ...settings, triviaGuesser: { ...settings.triviaGuesser, inputMode: value } })}
            poolFilter={settings.triviaGuesser.poolFilter}
            onPoolFilterChange={(value) => setSettings({ ...settings, triviaGuesser: { ...settings.triviaGuesser, poolFilter: value } })}
            packs={packs}
            settings={settings.triviaGuesser}
            onChange={(newSettings) => setSettings({ ...settings, triviaGuesser: newSettings })}
          />

          <RandomTriviaSection
            isOpen={openSection === "randomTrivia"}
            onToggle={() => toggleSection("randomTrivia")}
            settings={settings.randomTrivia}
            onChange={(newSettings) => setSettings({ ...settings, randomTrivia: newSettings })}
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
