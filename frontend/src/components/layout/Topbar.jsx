import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, User, ChevronDown, Search, PackageX, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ||
  'https://inventory-management-system-backend-hyu1.onrender.com'

export default function Topbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])

  const ref = useRef(null)
  const notifRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    let mounted = true
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const res = await fetch(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data?.products || [])
        if (mounted) setProducts(list)
      } catch (err) { console.error('[Topbar]', err) }
    }
    fetchProducts()
    const interval = setInterval(fetchProducts, 60000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const safeProducts = Array.isArray(products) ? products : []

  // ✅ ONLY OUT-OF-STOCK alerts
  const outOfStock = safeProducts.filter((p) => p && Number(p.quantity) === 0)
  const totalAlerts = outOfStock.length

  // 🔍 Search results
  const searchResults = searchQuery
    ? safeProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
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
        {/* 🔍 SEARCH ICON (left of bell) */}
        <div className="relative" ref={searchRef}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Search"
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
                  className="flex-1 outline-none text-sm"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {!searchQuery ? (
                  <div className="p-6 text-center text-sm text-gray-500">Start typing to search...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">No products found</div>
                ) : (
                  searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/products') }}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">SKU: {p.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">${p.price}</div>
                        <div className="text-xs text-gray-500">Qty: {p.quantity}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 🔔 NOTIFICATIONS — only Out of Stock */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg relative transition"
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
                {totalAlerts === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-medium text-gray-700">All good!</p>
                    <p className="text-sm">No products out of stock.</p>
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
                        onClick={() => { setNotifOpen(false); navigate('/products') }}
                        className="px-4 py-3 border-b hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{p.name}</div>
                            <div className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</div>
                          </div>
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">0 left</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {totalAlerts > 0 && (
                <div className="px-4 py-2.5 border-t bg-gray-50 text-center">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/products') }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all products →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 👤 User Menu */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button onClick={() => navigate('/profile')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                <User className="w-4 h-4" /> Profile
              </button>
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}