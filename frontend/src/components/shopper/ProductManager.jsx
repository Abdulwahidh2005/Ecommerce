import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const SIZES = ["S", "M", "L", "XL"];
const CATEGORIES = ["Fashion", "Health", "Art", "Home", "Sport", "Music", "Gaming"];

const CATEGORY_COLORS = {
  Fashion: "bg-pink-100 text-pink-700",
  Health:  "bg-emerald-100 text-emerald-700",
  Art:     "bg-violet-100 text-violet-700",
  Home:    "bg-amber-100 text-amber-700",
  Sport:   "bg-blue-100 text-blue-700",
  Music:   "bg-fuchsia-100 text-fuchsia-700",
  Gaming:  "bg-indigo-100 text-indigo-700",
};

const CATEGORY_ICONS = {
  Fashion: "👗",
  Health:  "🌿",
  Art:     "🎨",
  Home:    "🏠",
  Sport:   "⚽",
  Music:   "🎵",
  Gaming:  "🎮",
};

const STOCK_COLOR = (n) => {
  if (n === 0) return "bg-rose-100 text-rose-700";
  if (n <= 5) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const STOCK_LABEL = (n) => (n === 0 ? "Out of stock" : n <= 5 ? "Low stock" : "In stock");

const EMPTY_FORM = {
  title: "", description: "", price: "", category: "Fashion",
  sizes: [], stockLevel: "", imageUrl: "",
};

// ─── Image with fallback ──────────────────────────────────────────────────────
function ProductImage({ src, title }) {
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

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product?._id);
  const [form, setForm] = useState(product ? {
    title: product.title,
    description: product.description || "",
    price: String(product.price),
    category: product.category,
    sizes: product.sizes || [],
    stockLevel: String(product.stockLevel),
    imageUrl: product.imageUrl || "",
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSize(s) {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(s) ? prev.sizes.filter((x) => x !== s) : [...prev.sizes, s],
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stockLevel: Number(form.stockLevel),
      };
      if (isEdit) {
        await api.put(`/api/products/${product._id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{isEdit ? "Edit Product" : "Add New Product"}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{isEdit ? "Update product details" : "Fill in the details below"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-500 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Category */}
          <div>
            <label className="field-label">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => set("category", cat)}
                  className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    form.category === cat
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 text-slate-500 hover:border-gray-300"
                  }`}>
                  <span className="mr-1">{CATEGORY_ICONS[cat]}</span>{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="field-label">Product Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)}
              className="field-input" placeholder="e.g. Classic Oxford Shirt" required />
          </div>

          {/* Description */}
          <div>
            <label className="field-label">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              className="field-input resize-none" rows={3} placeholder="Brief description of the product..." />
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Price ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
                <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)}
                  className="field-input pl-7" placeholder="0.00" required />
              </div>
            </div>
            <div>
              <label className="field-label">Stock Level</label>
              <input type="number" min="0" value={form.stockLevel} onChange={(e) => set("stockLevel", e.target.value)}
                className="field-input" placeholder="0" />
            </div>
          </div>

          <div>
            <label className="field-label">Available Sizes <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
            <div className="flex gap-2 mt-2">
              {SIZES.map((s) => (
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`w-12 h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                    form.sizes.includes(s)
                      ? "border-indigo-500 bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : "border-gray-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-500"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="field-label">Image URL <span className="text-slate-400 font-normal normal-case">(optional)</span></label>
            <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
              className="field-input" placeholder="https://example.com/image.jpg" />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-rose-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition active:scale-[0.98] disabled:opacity-60">
              {loading ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);
  async function confirm() {
    setLoading(true);
    try {
      await api.delete(`/api/products/${product._id}`);
      onDeleted();
    } catch {
      setLoading(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Product?</h3>
        <p className="text-slate-500 text-sm mb-6">
          <span className="font-semibold text-slate-700">"{product.title}"</span> will be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-slate-600 font-semibold text-sm hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={confirm} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md transition active:scale-[0.98] disabled:opacity-60">
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Image */}
      <div className="h-44 overflow-hidden relative">
        <ProductImage src={product.imageUrl} title={product.title} />
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[product.category]}`}>
            {product.category}
          </span>
        </div>
        {/* Action buttons on hover */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(product)}
            className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-indigo-600 hover:bg-white shadow-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button onClick={() => onDelete(product)}
            className="w-8 h-8 bg-white/90 backdrop-blur rounded-lg flex items-center justify-center text-rose-500 hover:bg-white shadow-sm transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 truncate">{product.title}</h3>
        {product.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-extrabold text-slate-900">${product.price.toFixed(2)}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STOCK_COLOR(product.stockLevel)}`}>
            {STOCK_LABEL(product.stockLevel)} ({product.stockLevel})
          </span>
        </div>

        {/* Sizes */}
        {product.sizes?.length > 0 && (
          <div className="mt-3 flex gap-1.5 flex-wrap">
            {product.sizes.map((s) => (
              <span key={s} className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{s}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-6">
        <svg className="w-12 h-12 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No products yet</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-8">
        Start building your catalogue by adding your first product.
      </p>
      <button onClick={onAdd}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition active:scale-[0.98]">
        Add Your First Product
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null); // null=closed, false=new, obj=edit
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/products/my");
      setProducts(data.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const inStockCount = products.filter((p) => p.stockLevel > 0).length;
  const outOfStockCount = products.filter((p) => p.stockLevel === 0).length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Products", value: products.length, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "In Stock", value: inStockCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Out of Stock", value: outOfStockCount, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 ring-1 ring-black/5`}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className={`text-3xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-52"
              placeholder="Search products…" />
          </div>

          {/* Category filter */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button onClick={() => setModalProduct(false)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition active:scale-[0.98] whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden animate-pulse">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
                <div className="h-6 bg-gray-100 rounded-lg w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        products.length === 0 ? (
          <EmptyState onAdd={() => setModalProduct(false)} />
        ) : (
          <div className="text-center py-16 text-slate-500">
            <p className="font-medium">No products match your search.</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p}
              onEdit={(prod) => setModalProduct(prod)}
              onDelete={(prod) => setDeleteTarget(prod)} />
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {modalProduct !== null && (
        <ProductModal
          product={modalProduct || null}
          onClose={() => setModalProduct(null)}
          onSaved={() => { setModalProduct(null); load(); }}
        />
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <DeleteModal
          product={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}
    </div>
  );
}
