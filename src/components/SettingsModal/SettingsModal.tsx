import { ExternalLink, Mail, X } from "lucide-react";
import { useState } from "react";
import { useGameContext } from "../../hooks/useGameContext";
import PackFiltersSection from "./PackFiltersSection";
import PicGuesserSection from "./PicGuesserSection";
import "./SettingsModal.scss";
import GeneralSettingsSection from "./GeneralSettingsSection";
import WordleSection from "./WordleSection";
import InvestigatordleSection from "./InvestigatordleSection";
import TriviaSettingsSection from "./TriviaSettingsSection";

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

          <TriviaSettingsSection
            isOpen={openSection === "trivia"}
            onToggle={() => toggleSection("trivia")}
            packs={packs}
            settings={settings}
            setSettings={setSettings}
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
