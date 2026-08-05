import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    totalPrice,
    drawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closeDrawer(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  const buyNow = () => {
    closeDrawer();
    navigate('/checkout');
  };

  return (
    <>
      <div
        className={`cart-drawer-overlay${drawerOpen ? ' is-open' : ''}`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />
      <aside
        className={`cart-drawer${drawerOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-label="Shopping cart"
        aria-hidden={!drawerOpen}
      >
        <div className="cart-drawer__head">
          <span className="cart-drawer__title">
            Your bag{items.length > 0 ? ` · ${items.length}` : ''}
          </span>
          <button
            type="button"
            className="cart-drawer__close"
            onClick={closeDrawer}
            aria-label="Close cart"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <p>Your bag is empty.</p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cart-drawer__item" key={item.id}>
                {item.product.image_url && (
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="cart-drawer__item-thumb"
                    onClick={closeDrawer}
                  >
                    <img src={item.product.image_url} alt={item.product.name} />
                  </Link>
                )}
                <div className="cart-drawer__item-info">
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="cart-drawer__item-name-link"
                    onClick={closeDrawer}
                  >
                    <p className="cart-drawer__item-name">{item.product.name}</p>
                  </Link>
                  <p className="cart-drawer__item-meta">
                    {item.product.flavor ? `${item.product.flavor} · ` : ''}{item.product.weight}
                  </p>
                  {item.product.description && (
                    <p className="cart-drawer__item-desc">
                      {item.product.description.length > 90
                        ? `${item.product.description.slice(0, 90)}…`
                        : item.product.description}
                    </p>
                  )}
                  <div className="cart-drawer__item-row">
                    <div className="cart-drawer__qty">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >−</button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.min(item.quantity + 1, item.product.stock))}
                        disabled={item.quantity >= item.product.stock}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                    <span className="cart-drawer__item-price">
                      ₹{item.product.price * item.quantity}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="cart-drawer__remove"
                    onClick={() => removeItem(item.id)}
                  >Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__foot">
            <div className="cart-drawer__subtotal">
              <span className="cart-drawer__subtotal-label">Subtotal</span>
              <span className="cart-drawer__subtotal-value">₹{totalPrice}</span>
            </div>
            <div className="cart-drawer__actions">
              <button
                type="button"
                className="cart-drawer__btn cart-drawer__btn--primary"
                onClick={buyNow}
              >
                Buy now
              </button>
              <Link
                to="/cart"
                className="cart-drawer__btn cart-drawer__btn--ghost"
                onClick={closeDrawer}
              >
                View cart
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
