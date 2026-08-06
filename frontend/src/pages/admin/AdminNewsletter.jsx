import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

export default function AdminNewsletter() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/newsletter/admin/list')
      .then(({ data }) => setSubs(data))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load subscribers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const remove = async (s) => {
    if (!confirm(`Remove ${s.email}?`)) return;
    await api.delete(`/newsletter/admin/${s.id}`);
    load();
  };

  const exportCsv = () => {
    const rows = [['email', 'subscribed_at'], ...subs.map((s) => [s.email, s.created_at])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subs;
    return subs.filter((s) => s.email.toLowerCase().includes(q));
  }, [subs, query]);

  return (
    <div className="section admin-page">
      <div className="container">
        <p className="kicker"><Link to="/admin" className="btn-link">← Admin</Link> · Newsletter</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <h2 className="display sm">Newsletter <em>subscribers</em>.</h2>
            <p style={{ color: 'var(--muted)', marginTop: 8 }}>{subs.length} total</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email…"
              style={{ padding: '10px 14px', borderRadius: 999, border: '1px solid rgba(11,35,64,0.15)', minWidth: 240 }}
            />
            <button type="button" className="btn-solid accent" onClick={exportCsv} disabled={subs.length === 0}>Export CSV</button>
          </div>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}

        <div className="admin-table">
          {loading ? (
            <p style={{ color: 'var(--muted)' }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>{subs.length === 0 ? 'No subscribers yet.' : 'No matches.'}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Subscribed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>{s.email}</td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                    <td className="admin-row-actions">
                      <button type="button" className="btn-link danger" onClick={() => remove(s)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
