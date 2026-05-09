import { Routes, Route, NavLink } from 'react-router-dom';
import { Settings, Menu, X as CloseIcon } from 'lucide-react';
import './App.scss';
import { useGameContext } from './hooks/useGameContext';
import WordleGame from './pages/WordleGame/WordleGame';
import PicGuesser from './pages/PicGuesser/PicGuesser';
import Investigatordle from './pages/Investigatordle/Investigatordle';
import StoryGuesser from './pages/StoryGuesser/StoryGuesser';
import TraitGuesser from './pages/TraitGuesser/TraitGuesser';
import FlavourGuesser from './pages/FlavourGuesser/FlavourGuesser';
import EncounterGuesser from './pages/EncounterGuesser/EncounterGuesser';
import SettingsModal from './components/SettingsModal/SettingsModal';
import WelcomeModal from './components/WelcomeModal/WelcomeModal';
import { useState, useEffect } from 'react';

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
  const closeMenu = () => setIsMenuOpen(false);

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
          <NavLink to="/story-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Story Guesser</NavLink>
          <NavLink to="/trait-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Trait Guesser</NavLink>
          <NavLink to="/flavour-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Flavour Guesser</NavLink>
          <NavLink to="/encounter-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} onClick={closeMenu}>Encounter Guesser</NavLink>
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
            <Route path="/encounter-guesser" element={<EncounterGuesser />} />
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
