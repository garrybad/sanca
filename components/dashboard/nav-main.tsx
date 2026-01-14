"use client";

import { CircleDollarSign, Droplet, type LucideIcon, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { useFaucetUSDC } from "@/hooks/useFaucetUSDC";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useEffect } from "react";
import { useTheme } from "../theme-provider";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { address, isConnected } = useAccount();
  const { faucet, isPending, isConfirming, isSuccess, error, hash } = useFaucetUSDC();
  const { theme } = useTheme();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Successfully minted 1,000 USDC!");
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to mint USDC. Please try again later.");
    }
  }, [error]);

  const handleFaucet = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      await faucet();
      toast.info("Transaction submitted. Waiting for confirmation...");
    } catch (err: any) {
      toast.error(err.message || "Failed to mint USDC");
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            // const isActive =
            //   item.url === "/dashboard"
            //     ? pathname === item.url
            //     : pathname === item.url ||
            //       pathname.startsWith(item.url + "/");
            return (
              <Link
                href={item.url}
                key={item.title}
                onClick={() => {
                  if (isMobile) {
                    setOpenMobile(false);
                  }
                }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={`cursor-pointer ${
                      pathname.startsWith(item.url)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : ""
                    }`}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
            );
          })}
          <Link
            href="https://faucet.sepolia.mantle.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (isMobile) {
                setOpenMobile(false);
              }
            }}
          >
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Faucet" className="cursor-pointer">
                <Image src="/logo/mantle-logo.svg" className={theme === "dark" ? "invert" : ""} alt="MNT" width={16} height={16} />
                {/* <Droplet /> */}
                <span>Faucet MNT</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Faucet USDC"
              className="cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                handleFaucet();
                if (isMobile) {
                  setOpenMobile(false);
                }
              }}
              disabled={isPending || isConfirming || !isConnected}
            >
              {isPending || isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CircleDollarSign />
              )}
              <span>Faucet USDC</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
