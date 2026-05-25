import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useCart } from "../../context/CartContext";

const NAV = [
  {
    to: "/",
    label: "Marketplace",
    end: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h18l-2 9H5L3 3zm0 0L2 1m3 13a2 2 0 100 4 2 2 0 000-4zm13 0a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    to: "/orders",
    label: "Orders",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    to: "/cart",
    label: "Cart",
    showBadge: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    to: "/settings",
    label: "Settings",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export function CustomerLayout({ user, setUser }) {
  const navigate = useNavigate();
  const { count } = useCart();

  async function handleLogout() {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
      navigate("/login");
    }
  }

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "C";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-40">
        <div className="px-5 py-6">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 truncate">{user?.name || "Customer"}</p>
              <p className="text-xs text-slate-500 truncate">Market place Member</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.showBadge && count > 0 && (
                <span className="ml-auto text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5 space-y-1 border-t border-slate-100 pt-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help Center
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
