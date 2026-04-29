import { ExternalLink, RefreshCw, X } from "lucide-react";
import { useState } from "react";
import { useGameContext } from "../context/GameContext";
import PackFiltersSection from "./PackFiltersSection";
import PicGuesserSection from "./PicGuesserSection";
import "./SettingsModal.scss";
import StoryGuesserSection from "./StoryGuesserSection";

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { packs, settings, setSettings, refreshData } = useGameContext();
  const [openSection, setOpenSection] = useState<string>(""); // 'packs', 'picGuesser', 'storyGuesser'

  const handlePackToggle = (packGroup: string) => {
    const isFiltered = settings.filteredPacks.includes(packGroup);
    const newFiltered = isFiltered
      ? settings.filteredPacks.filter((p) => p !== packGroup)
      : [...settings.filteredPacks, packGroup];
    setSettings({ ...settings, filteredPacks: newFiltered });
  };

  const selectAll = () => setSettings({ ...settings, filteredPacks: [] });
  const filterAll = () =>
    setSettings({ ...settings, filteredPacks: [...packs] });

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
            isOpen={openSection === "packs"}
            onToggle={() => toggleSection("packs")}
            onPackToggle={handlePackToggle}
            onSelectAll={selectAll}
            onFilterAll={filterAll}
            onIncludeWeaknessChange={(include) =>
              setSettings({ ...settings, includeWeakness: include })
            }
          />

          <PicGuesserSection
            difficulty={settings.picGuesserDifficulty}
            isOpen={openSection === "picGuesser"}
            onToggle={() => toggleSection("picGuesser")}
            onDifficultyChange={(diff) =>
              setSettings({ ...settings, picGuesserDifficulty: diff })
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

          <div className="footer-buttons">
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
