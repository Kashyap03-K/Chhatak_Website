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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    api.get('/products/')
      .then(({ data }) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="section products-page">
      <div className="container">
        <p className="kicker center">— Shop</p>
        <h2 className="display sm center">Our <em>range</em>.</h2>
        <p className="muted-text" style={{ textAlign: 'center', margin: '20px auto 60px', maxWidth: '440px' }}>
          A small, considered range. We'd rather make a few things well than many things average.
        </p>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>No products available yet.</p>
        ) : (
          <div className="flavor-grid">
            {products.map((product, i) => (
              <article className="flavor-card" key={product.id}>
                <Link to={`/products/${product.slug}`}>
                  <div className={`flavor-thumb ${TONE_MAP[product.flavor] || 'tone-warm'}`}>
                    {PRODUCT_IMAGES[product.slug] && (
                      <img src={PRODUCT_IMAGES[product.slug]} alt={product.name} className="flavor-img" />
                    )}
                    <span className="flavor-label">{String(i + 1).padStart(2, '0')} / {product.flavor || product.name}</span>
                  </div>
                </Link>
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
                        className="btn-link"
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
    </div>
  );
}
