import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { useGameContext } from '../../hooks/useGameContext';
import { generateRandomThematicSeed } from '../../utils/random';
import { copyToClipboard } from '../../utils/clipboard';
import { Users, Hash, Play, X, Copy, Check, Eye, EyeOff, Crown } from 'lucide-react';
import './MultiplayerLobby.scss';

const GAME_MODES = [
  { path: '/', name: 'Classic Wordle' },
  { path: '/pic-guesser', name: 'Pic Guesser' },
  { path: '/investigatordle', name: 'Investigatordle' },
  { path: '/random-trivia', name: 'Random Trivia' },
  { path: '/story-guesser', name: 'Story Guesser' },
  { path: '/trait-guesser', name: 'Trait Guesser' },
  { path: '/flavour-guesser', name: 'Flavour Guesser' },
  { path: '/campaign-pack-guesser', name: 'Campaign Pack Guesser' },
  { path: '/icon-guesser', name: 'Icon Guesser' },
  { path: '/guess-card-by-trait', name: 'Guess Card By Trait' },
  { path: '/count-guesser', name: 'Count Guesser' },
  { path: '/true-or-false', name: 'True Or False' },
];

export default function MultiplayerLobby() {
  const navigate = useNavigate();
  const { 
    isMultiplayer, 
    isHost, 
    roomCode, 
    players, 
    hostGame, 
    joinGame, 
    leaveGame, 
    myId,
    broadcastNavigate,
    kickPlayer,
    error
  } = useMultiplayer();
  const { settings, setSettings } = useGameContext();
  
  const [joinInput, setJoinInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('/');
  const [codeCopied, setCodeCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showScoringConfig, setShowScoringConfig] = useState(false);
  const [showGameModes, setShowGameModes] = useState(true);

  const updateScoringConfig = (
    category: 'wordle' | 'retry' | 'retryPenalty' | 'singleAttempt',
    key: string | number,
    value: number
  ) => {
    setSettings({
      ...settings,
      scoringConfig: {
        ...settings.scoringConfig,
        [category]: {
          ...((settings.scoringConfig[category] || {}) as Record<string, number>),
          [key]: value
        }
      }
    });
  };

  const allPlayedModes = Array.from(new Set(players.flatMap(p => Object.keys(p.modeScores || {})))).sort();

  useEffect(() => {
    if (error) setJoining(false);
  }, [error]);

  const handleCopyCode = async () => {
    if (!roomCode) return;
    const success = await copyToClipboard(roomCode);
    if (success) {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, playerName: e.target.value });
  };

  const handleHost = () => {
    const code = generateRandomThematicSeed();
    hostGame(code);
  };

  const handleJoin = () => {
    if (joinInput.trim()) {
      setJoining(true);
      joinGame(joinInput.trim());
    }
  };

  const handleStart = () => {
    if (isHost && selectedMode) {
      broadcastNavigate(selectedMode);
      navigate(selectedMode);
    }
  };

  if (!isMultiplayer) {
    return (
      <div className="multiplayer-lobby-container">
        <div className="lobby-panel glass-panel">
          <div className="lobby-header">
            <Users size={28} />
            <h1>Multiplayer Room</h1>
          </div>

          <div className="lobby-form">
            <label className="lobby-label" htmlFor="player-name-input">Player Name</label>
            <input
              id="player-name-input"
              type="text"
              className="lobby-input"
              placeholder="Enter your name"
              value={settings.playerName || ''}
              onChange={handleNameChange}
            />
          </div>

          <div className="lobby-actions">
            <div className="action-card">
              <h3>Host a Game</h3>
              <p>Create a new room and invite your friends to join.</p>
              <button className="premium-btn action-btn" onClick={handleHost}>
                Create Room
              </button>
            </div>

            <div className="action-card">
              <h3>Join a Game</h3>
              <p>Enter a room code from your friend to join their game.</p>
              <div className="join-input-row">
                <div className="join-input-wrapper">
                  <Hash size={16} className="input-icon" />
                  <input
                    type="text"
                    className="lobby-input"
                    placeholder="Enter room code"
                    value={joinInput}
                    onChange={(e) => { setJoinInput(e.target.value); setJoining(false); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    disabled={joining}
                  />
                </div>
                <button
                  className="premium-btn join-btn"
                  onClick={handleJoin}
                  disabled={!joinInput.trim() || joining}
                >
                  {joining ? <><span className="btn-spinner" />Joining...</> : 'Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="multiplayer-lobby-container">
      <div className={`glass-panel lobby-panel ${isHost ? 'host-panel' : ''}`}>
        <div className="lobby-header connected">
          <div>
            <h1>Room Lobby</h1>
            <div className="room-code-row">
              <p className="room-code-display">Code: <strong>{showCode ? roomCode : '••••••••'}</strong></p>
              <button
                className="toggle-code-visibility-btn"
                onClick={() => setShowCode(!showCode)}
                title={showCode ? "Hide room code" : "Show room code"}
              >
                {showCode ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                className={`copy-code-btn ${codeCopied ? 'copied' : ''}`}
                onClick={handleCopyCode}
                title="Copy room code"
              >
                {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <button className="premium-btn delete-btn" onClick={leaveGame}>
            Leave Room
          </button>
        </div>

        <div className="lobby-content connected-layout">
          <div className="scoreboard-section">
            <div className="section-header">
              <h3>Leaderboard ({players.length} Players)</h3>
              {isHost && (
                <button className="toggle-modes-btn" onClick={() => setShowGameModes(!showGameModes)}>
                  {showGameModes ? 'Hide Controls' : 'Show Controls'}
                </button>
              )}
            </div>
            <div className="table-responsive">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Total</th>
                    {allPlayedModes.map(m => <th key={m}>{m}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => {
                    const totalScore = Object.values(p.modeScores || {}).reduce((sum, score) => sum + score, 0);
                    return (
                      <tr key={p.id} className={p.id === myId ? 'current-player-row' : ''}>
                        <td>
                          <div className="player-cell-content">
                            <span className="player-name-text">
                              {p.name} {p.id === myId && "(You)"}
                            </span>
                            {p.id === players[0]?.id && (
                              <span className="host-badge">
                                <Crown size={10} fill="currentColor" /> HOST
                              </span>
                            )}
                            {isHost && p.id !== myId && (
                              <button className="lobby-kick-btn" onClick={() => kickPlayer(p.id)} title="Kick player">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="total-score">{totalScore}</td>
                        {allPlayedModes.map(m => (
                          <td key={m}>{p.modeScores?.[m] || 0}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {(!isHost || showGameModes) && (
            <div className="game-controls-section">
              {isHost ? (
                <>
                  <div className="section-header">
                    <h3>Select Game Mode</h3>
                  </div>

                <div className="host-lobby-notice">
                  <p>💡 <strong>Note:</strong> All players will automatically sync and use your host seed settings. Please make sure that all players have the <strong>Campaign Cards</strong> toggle in settings matched.</p>
                </div>

                <div className="scoring-config-section glass-panel mt-1rem mb-1rem">
                  <button className="collapse-btn" onClick={() => setShowScoringConfig(!showScoringConfig)}>
                    {showScoringConfig ? 'Hide Scoring Settings' : 'Configure Scoring Rules'}
                  </button>
                  {showScoringConfig && (
                    <div className="scoring-config-content mt-1rem">
                      <h4>Wordle & Investigatordle Scoring</h4>
                      <p className="scoring-description">These settings apply to both Classic Wordle and Investigatordle game modes.</p>
                      <div className="scoring-grid">
                        {[1, 2, 3, 4, 5, 6].map(guess => (
                          <div key={guess} className="scoring-field">
                            <label>Guess {guess}</label>
                            <input type="number" min="0" value={settings.scoringConfig.wordle[guess] || 0} onChange={(e) => updateScoringConfig('wordle', guess, parseInt(e.target.value) || 0)} />
                          </div>
                        ))}
                      </div>

                      <h4>Retry Scoring</h4>
                      <p className="scoring-description">Configure the maximum score and the penalty deducted for each wrong guess per game.</p>
                      <div className="retry-scoring-list">
                        {Object.entries(settings.scoringConfig.retry).map(([game, maxVal]) => {
                          const gameKey = game as keyof typeof settings.scoringConfig.retry;
                          const penaltyVal = settings.scoringConfig.retryPenalty[gameKey] !== undefined
                            ? settings.scoringConfig.retryPenalty[gameKey]
                            : 1;

                          const formattedGameName = game
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());

                          return (
                            <div key={game} className="retry-game-row glass-panel">
                              <span className="retry-game-name">{formattedGameName}</span>
                              <div className="retry-fields-container">
                                <div className="scoring-field">
                                  <label>Max Points</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={maxVal}
                                    onChange={(e) => updateScoringConfig('retry', game, parseInt(e.target.value) || 0)}
                                  />
                                </div>
                                <div className="scoring-field">
                                  <label>Penalty Per Error</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={penaltyVal}
                                    onChange={(e) => updateScoringConfig('retryPenalty', game, parseInt(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <h4>Single Attempt Scoring (Fixed points)</h4>
                      <div className="scoring-grid">
                        {Object.entries(settings.scoringConfig.singleAttempt).map(([game, val]) => (
                          <div key={game} className="scoring-field">
                            <label>{game}</label>
                            <input type="number" min="0" value={val} onChange={(e) => updateScoringConfig('singleAttempt', game, parseInt(e.target.value) || 0)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {showGameModes && (
                  <div className="game-modes-grid">
                    {GAME_MODES.map(mode => (
                      <button
                        key={mode.path}
                        className={`mode-btn ${selectedMode === mode.path ? 'selected' : ''}`}
                        onClick={() => setSelectedMode(mode.path)}
                      >
                        {mode.name}
                      </button>
                    ))}
                  </div>
                )}

                <div className="start-action">
                  <button 
                    className="premium-btn start-btn full-width" 
                    onClick={handleStart}
                    disabled={!selectedMode}
                  >
                    <Play fill="currentColor" size={20} />
                    START GAME
                  </button>
                </div>
              </>
            ) : (
              <div className="waiting-screen">
                <div className="spinner large"></div>
                <h2>Waiting for Host to start the game...</h2>
                <p>The host is currently selecting a game mode.</p>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
