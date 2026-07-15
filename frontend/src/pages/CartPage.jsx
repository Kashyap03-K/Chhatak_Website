import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const PRODUCT_IMAGES = {
  'indian-classic': '/images/bowl.JPG',
  'peri-peri-blaze': '/images/packaging-real.JPG',
  'combo-3x-classic': '/images/packaging-front-back.png',
};

export default function CartPage() {
  const { items, loading, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  const shipping = totalPrice >= 499 ? 0 : 49;
  const freeShippingProgress = Math.min((totalPrice / 499) * 100, 100);

  return (
    <div className="section cart-page">
      <div className="container">
        <p className="kicker center">— Your bag</p>
        <h2 className="display sm center">Shopping <em>cart</em>.</h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '40px' }}>Loading cart...</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__icon">~</p>
            <p className="empty-state__text">Your bag is empty.</p>
            <Link to="/products" className="btn-solid accent">Browse products →</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  {PRODUCT_IMAGES[item.product.slug] && (
                    <Link to={`/products/${item.product.slug}`} className="cart-item-thumb">
                      <img src={PRODUCT_IMAGES[item.product.slug]} alt={item.product.name} />
                    </Link>
                  )}
                  <div className="cart-item-info">
                    <Link to={`/products/${item.product.slug}`}>
                      <h3>{item.product.name}</h3>
                    </Link>
                    <p className="cart-item-flavor">{item.product.flavor} · {item.product.weight}</p>
                    <p className="cart-item-price">₹{item.product.price} each</p>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, item.product.stock))}
                        disabled={item.quantity >= item.product.stock}
                      >+</button>
                    </div>
                    <span className="cart-item-total">₹{item.product.price * item.quantity}</span>
                    <button className="cart-remove" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </div>
              ))}
              <button className="btn-link" onClick={clearCart} style={{ marginTop: '16px' }}>Clear cart</button>
            </div>

            <div className="cart-summary">
              <h3>Order summary</h3>
              {items.map((item) => (
                <div className="summary-item" key={item.id}>
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>₹{item.product.price * item.quantity}</span>
                </div>
              ))}
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{totalPrice + shipping}</span>
              </div>
              {totalPrice < 499 && (
                <div className="shipping-progress">
                  <div className="shipping-progress__bar">
                    <div className="shipping-progress__fill" style={{ width: `${freeShippingProgress}%` }} />
                  </div>
                  <p className="shipping-progress__text">Add ₹{499 - totalPrice} more for free shipping</p>
                </div>
              )}
              <Link to="/checkout" className="btn-solid accent full" style={{ marginTop: '24px' }}>
                Proceed to checkout →
              </Link>
              <Link to="/products" className="btn-link" style={{ display: 'block', textAlign: 'center', marginTop: '16px' }}>
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
