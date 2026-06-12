import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

const severityColor: Record<string, string> = { low: '#16a34a', medium: '#d97706', high: '#ea580c', critical: '#dc2626' };
const statusColor: Record<string, string> = { open: '#dc2626', in_progress: '#d97706', resolved: '#16a34a' };

const badge = (value: string, colors: Record<string, string>) => (
  <span style={{ background: (colors[value] || '#6b7280') + '20', color: colors[value] || '#6b7280', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
    {value.replace(/_/g, ' ')}
  </span>
);

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [status, setStatus] = useState('open');

  function load() {
    apiRequest<any[]>('/incidents', {}, true).then(setIncidents).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiRequest('/incidents', { method: 'POST', body: JSON.stringify({ title, description, severity, status }) }, true);
      setTitle(''); setDescription(''); setSeverity('medium'); setStatus('open');
      setSuccess('Incident created');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === 'all' ? incidents : incidents.filter((i) => i.status === filter || i.severity === filter);

  const input = (value: string, onChange: (v: string) => void, placeholder: string, type = 'text') => (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} required
      style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%', boxSizing: 'border-box' }} />
  );

  const sel = (value: string, onChange: (v: string) => void, options: string[]) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', width: '100%' }}>
      {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
    </select>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>Incidents</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>{incidents.length} total incidents</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
          {showForm ? 'Cancel' : '+ New Incident'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px', marginBottom: '24px', maxWidth: '560px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Create New Incident</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: '12px' }}>
            {input(title, setTitle, 'Incident title')}
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required rows={3}
              style={{ padding: '9px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', resize: 'vertical' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {sel(severity, setSeverity, ['low', 'medium', 'high', 'critical'])}
              {sel(status, setStatus, ['open', 'in_progress', 'resolved'])}
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '10px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {loading ? 'Creating...' : 'Create Incident'}
            </button>
            {success && <p style={{ color: '#16a34a', margin: 0 }}>{success}</p>}
            {error && <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>}
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {['all', 'open', 'in_progress', 'resolved', 'critical', 'high', 'medium', 'low'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: filter === f ? '#4f46e5' : '#fff', color: filter === f ? '#fff' : '#374151' }}>
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Title', 'Description', 'Severity', 'Status', 'Created'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500, fontSize: '14px' }}>{i.title}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280', maxWidth: '300px' }}>{i.description?.substring(0, 80)}{i.description?.length > 80 ? '...' : ''}</td>
                <td style={{ padding: '14px 16px' }}>{badge(i.severity, severityColor)}</td>
                <td style={{ padding: '14px 16px' }}>{badge(i.status, statusColor)}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(i.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No incidents found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}