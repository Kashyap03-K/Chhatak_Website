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

const PAYMENT_LABELS = {
  cod: { label: 'COD', tone: 'cod' },
  razorpay: { label: 'Paid by UPI', tone: 'paid' },
  online: { label: 'Paid by UPI', tone: 'paid' },
};

// Date-bucketing: today / yesterday / last 7 days / older — all anchored to IST civil days.
function bucketOf(iso) {
  const d = parseServerDate(iso);
  if (!d || isNaN(d)) return 'older';
  const today = istDateParts(new Date());
  const then = istDateParts(d);
  const delta = daysBetweenIST(then, today); // 0 = today, 1 = yesterday, ...
  if (delta <= 0) return 'today';
  if (delta === 1) return 'yesterday';
  if (delta <= 7) return 'last_week';
  return 'older';
}
const BUCKET_ORDER = ['today', 'yesterday', 'last_week', 'older'];
const BUCKET_LABELS = { today: 'Today', yesterday: 'Yesterday', last_week: 'Last 7 days', older: 'Older' };

function formatCurrency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// Backend stores timestamps as UTC but the column is naive, so the ISO string it
// returns has no timezone suffix (e.g. "2026-09-11T00:22:00"). new Date(...) then
// interprets that as local time and displays UTC hours as if they were IST hours,
// which lands orders on the wrong day. Force-treat any naive string as UTC.
function parseServerDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const hasTZ = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasTZ ? s : `${s}Z`);
}

const IST_TZ = 'Asia/Kolkata';

function formatDate(s, withTime = false) {
  const d = parseServerDate(s);
  if (!d || isNaN(d)) return '—';
  const opts = { day: 'numeric', month: 'short', year: 'numeric', timeZone: IST_TZ };
  if (withTime) {
    opts.hour = '2-digit'; opts.minute = '2-digit'; opts.hour12 = true;
  }
  return d.toLocaleString('en-IN', opts);
}

// Returns { y, m, d } in IST for a given Date — used to build IST-anchored buckets.
function istDateParts(dt) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(dt);
  const y = parseInt(parts.find((p) => p.type === 'year').value, 10);
  const m = parseInt(parts.find((p) => p.type === 'month').value, 10);
  const d = parseInt(parts.find((p) => p.type === 'day').value, 10);
  return { y, m, d };
}
function daysBetweenIST(a, b) {
  // Number of civil days (IST) from a to b, ignoring the time-of-day.
  const A = new Date(Date.UTC(a.y, a.m - 1, a.d));
  const B = new Date(Date.UTC(b.y, b.m - 1, b.d));
  return Math.round((B - A) / 86400000);
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Buckets collapse independently; default: everything open.
  const [collapsedBuckets, setCollapsedBuckets] = useState({});
  const toggleBucket = (b) => setCollapsedBuckets((prev) => ({ ...prev, [b]: !prev[b] }));

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

  const deleteOrder = async (orderId) => {
    if (!confirm(`Permanently delete order #${orderId}? This cannot be undone.`)) return;
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) {
      const msg = e.response?.data?.detail || e.response?.statusText || e.message || 'unknown error';
      alert(`Delete failed: ${msg}`);
      // Re-pull in case the delete actually landed but the response was cut.
      fetchOrders();
    }
  };

  const bulkDeleteOlderThan = async () => {
    const label = prompt(
      'Delete all orders older than…\n\nType a number of days (e.g. 30) or an ISO date (e.g. 2026-01-01).',
      '90',
    );
    if (!label) return;
    let cutoff;
    if (/^\d+$/.test(label.trim())) {
      const days = parseInt(label.trim(), 10);
      const d = new Date(); d.setDate(d.getDate() - days);
      cutoff = d.toISOString();
    } else {
      const d = new Date(label);
      if (isNaN(d)) { alert('Could not parse that date.'); return; }
      cutoff = d.toISOString();
    }
    if (!confirm(`Delete every order created before ${new Date(cutoff).toLocaleDateString('en-IN')}? This cannot be undone.`)) return;
    try {
      const { data } = await api.post('/orders/admin/bulk-delete', { older_than: cutoff });
      alert(`Deleted ${data.deleted} order${data.deleted === 1 ? '' : 's'}.`);
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.detail || 'Bulk delete failed.');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/orders/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `chhatak-orders-${stamp}.xlsx`);
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
            {exporting ? 'Preparing…' : '⬇ Export orders as .xlsx'}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={bulkDeleteOlderThan}
            disabled={orders.length === 0}
            title="Delete every order older than a chosen date"
            style={{ borderColor: '#c94a4a', color: '#c94a4a' }}
          >
            🗑 Delete old orders…
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
            {BUCKET_ORDER.flatMap((bucket) => {
              const rows = filtered.filter((o) => bucketOf(o.created_at) === bucket);
              if (rows.length === 0) return [];
              const isCollapsed = !!collapsedBuckets[bucket];
              return [
                <button
                  type="button"
                  key={`h-${bucket}`}
                  className={`admin-orders-bucket-heading admin-orders-bucket-toggle${isCollapsed ? ' is-collapsed' : ''}`}
                  onClick={() => toggleBucket(bucket)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="admin-orders-bucket-chevron" aria-hidden="true">▾</span>
                  {BUCKET_LABELS[bucket]}
                  <span className="admin-orders-bucket-count">({rows.length})</span>
                </button>,
                ...(isCollapsed ? [] : rows.map((order) => {
              const c = order.customer || {};
              const isOpen = expanded === order.id;
              const pay = PAYMENT_LABELS[order.payment_method] || { label: order.payment_method || 'Unknown', tone: 'unknown' };
              return (
                <div className={`admin-order-card${isOpen ? ' is-open' : ''}`} key={order.id}>
                  <div className="admin-order-header">
                    <div>
                      <span className="order-id">Order #{order.id}</span>
                      <span className={`admin-pay-badge admin-pay-badge--${pay.tone}`}>{pay.label}</span>
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
                      <button
                        type="button"
                        className="admin-order-delete"
                        title="Delete this order"
                        onClick={() => deleteOrder(order.id)}
                      >
                        🗑
                      </button>
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
                })),
              ];
            })}
          </div>
        )}
      </div>
    </div>
  );
}
