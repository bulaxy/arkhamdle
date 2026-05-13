import React from 'react';
import './ResultPanel.scss';

export interface ResultPanelProps {
  win: boolean;
  item: { fullName: string; imagesrc?: string; backimagesrc?: string; typeName?: string } | null;
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
        <div className="result-images">
          <img src={`https://arkhamdb.com${item.imagesrc}`} alt={item.fullName} />
          {item.typeName?.toLowerCase() === 'location' && item.backimagesrc && (
            <img src={`https://arkhamdb.com${item.backimagesrc}`} alt={`${item.fullName} Back`} />
          )}
        </div>
      )}
      <p>{item?.fullName}</p>
      <div className="children-container">
        {children}
      </div>
      <button className="premium-btn" onClick={onPlayAgain} autoFocus>
        Play Again
      </button>
    </div>
  );
}
