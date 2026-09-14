import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

// Inline Razorpay wordmark — matches their brand blue (#3395FF).
// Kept as SVG so it always renders (no external requests, no CSP surprises).
function RazorpayMark({ height = 16 }) {
  return (
    <svg
      className="rp-mark"
      viewBox="0 0 106 22"
      height={height}
      width={height * (106 / 22)}
      role="img"
      aria-label="Razorpay"
    >
      {/* Angular R glyph (the flag) */}
      <path
        d="M11.5 0 5.4 12.5H10L6.3 22h1.6L15 8.7h-4.6L14.5 0Z"
        fill="#3395FF"
      />
      {/* Razorpay wordmark */}
      <text
        x="20"
        y="16.5"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="#0F2C4F"
        letterSpacing="-0.2"
      >
        Razorpay
      </text>
    </svg>
  );
}

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
    fetchCart();  // re-pull on mount so admin price changes are picked up before payment
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

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="section checkout-page">
      <div className="container">
        <p className="kicker center">— Checkout</p>
        <h2 className="display sm center">Complete your <em>order</em>.</h2>

        {/* Progress steps — Cart → Address → Payment → Confirmed */}
        <ol className="checkout-steps" aria-label="Checkout progress">
          <li className="checkout-step is-done">
            <span className="checkout-step__dot" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <span className="checkout-step__label">Cart</span>
          </li>
          <li className="checkout-step is-active">
            <span className="checkout-step__dot" aria-hidden="true">2</span>
            <span className="checkout-step__label">Address & Payment</span>
          </li>
          <li className="checkout-step">
            <span className="checkout-step__dot" aria-hidden="true">3</span>
            <span className="checkout-step__label">Confirmed</span>
          </li>
        </ol>

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
            <div className="saved-addresses payment-options">
              <label className={`address-option payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} />
                <div className="payment-option__body">
                  <div className="payment-option__title">
                    <strong>Pay online</strong>
                    <span className="payment-badge payment-badge--recommended">Recommended</span>
                  </div>
                  <p className="payment-option__desc">UPI, cards, netbanking & wallets via Razorpay</p>
                  <div className="payment-brands" aria-hidden="true">
                    <span className="payment-brand">UPI</span>
                    <span className="payment-brand">VISA</span>
                    <span className="payment-brand">MC</span>
                    <span className="payment-brand">RuPay</span>
                    <span className="payment-brand">PayTM</span>
                  </div>
                  <div className="payment-provider">
                    <span className="payment-provider__label">Secured by</span>
                    <RazorpayMark />
                  </div>
                </div>
              </label>
              <label className={`address-option payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <div className="payment-option__body">
                  <div className="payment-option__title">
                    <strong>Cash on delivery</strong>
                    {shippingConfig.cod.amount > 0 && (
                      <span className="payment-badge">+ ₹{shippingConfig.cod.amount} handling</span>
                    )}
                  </div>
                  <p className="payment-option__desc">Pay the courier in cash when your order arrives.</p>
                </div>
              </label>
            </div>
            </div>

            <div className="checkout-delivery">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7h11v10H3z" />
                <path d="M14 10h4l3 3v4h-7z" />
                <circle cx="7" cy="18.5" r="1.8" />
                <circle cx="17" cy="18.5" r="1.8" />
              </svg>
              <div>
                <strong>Delivered in 3–5 business days</strong>
                <p>Dispatched from Diu · Free tracking updates by email</p>
              </div>
            </div>

            <button type="submit" className="btn-solid accent full" disabled={loading}>
              {loading ? (paymentMethod === 'online' ? 'Opening payment…' : 'Placing order…') : (paymentMethod === 'online' ? `Pay ₹${grandTotal}` : `Place order — ₹${grandTotal}`)}
            </button>

            <div className="checkout-trust" aria-label="Secure checkout">
              <span className="checkout-trust__item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Secure 256-bit checkout
              </span>
              <span className="checkout-trust__item checkout-trust__item--rp">
                Powered by <RazorpayMark height={14} />
              </span>
              <span className="checkout-trust__item">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" /><path d="M8 12h8M12 8v8" />
                </svg>
                7-day easy returns
              </span>
            </div>
          </form>

          <div className="cart-summary">
            <h3>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3h9l4 4v14a1 1 0 0 1-1.5.87L15 20l-2 1.2L11 20l-2 1.2L7 20l-2.5 1.87A1 1 0 0 1 3 21V5a2 2 0 0 1 2-2h1Z" />
                <path d="M8 9h8M8 13h8M8 17h5" />
              </svg>
              Order summary
              <span className="summary-count">{itemCount} item{itemCount === 1 ? '' : 's'}</span>
            </h3>
            <div className="summary-items">
              {items.map((item) => {
                const p = item.product;
                const thumb = (Array.isArray(p.images) && p.images[0]) || p.image_url || '/images/packaging-real.JPG';
                return (
                  <div className="summary-line" key={item.id}>
                    <div className="summary-line__thumb">
                      <img src={thumb} alt={p.name} loading="lazy" />
                      <span className="summary-line__qty">{item.quantity}</span>
                    </div>
                    <div className="summary-line__meta">
                      <p className="summary-line__name">{p.name}</p>
                      {p.weight && <p className="summary-line__sub">{p.weight}</p>}
                    </div>
                    <div className="summary-line__price">₹{p.price * item.quantity}</div>
                  </div>
                );
              })}
            </div>
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
