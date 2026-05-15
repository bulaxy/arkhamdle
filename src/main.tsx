import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.scss'
import { GameProvider } from './context/GameContext'
import { StatsProvider } from './context/StatsContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameProvider>
      <StatsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StatsProvider>
    </GameProvider>
  </React.StrictMode>,
)
