import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

const EMPTY = { video_url: '', poster_url: '', caption: '', is_active: true, sort_order: 0 };

export default function AdminReels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const videoRef = useRef(null);
  const posterRef = useRef(null);

  const load = () => {
    setLoading(true);
    api.get('/reels/admin/all')
      .then(({ data }) => setReels(data))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load reels'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError('');
    if (videoRef.current) videoRef.current.value = '';
    if (posterRef.current) posterRef.current.value = '';
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const { data } = await api.post('/uploads/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const data = await uploadFile(file);
      if (data.media_type !== 'video') {
        setError('Please upload a video file (mp4, webm, mov).');
        return;
      }
      setForm((f) => ({ ...f, video_url: data.url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Video upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingPoster(true);
    try {
      const data = await uploadFile(file);
      setForm((f) => ({ ...f, poster_url: data.url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Poster upload failed');
    } finally {
      setUploadingPoster(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.video_url) {
      setError('Upload a video before saving.');
      return;
    }
    setBusy(true);
    try {
      if (editingId) await api.put(`/reels/${editingId}`, form);
      else await api.post('/reels/', form);
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
      video_url: r.video_url || '',
      poster_url: r.poster_url || '',
      caption: r.caption || '',
      is_active: r.is_active,
      sort_order: r.sort_order,
    });
  };

  const toggleActive = async (r) => {
    await api.put(`/reels/${r.id}`, { is_active: !r.is_active });
    load();
  };

  const remove = async (r) => {
    if (!confirm('Delete this reel?')) return;
    await api.delete(`/reels/${r.id}`);
    load();
  };

  return (
    <div className="section admin-page">
      <div className="container">
        <p className="kicker"><Link to="/admin" className="btn-link">← Admin</Link> · Reels</p>
        <h2 className="display sm">Reel <em>videos</em>.</h2>

        {error && <div className="auth-error" style={{ marginTop: '24px' }}>{error}</div>}

        <form onSubmit={submit} className="admin-form">
          <div className="form-group">
            <label>Video file (mp4/webm/mov · max 500 MB)</label>
            <input
              ref={videoRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={uploading || busy}
            />
            {uploading && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Uploading…</p>}
            {form.video_url && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <video src={form.video_url} controls playsInline preload="metadata" style={{ width: 220, borderRadius: 8, background: '#000' }} />
                <button type="button" className="btn-link" onClick={() => setForm((f) => ({ ...f, video_url: '' }))}>Remove video</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Poster image (optional — shown before playback)</label>
            <input
              ref={posterRef}
              type="file"
              accept="image/*"
              onChange={handlePosterUpload}
              disabled={uploadingPoster || busy}
            />
            {uploadingPoster && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Uploading…</p>}
            {form.poster_url && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
                <img src={form.poster_url} alt="poster" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(11,35,64,0.15)' }} />
                <button type="button" className="btn-link" onClick={() => setForm((f) => ({ ...f, poster_url: '' }))}>Remove poster</button>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="caption">Caption</label>
              <input
                id="caption"
                type="text"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="Short caption shown below the reel"
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

          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span>Active — show on landing page</span>
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="btn-solid accent" disabled={busy || uploading}>
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
                  <th>Preview</th>
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
                      {r.video_url ? (
                        <video src={r.video_url} poster={r.poster_url || undefined} muted playsInline preload="metadata" style={{ width: 90, height: 120, objectFit: 'cover', borderRadius: 6, background: '#000' }} />
                      ) : r.shortcode ? (
                        <a href={`https://www.instagram.com/reel/${r.shortcode}/`} target="_blank" rel="noopener" className="btn-link">
                          {r.shortcode}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      )}
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
