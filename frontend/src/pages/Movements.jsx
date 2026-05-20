import { useEffect, useState } from 'react'
import {
  Plus,
  Search,
  ArrowLeftRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { movementsAPI } from '../api/movements'
import { extractErrorMessage } from '../utils/errors'
import MovementFormModal from '../components/MovementFormModal'

const TYPE_META = {
  IN: {
    label: 'Stock In',
    icon: ArrowDownCircle,
    badge: 'bg-green-100 text-green-700',
    icon_bg: 'bg-green-100 text-green-600',
    sign: '+',
    sign_color: 'text-green-600',
  },
  OUT: {
    label: 'Stock Out',
    icon: ArrowUpCircle,
    badge: 'bg-red-100 text-red-700',
    icon_bg: 'bg-red-100 text-red-600',
    sign: '-',
    sign_color: 'text-red-600',
  },
  ADJUSTMENT: {
    label: 'Adjustment',
    icon: Settings2,
    badge: 'bg-blue-100 text-blue-700',
    icon_bg: 'bg-blue-100 text-blue-600',
    sign: '±',
    sign_color: 'text-blue-600',
  },
}

export default function Movements() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [formOpen, setFormOpen] = useState(false)

  const PAGE_SIZE = 15

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const res = await movementsAPI.list({
        search: search || undefined,
        movement_type: typeFilter || undefined,
        page,
        limit: PAGE_SIZE,
      })
      const data = res.data
      setMovements(data.items || data)
      setTotalPages(data.total_pages || 1)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // Debounced search + filter
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      fetchMovements()
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [search, typeFilter])

  useEffect(() => {
    fetchMovements()
    // eslint-disable-next-line
  }, [page])

  const handleSaved = () => {
    setFormOpen(false)
    fetchMovements()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
          <p className="text-gray-500 text-sm mt-1">
            Track inventory in, out, and adjustments
          </p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Record Movement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, SKU, or reference..."
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <div className="flex gap-2">
            {['', 'IN', 'OUT', 'ADJUSTMENT'].map((t) => (
              <button
                key={t || 'ALL'}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t === '' ? 'All' : TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ArrowLeftRight className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-700 font-medium">No movements found</p>
            <p className="text-sm text-gray-500 mt-1">
              Record your first stock movement to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((m) => {
                  const meta = TYPE_META[m.movement_type] || TYPE_META.ADJUSTMENT
                  const Icon = meta.icon
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {formatDate(m.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.icon_bg}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {m.product_name || m.product?.name || '—'}
                            </p>
                            {(m.product_sku || m.product?.sku) && (
                              <p className="text-xs text-gray-500">
                                SKU: {m.product_sku || m.product?.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${meta.sign_color}`}>
                          {meta.sign}
                          {Math.abs(m.quantity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {m.reference || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && movements.length > 0 && (
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

      {/* Modal */}
      <MovementFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}