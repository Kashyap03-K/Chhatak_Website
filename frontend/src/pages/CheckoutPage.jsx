import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function CheckoutPage() {
  const { items, totalPrice, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '' });
  const [saveAddress, setSaveAddress] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shipping = totalPrice >= 499 ? 0 : 49;
  const grandTotal = totalPrice + shipping;

  useEffect(() => {
    api.get('/addresses/').then(({ data }) => {
      setSavedAddresses(data);
      const def = data.find(a => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
      else setShowNewForm(true);
    }).catch(() => setShowNewForm(true));
  }, []);

  const formatAddress = (a) =>
    `${a.full_name}, ${a.phone}\n${a.address_line1}${a.address_line2 ? ', ' + a.address_line2 : ''}\n${a.city}, ${a.state} — ${a.pincode}`;

  const getShippingAddress = () => {
    if (!showNewForm && selectedAddressId) {
      const addr = savedAddresses.find(a => a.id === selectedAddressId);
      return addr ? formatAddress(addr) : '';
    }
    if (!newAddr.full_name || !newAddr.phone || !newAddr.address_line1 || !newAddr.city || !newAddr.state || !newAddr.pincode) return '';
    return formatAddress(newAddr);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const shippingAddress = getShippingAddress();
    if (!shippingAddress) { setError('Please fill in all required address fields'); return; }
    setError('');
    setLoading(true);

    try {
      if (showNewForm && saveAddress) {
        const { data: saved } = await api.post('/addresses/', { ...newAddr, is_default: savedAddresses.length === 0 });
        setSavedAddresses(prev => [...prev, saved]);
      }

      const { data: order } = await api.post('/orders/', { shipping_address: shippingAddress });
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
            await fetchCart();
            navigate('/orders');
          } catch {
            setError('Payment verification failed. Contact support.');
          }
        },
        prefill: { email: user?.email || '' },
        theme: { color: '#E89148' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => setError('Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
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

            {savedAddresses.length > 0 && !showNewForm && (
              <div className="saved-addresses">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`address-option ${selectedAddressId === addr.id ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div>
                      <strong>{addr.full_name}</strong> · {addr.phone}
                      <br />{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}
                      <br />{addr.city}, {addr.state} — {addr.pincode}
                      {addr.is_default && <span className="default-badge">Default</span>}
                    </div>
                  </label>
                ))}
                <button type="button" className="btn-link" onClick={() => setShowNewForm(true)} style={{ marginTop: '12px' }}>
                  + Add new address
                </button>
              </div>
            )}

            {showNewForm && (
              <div className="new-address-form">
                {savedAddresses.length > 0 && (
                  <button type="button" className="btn-link" onClick={() => setShowNewForm(false)} style={{ marginBottom: '16px' }}>
                    ← Use saved address
                  </button>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">Full name *</label>
                    <input id="fullName" type="text" value={newAddr.full_name} onChange={(e) => setNewAddr(p => ({ ...p, full_name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input id="phone" type="tel" value={newAddr.phone} onChange={(e) => setNewAddr(p => ({ ...p, phone: e.target.value }))} required />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="line1">Address line 1 *</label>
                  <input id="line1" type="text" value={newAddr.address_line1} onChange={(e) => setNewAddr(p => ({ ...p, address_line1: e.target.value }))} placeholder="House/Flat, Street" required />
                </div>
                <div className="form-group">
                  <label htmlFor="line2">Address line 2</label>
                  <input id="line2" type="text" value={newAddr.address_line2} onChange={(e) => setNewAddr(p => ({ ...p, address_line2: e.target.value }))} placeholder="Landmark (optional)" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input id="city" type="text" value={newAddr.city} onChange={(e) => setNewAddr(p => ({ ...p, city: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input id="state" type="text" value={newAddr.state} onChange={(e) => setNewAddr(p => ({ ...p, state: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pincode">Pincode *</label>
                    <input id="pincode" type="text" value={newAddr.pincode} onChange={(e) => setNewAddr(p => ({ ...p, pincode: e.target.value }))} required />
                  </div>
                </div>
                <label className="save-checkbox">
                  <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                  Save this address for future orders
                </label>
              </div>
            )}

            <button type="submit" className="btn-solid accent full" disabled={loading} style={{ marginTop: '24px' }}>
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
