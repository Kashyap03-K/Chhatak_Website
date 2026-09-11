import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/cart/');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Refetch when the tab becomes visible again or the window regains focus, so a
  // cart that was sitting open in a background tab picks up admin price changes
  // (line items reference the live Product row — the server already returns the
  // current price, we just need to re-ask). Same for reopening the cart drawer.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const onFocus = () => { fetchCart(); };
    const onVisibility = () => { if (!document.hidden) fetchCart(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchCart, isAuthenticated]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    fetchCart();   // re-pull so prices reflect any admin changes since last view
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/', { product_id: productId, quantity });
    await fetchCart();
    setDrawerOpen(true);
    return data;
  }, [fetchCart]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    await api.put(`/cart/${itemId}`, { quantity });
    await fetchCart();
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    await api.delete(`/cart/${itemId}`);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await api.delete('/cart/');
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, totalItems, totalPrice, addToCart, updateQuantity, removeItem, clearCart, fetchCart, drawerOpen, openDrawer, closeDrawer }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
