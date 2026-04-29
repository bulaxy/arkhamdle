import { useState } from 'react';
import { X, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useGameContext } from '../context/GameContext';
import './SettingsModal.scss';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { packs, settings, setSettings, refreshData } = useGameContext();
  const [openSection, setOpenSection] = useState<string>(''); // 'packs', 'picGuesser', 'storyGuesser'

  const handleToggle = (packGroup: string) => {
    const isFiltered = settings.filteredPacks.includes(packGroup);
    const newFiltered = isFiltered
      ? settings.filteredPacks.filter(p => p !== packGroup)
      : [...settings.filteredPacks, packGroup];
    setSettings({ ...settings, filteredPacks: newFiltered });
  };

  const selectAll = () => setSettings({ ...settings, filteredPacks: [] });
  const filterAll = () => setSettings({ ...settings, filteredPacks: [...packs] });

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        <div className="modal-body">
          
          {/* Global Packs Section */}
          <div style={{ border: '1px solid var(--glass-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--glass-bg)', cursor: 'pointer' }}
              onClick={() => toggleSection('packs')}
            >
              <h3 style={{ margin: 0 }}>Global: Pack Filters</h3>
              {openSection === 'packs' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {openSection === 'packs' && (
              <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <p>Filter which pack groups to include in the games. By default, all are shown.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button className="premium-btn" onClick={selectAll}>Select All</button>
                  <button className="premium-btn" onClick={filterAll}>Filter All</button>
                </div>
                
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={settings.includeWeakness} 
                      onChange={e => setSettings({ ...settings, includeWeakness: e.target.checked })}
                      style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-color)' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Include Weaknesses (Basic & Non-Basic)</span>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', marginTop: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {packs.map(packGroup => {
                  const isChecked = !settings.filteredPacks.includes(packGroup);
                  return (
                    <label key={packGroup} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleToggle(packGroup)}
                        style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-color)' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{packGroup}</span>
                    </label>
                  );
                })}
                </div>
              </div>
            )}
          </div>

          {/* Pic Guesser Section */}
          <div style={{ border: '1px solid var(--glass-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--glass-bg)', cursor: 'pointer' }}
              onClick={() => toggleSection('picGuesser')}
            >
              <h3 style={{ margin: 0 }}>Game: Pic Guesser</h3>
              {openSection === 'picGuesser' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {openSection === 'picGuesser' && (
              <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>How much it zooms out each time you guess incorrectly.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {(['Hard', 'Normal', 'Easy'] as const).map(diff => (
                    <button 
                      key={diff}
                      className="premium-btn"
                      onClick={() => setSettings({ ...settings, picGuesserDifficulty: diff })}
                      style={{
                        flex: 1,
                        opacity: settings.picGuesserDifficulty === diff ? 1 : 0.6,
                        border: settings.picGuesserDifficulty === diff ? '1px solid var(--correct-color)' : '1px solid var(--glass-border)'
                      }}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Story Guesser Section */}
          <div style={{ border: '1px solid var(--glass-border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--glass-bg)', cursor: 'pointer' }}
              onClick={() => toggleSection('storyGuesser')}
            >
              <h3 style={{ margin: 0 }}>Game: Story Guesser</h3>
              {openSection === 'storyGuesser' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {openSection === 'storyGuesser' && (
              <div style={{ padding: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Configure how the text is scrambled.</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.storyGuesserScrambleWords} 
                    onChange={e => setSettings({ ...settings, storyGuesserScrambleWords: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-color)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Scramble Word Order (Shuffle paragraphs)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.storyGuesserScrambleLetters} 
                    onChange={e => setSettings({ ...settings, storyGuesserScrambleLetters: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-color)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Scramble Letters (Inside each word)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.storyGuesserHideName} 
                    onChange={e => setSettings({ ...settings, storyGuesserHideName: e.target.checked })}
                    style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--accent-color)' }}
                  />
                  <span style={{ fontSize: '0.9rem' }}>Hide Investigator Name in Text</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>Text Display Length: {Math.round(settings.storyGuesserSliceScale * 100)}%</span>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.1" 
                    value={settings.storyGuesserSliceScale} 
                    onChange={e => setSettings({ ...settings, storyGuesserSliceScale: parseFloat(e.target.value) })}
                    style={{ width: '100%', accentColor: 'var(--accent-color)' }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            <button className="premium-btn" onClick={async () => { await refreshData(); onClose(); }} style={{ width: '100%' }}>
              <RefreshCw size={18} /> Force Refresh Data
            </button>
            <button className="premium-btn" onClick={onClose} style={{ width: '100%', background: 'var(--accent-color)' }}>
              Close Settings
            </button>
            <a 
              href="https://github.com/bulaxy/arkhamdle" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--text-secondary)', 
                textDecoration: 'none',
                fontSize: '0.9rem',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <ExternalLink size={18} /> Issues & Feedback
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
