import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Settings, Menu, X as CloseIcon, ChevronDown, Trophy, Users } from 'lucide-react';
import './App.scss';
import { useGameContext } from './hooks/useGameContext';
import WordleGame from './games/WordleGame/WordleGame';
import PicGuesser from './games/PicGuesser/PicGuesser';
import Investigatordle from './games/Investigatordle/Investigatordle';
import StoryGuesser from './games/StoryGuesser/StoryGuesser';
import TraitGuesser from './games/TraitGuesser/TraitGuesser';
import FlavourGuesser from './games/FlavourGuesser/FlavourGuesser';
import GuessCardByTrait from './games/GuessCardByTrait/GuessCardByTrait';
import CountGuesser from './games/CountGuesser/CountGuesser';
import CampaignPackGuesser from './games/CampaignPackGuesser/CampaignPackGuesser';
import IconGuesser from './games/IconGuesser/IconGuesser';
import TrueOrFalse from './games/TrueOrFalse/TrueOrFalse';
import RandomTrivia from './games/RandomTrivia/RandomTrivia';
import SettingsModal from './components/SettingsModal/SettingsModal';
import WelcomeModal from './components/WelcomeModal/WelcomeModal';
import StatsModal from './components/StatsModal/StatsModal';
import MultiplayerHUD from './components/MultiplayerHUD/MultiplayerHUD';
import MultiplayerLobby from './pages/MultiplayerLobby/MultiplayerLobby';
import { useMultiplayer } from './context/MultiplayerContext';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const { isLoading, loadingMessage, seedVersion } = useGameContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    return !localStorage.getItem('arkhamdle_visited');
  });

  useEffect(() => {
    if (isWelcomeOpen) {
      localStorage.setItem('arkhamdle_visited', 'true');
    }
  }, [isWelcomeOpen]);

  const navigate = useNavigate();

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      navigate(customEvent.detail.path);
    };
    window.addEventListener('MULTIPLAYER_NAVIGATE', handleNavigate);
    return () => window.removeEventListener('MULTIPLAYER_NAVIGATE', handleNavigate);
  }, [navigate]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => { setIsMenuOpen(false); setIsMoreOpen(false); };
  
  const { isMultiplayer, isHost, leaveGame } = useMultiplayer();
  
  const handleNavClick = (e: React.MouseEvent) => {
    if (isMultiplayer && !isHost) {
      if (!confirm("Changing game modes will disconnect you from the multiplayer room. Continue?")) {
        e.preventDefault();
        return;
      }
      leaveGame();
    }
    closeMenu();
  };

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreOpen]);

  const location = useLocation();
  const moreGamePaths = ['/story-guesser', '/trait-guesser', '/flavour-guesser', '/campaign-pack-guesser', '/icon-guesser', '/guess-card-by-trait', '/count-guesser', '/true-or-false'];
  const isMoreActive = moreGamePaths.includes(location.pathname);

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-left">
          {!isMultiplayer && (
            <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
              {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
            </button>
          )}
          {isMultiplayer ? (
            <span className="title-logo">Arkhamdle</span>
          ) : (
            <NavLink to="/" className="title-logo" onClick={closeMenu}>Arkhamdle</NavLink>
          )}
        </div>

        {!isMultiplayer && (
          <div className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
            <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick} end>Classic Mode</NavLink>
            <NavLink to="/pic-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Pic Guesser</NavLink>
            <NavLink to="/investigatordle" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Investigatordle</NavLink>
            <NavLink to="/random-trivia" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Random Trivia</NavLink>
            
            {/* Desktop and Mobile dropdown */}
            <div className={`nav-dropdown ${isMoreOpen ? 'open' : ''}`} ref={dropdownRef}>
              <button 
                className={`nav-link nav-dropdown-trigger ${isMoreActive ? 'active' : ''}`}
                onClick={() => setIsMoreOpen(!isMoreOpen)}
              >
                Individual Trivia Games <ChevronDown size={16} className={`dropdown-chevron ${isMoreOpen ? 'rotated' : ''}`} />
              </button>
              <div className="nav-dropdown-menu">
                <NavLink to="/story-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Story Guesser</NavLink>
                <NavLink to="/trait-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Trait Guesser</NavLink>
                <NavLink to="/flavour-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Flavour Guesser</NavLink>
                <NavLink to="/campaign-pack-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Campaign Pack Guesser</NavLink>
                <NavLink to="/icon-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Icon Guesser</NavLink>
                <NavLink to="/guess-card-by-trait" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Guess Card By Trait</NavLink>
                <NavLink to="/count-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>Count Guesser</NavLink>
                <NavLink to="/true-or-false" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={handleNavClick}>True Or False</NavLink>
              </div>
            </div>
          </div>
        )}

        <div className="nav-right">
          <button className="premium-btn settings-btn" onClick={() => { navigate('/multiplayer'); closeMenu(); }}>
            <Users size={20} />
            <span className="settings-text">Multiplayer</span>
          </button>
          <button className="premium-btn settings-btn" onClick={() => { setIsStatsOpen(true); closeMenu(); }}>
            <Trophy size={20} />
            <span className="settings-text">Streaks</span>
          </button>
          <button className="premium-btn settings-btn" onClick={() => { setIsSettingsOpen(true); closeMenu(); }}>
            <Settings size={20} />
            <span className="settings-text">Settings</span>
          </button>
        </div>
      </nav>

      {isMenuOpen && !isMultiplayer && <div className="menu-overlay" onClick={closeMenu}></div>}

      <main className="main-content">
        {isLoading ? (
          <div className="loading-screen fade-in">
            <div className="spinner"></div>
            <h2>{loadingMessage}</h2>
          </div>
        ) : (
          <Routes key={seedVersion}>
            <Route path="/" element={<WordleGame />} />
            <Route path="/pic-guesser" element={<PicGuesser />} />
            <Route path="/investigatordle" element={<Investigatordle />} />
            <Route path="/random-trivia" element={<RandomTrivia />} />
            <Route path="/story-guesser" element={<StoryGuesser />} />
            <Route path="/trait-guesser" element={<TraitGuesser />} />
            <Route path="/flavour-guesser" element={<FlavourGuesser />} />
            <Route path="/guess-card-by-trait" element={<GuessCardByTrait />} />
            <Route path="/count-guesser" element={<CountGuesser />} />
            <Route path="/campaign-pack-guesser" element={<CampaignPackGuesser />} />
            <Route path="/icon-guesser" element={<IconGuesser />} />
            <Route path="/true-or-false" element={<TrueOrFalse />} />
            <Route path="/multiplayer" element={<MultiplayerLobby />} />
          </Routes>
        )}
      </main>

      <footer className="copyright-footer">
        <p>Arkham Horror: The Card Game™ and all related content © Fantasy Flight Games (FFG). This site is not produced, endorsed by or affiliated with FFG.</p>
      </footer>

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {isStatsOpen && (
        <StatsModal onClose={() => setIsStatsOpen(false)} />
      )}

      {isWelcomeOpen && (
        <WelcomeModal 
          onClose={() => setIsWelcomeOpen(false)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      <MultiplayerHUD />
    </div>
  );
}

export default App;
