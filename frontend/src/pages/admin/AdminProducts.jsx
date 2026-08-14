import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', long_description: '', images: [], price: '', compare_at_price: '', weight: '100g', flavor: '', stock: '', is_active: true, is_featured: false });
  const [uploading, setUploading] = useState(false);

  const fetchProducts = () => {
    api.get('/products/')
      .then(({ data }) => setProducts(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', long_description: '', images: [], price: '', compare_at_price: '', weight: '100g', flavor: '', stock: '', is_active: true, is_featured: false });
    setEditing(null);
    setShowCreate(false);
  };

  const startEdit = (product) => {
    const gallery = Array.isArray(product.images) && product.images.length
      ? product.images
      : (product.image_url ? [product.image_url] : []);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      long_description: product.long_description || '',
      images: gallery,
      price: String(product.price),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
      weight: product.weight,
      flavor: product.flavor || '',
      stock: String(product.stock),
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setEditing(product.id);
    setShowCreate(true);
  };

  const uploadOne = async (file) => {
    const data = new FormData();
    data.append('file', file);
    const token = localStorage.getItem('access_token');
    const base = import.meta.env.VITE_API_URL || '/api/v1';
    const resp = await fetch(`${base}/uploads/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: data,
    });
    if (!resp.ok) {
      let detail = `HTTP ${resp.status}`;
      try { detail = (await resp.json()).detail || detail; } catch {}
      throw new Error(detail);
    }
    const res = await resp.json();
    if (!res.url) throw new Error('Server did not return an image URL');
    return res.url;
  };

  const handleImageUpload = async (e) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        // Upload sequentially so a failure surfaces the exact file, and the
        // shared uploads dir doesn't get hammered in parallel.
        urls.push(await uploadOne(file));
      }
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      alert(`Upload failed: ${err.message || 'unknown error'}`);
    } finally {
      setUploading(false);
      if (input) input.value = '';
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const moveImage = (idx, dir) => {
    setForm(f => {
      const next = [...f.images];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return f;
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...f, images: next };
    });
  };

  const setCover = (idx) => {
    setForm(f => {
      if (idx === 0) return f;
      const next = [...f.images];
      const [pick] = next.splice(idx, 1);
      next.unshift(pick);
      return { ...f, images: next };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      stock: parseInt(form.stock) || 0,
      images: form.images,
      image_url: form.images[0] || null,
      long_description: form.long_description || null,
      description: form.description || null,
      flavor: form.flavor || null,
    };

    try {
      if (editing) {
        await api.put(`/products/${editing}`, payload);
      } else {
        await api.post('/products/', payload);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch {
      alert('Failed to deactivate product');
    }
  };

  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <div className="section admin-page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <Link to="/admin" className="btn-link" style={{ marginBottom: '16px', display: 'inline-block' }}>← Dashboard</Link>
            <p className="kicker">— Admin</p>
            <h2 className="display sm">Products.</h2>
          </div>
          {!showCreate && (
            <button className="btn-solid accent" onClick={() => setShowCreate(true)}>+ Add product</button>
          )}
        </div>

        {showCreate && (
          <div className="admin-form-card">
            <h3>{editing ? 'Edit product' : 'New product'}</h3>
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={form.name} onChange={(e) => { setForm(f => ({ ...f, name: e.target.value, slug: editing ? f.slug : autoSlug(e.target.value) })); }} required />
                </div>
                <div className="form-group">
                  <label>Slug *</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Short description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
              </div>
              <div className="form-group">
                <label>Long description (shown in the About section on the product page)</label>
                <textarea value={form.long_description} onChange={(e) => setForm(f => ({ ...f, long_description: e.target.value }))} rows={6} placeholder="A few paragraphs about this flavor — story, ingredients, pairings…" />
              </div>
              <div className="form-group">
                <label>Product images</label>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '6px 0 0' }}>
                  First image is the cover shown on the shop grid. Pick multiple files, or add more later.
                </p>
                {uploading && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Uploading…</p>}
                {form.images.length > 0 && (
                  <div className="admin-product-gallery">
                    {form.images.map((url, idx) => (
                      <div className={`admin-product-thumb${idx === 0 ? ' is-cover' : ''}`} key={`${url}-${idx}`}>
                        <img src={url} alt={`Image ${idx + 1}`} />
                        {idx === 0 && <span className="admin-product-thumb__badge">Cover</span>}
                        <div className="admin-product-thumb__actions">
                          <button type="button" title="Move left" onClick={() => moveImage(idx, -1)} disabled={idx === 0}>◀</button>
                          {idx !== 0 && (
                            <button type="button" title="Make cover" onClick={() => setCover(idx)}>★</button>
                          )}
                          <button type="button" title="Move right" onClick={() => moveImage(idx, 1)} disabled={idx === form.images.length - 1}>▶</button>
                          <button type="button" title="Remove" onClick={() => removeImage(idx)} className="danger">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label>Compare at price (₹)</label>
                  <input type="number" step="0.01" value={form.compare_at_price} onChange={(e) => setForm(f => ({ ...f, compare_at_price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Weight</label>
                  <input type="text" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Flavor</label>
                  <input type="text" value={form.flavor} onChange={(e) => setForm(f => ({ ...f, flavor: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                <label className="save-checkbox">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  Active
                </label>
                <label className="save-checkbox">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  Featured
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn-solid accent">{editing ? 'Update' : 'Create'}</button>
                <button type="button" className="btn-outline" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <br /><span style={{ fontSize: '12px', color: 'var(--muted)' }}>{p.flavor} · {p.weight}</span>
                    </td>
                    <td>
                      ₹{p.price}
                      {p.compare_at_price && <span style={{ color: 'var(--muted)', textDecoration: 'line-through', marginLeft: '8px', fontSize: '13px' }}>₹{p.compare_at_price}</span>}
                    </td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`admin-badge ${p.is_active ? 'active' : 'inactive'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-link" onClick={() => startEdit(p)}>Edit</button>
                        <button className="btn-link" style={{ color: '#f77' }} onClick={() => handleDelete(p.id)}>Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
