import { useState } from 'react';

export default function SearchBar({ onSearch, loading }) {
  const [plate, setPlate] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (plate.trim()) onSearch(plate.trim().toUpperCase());
  }

  return (
    <section className="search-hero">
      <h1>Vehicle <span>Lookup</span></h1>
      <p>Enter the number plate to find a vehicle and its service history</p>

      <form className="plate-search-wrap" onSubmit={handleSubmit}>
        <div className="plate-input-box">
          <input
            id="plate-search-input"
            className="plate-input"
            type="text"
            value={plate}
            onChange={e => setPlate(e.target.value.toUpperCase())}
            placeholder="AB 1234"
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            aria-label="Vehicle number plate"
          />
        </div>

        <button
          id="plate-search-btn"
          className="search-btn"
          type="submit"
          disabled={loading || !plate.trim()}
        >
          {loading ? <span className="spinner" /> : '🔍'}
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
    </section>
  );
}
