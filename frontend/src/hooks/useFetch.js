import { useState, useEffect, useRef } from 'react';

export default function useFetch(fetchFn, matchId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);
    fnRef.current(matchId)
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [matchId]);

  return { data, error, loading };
}
