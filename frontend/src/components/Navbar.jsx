import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="10" cy="21" r="1.2" />
      <circle cx="18" cy="21" r="1.2" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.4 5.6a5.5 5.5 0 0 0-7.8 0L12 6.2l-.6-.6a5.5 5.5 0 1 0-7.8 7.8l.6.6L12 21.8l7.8-7.8.6-.6a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthDialog } = useAuth();
  const { totalItems } = useCart();
  const isLanding = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    // Lock body scroll while the drawer is open so the page underneath doesn't drift.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [drawerOpen]);

  const goHash = (hash) => (e) => {
    e.preventDefault();
    setDrawerOpen(false);
    if (isLanding) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.location.hash = hash;
    } else {
      navigate(`/#${hash}`);
    }
  };

  const doLogout = () => { setDrawerOpen(false); logout(); navigate('/'); };
  const closeAnd = (fn) => () => { setDrawerOpen(false); fn(); };

  return (
    <>
      <nav className={`nav ${isLanding ? 'nav--landing' : ''}`}>
        <div className="nav-inner nav-inner--centered">
          <div className="nav-side nav-side--left">
            <button
              type="button"
              className="nav-icon"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              <IconMenu />
            </button>
          </div>

          <Link to="/" className="brand nav-brand-center" aria-label="Chhatak — The Coastal Crunch">
            <img src="/images/chhatak-logo.png" alt="Chhatak" className="brand-logo" />
          </Link>

          <div className="nav-side nav-side--right">
            <Link to="/cart" className="nav-icon" aria-label="Cart">
              <IconCart />
              {totalItems > 0 && <span className="nav-icon-badge">{totalItems}</span>}
            </Link>
          </div>
        </div>
      </nav>

      {drawerOpen && (
        <div className="nav-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}
      <aside
        className={`nav-drawer${drawerOpen ? ' is-open' : ''}`}
        aria-hidden={!drawerOpen}
        role="dialog"
        aria-label="Site menu"
      >
        <div className="nav-drawer__header">
          <Link to="/" className="brand" onClick={() => setDrawerOpen(false)} aria-label="Chhatak home">
            <img src="/images/chhatak-logo.png" alt="Chhatak" className="brand-logo" />
          </Link>
          <button
            type="button"
            className="nav-icon"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            <IconClose />
          </button>
        </div>

        <nav className="nav-drawer__nav" aria-label="Primary">
          {!isAdmin && (
            <>
              <a href="/#story" onClick={goHash('story')}>About</a>
              <Link to="/products" onClick={() => setDrawerOpen(false)}>Products</Link>
              <a href="/#reviews" onClick={goHash('reviews')}>Reviews</a>
              <a href="/#journey" onClick={goHash('journey')}>Journey</a>
              <Link to="/wholesale" onClick={() => setDrawerOpen(false)}>Wholesale</Link>
            </>
          )}
          {user?.is_admin && (
            <Link to="/admin" className="admin-link" onClick={() => setDrawerOpen(false)}>Admin dashboard</Link>
          )}
        </nav>

        <div className="nav-drawer__divider" />

        <div className="nav-drawer__utility">
          <Link to="/wishlist" className="nav-drawer__row" onClick={() => setDrawerOpen(false)}>
            <IconHeart /> <span>Wishlist</span>
          </Link>
          <Link to="/cart" className="nav-drawer__row" onClick={() => setDrawerOpen(false)}>
            <IconCart /> <span>Cart</span>
            {totalItems > 0 && <span className="nav-drawer__row-count">{totalItems}</span>}
          </Link>
        </div>

        <div className="nav-drawer__divider" />

        <div className="nav-drawer__account">
          {isAuthenticated ? (
            <>
              <div className="nav-drawer__account-header">
                <div className="nav-drawer__account-avatar"><IconUser /></div>
                <div>
                  <p className="nav-drawer__account-name">{user?.name || 'Account'}</p>
                  <p className="nav-drawer__account-email">{user?.email}</p>
                </div>
              </div>
              <button type="button" className="nav-drawer__row" onClick={closeAnd(() => navigate('/orders'))}>My orders</button>
              <button type="button" className="nav-drawer__row danger" onClick={doLogout}>Log out</button>
            </>
          ) : (
            <>
              <p className="nav-drawer__account-hint">Sign in to save your cart, orders, and wishlist.</p>
              <button type="button" className="btn-solid accent nav-drawer__cta" onClick={closeAnd(() => openAuthDialog('login'))}>Log in</button>
              <button type="button" className="btn-outline nav-drawer__cta" onClick={closeAnd(() => openAuthDialog('register'))}>Create account</button>
            </>
          )}
        </div>

        {isLanding && (
          <div className="nav-drawer__footer">
            <Link to="/products" className="btn-solid accent" onClick={() => setDrawerOpen(false)}>Shop Now</Link>
          </div>
        )}
      </aside>
    </>
  );
}
