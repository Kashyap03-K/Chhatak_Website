import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

const EMPTY = { author: '', handle: '', location: '', rating: 5, quote: '', is_active: true, sort_order: 0 };

export default function AdminReviews() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/reviews/admin/all')
      .then(({ data }) => setItems(data))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load reviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reset = () => { setForm(EMPTY); setEditingId(null); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = { ...form, handle: form.handle || null, location: form.location || null };
    try {
      if (editingId) await api.put(`/reviews/${editingId}`, payload);
      else await api.post('/reviews/', payload);
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
    setForm({
      author: r.author, handle: r.handle || '', location: r.location || '',
      rating: r.rating, quote: r.quote, is_active: r.is_active, sort_order: r.sort_order,
    });
  };

  const toggleActive = async (r) => {
    await api.put(`/reviews/${r.id}`, { is_active: !r.is_active });
    load();
  };

  const remove = async (r) => {
    if (!confirm(`Delete review by ${r.author}?`)) return;
    await api.delete(`/reviews/${r.id}`);
    load();
  };

  return (
    <div className="section admin-page">
      <div className="container">
        <p className="kicker"><Link to="/admin" className="btn-link">← Admin</Link> · Reviews</p>
        <h2 className="display sm">Customer <em>reviews</em>.</h2>

        {error && <div className="auth-error" style={{ marginTop: '24px' }}>{error}</div>}

        <form onSubmit={submit} className="admin-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="author">Author</label>
              <input id="author" type="text" required value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="location">Location</label>
              <input id="location" type="text" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Mumbai, MH" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="handle">Handle (optional)</label>
              <input id="handle" type="text" value={form.handle}
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
                placeholder="@handle" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="rating">Rating (1–5)</label>
              <input id="rating" type="number" min="1" max="5" value={form.rating}
                onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value, 10) || 5 })} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="sort_order">Sort order</label>
              <input id="sort_order" type="number" value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="quote">Quote</label>
            <textarea id="quote" required rows={3} value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              placeholder="What they said…" />
          </div>
          <label className="admin-checkbox">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span>Active — show on landing page</span>
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="btn-solid accent" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add review'}
            </button>
            {editingId && (
              <button type="button" className="btn-ghost" onClick={reset}>Cancel</button>
            )}
          </div>
        </form>

        <div className="admin-table" style={{ marginTop: '40px' }}>
          {loading ? (
            <p style={{ color: 'var(--muted)' }}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No reviews yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Author</th>
                  <th>Quote</th>
                  <th>★</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.sort_order}</td>
                    <td>
                      <div>{r.author}</div>
                      {r.location && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.location}</div>}
                    </td>
                    <td style={{ maxWidth: 480 }}>{r.quote}</td>
                    <td>{r.rating}</td>
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
