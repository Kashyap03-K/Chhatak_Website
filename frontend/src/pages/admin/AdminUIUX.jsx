import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AdminTabs from '../../components/AdminTabs.jsx';

const BUILTIN_LABELS = {
  hero:           'Hero — product pack + bowl visual',
  features:       'Feature strip (5 promises)',
  story:          'Story banner — Born on the coast',
  flavours:       'Flavours grid (from products)',
  'perfect-with': 'Perfect With — 4 use-case tiles',
  why:            'Why Chhatak — dark stats bar',
  gallery:        'Journey gallery (Instagram strip)',
  reels:          'Instagram reels wall',
  reviews:        'Customer reviews wall',
  footer:         'Footer',
  // Legacy keys (kept for backwards-compat with older seeds)
  products: 'Products showcase (legacy)',
  specs:    'By the numbers (legacy)',
  quote:    'Press quote (legacy)',
};

// Which built-in sections have an image manager card shown below the section list.
const SECTIONS_WITH_IMAGES = new Set(['hero', 'story', 'perfect-with', 'gallery']);
const IMAGE_HINTS = {
  hero:           'Image 1 = product pack (shown centered). Image 2 = bowl (bottom-right accent).',
  story:          'A single wide banner image for the yellow story card. First image is used.',
  'perfect-with': 'Exactly 4 images — one per tile: Drinks, Meals, Travel, Movie Nights (in order).',
  gallery:        'The Instagram-style strip. 7 images shown by default; add more to extend the strip.',
};

async function uploadMedia(file) {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/uploads/image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { url: data.url, media_type: data.media_type };
}

