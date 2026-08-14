import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const TONE_MAP = {
  'Indian Classic': 'tone-warm',
  'Peri Peri Blaze': 'tone-fire',
  'Mint & Lime': 'tone-cool',
};

const WaveDoodle = () => (
  <svg viewBox="0 0 220 40" fill="none" aria-hidden="true" className="pd-doodle pd-doodle--wave">
    <path d="M2 22 Q 25 6, 48 22 T 96 22 T 144 22 T 192 22 T 218 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M8 32 Q 32 20, 56 32 T 108 32 T 160 32 T 210 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
  </svg>
);

const SunDoodle = () => (
  <svg viewBox="0 0 60 60" fill="none" aria-hidden="true" className="pd-doodle pd-doodle--sun">
    <circle cx="30" cy="30" r="10" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const rad = (a * Math.PI) / 180;
      return (
        <line key={a}
          x1={30 + Math.cos(rad) * 16} y1={30 + Math.sin(rad) * 16}
          x2={30 + Math.cos(rad) * 24} y2={30 + Math.sin(rad) * 24}
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      );
    })}
  </svg>
);

const SparkDoodle = () => (
  <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="pd-doodle pd-doodle--spark">
    <path d="M20 4 L 20 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M4 20 L 14 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M26 20 L 36 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 26 L 20 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M8 8 L 14 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M26 26 L 32 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/products/slug/${slug}`).then(({ data }) => data).catch(() => null),
      api.get('/products/').then(({ data }) => data).catch(() => []),
    ]).then(([p, all]) => {
      setProduct(p);
      setOthers(all.filter((x) => x.slug !== slug && x.is_active).slice(0, 3));
    }).finally(() => setLoading(false));
    setActiveImage(0);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add to cart';
      alert(msg);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="section" style={{ paddingTop: '120px' }}>
        <div className="container">
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="section" style={{ paddingTop: '120px' }}>
        <div className="container">
          <h2 className="display sm center">Product not <em>found</em>.</h2>
          <p style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/products" className="btn-link">Back to shop →</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="section product-detail-page">
        <div className="container">
          <Link to="/products" className="btn-link" style={{ marginBottom: '40px', display: 'inline-block' }}>← Back to shop</Link>

          <div className="product-detail-grid">
            <div className="product-visual">
              {(() => {
                const gallery = (product.images && product.images.length)
                  ? product.images
                  : (product.image_url ? [product.image_url] : []);
                if (!gallery.length) {
                  return (
                    <div className={`flavor-thumb large ${TONE_MAP[product.flavor] || 'tone-warm'}`}>
                      <span className="flavor-label">{product.flavor || product.name}</span>
                    </div>
                  );
                }
                const idx = Math.min(activeImage, gallery.length - 1);
                const go = (delta) => setActiveImage((i) => {
                  const n = gallery.length;
                  return ((i + delta) % n + n) % n;
                });
                return (
                  <>
                    <div className="product-image-wrap">
                      <img src={gallery[idx]} alt={product.name} className="product-image" />
                      {gallery.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="product-image-arrow product-image-arrow--prev"
                            aria-label="Previous image"
                            onClick={() => go(-1)}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="product-image-arrow product-image-arrow--next"
                            aria-label="Next image"
                            onClick={() => go(1)}
                          >
                            ›
                          </button>
                          <span className="product-image-counter">{idx + 1} / {gallery.length}</span>
                        </>
                      )}
                    </div>
                    {gallery.length > 1 && (
                      <div className="product-gallery-thumbs">
                        {gallery.map((url, i) => (
                          <button
                            key={`${url}-${i}`}
                            type="button"
                            className={`product-gallery-thumb${i === idx ? ' is-active' : ''}`}
                            onClick={() => setActiveImage(i)}
                            aria-label={`Show image ${i + 1}`}
                          >
                            <img src={url} alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="product-info">
              <p className="kicker">— {product.category}</p>
              <h1 className="display sm">{product.name}</h1>
              <p className="product-description">{product.description}</p>

              <div className="product-price-row">
                <span className="product-price">₹{product.price}</span>
                {product.compare_at_price && (
                  <span className="price-was">₹{product.compare_at_price}</span>
                )}
              </div>

              <div className="product-meta-details">
                <div className="meta-item">
                  <span className="meta-label">Weight</span>
                  <span>{product.weight}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Flavor</span>
                  <span>{product.flavor}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Stock</span>
                  <span>{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</span>
                </div>
              </div>

              <div className="product-actions">
                <div className="quantity-control">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="qty-btn">−</button>
                  <span className="qty-value">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(q + 1, product.stock))} className="qty-btn">+</button>
                </div>
                <button
                  className="btn-solid accent"
                  onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}
                  style={{ flex: 1 }}
                >
                  {added ? 'Added to bag!' : adding ? 'Adding...' : product.stock === 0 ? 'Out of stock' : `Add to bag — ₹${product.price * quantity}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {product.long_description && (
        <section className="pd-about">
          <div className="container">
            <SunDoodle />
            <SparkDoodle />
            <div className="pd-about-inner">
              <p className="kicker">— About this flavor</p>
              <h2 className="display sm">The story behind <em>{product.name}</em>.</h2>
              <WaveDoodle />
              <div className="pd-about-body">
                {product.long_description.split(/\n\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="pd-others">
          <div className="container">
            <div className="pd-others-head">
              <div>
                <p className="kicker">— Other flavors</p>
                <h2 className="display sm">Try something <em>else</em>.</h2>
              </div>
              <Link to="/#products" className="btn-link">View all products →</Link>
            </div>

            <div className="pd-others-grid">
              {others.map((p) => (
                <Link key={p.id} to={`/products/${p.slug}`} className="pd-other-card">
                  <div className={`pd-other-thumb ${TONE_MAP[p.flavor] || 'tone-warm'}`}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} />
                    ) : (
                      <span className="flavor-label">{p.flavor || p.name}</span>
                    )}
                  </div>
                  <div className="pd-other-body">
                    <h3>{p.name}</h3>
                    <p>{p.description?.slice(0, 90) || 'A coastal favorite.'}</p>
                    <div className="pd-other-foot">
                      <span className="pd-other-price">₹{p.price}</span>
                      <span className="btn-link">Shop →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
