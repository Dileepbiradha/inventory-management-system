import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
    totalMovements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const kpis = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      emoji: "📦",
      bg: "bg-blue-50",
      link: "/products",
    },
    {
      label: "Low Stock Items",
      value: stats.lowStock,
      emoji: "⚠️",
      bg: "bg-yellow-50",
      link: "/products?filter=low-stock",
    },
    {
      label: "Out of Stock",
      value: stats.outOfStock,
      emoji: "🚫",
      bg: "bg-red-50",
      link: "/products?filter=out-of-stock",
    },
    {
      label: "Inventory Value",
      value: `$${Number(stats.inventoryValue).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      emoji: "💰",
      bg: "bg-green-50",
      link: "/products",
    },
    {
      label: "Total Movements",
      value: stats.totalMovements,
      emoji: "🔄",
      bg: "bg-purple-50",
      link: "/stock-movements",
    },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi) => (
            <Link
              to={kpi.link}
              key={kpi.label}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-3">
                <p className="text-sm text-gray-500 font-medium">
                  {kpi.label}
                </p>
                <div className={`${kpi.bg} p-2 rounded-lg`}>
                  <span className="text-xl">{kpi.emoji}</span>
                </div>
              </div>

              <p className="text-3xl font-bold text-blue-600 underline decoration-2 decoration-blue-300 underline-offset-4 group-hover:decoration-blue-600 transition">
                {kpi.value}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}