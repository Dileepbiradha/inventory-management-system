import { useEffect, useState } from 'react'
import {
  Boxes,
  AlertTriangle,
  DollarSign,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Package,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { dashboardAPI } from '../api/dashboard'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [statsData, lowStockData, txData] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getLowStock(),
          dashboardAPI.getRecentTransactions(),
        ])
        setStats(statsData)
        setLowStock(lowStockData)
        setTransactions(txData)
      } catch (err) {
        console.error(err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n || 0)

  const formatDate = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statCards = [
    {
      label: 'Total Products',
      value: stats?.total_products ?? 0,
      icon: Boxes,
      color: 'bg-blue-500',
    },
    {
      label: 'Low Stock Items',
      value: stats?.low_stock_count ?? 0,
      icon: AlertTriangle,
      color: 'bg-orange-500',
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(stats?.total_inventory_value),
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      label: 'Total Movements',
      value: stats?.total_movements ?? 0,
      icon: ArrowLeftRight,
      color: 'bg-purple-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0] || user?.username || 'there'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here's what's happening with your inventory today.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div
                className={`w-11 h-11 ${color} rounded-lg flex items-center justify-center`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <span className="text-xs text-gray-400">Last 10</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {transactions.map((tx) => {
                const isIn = tx.movement_type === 'IN' || tx.movement_type === 'in'
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isIn ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        {isIn ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {tx.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.reason || 'No reason'} • {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isIn ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isIn ? '+' : '-'}
                      {tx.quantity}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Low Stock Alerts</h2>
            {lowStock.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                {lowStock.length} item{lowStock.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {lowStock.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-sm text-gray-500">All products are well stocked!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {lowStock.map((item) => {
                const ratio = item.min_stock_level
                  ? (item.quantity / item.min_stock_level) * 100
                  : 0
                const isCritical = ratio < 50
                return (
                  <div
                    key={item.id}
                    className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            isCritical ? 'text-red-600' : 'text-orange-600'
                          }`}
                        >
                          {item.quantity} {item.unit || ''}
                        </p>
                        <p className="text-xs text-gray-400">
                          Min: {item.min_stock_level}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCritical ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(ratio, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}