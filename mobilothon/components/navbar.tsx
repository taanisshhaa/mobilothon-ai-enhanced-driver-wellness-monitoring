"use client"

import { BarChart3, User, Settings, Home } from "lucide-react"

interface NavbarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <nav className="w-64 bg-[#1E293B] border-r border-gray-700 p-6 flex flex-col relative overflow-hidden shadow-xl">
      <div className="relative z-10">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white">
            NeuroDrive
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Driver Wellness
          </p>
        </div>

        <ul className="space-y-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] text-white shadow-lg"
                      : "text-white hover:bg-gray-700/50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-400 font-medium">
            v1.0.0
          </p>
        </div>
      </div>
    </nav>
  )
}
