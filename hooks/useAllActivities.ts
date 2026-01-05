"use client";

import { useQuery } from "@tanstack/react-query";
import { queryPonder, type Pool, type Member, type Cycle, type CycleContribution } from "@/lib/ponder";
import { useAccount } from "wagmi";

/**
 * Hook untuk get semua activities dari pools yang user ikuti
 */
export function useAllActivities() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["allActivities", address],
    queryFn: async () => {
      if (!address) return [];

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
              cycleStartTime
              createdAtTimestamp
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
              joinedAtTimestamp
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
              prize
              createdAtTimestamp
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
              amount
              isLiquidated
              createdAtTimestamp
            }
          }
        }
      `);

      // Filter pools where user is a member
      const userMembers = membersData.memberss.items.filter(
        (m) => m.address.toLowerCase() === address.toLowerCase()
      );
      const userPoolIds = new Set(userMembers.map((m) => m.poolId.toLowerCase()));

      // Filter data by user's pools
      const userPools = poolsData.poolss.items.filter((p) =>
        userPoolIds.has(p.id.toLowerCase())
      );
      const userCycles = cyclesData.cycless.items.filter((c) =>
        userPoolIds.has(c.poolId.toLowerCase())
      );
      const userContributions = contributionsData.cycleContributionss.items.filter((cc) =>
        userPoolIds.has(cc.poolId.toLowerCase())
      );

      // Create pools map for quick lookup
      const poolsMap = new Map(userPools.map((p) => [p.id.toLowerCase(), p]));

      // Build activities array
      const activities: Array<{
        id: string;
        type: "contribution" | "payout" | "member_joined" | "cycle_completed" | "pool_created" | "pool_started" | "pool_completed" | "collateral_liquidated";
        title: string;
        description: string;
        circle: string;
        member?: string;
        amount?: string;
        date: string;
        timestamp: Date;
      }> = [];

      // Add pool created events
      userPools.forEach((pool) => {
        activities.push({
          id: `pool-created-${pool.id}`,
          type: "pool_created",
          title: "Pool Created",
          description: `Pool "${pool.name}" was created`,
          circle: pool.name,
          timestamp: new Date(Number(pool.createdAtTimestamp) * 1000),
          date: new Date(Number(pool.createdAtTimestamp) * 1000).toLocaleDateString(),
        });
      });

      // Add pool started events
      userPools.forEach((pool) => {
        if ((pool.state === "Active" || pool.state === "Completed") && Number(pool.cycleStartTime) > 0) {
          activities.push({
            id: `pool-started-${pool.id}`,
            type: "pool_started",
            title: "Pool Started",
            description: `Pool "${pool.name}" is now active`,
            circle: pool.name,
            timestamp: new Date(Number(pool.cycleStartTime) * 1000),
            date: new Date(Number(pool.cycleStartTime) * 1000).toLocaleDateString(),
          });
        }
      });

      // Add member joined events (only for user's pools)
      userMembers.forEach((member) => {
        const pool = poolsMap.get(member.poolId.toLowerCase());
        if (pool) {
          activities.push({
            id: `member-${member.id}`,
            type: "member_joined",
            title: member.address.toLowerCase() === address.toLowerCase() 
              ? "You Joined" 
              : "New Member Joined",
            description: member.address.toLowerCase() === address.toLowerCase()
              ? `You joined "${pool.name}"`
              : `New member joined "${pool.name}"`,
            circle: pool.name,
            timestamp: new Date(Number(member.joinedAtTimestamp) * 1000),
            date: new Date(Number(member.joinedAtTimestamp) * 1000).toLocaleDateString(),
          });
        }
      });

      // Add contribution events
      userContributions.forEach((contrib) => {
        const pool = poolsMap.get(contrib.poolId.toLowerCase());
        if (pool) {
          const isUser = contrib.memberAddress.toLowerCase() === address.toLowerCase();
          const amount = (Number(contrib.amount) / 1e6).toFixed(2);
          
          if (contrib.isLiquidated) {
            activities.push({
              id: `liquidated-${contrib.id}`,
              type: "collateral_liquidated",
              title: "Collateral Liquidated",
              description: isUser
                ? `Your collateral was liquidated for cycle ${contrib.cycleIndex + 1} in "${pool.name}"`
                : `Member's collateral was liquidated for cycle ${contrib.cycleIndex + 1} in "${pool.name}"`,
              circle: pool.name,
              amount: `$${amount}`,
              timestamp: new Date(Number(contrib.createdAtTimestamp) * 1000),
              date: new Date(Number(contrib.createdAtTimestamp) * 1000).toLocaleDateString(),
            });
          } else {
            activities.push({
              id: `contributed-${contrib.id}`,
              type: "contribution",
              title: isUser ? "Your Contribution" : "Contribution Received",
              description: isUser
                ? `You contributed $${amount} to cycle ${contrib.cycleIndex + 1} in "${pool.name}"`
                : `Contribution of $${amount} received for cycle ${contrib.cycleIndex + 1} in "${pool.name}"`,
              circle: pool.name,
              amount: `$${amount}`,
              timestamp: new Date(Number(contrib.createdAtTimestamp) * 1000),
              date: new Date(Number(contrib.createdAtTimestamp) * 1000).toLocaleDateString(),
            });
          }
        }
      });

      // Add payout events
      userCycles.forEach((cycle) => {
        if (cycle.winner) {
          const pool = poolsMap.get(cycle.poolId.toLowerCase());
          if (pool) {
            const isUser = cycle.winner.toLowerCase() === address.toLowerCase();
            const amount = (Number(cycle.prize) / 1e6).toFixed(2);
            
            activities.push({
              id: `cycle-${cycle.id}`,
              type: "payout",
              title: isUser ? "You Won!" : "Payout Completed",
              description: isUser
                ? `You won cycle ${cycle.index + 1} in "${pool.name}"`
                : `Winner received payout for cycle ${cycle.index + 1} in "${pool.name}"`,
              circle: pool.name,
              amount: `$${amount}`,
              timestamp: new Date(Number(cycle.createdAtTimestamp) * 1000),
              date: new Date(Number(cycle.createdAtTimestamp) * 1000).toLocaleDateString(),
            });
          }
        }
      });

      // Add pool completed events
      userPools.forEach((pool) => {
        if (pool.state === "Completed") {
          const lastCycle = userCycles
            .filter((c) => c.poolId.toLowerCase() === pool.id.toLowerCase())
            .sort((a, b) => b.index - a.index)[0];
          
          if (lastCycle) {
            activities.push({
              id: `pool-completed-${pool.id}`,
              type: "pool_completed",
              title: "Pool Completed",
              description: `All cycles completed for "${pool.name}"`,
              circle: pool.name,
              timestamp: new Date(Number(lastCycle.createdAtTimestamp) * 1000),
              date: new Date(Number(lastCycle.createdAtTimestamp) * 1000).toLocaleDateString(),
            });
          }
        }
      });

      // Sort by timestamp (newest first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return activities;
    },
    enabled: !!address,
    refetchInterval: 10000,
  });
}

