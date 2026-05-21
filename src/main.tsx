import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.scss'
import { GameProvider } from './context/GameContext'
import { StatsProvider } from './context/StatsContext'
import { MultiplayerProvider } from './context/MultiplayerContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <StatsProvider>
        <MultiplayerProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MultiplayerProvider>
      </StatsProvider>
    </GameProvider>
  </React.StrictMode>,
)
