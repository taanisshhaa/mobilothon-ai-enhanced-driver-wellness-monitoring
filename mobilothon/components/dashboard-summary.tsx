"use client"

import { useState, useEffect } from "react"
import SummaryCard from "./summary-card"
import { AlertCircle, TrendingUp, Zap, Activity } from "lucide-react"

interface Summary {
  avg_score: number
  max_score: number
  alert_events: number
  total_records: number
}

export default function DashboardSummary() {
  const [summary, setSummary] = useState<Summary>({
    avg_score: 0,
    max_score: 0,
    alert_events: 0,
    total_records: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/summary")
        if (!response.ok) throw new Error("Failed to fetch summary")
        const data = await response.json()
        setSummary(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
    const interval = setInterval(fetchSummary, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !summary.total_records) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-[#1E293B] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error && !summary.total_records) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-500/30">
        <span className="text-red-400 font-medium">
          Error: {error}
        </span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SummaryCard
        title="Avg. Fatigue Score"
        value={summary.avg_score.toFixed(1)}
        icon={TrendingUp}
        color="text-blue-500"
        bgColor="from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
      />
      <SummaryCard
        title="Max Score"
        value={summary.max_score}
        icon={Zap}
        color="text-orange-500"
        bgColor="from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20"
      />
      <SummaryCard
        title="Alert Events"
        value={summary.alert_events}
        icon={AlertCircle}
        color="text-red-500"
        bgColor="from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20"
      />
      <SummaryCard
        title="Total Records"
        value={summary.total_records}
        icon={Activity}
        color="text-green-500"
        bgColor="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
      />
    </div>
  )
}
