import React from 'react';
import './MultipleChoiceGrid.scss';

interface MultipleChoiceGridProps<T> {
  options: T[];
  onSelect: (option: T) => void;
  getLabel?: (option: T) => React.ReactNode;
  disabled?: boolean;
}

export default function MultipleChoiceGrid<T>({
  options,
  onSelect,
  getLabel,
  disabled = false,
}: MultipleChoiceGridProps<T>) {
  return (
    <div className="multiple-choice-grid">
      {options.map((opt, i) => (
        <button
          key={i}
          className="choice-btn premium-btn-secondary"
          onClick={() => onSelect(opt)}
          disabled={disabled}
        >
          {getLabel ? getLabel(opt) : (opt as React.ReactNode)}
        </button>
      ))}
    </div>
  );
}
