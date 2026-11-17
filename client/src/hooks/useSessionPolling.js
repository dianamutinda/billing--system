import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionStatus } from '../api/purchase';

const TERMINAL_STATUSES = new Set([
  'active',
  'failed',
  'not_found'
]);

export function useSessionPolling(token, active, timeoutMs = 120000) {
  const [result, setResult] = useState({ status: 'pending' });
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!active || !token) return;

    let cancelled = false;

    const poll = async () => {
      const data = await getSessionStatus(token);
      if (cancelled) return;

      if (data.status === 'error') return;

      setResult(data);

      if (TERMINAL_STATUSES.has(data.status)) {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);

    timeoutRef.current = setTimeout(() => {
      if (cancelled) return;
      clearInterval(intervalRef.current);
      setResult((prev) =>
        TERMINAL_STATUSES.has(prev.status) ? prev : { status: 'timeout' }
      );
    }, timeoutMs);

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [active, token, timeoutMs]);

  const recheck = useCallback(async () => {
    if (!token || checking) return;
    setChecking(true);
    const data = await getSessionStatus(token);
    setChecking(false);

    if (data.status !== 'error') {
      setResult(data);
    }
  }, [token, checking]);

  // Normalize message across message, resultDesc, or result_desc
  const errorMessage = result.message || result.resultDesc || result.result_desc;

  return { ...result, message: errorMessage, checking, recheck };
}