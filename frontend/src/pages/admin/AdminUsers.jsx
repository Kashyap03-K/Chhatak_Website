import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import AdminTabs from '../../components/AdminTabs.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function fmtCurrency(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// Same UTC→IST fix as AdminOrders — backend stores naive UTC.
function parseServerDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const hasTZ = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s);
  return new Date(hasTZ ? s : `${s}Z`);
}
function fmtDate(s) {
  const d = parseServerDate(s);
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
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
    return users.filter((u) => {
      const hay = [
        u.name, u.email, u.phone,
        ...(u.addresses || []).map((a) => `${a.city} ${a.state} ${a.pincode}`),
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  const totals = useMemo(() => ({
    users: users.length,
    verified: users.filter((u) => u.email_verified).length,
    admins: users.filter((u) => u.is_admin).length,
    revenue: users.reduce((s, u) => s + (u.total_spent || 0), 0),
  }), [users]);

  const handleDelete = async (u) => {
    const suffix = u.is_admin
      ? '\n\n⚠ This user is another admin. Deleting them removes their admin access too.'
      : '';
    const confirmMsg =
      `Permanently delete ${u.name || u.email}?\n\n` +
      `This also removes their orders, saved addresses, cart, and payment records.\n` +
      `This action cannot be undone.` + suffix;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/auth/admin/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      const status = e.response?.status;
      const detail = e.response?.data?.detail;
      if (detail) alert(detail);
      else if (status === 404) alert('The delete endpoint isn\'t live yet — the backend needs to be redeployed.');
      else if (status === 401 || status === 403) alert('You need to be signed in as an admin.');
      else alert(`Delete failed${status ? ` (HTTP ${status})` : ''}. Check the network tab for details.`);
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
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="section admin-page">
      <div className="container">
        <Link to="/admin" className="btn-link" style={{ marginBottom: 16, display: 'inline-block' }}>← Dashboard</Link>
        <p className="kicker">— Admin</p>
        <h2 className="display sm">Users.</h2>
        <AdminTabs />

        <div className="admin-users-toolbar" style={{ marginTop: 24 }}>
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
            {exporting ? 'Preparing…' : '⬇ Export users as .xlsx'}
          </button>
        </div>

        <div className="admin-users-stats">
          <div><span className="stat-num">{totals.users}</span><span className="stat-label">Users</span></div>
          <div><span className="stat-num">{totals.verified}</span><span className="stat-label">Email verified</span></div>
          <div><span className="stat-num">{totals.admins}</span><span className="stat-label">Admins</span></div>
          <div><span className="stat-num">{fmtCurrency(totals.revenue)}</span><span className="stat-label">Lifetime spent</span></div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)', marginTop: 32 }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--muted)', marginTop: 32 }}>No users found.</p>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: 24 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'right' }}>Orders</th>
                  <th style={{ textAlign: 'right' }}>Lifetime</th>
                  <th>Last order</th>
                  <th>Joined</th>
                  <th>Flags</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name || '—'}</strong>
                    </td>
                    <td>{u.email ? <a href={`mailto:${u.email}`}>{u.email}</a> : '—'}</td>
                    <td>{u.phone ? <a href={`tel:${u.phone}`}>{u.phone}</a> : '—'}</td>
                    <td style={{ textAlign: 'right' }}>{u.order_count ?? 0}</td>
                    <td style={{ textAlign: 'right' }}>{fmtCurrency(u.total_spent)}</td>
                    <td>{fmtDate(u.last_order_at)}</td>
                    <td>{fmtDate(u.created_at)}</td>
                    <td>
                      {u.email_verified && <span className="admin-badge" style={{ marginRight: 4 }}>✓ verified</span>}
                      {u.is_admin && <span className="admin-badge" style={{ marginRight: 4 }}>Admin</span>}
                      {!u.is_active && <span className="admin-badge inactive">Inactive</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {me?.id === u.id ? (
                        <span title="You can't delete your own account" style={{ opacity: 0.35, fontSize: 16 }}>🗑</span>
                      ) : (
                        <button
                          type="button"
                          className="admin-order-delete"
                          title={u.is_admin ? 'Delete this admin user' : 'Delete this user'}
                          onClick={() => handleDelete(u)}
                        >
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
