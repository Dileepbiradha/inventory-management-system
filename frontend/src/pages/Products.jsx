import { useState, useEffect } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://inventory-management-system-backend-hyu1.onrender.com";

const emptyForm = {
  name: "",
  sku: "",
  quantity: 0,
  price: 0,
  min_stock: 10,
  category_id: "",
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`, { headers: authHeaders() });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/categories`, { headers: authHeaders() });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      quantity: product.quantity ?? 0,
      price: product.price ?? 0,
      min_stock: product.min_stock ?? 10,
      category_id: product.category_id ?? "",
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        quantity: Number(form.quantity),
        price: Number(form.price),
        min_stock: Number(form.min_stock),
        ...(form.category_id ? { category_id: Number(form.category_id) } : {}),
      };

      const url = editingId
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || err.message || `Failed to ${editingId ? "update" : "create"} product`);
        return;
      }

      setShowModal(false);
      setEditingId(null);
      setForm(emptyForm);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || err.message || "Failed to delete product");
        return;
      }
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Error deleting product");
    } finally {
      setDeleting(false);
    }
  };

  const getStockStatus = (product) => {
    const qty = Number(product.quantity) || 0;
    const minStock = Number(product.min_stock) || 10;
    if (qty === 0)
      return { label: "Out of Stock", className: "bg-red-100 text-red-700 border border-red-300" };
    if (qty <= minStock)
      return { label: "Low Stock", className: "bg-amber-100 text-amber-700 border border-amber-300" };
    return { label: "In Stock", className: "bg-green-100 text-green-700 border border-green-300" };
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading products...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600">Manage your inventory products</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <input
        type="text"
        placeholder="🔍 Search by name or SKU..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-700">Name</th>
              <th className="text-left p-4 font-semibold text-gray-700">SKU</th>
              <th className="text-right p-4 font-semibold text-gray-700">Quantity</th>
              <th className="text-right p-4 font-semibold text-gray-700">Price</th>
              <th className="text-center p-4 font-semibold text-gray-700">Status</th>
              <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const status = getStockStatus(p);
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.sku}</td>
                    <td className="p-4 text-right font-semibold">{p.quantity}</td>
                    <td className="p-4 text-right">${p.price}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          title="Edit"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Delete"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU *</label>
                <input
                  required
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">— None —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold">Delete Product?</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteTarget.name}</span>? This
                action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}