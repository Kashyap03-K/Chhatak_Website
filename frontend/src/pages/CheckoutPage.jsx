import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import api from '../api/client.js';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shipping = totalPrice >= 499 ? 0 : 49;
  const grandTotal = totalPrice + shipping;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) { setError('Please enter a shipping address'); return; }
    setError('');
    setLoading(true);

    try {
      const { data: order } = await api.post('/orders/', { shipping_address: address });

      const { data: payment } = await api.post('/payments/create-order', { order_id: order.id });

      const options = {
        key: payment.razorpay_key_id,
        amount: payment.amount,
        currency: payment.currency,
        name: 'Chhatak',
        description: `Order #${order.id}`,
        order_id: payment.razorpay_order_id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            await clearCart();
            navigate(`/orders`);
          } catch {
            setError('Payment verification failed. Contact support.');
          }
        },
        prefill: {},
        theme: { color: '#E89148' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setError('Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create order.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart', { replace: true });
    return null;
  }

  return (
    <div className="section checkout-page">
      <div className="container">
        <p className="kicker center">— Checkout</p>
        <h2 className="display sm center">Complete your <em>order</em>.</h2>

        {error && <div className="auth-error" style={{ maxWidth: '600px', margin: '20px auto' }}>{error}</div>}

        <div className="checkout-grid">
          <form onSubmit={handlePlaceOrder} className="checkout-form">
            <h3>Shipping address</h3>
            <div className="form-group">
              <label htmlFor="address">Full address</label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Flat, Street, City, State, Pincode"
                rows={4}
                required
              />
            </div>
            <button type="submit" className="btn-solid accent full" disabled={loading}>
              {loading ? 'Processing...' : `Pay ₹${grandTotal}`}
            </button>
          </form>

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
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
