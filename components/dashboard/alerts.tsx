"use client"

import { CheckCircle2, Clock } from "lucide-react"

const mockAlerts = [
  {
    id: 1,
    type: "reminder",
    title: "Contribution Due Tomorrow",
    message: "Community Builders Circle contribution of $300 is due tomorrow",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-600/10",
  },
  {
    id: 2,
    type: "success",
    title: "Payout Received",
    message: "You received $1,500 from Tech Friends Savings circle",
    icon: CheckCircle2,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
]

export default function AlertsSection() {
  if (mockAlerts.length === 0) return null

  return (
    <div className="space-y-3">
      {mockAlerts.map((alert) => {
        const Icon = alert.icon
        return (
          <div key={alert.id} className={`${alert.bgColor} border border-current/20 rounded-lg p-4`}>
            <div className="flex gap-3">
              <Icon className={`w-5 h-5 ${alert.color} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <p className={`font-semibold text-sm ${alert.color}`}>{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.message}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
