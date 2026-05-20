import React from 'react';
import './MultipleChoiceGrid.scss';

interface MultipleChoiceGridProps<T> {
  options: T[];
  onSelect: (option: T) => void;
  getLabel?: (option: T) => React.ReactNode;
  disabled?: boolean;
  correctOption?: T;
  selectedOption?: T;
}

export default function MultipleChoiceGrid<T>({
  options,
  onSelect,
  getLabel,
  disabled = false,
  correctOption,
  selectedOption,
}: MultipleChoiceGridProps<T>) {
  const isMatch = (a: T | undefined, b: T | undefined) => {
    if (a === undefined || b === undefined) return false;
    if (a === b) return true;
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      if ('id' in a && 'id' in b) {
        const objA = a as Record<string, unknown>;
        const objB = b as Record<string, unknown>;
        if (objA.id !== undefined && objB.id !== undefined) {
          return objA.id === objB.id;
        }
      }
    }
    return false;
  };

  const hasGameEnded = correctOption !== undefined;

  return (
    <div className="multiple-choice-grid">
      {options.map((opt, i) => {
        const isCorrect = isMatch(opt, correctOption);
        const isSelected = isMatch(opt, selectedOption);
        const isWrong = isSelected && !isCorrect;

        let btnClass = "choice-btn premium-btn-secondary";
        if (isCorrect) {
          btnClass += " correct";
        } else if (isWrong) {
          btnClass += " wrong";
        }

        return (
          <button
            key={i}
            className={btnClass}
            onClick={() => onSelect(opt)}
            disabled={disabled || hasGameEnded}
          >
            {getLabel ? getLabel(opt) : (opt as React.ReactNode)}
          </button>
        );
      })}
    </div>
  );
}

