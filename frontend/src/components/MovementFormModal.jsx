import { useEffect, useState } from 'react'
import {
  X,
  Loader2,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { movementsAPI } from '../api/movements'
import { productsAPI } from '../api/products'
import { extractErrorMessage } from '../utils/errors'

const initialState = {
  product_id: '',
  movement_type: 'IN',
  quantity: '',
  reference: '',
  notes: '',
}

const TYPES = [
  {
    value: 'IN',
    label: 'Stock In',
    desc: 'Add inventory (purchase, return)',
    icon: ArrowDownCircle,
    color: 'green',
  },
  {
    value: 'OUT',
    label: 'Stock Out',
    desc: 'Remove inventory (sale, damage)',
    icon: ArrowUpCircle,
    color: 'red',
  },
  {
    value: 'ADJUSTMENT',
    label: 'Adjustment',
    desc: 'Correct stock count',
    icon: Settings2,
    color: 'blue',
  },
]

export default function MovementFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(initialState)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm(initialState)
      return
    }
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        const res = await productsAPI.list({ limit: 500 })
        setProducts(res.data.items || res.data)
      } catch (err) {
        toast.error(extractErrorMessage(err))
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [open])

  if (!open) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const selectType = (type) => {
    setForm({ ...form, movement_type: type })
  }

  const selectedProduct = products.find(
    (p) => String(p.id) === String(form.product_id)
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.product_id) {
      toast.error('Please select a product')
      return
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    setSaving(true)
    try {
      const payload = {
        product_id: Number(form.product_id),
        movement_type: form.movement_type,
        quantity: parseInt(form.quantity, 10),
        reference: form.reference || null,
        notes: form.notes || null,
      }
      await movementsAPI.create(payload)
      toast.success('Movement recorded')
      onSaved()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Record Stock Movement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Movement Type Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon
                const active = form.movement_type === t.value
                const colorMap = {
                  green: active
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300',
                  red: active
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300',
                  blue: active
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-blue-300',
                }
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => selectType(t.value)}
                    className={`border-2 rounded-lg p-3 text-center transition ${colorMap[t.color]}`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-semibold">{t.label}</p>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {TYPES.find((t) => t.value === form.movement_type)?.desc}
            </p>
          </div>

          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              name="product_id"
              required
              value={form.product_id}
              onChange={handleChange}
              disabled={loadingProducts}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">
                {loadingProducts ? 'Loading products...' : 'Select a product'}
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.sku ? ` (${p.sku})` : ''} — {p.stock} in stock
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="text-xs text-gray-500 mt-1">
                Current stock:{' '}
                <span className="font-semibold text-gray-700">
                  {selectedProduct.stock}
                </span>
              </p>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              name="quantity"
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={handleChange}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.movement_type === 'OUT' &&
              selectedProduct &&
              Number(form.quantity) > selectedProduct.stock && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Quantity exceeds current stock ({selectedProduct.stock})
                </p>
              )}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference
            </label>
            <input
              name="reference"
              value={form.reference}
              onChange={handleChange}
              placeholder="e.g. PO-1234, INV-5678"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              rows="3"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional reason or details..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Movement
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}