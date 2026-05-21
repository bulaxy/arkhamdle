import { useEffect, useState, useCallback } from 'react';
import { useMultiplayer } from '../context/MultiplayerContext';

export function useGameSync<T>() {
  const { isMultiplayer, isHost, sharedGameData, broadcastGameData } = useMultiplayer();
  const [syncedData, setSyncedData] = useState<T | null>(null);

  useEffect(() => {
    if (isMultiplayer && !isHost && sharedGameData) {
      setSyncedData(sharedGameData as T);
    }
  }, [isMultiplayer, isHost, sharedGameData]);

  const syncData = useCallback((data: T) => {
    setSyncedData(data);
    if (isMultiplayer && isHost) {
      broadcastGameData(data);
    }
  }, [isMultiplayer, isHost, broadcastGameData]);

  return { 
    isClientWaiting: isMultiplayer && !isHost && !syncedData, 
    syncedData, 
    syncData, 
    isHost, 
    isMultiplayer 
  };
}
