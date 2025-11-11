import { AlertCircle, CheckCircle, Eye, Wind, Gauge } from "lucide-react"
import { format } from "date-fns"

interface TimelineEventProps {
  record: {
    timestamp: string
    eye_ratio: number
    blink_count: number
    head_tilt: number
    fatigue_score: number
    status: "alert" | "normal"
  }
}

export default function TimelineEvent({ record }: TimelineEventProps) {
  const isAlert = record.status === "alert"
  const formattedTime = format(new Date(record.timestamp), "HH:mm:ss")

  let intervention = "Driver normal"
  if (record.fatigue_score > 80) {
    intervention = "Trigger loud alert or seat vibration"
  } else if (record.fatigue_score > 60) {
    intervention = "Change ambient lighting or play soft cue"
  }

  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-300 hover:shadow-lg relative overflow-hidden ${
        isAlert
          ? "bg-[#1E293B] border-red-500/30"
          : "bg-[#1E293B] border-green-500/30"
      }`}
    >
      <div className="relative z-10">
        <div className="flex items-start gap-4">
        <div className="mt-1">
          {isAlert ? (
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p
                className={`font-bold text-lg ${
                  isAlert
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {isAlert ? "ALERT - High Fatigue" : "Normal - Driver Alert"}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium">
                {formattedTime}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-3xl font-bold ${
                  isAlert
                    ? "text-red-400"
                    : "text-[#22D3EE]"
                }`}
              >
                {record.fatigue_score}
              </p>
              <p className="text-xs text-gray-400 font-medium">
                Score
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#22D3EE]" />
              <div>
                <p className="text-xs text-gray-400">Eye Ratio</p>
                <p className="font-semibold text-white">{record.eye_ratio.toFixed(3)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-[#22D3EE]" />
              <div>
                <p className="text-xs text-gray-400">Blinks</p>
                <p className="font-semibold text-white">{record.blink_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-[#22D3EE]" />
              <div>
                <p className="text-xs text-gray-400">Head Tilt</p>
                <p className="font-semibold text-white">{record.head_tilt.toFixed(1)}°</p>
              </div>
            </div>
          </div>

          <div
            className={`text-sm p-3 rounded-lg font-medium ${
              isAlert
                ? "bg-red-900/20 border border-red-500/30"
                : "bg-green-900/20 border border-green-500/30"
            }`}
          >
            <span className={isAlert ? "text-red-400" : "text-green-400"}>
              {isAlert ? "⚠️" : "✅"} {intervention}
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
