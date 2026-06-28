import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ModelViewer from '../ModelViewer.jsx';

const TONE_MAP = {
  'Indian Classic': 'tone-warm',
  'Peri Peri Blaze': 'tone-fire',
  'Mint & Lime': 'tone-cool',
};

const PRODUCT_GALLERY = {
  'indian-classic': ['/images/bowl.JPG', '/images/packaging-front-back.png', '/images/nutrition.PNG', '/images/bowl-annotated.JPG'],
  'peri-peri-blaze': ['/images/packaging-real.JPG', '/images/packaging-front-back.png', '/images/nutrition.PNG'],
  'combo-3x-classic': ['/images/packaging-front-back.png', '/images/bowl.JPG', '/images/nutrition.PNG'],
};

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    api.get(`/products/slug/${slug}`)
      .then(({ data }) => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
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
    <div className="section product-detail-page">
      <div className="container">
        <Link to="/products" className="btn-link" style={{ marginBottom: '40px', display: 'inline-block' }}>← Back to shop</Link>

        <div className="product-detail-grid">
          <div className="product-visual">
            {PRODUCT_GALLERY[product.slug] ? (
              <div className="product-gallery">
                <div className="gallery-main">
                  <img src={PRODUCT_GALLERY[product.slug][activeImage]} alt={product.name} className="gallery-main-img" />
                </div>
                <div className="gallery-thumbs">
                  {PRODUCT_GALLERY[product.slug].map((src, i) => (
                    <button
                      key={i}
                      className={`gallery-thumb ${activeImage === i ? 'active' : ''}`}
                      onClick={() => setActiveImage(i)}
                    >
                      <img src={src} alt={`${product.name} view ${i + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            ) : product.model_url ? (
              <div className="product-model-wrap">
                <ModelViewer
                  url={product.model_url}
                  width="100%"
                  height={500}
                  defaultRotationX={0}
                  defaultRotationY={0}
                  defaultZoom={2}
                  minZoomDistance={1}
                  maxZoomDistance={6}
                  ambientIntensity={0.45}
                  keyLightIntensity={1.3}
                  fillLightIntensity={0.5}
                  rimLightIntensity={1.1}
                  environmentPreset="night"
                  autoRotate
                  autoRotateSpeed={0.35}
                  autoFrame
                  fadeIn
                  enableMouseParallax
                  enableHoverRotation
                  showScreenshotButton={false}
                />
              </div>
            ) : (
              <div className={`flavor-thumb large ${TONE_MAP[product.flavor] || 'tone-warm'}`}>
                <span className="flavor-label">{product.flavor || product.name}</span>
              </div>
            )}
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
  );
}
