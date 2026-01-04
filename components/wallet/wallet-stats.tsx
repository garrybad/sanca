"use client"

import { TrendingDown, TrendingUp, Calendar } from "lucide-react"

const stats = [
  {
    label: "Total Contributed",
    value: "$2,400",
    change: "Across 3 circles",
    icon: TrendingDown,
    color: "text-foreground",
  },
  {
    label: "Total Received",
    value: "$1,200",
    change: "From 1 payout",
    icon: TrendingUp,
    color: "text-accent",
  },
  {
    label: "Pending Payouts",
    value: "$4,200",
    change: "Across 2 circles",
    icon: Calendar,
    color: "text-accent",
  },
]

export default function WalletStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.label} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${stat.color === "text-accent" ? "accent" : "primary"}/10`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground font-mono mb-2">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </div>
        )
      })}
    </div>
  )
}
