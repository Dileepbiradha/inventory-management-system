import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { productsAPI } from '../api/products'
import { categoriesAPI } from '../api/categories'
import { extractErrorMessage } from '../utils/errors'

const initialState = {
  name: '',
  sku: '',
  category_id: '',
  price: '',
  stock: '',
  description: '',
}

export default function ProductFormModal({ open, onClose, onSaved, product }) {
  const [form, setForm] = useState(initialState)
  const [categories, setCategories] = useState([])
  const [saving, setSaving] = useState(false)

  // Load categories whenever modal opens
  useEffect(() => {
    if (!open) return
    categoriesAPI.list()
      .then((res) => {
        const data = res.data?.data || res.data?.categories || res.data || []
        setCategories(Array.isArray(data) ? data : [])
      })
      .catch((err) => toast.error(extractErrorMessage(err)))
  }, [open])

  // Reset / populate form
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        category_id: product.category_id ?? product.categoryId ?? '',
        price: product.price ?? '',
        stock: product.quantity ?? product.stock ?? '',
        description: product.description || '',
      })
    } else {
      setForm(initialState)
    }
  }, [product, open])

  if (!open) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        description: form.description,
        price: parseFloat(form.price) || 0,
        quantity: parseInt(form.stock) || 0,  // backend likely uses "quantity"
        stock: parseInt(form.stock) || 0,     // also send "stock" just in case
        category_id: form.category_id ? Number(form.category_id) : null,
      }
      if (product) {
        await productsAPI.update(product.id, payload)
        toast.success('Product updated')
      } else {
        await productsAPI.create(payload)
        toast.success('Product created')
      }
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
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">— Uncategorized —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input
                name="stock"
                type="number"
                min="0"
                required
                value={form.stock}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
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
              {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}