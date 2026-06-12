import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

export function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function load() {
    apiRequest<any[]>('/teams', {}, true).then(setTeams).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await apiRequest('/teams', { method: 'POST', body: JSON.stringify({ name, description }) }, true);
      setName(''); setDescription('');
      setSuccess('Team created'); setShowForm(false); load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>Teams</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>{teams.length} teams</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
          {showForm ? 'Cancel' : '+ New Team'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px', marginBottom: '24px', maxWidth: '480px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Create New Team</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" required
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }} />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }} />
            <button type="submit" disabled={loading}
              style={{ padding: '10px', background: '#0891b2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {loading ? 'Creating...' : 'Create Team'}
            </button>
            {success && <p style={{ color: '#16a34a', margin: 0 }}>{success}</p>}
            {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {teams.map((t) => (
          <div key={t.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👥</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>{t.name}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Created {new Date(t.created_at).toLocaleDateString()}</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{t.description || 'No description'}</p>
          </div>
        ))}
        {teams.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: '#9ca3af', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
            No teams yet. Create your first team.
          </div>
        )}
      </div>
    </div>
  );
}