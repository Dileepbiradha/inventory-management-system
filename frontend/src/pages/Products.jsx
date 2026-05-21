import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    quantity: 0,
    price: 0,
    lowStockThreshold: 10,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      quantity: product.quantity || 0,
      price: product.price || 0,
      lowStockThreshold: product.lowStockThreshold || 10,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/products/${editingProduct._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    }
  };

  const getStatus = (qty, threshold = 10) => {
    if (qty === 0)
      return { label: "Out of Stock", style: "bg-red-100 text-red-700" };
    if (qty <= threshold)
      return { label: "Low Stock", style: "bg-yellow-100 text-yellow-700" };
    return { label: "In Stock", style: "bg-green-100 text-green-700" };
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-1">Manage your inventory products</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr className="text-left text-gray-600 text-sm">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4 text-right">Quantity</th>
              <th className="px-6 py-4 text-right">Price</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const status = getStatus(p.quantity, p.lowStockThreshold);
                return (
                  <tr
                    key={p._id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{p.sku}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      {p.quantity}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${p.price}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${status.style}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition"
                        >
                          🗑️ Delete
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

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit Product</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lowStockThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}