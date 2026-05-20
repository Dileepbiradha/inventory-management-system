import { useEffect, useState, useMemo } from 'react'
import { FolderTree, Package, Search, Edit2, Trash2, Eye, X, AlertTriangle, Plus } from 'lucide-react'
import { productsAPI } from '../api/products'
import { categoriesAPI } from '../api/categories'
import { extractErrorMessage } from '../utils/errors'
import { toast } from 'sonner'

export default function Categories() {
  const [products, setProducts] = useState([])
  const [categoriesRaw, setCategoriesRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewCategory, setViewCategory] = useState(null)
  const [editCategory, setEditCategory] = useState(null)
  const [deleteCategory, setDeleteCategory] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        productsAPI.list({ limit: 1000 }),
        categoriesAPI.list(),
      ])
      const pData = pRes.data?.data || pRes.data?.products || pRes.data || []
      const cData = cRes.data?.data || cRes.data?.categories || cRes.data || []
      setProducts(Array.isArray(pData) ? pData : [])
      setCategoriesRaw(Array.isArray(cData) ? cData : [])
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Build category cards from REAL categories + bucket products by category_id
  const categories = useMemo(() => {
    const buckets = new Map()

    // Seed with real categories (so empty ones still show)
    categoriesRaw.forEach((c) => {
      buckets.set(c.id, {
        id: c.id,
        name: c.name,
        isVirtual: false,
        count: 0, totalStock: 0, totalValue: 0, lowStock: 0, products: [],
      })
    })

    // Bucket each product
    products.forEach((p) => {
      const key = p.category_id ?? p.categoryId ?? null
      let bucket = key != null ? buckets.get(key) : null

      if (!bucket) {
        // Either no category_id, or id doesn't match any real category → Uncategorized
        if (!buckets.has('__uncat__')) {
          buckets.set('__uncat__', {
            id: null,
            name: 'Uncategorized',
            isVirtual: true,
            count: 0, totalStock: 0, totalValue: 0, lowStock: 0, products: [],
          })
        }
        bucket = buckets.get('__uncat__')
      }

      const qty = Number(p.quantity ?? p.stock ?? 0)
      const threshold = Number(p.low_stock_threshold ?? p.minStock ?? 10)
      bucket.count += 1
      bucket.totalStock += qty
      bucket.totalValue += Number(p.price || 0) * qty
      if (qty <= threshold) bucket.lowStock += 1
      bucket.products.push(p)
    })

    return Array.from(buckets.values()).sort((a, b) => {
      if (a.isVirtual) return 1
      if (b.isVirtual) return -1
      return b.count - a.count
    })
  }, [products, categoriesRaw])

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-pink-100', text: 'text-pink-700' },
    { bg: 'bg-green-100', text: 'text-green-700' },
    { bg: 'bg-amber-100', text: 'text-amber-700' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    { bg: 'bg-rose-100', text: 'text-rose-700' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  ]

  const handleCreate = async (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const toastId = toast.loading('Creating category...')
    try {
      await categoriesAPI.create({ name: trimmed })
      toast.success(`Category "${trimmed}" created`, { id: toastId })
      setCreateOpen(false)
      fetchAll()
    } catch (err) {
      toast.error(extractErrorMessage(err), { id: toastId })
    }
  }

  const handleRename = async (cat, newName) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === cat.name) { setEditCategory(null); return }
    const toastId = toast.loading('Renaming category...')
    try {
      await categoriesAPI.update(cat.id, { name: trimmed })
      toast.success(`Renamed to "${trimmed}"`, { id: toastId })
      setEditCategory(null)
      fetchAll()
    } catch (err) {
      toast.error(extractErrorMessage(err), { id: toastId })
    }
  }

  const handleDelete = async (cat) => {
    const toastId = toast.loading('Deleting category...')
    try {
      await categoriesAPI.delete(cat.id)
      toast.success(`Category "${cat.name}" deleted`, { id: toastId })
      setDeleteCategory(null)
      fetchAll()
    } catch (err) {
      toast.error(extractErrorMessage(err), { id: toastId })
    }
  }

  const totalValue = categories.reduce((s, c) => s + c.totalValue, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Browse and manage product categories</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Categories" value={categoriesRaw.length} icon={FolderTree} color="bg-blue-500" />
        <StatCard label="Total Products" value={products.length} icon={Package} color="bg-purple-500" />
        <StatCard
          label="Total Inventory Value"
          value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          icon={Package}
          color="bg-green-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No categories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat, i) => {
            const c = colors[i % colors.length]
            const stockHealth = cat.count > 0 ? ((cat.count - cat.lowStock) / cat.count) * 100 : 100
            return (
              <div
                key={cat.id ?? '__uncat__'}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 transition">
                    <button
                      onClick={() => setViewCategory(cat)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600"
                      title="View products"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!cat.isVirtual && (
                      <>
                        <button
                          onClick={() => setEditCategory(cat)}
                          className="p-2 hover:bg-amber-50 rounded-lg text-gray-500 hover:text-amber-600"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteCategory(cat)}
                          className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 capitalize truncate">{cat.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap ml-2">
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Stock:</span>
                    <span className="font-medium text-gray-900">{cat.totalStock.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Value:</span>
                    <span className="font-medium text-gray-900">
                      ${cat.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {cat.lowStock > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Low stock:
                      </span>
                      <span className="font-medium text-amber-600">{cat.lowStock}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Stock health</span>
                    <span>{Math.round(stockHealth)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        stockHealth >= 80 ? 'bg-green-500' : stockHealth >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${stockHealth}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewCategory && (
        <Modal title={`${viewCategory.name} (${viewCategory.count})`} onClose={() => setViewCategory(null)}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {viewCategory.products.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No products in this category</p>
            )}
            {viewCategory.products.map((p) => (
              <div key={p.id || p._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">SKU: {p.sku || '—'}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">${Number(p.price || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Qty: {p.quantity ?? p.stock ?? 0}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {editCategory && (
        <Modal title="Rename Category" onClose={() => setEditCategory(null)}>
          <NameForm
            initial={editCategory.name}
            submitLabel="Save"
            onSubmit={(name) => handleRename(editCategory, name)}
            onCancel={() => setEditCategory(null)}
          />
        </Modal>
      )}

      {createOpen && (
        <Modal title="New Category" onClose={() => setCreateOpen(false)}>
          <NameForm
            initial=""
            submitLabel="Create"
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
          />
        </Modal>
      )}

      {deleteCategory && (
        <Modal title="Delete Category?" onClose={() => setDeleteCategory(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                Delete <strong>"{deleteCategory.name}"</strong>?
                {deleteCategory.count > 0 && (
                  <> Its {deleteCategory.count} product{deleteCategory.count !== 1 ? 's' : ''} will become uncategorized.</>
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteCategory(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteCategory)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function NameForm({ initial, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initial)
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(name) }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}