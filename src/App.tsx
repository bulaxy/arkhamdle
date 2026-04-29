import { Routes, Route, NavLink } from 'react-router-dom';
import { Settings } from 'lucide-react';
import './App.css';
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

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-links">
          <NavLink to="/" className="title-logo">Arkhamdle</NavLink>
          <NavLink to="/" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} end>Classic Mode</NavLink>
          <NavLink to="/pic-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Pic Guesser</NavLink>
          <NavLink to="/investigatordle" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Investigatordle</NavLink>
          <NavLink to="/story-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Story Guesser</NavLink>
          <NavLink to="/trait-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Trait Guesser</NavLink>
          <NavLink to="/flavour-guesser" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Flavour Guesser</NavLink>
        </div>
        <div>
          <button className="premium-btn" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={18} />
            Settings
          </button>
        </div>
      </nav>

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
