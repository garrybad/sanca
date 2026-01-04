"use client"

import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { useState } from "react"
import WalletStats from "@/components/wallet/wallet-stats"
import TransactionHistory from "@/components/wallet/transaction-history"

export default function ProfilePage() {
  const [copied, setCopied] = useState(false)

  const walletAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f42000"

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground">Wallet & Account</h1>
        <p className="text-muted-foreground mt-2">View your wallet details and transaction history</p>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-br from-card to-card border border-border rounded-lg p-8">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Wallet Address</p>
            <div className="flex items-center gap-3">
              <code className="font-mono text-sm font-semibold text-foreground bg-background rounded px-3 py-2 flex-1 overflow-x-auto">
                {walletAddress}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyAddress} className="flex-shrink-0 bg-transparent">
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" className="flex-shrink-0 gap-2 bg-transparent" asChild>
                <a href={`https://etherscan.io/address/${walletAddress}`} target="_blank" rel="noopener noreferrer">
                  View
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Balance</p>
              <p className="text-2xl font-bold text-foreground font-mono">$0.00</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Received</p>
              <p className="text-2xl font-bold text-accent font-mono">$1,200</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Sent</p>
              <p className="text-2xl font-bold text-foreground font-mono">$2,400</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Transactions</p>
              <p className="text-2xl font-bold text-foreground font-mono">18</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Stats */}
      <WalletStats />

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  )
}
