import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';

const STATUS_LABELS = {
  pending_payment: 'Awaiting Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS = {
  pending_payment: '#ecc94b',
  confirmed: '#48bb78',
  processing: '#4299e1',
  shipped: '#9f7aea',
  delivered: '#38b2ac',
  cancelled: '#f56565',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/orders/admin/stats'),
      api.get('/orders/admin/all'),
      api.get('/products/'),
    ])
      .then(([statsRes, ordersRes, productsRes]) => {
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
        setLowStock(productsRes.data.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="section admin-page">
      <div className="container">
        <p className="kicker">— Admin</p>
        <h2 className="display sm">Dashboard.</h2>

        {loading ? (
          <p style={{ color: 'var(--muted)', marginTop: '40px' }}>Loading...</p>
        ) : stats ? (
          <>
            <div className="admin-stats">
              <div className="stat-card stat-card--accent">
                <span className="stat-num">₹{stats.total_revenue.toLocaleString('en-IN')}</span>
                <span className="stat-label">Revenue</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.total_orders}</span>
                <span className="stat-label">Total Orders</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.pending_orders}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.total_users}</span>
                <span className="stat-label">Users</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">{stats.total_products}</span>
                <span className="stat-label">Products</span>
              </div>
            </div>

            {lowStock.length > 0 && (
              <div className="admin-alert">
                <div className="admin-alert__header">
                  <span className="admin-alert__icon">!</span>
                  <strong>Low Stock Alert</strong>
                  <span className="admin-alert__count">{lowStock.length} product{lowStock.length > 1 ? 's' : ''}</span>
                </div>
                <div className="admin-alert__items">
                  {lowStock.map(p => (
                    <div className="admin-alert__item" key={p.id}>
                      <span>{p.name} {p.flavor && `· ${p.flavor}`}</span>
                      <span className={`admin-badge ${p.stock === 0 ? 'inactive' : 'warning'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
                <Link to="/admin/products" className="btn-link" style={{ marginTop: '12px', display: 'inline-block' }}>
                  Update inventory →
                </Link>
              </div>
            )}

            <div className="admin-section-grid">
              <div className="admin-section-card">
                <div className="admin-section-card__header">
                  <h3>Recent Orders</h3>
                  <Link to="/admin/orders" className="btn-link">View all →</Link>
                </div>
                {recentOrders.length === 0 ? (
                  <p style={{ color: 'var(--muted)', padding: '24px 0' }}>No orders yet.</p>
                ) : (
                  <div className="admin-recent-list">
                    {recentOrders.map(order => (
                      <div className="admin-recent-row" key={order.id}>
                        <div className="admin-recent-row__left">
                          <span className="admin-recent-row__id">#{order.id}</span>
                          <span className="admin-recent-row__date">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <span className="admin-recent-row__amount">₹{order.total_amount}</span>
                        <span
                          className="admin-status-dot"
                          style={{ '--status-color': STATUS_COLORS[order.status] || 'var(--muted)' }}
                          title={STATUS_LABELS[order.status]}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-quick-actions">
                <h3>Quick Actions</h3>
                <Link to="/admin/products" className="admin-action-card">
                  <div className="admin-action-card__icon">+</div>
                  <div>
                    <strong>Products</strong>
                    <p>Add, edit, or remove products</p>
                  </div>
                </Link>
                <Link to="/admin/orders" className="admin-action-card">
                  <div className="admin-action-card__icon">→</div>
                  <div>
                    <strong>Orders</strong>
                    <p>View and update order statuses</p>
                  </div>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <p style={{ color: '#f77', marginTop: '40px' }}>Failed to load stats. Are you an admin?</p>
        )}
      </div>
    </div>
  );
}
