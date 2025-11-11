"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, AlertCircle } from "lucide-react"
import { Loader2 } from "lucide-react"

interface DriverData {
  name: string
  email: string
  phone: string
  license_number: string
  vehicle: string
  hours_monitored: number
  last_alert: string
  total_alerts: number
}

export default function DriverProfile() {
  const [profile, setProfile] = useState<DriverData>({
    name: "Prital C.",
    email: "prital@example.com",
    phone: "+1-555-0123",
    license_number: "DL123456",
    vehicle: "Tesla Model 3 - License: ABC-1234",
    hours_monitored: 156,
    last_alert: "2 hours ago",
    total_alerts: 14,
  })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  const infoItems = [
    { label: "Email", value: profile.email, icon: Mail },
    { label: "Phone", value: profile.phone, icon: Phone },
    { label: "License Number", value: profile.license_number, icon: AlertCircle },
    { label: "Vehicle", value: profile.vehicle, icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12 rounded-xl bg-[#1E293B] border border-gray-700">
          <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
          <span className="ml-2 text-gray-300 font-medium">
            Loading profile...
          </span>
        </div>
      ) : (
        <>
          <div className="bg-[#1E293B] rounded-xl p-8 relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      {profile.name}
                    </h2>
                    <p className="text-gray-400 font-medium">
                      Active Driver - NeuroDrive System
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(!editing)}
                  className="px-4 py-2 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] text-white rounded-xl hover:from-[#3B82F6] hover:to-[#22D3EE] transition-all duration-200 font-medium shadow-md hover:shadow-[0_0_20px_rgba(255,255,255,0.8)]"
                >
                  {editing ? "Save" : "Edit Profile"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {infoItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                      <Icon className="w-5 h-5 text-[#22D3EE] mt-1" />
                      <div>
                        <p className="text-sm text-gray-300 font-medium">
                          {item.label}
                        </p>
                        <p className="font-semibold text-white">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1E293B] rounded-xl p-6 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <p className="text-sm text-gray-300 mb-2 font-medium">
                Hours Monitored
              </p>
              <p className="text-3xl font-bold text-[#22D3EE]">
                {profile.hours_monitored}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Total monitoring time
              </p>
            </div>
            <div className="bg-[#1E293B] rounded-xl p-6 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <p className="text-sm text-gray-300 mb-2 font-medium">
                Total Alerts
              </p>
              <p className="text-3xl font-bold text-orange-500">
                {profile.total_alerts}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Fatigue alerts triggered
              </p>
            </div>
            <div className="bg-[#1E293B] rounded-xl p-6 relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <p className="text-sm text-gray-300 mb-2 font-medium">
                Last Alert
              </p>
              <p className="text-lg font-bold text-[#22D3EE]">
                {profile.last_alert}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Most recent detection
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
