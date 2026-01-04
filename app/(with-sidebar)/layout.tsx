"use client";

import type React from "react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
//   const router = useRouter();

//   useEffect(() => {
//     // Check if user is authenticated
//     const user = localStorage.getItem("user");
//     if (!user) {
//       router.push("/auth/login");
//     }
//   }, [router]);

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
