import { useState } from 'react';
import { Users, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { copyToClipboard } from '../../utils/clipboard';
import './MultiplayerHUD.scss';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MultiplayerHUD() {
  const { isMultiplayer, isHost, roomCode, players, myId, error, broadcastNavigate } = useMultiplayer();
  const location = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  if (!isMultiplayer) return null;

  const handleReturnToLobby = () => {
    const proceed = window.confirm(`Are you sure you want to return to the lobby? This will kick everyone back to the lobby.`);
    if (!proceed) return;
    broadcastNavigate('/multiplayer');
    navigate('/multiplayer');
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="multiplayer-hud">
      <div className="hud-header">
        <div className="title">
          <Users size={16} />
          <span>Multiplayer {isHost && "(Host)"}</span>
        </div>
        <div className="room-code-group">
          <div
            className={`room-code-badge ${copied ? 'copied' : ''}`}
            onClick={handleCopyCode}
            title="Copy Room Code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : (showCode ? roomCode : '••••••••')}
          </div>
          <button
            className="toggle-code-visibility-btn"
            onClick={() => setShowCode(!showCode)}
            title={showCode ? "Hide Room Code" : "Show Room Code"}
          >
            {showCode ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="hud-error">
          {error}
        </div>
      )}

      <div className="hud-leaderboard">
        {[...players].sort((a, b) => b.score - a.score).map((p, idx) => (
          <div key={p.id} className={`player-row ${p.id === myId ? 'is-me' : ''}`}>
            <div className="player-rank">{idx + 1}</div>
            <div className="player-name">
              {p.name} {p.id === myId && "(You)"}
            </div>
            <div className="player-status">
              {p.ready && <span className="ready-badge">Ready</span>}
            </div>
            <div className="player-score">{p.score}</div>
          </div>
        ))}
      </div>
      
      {isHost && location.pathname !== '/multiplayer' && (
        <div className="hud-actions">
          <button className="premium-btn small-btn full-width" onClick={handleReturnToLobby}>
            Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}