export default function AdminUIUX() {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/landing/admin/sections'),
      api.get('/products/'),
    ])
      .then(([s, p]) => { setSections(s.data); setProducts(p.data); })
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const anyDirty = orderDirty || sections.some((s) => s._imagesDirty);
    if (!anyDirty) return undefined;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [orderDirty, sections]);

  // ----- Section reorder (local until Save) -----
  const moveSection = (from, to) => {
    if (from === to || to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSections(next);
    setOrderDirty(true);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await api.put('/landing/admin/sections/reorder', { order: sections.map((s) => s.id) });
      setOrderDirty(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to save order');
    } finally {
      setSavingOrder(false);
    }
  };

  const discardOrder = () => { load(); setOrderDirty(false); };

  const onDragStart = (i) => setDragIndex(i);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (i) => { if (dragIndex !== null) moveSection(dragIndex, i); setDragIndex(null); };

  const toggleActive = async (s) => {
    await api.put(`/landing/admin/sections/${s.id}`, { is_active: !s.is_active });
    load();
  };

  const editMeta = async (s, field, value) => {
    await api.put(`/landing/admin/sections/${s.id}`, { [field]: value });
    load();
  };

  const addGallery = async () => {
    const title = prompt('Gallery title (shown on landing page)?');
    if (title === null) return;
    await api.post('/landing/admin/sections', { kind: 'gallery', title });
    load();
  };

  const deleteSection = async (s) => {
    if (!confirm(`Delete "${s.title || s.key}"? This removes the section and its images.`)) return;
    await api.delete(`/landing/admin/sections/${s.id}`);
    load();
  };

  // ----- Section images -----
  const addImage = async (section, file, extra = {}) => {
    setBusy(true);
    try {
      const { url, media_type } = await uploadMedia(file);
      await api.post(`/landing/admin/sections/${section.id}/images`, {
        image_url: url, media_type, ...extra,
      });
      load();
    } catch (e) {
      alert(e.response?.data?.detail || 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const updateImage = async (img, patch) => {
    await api.put(`/landing/admin/images/${img.id}`, patch);
    load();
  };

  const deleteImage = async (img) => {
    if (!confirm('Delete this image?')) return;
    await api.delete(`/landing/admin/images/${img.id}`);
    load();
  };

  // Buffer image reorders locally; SectionImagesCard has its own Save button.
  const moveImage = (section, from, to) => {
    if (from === to || to < 0 || to >= section.images.length) return;
    setSections((prev) => prev.map((s) => {
      if (s.id !== section.id) return s;
      const next = [...s.images];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return { ...s, images: next, _imagesDirty: true };
    }));
  };

  const saveImageOrder = async (section) => {
    await api.put(`/landing/admin/sections/${section.id}/images/reorder`, {
      order: section.images.map((i) => i.id),
    });
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, _imagesDirty: false } : s)));
  };

  // ----- Product quick-edit -----
  const updateProduct = async (p, patch) => {
    await api.put(`/products/${p.id}`, patch);
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...patch } : x)));
  };

  return (
    <div className="section admin-page">
      <div className="container">
        <p className="kicker">— Admin</p>
        <h2 className="display sm">UI &amp; UX.</h2>
        <AdminTabs />

        {error && <div className="auth-error" style={{ marginTop: 16 }}>{error}</div>}
        {loading ? (
          <p style={{ color: 'var(--muted)', marginTop: 40 }}>Loading…</p>
        ) : (
          <>
            {/* --- SECTION ORDER --- */}
            <div className="admin-section-card" style={{ marginTop: 32 }}>
              <div className="admin-section-card__header">
                <h3>Landing sections</h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {savedFlash && <span style={{ color: 'var(--muted)', fontSize: 12 }}>✓ Saved</span>}
                  {orderDirty && (
                    <button type="button" className="btn-ghost" onClick={discardOrder} disabled={savingOrder}>
                      Discard
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-solid accent"
                    onClick={saveOrder}
                    disabled={!orderDirty || savingOrder}
                  >
                    {savingOrder ? 'Saving…' : orderDirty ? 'Save order' : 'Saved'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={addGallery}>
                    + Add gallery
                  </button>
                </div>
              </div>
              <p style={{ color: 'var(--muted)', margin: '8px 0 16px' }}>
                Drag rows or use ↑↓ to reorder. Click <strong>Save order</strong> to publish.
                Toggle Visible/Hidden to control what appears on the landing page.
              </p>
              <ul className="uiux-section-list">
                {sections.map((s, i) => (
                  <li
                    key={s.id}
                    className={`uiux-section-row${s.is_active ? '' : ' is-hidden'}`}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(i)}
                  >
                    <span className="uiux-drag" aria-hidden="true">⋮⋮</span>
                    <span className="uiux-section-order">{String(i + 1).padStart(2, '0')}</span>
                    <div className="uiux-section-meta">
                      <strong>{s.kind === 'builtin' ? BUILTIN_LABELS[s.key] || s.key : (s.title || s.key)}</strong>
                      <span className="uiux-section-key">{s.key} · {s.kind}</span>
                    </div>
                    <div className="uiux-section-actions">
                      <button type="button" className="btn-link" onClick={() => moveSection(i, i - 1)} disabled={i === 0}>↑</button>
                      <button type="button" className="btn-link" onClick={() => moveSection(i, i + 1)} disabled={i === sections.length - 1}>↓</button>
                      <button type="button" className={`admin-badge ${s.is_active ? '' : 'inactive'}`} onClick={() => toggleActive(s)}>
                        {s.is_active ? 'Visible' : 'Hidden'}
                      </button>
                      <button type="button" className="btn-link danger" onClick={() => deleteSection(s)}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* --- Image managers per section --- */}
            {sections
              .filter((s) => s.kind === 'gallery' || SECTIONS_WITH_IMAGES.has(s.key))
              .map((s) => (
                <SectionImagesCard
                  key={s.id}
                  section={s}
                  isHero={s.key === 'hero'}
                  hint={IMAGE_HINTS[s.key]}
                  builtinLabel={BUILTIN_LABELS[s.key]}
                  onAdd={addImage}
                  onUpdate={updateImage}
                  onDelete={deleteImage}
                  onMove={moveImage}
                  onEditMeta={editMeta}
                  onSaveImageOrder={saveImageOrder}
                  busy={busy}
                />
              ))}

            {/* --- PRODUCT PRICING QUICK-EDIT --- */}
            <div className="admin-section-card" style={{ marginTop: 32 }}>
              <div className="admin-section-card__header">
                <h3>Product pricing (quick edit)</h3>
                <Link to="/admin/products" className="btn-link">Full editor →</Link>
              </div>
              <table className="admin-table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price (₹)</th>
                    <th>Compare-at (₹)</th>
                    <th>Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.name}</strong>
                        {p.flavor && <div style={{ color: 'var(--muted)', fontSize: 12 }}>{p.flavor}</div>}
                      </td>
                      <td>
                        <input
                          type="number"
                          defaultValue={p.price}
                          className="uiux-inline-input"
                          onBlur={(e) => {
                            const v = parseFloat(e.target.value);
                            if (!isNaN(v) && v !== p.price) updateProduct(p, { price: v });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          defaultValue={p.compare_at_price || ''}
                          className="uiux-inline-input"
                          onBlur={(e) => {
                            const raw = e.target.value;
                            const v = raw === '' ? null : parseFloat(raw);
                            if (v !== p.compare_at_price) updateProduct(p, { compare_at_price: v });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          defaultValue={p.stock}
                          className="uiux-inline-input"
                          onBlur={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v !== p.stock) updateProduct(p, { stock: v });
                          }}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`admin-badge ${p.is_active ? '' : 'inactive'}`}
                          onClick={() => updateProduct(p, { is_active: !p.is_active })}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


function SectionImagesCard({ section, isHero, hint, builtinLabel, onAdd, onUpdate, onDelete, onMove, onEditMeta, onSaveImageOrder, busy }) {
  const fileRef = useRef(null);
  const [pendingMeta, setPendingMeta] = useState({ kicker: '', title: '', body: '' });
  const [savingImgOrder, setSavingImgOrder] = useState(false);

  const handleSaveOrder = async () => {
    setSavingImgOrder(true);
    try { await onSaveImageOrder(section); }
    catch (e) { alert(e.response?.data?.detail || 'Failed to save order'); }
    finally { setSavingImgOrder(false); }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onAdd(section, file, pendingMeta);
    setPendingMeta({ kicker: '', title: '', body: '' });
    e.target.value = '';
  };

  return (
    <div className="admin-section-card" style={{ marginTop: 32 }}>
      <div className="admin-section-card__header">
        <h3>{builtinLabel || section.title || section.key}</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="uiux-section-key">{section.images.length} image{section.images.length === 1 ? '' : 's'}</span>
          {section._imagesDirty && (
            <button
              type="button"
              className="btn-solid accent"
              onClick={handleSaveOrder}
              disabled={savingImgOrder}
            >
              {savingImgOrder ? 'Saving…' : 'Save image order'}
            </button>
          )}
        </div>
      </div>
      {hint && (
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 12px' }}>{hint}</p>
      )}

      {!isHero && (
        <div className="form-row" style={{ marginTop: 12 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Gallery title</label>
            <input
              type="text"
              defaultValue={section.title || ''}
              onBlur={(e) => e.target.value !== (section.title || '') && onEditMeta(section, 'title', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label>Subtitle</label>
            <input
              type="text"
              defaultValue={section.subtitle || ''}
              onBlur={(e) => e.target.value !== (section.subtitle || '') && onEditMeta(section, 'subtitle', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="uiux-image-grid">
        {section.images.map((img, i) => (
          <div className="uiux-image-card" key={img.id}>
            {img.media_type === 'video' ? (
              <video src={img.image_url} muted playsInline preload="metadata" />
            ) : (
              <img src={img.image_url} alt={img.title || ''} />
            )}
            {isHero && (
              <div className="uiux-image-fields">
                <input
                  type="text"
                  placeholder="Kicker"
                  defaultValue={img.kicker || ''}
                  onBlur={(e) => e.target.value !== (img.kicker || '') && onUpdate(img, { kicker: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Title"
                  defaultValue={img.title || ''}
                  onBlur={(e) => e.target.value !== (img.title || '') && onUpdate(img, { title: e.target.value })}
                />
                <textarea
                  placeholder="Body"
                  rows={2}
                  defaultValue={img.body || ''}
                  onBlur={(e) => e.target.value !== (img.body || '') && onUpdate(img, { body: e.target.value })}
                />
              </div>
            )}
            <div className="uiux-image-actions">
              <button type="button" className="btn-link" onClick={() => onMove(section, i, i - 1)} disabled={i === 0}>←</button>
              <span style={{ color: 'var(--muted)', fontSize: 12 }}>{i + 1}</span>
              <button type="button" className="btn-link" onClick={() => onMove(section, i, i + 1)} disabled={i === section.images.length - 1}>→</button>
              <button type="button" className="btn-link danger" onClick={() => onDelete(img)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="uiux-add-image">
        {isHero && (
          <div className="form-row" style={{ marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Kicker (optional)"
              value={pendingMeta.kicker}
              onChange={(e) => setPendingMeta({ ...pendingMeta, kicker: e.target.value })}
            />
            <input
              type="text"
              placeholder="Title (optional)"
              value={pendingMeta.title}
              onChange={(e) => setPendingMeta({ ...pendingMeta, title: e.target.value })}
            />
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={isHero ? 'image/*' : 'image/*,video/*'}
          onChange={handleFile}
          disabled={busy}
        />
        {!isHero && (
          <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 10 }}>
            Images or videos (mp4/webm/mov · max 60 MB)
          </span>
        )}
        {busy && <span style={{ color: 'var(--muted)', marginLeft: 8 }}>Uploading…</span>}
      </div>
    </div>
  );
}
