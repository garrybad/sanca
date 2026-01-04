"use client"

import { Calendar } from "lucide-react"

const mockPayouts = [
  {
    id: 1,
    circleId: 1,
    circleName: "Community Builders",
    amount: "$1,500",
    date: "Mar 15, 2025",
    daysAway: 42,
  },
  {
    id: 2,
    circleId: 2,
    circleName: "Tech Friends",
    amount: "$3,000",
    date: "May 02, 2025",
    daysAway: 89,
  },
]

export default function UpcomingPayouts() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-accent" />
        Your Payouts
      </h3>

      <div className="space-y-4">
        {mockPayouts.map((payout) => (
          <div key={payout.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
            <p className="text-sm font-semibold text-foreground mb-1">{payout.circleName}</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-bold text-accent font-mono">{payout.amount}</span>
              <span className="text-xs text-muted-foreground">{payout.daysAway} days</span>
            </div>
            <p className="text-xs text-muted-foreground">{payout.date}</p>
          </div>
        ))}
      </div>

      {mockPayouts.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No payouts scheduled yet. Join or create a circle to get started.
        </div>
      )}
    </div>
  )
}
