import { useState, useEffect, useRef } from 'react';

export function useSessionPolling(phone, active, timeoutMs = 60000) {
  const [result, setResult] = useState({ status: 'pending' });
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

    useEffect(() => {
    if (!active || !phone) return;

    const poll = async () => {
      const data = await getSessionStatus(phone);
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
  }, [active, phone, timeoutMs]);

  return result;
}