import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const isLanding = location.pathname === '/';

  return (
    <nav className={`nav ${isLanding ? 'nav--landing' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="brand">Chhatak<sup>™</sup></Link>
        <ul className="nav-links">
          <li><Link to="/products">Shop</Link></li>
          {!isLanding && (
            <li>
              <Link to="/cart" className="cart-link">
                Cart
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
            </li>
          )}
          {isAuthenticated && <li><Link to="/orders">Orders</Link></li>}
          {user?.is_admin && <li><Link to="/admin" className="admin-link">Admin</Link></li>}
        </ul>
        <div className="nav-auth">
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.name?.split(' ')[0]}</span>
              <button className="btn-outline" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn-ghost" to="/login">Log in</Link>
              <Link className="btn-solid accent" to="/register">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
