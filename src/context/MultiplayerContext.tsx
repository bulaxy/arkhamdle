import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type { AppSettings, MultiplayerMessage, MultiplayerPlayer, GameStats } from '../types';
import { useGameContext } from '../hooks/useGameContext';
import { generateRandomThematicSeed } from '../utils/random';
import { calculateGameScore } from '../utils/scoring';

interface MultiplayerContextState {
  isMultiplayer: boolean;
  isHost: boolean;
  myId: string | null;
  roomCode: string | null;
  players: MultiplayerPlayer[];
  roomSettings: AppSettings | null;
  hostGame: (code: string) => void;
  joinGame: (code: string) => void;
  leaveGame: () => void;
  reportGameStats: (stats: { mode: string; solved: boolean; guesses?: number; wrongGuesses?: number; isMultipleChoice?: boolean; subMode?: string }) => void;
  reportReady: () => void;
  broadcastGameStart: (mode: string, answer: unknown, settings: AppSettings) => void;
  broadcastNavigate: (path: string) => void;
  sharedGameData: unknown;
  broadcastGameData: (data: unknown) => void;
  kickPlayer: (playerId: string) => void;
  startNextRound: () => void;
  error: string | null;
  randomTriviaGameMode: string | null;
  setRandomTriviaGameMode: (mode: string | null) => void;
}

