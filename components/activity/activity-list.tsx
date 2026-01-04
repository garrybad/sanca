"use client"

import { CheckCircle2, TrendingUp, Users, AlertCircle, Clock } from "lucide-react"

interface Activity {
  id: number
  type: "contribution" | "payout" | "member_joined" | "cycle_completed" | "reminder"
  title: string
  description: string
  circle: string
  member?: string
  amount?: string
  date: string
  timestamp: Date
  icon: typeof CheckCircle2
  color: string
  bgColor: string
}

const mockActivities: Activity[] = [
  {
    id: 1,
    type: "contribution",
    title: "Contribution Received",
    description: "Your contribution of $300 was received",
    circle: "Community Builders Circle",
    amount: "$300",
    date: "Today at 2:30 PM",
    timestamp: new Date(),
    icon: CheckCircle2,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: 2,
    type: "payout",
    title: "Payout Completed",
    description: "Sarah Chen received her payout",
    circle: "Tech Friends Savings",
    member: "Sarah Chen",
    amount: "$2,500",
    date: "Yesterday at 11:00 AM",
    timestamp: new Date(Date.now() - 86400000),
    icon: TrendingUp,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: 3,
    type: "reminder",
    title: "Contribution Due",
    description: "Your contribution is due in 3 days",
    circle: "Community Builders Circle",
    amount: "$300",
    date: "2 days ago",
    timestamp: new Date(Date.now() - 172800000),
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-600/10",
  },
  {
    id: 4,
    type: "member_joined",
    title: "New Member Joined",
    description: "James Wilson joined the circle",
    circle: "Local Business Network",
    member: "James Wilson",
    date: "3 days ago",
    timestamp: new Date(Date.now() - 259200000),
    icon: Users,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: 5,
    type: "contribution",
    title: "Contribution Received",
    description: "Your contribution of $500 was received",
    circle: "Tech Friends Savings",
    amount: "$500",
    date: "Feb 10, 2025",
    timestamp: new Date("2025-02-10"),
    icon: CheckCircle2,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    id: 6,
    type: "cycle_completed",
    title: "Cycle Completed",
    description: "The 5-month cycle has been completed",
    circle: "Community Builders Circle",
    date: "Jan 15, 2025",
    timestamp: new Date("2025-01-15"),
    icon: AlertCircle,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
]

interface ActivityListProps {
  searchQuery: string
  filterType: "all" | "contributions" | "payouts" | "cycles"
}

export default function ActivityList({ searchQuery, filterType }: ActivityListProps) {
  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch = activity.circle.toLowerCase().includes(searchQuery.toLowerCase())

    let matchesFilter = true
    if (filterType === "contributions") {
      matchesFilter = activity.type === "contribution"
    } else if (filterType === "payouts") {
      matchesFilter = activity.type === "payout"
    } else if (filterType === "cycles") {
      matchesFilter = activity.type === "cycle_completed" || activity.type === "member_joined"
    }

    return matchesSearch && matchesFilter
  })

  // Group by date
  const groupedActivities = filteredActivities.reduce(
    (acc, activity) => {
      const dateKey = activity.timestamp.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: activity.timestamp.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      })

      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(activity)
      return acc
    },
    {} as Record<string, Activity[]>,
  )

  return (
    <div className="space-y-8">
      {Object.entries(groupedActivities).map(([dateGroup, activities]) => (
        <div key={dateGroup} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">{dateGroup}</h3>

          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div
                key={activity.id}
                className={`${activity.bgColor} border border-current/20 rounded-lg p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex gap-4">
                  <Icon className={`w-5 h-5 ${activity.color} flex-shrink-0 mt-1`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-semibold text-sm ${activity.color}`}>{activity.title}</h4>
                      {activity.amount && (
                        <span className="font-mono font-bold text-accent text-sm flex-shrink-0">{activity.amount}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">{activity.circle}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No activity matching your search</p>
        </div>
      )}
    </div>
  )
}
