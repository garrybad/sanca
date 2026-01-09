"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const [hasChecked, setHasChecked] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If wallet is already connected, mark as checked immediately and clear any pending timeout
    if (isConnected && address) {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      setHasChecked(true);
      return;
    }

    // If already checked and still not connected, redirect
    if (hasChecked && (!isConnected || !address)) {
      router.push("/");
      return;
    }

    // If not checked yet, set up timeout to wait for wagmi to reconnect
    if (!hasChecked) {
      // Clear any existing timeout
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      // Check if there's a stored wallet address (user was previously connected)
      const storedAddress = localStorage.getItem("walletAddress");
      const wasPreviouslyConnected = !!storedAddress;

      // If user was previously connected, give wagmi more time to reconnect (2 seconds)
      // Otherwise, check quickly (user was never connected)
      const timeoutDuration = wasPreviouslyConnected ? 2000 : 500;

      checkTimeoutRef.current = setTimeout(() => {
        setHasChecked(true);
        
        // Only redirect if wallet is still not connected after the timeout
        if (!isConnected || !address) {
          router.push("/");
        }
      }, timeoutDuration);
    }

    // Cleanup timeout on unmount
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isConnected, address, router, hasChecked]);

  // Show loading state while waiting for wagmi to reconnect
  if (!hasChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render content if wallet is not connected (after checking)
  if (!isConnected || !address) {
    return null;
  }

  return (
    // <div className="min-h-screen bg-background flex">
    //   <DashboardSidebar />
    //   <main className="flex-1 overflow-auto">
    //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    //   </main>
    // </div>
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="p-4 sm:p-6">{children}</div>

        {/* <OnboardingRoot /> */}
      </SidebarInset>
    </SidebarProvider>
  );
}
