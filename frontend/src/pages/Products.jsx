import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ||
  "https://inventory-management-system-backend-hyu1.onrender.com";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED STOCK STATUS LOGIC
  const getStockStatus = (product) => {
    const qty = Number(product.quantity) || 0;
    const minStock = Number(product.min_stock) || 10;

    if (qty === 0) {
      return {
        label: "Out of Stock",
        className: "bg-red-100 text-red-700 border border-red-300",
      };
    } else if (qty <= minStock) {
      return {
        label: "Low Stock",
        className: "bg-amber-100 text-amber-700 border border-amber-300",
      };
    } else {
      return {
        label: "In Stock",
        className: "bg-green-100 text-green-700 border border-green-300",
      };
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading products...</div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600">Manage your inventory products</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="🔍 Search by name or SKU..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-700">Name</th>
              <th className="text-left p-4 font-semibold text-gray-700">SKU</th>
              <th className="text-right p-4 font-semibold text-gray-700">Quantity</th>
              <th className="text-right p-4 font-semibold text-gray-700">Price</th>
              <th className="text-center p-4 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const status = getStockStatus(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.sku}</td>
                    <td className="p-4 text-right font-semibold">
                      {p.quantity}
                    </td>
                    <td className="p-4 text-right">${p.price}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
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