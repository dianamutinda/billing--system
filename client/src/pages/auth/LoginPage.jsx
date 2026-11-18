
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { api } from '../../api/http.js';
import ChangePasswordForm from '../../components/ui/ChangePasswordForm.jsx';

export default function LoginPage({ role }) {
  const navigate = useNavigate();
  const base = `/api/${role}`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const isTenant = role === 'tenant';
  const mustChangePassword = isTenant && me?.mustChangePassword;

  const checkMe = useCallback(async () => {
    try {
      const response = await api(`${base}/me`);
      setMe(response.ok ? response.data : null);
      return response;
    } catch {
      setMe(null);
      return null;
    }
  }, [base]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const response = await api(`${base}/me`);

        if (!cancelled) {
          setMe(response.ok ? response.data : null);
        }
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, [base]);

  useEffect(() => {
    if (me && !(isTenant && me.mustChangePassword)) {
      navigate(`/${role}/dashboard`, { replace: true });
    }
  }, [me, role, isTenant, navigate]);

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setMessage('');

    try {
      const response = await api(`${base}/login`, {
        method: 'POST',
        body: { email, password },
      });

      setPassword('');

      if (!response.ok) {
        setMessage(
          response.data?.error || 'Login failed. Please check your details.'
        );
        return;
      }

      const session = await checkMe();

      if (!session?.ok) {
        setMessage(
          'Login succeeded, but your session could not be verified.'
        );
      } else if (session.data?.mustChangePassword && isTenant) {
        setMessage('Please change your temporary password to continue.');
      } else {
        setMessage('Login successful. Redirecting...');
      }
    } catch {
      setPassword('');
      setMessage('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoading(true);
    setMessage('');

    try {
      const response = await api(`${base}/logout`, {
        method: 'POST',
      });

      if (response.ok) {
        setMe(null);
        setPassword('');
        setShowPassword(false);
        setMessage('You have been logged out.');
      } else {
        setMessage(response.data?.error || 'Could not log out.');
      }
    } catch {
      setMessage('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Checking your session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold capitalize text-gray-900">
            {role} login
          </h1>

          <p className="text-sm text-gray-500">
            {isTenant
              ? 'Sign in to manage your hotspot business.'
              : 'Sign in to manage your platform.'}
          </p>
        </div>

        {me ? (
          <div className="space-y-5">
            {mustChangePassword && (
              <>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="font-medium text-amber-900">
                    Password change required
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    Please create a new password before accessing your dashboard.
                  </p>
                </div>

                <ChangePasswordForm onDone={checkMe} />
              </>
            )}

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : 'Log out'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 caret-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 caret-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {message && (
          <p
            role="status"
            className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600"
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
