"use client"

import { CheckCircle2, AlertCircle } from "lucide-react"

interface Member {
  id: number
  name: string
  joined: string
  status: "active" | "pending" | "inactive"
  contribution: "paid" | "pending" | "overdue"
  role: "creator" | "member"
}

const mockMembers: Member[] = [
  {
    id: 1,
    name: "You",
    joined: "Jan 2025",
    status: "active",
    contribution: "paid",
    role: "member",
  },
  {
    id: 2,
    name: "Sarah Chen",
    joined: "Jan 2025",
    status: "active",
    contribution: "paid",
    role: "creator",
  },
  {
    id: 3,
    name: "Mike Johnson",
    joined: "Jan 2025",
    status: "active",
    contribution: "paid",
    role: "member",
  },
  {
    id: 4,
    name: "Priya Patel",
    joined: "Jan 2025",
    status: "active",
    contribution: "pending",
    role: "member",
  },
  {
    id: 5,
    name: "James Wilson",
    joined: "Feb 2025",
    status: "active",
    contribution: "overdue",
    role: "member",
  },
]

export default function CircleMembers({ circleId }: { circleId: number }) {
  return (
    <div className="space-y-3">
      {mockMembers.map((member) => (
        <div key={member.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{member.name}</p>
              {member.role === "creator" && (
                <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/10 text-primary">Creator</span>
              )}
              {member.status === "pending" && (
                <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-600/10 text-yellow-600">
                  Pending
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Joined {member.joined}</p>
          </div>

          <div className="flex items-center gap-3">
            {member.contribution === "paid" && (
              <div className="flex items-center gap-1 text-accent">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-semibold">Paid</span>
              </div>
            )}
            {member.contribution === "pending" && (
              <div className="flex items-center gap-1 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">Pending</span>
              </div>
            )}
            {member.contribution === "overdue" && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">Overdue</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
