import { useEffect } from "react";
import { useSessionPolling } from "../hooks/useSessionPolling";

export function ProcessingScreen({phone, onActive, onFailed }){
    const { status, expiresAt } = useSessionPolling(phone, true);

    useEffect(() => {
        if (status === 'active') onActive(expiresAt);
        if (status === 'failed') onFailed();
    }, [status, expiresAt, onActive, onFailed]);

    const isDelayed = status === 'timeout';
    return (
  <div className="processing-screen">
    <h2>Setting up your connection...</h2>
    <p>This may take a few seconds.</p>
    <ul>
      <li className={status !== 'pending' ? 'done' : ''}>Payment confirmed</li>
      <li className={status === 'active' ? 'done' : 'active'}>Activating session...</li>
      <li>Almost there...</li>
    </ul>
    {isDelayed && (
      <div className="mt-4 bg-amber-50 text-sm text-amber-700 p-3 rounded-lg">
        This is taking longer than expected. You can keep waiting, or check
        back in a moment.
      </div>
    )}
  </div>
);
}
