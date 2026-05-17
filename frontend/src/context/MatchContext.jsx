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

const featuresCache = new Map();

export function MatchProvider({ children }) {
  const [selected, setSelected] = useState(DEFAULT_MATCH);
  const [features, setFeatures] = useState(null);
  const [featuresLoading, setFeaturesLoading] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty('--team1', '#60a5fa');
    document.documentElement.style.setProperty('--team2', '#f87171');
  }, []);

  useEffect(() => {
    if (!selected?.matchId) return;

    const cached = featuresCache.get(selected.matchId);
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFeatures(cached);
      return;
    }

    setFeatures(null);
    setFeaturesLoading(true);

    fetchAvailableFeatures(selected.matchId)
      .then(data => {
        featuresCache.set(selected.matchId, data);
        setFeatures(data);
        setFeaturesLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch available features:', err);
        setFeatures(null);
        setFeaturesLoading(false);
      });
  }, [selected?.matchId]);

  return (
    <MatchContext.Provider value={{ selected, setSelected, features, featuresLoading }}>
      {children}
    </MatchContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMatch() {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used inside MatchProvider');
  return ctx;
}
