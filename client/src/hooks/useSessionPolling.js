import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionStatus } from '../api/purchase';

export function useSessionPolling(token, active, timeoutMs = 60000) {
  const [result, setResult] = useState({ status: 'pending' });
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!active || !token) return;

    const poll = async () => {
      const data = await getSessionStatus(token);
      setResult(data);

      if (data.status === 'active' || data.status === 'failed') {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setResult({ status: 'timeout' });
    }, timeoutMs);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [active, token, timeoutMs]);

  const recheck = useCallback(async () => {
    if (!token || checking) return;
    setChecking(true);
    const data = await getSessionStatus(token);
    setChecking(false);
    setResult(data);
  }, [token, checking]);

  return { ...result, checking, recheck };
}