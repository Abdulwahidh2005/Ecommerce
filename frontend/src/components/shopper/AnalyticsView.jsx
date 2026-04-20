import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function StatCard({ label, value, sub, icon, gradient, iconBg }) {
  return (
    <div className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm flex items-start gap-4">
      <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <p className={`text-3xl font-extrabold mt-1 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function BarChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.unitsSold), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => {
        const pct = Math.max((d.unitsSold / max) * 100, 4);
        const colors = [
          "from-indigo-500 to-violet-600",
          "from-violet-500 to-purple-600",
          "from-blue-500 to-indigo-600",
          "from-emerald-500 to-teal-600",
          "from-amber-400 to-orange-500",
        ];
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-xs font-bold text-slate-600">{d.unitsSold}</span>
            <div className="w-full relative" style={{ height: `${pct}%` }}>
              <div className={`absolute inset-0 bg-gradient-to-t ${colors[i % colors.length]} rounded-t-lg opacity-90`} />
            </div>
            <span className="text-[10px] text-slate-400 truncate w-full text-center">{d.product?.title?.split(" ").slice(0, 2).join(" ")}</span>
          </div>
        );
      })}
    </div>
  );
}

function TopProductRow({ rank, item }) {
  const rankColors = ["bg-amber-400", "bg-slate-300", "bg-amber-600"];
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-7 h-7 ${rankColors[rank] || "bg-gray-100"} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <span className="text-xs font-extrabold text-white">{rank + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{item.product?.title || "Unknown"}</p>
        <p className="text-xs text-slate-400">{item.product?.category}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-slate-900 text-sm">{item.unitsSold} sold</p>
        <p className="text-xs text-emerald-600 font-semibold">${item.revenue?.toFixed(2)}</p>
      </div>
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No sales data yet</h3>
      <p className="text-slate-500 text-sm max-w-xs">
        Analytics will appear here once customers start ordering your products. Add products to get started!
      </p>
    </div>
  );
}

export function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/orders/analytics/shopper")
      .then(({ data }) => setData(data))
      .catch(() => setError("Could not load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
        <p className="text-rose-600 font-medium">{error}</p>
      </div>
    );
  }

  const hasData = data?.totalOrders > 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`$${(data?.totalRevenue || 0).toFixed(2)}`}
          sub="All time earnings"
          icon="💰"
          gradient="from-emerald-500 to-teal-600"
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          label="Units Sold"
          value={data?.totalUnitsSold || 0}
          sub="Items dispatched"
          icon="📦"
          gradient="from-indigo-500 to-violet-600"
          iconBg="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <StatCard
          label="Total Orders"
          value={data?.totalOrders || 0}
          sub="Orders containing your items"
          icon="🛍️"
          gradient="from-amber-500 to-orange-600"
          iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
        />
        <StatCard
          label="Listed Products"
          value={data?.totalProducts || 0}
          sub="Active catalogue"
          icon="🏷️"
          gradient="from-rose-500 to-pink-600"
          iconBg="bg-gradient-to-br from-rose-500 to-pink-600"
        />
      </div>

      {!hasData ? (
        <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm">
          <EmptyAnalytics />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="bg-white rounded-3xl p-6 ring-1 ring-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Top Products</h3>
                <p className="text-xs text-slate-400 mt-0.5">Units sold by product</p>
              </div>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full">
                By Volume
              </span>
            </div>
            <BarChart data={data?.topProducts || []} />
          </div>

          {/* Top products list */}
          <div className="bg-white rounded-3xl p-6 ring-1 ring-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Performance</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ranked by units sold</p>
              </div>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full">
                Top {(data?.topProducts || []).length}
              </span>
            </div>
            <div>
              {(data?.topProducts || []).map((item, i) => (
                <TopProductRow key={i} rank={i} item={item} />
              ))}
            </div>
          </div>

          {/* Revenue breakdown card */}
          <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 shadow-xl shadow-indigo-500/25 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32" />
            </div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Total Lifetime Revenue</p>
                <p className="text-5xl font-extrabold text-white">${(data?.totalRevenue || 0).toFixed(2)}</p>
                <p className="text-indigo-200 text-sm mt-2">
                  Across {data?.totalOrders} order{data?.totalOrders !== 1 ? "s" : ""} · {data?.totalUnitsSold} units
                </p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center min-w-24">
                  <p className="text-indigo-200 text-xs font-medium">Avg. Order</p>
                  <p className="text-white font-extrabold text-xl mt-1">
                    ${data?.totalOrders ? (data.totalRevenue / data.totalOrders).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-center min-w-24">
                  <p className="text-indigo-200 text-xs font-medium">Avg. Unit</p>
                  <p className="text-white font-extrabold text-xl mt-1">
                    ${data?.totalUnitsSold ? (data.totalRevenue / data.totalUnitsSold).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
