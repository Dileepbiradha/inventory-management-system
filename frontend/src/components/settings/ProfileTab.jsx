import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { authAPI } from '../../api/auth'
import { extractErrorMessage } from '../../utils/errors'
import { useAuth } from '../../hooks/useAuth'

export default function ProfileTab() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch current user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.me()
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
        })
      } catch (err) {
        // Fallback to user from AuthContext
        if (user) {
          setForm({ name: user.name || '', email: user.email || '' })
        } else {
          toast.error(extractErrorMessage(err))
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
    // eslint-disable-next-line
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authAPI.updateProfile(form)
      // Update AuthContext so sidebar/header reflect new info
      if (setUser) setUser(res.data)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      {/* Avatar Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-semibold">
          {(form.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-gray-900">{form.name || 'User'}</p>
          <p className="text-sm text-gray-500">{form.email}</p>
        </div>
      </div>

      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
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
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  )
}