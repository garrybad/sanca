"use client"

import { CheckCircle2, Users, TrendingUp } from "lucide-react"

interface ActivityEvent {
  id: number
  type: "contribution" | "payout" | "member_joined"
  title: string
  description: string
  amount?: string
  member?: string
  date: string
  icon: typeof CheckCircle2
  color: string
}

const mockActivity: ActivityEvent[] = [
  {
    id: 1,
    type: "contribution",
    title: "Contribution Received",
    description: "Mike Johnson contributed",
    amount: "$300",
    date: "Today",
    icon: CheckCircle2,
    color: "text-accent",
  },
  {
    id: 2,
    type: "payout",
    title: "Payout Completed",
    description: "Sarah Chen received payout",
    amount: "$1,500",
    date: "Feb 15",
    icon: TrendingUp,
    color: "text-accent",
  },
  {
    id: 3,
    type: "member_joined",
    title: "New Member Joined",
    description: "James Wilson joined the circle",
    member: "James Wilson",
    date: "Feb 1",
    icon: Users,
    color: "text-accent",
  },
]

export default function CircleActivity({ circleId }: { circleId: number }) {
  return (
    <div className="space-y-3">
      {mockActivity.map((event) => {
        const Icon = event.icon
        return (
          <div key={event.id} className="bg-card border border-border rounded-lg p-4 flex gap-4">
            <div className={`${event.color} mt-1 flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <p className="font-semibold text-foreground">{event.title}</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
              <p className="text-xs text-muted-foreground mt-2">{event.date}</p>
            </div>

            {event.amount && <p className="font-mono font-bold text-accent text-lg flex-shrink-0">{event.amount}</p>}
          </div>
        )
      })}
    </div>
  )
}