const MultiplayerContext = createContext<MultiplayerContextState | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
};

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, applySeed } = useGameContext();
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<MultiplayerPlayer[]>([]);
  const [roomSettings, setRoomSettings] = useState<AppSettings | null>(null);
  const [sharedGameData, setSharedGameData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [randomTriviaGameMode, setRandomTriviaGameModeState] = useState<string | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const hostConnectionRef = useRef<DataConnection | null>(null);

  // Helper to safely get the player name
  const getPlayerName = () => settings.playerName || 'Anonymous Investigator';

  const cleanup = () => {
    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current.clear();
    if (hostConnectionRef.current) {
      hostConnectionRef.current.close();
      hostConnectionRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setIsMultiplayer(false);
    setIsHost(false);
    setRoomCode(null);
    setPlayers([]);
    setRoomSettings(null);
    setSharedGameData(null);
    setRandomTriviaGameModeState(null);
    setError(null);
    setMyId(null);
  };

  const leaveGame = () => {
    cleanup();
  };

  const peerConfig = {
    pingInterval: 10000,
    debug: 3,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  };

  const broadcast = useCallback((msg: MultiplayerMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }, []);

  const setRandomTriviaGameMode = useCallback((mode: string | null) => {
    setRandomTriviaGameModeState(mode);
    if (isMultiplayer && isHost) {
      broadcast({
        type: 'RANDOM_TRIVIA_MODE_SYNC',
        payload: mode
      });
    }
  }, [isMultiplayer, isHost, broadcast]);

  // ---------------------------------------------------------
  // HOST LOGIC
  // ---------------------------------------------------------
  const hostGame = (rawCode: string) => {
    cleanup();
    
    const code = rawCode.toLowerCase();
    const newPeer = new Peer(code, peerConfig);
    peerRef.current = newPeer;
    
    newPeer.on('open', (id) => {
      setMyId(id);
      setIsMultiplayer(true);
      setIsHost(true);
      setRoomCode(id);
      
      // Add self to players
      const hostPlayer: MultiplayerPlayer = {
        id: id,
        name: getPlayerName(),
        score: 0,
        modeScores: {},
        ready: false
      };
      setPlayers([hostPlayer]);
      setRoomSettings(settings); // Host initializes room settings from their own
    });

    newPeer.on('connection', (conn) => {
      const handleOpen = () => {
        console.log('[Multiplayer] Host: DataConnection opened with client:', conn.peer);
        connectionsRef.current.set(conn.peer, conn);
        // Force a heartbeat packet to unblock DataChannel buffer if needed
        conn.send({ type: 'SETTINGS_UPDATE', payload: { name: 'HOST_ACK' } } as MultiplayerMessage);
      };

      if (conn.open) {
        handleOpen();
      } else {
        conn.on('open', handleOpen);
      }

      conn.on('error', (err) => {
        console.error('Host DataConnection Error:', err);
      });

      conn.on('data', (data: unknown) => {
        handleMessageFromClient(conn.peer, data as MultiplayerMessage);
      });

      conn.on('close', () => {
        connectionsRef.current.delete(conn.peer);
        setPlayers(prev => {
          const updated = prev.filter(p => p.id !== conn.peer);
          broadcast({ type: 'LEADERBOARD_UPDATE', payload: updated });
          return updated;
        });
      });

      // Debug ICE connection state
      if (conn.peerConnection) {
        conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
          console.log(`[Multiplayer] Host ICE state with ${conn.peer}:`, conn.peerConnection?.iceConnectionState);
        });
      }
    });

    newPeer.on('disconnected', () => {
      console.log('Host disconnected from signaling server, attempting to reconnect...');
      newPeer.reconnect();
    });

    newPeer.on('error', (err: unknown) => {
      console.error('PeerJS Host Error:', err);
      const errorType = (err as Record<string, unknown>).type;
      const errMsg = `Host error: ${errorType}`;
      setError(errMsg);
      alert(errMsg);
      cleanup();
    });
  };

  const handleMessageFromClient = (clientId: string, msg: MultiplayerMessage) => {
    if (msg.type === 'SETTINGS_UPDATE') {
      // Used by clients initially to send their name
      const payload = msg.payload as { name: string } | undefined;
      const name = payload?.name || 'Unknown';
      setPlayers(prev => {
        const exists = prev.find(p => p.id === clientId);
        if (exists) return prev;
        const newPlayers = [...prev, { id: clientId, name, score: 0, modeScores: {}, ready: false }];
        broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
        return newPlayers;
      });
    } else if (msg.type === 'STATS_UPDATE') {
      const stats = (msg.payload || {}) as GameStats;
      const calculatedScore = calculateGameScore(stats, settings.scoringConfig);
      
      setPlayers(prev => {
        const newPlayers = prev.map(p => {
          if (p.id === clientId) {
            const modeScores = { ...p.modeScores };
            modeScores[stats.mode] = (modeScores[stats.mode] || 0) + calculatedScore;
            return { ...p, score: p.score + calculatedScore, modeScores };
          }
          return p;
        });
        broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
        return newPlayers;
      });
    }
    else if (msg.type === 'PLAYER_READY') {
      setPlayers(prev => {
        const newPlayers = prev.map(p => 
          p.id === clientId ? { ...p, ready: true } : p
        );
        broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
        return newPlayers;
      });
    }
  };

  const startNextRound = useCallback(() => {
    if (!isHost) return;
    const newSeed = generateRandomThematicSeed();
    const newSettings = { ...settings, seed: newSeed };
    applySeed(newSeed);
    
    setSharedGameData(null);
    setPlayers(prev => {
      const newPlayers = prev.map(p => ({ ...p, ready: false }));
      broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
      return newPlayers;
    });

    broadcast({
      type: 'GAME_START',
      payload: { mode: 'same', answer: null, settings: newSettings }
    });
  }, [isHost, settings, applySeed, broadcast]);

  const broadcastGameStart = (mode: string, answer: unknown, newSettings: AppSettings) => {
    setRoomSettings(newSettings);
    setSharedGameData(null); // Clear game data for the new round
    setRandomTriviaGameModeState(null);
    // Reset ready states for next round
    setPlayers(prev => {
      const newPlayers = prev.map(p => ({ ...p, ready: false }));
      broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
      return newPlayers;
    });

    broadcast({
      type: 'GAME_START',
      payload: { mode, answer, settings: newSettings }
    });
  };

  const broadcastNavigate = useCallback((path: string) => {
    setSharedGameData(null); // Clear host's shared game data
    setRandomTriviaGameModeState(null);
    broadcast({
      type: 'SYNC_GAME_DATA',
      payload: null
    }); // Clear all clients' shared game data
    broadcast({
      type: 'RANDOM_TRIVIA_MODE_SYNC',
      payload: null
    }); // Clear all clients' random trivia mode

    setPlayers(prev => {
      const newPlayers = prev.map(p => ({ ...p, ready: false }));
      broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
      return newPlayers;
    });

    broadcast({
      type: 'NAVIGATE',
      payload: { path }
    });
  }, [broadcast]);

  const broadcastGameData = useCallback((data: unknown) => {
    setSharedGameData(data);
    broadcast({
      type: 'SYNC_GAME_DATA',
      payload: data
    });
  }, [broadcast]);

  // ---------------------------------------------------------
  // CLIENT LOGIC
  // ---------------------------------------------------------
  const joinGame = (rawCode: string) => {
    cleanup();

    const code = rawCode.toLowerCase();
    const newPeer = new Peer(peerConfig); // Random ID for client
    peerRef.current = newPeer;

    newPeer.on('open', (id) => {
      setMyId(id);
      // Slight delay to ensure PeerServer and local ICE gatherers are fully stabilized
      setTimeout(() => {
        const conn = newPeer.connect(code);
        hostConnectionRef.current = conn;

        const handleOpen = () => {
          console.log('[Multiplayer] Client: DataConnection opened with host:', code);
          setIsMultiplayer(true);
          setIsHost(false);
          setRoomCode(code);
          
          // Send initial connection data (name)
          conn.send({
            type: 'SETTINGS_UPDATE',
            payload: { name: getPlayerName() }
          } as MultiplayerMessage);
        };

        if (conn.open) {
          handleOpen();
        } else {
          conn.on('open', handleOpen);
        }

        conn.on('error', (err) => {
          console.error('Client DataConnection Error:', err);
        });

        conn.on('data', (data: unknown) => {
          handleMessageFromHost(data as MultiplayerMessage);
        });

        conn.on('close', () => {
          setError('Host disconnected.');
          cleanup();
        });

        // Debug ICE connection state
        if (conn.peerConnection) {
          conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
            console.log('[Multiplayer] Client ICE state:', conn.peerConnection?.iceConnectionState);
          });
        }
      }, 500);
    });

    newPeer.on('disconnected', () => {
      console.log('Client disconnected from signaling server, attempting to reconnect...');
      newPeer.reconnect();
    });

    newPeer.on('error', (err: unknown) => {
      console.error('PeerJS Client Error:', err);
      // 'peer-unavailable' usually means wrong room code
      const errorType = (err as Record<string, unknown>).type;
      const msg = errorType === 'peer-unavailable' 
        ? "Room not found. Please check the code." 
        : `Connection error: ${errorType}`;
      setError(msg);
      alert(msg);
      cleanup();
    });
  };

  const handleMessageFromHost = (msg: MultiplayerMessage) => {
    if (msg.type === 'LEADERBOARD_UPDATE') {
      setPlayers(msg.payload as MultiplayerPlayer[]);
    } else if (msg.type === 'GAME_START') {
      const payload = msg.payload as { settings: AppSettings };
      const newRoomSettings = payload.settings;
      setRoomSettings(newRoomSettings);
      setSharedGameData(null); // Clear previous round's data
      
      // Update local settings with the new room settings (which includes the new seed)
      // This will trigger GameContext to update seedVersion and remount the games!
      if (newRoomSettings?.seed) {
        applySeed(newRoomSettings.seed);
      }
    } else if (msg.type === 'NAVIGATE') {
      const { path } = msg.payload as Record<string, unknown>;
      window.dispatchEvent(new CustomEvent('MULTIPLAYER_NAVIGATE', { detail: { path } }));
    } else if (msg.type === 'SYNC_GAME_DATA') {
      setSharedGameData(msg.payload);
    } else if (msg.type === 'RANDOM_TRIVIA_MODE_SYNC') {
      setRandomTriviaGameModeState(msg.payload as string | null);
    } else if (msg.type === 'KICK') {
      alert('You have been removed from the room by the host.');
      cleanup();
    }
  };

  const reportGameStats = (rawStats: { mode: string; solved: boolean; guesses?: number; wrongGuesses?: number; isMultipleChoice?: boolean; subMode?: string }) => {
    let stats = { ...rawStats };
    // If we are currently playing Random Trivia, rewrite the stats so they are filed under 'Random Trivia'
    // but keep the subMode so the scoring engine calculates the score based on the actual sub-game.
    if (window.location.pathname.includes('/random-trivia')) {
      stats = {
        ...stats,
        subMode: stats.subMode || stats.mode,
        mode: 'Random Trivia'
      };
    }

    if (isHost) {
      const calculatedScore = calculateGameScore(stats, settings.scoringConfig);
      setPlayers(prev => {
        const newPlayers = prev.map(p => {
          if (p.id === peerRef.current?.id) {
            const modeScores = { ...p.modeScores };
            modeScores[stats.mode] = (modeScores[stats.mode] || 0) + calculatedScore;
            return { ...p, score: p.score + calculatedScore, modeScores };
          }
          return p;
        });
        broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
        return newPlayers;
      });
    } else if (hostConnectionRef.current?.open) {
      hostConnectionRef.current.send({
        type: 'STATS_UPDATE',
        payload: stats
      });
    }
  };

  const reportReady = () => {
    if (isHost) {
      setPlayers(prev => {
        const newPlayers = prev.map(p => p.id === peerRef.current?.id ? { ...p, ready: true } : p);
        broadcast({ type: 'LEADERBOARD_UPDATE', payload: newPlayers });
        return newPlayers;
      });
    } else if (hostConnectionRef.current?.open) {
      hostConnectionRef.current.send({
        type: 'PLAYER_READY'
      });
    }
  };

  const kickPlayer = useCallback((playerId: string) => {
    if (!isHost) return;
    const conn = connectionsRef.current.get(playerId);
    if (conn) {
      conn.send({ type: 'KICK' } as MultiplayerMessage);
      setTimeout(() => {
        conn.close();
        connectionsRef.current.delete(playerId);
      }, 200);
    }
    setPlayers(prev => {
      const updated = prev.filter(p => p.id !== playerId);
      broadcast({ type: 'LEADERBOARD_UPDATE', payload: updated });
      return updated;
    });
  }, [isHost, broadcast]);

  useEffect(() => {
    if (!isMultiplayer) return;

    const handleStatsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      reportGameStats(customEvent.detail);
    };
    
    const handleReady = () => {
      reportReady();
    };

    window.addEventListener('MULTIPLAYER_STATS_UPDATE', handleStatsUpdate);
    window.addEventListener('MULTIPLAYER_PLAYER_READY', handleReady);

    return () => {
      window.removeEventListener('MULTIPLAYER_STATS_UPDATE', handleStatsUpdate);
      window.removeEventListener('MULTIPLAYER_PLAYER_READY', handleReady);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMultiplayer, isHost]);

  return (
    <MultiplayerContext.Provider value={{
      isMultiplayer,
      isHost,
      myId,
      roomCode,
      players,
      roomSettings,
      hostGame,
      joinGame,
      leaveGame,
      reportGameStats,
      reportReady,
      broadcastGameStart,
      broadcastNavigate,
      sharedGameData,
      broadcastGameData,
      kickPlayer,
      startNextRound,
      error,
      randomTriviaGameMode,
      setRandomTriviaGameMode
    }}>
      {children}
    </MultiplayerContext.Provider>
  );
};
