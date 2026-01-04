"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, CheckCircle2, Clock } from "lucide-react"

const mockCircles = [
  {
    id: 1,
    name: "Community Builders Circle",
    members: 5,
    contribution: "$300",
    status: "active",
    progress: 60,
    nextMember: "You",
    nextDate: "Mar 15, 2025",
    myContributionStatus: "paid",
  },
  {
    id: 2,
    name: "Tech Friends Savings",
    members: 6,
    contribution: "$500",
    status: "active",
    progress: 30,
    nextMember: "Sarah",
    nextDate: "Feb 28, 2025",
    myContributionStatus: "paid",
  },
  {
    id: 3,
    name: "Local Business Network",
    members: 4,
    contribution: "$250",
    status: "active",
    progress: 75,
    nextMember: "Mike",
    nextDate: "Mar 22, 2025",
    myContributionStatus: "pending",
  },
]

export default function ActiveCirclesSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Active Circles</h2>
        <Link href="/circles">
          <Button variant="outline" size="sm" className="gap-1 bg-transparent">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {mockCircles.map((circle) => (
          <Link key={circle.id} href={`/circles/${circle.id}`}>
            <div className="bg-card border border-border rounded-lg p-6 hover:border-accent/50 hover:bg-card/80 transition-all cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg mb-1">{circle.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {circle.members} members
                    </span>
                    <span className="font-mono text-foreground">{circle.contribution}/month</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    Active
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Cycle Progress</span>
                  <span className="text-xs font-semibold text-foreground">{circle.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${circle.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Next Payout</p>
                  <p className="font-mono text-sm font-semibold text-foreground">{circle.nextMember}</p>
                  <p className="text-xs text-muted-foreground">{circle.nextDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Contribution</p>
                  <div className="flex items-center gap-2">
                    {circle.myContributionStatus === "paid" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="text-xs font-semibold text-accent">Paid</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-xs font-semibold text-yellow-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-xs text-muted-foreground mb-2">Actions</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
