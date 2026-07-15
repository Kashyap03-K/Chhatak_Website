import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const TONE_MAP = {
  'Indian Classic': 'tone-warm',
  'Peri Peri Blaze': 'tone-fire',
  'Mint & Lime': 'tone-cool',
};

const PRODUCT_IMAGES = {
  'indian-classic': '/images/bowl.JPG',
  'peri-peri-blaze': '/images/packaging-real.JPG',
  'combo-3x-classic': '/images/packaging-front-back.png',
};

const WISHLIST_KEY = 'chhatak_wishlist';

function readWishlist() {
  try { return new Set(JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')); }
  catch { return new Set(); }
}

export default function ProductsShowcase() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [wishlist, setWishlist] = useState(() => readWishlist());
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/products/')
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash === '#products') {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading]);

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setAddingId(productId);
    try {
      await addToCart(productId);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add to cart';
      alert(msg);
    } finally {
      setAddingId(null);
    }
  };

  if (!loading && products.length === 0) return null;

  return (
    <section id="products" className="section flavors">
      <div className="container">
        <div className="flavors-head">
          <div>
            <p className="kicker">— The range</p>
            <h2 className="display sm">Our <em>products</em>.</h2>
          </div>
          <p className="muted-text">A small, considered range. We'd rather make a few things well than many things average.</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading products...</p>
        ) : (
          <div className="flavor-grid">
            {products.map((product, i) => (
              <article className="flavor-card" key={product.id}>
                <div className={`flavor-thumb ${TONE_MAP[product.flavor] || 'tone-warm'}`}>
                  <Link to={`/products/${product.slug}`} className="flavor-thumb-link">
                    {PRODUCT_IMAGES[product.slug] && (
                      <img src={PRODUCT_IMAGES[product.slug]} alt={product.name} className="flavor-img" />
                    )}
                    <span className="flavor-label">{String(i + 1).padStart(2, '0')} / {product.flavor || product.name}</span>
                  </Link>
                  <button
                    type="button"
                    className={`wishlist-btn ${wishlist.has(product.id) ? 'is-active' : ''}`}
                    onClick={() => toggleWishlist(product.id)}
                    aria-label={wishlist.has(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={wishlist.has(product.id)}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill={wishlist.has(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.4 5.6a5.5 5.5 0 0 0-7.8 0L12 6.2l-.6-.6a5.5 5.5 0 1 0-7.8 7.8l.6.6L12 21.8l7.8-7.8.6-.6a5.5 5.5 0 0 0 0-7.8Z" />
                    </svg>
                  </button>
                </div>
                <div className="flavor-body">
                  <Link to={`/products/${product.slug}`}>
                    <h3>{product.name}</h3>
                  </Link>
                  <p>{product.description}</p>
                  <div className="flavor-meta">
                    <span>
                      ₹{product.price}
                      {product.compare_at_price && (
                        <span className="price-was" style={{ marginLeft: '8px', fontSize: '14px' }}>₹{product.compare_at_price}</span>
                      )}
                    </span>
                    {product.stock > 0 ? (
                      <button
                        className="btn-solid accent"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? 'Adding...' : 'Add to bag →'}
                      </button>
                    ) : (
                      <span className="out-of-stock-label">Out of stock</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
