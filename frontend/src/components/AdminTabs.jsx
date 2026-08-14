import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin',          label: 'Dashboard', end: true },
  { to: '/admin/uiux',     label: 'UI / UX' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders',   label: 'Orders' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/reviews',  label: 'Reviews' },
];

export default function AdminTabs() {
  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `admin-tab${isActive ? ' is-active' : ''}`}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
