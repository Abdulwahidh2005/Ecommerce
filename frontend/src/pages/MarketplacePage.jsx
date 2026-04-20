import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

const CATEGORIES = ["All", "Fashion", "Health", "Art", "Home", "Sport", "Music", "Gaming"];

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name" },
];

function ProductImage({ src, title }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={() => setErr(true)}
    />
  );
}

function ProductCard({ product, onAdd, adding }) {
  const outOfStock = product.stockLevel === 0;
  return (
    <article className="group bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      <div className="relative h-64 overflow-hidden">
        <ProductImage src={product.imageUrl} title={product.title} />
        <span className="absolute top-3 left-3 text-xs font-semibold px-3 py-1 rounded-full bg-white/95 backdrop-blur text-slate-700 shadow-sm">
          {product.category}
        </span>
        {outOfStock && (
          <span className="absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full bg-rose-500 text-white shadow-sm">
            Out of stock
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-slate-900 text-base">{product.title}</h3>
        <p className="text-xs text-slate-500 mt-1">
          by <span className="font-semibold text-slate-700">{product.sellerId?.name || "Seller"}</span>
        </p>

        {product.sizes?.length > 0 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {product.sizes.map((s) => (
              <span key={s} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-5 flex items-center justify-between gap-3">
          <span className="text-2xl font-extrabold text-slate-900">${product.price.toFixed(2)}</span>
          <button
            onClick={() => onAdd(product._id)}
            disabled={outOfStock || adding}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-orange-500/25 transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {outOfStock ? "Unavailable" : adding ? "Adding…" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl ring-1 ring-slate-100 overflow-hidden animate-pulse">
      <div className="h-64 bg-slate-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-8 bg-slate-100 rounded w-full mt-4" />
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [addingId, setAddingId] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get("/api/products");
        if (!cancelled) setProducts(data.products || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "name": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      default: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [products, category, search, sort]);

  async function handleAdd(productId) {
    setAddingId(productId);
    try {
      await addToCart(productId, 1);
      setToast("Added to cart");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      setToast(err?.response?.data?.message || "Could not add to cart");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Discover</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} products {category !== "All" ? `in ${category}` : "across all categories"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="pl-9 pr-4 py-2.5 w-64 bg-white rounded-xl border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              category === cat
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-500 text-sm max-w-xs">Try a different category or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} onAdd={handleAdd} adding={addingId === p._id} />
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
