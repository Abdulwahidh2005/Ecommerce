import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { ProductManager } from "../components/shopper/ProductManager";
import { AnalyticsView } from "../components/shopper/AnalyticsView";

const navItems = [
  {
    key: "overview",
    label: "Overview",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: "products",
    label: "My Products",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function OverviewContent({ user, setActiveTab }) {
  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 shadow-xl shadow-indigo-500/25">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-20 w-40 h-40 bg-white rounded-full translate-y-20" />
        </div>
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium mb-1">{getGreeting()},</p>
          <h2 className="text-3xl font-bold text-white mb-2">{user?.name} 👋</h2>
          <p className="text-indigo-200 text-sm max-w-md">
            Welcome to your seller portal. Manage your product catalogue across Fashion, Health, Art, Home, Sport, Music, and Gaming.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setActiveTab("products")}
              className="bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition shadow"
            >
              Manage Products
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className="bg-white/20 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/30 transition border border-white/30"
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <QuickCard
          title="7 Categories"
          subtitle="Fashion · Health · Art · Home · Sport · Music · Gaming"
          icon="🛍️"
          color="from-blue-500 to-indigo-600"
          badge="Available"
        />
        <QuickCard
          title="Flexible Sizes"
          subtitle="S · M · L · XL (optional per product)"
          icon="📐"
          color="from-violet-500 to-purple-600"
          badge="4 Sizes"
        />
        <QuickCard
          title="Live Storefront"
          subtitle="Products appear instantly on marketplace"
          icon="⚡"
          color="from-emerald-500 to-teal-600"
          badge="Real-time"
        />
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💡</span>
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-1">Quick Tips</h3>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Add a product image URL for better visibility</li>
              <li>Keep stock levels updated to avoid overselling</li>
              <li>Check Analytics to see your top performing items</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ title, subtitle, icon, color, badge }) {
  return (
    <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      <span className="mt-3 inline-block text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
        {badge}
      </span>
    </div>
  );
}

export function ShopperDashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
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
    : "S";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ================================================================
          SIDEBAR
      ================================================================ */}
      <aside className="w-64 min-h-screen bg-slate-900 flex flex-col fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-extrabold tracking-tight leading-none">Precise</p>
              <p className="text-indigo-400 text-xs font-medium mt-0.5">Seller Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <span className={active ? "text-indigo-400" : ""}>{item.icon}</span>
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 bg-indigo-400 rounded-full" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom: user + logout */}
        <div className="px-3 pb-5 space-y-2 border-t border-slate-800 pt-4">
          {/* User card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 text-sm font-medium transition-all duration-150 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* ================================================================
          MAIN CONTENT
      ================================================================ */}
      <main className="ml-64 flex-1 p-8">
        {/* Page header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1">
              <span>Seller Portal</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-slate-600 capitalize">{activeTab}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 capitalize">
              {activeTab === "overview" ? "Dashboard" : activeTab === "products" ? "My Products" : "Analytics"}
            </h1>
          </div>

          {/* Notification bell */}
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 bg-white ring-1 ring-gray-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewContent user={user} setActiveTab={setActiveTab} />}
        {activeTab === "products" && <ProductManager />}
        {activeTab === "analytics" && <AnalyticsView />}
      </main>
    </div>
  );
}
