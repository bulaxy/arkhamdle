import localforage from "localforage";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { nativeRandom } from "../utils/random";
import { useGameContext } from "../hooks/useGameContext";

interface ModeStats {
  streak: number;
  bestStreak: number;
  wins: number;
  losses: number;
}

interface Stats {
  globalStreak: number;
  globalBestStreak: number;
  modeStats: Record<string, ModeStats>;
}

interface LegacyStats extends Stats {
  modeStreaks?: Record<string, number>;
}

interface StatsContextType {
  stats: Stats;
  reportResult: (modes: string | string[], won: boolean) => void;
  stopStreak: () => void;
  clearRecord: () => void;
  lastStreakText: string | null;
}

const STREAK_TEXTS = [
  "Currently on a {n} win streak",
  "Winning {n} games in a row",
  "My streak just hit {n}",
  "{n} straight wins and counting",
  "Locked in with {n} wins",
  "Riding an {n} game streak",
  "{n} wins without a loss",
  "On a clean {n} streak today",
  "{n} wins back to back",
  "Pushing a {n} game winstreak",
  "{n} straight victories achieved",
  "Still holding a {n} streak",
  "{n} wins deep already",
  "{n} games won consecutively",
  "My winstreak is now {n}",
  "Chasing a {n} win streak",
  "{n} wins and still climbing",
  "Up to {n} wins in a row",
  "Just secured win number {n}",
  "A solid {n} streak so far",
  "{n} straight dubs today",
  "Keeping a {n} win run alive",
  "{n} wins with zero losses",
  "The streak reached {n} today",
  "{n} games unbeaten right now",
  "Maintaining a {n} match streak",
  "Hit a new record of {n} wins",
  "Winning nonstop for {n} games",
  "On fire with {n} straight wins",
  "{n} wins and no slowing down",
  "Extending the streak to {n}",
  "Dominating with {n} consecutive wins",
  "The {n} winstreak feels unreal",
  "Just passed {n} straight wins",
  "A crazy {n} game streak",
  "{n} wins deep at the moment",
  "{n} wins stacked in a row",
  "Building up a {n} streak",
  "{n} victories without defeat",
  "My current streak is {n}",
  "Secured {n} wins consecutively",
  "Reached a massive {n} streak",
  "Grinding through an {n} win run",
  "{n} wins back to back today",
  "Flying through a {n} streak",
  "{n} straight wins feels amazing",
  "Breaking records with {n} wins",
  "{n} wins and still unstoppable",
  "Holding onto a {n} streak",
  "Just reached {n} straight wins",
];

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Stats>({ globalStreak: 0, globalBestStreak: 0, modeStats: {} });
  const { settings } = useGameContext();
  const [lastResult, setLastResult] = useState<{
    won: boolean;
    globalStreak: number;
    targetModeStreak: number;
    targetMode: string;
    templateIndex: number;
  } | null>(null);

  const lastStreakText = useMemo(() => {
    if (!lastResult) return null;
    
    const streakDisplayType = settings?.streakDisplayType || 'global';
    
    if (lastResult.won) {
      const template = STREAK_TEXTS[lastResult.templateIndex];
      if (streakDisplayType === 'mode') {
        const streak = lastResult.targetModeStreak;
        if (streak <= 1) return null;
        return template.replace("{n}", streak.toString()) + ` in ${lastResult.targetMode}`;
      } else {
        const streak = lastResult.globalStreak;
        if (streak <= 1) return null;
        return template.replace("{n}", streak.toString());
      }
    } else {
      if (streakDisplayType === 'mode') {
        const streak = lastResult.targetModeStreak;
        if (streak <= 1) return null;
        return `Streak of ${streak} broken in ${lastResult.targetMode}!`;
      } else {
        const streak = lastResult.globalStreak;
        if (streak <= 1) return null;
        return `Personal combined streak of ${streak} broken!`;
      }
    }
  }, [lastResult, settings?.streakDisplayType]);

  useEffect(() => {
    const loadStats = async () => {
      const savedStats = await localforage.getItem<Stats>("arkhamdle_stats");
      if (savedStats) {
        // Migration check: if old format, convert to new
        if ((savedStats as LegacyStats).modeStreaks && !savedStats.modeStats) {
          const migrated: Stats = {
            globalStreak: savedStats.globalStreak || 0,
            globalBestStreak: savedStats.globalStreak || 0,
            modeStats: {},
          };
          Object.entries((savedStats as LegacyStats).modeStreaks as Record<string, number>).forEach(([mode, streak]) => {
            migrated.modeStats[mode] = { streak, bestStreak: streak, wins: streak, losses: 0 };
          });
          setStats(migrated);
          localforage.setItem("arkhamdle_stats", migrated);
        } else {
          // Check for missing bestStreak in individual modes
          const updatedModeStats = { ...savedStats.modeStats };
          let changed = false;
          Object.keys(updatedModeStats).forEach(mode => {
            if (updatedModeStats[mode].bestStreak === undefined) {
              updatedModeStats[mode].bestStreak = updatedModeStats[mode].streak;
              changed = true;
            }
          });
          
          const finalStats = {
            ...savedStats,
            globalBestStreak: savedStats.globalBestStreak ?? savedStats.globalStreak ?? 0,
            modeStats: updatedModeStats
          };
          
          setStats(finalStats);
          if (changed || savedStats.globalBestStreak === undefined) {
            localforage.setItem("arkhamdle_stats", finalStats);
          }
        }
      }
    };
    loadStats();
  }, []);

  const reportResult = useCallback((modes: string | string[], won: boolean) => {
    setStats((prev) => {
      const modeList = Array.isArray(modes) ? modes : [modes];
      const newGlobalStreak = won ? prev.globalStreak + 1 : 0;
      const newGlobalBestStreak = Math.max(prev.globalBestStreak || 0, newGlobalStreak);
      
      const newModeStats = { ...prev.modeStats };
      
      modeList.forEach(mode => {
        const current = newModeStats[mode] || { streak: 0, bestStreak: 0, wins: 0, losses: 0 };
        const newStreak = won ? current.streak + 1 : 0;
        newModeStats[mode] = {
          streak: newStreak,
          bestStreak: Math.max(current.bestStreak || 0, newStreak),
          wins: won ? current.wins + 1 : current.wins,
          losses: won ? current.losses : current.losses + 1,
        };
      });

      const newStats = {
        globalStreak: newGlobalStreak,
        globalBestStreak: newGlobalBestStreak,
        modeStats: newModeStats,
      };

      localforage.setItem("arkhamdle_stats", newStats);

      if (won) {
        const targetMode = modeList.includes('Random Trivia') ? 'Random Trivia' : modeList[0];
        const targetModeStreak = newModeStats[targetMode]?.streak || 0;
        const templateIndex = Math.floor(nativeRandom() * STREAK_TEXTS.length);
        
        setLastResult({
          won: true,
          globalStreak: newGlobalStreak,
          targetModeStreak,
          targetMode,
          templateIndex,
        });
      } else {
        const targetMode = modeList.includes('Random Trivia') ? 'Random Trivia' : modeList[0];
        const prevGlobalStreak = prev.globalStreak;
        const prevModeStreak = prev.modeStats[targetMode]?.streak || 0;

        setLastResult({
          won: false,
          globalStreak: prevGlobalStreak,
          targetModeStreak: prevModeStreak,
          targetMode,
          templateIndex: 0,
        });
      }

      return newStats;
    });
  }, []);

  const stopStreak = useCallback(() => {
    setStats((prev) => {
      const newModeStats = { ...prev.modeStats };
      Object.keys(newModeStats).forEach(mode => {
        newModeStats[mode] = { ...newModeStats[mode], streak: 0 };
      });
      
      const newStats = {
        globalStreak: 0,
        globalBestStreak: prev.globalBestStreak,
        modeStats: newModeStats,
      };
      
      localforage.setItem("arkhamdle_stats", newStats);
      setLastResult(null);
      return newStats;
    });
  }, []);

  const clearRecord = useCallback(() => {
    const cleared = { globalStreak: 0, globalBestStreak: 0, modeStats: {} };
    setStats(cleared);
    setLastResult(null);
    localforage.setItem("arkhamdle_stats", cleared);
  }, []);

  return (
    <StatsContext.Provider value={{ stats, reportResult, stopStreak, clearRecord, lastStreakText }}>
      {children}
    </StatsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStats = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error("useStats must be used within a StatsProvider");
  }
  return context;
};
