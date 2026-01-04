"use client"

import { useTheme } from "@/components/theme-provider";
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-transparent flex items-center justify-center">
              {/* <span className="text-accent-foreground font-bold text-sm">R</span> */}

              <Image src="/logo/sanca-logo.svg" className={theme === "dark" ? "" : "invert"} alt="Sanca" width={32} height={32} />
            </div>
            <span className="font-semibold text-foreground">Sanca</span>
          </Link>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
