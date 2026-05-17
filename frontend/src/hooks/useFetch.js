import { useState, useEffect } from 'react';

export default function useFetch(fetchFn, matchId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setData(null);
    setError(null);

    fetchFn(matchId, controller.signal)
      .then(d => {
        if (!controller.signal.aborted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(e => {
        if (e.name === 'AbortError') return;
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [matchId, retryCount, fetchFn]);

  const retry = () => setRetryCount(c => c + 1);

  return { data, error, loading, retry };
}
