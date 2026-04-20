import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

const SHIPPING = 15;
const TAX_RATE = 0.08;

function ItemImage({ src, title }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  return <img src={src} alt={title} className="w-full h-full object-cover" onError={() => setErr(true)} />;
}

export function CartPage() {
  const navigate = useNavigate();
  const { items, subtotal, loading, updateQuantity, removeFromCart } = useCart();
  const [busyId, setBusyId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  async function changeQty(productId, delta, currentQty) {
    const next = currentQty + delta;
    if (next < 1) {
      await remove(productId);
      return;
    }
    setBusyId(productId);
    try {
      await updateQuantity(productId, next);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update quantity");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(productId) {
    setBusyId(productId);
    try {
      await removeFromCart(productId);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove item");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePlaceOrder() {
    setPlacing(true);
    setError("");
    try {
      await api.post("/api/orders");
      navigate("/orders");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not place order");
      setPlacing(false);
    }
  }

  const shipping = items.length > 0 ? SHIPPING : 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  if (loading) {
    return <div className="p-8 text-slate-500">Loading cart…</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Your Cart</h1>
      <p className="mt-1 text-sm text-slate-500">
        {items.length === 0 ? "Your cart is empty." : `${items.length} item${items.length > 1 ? "s" : ""} ready for checkout.`}
      </p>

      {error && (
        <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No items yet</h3>
          <p className="text-slate-500 text-sm max-w-xs mb-6">
            Head to the marketplace to find something you love.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => (
              <div key={product._id} className="bg-white rounded-2xl p-4 ring-1 ring-slate-100 shadow-sm flex gap-4 items-center">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  <ItemImage src={product.imageUrl} title={product.title} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{product.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{product.category}</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-2">${product.price.toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-1 py-1">
                  <button
                    onClick={() => changeQty(product._id, -1, quantity)}
                    disabled={busyId === product._id}
                    className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 font-bold transition disabled:opacity-50"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => changeQty(product._id, 1, quantity)}
                    disabled={busyId === product._id}
                    className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-600 font-bold transition disabled:opacity-50"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => remove(product._id)}
                  disabled={busyId === product._id}
                  className="text-slate-400 hover:text-rose-500 transition disabled:opacity-50"
                  title="Remove"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <aside className="bg-white rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm h-fit sticky top-8">
            <h2 className="text-xl font-extrabold text-slate-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold text-slate-900">${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax (8%)</span>
                <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-900">Total</span>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              className="mt-6 w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/25 transition active:scale-[0.98] disabled:opacity-60"
            >
              {placing ? "Placing order…" : "Place Order"}
            </button>

            <p className="mt-3 text-xs text-center text-slate-500 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure Checkout Guarantee
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
