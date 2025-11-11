"use client"

import { useState } from "react"
import DashboardSummary from "@/components/dashboard-summary"
import TimelineView from "@/components/timeline-view"
import Navbar from "@/components/navbar"
import TrendsChart from "@/components/trends-chart"
import DriverProfile from "@/components/driver-profile"
import SettingsPanel from "@/components/settings-panel"
import CameraPanel from "@/components/camera-panel"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="flex h-screen bg-[#0F172A] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" />
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto relative z-10">
        {activeTab === "dashboard" && (
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Driver Wellness Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Real-time fatigue monitoring and analytics
              </p>
            </div>
            <CameraPanel />
            <DashboardSummary />
            <TimelineView />
          </div>
        )}
        {activeTab === "reports" && (
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Reports & Trends
              </h1>
              <p className="text-gray-400 mt-2">
                Detailed analytics and trend analysis
              </p>
            </div>
            <TrendsChart />
          </div>
        )}
        {activeTab === "profile" && (
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Driver Profile
              </h1>
              <p className="text-gray-400 mt-2">
                Manage your driver information and statistics
              </p>
            </div>
            <DriverProfile />
          </div>
        )}
        {activeTab === "settings" && (
          <div className="p-8 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Settings
              </h1>
              <p className="text-gray-400 mt-2">
                Configure monitoring preferences and alert behavior
              </p>
            </div>
            <SettingsPanel />
          </div>
        )}
      </main>
    </div>
  )
}
