"use client"

import { useState } from "react"
import { Save, RotateCcw, Bell, Eye, Zap } from "lucide-react"

interface Settings {
  alertVolume: number
  fatigueThreshold: number
  enableNotifications: boolean
  enableVibration: boolean
  enableLighting: boolean
  sampleInterval: number
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    alertVolume: 80,
    fatigueThreshold: 60,
    enableNotifications: true,
    enableVibration: true,
    enableLighting: true,
    sampleInterval: 100,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleSetting = (key: keyof Settings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({
        ...prev,
        [key]: !prev[key],
      }))
    }
  }

  const updateValue = (key: keyof Settings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const settingGroups = [
    {
      title: "Alert Settings",
      icon: Bell,
      items: [
        {
          key: "alertVolume",
          label: "Alert Volume",
          type: "slider",
          min: 0,
          max: 100,
          value: settings.alertVolume,
          description: "Volume level for audio alerts",
        },
        {
          key: "fatigueThreshold",
          label: "Fatigue Threshold",
          type: "slider",
          min: 30,
          max: 90,
          value: settings.fatigueThreshold,
          description: "Score above which alerts are triggered",
        },
      ],
    },
    {
      title: "Interventions",
      icon: Zap,
      items: [
        {
          key: "enableNotifications",
          label: "Enable Notifications",
          type: "toggle",
          value: settings.enableNotifications,
          description: "Show notifications on detected fatigue",
        },
        {
          key: "enableVibration",
          label: "Enable Vibration",
          type: "toggle",
          value: settings.enableVibration,
          description: "Trigger seat vibration on alert",
        },
        {
          key: "enableLighting",
          label: "Enable Ambient Lighting",
          type: "toggle",
          value: settings.enableLighting,
          description: "Change cabin lighting based on fatigue level",
        },
      ],
    },
    {
      title: "Monitoring",
      icon: Eye,
      items: [
        {
          key: "sampleInterval",
          label: "Sample Interval (ms)",
          type: "slider",
          min: 50,
          max: 500,
          step: 50,
          value: settings.sampleInterval,
          description: "How often to sample facial features",
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {saved && (
        <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/30">
          <span className="text-green-400 font-medium">
            Settings saved successfully
          </span>
        </div>
      )}

      {settingGroups.map((group) => {
        const Icon = group.icon
        return (
          <div key={group.title} className="bg-[#1E293B] rounded-xl p-6 relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gray-800/50">
                  <Icon className="w-6 h-6 text-[#22D3EE]" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  {group.title}
                </h3>
              </div>

            <div className="space-y-6">
              {group.items.map((item: any) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block font-medium text-white mb-1">{item.label}</label>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>

                  {item.type === "slider" ? (
                    <div className="ml-6 flex items-center gap-3">
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        step={item.step || 1}
                        value={item.value}
                        onChange={(e) => updateValue(item.key, Number.parseInt(e.target.value))}
                        className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#3B82F6]"
                      />
                      <span className="text-sm font-bold text-[#22D3EE] min-w-12">
                        {item.value}
                      </span>
                    </div>
                  ) : item.type === "toggle" ? (
                    <button
                      onClick={() => toggleSetting(item.key)}
                      className={`ml-6 relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-200 ${
                        item.value
                          ? "bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] shadow-lg"
                          : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-md ${
                          item.value ? "translate-x-9" : "translate-x-1"
                        }`}
                      />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            </div>
          </div>
        )
      })}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] text-white rounded-xl hover:from-[#3B82F6] hover:to-[#22D3EE] transition-all duration-200 font-medium shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.8)]"
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-xl hover:bg-gray-700/50 transition-all duration-200 font-medium">
          <RotateCcw className="w-5 h-5" />
          Reset to Default
        </button>
      </div>
    </div>
  )
}
