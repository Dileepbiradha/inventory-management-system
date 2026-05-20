import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { productsAPI } from '../api/products'
import { extractErrorMessage } from '../utils/errors'
import ProductFormModal from '../components/ProductFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const PAGE_SIZE = 10

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await productsAPI.list({
        search,
        page,
        limit: PAGE_SIZE,
      })
      // Adjust based on your API response shape
      setProducts(res.data.items || res.data)
      setTotalPages(res.data.total_pages || 1)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      fetchProducts()
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [search])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line
  }, [page])

  const handleAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleEdit = (product) => {
    setEditing(product)
    setFormOpen(true)
  }

  const handleDelete = (product) => {
    setDeleting(product)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    try {
      await productsAPI.remove(deleting.id)
      toast.success('Product deleted')
      setConfirmOpen(false)
      setDeleting(null)
      fetchProducts()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const handleSaved = () => {
    setFormOpen(false)
    setEditing(null)
    fetchProducts()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your inventory products
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="bg-transparent outline-none text-sm flex-1"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-700 font-medium">No products found</p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or add a new product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          {p.category && (
                            <p className="text-xs text-gray-500">
                              {p.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.sku || '—'}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      ${Number(p.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.stock > 10
                            ? 'bg-green-100 text-green-700'
                            : p.stock > 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && products.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        product={editing}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  )
}