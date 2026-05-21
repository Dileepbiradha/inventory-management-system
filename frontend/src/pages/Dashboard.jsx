import { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { X } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://inventory-management-system-backend-hyu1.onrender.com";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
    totalMovements: 0,
  });
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'all' | 'low' | 'out' | 'value' | 'movements'

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, productsRes, movementsRes] = await Promise.all([
          axios.get(`${API_URL}/api/dashboard/stats`, { headers }).catch(() => ({ data: {} })),
          axios.get(`${API_URL}/api/products`, { headers }).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/api/stock-movements`, { headers }).catch(() => ({ data: [] })),
        ]);

        const prods = productsRes.data || [];
        setProducts(prods);
        setMovements(movementsRes.data || []);

        // Compute stats from products if backend doesn't provide them
        const totalProducts = prods.length;
        const outOfStock = prods.filter((p) => Number(p.quantity) === 0).length;
        const lowStock = prods.filter((p) => {
          const q = Number(p.quantity);
          const m = Number(p.min_stock) || 10;
          return q > 0 && q <= m;
        }).length;
        const inventoryValue = prods.reduce(
          (sum, p) => sum + Number(p.quantity || 0) * Number(p.price || 0),
          0
        );

        setStats({
          totalProducts: statsRes.data.totalProducts ?? totalProducts,
          lowStock: statsRes.data.lowStock ?? lowStock,
          outOfStock: statsRes.data.outOfStock ?? outOfStock,
          inventoryValue: statsRes.data.inventoryValue ?? inventoryValue,
          totalMovements: statsRes.data.totalMovements ?? (movementsRes.data?.length || 0),
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const inStock = products.filter(
    (p) => Number(p.quantity) > (Number(p.min_stock) || 10)
  ).length;

  const stockPieData = [
    { name: "In Stock", value: inStock, color: "#10b981" },
    { name: "Low Stock", value: stats.lowStock, color: "#f59e0b" },
    { name: "Out of Stock", value: stats.outOfStock, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Inventory value per product (top 6) for second pie
  const valuePieData = [...products]
    .map((p) => ({
      name: p.name,
      value: Number(p.quantity || 0) * Number(p.price || 0),
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

  const kpis = [
    {
      key: "all",
      label: "Total Products",
      value: stats.totalProducts,
      emoji: "📦",
      bg: "bg-blue-50",
    },
    {
      key: "low",
      label: "Low Stock Items",
      value: stats.lowStock,
      emoji: "⚠️",
      bg: "bg-yellow-50",
    },
    {
      key: "out",
      label: "Out of Stock",
      value: stats.outOfStock,
      emoji: "🚫",
      bg: "bg-red-50",
    },
    {
      key: "value",
      label: "Inventory Value",
      value: `$${Number(stats.inventoryValue).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      emoji: "💰",
      bg: "bg-green-50",
    },
    {
      key: "movements",
      label: "Total Movements",
      value: stats.totalMovements,
      emoji: "🔄",
      bg: "bg-purple-50",
    },
  ];

  // ----- Modal data resolver -----
  const getModalData = () => {
    switch (modal) {
      case "all":
        return { title: "📦 All Products", items: products, type: "products" };
      case "low":
        return {
          title: "⚠️ Low Stock Items",
          items: products.filter((p) => {
            const q = Number(p.quantity);
            const m = Number(p.min_stock) || 10;
            return q > 0 && q <= m;
          }),
          type: "products",
        };
      case "out":
        return {
          title: "🚫 Out of Stock Items",
          items: products.filter((p) => Number(p.quantity) === 0),
          type: "products",
        };
      case "value":
        return {
          title: "💰 Inventory Value Breakdown",
          items: [...products]
            .map((p) => ({
              ...p,
              total: Number(p.quantity || 0) * Number(p.price || 0),
            }))
            .sort((a, b) => b.total - a.total),
          type: "value",
        };
      case "movements":
        return { title: "🔄 Recent Stock Movements", items: movements, type: "movements" };
      default:
        return null;
    }
  };

  const modalData = modal ? getModalData() : null;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-2">
        Welcome back! <span>👋</span>
      </h1>
      <p className="text-gray-500 mb-8">
        Here's what's happening with your inventory today.
      </p>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {kpis.map((kpi) => (
              <button
                onClick={() => setModal(kpi.key)}
                key={kpi.key}
                className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                  <div className={`${kpi.bg} p-2 rounded-lg`}>
                    <span className="text-xl">{kpi.emoji}</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-blue-600 underline decoration-2 decoration-blue-300 underline-offset-4 group-hover:decoration-blue-600 transition">
                  {kpi.value}
                </p>
              </button>
            ))}
          </div>

          {/* Pie Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Status Pie */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">📊 Stock Status Distribution</h2>
              {stockPieData.length === 0 ? (
                <p className="text-gray-400 text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stockPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stockPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Inventory Value Pie */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4">💎 Top Products by Value</h2>
              {valuePieData.length === 0 ? (
                <p className="text-gray-400 text-center py-12">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={valuePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name }) => name}
                    >
                      {valuePieData.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL */}
      {modal && modalData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold">{modalData.title}</h2>
              <button
                onClick={() => setModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto p-5">
              {modalData.items.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No items found</p>
              ) : modalData.type === "products" ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Name</th>
                      <th className="text-left p-3 text-sm font-semibold">SKU</th>
                      <th className="text-right p-3 text-sm font-semibold">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.items.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-gray-600">{p.sku}</td>
                        <td className="p-3 text-right">{p.quantity}</td>
                        <td className="p-3 text-right">${p.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : modalData.type === "value" ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Name</th>
                      <th className="text-right p-3 text-sm font-semibold">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold">Price</th>
                      <th className="text-right p-3 text-sm font-semibold">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.items.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-right">{p.quantity}</td>
                        <td className="p-3 text-right">${p.price}</td>
                        <td className="p-3 text-right font-bold text-green-600">
                          ${Number(p.total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">Product</th>
                      <th className="text-left p-3 text-sm font-semibold">Type</th>
                      <th className="text-right p-3 text-sm font-semibold">Qty</th>
                      <th className="text-left p-3 text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.items.map((m) => (
                      <tr key={m.id} className="border-b">
                        <td className="p-3">{m.product_name || m.product?.name || `#${m.product_id}`}</td>
                        <td className="p-3 capitalize">{m.movement_type || m.type}</td>
                        <td className="p-3 text-right">{m.quantity}</td>
                        <td className="p-3 text-gray-600 text-sm">
                          {m.created_at ? new Date(m.created_at).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}