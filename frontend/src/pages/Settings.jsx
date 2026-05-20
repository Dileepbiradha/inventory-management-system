import { useState } from 'react'
import { User, Lock } from 'lucide-react'
import ProfileTab from '../components/settings/ProfileTab'
import PasswordTab from '../components/settings/PasswordTab'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs Container */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'password' && <PasswordTab />}
        </div>
      </div>
    </div>
  )
}