import type { LucideIcon } from "lucide-react"

interface SummaryCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  bgColor: string
}

export default function SummaryCard({ title, value, icon: Icon, color, bgColor }: SummaryCardProps) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-300 font-medium">
              {title}
            </p>
            <p className="text-3xl font-bold text-[#22D3EE] mt-2">
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${bgColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
