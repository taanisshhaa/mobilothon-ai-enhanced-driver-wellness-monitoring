"use client"

import { useState, useEffect } from "react"
import TimelineEvent from "./timeline-event"
import { Loader2 } from "lucide-react"

interface FatigueRecord {
  timestamp: string
  eye_ratio: number
  blink_count: number
  head_tilt: number
  fatigue_score: number
  status: "alert" | "normal"
}

export default function TimelineView() {
  const [history, setHistory] = useState<FatigueRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/history")
        if (!response.ok) throw new Error("Failed to fetch history")
        const data = await response.json()
        setHistory(data.reverse())
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
    const interval = setInterval(fetchHistory, 3000)
    return () => clearInterval(interval)
  }, [])

  if (error && !history.length) {
    return (
      <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/30">
        Error loading timeline: {error}
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">
        Fatigue Timeline
      </h2>

      {loading && !history.length ? (
        <div className="flex items-center justify-center py-12 rounded-xl bg-[#1E293B] border border-gray-700">
          <Loader2 className="w-8 h-8 text-[#22D3EE] animate-spin" />
          <span className="ml-2 text-gray-300 font-medium">
            Loading events...
          </span>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-[#1E293B] rounded-xl p-8 text-center relative overflow-hidden">
          <p className="text-gray-300 font-medium">
            No fatigue data yet. Start the camera module to begin monitoring.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
          {history.map((record, index) => (
            <TimelineEvent key={index} record={record} />
          ))}
        </div>
      )}
    </div>
  )
}
