"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  Lock,
  Moon,
  Sun,
  Check,
  Infinity,
  DollarSign,
  InfinityIcon,
  LockKeyhole,
  ChartColumnBig,
  Handshake,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import Image from "next/image";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

// Reusable button component that handles wallet connection or redirect
function ActionButton({
  children,
  variant = "default",
  size = "lg",
  className = "",
  redirectTo = "/circles",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { isConnected } = useAccount();

  return (
    <ConnectButton.Custom>
      {({ openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== "loading";

        const handleClick = (e: React.MouseEvent) => {
          e.preventDefault();
          if (ready && isConnected) {
            router.push(redirectTo);
          } else if (ready && openConnectModal) {
            openConnectModal();
          }
        };

        return (
          <Button
            size={size}
            variant={variant}
            className={className}
            onClick={handleClick}
          >
            {children}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { isOnboarded, isReady: onboardingReady } = useOnboardingStatus();


  // Store wallet address when connected (but don't auto-redirect)
  useEffect(() => {
    if (isConnected && address) {
      localStorage.setItem("walletAddress", address);
    }
  }, [isConnected, address]);

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center h-16">
              <Link href="/">
                <div className="flex items-center gap-2 cursor-pointer">
                  <div className="w-8 h-8 bg-transparent flex items-center justify-center">
                    {mounted ? (
                      <Image
                        src="/logo/sanca-logo.svg"
                        className={theme === "dark" ? "" : "invert"}
                        alt="Sanca"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <Image
                        src="/logo/sanca-logo.svg"
                        className=""
                        alt="Sanca"
                        width={32}
                        height={32}
                      />
                    )}
                  </div>
                  <span className="font-semibold text-foreground">Sanca</span>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="cursor-pointer p-2 rounded-lg border border-border hover:bg-card transition-colors"
                  aria-label="Toggle theme"
                >
                  {mounted && theme === "dark" ? (
                    <Sun className="w-4 h-4 text-foreground" />
                  ) : (
                    <Moon className="w-4 h-4 text-foreground" />
                  )}
                </button>
                {/* <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition">
                Log In
              </Link> */}
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                  }) => {
                    const ready = mounted && authenticationStatus !== "loading";
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus ||
                        authenticationStatus === "authenticated");

                    return (
                      <div
                        {...(!ready && {
                          "aria-hidden": true,
                          style: {
                            opacity: 0,
                            pointerEvents: "none",
                            userSelect: "none",
                          },
                        })}
                      >
                        {(() => {
                          if (!connected) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={openConnectModal}
                              >
                                Connect Wallet
                              </Button>
                            );
                          }

                          if (chain.unsupported) {
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={openChainModal}
                              >
                                Wrong network
                              </Button>
                            );
                          }

                          return (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={openAccountModal}
                            >
                              {account.displayName}
                              {account.displayBalance
                                ? ` (${account.displayBalance})`
                                : ""}
                            </Button>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
        linear-gradient(to right, rgba(148, 163, 184, 0.25) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(148, 163, 184, 0.25) 1px, transparent 1px)
      `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 0",
            maskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
            WebkitMaskImage: `
        repeating-linear-gradient(
          to right,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        ),
        repeating-linear-gradient(
          to bottom,
          black 0px,
          black 3px,
          transparent 3px,
          transparent 8px
        )
      `,
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />

        <div className="max-w-6xl mx-auto relative w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Web3 Savings Revolution
                  </span>
                </div>
                <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight">
                  Save Together,
                  <br />
                  <span className="text-accent">Win Together</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Join trusted circles for transparent rotating savings and
                  credit. Manage funds with your community, no middleman needed.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <ActionButton size="lg" className="gap-2">
                  Create a Circle
                  <ArrowRight className="w-4 h-4" />
                </ActionButton>
                {/* <ActionButton size="lg" variant="outline">
                  Join Circle
                </ActionButton> */}
              </div>

              {/* <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold text-foreground"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,500+</span>{" "}
                  members saving together
                </p>
              </div> */}
            </div>

            {/* Hero Visual */}
            <div className="relative hidden lg:flex items-center justify-center h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl"></div>
              <div className="relative space-y-4">
                <div className="bg-card border border-border rounded-lg p-6 space-y-3 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Circle Fund
                      </p>
                      <p className="text-2xl font-mono font-bold text-foreground">
                        $15,000
                      </p>
                    </div>
                    <div className="px-2 py-1 rounded bg-accent/10 text-accent text-xs font-semibold">
                      Active
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      Next Payout
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      March 15, 2025
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Sanca Works */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              How Sanca Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A fair and transparent system where everyone contributes and
              receives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                title: "Create or Join",
                description:
                  "Form a circle with trusted members or join an existing one",
                icon: Users,
              },
              {
                step: 2,
                title: "Contribute",
                description:
                  "Regular contributions pool together for the group fund",
                icon: TrendingUp,
              },
              {
                step: 3,
                title: "Rotate",
                description: "Each member receives the full fund in their turn",
                icon: Lock,
              },
              {
                step: 4,
                title: "Complete",
                description:
                  "When all members receive their payout, the cycle ends",
                icon: CheckCircle2,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="group">
                  <div className="bg-background border border-border rounded-lg p-6 h-full hover:border-accent/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-accent" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <p className="text-xs font-semibold text-accent uppercase tracking-wider">
                          Step {item.step}
                        </p>
                        <h3 className="font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="why-choose-sanca" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              Why Choose Sanca Circle
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for transparency, fairness, and financial growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Check,
                title: "Transparent Tracking",
                description:
                  "Every transaction is recorded and visible to all members. Real-time updates on contributions and payouts.",
              },
              {
                icon: InfinityIcon,
                title: "Fair Rotation",
                description:
                  "Everyone gets an equal turn to receive the full pool. No discrimination, no favoritism.",
              },
              {
                icon: DollarSign,
                title: "No Middleman",
                description:
                  "Direct peer-to-peer savings. Keep more of your money without intermediaries taking cuts.",
              },
              {
                icon: LockKeyhole,
                title: "Secure & Trustless",
                description:
                  "Web3-powered smart contracts ensure enforceability. Your funds are protected.",
              },
              {
                icon: ChartColumnBig,
                title: "Financial Inclusion",
                description:
                  "Access to credit without traditional banking requirements. Perfect for underserved communities.",
              },
              {
                icon: Handshake,
                title: "Community Driven",
                description:
                  "Join groups you trust. Build relationships while building wealth together.",
              },
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="bg-card border border-border rounded-lg p-6 hover:border-accent/50 transition-colors"
                >
                  <div className="mb-4">
                    <Icon className="size-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6 mb-12">
            <h2 className="text-4xl font-bold text-foreground">
              See It In Action
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience how a Sanca circle works with our interactive demo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: "Active Circles",
                value: "847",
                change: "+12% this month",
              },
              { label: "Total Funds", value: "$2.3M", change: "In rotation" },
              { label: "Members", value: "12,500+", change: "Worldwide" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-background border border-border rounded-lg p-6 text-center"
              >
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-accent font-mono mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section id="faqs" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Find answers to common questions about Sanca circles
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                question: "What is a Sanca circle?",
                answer:
                  "A Sanca is a trusted group where members contribute regular amounts to a pool. Each member takes turns receiving the entire pool amount, rotating until everyone has received their turn. It's a transparent, fair way to save and access credit without traditional banking middlemen.",
              },
              {
                question: "How do I create a circle?",
                answer:
                  "Log into your account and click 'Create a Circle' from your dashboard. You'll set the contribution amount, frequency, number of members, and invite them to join. Once all members confirm, the circle begins its rotation schedule.",
              },
              {
                question: "Can I join multiple circles?",
                answer:
                  "Yes, you can be a member of multiple circles simultaneously. Each circle operates independently, so you can manage different contribution amounts and schedules across multiple groups. Just ensure you have the capacity to meet all contribution obligations.",
              },
              {
                question: "What happens if someone doesn't contribute?",
                answer:
                  "Sanca circles rely on member trust and accountability. All contributions and member status are transparent on the blockchain. Our platform includes default management features and dispute resolution mechanisms to ensure fairness. Serious defaulters can be removed by circle administrators.",
              },
              {
                question: "How are payouts scheduled?",
                answer:
                  "Payouts are determined by the circle rotation schedule. Members are assigned a payout order before the circle starts. When it's your turn, you receive the full pool amount from that cycle's contributions. The next member then receives their turn in the predetermined order.",
              },
              {
                question: "Is my money secure?",
                answer:
                  "Yes. Sanca Circle uses Web3 smart contracts to secure funds. All transactions are recorded on the blockchain, making them immutable and transparent. Your funds are held in secure wallets that only release payments according to the circle's predetermined schedule.",
              },
              {
                question: "What fees does Sanca Circle charge?",
                answer:
                  "Sanca Circle operates with minimal fees. We charge a small percentage on successful payouts (typically 1-2%) to maintain the platform and provide customer support. This is significantly less than traditional financial institutions.",
              },
              {
                question: "Can I leave a circle?",
                answer:
                  "You can request to leave a circle, but it depends on the circle's stage. If the circle hasn't started or you haven't received your payout yet, there may be financial consequences or restrictions. Check your circle's specific rules for early withdrawal policies.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group bg-background border border-border rounded-lg transition-colors hover:border-accent/50"
              >
                <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-foreground select-none">
                  <span>{faq.question}</span>
                  <span className="transition-transform group-open:rotate-180">
                    {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg> */}
                    <ChevronDown className="size-5" />
                  </span>
                </summary>
                <div className="p-6 text-muted-foreground text-sm border-t border-border">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-foreground">
              Ready to Join?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start saving with your community today. Create a new circle or
              join an existing one.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ActionButton size="lg" className="gap-2">
              Create a Circle
              <ArrowRight className="w-4 h-4" />
            </ActionButton>
            <ActionButton size="lg" variant="outline">
              Browse Circles
            </ActionButton>
          </div>

          {/* <p className="text-sm text-muted-foreground">
            Try as a demo user first to explore • No signup required to browse
          </p> */}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-transparent flex items-center justify-center">
                  {mounted ? (
                    <Image
                      src="/logo/sanca-logo.svg"
                      className={theme === "dark" ? "" : "invert"}
                      alt="Sanca"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <Image
                      src="/logo/sanca-logo.svg"
                      className=""
                      alt="Sanca"
                      width={32}
                      height={32}
                    />
                  )}
                </div>
                <span className="font-semibold text-foreground">Sanca</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transparent rotating savings for everyone.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: [
                  {
                    label: "How It Works",
                    path: "#how-it-works",
                  },
                  {
                    label: "Why Choose Sanca",
                    path: "#why-choose-sanca",
                  },
                  {
                    label: "FAQs",
                    path: "#faqs",
                  },
                ],
              },
              // { title: "Learn", links: ["Documentation", "Blog", "FAQs"] },
              // { title: "Legal", links: ["Terms", "Privacy", "Contact"] },
            ].map((column) => (
              <div key={column.title} className="text-start md:text-end">
                <h4 className="font-semibold text-foreground mb-4 text-sm">
                  {column.title}
                </h4>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.path}>
                      <Link
                        href={link.path}
                        className="text-sm text-muted-foreground hover:text-foreground transition"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2026 Sanca Circle. All rights reserved.
              </p>
              <div className="flex gap-6">
                {[
                  {
                    id: 1,
                    name: "Twitter",
                    url: "https://x.com/",
                  },
                  {
                    id: 2,
                    name: "GitHub",
                    url: "https://github.com/",
                  },
                ].map((social) => (
                  <Link
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    {social.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
