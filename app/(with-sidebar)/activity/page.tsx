"use client"

import { Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import ActivityList from "@/components/activity/activity-list"

type FilterType = "all" | "contributions" | "payouts" | "cycles"

function ActivityContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>("all")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Activity & History</h1>
        <p className="text-muted-foreground mt-2">Track all your contributions, payouts, and circle events</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search circles or members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all" as const, label: "All Activity" },
            { id: "contributions" as const, label: "Contributions" },
            { id: "payouts" as const, label: "Payouts" },
            { id: "cycles" as const, label: "Cycle Events" },
          ].map((filter) => (
            <Button
              key={filter.id}
              variant={filterType === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(filter.id)}
              className={filterType !== filter.id ? "bg-transparent flex-shrink-0" : "flex-shrink-0"}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <ActivityList searchQuery={searchQuery} filterType={filterType} />
    </div>
  )
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActivityContent />
    </Suspense>
  )
}
