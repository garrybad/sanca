"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, TrendingUp, Calendar } from "lucide-react"
import CircleDetailTabs from "@/components/circles/detail-tabs"
import { useParams } from "next/navigation"

export default function CircleDetailPage() {
//   const circleId = Number.parseInt(params.id)
  const { id } = useParams<{ id: string }>();
  const circleId = Number.parseInt(id);

  // Mock circle data
  const circle = {
    id: circleId,
    name: "Community Builders Circle",
    description: "A community of locals saving together for financial growth",
    status: "active",
    members: 5,
    contribution: "$300",
    totalFund: "$1,500",
    cycleDuration: "5 months",
    nextPayout: "Mar 15, 2025",
    nextPayoutMember: "You",
    progress: 60,
    created: "January 2025",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <Link href="/circles">
          <Button variant="ghost" size="sm" className="gap-1 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Circles
          </Button>
        </Link>
      </div>

      {/* Circle Info */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground mb-2">{circle.name}</h1>
            <p className="text-lg text-muted-foreground">{circle.description}</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent mt-4 md:mt-0 w-fit">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-sm font-semibold">Active</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Members</p>
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              {circle.members}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Monthly Contribution</p>
            <p className="text-2xl font-bold text-foreground font-mono">{circle.contribution}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Fund</p>
            <p className="text-2xl font-bold text-accent font-mono flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {circle.totalFund}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Next Payout</p>
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
            </p>
            <p className="text-sm text-muted-foreground">{circle.nextPayout}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Cycle Progress</h3>
            <span className="text-sm font-semibold text-foreground">{circle.progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div className="bg-accent h-3 rounded-full transition-all" style={{ width: `${circle.progress}%` }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">3 of 5 cycles completed</p>
        </div>
      </div>

      {/* Tabs */}
      <CircleDetailTabs circleId={circleId} />
    </div>
  )
}
