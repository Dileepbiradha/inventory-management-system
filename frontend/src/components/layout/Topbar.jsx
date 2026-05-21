import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, User, ChevronDown, Search, PackageX, X, Plus, Package, DollarSign, Hash, Tag } from 'lucide-react'
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

  // 🆕 Product details modal
  const [detailProduct, setDetailProduct] = useState(null)

  // 🆕 Quick stock update
  const [quickProduct, setQuickProduct] = useState(null)
  const [quickQty, setQuickQty] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  const userRef = useRef(null)
  const notifRef = useRef(null)
  const searchRef = useRef(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
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
        setProducts([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.data)
        ? data.data
        : []
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

  useEffect(() => {
    if (notifOpen || searchOpen) fetchProducts()
  }, [notifOpen, searchOpen])

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

  // 🆕 Quick stock update — POST a movement
  const handleQuickUpdate = async (e) => {
    e.preventDefault()
    if (!quickProduct || !quickQty || Number(quickQty) <= 0) return
    setUpdating(true)
    setUpdateMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: quickProduct.id,
          movement_type: 'IN',
          quantity: Number(quickQty),
          notes: 'Quick restock from notification',
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Update failed')
      }
      setUpdateMsg('✅ Stock updated!')
      setQuickQty('')
      await fetchProducts()
      setTimeout(() => {
        setQuickProduct(null)
        setUpdateMsg('')
      }, 1000)
    } catch (err) {
      setUpdateMsg('❌ ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const safeProducts = Array.isArray(products) ? products : []

  const outOfStock = safeProducts.filter((p) => {
    if (!p) return false
    const qty = Number(p.quantity ?? p.stock ?? 0)
    return qty === 0
  })
  const totalAlerts = outOfStock.length

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
    <>
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
                          setDetailProduct(p)        // 🆕 open details modal
                          setSearchOpen(false)
                          setSearchQuery('')
                        }}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center"
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

          {/* 🔔 NOTIFICATION BELL */}
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
                    </div>
                  ) : (
                    <div>
                      <div className="px-4 py-2 bg-red-50 text-red-700 text-xs font-bold uppercase flex items-center gap-2">
                        <PackageX className="w-3.5 h-3.5" />
                        Out of Stock ({outOfStock.length})
                      </div>
                      {outOfStock.map((p) => (
                        <div key={p.id} className="border-b last:border-0">
                          {/* 🆕 If this product is in quick-update mode, show form */}
                          {quickProduct?.id === p.id ? (
                            <form
                              onSubmit={handleQuickUpdate}
                              className="px-4 py-3 bg-blue-50"
                            >
                              <div className="font-medium text-gray-900 text-sm mb-2 truncate">
                                {p.name}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  autoFocus
                                  type="number"
                                  min="1"
                                  placeholder="Qty"
                                  value={quickQty}
                                  onChange={(e) => setQuickQty(e.target.value)}
                                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:border-blue-500"
                                />
                                <button
                                  type="submit"
                                  disabled={updating || !quickQty}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {updating ? '...' : 'Add'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickProduct(null)
                                    setQuickQty('')
                                    setUpdateMsg('')
                                  }}
                                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {updateMsg && (
                                <div className="text-xs mt-1.5 font-medium">{updateMsg}</div>
                              )}
                            </form>
                          ) : (
                            <div className="px-4 py-3 hover:bg-gray-50 flex justify-between items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{p.name}</div>
                                <div className="text-xs text-gray-500">SKU: {p.sku || 'N/A'}</div>
                              </div>
                              <button
                                onClick={() => {
                                  setQuickProduct(p)
                                  setQuickQty('')
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full flex items-center gap-1 whitespace-nowrap"
                              >
                                <Plus className="w-3 h-3" /> Stock
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

      {/* 🆕 PRODUCT DETAILS MODAL */}
      {detailProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{detailProduct.name}</h3>
                  <p className="text-xs text-blue-100">Product Details</p>
                </div>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <DetailRow icon={<Hash className="w-4 h-4" />} label="SKU" value={detailProduct.sku || 'N/A'} />
              <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Price" value={`$${detailProduct.price ?? 0}`} />
              <DetailRow
                icon={<Package className="w-4 h-4" />}
                label="Quantity"
                value={
                  <span className={
                    Number(detailProduct.quantity) === 0
                      ? 'text-red-600 font-bold'
                      : Number(detailProduct.quantity) <= Number(detailProduct.min_stock || 10)
                      ? 'text-amber-600 font-bold'
                      : 'text-green-600 font-bold'
                  }>
                    {detailProduct.quantity ?? 0}
                  </span>
                }
              />
              {detailProduct.min_stock != null && (
                <DetailRow icon={<Tag className="w-4 h-4" />} label="Min Stock" value={detailProduct.min_stock} />
              )}
              {detailProduct.category && (
                <DetailRow icon={<Tag className="w-4 h-4" />} label="Category" value={detailProduct.category} />
              )}
              {detailProduct.description && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-700">{detailProduct.description}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setDetailProduct(null)
                  navigate('/products')
                }}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Go to Products
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Small helper for detail rows
function DetailRow({ icon, label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm text-gray-900 font-medium">{value}</div>
    </div>
  )
}