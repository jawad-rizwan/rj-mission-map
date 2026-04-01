import { useState, useRef, useEffect } from 'react';
import { searchAirports, type Airport } from '../data/airports';

interface Props {
  label: string;
  value: Airport | undefined;
  onChange: (airport: Airport | null) => void;
}

export function AirportSearch({ label, value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleInput(q: string) {
    setQuery(q);
    if (q.length >= 2) {
      setResults(searchAirports(q, 8));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }

  function handleSelect(airport: Airport) {
    onChange(airport);
    setQuery(`${airport.iata} — ${airport.city}`);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="airport-search" ref={ref}>
      <label className="search-label">{label}</label>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="IATA, ICAO, or city..."
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
        />
        {value && (
          <button className="search-clear" onClick={handleClear} title="Clear">
            ×
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map(a => (
            <li key={a.icao} onClick={() => handleSelect(a)}>
              <strong>{a.iata}</strong> <span className="search-icao">{a.icao}</span>
              <br />
              <span className="search-detail">{a.name}, {a.city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
