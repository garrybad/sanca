"use client";

import { CircleDollarSign, Droplet, type LucideIcon } from "lucide-react";
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
                <Image src="/logo/mantle-logo.png" alt="MNT" width={16} height={16} />
                {/* <Droplet /> */}
                <span>Faucet MNT</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>

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
                <CircleDollarSign />
                <span>Faucet USDC</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </Link>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
