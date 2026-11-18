
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api/http.js';

export default function RequireAuth({ role, children }) {
  const [state, setState] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await api(`/api/${role}/me`);

        if (cancelled) return;

        if (response.ok) {
          // Temporary-password tenants must change their password first.
          if (role === 'tenant' && response.data?.mustChangePassword) {
            setState('out');
          } else {
            setState('in');
          }
        } else if (response.status === 401) {
          setState('out');
        } else {
          setState('error');
        }
      } catch {
        if (!cancelled) {
          setState('error');
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [role]);

  if (state === 'checking') {
    return (
      <div className="p-6 text-sm text-gray-500">
        Checking your session...
      </div>
    );
  }

  if (state === 'out') {
    return <Navigate to={`/${role}/login`} replace />;
  }

  if (state === 'error') {
    return (
      <div className="p-6 text-sm text-red-600">
        Cannot verify your session. Please try again shortly.
      </div>
    );
  }

  return children;
}
