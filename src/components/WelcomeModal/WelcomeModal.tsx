import { X, Sparkles, Settings } from "lucide-react";
import "./WelcomeModal.scss";

interface WelcomeModalProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function WelcomeModal({ onClose, onOpenSettings }: WelcomeModalProps) {
  return (
    <div className="modal-overlay welcome-modal-overlay" onClick={onClose}>
      <div className="modal-content welcome-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-icon">
            <Sparkles className="icon-sparkle" size={24} />
            <h2>Welcome to Arkhamdle! <small className="version-tag">v1.0</small></h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body welcome-body">
          <p className="welcome-text highlight">
            Greetings, Investigator! You've found the ultimate place to test your sanity... I mean, your card knowledge.
          </p>
          
          <div className="welcome-section">
            <h3>🌌 Not Your Average Daily</h3>
            <p>
              Unlike those other "daily" games that leave you hanging for 24 hours, Arkhamdle is an <strong>endless buffet</strong> of cosmic puzzles. 
              Play as many games as you want, as often as you want! No cooldowns, just pure, unadulterated card-guessing madness.
            </p>
          </div>

          <div className="welcome-section">
            <h3>⚠️ Safety Warning</h3>
            <p>
              Please note: excessive play might lead to temporary madness, seeing tentacles in your breakfast, 
              or an uncontrollable urge to buy even more card sleeves. Don't get <em>too</em> addicted — 
              we're not responsible for any trauma caused by failing to guess a 0-cost event from 2017.
            </p>
          </div>

          <div className="welcome-section">
            <h3>💬 Feedback & Bugs</h3>
            <p>
              Got ideas or found a bug? We'd love to hear it! You can reach us at <a href="mailto:feedback@arkhamdle.com">feedback@arkhamdle.com</a>, 
              but raising an issue on <a href="https://github.com/bulaxy/arkhamdle" target="_blank" rel="noopener noreferrer">GitHub</a> is <strong>greatly preferred</strong> for bug reports.
            </p>
          </div>

          <div className="welcome-section pro-tip">
            <h3>⚙️ Pro Tip</h3>
            <p>
              Before you dive into the abyss, you might want to visit the <strong>Settings</strong> to select the card packs you actually own. 
              You'll also find the Feedback and GitHub links there whenever you need them!
            </p>
            <button className="settings-shortcut-btn" onClick={() => { onOpenSettings(); onClose(); }}>
              <Settings size={18} /> Open Settings
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="premium-btn start-btn" onClick={onClose}>
            Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
}
