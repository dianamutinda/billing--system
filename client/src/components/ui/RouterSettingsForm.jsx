import { useState, useEffect } from 'react';
import { api } from '../../api/http';

export default function RouterSettingsForm() {
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  const [port, setPort] = useState('8728');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/api/tenant/router').then((r) => {
      if (!r.ok) return setMessage(`${r.status}: ${r.data?.error || 'Could not load'}`);
      setHost(r.data.host || '');
      setUser(r.data.user || '');
      setPort(String(r.data.port || 8728));
      setHasPassword(r.data.hasPassword);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const body = { host: host.trim(), user: user.trim(), port: Number(port) };
    if (password) body.password = password; // leave it out to keep the stored one
    const r = await api('/api/tenant/router', { method: 'PUT', body });
    setPassword('');
    setMessage(`${r.status}: ${r.data?.error || 'Saved'}`);
    if (r.ok && body.password) setHasPassword(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="font-semibold">Router settings</h2>
      <input className="w-full rounded border p-2" placeholder="Router host (e.g. 192.168.57.101)"
             value={host} onChange={(e) => setHost(e.target.value)} />
      <input className="w-full rounded border p-2" placeholder="Router user"
             value={user} onChange={(e) => setUser(e.target.value)} />
      <input className="w-full rounded border p-2" placeholder="API port" inputMode="numeric"
             value={port} onChange={(e) => setPort(e.target.value)} />
      <input className="w-full rounded border p-2" type="password"
             placeholder={hasPassword ? 'Password saved (leave blank to keep)' : 'Router password'}
             value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}