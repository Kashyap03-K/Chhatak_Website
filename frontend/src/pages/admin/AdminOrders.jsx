import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

const STATUS_OPTIONS = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS = {
  pending_payment: 'Awaiting Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function formatCurrency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(s, withTime = false) {
  if (!s) return '—';
  try {
    const d = new Date(s);
    const opts = { day: 'numeric', month: 'short', year: 'numeric' };
    if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    return d.toLocaleDateString('en-IN', opts);
  } catch { return String(s); }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchOrders = () => {
    api.get('/orders/admin/all')
      .then(({ data }) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch {
      alert('Failed to update status');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/auth/admin/users/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `chhatak-users-${stamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const c = o.customer || {};
      const hay = [
        `#${o.id}`,
        o.shipping_address,
        c.name, c.email, c.phone,
        ...(c.addresses || []).map((a) => `${a.city} ${a.state} ${a.pincode}`),
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [orders, query]);

  const filtered = filter === 'all' ? searched : searched.filter(o => o.status === filter);

  const uniqueCustomers = useMemo(() => new Set(orders.map(o => o.user_id)).size, [orders]);

  return (
    <div className="section admin-page">
      <div className="container">
        <Link to="/admin" className="btn-link" style={{ marginBottom: '16px', display: 'inline-block' }}>← Dashboard</Link>
        <p className="kicker">— Admin</p>
        <h2 className="display sm">Orders.</h2>

        <div className="admin-users-toolbar">
          <input
            type="search"
            className="admin-users-search"
            placeholder="Search by order #, name, email, phone, city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn-solid accent"
            onClick={handleExport}
            disabled={exporting || orders.length === 0}
          >
            {exporting ? 'Preparing…' : '⬇ Export users as .xlsx'}
          </button>
        </div>

        <div className="admin-users-stats">
          <div><span className="stat-num">{orders.length}</span><span className="stat-label">Orders</span></div>
          <div><span className="stat-num">{uniqueCustomers}</span><span className="stat-label">Customers</span></div>
          <div><span className="stat-num">{formatCurrency(orders.reduce((s, o) => s + (o.total_amount || 0), 0))}</span><span className="stat-label">Order Value</span></div>
        </div>

        <div className="admin-filters">
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({searched.length})</button>
          {STATUS_OPTIONS.map(s => {
            const count = searched.filter(o => o.status === s).length;
            if (count === 0) return null;
            return (
              <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                {STATUS_LABELS[s]} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--muted)', marginTop: '32px' }}>No orders found.</p>
        ) : (
          <div className="admin-orders-list">
            {filtered.map((order) => {
              const c = order.customer || {};
              const isOpen = expanded === order.id;
              return (
                <div className={`admin-order-card${isOpen ? ' is-open' : ''}`} key={order.id}>
                  <div className="admin-order-header">
                    <div>
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date">{formatDate(order.created_at, true)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="admin-order-customer">
                    <div className="admin-order-customer__main">
                      <strong>{c.name || 'Unknown'}</strong>
                      {c.email_verified && <span className="admin-badge" style={{ marginLeft: 6 }}>✓ verified</span>}
                      {c.is_admin && <span className="admin-badge" style={{ marginLeft: 6 }}>Admin</span>}
                      <div className="admin-order-customer__contact">
                        {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
                        {c.phone && <> · <a href={`tel:${c.phone}`}>{c.phone}</a></>}
                      </div>
                    </div>
                    <div className="admin-order-customer__stats">
                      <span><b>{c.order_count ?? 0}</b> orders</span>
                      <span><b>{formatCurrency(c.total_spent)}</b> lifetime</span>
                      <span>Joined {formatDate(c.created_at)}</span>
                    </div>
                  </div>

                  <div className="order-items-list">
                    {order.items.map((item) => (
                      <div className="order-item-row" key={item.id}>
                        <span>{item.product?.name || 'Item'} × {item.quantity}</span>
                        <span>₹{item.total_price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="admin-order-footer">
                    <span className="order-total">Total: ₹{order.total_amount}</span>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setExpanded(isOpen ? null : order.id)}
                    >
                      {isOpen ? 'Hide details' : `Shipping & addresses (${(c.addresses || []).length})`}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="admin-order-details">
                      <div className="admin-order-details__ship">
                        <p className="admin-order-details__label">📍 Ship to (for this order)</p>
                        <pre className="admin-order-details__ship-body">{order.shipping_address || '—'}</pre>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                          Payment: {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}
                        </p>
                      </div>
                      <div>
                        <p className="admin-order-details__label">All saved addresses</p>
                        {(c.addresses || []).length === 0 ? (
                          <p style={{ margin: 0, color: 'var(--muted)' }}>No addresses on file.</p>
                        ) : (
                          <div className="admin-users-addr-grid">
                            {c.addresses.map((a) => (
                              <div key={a.id} className="admin-users-addr-card">
                                <p style={{ margin: 0 }}>
                                  <strong>{a.full_name}</strong>
                                  {a.is_default && <span className="admin-badge" style={{ marginLeft: 6 }}>Default</span>}
                                </p>
                                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>{a.phone}</p>
                                <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.5 }}>
                                  {a.address_line1}
                                  {a.address_line2 ? <>, {a.address_line2}</> : null}
                                  <br />
                                  {a.city}, {a.state} — {a.pincode}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
