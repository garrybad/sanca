export default function OnboardingStep1() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Welcome to Sanca</h1>
        <p className="text-lg text-muted-foreground">Let's get you started with transparent community savings</p>
      </div>

      <div className="space-y-4 pt-6">
        <div className="bg-background rounded-lg p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-2">What is Sanca?</h3>
          <p className="text-sm text-muted-foreground">
            A Rotating Savings and Credit Association is a group of trusted individuals who pool money together
            regularly. Each cycle, one member receives the full fund. It's a proven system for building wealth through
            community.
          </p>
        </div>

        <div className="bg-background rounded-lg p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-2">Why Sanca?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-3">
              <span className="text-accent mt-1">✓</span>
              <span>Access credit without traditional banking requirements</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent mt-1">✓</span>
              <span>Complete transparency in all transactions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-accent mt-1">✓</span>
              <span>Fair rotation ensures everyone gets their turn</span>
            </li>
          </ul>
        </div>

        <div className="bg-background rounded-lg p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-2">What's Next?</h3>
          <p className="text-sm text-muted-foreground">
            We'll walk you through how circles work, explain your responsibilities, show you a live example, and then
            you can jump into your first circle or create one.
          </p>
        </div>
      </div>
    </div>
  )
}
