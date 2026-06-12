import { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

export function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiRequest<any[]>('/audit', {}, true).then(setLogs).catch((e) => setError(e.message));
  }, []);

  const actionColor: Record<string, string> = {
    user_created: '#4f46e5',
    team_created: '#0891b2',
    incident_created: '#dc2626',
  };

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.action === filter);
  const actions = ['all', ...Array.from(new Set(logs.map((l) => l.action)))];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px 0', fontSize: '24px' }}>Audit Logs</h1>
        <p style={{ margin: 0, color: '#6b7280' }}>{logs.length} total events recorded</p>
      </div>

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {actions.map((a) => (
          <button key={a} onClick={() => setFilter(a)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: filter === a ? '#4f46e5' : '#fff', color: filter === a ? '#fff' : '#374151' }}>
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Action', 'Target Type', 'Details', 'Time'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: (actionColor[l.action] || '#6b7280') + '20', color: actionColor[l.action] || '#6b7280', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    {l.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>{l.target_type}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{l.details || '-'}</td>
                <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{new Date(l.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No audit logs found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}