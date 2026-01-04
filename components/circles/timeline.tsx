"use client"

import { CheckCircle2, Clock } from "lucide-react"

interface TimelineEvent {
  month: number
  member: string
  amount: string
  status: "completed" | "current" | "upcoming"
  date: string
}

const mockTimeline: TimelineEvent[] = [
  { month: 1, member: "Sarah", amount: "$1,500", status: "completed", date: "Jan 15, 2025" },
  { month: 2, member: "Mike", amount: "$1,500", status: "completed", date: "Feb 15, 2025" },
  { month: 3, member: "You", amount: "$1,500", status: "current", date: "Mar 15, 2025" },
  { month: 4, member: "Priya", amount: "$1,500", status: "upcoming", date: "Apr 15, 2025" },
  { month: 5, member: "James", amount: "$1,500", status: "upcoming", date: "May 15, 2025" },
]

export default function CircleTimeline({ circleId }: { circleId: number }) {
  return (
    <div>
      {mockTimeline.map((event, idx) => (
        <div
          key={idx}
          className={`relative pl-8 pb-8 ${idx !== mockTimeline.length - 1 ? "border-l-2" : ""} ${
            event.status === "completed"
              ? "border-accent"
              : event.status === "current"
                ? "border-accent"
                : "border-border"
          }`}
        >
          {/* Timeline Dot */}
          <div
            className={`absolute ${idx !== mockTimeline.length - 1 ? "left-[-9px]" : "left-[-7px]"} top-0 w-4 h-4 rounded-full border-2 ${
              event.status === "completed"
                ? "bg-accent border-accent"
                : event.status === "current"
                  ? "border-accent bg-background"
                  : "border-border bg-background"
            }`}
          ></div>

          {/* Event Card */}
          <div
            className={`bg-card border rounded-lg p-4 ${
              event.status === "current" ? "border-accent/50 shadow-lg" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                {event.status === "completed" && <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-1" />}
                {event.status === "current" && (
                  <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-1 animate-pulse" />
                )}
                {event.status === "upcoming" && <div className="w-5 h-5 flex-shrink-0"></div>}

                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    Month {event.month}: <span className="text-accent">{event.member}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                </div>
              </div>
              <span className="font-mono font-bold text-accent text-lg">{event.amount}</span>
            </div>

            {event.status === "current" && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-accent font-semibold">YOUR PAYOUT</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
