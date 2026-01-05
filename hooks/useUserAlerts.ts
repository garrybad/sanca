"use client";

import { useQuery } from "@tanstack/react-query";
import { queryPonder, type Pool, type Member, type Cycle, type CycleContribution } from "@/lib/ponder";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";

export interface UserAlert {
  id: string;
  type: "reminder" | "success" | "warning";
  title: string;
  message: string;
  poolId?: string;
}

/**
 * Hook untuk get user alerts (reminders, notifications, etc)
 */
export function useUserAlerts() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["userAlerts", address],
    queryFn: async () => {
      if (!address) return [];

      const alerts: UserAlert[] = [];

      // Get all pools
      const poolsData = await queryPonder<{
        poolss: { items: Pool[] };
      }>(`
        query GetAllPools {
          poolss {
            items {
              id
              name
              state
              contributionPerPeriod
              cycleStartTime
              periodDuration
              currentCycle
              maxMembers
            }
          }
        }
      `);

      // Get all members
      const membersData = await queryPonder<{
        memberss: { items: Member[] };
      }>(`
        query GetAllMembers {
          memberss {
            items {
              id
              poolId
              address
            }
          }
        }
      `);

      // Get all cycles
      const cyclesData = await queryPonder<{
        cycless: { items: Cycle[] };
      }>(`
        query GetAllCycles {
          cycless {
            items {
              id
              poolId
              index
              winner
            }
          }
        }
      `);

      // Get all cycle contributions
      const contributionsData = await queryPonder<{
        cycleContributionss: { items: CycleContribution[] };
      }>(`
        query GetAllContributions {
          cycleContributionss {
            items {
              id
              poolId
              cycleIndex
              memberAddress
              isLiquidated
            }
          }
        }
      `);

      // Filter user's data
      const userMembers = membersData.memberss.items.filter(
        (m) => m.address.toLowerCase() === address.toLowerCase()
      );
      const userPoolIds = new Set(userMembers.map((m) => m.poolId.toLowerCase()));

      const userPools = poolsData.poolss.items.filter((p) =>
        userPoolIds.has(p.id.toLowerCase())
      );
      const userCycles = cyclesData.cycless.items.filter((c) =>
        userPoolIds.has(c.poolId.toLowerCase())
      );
      const userContributions = contributionsData.cycleContributionss.items.filter(
        (cc) => cc.memberAddress.toLowerCase() === address.toLowerCase()
      );

      // Check for contribution reminders (active pools where user hasn't contributed to current cycle)
      userPools.forEach((pool) => {
        if (pool.state === "Active" && Number(pool.cycleStartTime) > 0) {
          const currentCycleContributions = userContributions.filter(
            (c) =>
              c.poolId.toLowerCase() === pool.id.toLowerCase() &&
              c.cycleIndex === pool.currentCycle &&
              !c.isLiquidated
          );

          if (currentCycleContributions.length === 0) {
            // Check if cycle is ending soon (within 3 days)
            const endTime = Number(pool.cycleStartTime) + Number(pool.periodDuration);
            const now = Math.floor(Date.now() / 1000);
            const timeRemaining = endTime - now;
            const daysRemaining = timeRemaining / 86400;

            if (daysRemaining > 0 && daysRemaining <= 3) {
              const amount = (Number(pool.contributionPerPeriod) / 1e6).toFixed(2);
              alerts.push({
                id: `reminder-${pool.id}-${pool.currentCycle}`,
                type: "reminder",
                title: "Contribution Due Soon",
                message: `Your contribution of $${amount} for "${pool.name}" is due ${formatDistanceToNow(new Date(endTime * 1000), { addSuffix: true })}`,
                poolId: pool.id,
              });
            }
          }
        }
      });

      // Check for recent payouts (user won in last 7 days)
      userCycles.forEach((cycle) => {
        if (cycle.winner.toLowerCase() === address.toLowerCase()) {
          const cycleTimestamp = Number(cycle.createdAtTimestamp) * 1000;
          const daysSince = (Date.now() - cycleTimestamp) / (1000 * 60 * 60 * 24);
          
          if (daysSince <= 7) {
            const pool = userPools.find((p) => p.id.toLowerCase() === cycle.poolId.toLowerCase());
            if (pool) {
              const amount = (Number(cycle.prize) / 1e6).toFixed(2);
              alerts.push({
                id: `payout-${cycle.id}`,
                type: "success",
                title: "Payout Received",
                message: `You received $${amount} from "${pool.name}" cycle ${cycle.index + 1}`,
                poolId: pool.id,
              });
            }
          }
        }
      });

      // Sort by type (reminders first, then success)
      alerts.sort((a, b) => {
        if (a.type === "reminder" && b.type !== "reminder") return -1;
        if (a.type !== "reminder" && b.type === "reminder") return 1;
        return 0;
      });

      return alerts.slice(0, 5); // Limit to 5 alerts
    },
    enabled: !!address,
    refetchInterval: 10000,
  });
}

