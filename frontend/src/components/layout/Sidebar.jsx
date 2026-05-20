import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Truck,
  ArrowLeftRight,
  Users,
  BarChart3,
  Settings,
  Box,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: FolderTree, label: 'Categories' },
  { to: '/suppliers', icon: Truck, label: 'Suppliers' },
  { to: '/movements', icon: ArrowLeftRight, label: 'Stock Movements' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
]

const adminItems = [
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Inventory</h1>
            <p className="text-xs text-gray-500">Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main
        </p>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass}>
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="px-4 mb-2 mt-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Admin
            </p>
            {adminItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'user'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}