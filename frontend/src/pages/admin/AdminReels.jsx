import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

const EMPTY = { shortcode: '', caption: '', is_active: true, sort_order: 0 };

function extractShortcode(input) {
  if (!input) return input;
  const m = input.match(/instagram\.com\/reel\/([^/?#]+)/i);
  return m ? m[1] : input.trim();
}

export default function AdminReels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/reels/admin/all')
      .then(({ data }) => setReels(data))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load reels'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(EMPTY); setEditingId(null); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = { ...form, shortcode: extractShortcode(form.shortcode) };
    try {
      if (editingId) await api.put(`/reels/${editingId}`, payload);
      else await api.post('/reels/', payload);
      reset();
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ shortcode: r.shortcode, caption: r.caption || '', is_active: r.is_active, sort_order: r.sort_order });
  };

  const toggleActive = async (r) => {
    await api.put(`/reels/${r.id}`, { is_active: !r.is_active });
    load();
  };

  const remove = async (r) => {
    if (!confirm(`Delete reel ${r.shortcode}?`)) return;
    await api.delete(`/reels/${r.id}`);
    load();
  };

  return (
    <div className="section admin-page">
      <div className="container">
        <p className="kicker"><Link to="/admin" className="btn-link">← Admin</Link> · Reels</p>
        <h2 className="display sm">Instagram <em>reels</em>.</h2>

        {error && <div className="auth-error" style={{ marginTop: '24px' }}>{error}</div>}

        <form onSubmit={submit} className="admin-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="shortcode">Reel URL or shortcode</label>
              <input
                id="shortcode"
                type="text"
                value={form.shortcode}
                onChange={(e) => setForm({ ...form, shortcode: e.target.value })}
                placeholder="https://www.instagram.com/reel/ABC123/ or ABC123"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="sort_order">Sort order</label>
              <input
                id="sort_order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="caption">Caption</label>
            <input
              id="caption"
              type="text"
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Short caption shown below the reel"
            />
          </div>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span>Active — show on landing page</span>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-solid accent" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add reel'}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>
            )}
          </div>
        </form>

        <div className="admin-table" style={{ marginTop: '40px' }}>
          {loading ? (
            <p style={{ color: 'var(--muted)' }}>Loading…</p>
          ) : reels.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No reels yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Shortcode</th>
                  <th>Caption</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reels.map((r) => (
                  <tr key={r.id}>
                    <td>{r.sort_order}</td>
                    <td>
                      <a href={`https://www.instagram.com/reel/${r.shortcode}/`} target="_blank" rel="noopener" className="btn-link">
                        {r.shortcode}
                      </a>
                    </td>
                    <td>{r.caption}</td>
                    <td>
                      <button type="button" className={`admin-badge ${r.is_active ? '' : 'inactive'}`} onClick={() => toggleActive(r)}>
                        {r.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="admin-row-actions">
                      <button type="button" className="btn-link" onClick={() => startEdit(r)}>Edit</button>
                      <button type="button" className="btn-link danger" onClick={() => remove(r)}>Delete</button>
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
