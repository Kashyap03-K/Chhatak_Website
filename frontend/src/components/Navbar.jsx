import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const isLanding = location.pathname === '/';

  if (isLanding) return null;

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">Chhatak<sup>™</sup></Link>
        <ul className="nav-links">
          <li><Link to="/products">Shop</Link></li>
          <li>
            <Link to="/cart" className="cart-link">
              Cart
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
          </li>
          {isAuthenticated && <li><Link to="/orders">Orders</Link></li>}
        </ul>
        <div className="nav-auth">
          {isAuthenticated ? (
            <>
              <span className="nav-user">{user?.name?.split(' ')[0]}</span>
              <button className="btn-outline" onClick={logout}>Logout</button>
            </>
          ) : (
            <Link className="btn-outline" to="/login">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
