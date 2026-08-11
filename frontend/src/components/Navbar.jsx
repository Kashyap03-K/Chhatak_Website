import { useEffect, useRef, useState } from 'react';
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

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, openAuthDialog } = useAuth();
  const { totalItems } = useCart();
  const isLanding = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef(null);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const go = (path) => { setMenuOpen(false); navigate(path); };
  const doLogout = () => { setMenuOpen(false); logout(); navigate('/'); };

  const goHash = (hash) => (e) => {
    e.preventDefault();
    if (isLanding) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.location.hash = hash;
    } else {
      navigate(`/#${hash}`);
    }
  };

  return (
    <nav className={`nav ${isLanding ? 'nav--landing' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Chhatak — The Coastal Crunch">
          <img src="/images/chhatak-logo.png" alt="Chhatak" className="brand-logo" />
        </Link>

        {!isAdmin && (
          <ul className="nav-links nav-links--center">
            <li><a href="/#story" onClick={goHash('story')}>About</a></li>
            <li><Link to="/products">Products</Link></li>
            <li><a href="/#reviews" onClick={goHash('reviews')}>Reviews</a></li>
            <li><a href="/#journey" onClick={goHash('journey')}>Journey</a></li>
            <li><Link to="/wholesale">Wholesale</Link></li>
            {user?.is_admin && <li><Link to="/admin" className="admin-link">Admin</Link></li>}
          </ul>
        )}

        <div className="nav-actions">
          <Link to="/cart" className="nav-icon" aria-label="Cart">
            <IconCart />
            {totalItems > 0 && <span className="nav-icon-badge">{totalItems}</span>}
          </Link>
          <Link to="/wishlist" className="nav-icon" aria-label="Wishlist">
            <IconHeart />
          </Link>

          {isLanding && <Link to="/products" className="nav-shop-now">Shop Now</Link>}
          <div className="nav-menu-wrap" ref={menuWrapRef}>
            <button
              type="button"
              className="nav-icon"
              aria-label={isAuthenticated ? 'Account menu' : 'Log in menu'}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconUser />
            </button>

            {menuOpen && (
              <div className="nav-menu" role="menu">
                {isAuthenticated ? (
                  <>
                    <div className="nav-menu-header">
                      <p className="nav-menu-name">{user?.name || 'Account'}</p>
                      <p className="nav-menu-email">{user?.email}</p>
                    </div>
                    <button type="button" className="nav-menu-item" role="menuitem" onClick={() => go('/orders')}>My orders</button>
                    <button type="button" className="nav-menu-item" role="menuitem" onClick={() => go('/wishlist')}>Wishlist</button>
                    <button type="button" className="nav-menu-item" role="menuitem" onClick={() => go('/cart')}>Cart</button>
                    {user?.is_admin && (
                      <button type="button" className="nav-menu-item" role="menuitem" onClick={() => go('/admin')}>Admin dashboard</button>
                    )}
                    <div className="nav-menu-divider" />
                    <button type="button" className="nav-menu-item danger" role="menuitem" onClick={doLogout}>Log out</button>
                  </>
                ) : (
                  <>
                    <div className="nav-menu-header">
                      <p className="nav-menu-name">Welcome</p>
                      <p className="nav-menu-email">Sign in or create an account to save orders, cart, and wishlist.</p>
                    </div>
                    <button type="button" className="nav-menu-item primary" role="menuitem" onClick={() => { setMenuOpen(false); openAuthDialog('login'); }}>Log in</button>
                    <button type="button" className="nav-menu-item" role="menuitem" onClick={() => { setMenuOpen(false); openAuthDialog('register'); }}>Create account</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
