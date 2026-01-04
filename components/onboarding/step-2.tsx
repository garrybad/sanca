import { ChartColumnBig, Check, DollarSign, Lightbulb, RefreshCw } from "lucide-react";

export default function OnboardingStep2() {
  const phases = [
    {
      title: "Contribution",
      description: "Every member contributes a fixed amount each cycle",
      icon: ChartColumnBig,
    },
    {
      title: "Pool",
      description: "All contributions combine into the circle fund",
      icon: DollarSign,
    },
    {
      title: "Rotation",
      description: "Fund is distributed one member at a time",
      icon: RefreshCw,
    },
    {
      title: "Payout",
      description: "One member receives the entire pool each round",
      icon: Check,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">
          How a Circle Works
        </h1>
        <p className="text-lg text-muted-foreground">
          Understanding the cycle: Contribution → Pool → Rotation → Payout
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
        {phases.map((phase, idx) => {
          const Icon = phase.icon;
          return (
            <div
              key={idx}
              className="bg-background rounded-lg p-6 border border-border"
            >
              <div className="mb-3">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {phase.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {phase.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-accent/10 border border-accent/30 rounded-lg p-6 mt-8">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
          <span className="text-accent">
            <Lightbulb className="size-7" />
          </span>
          Example: 5-Member Circle
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Circle Size: 5 members</p>
          <p>• Monthly Contribution: $500 per member</p>
          <p>• Total Monthly Pool: $2,500</p>
          <p>• Each member receives $2,500 once every 5 months</p>
          <p>• Total commitment: 5 months to receive your payout</p>
        </div>
      </div>
    </div>
  );
}
