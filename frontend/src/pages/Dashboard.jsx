import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    inventoryValue: 0,
    totalMovements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch products
      const productsRes = await axios.get(`${API_URL}/products`, config);
      const products = productsRes.data || [];

      // Fetch movements
      let movements = [];
      try {
        const movementsRes = await axios.get(`${API_URL}/stock-movements`, config);
        movements = movementsRes.data || [];
      } catch (e) {
        movements = [];
      }

      // Calculate stats
      const totalProducts = products.length;
      const lowStock = products.filter(
        (p) => p.quantity > 0 && p.quantity <= (p.lowStockThreshold || 10)
      ).length;
      const outOfStock = products.filter((p) => p.quantity === 0).length;
      const inventoryValue = products.reduce(
        (sum, p) => sum + (p.price || 0) * (p.quantity || 0),
        0
      );

      setStats({
        totalProducts,
        lowStock,
        outOfStock,
        inventoryValue,
        totalMovements: movements.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: "📦",
      color: "blue",
      bg: "bg-blue-100",
      onClick: () => navigate("/products"),
    },
    {
      title: "Low Stock Items",
      value: stats.lowStock,
      icon: "⚠️",
      color: "yellow",
      bg: "bg-yellow-100",
      onClick: () => navigate("/products?filter=low"),
    },
    {
      title: "Out of Stock",
      value: stats.outOfStock,
      icon: "❌",
      color: "red",
      bg: "bg-red-100",
      onClick: () => navigate("/products?filter=out"),
    },
    {
      title: "Inventory Value",
      value: `$${stats.inventoryValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: "💰",
      color: "green",
      bg: "bg-green-100",
      onClick: () => navigate("/products"),
    },
    {
      title: "Total Movements",
      value: stats.totalMovements,
      icon: "🔄",
      color: "purple",
      bg: "bg-purple-100",
      onClick: () => navigate("/stock-movements"),
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Welcome back! <span className="inline-block">👋</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Here's what's happening with your inventory today.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.onClick}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-gray-500 font-medium">{card.title}</p>
              <div
                className={`${card.bg} w-10 h-10 rounded-lg flex items-center justify-center text-xl`}
              >
                {card.icon}
              </div>
            </div>
            <p
              className={`text-3xl font-bold text-${card.color}-600 underline decoration-2 decoration-${card.color}-400 underline-offset-4 hover:decoration-${card.color}-600`}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}