import { useState } from 'react';
import { api } from '../../api/http.js';

export default function ChangePasswordForm({ onDone }) {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const r = await api('/api/tenant/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
    setCurrent('');
    setNew('');
    setMessage(`${r.status}: ${r.data?.error || 'Password changed'}`);
    if (r.ok && onDone) onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="font-semibold">Change password</h2>
      <input className="w-full rounded border p-2" type="password" placeholder="Current password"
             value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
      <input className="w-full rounded border p-2" type="password" placeholder="New password (10+ characters)"
             value={newPassword} onChange={(e) => setNew(e.target.value)} />
      <button className="rounded bg-blue-600 px-4 py-2 text-white">Save</button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  );
}