"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download } from "lucide-react"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: number
  type: "send" | "receive"
  circle: string
  member?: string
  amount: string
  date: string
  hash: string
  status: "completed" | "pending" | "failed"
}

const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: "send",
    circle: "Community Builders Circle",
    amount: "$300",
    date: "Today, 2:30 PM",
    hash: "0x7f3a...",
    status: "completed",
  },
  {
    id: 2,
    type: "receive",
    circle: "Tech Friends Savings",
    member: "Sarah Chen (Payout)",
    amount: "$2,500",
    date: "Yesterday, 11:00 AM",
    hash: "0x4b2e...",
    status: "completed",
  },
  {
    id: 3,
    type: "send",
    circle: "Local Business Network",
    amount: "$250",
    date: "Feb 13, 2:15 PM",
    hash: "0x9c4d...",
    status: "pending",
  },
  {
    id: 4,
    type: "send",
    circle: "Community Builders Circle",
    amount: "$300",
    date: "Feb 10, 1:45 PM",
    hash: "0x5a8f...",
    status: "completed",
  },
  {
    id: 5,
    type: "send",
    circle: "Tech Friends Savings",
    amount: "$500",
    date: "Feb 7, 3:20 PM",
    hash: "0x3e2c...",
    status: "completed",
  },
]

export default function TransactionHistory() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTransactions = mockTransactions.filter((tx) =>
    tx.circle.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-2.5 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      <div className="space-y-2">
        {filteredTransactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start gap-4 flex-1">
              <div
                className={`p-2 rounded-lg ${
                  tx.type === "send" ? "bg-foreground/10" : "bg-accent/10"
                } flex-shrink-0 mt-1`}
              >
                {tx.type === "send" ? (
                  <ArrowUpRight className="w-4 h-4 text-foreground" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-accent" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground truncate">{tx.circle}</p>
                  {/* {tx.member && <p className="text-xs text-muted-foreground">({tx.member})</p>} */}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      tx.status === "completed"
                        ? "bg-accent/10 text-accent"
                        : tx.status === "pending"
                          ? "bg-yellow-600/10 text-yellow-600"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {tx.status === "completed" ? "Completed" : tx.status === "pending" ? "Pending" : "Failed"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className={`font-mono font-bold ${tx.type === "send" ? "text-foreground" : "text-accent"}`}>
                {tx.type === "send" ? "-" : "+"}
                {tx.amount}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{tx.hash}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No transactions found</p>
        </div>
      )}
    </div>
  )
}
