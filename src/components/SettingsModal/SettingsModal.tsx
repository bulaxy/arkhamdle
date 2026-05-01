import { ExternalLink, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useGameContext } from "../../context/GameContext";
import PackFiltersSection from "./PackFiltersSection";
import PicGuesserSection from "./PicGuesserSection";
import "./SettingsModal.scss";
import StoryGuesserSection from "./StoryGuesserSection";
import FlavourGuesserTypeFiltersSection from "./FlavourGuesserTypeFiltersSection";
import TraitGuesserSection from "./TraitGuesserSection";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { packs, settings, setSettings, refreshData } = useGameContext();
  const [openSection, setOpenSection] = useState<string>(""); // 'packs', 'picGuesser', 'storyGuesser', 'traitGuesser'

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
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
          />

          <PicGuesserSection
            difficulty={settings.picGuesserDifficulty}
            typeFilters={settings.picGuesserTypeFilters}
            isOpen={openSection === "picGuesser"}
            onToggle={() => toggleSection("picGuesser")}
            onDifficultyChange={(diff) =>
              setSettings({ ...settings, picGuesserDifficulty: diff })
            }
            onTypeFilterChange={(typeCode, include) =>
              setSettings({
                ...settings,
                picGuesserTypeFilters: {
                  ...settings.picGuesserTypeFilters,
                  [typeCode]: include,
                },
              })
            }
          />

          <StoryGuesserSection
            scrambleWords={settings.storyGuesserScrambleWords}
            scrambleLetters={settings.storyGuesserScrambleLetters}
            hideName={settings.storyGuesserHideName}
            sliceScale={settings.storyGuesserSliceScale}
            isOpen={openSection === "storyGuesser"}
            onToggle={() => toggleSection("storyGuesser")}
            onScrambleWordsChange={(value) =>
              setSettings({ ...settings, storyGuesserScrambleWords: value })
            }
            onScrambleLettersChange={(value) =>
              setSettings({ ...settings, storyGuesserScrambleLetters: value })
            }
            onHideNameChange={(value) =>
              setSettings({ ...settings, storyGuesserHideName: value })
            }
            onSliceScaleChange={(value) =>
              setSettings({ ...settings, storyGuesserSliceScale: value })
            }
          />

          <FlavourGuesserTypeFiltersSection
            typeFilters={settings.flavourGuesserTypeFilters}
            isOpen={openSection === "flavourGuesser"}
            onToggle={() => toggleSection("flavourGuesser")}
            onTypeFilterChange={(typeCode, include) =>
              setSettings({
                ...settings,
                flavourGuesserTypeFilters: {
                  ...settings.flavourGuesserTypeFilters,
                  [typeCode]: include,
                },
              })
            }
          />

          <TraitGuesserSection
            minCards={settings.traitGuesserMinCards}
            maxCards={settings.traitGuesserMaxCards}
            requirementType={settings.traitGuesserRequirementType}
            requirementValue={settings.traitGuesserRequirementValue}
            typeFilters={settings.traitGuesserTypeFilters}
            isOpen={openSection === "traitGuesser"}
            onToggle={() => toggleSection("traitGuesser")}
            onMinCardsChange={(value) =>
              setSettings({ ...settings, traitGuesserMinCards: value })
            }
            onMaxCardsChange={(value) =>
              setSettings({ ...settings, traitGuesserMaxCards: value })
            }
            onRequirementTypeChange={(value) =>
              setSettings({ ...settings, traitGuesserRequirementType: value })
            }
            onRequirementValueChange={(value) =>
              setSettings({ ...settings, traitGuesserRequirementValue: value })
            }
            onTypeFilterChange={(typeCode, include) =>
              setSettings({
                ...settings,
                traitGuesserTypeFilters: {
                  ...settings.traitGuesserTypeFilters,
                  [typeCode]: include,
                },
              })
            }
          />

          <div className="footer-buttons">
            <button
              className={`premium-btn ${settings.includeEncounter ? "active" : ""}`}
              onClick={async () => {
                const newValue = !settings.includeEncounter;
                if (newValue) {
                  const confirmed = window.confirm(
                    "Campaign cards will add about 8MB to the data download (11MB total). This might be expensive on mobile data. Are you sure you want to continue?"
                  );
                  if (confirmed) {
                    setSettings({ ...settings, includeEncounter: true });
                    refreshData(true);
                  }
                } else {
                  setSettings({ ...settings, includeEncounter: false });
                  refreshData(false);
                }
              }}
            >
              <RefreshCw size={18} className={settings.includeEncounter ? "spin-once" : ""} />
              {settings.includeEncounter ? "Unload Campaign Cards" : "Load Campaign Cards (11MB)"}
            </button>

            <button
              className="premium-btn"
              onClick={async () => {
                await refreshData();
                onClose();
              }}
            >
              <RefreshCw size={18} /> Force Refresh Data
            </button>
            <button className="premium-btn" onClick={onClose}>
              Close Settings
            </button>
            <a
              href="https://github.com/bulaxy/arkhamdle"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              <ExternalLink size={18} /> Issues & Feedback
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
