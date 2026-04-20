import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

function ActionCard({ icon, title, description, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`text-left bg-white rounded-2xl p-6 ring-1 ring-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${
        danger ? "hover:ring-rose-200" : "hover:ring-indigo-200"
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
        danger ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
      }`}>
        {icon}
      </div>
      <h3 className={`font-bold text-lg ${danger ? "text-rose-600" : "text-slate-900"}`}>{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </button>
  );
}

export function SettingsPage({ user, setUser }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.post("/api/auth/logout");
      setUser(null);
      navigate("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "C";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
          <span className="text-white text-3xl font-extrabold">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{user?.name}</h1>
          <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {user?.email}
          </p>
          <span className="mt-3 inline-block text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full capitalize">
            {user?.role || "Customer"}
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/orders" className="block">
          <ActionCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            title="My Orders"
            description="Track, return, or buy things again"
            onClick={() => navigate("/orders")}
          />
        </Link>

        <ActionCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          title="Saved Items"
          description="Lists and saved products (coming soon)"
          onClick={() => {}}
        />

        <ActionCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
          title="Payment Methods"
          description="Manage cards and billing (coming soon)"
          onClick={() => {}}
        />

        <ActionCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
          title={loggingOut ? "Signing out…" : "Logout"}
          description="Securely sign out"
          onClick={handleLogout}
          danger
        />
      </div>
    </div>
  );
}
