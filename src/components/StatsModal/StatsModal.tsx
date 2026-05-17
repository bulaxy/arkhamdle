import { X, StopCircle, Trash2, Trophy } from "lucide-react";
import { useStats } from "../../context/StatsContext";
import "../SettingsModal/SettingsModal.scss";

interface StatsModalProps {
  onClose: () => void;
}

export default function StatsModal({ onClose }: StatsModalProps) {
  const { stats, stopStreak, clearRecord } = useStats();

  return (
    <div className="modal-overlay confirm-modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title-with-icon">
            <Trophy color="var(--accent-color)" size={24} />
            <h2>Win Statistics</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close statistics modal">
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <div className="stats-summary">
            <div className="stats-item">
              <span className="stats-label">Current Streak</span>
              <span className="stats-value">{stats.globalStreak}</span>
            </div>
            <div className="stats-item">
              <span className="stats-label">Longest Streak</span>
              <span className="stats-value highlight">{stats.globalBestStreak || 0}</span>
            </div>
          </div>
          
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Game Mode</th>
                  <th>Streak</th>
                  <th>Best</th>
                  <th>Win %</th>
                  <th>W/L</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.modeStats).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">No records yet. Go play some games!</td>
                  </tr>
                ) : (
                  Object.entries(stats.modeStats)
                    .sort((a, b) => b[1].wins - a[1].wins)
                    .map(([mode, data]) => {
                      const total = data.wins + data.losses;
                      const winRate = total > 0 ? ((data.wins / total) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={mode}>
                          <td>{mode}</td>
                          <td>{data.streak}</td>
                          <td>{data.bestStreak || 0}</td>
                          <td>{winRate}%</td>
                          <td>{data.wins}/{data.losses}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          <hr className="settings-divider" />
          
          <div className="button-row tight">
            <button
              className="premium-btn full-width delete-btn"
              onClick={() => {
                if (confirm("Reset current streaks to zero? (Overall records will be kept)")) {
                  stopStreak();
                }
              }}
            >
              <StopCircle size={18} /> Stop Streak
            </button>
            <button
              className="premium-btn full-width delete-btn"
              onClick={() => {
                if (confirm("Are you sure you want to PERMANENTLY clear all records and streaks?")) {
                  clearRecord();
                }
              }}
            >
              <Trash2 size={18} /> Clear Record
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="premium-btn full-width" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
