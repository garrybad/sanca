"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CreateCircleDialog } from "@/components/circles/create-circle-dialog"

const mockCircles = [
  {
    id: 1,
    name: "Community Builders Circle",
    members: 5,
    contribution: "$300",
    status: "active",
    created: "Jan 2025",
    yourStatus: "member",
    progress: 60,
  },
  {
    id: 2,
    name: "Tech Friends Savings",
    members: 6,
    contribution: "$500",
    status: "active",
    created: "Dec 2024",
    yourStatus: "member",
    progress: 30,
  },
  {
    id: 3,
    name: "Local Business Network",
    members: 4,
    contribution: "$250",
    status: "active",
    created: "Nov 2024",
    yourStatus: "creator",
    progress: 75,
  },
  {
    id: 4,
    name: "Entrepreneurs Circle",
    members: 8,
    contribution: "$1000",
    status: "active",
    created: "Sep 2024",
    yourStatus: "pending",
    progress: 45,
  },
]

export default function CirclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredCircles = mockCircles.filter((circle) => {
    const matchesSearch = circle.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || circle.status === filterStatus
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Circles</h1>
          <p className="text-muted-foreground mt-2">Manage and explore your saving circles</p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-5 h-5" />
          Create Circle
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search circles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "completed"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status as any)}
              className={filterStatus !== status ? "bg-transparent" : ""}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Circles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCircles.map((circle) => (
          <Link key={circle.id} href={`/circles/${circle.id}`}>
            <div className="bg-card border border-border rounded-lg p-6 hover:border-accent/50 hover:shadow-lg transition-all h-full cursor-pointer flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-lg">{circle.name}</h3>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      circle.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {circle.status === "active" ? "Active" : "Completed"}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{circle.members}</span> members
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono font-semibold text-foreground">{circle.contribution}</span>/month
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Progress</span>
                    <span className="text-xs font-semibold text-foreground">{circle.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${circle.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Created {circle.created}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    circle.yourStatus === "creator"
                      ? "bg-primary/10 text-primary"
                      : circle.yourStatus === "pending"
                        ? "bg-yellow-600/10 text-yellow-600"
                        : "bg-accent/10 text-accent"
                  }`}
                >
                  {circle.yourStatus === "creator" ? "Creator" : circle.yourStatus === "pending" ? "Pending" : "Member"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCircles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No circles found matching your search</p>
          <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Your First Circle
          </Button>
        </div>
      )}

      <CreateCircleDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
    </div>
  )
}
