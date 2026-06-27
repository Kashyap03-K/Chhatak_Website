import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';

const STATUS_LABELS = {
  pending_payment: 'Awaiting Payment',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/')
      .then(({ data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="section orders-page">
      <div className="container">
        <p className="kicker center">— Your orders</p>
        <h2 className="display sm center">Order <em>history</em>.</h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '40px' }}>Loading orders...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>No orders yet.</p>
            <Link to="/products" className="btn-solid accent">Start shopping →</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-header">
                  <div>
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <span className={`order-status status-${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="order-items-list">
                  {order.items.map((item) => (
                    <div className="order-item-row" key={item.id}>
                      <span>{item.product.name} × {item.quantity}</span>
                      <span>₹{item.total_price}</span>
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <span className="order-total">Total: ₹{order.total_amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
