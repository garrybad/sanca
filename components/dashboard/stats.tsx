"use client"

import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react"

const mockStats = [
  {
    label: "Active Circles",
    value: "3",
    change: "+1 this month",
    icon: Users,
    color: "text-accent",
  },
  {
    label: "Total Contributed",
    value: "$2,400",
    change: "$800 this month",
    icon: DollarSign,
    color: "text-accent",
  },
  {
    label: "Total Received",
    value: "$1,200",
    change: "From 1 payout",
    icon: TrendingUp,
    color: "text-accent",
  },
  {
    label: "Next Payout",
    value: "Feb 15",
    change: "15 days away",
    icon: Calendar,
    color: "text-accent",
  },
]

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {mockStats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-6 hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg bg-accent/10`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground font-mono mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </div>
        )
      })}
    </div>
  )
}
