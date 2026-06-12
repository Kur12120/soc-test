import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('analyst');

  function load() {
    apiRequest<any[]>('/users', {}, true).then(setUsers).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify({ fullName, email, password, role }) }, true);
      setFullName(''); setEmail(''); setPassword(''); setRole('analyst');
      setSuccess('User created'); setShowForm(false); load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  }

  const avatar = (name: string) => {
    const initials = name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
    return (
      <div style={{ width: '36px', height: '36px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#4f46e5', flexShrink: 0 }}>
        {initials}
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>Users</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>{users.length} accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px', marginBottom: '24px', maxWidth: '480px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Create New User</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px' }}>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }} />
            <select value={role} onChange={(e) => setRole(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}>
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={loading}
              style={{ padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
            {success && <p style={{ color: '#16a34a', margin: 0 }}>{success}</p>}
            {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
          </form>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['User', 'Email', 'Role', 'Joined'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: '#e0e7ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>
                      {u.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{u.full_name}</span>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280' }}>{u.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: u.role === 'admin' ? '#e0e7ff' : '#e0f2fe', color: u.role === 'admin' ? '#4f46e5' : '#0891b2', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}