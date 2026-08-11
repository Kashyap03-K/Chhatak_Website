import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AdminTabs from '../../components/AdminTabs.jsx';

const STATUS_LABELS = {
  created: 'Awaiting',
  captured: 'Captured',
  failed: 'Failed',
};

const STATUS_COLORS = {
  created: '#ecc94b',
  captured: '#48bb78',
  failed: '#f56565',
};

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/payments/admin/all'),
      api.get('/payments/admin/stats'),
    ])
      .then(([p, s]) => { setPayments(p.data); setStats(s.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        String(p.order_id).includes(q) ||
        (p.razorpay_order_id || '').toLowerCase().includes(q) ||
        (p.razorpay_payment_id || '').toLowerCase().includes(q) ||
        (p.user_email || '').toLowerCase().includes(q) ||
        (p.user_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const fmt = (d) => new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="section admin-page">
      <div className="container">
        <p className="kicker">— Admin</p>
        <h2 className="display sm">Payments.</h2>
        <AdminTabs />

        {loading ? (
          <p style={{ color: 'var(--muted)', marginTop: '32px' }}>Loading...</p>
        ) : (
          <>
            {stats && (
              <div className="admin-stats" style={{ marginTop: 24 }}>
                <div className="stat-card stat-card--accent">
                  <span className="stat-num">₹{stats.captured_amount.toLocaleString('en-IN')}</span>
                  <span className="stat-label">Captured</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{stats.captured}</span>
                  <span className="stat-label">Successful</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{stats.pending}</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{stats.failed}</span>
                  <span className="stat-label">Failed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-num">{stats.total}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>
            )}

            <div className="admin-filters" style={{ marginTop: 24 }}>
              <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All ({payments.length})</button>
              {['captured', 'created', 'failed'].map(s => {
                const count = payments.filter(p => p.status === s).length;
                if (count === 0) return null;
                return (
                  <button key={s} className={`filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                    {STATUS_LABELS[s]} ({count})
                  </button>
                );
              })}
              <input
                type="search"
                placeholder="Search order #, payment id, email…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ marginLeft: 'auto', minWidth: 260, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 4, background: 'transparent', color: 'var(--ink)' }}
              />
            </div>

            {filtered.length === 0 ? (
              <p style={{ color: 'var(--muted)', marginTop: 32 }}>No payments found.</p>
            ) : (
              <div style={{ marginTop: 24, overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '12px 8px' }}>When</th>
                      <th style={{ padding: '12px 8px' }}>Order</th>
                      <th style={{ padding: '12px 8px' }}>Customer</th>
                      <th style={{ padding: '12px 8px' }}>Razorpay IDs</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '12px 8px', whiteSpace: 'nowrap', color: 'var(--ink-soft)' }}>{fmt(p.created_at)}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <Link to="/admin/orders" className="btn-link">#{p.order_id}</Link>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.order_status}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div>{p.user_name || '—'}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.user_email}</div>
                        </td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: 12 }}>
                          <div title={p.razorpay_order_id}>{p.razorpay_order_id || '—'}</div>
                          <div style={{ color: 'var(--muted)' }} title={p.razorpay_payment_id}>{p.razorpay_payment_id || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span
                            className="admin-status-dot"
                            style={{ '--status-color': STATUS_COLORS[p.status] || 'var(--muted)' }}
                          >
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
