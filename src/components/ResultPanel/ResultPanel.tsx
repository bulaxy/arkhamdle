import React from 'react';
import './ResultPanel.scss';

export interface ResultPanelProps {
  win: boolean;
  item: { fullName: string; imagesrc?: string } | null;
  onPlayAgain: () => void;
  className?: string;
  children?: React.ReactNode;
  showImage?: boolean;
}

export default function ResultPanel({ 
  win, 
  item, 
  onPlayAgain, 
  className = '', 
  children,
  showImage = true
}: ResultPanelProps) {
  return (
    <div 
      className={`glass-panel fade-in result-panel ${win ? 'win-border' : 'lose-border'} ${className}`} 
    >
      <h2 className={win ? 'win' : 'lose'}>
        {win ? 'Correct!' : 'Game Over'}
      </h2>
      {showImage && item?.imagesrc && (
        <img src={`https://arkhamdb.com${item.imagesrc}`} alt={item.fullName} />
      )}
      <p>{item?.fullName}</p>
      {children}
      <button className="premium-btn" onClick={onPlayAgain} autoFocus>
        Play Again
      </button>
    </div>
  );
}
