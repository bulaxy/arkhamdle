import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStats } from '../../context/StatsContext';
import { useMultiplayer } from '../../context/MultiplayerContext';
import './ResultPanel.scss';

export interface ResultPanelProps {
  win: boolean;
  item: { fullName: string; imagesrc?: string; backimagesrc?: string; typeName?: string } | null;
  onPlayAgain: () => void;
  className?: string;
  children?: React.ReactNode;
  showImage?: boolean;
}

export default function ResultPanel({ 
  win, 
  item, 
  onPlayAgain, 
  className = '', 
  children,
  showImage = true
}: ResultPanelProps) {
  const { lastStreakText } = useStats();
  const { isMultiplayer, isHost, roomCode, myId, players, reportReady, startNextRound, broadcastNavigate } = useMultiplayer();
  const [hasReadied, setHasReadied] = useState(false);
  const navigate = useNavigate();

  // The host's ID is always roomCode (or myId on the host itself). Only other players (clients) need to ready up.
  const hostId = roomCode || (isHost ? myId : null);
  const clients = players.filter(p => p.id !== hostId);
  const readyCount = clients.filter(p => p.ready).length;
  const totalCount = clients.length;
  const allReady = totalCount === 0 || readyCount === totalCount;

  // Diagnostic log to understand why counts aren't updating under some scenarios
  console.log('[ResultPanel] players:', players, 'roomCode:', roomCode, 'clients:', clients, 'readyCount:', readyCount, 'totalCount:', totalCount);

  const handleClientReady = () => {
    reportReady();
    setHasReadied(true);
  };

  const handleHostPlayAgain = () => {
    if (!allReady) {
      const proceed = window.confirm(`Only ${readyCount}/${totalCount} players are ready. Start anyway?`);
      if (!proceed) return;
    }
    startNextRound();
  };

  const handleChangeGameMode = () => {
    if (!allReady) {
      const proceed = window.confirm(`Only ${readyCount}/${totalCount} players are ready. Returning to the lobby will kick everyone back to the lobby. Continue anyway?`);
      if (!proceed) return;
    }

    broadcastNavigate('/multiplayer');
    navigate('/multiplayer');
  };

  return (
    <div 
      className={`glass-panel fade-in result-panel ${win ? 'win-border' : 'lose-border'} ${className}`} 
    >
      <h2 className={win ? 'win' : 'lose'}>
        {win ? 'Correct!' : 'Game Over'}
      </h2>
      {lastStreakText && (
        <div className={`streak-text ${win ? '' : 'broken'}`}>
          {lastStreakText}
        </div>
      )}
      {showImage && item?.imagesrc && (
        <div className="result-images">
          <img src={`https://arkhamdb.com${item.imagesrc}`} alt={item.fullName} />
          {item.typeName?.toLowerCase() === 'location' && item.backimagesrc && (
            <img src={`https://arkhamdb.com${item.backimagesrc}`} alt={`${item.fullName} Back`} />
          )}
        </div>
      )}
      <p>{item?.fullName}</p>
      <div className="children-container">
        {children}
      </div>
      {isMultiplayer ? (
        isHost ? (
          <div className="result-actions-group">
            <button className="premium-btn" onClick={handleHostPlayAgain} autoFocus>
              Play Again ({readyCount}/{totalCount} Ready)
            </button>
            <button className="premium-btn secondary" onClick={handleChangeGameMode}>
              Change Game Mode
            </button>
          </div>
        ) : (
          <button
            className={`premium-btn ${hasReadied ? 'ready-sent' : ''}`}
            onClick={handleClientReady}
            disabled={hasReadied}
            autoFocus
          >
            {hasReadied ? '✓ Ready' : 'Ready'}
          </button>
        )
      ) : (
        <button className="premium-btn" onClick={onPlayAgain} autoFocus>
          Play Again
        </button>
      )}
    </div>
  );
}
