import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { api } from "./lib/api";
import { RequireRole } from "./components/RequireRole";
import { CustomerLayout } from "./components/customer/CustomerLayout";
import { CartProvider } from "./context/CartContext";
import { MarketplacePage } from "./pages/MarketplacePage";
import { CartPage } from "./pages/CartPage";
import { OrdersPage } from "./pages/OrdersPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ShopperDashboard } from "./pages/ShopperDashboard";

export default function App() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      try {
        const { data } = await api.get("/api/auth/me");
        if (!mounted) return;
        setUser(data.user);
      } catch {
        // not logged in
      } finally {
        if (mounted) setBootLoading(false);
      }
    }
    boot();
    return () => { mounted = false; };
  }, []);

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center animate-pulse">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 font-medium">Loading Market place…</p>
        </div>
      </div>
    );
  }

  const postAuthRoute = (u) => (u?.role === "shopper" ? "/dashboard" : "/");

  return (
    <CartProvider user={user}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={postAuthRoute(user)} replace /> : <LoginPage setUser={setUser} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to={postAuthRoute(user)} replace /> : <RegisterPage setUser={setUser} />}
        />

        <Route
          path="/dashboard"
          element={
            <RequireRole user={user} role="shopper">
              <ShopperDashboard user={user} setUser={setUser} />
            </RequireRole>
          }
        />

        <Route
          element={
            <RequireRole user={user} role="customer">
              <CustomerLayout user={user} setUser={setUser} />
            </RequireRole>
          }
        >
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/settings" element={<SettingsPage user={user} setUser={setUser} />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={user ? postAuthRoute(user) : "/login"} replace />}
        />
      </Routes>
    </CartProvider>
  );
}
