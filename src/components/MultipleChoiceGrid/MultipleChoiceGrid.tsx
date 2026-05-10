import './MultipleChoiceGrid.scss';

interface MultipleChoiceGridProps<T extends string | number> {
  options: T[];
  onSelect: (option: T) => void;
  getLabel?: (option: T) => string | number;
  disabled?: boolean;
}

export default function MultipleChoiceGrid<T extends string | number>({
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
          {getLabel ? getLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}
