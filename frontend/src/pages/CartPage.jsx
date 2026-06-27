import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function CartPage() {
  const { items, loading, totalPrice, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <div className="section cart-page">
      <div className="container">
        <p className="kicker center">— Your bag</p>
        <h2 className="display sm center">Shopping <em>cart</em>.</h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '40px' }}>Loading cart...</p>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>Your bag is empty.</p>
            <Link to="/products" className="btn-solid accent">Browse products →</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-info">
                    <h3>{item.product.name}</h3>
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
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{totalPrice >= 499 ? 'Free' : '₹49'}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{totalPrice + (totalPrice >= 499 ? 0 : 49)}</span>
              </div>
              {totalPrice < 499 && (
                <p className="shipping-note">Add ₹{499 - totalPrice} more for free shipping</p>
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
