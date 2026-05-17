import { createContext, useContext, useState, useEffect } from 'react';
import { fetchAvailableFeatures } from '../api/matchApi';

const DEFAULT_MATCH = {
  matchId: 3869685,
  home_team: 'Argentina',
  away_team: 'France',
  home_score: 3,
  away_score: 3,
  match_date: '2022-12-18',
  competition_name: 'FIFA World Cup',
  season_name: '2022',
};

const MatchContext = createContext(null);

export function MatchProvider({ children }) {
  const [selected, setSelected] = useState(DEFAULT_MATCH);
  const [features, setFeatures] = useState(null);

  useEffect(() => {
    if (!selected?.matchId) return;
    setFeatures(null);
    fetchAvailableFeatures(selected.matchId)
      .then(setFeatures)
      .catch(() => setFeatures(null));
  }, [selected?.matchId]);

  return (
    <MatchContext.Provider value={{ selected, setSelected, features }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used inside MatchProvider');
  return ctx;
}
