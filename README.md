
- Encounter Card / Story / Location Card guessing related game, got an idea, need to look further (blurred photo + some clue to guess the which pack is it from, with additional challenge )
- Hint System Review
- Give Up/Answer Review Section Review

- Review these
```
export default function TraitGuesser() {
  const { filteredCards, filteredInvestigators, settings } = useGameContext();
  const [trait, setTrait] = useState<string>('');
  const [win, setWin] = useState(false);
  const [correctGuesses, setCorrectGuesses] = useState<(TransformedCard | TransformedInvestigator)[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<(TransformedCard | TransformedInvestigator)[]>([]);
  const [gaveUp, setGaveUp] = useState(false);

  const allPossibleOptions = useMemo(() => {
    const cards = filterDuplicateOfCode(filteredCards);
    const investigators = filterDuplicateOfCode(filteredInvestigators);
    
    return [
      // TODO: Review thess filter
      ...cards.filter(c => settings.traitGuesserTypeFilters[c.type_code] ?? true),
      ...investigators.filter(_ => settings.traitGuesserTypeFilters['investigator'] ?? true)
      ```