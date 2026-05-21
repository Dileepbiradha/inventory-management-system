import { useState, useEffect, useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL ||
  "https://inventory-management-system-backend-hyu1.onrender.com";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    }
  };

  // Categorize alerts
  const outOfStock = products.filter((p) => Number(p.quantity) === 0);
  const lowStock = products.filter((p) => {
    const qty = Number(p.quantity) || 0;
    const min = Number(p.min_stock) || 10;
    return qty > 0 && qty <= min;
  });

  const totalAlerts = outOfStock.length + lowStock.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {totalAlerts > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {totalAlerts > 9 ? "9+" : totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <span className="text-sm text-gray-500">
                {totalAlerts} alert{totalAlerts !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto">
            {totalAlerts === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-medium">All good!</p>
                <p className="text-sm">No stock alerts at the moment.</p>
              </div>
            ) : (
              <>
                {/* Out of Stock */}
                {outOfStock.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wide">
                      🚨 Out of Stock ({outOfStock.length})
                    </div>
                    {outOfStock.map((p) => (
                      <div
                        key={p.id}
                        className="px-4 py-3 border-b hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {p.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {p.sku}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                            0 left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low Stock */}
                {lowStock.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wide">
                      ⚠️ Low Stock ({lowStock.length})
                    </div>
                    {lowStock.map((p) => (
                      <div
                        key={p.id}
                        className="px-4 py-3 border-b hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {p.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {p.sku}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                            {p.quantity} left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {totalAlerts > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50 text-center">
              <a
                href="/products"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all products →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}