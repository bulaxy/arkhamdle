import { Routes, Route, NavLink } from 'react-router-dom';
import { Settings, Menu, X as CloseIcon } from 'lucide-react';
import './App.scss';
import { useGameContext } from './context/GameContext';
import WordleGame from './pages/WordleGame';
import PicGuesser from './pages/PicGuesser';
import Investigatordle from './pages/Investigatordle';
import StoryGuesser from './pages/StoryGuesser';
import TraitGuesser from './pages/TraitGuesser';
import FlavourGuesser from './pages/FlavourGuesser';
import SettingsModal from './components/SettingsModal';
import { useState } from 'react';

function App() {
  const { isLoading, loadingMessage } = useGameContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          </Routes>
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;
