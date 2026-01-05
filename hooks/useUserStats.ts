"use client";

import { useQuery } from "@tanstack/react-query";
import { queryPonder, type Pool, type Member, type Cycle, type CycleContribution } from "@/lib/ponder";
import { useAccount } from "wagmi";

/**
 * Hook untuk get user stats (total contributed, received, pending, etc)
 */
export function useUserStats() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["userStats", address],
    queryFn: async () => {
      if (!address) {
        return {
          totalContributed: 0,
          totalReceived: 0,
          pendingPayouts: 0,
          totalPools: 0,
          activePools: 0,
          completedPools: 0,
        };
      }

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
              contribution
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

      // Calculate total contributed (from contributions + initial collateral)
      let totalContributed = 0;
      
      // Add initial collateral (from members.contribution)
      userMembers.forEach((member) => {
        totalContributed += Number(member.contribution) / 1e6;
      });

      // Add cycle contributions
      userContributions.forEach((contrib) => {
        if (!contrib.isLiquidated) {
          totalContributed += Number(contrib.amount) / 1e6;
        }
      });

      // Calculate total received (from payouts where user is winner)
      let totalReceived = 0;
      userCycles.forEach((cycle) => {
        if (cycle.winner.toLowerCase() === address.toLowerCase()) {
          totalReceived += Number(cycle.prize) / 1e6;
        }
      });

      // Calculate pending payouts (active pools where user hasn't won yet)
      let pendingPayouts = 0;
      const activePools = userPools.filter((p) => p.state === "Active");
      activePools.forEach((pool) => {
        const poolCycles = userCycles.filter(
          (c) => c.poolId.toLowerCase() === pool.id.toLowerCase()
        );
        const userWon = poolCycles.some(
          (c) => c.winner.toLowerCase() === address.toLowerCase()
        );
        
        if (!userWon) {
          // Calculate potential payout (contributionPerPeriod * maxMembers)
          const potentialPayout = (Number(pool.contributionPerPeriod) / 1e6) * pool.maxMembers;
          pendingPayouts += potentialPayout;
        }
      });

      return {
        totalContributed,
        totalReceived,
        pendingPayouts,
        totalPools: userPools.length,
        activePools: activePools.length,
        completedPools: userPools.filter((p) => p.state === "Completed").length,
      };
    },
    enabled: !!address,
    refetchInterval: 10000,
  });
}

