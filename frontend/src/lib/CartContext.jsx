import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "mi_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          discount_percent: product.discount_percent || 0,
          quantity,
        },
      ];
    });
  };

  const updateQty = (pid, qty) =>
    setItems((prev) => prev.map((i) => (i.product_id === pid ? { ...i, quantity: Math.max(1, qty) } : i)));

  const removeItem = (pid) => setItems((prev) => prev.filter((i) => i.product_id !== pid));

  const clear = () => setItems([]);

  const subtotal = items.reduce(
    (s, i) => s + i.price * (1 - (i.discount_percent || 0) / 100) * i.quantity,
    0
  );
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
