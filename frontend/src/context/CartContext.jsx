import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const CartContext = createContext(null);

export function CartProvider({ user, children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user || user.role !== "customer") {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/api/cart");
      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const { data } = await api.post("/api/cart/items", { productId, quantity });
    setItems(data.items || []);
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const { data } = await api.patch(`/api/cart/items/${productId}`, { quantity });
    setItems(data.items || []);
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const { data } = await api.delete(`/api/cart/items/${productId}`);
    setItems(data.items || []);
  }, []);

  const clearCart = useCallback(async () => {
    await api.delete("/api/cart");
    setItems([]);
  }, []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0),
    [items]
  );

  const value = { items, count, subtotal, loading, error, refresh, addToCart, updateQuantity, removeFromCart, clearCart };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
