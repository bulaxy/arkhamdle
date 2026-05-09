import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Settings, Menu, X as CloseIcon, ChevronDown } from 'lucide-react';
import './App.scss';
import { useGameContext } from './hooks/useGameContext';
import WordleGame from './pages/WordleGame/WordleGame';
import PicGuesser from './pages/PicGuesser/PicGuesser';
import Investigatordle from './pages/Investigatordle/Investigatordle';
import StoryGuesser from './pages/StoryGuesser/StoryGuesser';
import TraitGuesser from './pages/TraitGuesser/TraitGuesser';
import FlavourGuesser from './pages/FlavourGuesser/FlavourGuesser';
import TriviaGuesser from './pages/TriviaGuesser/TriviaGuesser';
import EncounterGuesser from './pages/EncounterGuesser/EncounterGuesser';
import IconGuesser from './pages/IconGuesser/IconGuesser';
import SettingsModal from './components/SettingsModal/SettingsModal';
import WelcomeModal from './components/WelcomeModal/WelcomeModal';
import { useState, useEffect, useRef } from 'react';

function App() {
  const { isLoading, loadingMessage } = useGameContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(() => {
    return !localStorage.getItem('arkhamdle_visited');
  });

  useEffect(() => {
    if (isWelcomeOpen) {
      localStorage.setItem('arkhamdle_visited', 'true');
    }
  }, [isWelcomeOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => { setIsMenuOpen(false); setIsMoreOpen(false); };
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
  const moreGamePaths = ['/story-guesser', '/trait-guesser', '/flavour-guesser', '/encounter-guesser', '/icon-guesser', '/trivia-guesser'];
  const isMoreActive = moreGamePaths.includes(location.pathname);

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-left">
          <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </button>
          <NavLink to="/" className="title-logo" onClick={closeMenu}>Arkhamdle</NavLink>
        </div>

        <div className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu} end>Classic Mode</NavLink>
          <NavLink to="/pic-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Pic Guesser</NavLink>
          <NavLink to="/investigatordle" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Investigatordle</NavLink>
          
          {/* Desktop dropdown */}
          <div className={`nav-dropdown desktop-only ${isMoreOpen ? 'open' : ''}`} ref={dropdownRef}>
            <button 
              className={`nav-link nav-dropdown-trigger ${isMoreActive ? 'active' : ''}`}
              onClick={() => setIsMoreOpen(!isMoreOpen)}
            >
              More Games <ChevronDown size={16} className={`dropdown-chevron ${isMoreOpen ? 'rotated' : ''}`} />
            </button>
            <div className="nav-dropdown-menu">
              <NavLink to="/story-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Story Guesser</NavLink>
              <NavLink to="/trait-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Trait Guesser</NavLink>
              <NavLink to="/flavour-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Flavour Guesser</NavLink>
              <NavLink to="/encounter-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Encounter Guesser</NavLink>
              <NavLink to="/icon-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Icon Guesser</NavLink>
              <NavLink to="/trivia-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Trivia Questions</NavLink>
            </div>
          </div>

          {/* Mobile flat links */}
          <NavLink to="/story-guesser" className={({isActive}) => `nav-link mobile-only-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>Story Guesser</NavLink>
          <NavLink to="/trait-guesser" className={({isActive}) => `nav-link mobile-only-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>Trait Guesser</NavLink>
          <NavLink to="/flavour-guesser" className={({isActive}) => `nav-link mobile-only-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>Flavour Guesser</NavLink>
          <NavLink to="/encounter-guesser" className={({isActive}) => `nav-link mobile-only-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>Encounter Guesser</NavLink>
          <NavLink to="/icon-guesser" className={({isActive}) => `nav-link mobile-only-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>Icon Guesser</NavLink>
          <NavLink to="/trivia-guesser" className={({isActive}) => `nav-link mobile-only-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>Trivia Questions</NavLink>
        </div>

        <div className="nav-right">
          <button className="premium-btn settings-btn" onClick={() => { setIsSettingsOpen(true); closeMenu(); }}>
            <Settings size={20} />
            <span className="settings-text">Settings</span>
          </button>
        </div>
      </nav>

      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

      <main className="main-content">
        {isLoading ? (
          <div className="loading-screen fade-in">
            <div className="spinner"></div>
            <h2>{loadingMessage}</h2>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<WordleGame />} />
            <Route path="/pic-guesser" element={<PicGuesser />} />
            <Route path="/investigatordle" element={<Investigatordle />} />
            <Route path="/story-guesser" element={<StoryGuesser />} />
            <Route path="/trait-guesser" element={<TraitGuesser />} />
            <Route path="/flavour-guesser" element={<FlavourGuesser />} />
            <Route path="/trivia-guesser" element={<TriviaGuesser />} />
            <Route path="/encounter-guesser" element={<EncounterGuesser />} />
            <Route path="/icon-guesser" element={<IconGuesser />} />
          </Routes>
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}

      {isWelcomeOpen && (
        <WelcomeModal 
          onClose={() => setIsWelcomeOpen(false)} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}
    </div>
  );
}

export default App;
