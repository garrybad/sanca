"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export default function OnboardingStep5({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <div className="mb-4 flex items-center justify-center">
          <Sparkles className="size-12" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">You're Ready!</h1>
        <p className="text-lg text-muted-foreground">You now understand how Sanca circles work</p>
      </div>

      <div className="bg-background rounded-lg p-8 border border-border space-y-4 mt-8">
        <h3 className="font-semibold text-foreground">What's Next?</h3>
        <div className="space-y-3 text-sm text-muted-foreground text-left">
          <div className="flex gap-3">
            <span className="text-accent font-bold">1</span>
            <span>Explore existing circles and find one that matches your goals</span>
          </div>
          <div className="flex gap-3">
            <span className="text-accent font-bold">2</span>
            <span>Create your own circle with friends or community members</span>
          </div>
          <div className="flex gap-3">
            <span className="text-accent font-bold">3</span>
            <span>Track contributions and payouts in real-time on your dashboard</span>
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button onClick={onComplete} size="lg" className="gap-2 px-8">
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
