"use client"

import { Button } from "@/components/ui/button"
import { Copy, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useAccount } from "wagmi"
import WalletStats from "@/components/wallet/wallet-stats"
import TransactionHistory from "@/components/wallet/transaction-history"
import { useUserStats } from "@/hooks/useUserStats"
import { Loader2 } from "lucide-react"
import { formatUSDC } from "@/lib/utils"

export default function ProfilePage() {
  const [copied, setCopied] = useState(false)
  const { address, isConnected } = useAccount()
  const { data: stats, isLoading: statsLoading } = useUserStats()

  const walletAddress = address || ""

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Get explorer URL based on chain
  const getExplorerUrl = (address: string) => {
    // Mantle Sepolia
    return `https://sepolia.mantlescan.xyz/address/${address}`
  }

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Wallet & Account</h1>
          <p className="text-muted-foreground mt-2">View your wallet details and transaction history</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">Please connect your wallet to view your profile</p>
        </div>
      </div>
    )
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyAddress} 
                className="flex-shrink-0 bg-transparent"
                disabled={!walletAddress}
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0 gap-2 bg-transparent" 
                asChild
                disabled={!walletAddress}
              >
                <a href={getExplorerUrl(walletAddress)} target="_blank" rel="noopener noreferrer">
                  View
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Contributed</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  ${stats?.totalContributed.toFixed(2) || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Received</p>
                <p className="text-2xl font-bold text-accent font-mono">
                  ${stats?.totalReceived.toFixed(2) || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Pending Payouts</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  ${stats?.pendingPayouts.toFixed(2) || "0.00"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Pools</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {stats?.totalPools || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Stats */}
      <WalletStats />

      {/* Transaction History */}
      <TransactionHistory />
    </div>
  )
}
