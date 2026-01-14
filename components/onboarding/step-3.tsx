export default function OnboardingStep3() {
  const responsibilities = [
    {
      title: "Make Regular Contributions",
      description: "Contribute the agreed amount every cycle without fail",
      commitment: "Essential",
    },
    {
      title: "Participate in Decisions",
      description: "Be present for circle meetings and voting on important matters",
      commitment: "Required",
    },
    {
      title: "Maintain Trust",
      description: "Be honest and transparent. Your reputation is your credit history",
      commitment: "Essential",
    },
  ]

  const rules = [
    "All members must contribute on time",
    "No dropping out mid-cycle without serious cause",
    "Fair rotation order - typically determined by lottery or agreement",
    "Disputes resolved through circle voting",
    "New members can only join at the start of a cycle",
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Your Role in the Circle</h1>
        <p className="text-lg text-muted-foreground">Understand what's expected of you as a member</p>
      </div>

      <div className="space-y-4 pt-6">
        <div>
          <h3 className="font-semibold text-foreground mb-4">Your Responsibilities</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {responsibilities.map((resp, idx) => (
              <div key={idx} className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground text-sm">{resp.title}</h4>
                  <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-1 rounded">
                    {resp.commitment}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{resp.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-background rounded-lg p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-4">Circle Rules & Fairness</h3>
          <ul className="space-y-3">
            {rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="text-accent font-bold mt-1">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
