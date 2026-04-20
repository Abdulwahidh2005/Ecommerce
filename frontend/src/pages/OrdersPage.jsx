import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const STATUS_STYLES = {
  pending:    "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped:    "bg-violet-100 text-violet-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-rose-100 text-rose-700",
};

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function OrderCard({ order }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</p>
          <p className="font-mono text-sm font-bold text-slate-900">#{order._id.slice(-8)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Placed</p>
          <p className="text-sm font-semibold text-slate-900">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[order.status] || "bg-slate-100 text-slate-700"}`}>
          {order.status}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {order.items.map((item, idx) => {
          const product = item.productId;
          return (
            <div key={idx} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {product?.title || "Unavailable product"}
                </p>
                <p className="text-xs text-slate-500">Quantity: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-slate-900 whitespace-nowrap">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-5 border-t border-slate-100 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-600">Total</span>
        <span className="text-xl font-extrabold text-slate-900">${order.totalAmount.toFixed(2)}</span>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get("/api/orders/my");
        if (!cancelled) setOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">My Orders</h1>
      <p className="mt-1 text-sm text-slate-500">
        {orders.length === 0 ? "You haven't placed any orders yet." : `${orders.length} order${orders.length > 1 ? "s" : ""}`}
      </p>

      {error && (
        <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl ring-1 ring-slate-100 h-40 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h3>
          <p className="text-slate-500 text-sm max-w-xs mb-6">
            Once you place an order it will show up here.
          </p>
          <Link
            to="/"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => <OrderCard key={o._id} order={o} />)}
        </div>
      )}
    </div>
  );
}
