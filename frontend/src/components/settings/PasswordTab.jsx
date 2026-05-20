import { useState } from 'react'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { authAPI } from '../../api/auth'
import { extractErrorMessage } from '../../utils/errors'

export default function PasswordTab() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const toggleShow = (field) => {
    setShow({ ...show, [field]: !show[field] })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Client-side validation
    if (form.new_password.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (form.new_password !== form.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    if (form.current_password === form.new_password) {
      toast.error('New password must be different from current password')
      return
    }

    setSaving(true)
    try {
      await authAPI.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast.success('Password changed successfully')
      setForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // Reusable password input
  const PasswordField = ({ label, name, value, showKey }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          name={name}
          type={show[showKey] ? 'text' : 'password'}
          required
          value={value}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => toggleShow(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show[showKey] ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
        <p className="text-sm text-blue-900">
          Use a strong password with at least 6 characters. Avoid using common words or
          personal information.
        </p>
      </div>

      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Password
        </label>
        <div className="relative">
          <input
            name="current_password"
            type={show.current ? 'text' : 'password'}
            required
            value={form.current_password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => toggleShow('current')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <div className="relative">
          <input
            name="new_password"
            type={show.new ? 'text' : 'password'}
            required
            minLength={6}
            value={form.new_password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => toggleShow('new')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            name="confirm_password"
            type={show.confirm ? 'text' : 'password'}
            required
            minLength={6}
            value={form.confirm_password}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => toggleShow('confirm')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          Update Password
        </button>
      </div>
    </form>
  )
}