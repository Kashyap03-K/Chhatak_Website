import { Fragment, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AdminTabs from '../../components/AdminTabs.jsx';

function formatCurrency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return String(s);
  }
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/auth/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.phone, ...(u.addresses || []).map((a) => `${a.city} ${a.state} ${a.pincode}`)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [users, query]);

  const totalRevenue = useMemo(() => users.reduce((sum, u) => sum + (u.total_spent || 0), 0), [users]);
  const totalOrders = useMemo(() => users.reduce((sum, u) => sum + (u.order_count || 0), 0), [users]);

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

  return (
    <div className="section admin-page">
      <div className="container">
        <Link to="/admin" className="btn-link" style={{ marginBottom: '16px', display: 'inline-block' }}>← Dashboard</Link>
        <p className="kicker">— Admin</p>
        <h2 className="display sm">Users.</h2>

        <AdminTabs />

        <div className="admin-users-toolbar">
          <input
            type="search"
            className="admin-users-search"
            placeholder="Search by name, email, phone, city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="btn-solid accent"
            onClick={handleExport}
            disabled={exporting || users.length === 0}
          >
            {exporting ? 'Preparing…' : '⬇ Export as .xlsx'}
          </button>
        </div>

        <div className="admin-users-stats">
          <div><span className="stat-num">{users.length}</span><span className="stat-label">Users</span></div>
          <div><span className="stat-num">{totalOrders}</span><span className="stat-label">Orders</span></div>
          <div><span className="stat-num">{formatCurrency(totalRevenue)}</span><span className="stat-label">Revenue</span></div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading users…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--muted)', marginTop: '32px' }}>
            {users.length === 0 ? 'No users yet.' : 'No users match your search.'}
          </p>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'center' }}>Verified</th>
                  <th style={{ textAlign: 'center' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Spent</th>
                  <th>Last Order</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <Fragment key={u.id}>
                    <tr className={expanded === u.id ? 'is-open' : ''}>
                      <td>
                        <strong>{u.name}</strong>
                        {u.is_admin && <span className="admin-badge" style={{ marginLeft: 6 }}>Admin</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{u.email_verified ? '✓' : '—'}</td>
                      <td style={{ textAlign: 'center' }}>{u.order_count}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(u.total_spent)}</td>
                      <td>{formatDate(u.last_order_at)}</td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                        >
                          {expanded === u.id ? 'Hide' : `Addresses (${u.addresses.length})`}
                        </button>
                      </td>
                    </tr>
                    {expanded === u.id && (
                      <tr className="admin-users-detail-row">
                        <td colSpan={9}>
                          {u.addresses.length === 0 ? (
                            <p style={{ margin: 0, color: 'var(--muted)' }}>No addresses on file.</p>
                          ) : (
                            <div className="admin-users-addr-grid">
                              {u.addresses.map((a) => (
                                <div key={a.id} className="admin-users-addr-card">
                                  <p style={{ margin: 0 }}>
                                    <strong>{a.full_name}</strong>
                                    {a.is_default && <span className="admin-badge" style={{ marginLeft: 6 }}>Default</span>}
                                  </p>
                                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                                    {a.phone}
                                  </p>
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
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
