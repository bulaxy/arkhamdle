import { Info } from "lucide-react";
import { useState } from "react";
import "./GameInfoButton.scss";

interface GameInfoButtonProps {
  gameName: string;
  gameRules: {
    title: string;
    cardTypes: string;
    answerEvaluation: string;
    currentFilters: string;
  };
}

export default function GameInfoButton({
  gameName: _gameName,
  gameRules,
}: GameInfoButtonProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <button
        className="game-info-button"
        onClick={() => setShowInfo(true)}
        title="Game information"
      >
        <Info size={20} />
      </button>

      {showInfo && (
        <div className="info-modal-overlay" onClick={() => setShowInfo(false)}>
          <div
            className="info-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="info-modal-header">
              <h2>{gameRules.title}</h2>
              <button
                className="info-close-btn"
                onClick={() => setShowInfo(false)}
              >
                ✕
              </button>
            </div>

            <div className="info-modal-body">
              <div className="info-section">
                <h3>Card Types</h3>
                <p>{gameRules.cardTypes}</p>
              </div>

              <div className="info-section">
                <h3>Answer Matching</h3>
                <p>{gameRules.answerEvaluation}</p>
              </div>

              <div className="info-section">
                <h3>Current Filters</h3>
                <p>{gameRules.currentFilters}</p>
              </div>
            </div>

            <div className="info-modal-footer">
              <button
                className="premium-btn"
                onClick={() => setShowInfo(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
