import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, User, ChevronDown, Search, PackageX, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ||
  'https://inventory-management-system-backend-hyu1.onrender.com'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const userRef = useRef(null)
  const notifRef = useRef(null)
  const searchRef = useRef(null)

  // ✅ Fetch products (used by BOTH search and notifications)
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('[Topbar] No token found')
        setProducts([])
        return
      }
      const res = await fetch(`${API_URL}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!res.ok) {
        console.warn('[Topbar] Products fetch failed:', res.status)
        setProducts([])
        return
      }
      const data = await res.json()
      // Handle multiple possible response shapes
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.data)
        ? data.data
        : []
      console.log('[Topbar] Loaded products:', list.length)
      setProducts(list)
    } catch (err) {
      console.error('[Topbar] Fetch error:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
    const interval = setInterval(fetchProducts, 60000)
    return () => clearInterval(interval)
  }, [])

  // Refresh products every time bell or search opens (so user sees latest)
  useEffect(() => {
    if (notifOpen || searchOpen) fetchProducts()
  }, [notifOpen, searchOpen])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const safeProducts = Array.isArray(products) ? products : []

  // ✅ Out of stock = quantity is exactly 0
  const outOfStock = safeProducts.filter((p) => {
    if (!p) return false
    const qty = Number(p.quantity ?? p.stock ?? 0)
    return qty === 0
  })
  const totalAlerts = outOfStock.length

  // ✅ Search products by name or SKU
  const searchResults = searchQuery.trim()
    ? safeProducts
        .filter((p) => {
          if (!p) return false
          const q = searchQuery.toLowerCase()
          return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q))
          )
        })
        .slice(0, 8)
    : []

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
        </h2>
        <p className="text-xs text-gray-500">Here's what's happening today</p>
      </div>

      <div className="flex items-center gap-2">
        {/* 🔍 SEARCH ICON */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => {
              setSearchOpen((v) => !v)
              setNotifOpen(false)
              setUserOpen(false)
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Search products"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>

          {searchOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 overflow-hidden">
              <div className="p-3 border-b flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none text-sm bg-transparent"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loading && safeProducts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Loading products...</div>
                ) : !searchQuery.trim() ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Start typing to search... <br />
                    <span className="text-xs text-gray-400">
                      ({safeProducts.length} products available)
                    </span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No products found for "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSearchOpen(false)
                        setSearchQuery('')
                        navigate('/products')
                      }}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-semibold text-sm">${p.price ?? 0}</div>
                        <div className="text-xs text-gray-500">Qty: {p.quantity ?? 0}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🔔 NOTIFICATION BELL — out of stock only */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotifOpen((v) => !v)
              setSearchOpen(false)
              setUserOpen(false)
            }}
            className="p-2 hover:bg-gray-100 rounded-lg relative transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {totalAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center animate-pulse">
                {totalAlerts > 9 ? '9+' : totalAlerts}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-30 overflow-hidden">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-red-50 to-orange-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Out of Stock Alerts</h3>
                <span className="text-xs text-gray-600 font-medium">
                  {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading && safeProducts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Loading...</div>
                ) : totalAlerts === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-medium text-gray-700">All good!</p>
                    <p className="text-sm">No products out of stock.</p>
                    <p className="text-xs text-gray-400 mt-2">
                      ({safeProducts.length} products checked)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="px-4 py-2 bg-red-50 text-red-700 text-xs font-bold uppercase flex items-center gap-2">
                      <PackageX className="w-3.5 h-3.5" />
                      Out of Stock ({outOfStock.length})
                    </div>
                    {outOfStock.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setNotifOpen(false)
                          navigate('/products')
                        }}
                        className="px-4 py-3 border-b hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{p.name}</div>
                            <div className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full whitespace-nowrap">
                            0 left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {totalAlerts > 0 && (
                <div className="px-4 py-2.5 border-t bg-gray-50 text-center">
                  <button
                    onClick={() => {
                      setNotifOpen(false)
                      navigate('/products')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all products →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 👤 USER MENU */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setUserOpen((v) => !v)
              setNotifOpen(false)
              setSearchOpen(false)
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}