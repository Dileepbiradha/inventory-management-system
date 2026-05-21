import { useState, useEffect } from "react";
import Modal from '../components/Modal'

const API_URL = import.meta.env.VITE_API_URL || 
  "https://inventory-management-system-backend-hyu1.onrender.com";
  
export default function Dashboard() {
  // Data states
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Modal state
  const [modalType, setModalType] = useState(null); // 'products' | 'lowStock' | 'value' | 'movements'

  // Fetch data on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/products`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/stock-movements`, { headers }).then((r) => r.json()),
    ])
      .then(([prodData, movData]) => {
        setProducts(prodData || []);
        setMovements(movData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Computed values
  const lowStockItems = products.filter(
    (p) => p.quantity <= (p.min_stock || 10)
  );
  const inventoryValue = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
    0
  );

  // Filtered search results
  const searchResults = searchQuery
    ? products.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="p-8">
      {/* 🔍 SEARCH BAR */}
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="🔍 Search products by name or SKU..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* Search dropdown */}
        {showSearchResults && searchQuery && (
          <div className="absolute z-40 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">
                No products found for "{searchQuery}"
              </div>
            ) : (
              searchResults.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                >
                  <div>
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-sm text-gray-500">SKU: {p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${p.price}</div>
                    <div className="text-sm text-gray-500">
                      Qty: {p.quantity}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
      <p className="text-gray-600 mb-8">
        Here's what's happening with your inventory today.
      </p>

      {/* 📊 STAT CARDS — ALL CLICKABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={products.length}
          icon="📦"
          color="bg-blue-100"
          onClick={() => setModalType("products")}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockItems.length}
          icon="⚠️"
          color="bg-orange-100"
          onClick={() => setModalType("lowStock")}
        />
        <StatCard
          title="Inventory Value"
          value={`$${inventoryValue.toLocaleString()}`}
          icon="💰"
          color="bg-green-100"
          onClick={() => setModalType("value")}
        />
        <StatCard
          title="Total Movements"
          value={movements.length}
          icon="🔄"
          color="bg-purple-100"
          onClick={() => setModalType("movements")}
        />
      </div>

      {/* 🪟 MODALS */}
      <Modal
        isOpen={modalType === "products"}
        onClose={() => setModalType(null)}
        title={`📦 All Products (${products.length})`}
      >
        <ProductTable products={products} />
      </Modal>

      <Modal
        isOpen={modalType === "lowStock"}
        onClose={() => setModalType(null)}
        title={`⚠️ Low Stock Items (${lowStockItems.length})`}
      >
        {lowStockItems.length === 0 ? (
          <p className="text-green-600">✅ All products are well-stocked!</p>
        ) : (
          <ProductTable products={lowStockItems} highlight />
        )}
      </Modal>

      <Modal
        isOpen={modalType === "value"}
        onClose={() => setModalType(null)}
        title="💰 Inventory Value Breakdown"
      >
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-3xl font-bold text-green-700">
            ${inventoryValue.toLocaleString()}
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Product</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-right p-2">Price</th>
              <th className="text-right p-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2">{p.name}</td>
                <td className="text-right p-2">{p.quantity}</td>
                <td className="text-right p-2">${p.price}</td>
                <td className="text-right p-2 font-semibold">
                  ${((p.price || 0) * (p.quantity || 0)).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <Modal
        isOpen={modalType === "movements"}
        onClose={() => setModalType(null)}
        title={`🔄 Stock Movements (${movements.length})`}
      >
        {movements.length === 0 ? (
          <p className="text-gray-500">No movements recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div
                key={m.id}
                className="flex justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {m.product_name || `Product #${m.product_id}`}
                  </div>
                  <div className="text-sm text-gray-500">
                    {m.reason || "No reason"} •{" "}
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
                <div
                  className={`font-bold ${
                    m.quantity > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {m.quantity > 0 ? "+" : ""}
                  {m.quantity}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

// 🧩 Reusable stat card
function StatCard({ title, value, icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all cursor-pointer text-left w-full"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg text-2xl`}>{icon}</div>
      </div>
      <p className="text-xs text-blue-600 mt-3">Click for details →</p>
    </button>
  );
}

// 🧩 Reusable product table
function ProductTable({ products, highlight = false }) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left p-2">Name</th>
          <th className="text-left p-2">SKU</th>
          <th className="text-right p-2">Quantity</th>
          <th className="text-right p-2">Price</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr
            key={p.id}
            className={`border-b ${highlight ? "bg-orange-50" : ""}`}
          >
            <td className="p-2 font-medium">{p.name}</td>
            <td className="p-2 text-gray-600">{p.sku}</td>
            <td className="text-right p-2">
              <span
                className={
                  p.quantity <= (p.min_stock || 10)
                    ? "text-orange-600 font-bold"
                    : ""
                }
              >
                {p.quantity}
              </span>
            </td>
            <td className="text-right p-2">${p.price}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}