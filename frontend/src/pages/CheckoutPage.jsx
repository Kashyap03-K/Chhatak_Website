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

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingConfig, setShippingConfig] = useState({
    cod: { amount: 49, free_above: 499 },
    online: { amount: 0, free_above: 0 },
  });

  const activeCfg = shippingConfig[paymentMethod === 'cod' ? 'cod' : 'online'];
  const shipping = activeCfg.free_above > 0 && totalPrice >= activeCfg.free_above ? 0 : activeCfg.amount;
  const grandTotal = totalPrice + shipping;

  useEffect(() => {
    api.get('/addresses/').then(({ data }) => {
      setSavedAddresses(data);
      const def = data.find(a => a.is_default);
      if (def) setSelectedAddressId(def.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
      else setShowNewForm(true);
    }).catch(() => setShowNewForm(true));
    api.get('/shipping/config').then(({ data }) => {
      const map = { cod: { amount: 49, free_above: 499 }, online: { amount: 0, free_above: 0 } };
      for (const row of data) map[row.payment_method] = { amount: row.amount, free_above: row.free_above };
      setShippingConfig(map);
    }).catch(() => {});
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

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const payWithRazorpay = async (shippingAddress) => {
    const { data: order } = await api.post('/orders/', { shipping_address: shippingAddress, payment_method: 'razorpay' });
    const { data: rz } = await api.post('/payments/create-order', { order_id: order.id });

    const ok = await loadRazorpayScript();
    if (!ok) throw new Error('Could not load payment gateway. Check your connection and try again.');

    await new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: rz.razorpay_key_id,
        amount: rz.amount,
        currency: rz.currency,
        name: 'Chhatak',
        description: `Order #${order.id}`,
        order_id: rz.razorpay_order_id,
        prefill: {
          name: user?.full_name || '',
          email: user?.email || '',
        },
        theme: { color: '#f0994a' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            resolve();
          } catch (err) {
            reject(new Error(err.response?.data?.detail || 'Payment verification failed'));
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
        },
      });
      rzp.on('payment.failed', (resp) => {
        reject(new Error(resp?.error?.description || 'Payment failed'));
      });
      rzp.open();
    });
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

      if (paymentMethod === 'online') {
        await payWithRazorpay(shippingAddress);
      } else {
        await api.post('/orders/place-cod', { shipping_address: shippingAddress, payment_method: 'cod' });
      }
      await fetchCart();
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong. Please try again.');
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
            <div className="checkout-section">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z" />
                <circle cx="12" cy="9" r="2.6" />
              </svg>
              Shipping address
            </h3>

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
                <button type="button" className="btn-link" onClick={() => setShowNewForm(true)} style={{ marginTop: '18px', display: 'inline-block' }}>
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

            </div>

            <div className="checkout-section">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
                <path d="M2.5 10h19" />
                <path d="M6 15h4" />
              </svg>
              Payment method
            </h3>
            <div className="saved-addresses">
              <label className={`address-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                <div>
                  <strong>Pay online</strong>
                  <br /><span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>UPI, cards, netbanking & wallets via Razorpay</span>
                </div>
              </label>
              <label className={`address-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <div>
                  <strong>Cash on delivery</strong>
                  <br /><span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Pay the courier when your order arrives.</span>
                </div>
              </label>
            </div>
            </div>

            <button type="submit" className="btn-solid accent full" disabled={loading}>
              {loading ? (paymentMethod === 'online' ? 'Opening payment…' : 'Placing order…') : (paymentMethod === 'online' ? `Pay ₹${grandTotal}` : `Place order — ₹${grandTotal}`)}
            </button>
          </form>

          <div className="cart-summary">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h9l4 4v14a1 1 0 0 1-1.5.87L15 20l-2 1.2L11 20l-2 1.2L7 20l-2.5 1.87A1 1 0 0 1 3 21V5a2 2 0 0 1 2-2h1Z" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
              Order summary
            </h3>
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
