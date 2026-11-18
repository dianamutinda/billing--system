import { useState, useEffect } from 'react';
import { api } from '../../api/http.js';
import ChangePasswordForm from '../../components/ui/ChangePasswordForm.jsx';

export default function LoginPage({ role }) {
  const base = `/api/${role}`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [me, setMe] = useState(null);
  const [message, setMessage] = useState('');

  async function checkMe() {
    const r = await api(`${base}/me`);
    setMe(r.ok ? r.data : null);
    return r;
  }

  useEffect(() => { checkMe(); }, []);

  async function handleLogin(e) {
    e.preventDefault();
    const r = await api(`${base}/login`, { method: 'POST', body: { email, password } });
    setPassword('');
    setMessage(`${r.status}: ${r.data?.error || 'logged in'}`);
    if (r.ok) await checkMe();
  }

  async function handleLogout() {
    const r = await api(`${base}/logout`, { method: 'POST' });
    setMessage(`logout ${r.status}`);
    await checkMe();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-semibold capitalize">{role} login</h1>

      {me ? (
        <div className="space-y-3">
          <pre className="rounded bg-gray-100 p-3 text-sm">{JSON.stringify(me, null, 2)}</pre>

          {role === 'tenant' && (
            <>
              {me.mustChangePassword && (
                <p className="rounded bg-amber-100 p-2 text-sm">
                  You're using a temporary password. Please set a new one.
                </p>
              )}
              <ChangePasswordForm onDone={checkMe} />
            </>
          )}

          <button onClick={handleLogout} className="rounded bg-gray-800 px-4 py-2 text-white">
            Log out
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="space-y-3">
          <input className="w-full rounded border p-2" type="email" placeholder="Email"
                 value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded border p-2" type="password" placeholder="Password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="rounded bg-blue-600 px-4 py-2 text-white">Log in</button>
        </form>
      )}

      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}