import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Realtime, type RealtimeChannel, type Message, type PresenceMessage } from 'ably';
import type { AppSettings, MultiplayerPlayer } from '../types';
import { useGameContext } from '../hooks/useGameContext';
import { generateRandomThematicSeed } from '../utils/random';
import { calculateGameScore } from '../utils/scoring';

interface PlayerPresenceData {
  name: string;
  score: number;
  modeScores: Record<string, number>;
  ready: boolean;
  isHost: boolean;
}

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

  const ablyRef = useRef<Realtime | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const playersRef = useRef(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const applySeedRef = useRef(applySeed);
  useEffect(() => {
    applySeedRef.current = applySeed;
  }, [applySeed]);

  const roomSettingsRef = useRef(roomSettings);
  useEffect(() => {
    roomSettingsRef.current = roomSettings;
  }, [roomSettings]);

  const sharedGameDataRef = useRef(sharedGameData);
  useEffect(() => {
    sharedGameDataRef.current = sharedGameData;
  }, [sharedGameData]);

  const randomTriviaGameModeRef = useRef(randomTriviaGameMode);
  useEffect(() => {
    randomTriviaGameModeRef.current = randomTriviaGameMode;
  }, [randomTriviaGameMode]);

  // Helper to safely get the player name
  const getPlayerName = useCallback(() => settingsRef.current.playerName || 'Anonymous Investigator', []);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.presence.leave();
        channelRef.current.unsubscribe();
      } catch (e) {
        console.warn('Error during channel cleanup:', e);
      }
      channelRef.current = null;
    }
    if (ablyRef.current) {
      try {
        ablyRef.current.close();
      } catch (e) {
        console.warn('Error during Ably client close:', e);
      }
      ablyRef.current = null;
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
  }, []);

  const leaveGame = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const syncPresence = useCallback(async (channel: RealtimeChannel) => {
    try {
      const members = await channel.presence.get();
      const uniquePlayersMap = new Map<string, MultiplayerPlayer>();

      for (const m of members as PresenceMessage[]) {
        if (!m.clientId) continue;
        const data = m.data as PlayerPresenceData | undefined;
        const player: MultiplayerPlayer = {
          id: m.clientId,
          name: data?.name || 'Anonymous Investigator',
          score: data?.score || 0,
          modeScores: data?.modeScores || {},
          ready: data?.ready || false,
          isHost: data?.isHost || false
        };

        const existing = uniquePlayersMap.get(m.clientId);
        if (!existing || (!existing.ready && player.ready) || (player.score > existing.score)) {
          uniquePlayersMap.set(m.clientId, player);
        }
      }

      const mappedPlayers = Array.from(uniquePlayersMap.values());

      mappedPlayers.sort((a, b) => {
        const aIsHost = a.id === roomCode || a.isHost;
        const bIsHost = b.id === roomCode || b.isHost;
        if (aIsHost && !bIsHost) return -1;
        if (!aIsHost && bIsHost) return 1;
        return a.id.localeCompare(b.id);
      });

      setPlayers(mappedPlayers);
    } catch (err) {
      console.error('Error fetching presence members:', err);
    }
  }, [roomCode]);

  const subscribeToMessages = useCallback((channel: RealtimeChannel, localId: string, currentIsHost: boolean) => {
    channel.subscribe((msg: Message) => {
      if (msg.clientId === localId) return;

      const type = msg.name;
      const payload = msg.data;

      if (type === 'GAME_START') {
        // Reset our own ready state in presence
        const myPlayer = playersRef.current.find(p => p.id === localId);
        channel.presence.update({
          name: getPlayerName(),
          score: myPlayer ? myPlayer.score : 0,
          modeScores: myPlayer ? myPlayer.modeScores : {},
          ready: false,
          isHost: currentIsHost
        });

        if (!currentIsHost) {
          const newRoomSettings = payload.settings;
          setRoomSettings(newRoomSettings);
          setSharedGameData(null);
          setRandomTriviaGameModeState(null);
          if (newRoomSettings?.seed) {
            applySeedRef.current(newRoomSettings.seed);
          }
        }
      } else if (type === 'NAVIGATE') {
        const myPlayer = playersRef.current.find(p => p.id === localId);
        channel.presence.update({
          name: getPlayerName(),
          score: myPlayer ? myPlayer.score : 0,
          modeScores: myPlayer ? myPlayer.modeScores : {},
          ready: false,
          isHost: currentIsHost
        });

        const { path } = payload;
        window.dispatchEvent(new CustomEvent('MULTIPLAYER_NAVIGATE', { detail: { path } }));
      } else if (type === 'SYNC_GAME_DATA') {
        setSharedGameData(payload);
      } else if (type === 'RANDOM_TRIVIA_MODE_SYNC') {
        setRandomTriviaGameModeState(payload);
      } else if (type === 'KICK') {
        if (payload.targetId === localId) {
          alert('You have been removed from the room by the host.');
          cleanup();
        }
      } else if (type === 'ROOM_STATE_SYNC') {
        if (!currentIsHost) {
          setRoomSettings(payload.settings);
          setSharedGameData(payload.sharedGameData);
          setRandomTriviaGameModeState(payload.randomTriviaGameMode);
          if (payload.settings?.seed) {
            applySeedRef.current(payload.settings.seed);
          }
        }
      }
    });
  }, [cleanup, getPlayerName]);

  useEffect(() => {
    if (!isMultiplayer || !channelRef.current || !myId) return;
    const myPlayer = players.find(p => p.id === myId);
    if (!myPlayer) return;

    const currentName = getPlayerName();
    if (myPlayer.name !== currentName) {
      channelRef.current.presence.update({
        name: currentName,
        score: myPlayer.score,
        modeScores: myPlayer.modeScores,
        ready: myPlayer.ready,
        isHost: isHost
      });
    }
  }, [settings.playerName, isMultiplayer, myId, players, isHost, getPlayerName]);

  const hostGame = (rawCode: string) => {
    cleanup();

    const code = rawCode.toLowerCase();
    const hostId = 'p_' + Math.random().toString(36).substring(2, 11);

    const client = new Realtime({
      authUrl: '/api/ably-token',
      clientId: hostId
    });

    ablyRef.current = client;
    setMyId(hostId);

    client.connection.on('connected', () => {
      setIsMultiplayer(true);
      setIsHost(true);
      setRoomCode(code);

      const channel = client.channels.get(`room:${code}`);
      channelRef.current = channel;

      // Subscribe to all presence events
      channel.presence.subscribe(() => {
        syncPresence(channel);
      });

      // Send current state to newly joined players
      channel.presence.subscribe('enter', (member) => {
        if (member.clientId !== hostId) {
          channel.publish('ROOM_STATE_SYNC', {
            settings: roomSettingsRef.current || settingsRef.current,
            sharedGameData: sharedGameDataRef.current,
            randomTriviaGameMode: randomTriviaGameModeRef.current
          });
        }
      });

      subscribeToMessages(channel, hostId, true);

      // Enter Presence
      channel.presence.enter({
        name: getPlayerName(),
        score: 0,
        modeScores: {},
        ready: false,
        isHost: true
      });

      setRoomSettings(settings);
    });

    client.connection.on('failed', (stateChange: { reason?: { message: string; code: number } }) => {
      const reason = stateChange?.reason;
      let errMsg = 'Failed to connect to the multiplayer server.';
      if (reason) {
        errMsg += ` Reason: ${reason.message} (Code: ${reason.code})`;
      }
      setError(errMsg);
      alert(errMsg);
      cleanup();
    });
  };

  // ---------------------------------------------------------
  // CLIENT LOGIC
  // ---------------------------------------------------------
  const joinGame = (rawCode: string) => {
    cleanup();

    const code = rawCode.toLowerCase();
    const clientId = 'p_' + Math.random().toString(36).substring(2, 11);

    const client = new Realtime({
      authUrl: '/api/ably-token',
      clientId: clientId
    });

    ablyRef.current = client;
    setMyId(clientId);

    client.connection.on('connected', () => {
      setIsMultiplayer(true);
      setIsHost(false);
      setRoomCode(code);

      const channel = client.channels.get(`room:${code}`);
      channelRef.current = channel;

      channel.presence.subscribe(() => {
        syncPresence(channel);
      });

      subscribeToMessages(channel, clientId, false);

      channel.presence.enter({
        name: getPlayerName(),
        score: 0,
        modeScores: {},
        ready: false,
        isHost: false
      });
    });

    client.connection.on('failed', (stateChange: { reason?: { message: string; code: number } }) => {
      const reason = stateChange?.reason;
      let errMsg = 'Failed to connect to the multiplayer server.';
      if (reason) {
        errMsg += ` Reason: ${reason.message} (Code: ${reason.code})`;
      }
      setError(errMsg);
      alert(errMsg);
      cleanup();
    });
  };

  const reportGameStats = useCallback((rawStats: { mode: string; solved: boolean; guesses?: number; wrongGuesses?: number; isMultipleChoice?: boolean; subMode?: string }) => {
    let stats = { ...rawStats };
    if (window.location.pathname.includes('/random-trivia')) {
      stats = {
        ...stats,
        subMode: stats.subMode || stats.mode,
        mode: 'Random Trivia'
      };
    }

    const activeSettings = roomSettingsRef.current || settingsRef.current;
    const calculatedScore = calculateGameScore(stats, activeSettings.scoringConfig);

    const myPlayer = playersRef.current.find(p => p.id === myId);
    if (!myPlayer || !channelRef.current) return;

    const newModeScores = { ...myPlayer.modeScores };
    newModeScores[stats.mode] = (newModeScores[stats.mode] || 0) + calculatedScore;

    channelRef.current.presence.update({
      name: getPlayerName(),
      score: myPlayer.score + calculatedScore,
      modeScores: newModeScores,
      ready: myPlayer.ready,
      isHost: isHost
    });
  }, [myId, getPlayerName, isHost]);

  const reportReady = useCallback(() => {
    const myPlayer = playersRef.current.find(p => p.id === myId);
    if (!myPlayer || !channelRef.current) return;

    channelRef.current.presence.update({
      name: getPlayerName(),
      score: myPlayer.score,
      modeScores: myPlayer.modeScores,
      ready: true,
      isHost: isHost
    });
  }, [myId, getPlayerName, isHost]);

  const broadcastGameStart = useCallback((mode: string, answer: unknown, newSettings: AppSettings) => {
    setRoomSettings(newSettings);
    setSharedGameData(null);
    setRandomTriviaGameModeState(null);

    const myPlayer = playersRef.current.find(p => p.id === myId);
    if (myPlayer && channelRef.current) {
      channelRef.current.presence.update({
        name: getPlayerName(),
        score: myPlayer.score,
        modeScores: myPlayer.modeScores,
        ready: false,
        isHost: isHost
      });
    }

    if (channelRef.current) {
      channelRef.current.publish('GAME_START', {
        mode,
        answer,
        settings: newSettings
      });
    }
  }, [myId, getPlayerName, isHost]);

  const broadcastNavigate = useCallback((path: string) => {
    setSharedGameData(null);
    setRandomTriviaGameModeState(null);

    if (channelRef.current) {
      channelRef.current.publish('SYNC_GAME_DATA', null);
      channelRef.current.publish('RANDOM_TRIVIA_MODE_SYNC', null);
    }

    const myPlayer = playersRef.current.find(p => p.id === myId);
    if (myPlayer && channelRef.current) {
      channelRef.current.presence.update({
        name: getPlayerName(),
        score: myPlayer.score,
        modeScores: myPlayer.modeScores,
        ready: false,
        isHost: isHost
      });
    }

    if (channelRef.current) {
      channelRef.current.publish('NAVIGATE', { path });
    }
  }, [myId, getPlayerName, isHost]);

  const broadcastGameData = useCallback((data: unknown) => {
    setSharedGameData(data);
    if (channelRef.current) {
      channelRef.current.publish('SYNC_GAME_DATA', data);
    }
  }, []);

  const setRandomTriviaGameMode = useCallback((mode: string | null) => {
    setRandomTriviaGameModeState(mode);
    if (isMultiplayer && isHost && channelRef.current) {
      channelRef.current.publish('RANDOM_TRIVIA_MODE_SYNC', mode);
    }
  }, [isMultiplayer, isHost]);

  const kickPlayer = useCallback((playerId: string) => {
    if (!isHost || !channelRef.current) return;
    channelRef.current.publish('KICK', { targetId: playerId });
  }, [isHost]);

  const startNextRound = useCallback(() => {
    if (!isHost || !channelRef.current) return;
    const newSeed = generateRandomThematicSeed();
    const newSettings = { ...settingsRef.current, seed: newSeed };
    applySeedRef.current(newSeed);

    setSharedGameData(null);
    setRandomTriviaGameModeState(null);

    const myPlayer = playersRef.current.find(p => p.id === myId);
    if (myPlayer) {
      channelRef.current.presence.update({
        name: getPlayerName(),
        score: myPlayer.score,
        modeScores: myPlayer.modeScores,
        ready: false,
        isHost: isHost
      });
    }

    channelRef.current.publish('GAME_START', {
      mode: 'same',
      answer: null,
      settings: newSettings
    });
  }, [isHost, myId, getPlayerName]);

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
  }, [isMultiplayer, reportGameStats, reportReady]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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
