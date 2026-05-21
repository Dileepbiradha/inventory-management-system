import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Search } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const filter = searchParams.get("filter");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (qty) => {
    if (qty === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (qty <= 10) return { label: "Low Stock", color: "bg-yellow-100 text-yellow-700" };
    return { label: "In Stock", color: "bg-green-100 text-green-700" };
  };

  const filteredProducts = useMemo(() => {
    let list = products;

    if (filter === "low-stock") {
      list = list.filter((p) => p.quantity > 0 && p.quantity <= 10);
    } else if (filter === "out-of-stock") {
      list = list.filter((p) => p.quantity === 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, filter, search]);

  const handleEdit = (product) => {
    navigate(`/products/edit/${product.id || product._id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts((prev) => prev.filter((p) => (p.id || p._id) !== id));
      alert("Product deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-1">Products</h1>
      <p className="text-gray-500 mb-6">Manage your inventory products</p>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filter indicator */}
      {filter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Filtered by:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {filter === "low-stock" ? "Low Stock" : "Out of Stock"}
          </span>
          <button
            onClick={() => navigate("/products")}
            className="text-sm text-red-500 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-600 text-sm">
              <th className="py-4 px-6 font-semibold">Name</th>
              <th className="py-4 px-6 font-semibold">SKU</th>
              <th className="py-4 px-6 font-semibold text-center">Quantity</th>
              <th className="py-4 px-6 font-semibold text-center">Price</th>
              <th className="py-4 px-6 font-semibold text-center">Status</th>
              <th className="py-4 px-6 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const status = getStatus(p.quantity);
                const id = p.id || p._id;
                return (
                  <tr key={id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{p.name}</td>
                    <td className="py-4 px-6 text-gray-600">{p.sku}</td>
                    <td className="py-4 px-6 text-center font-semibold">
                      {p.quantity}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold">
                      ${p.price}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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
    </div>
  );
}