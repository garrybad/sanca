"use client";

import { useQuery } from "@tanstack/react-query";
import { queryPonder, type Pool, type Member, type Cycle, type CycleContribution } from "@/lib/ponder";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";

export interface UserTransaction {
  id: string;
  type: "send" | "receive";
  circle: string;
  amount: string;
  date: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
  description: string;
}

/**
 * Hook untuk get user transactions dari semua pools
 */
export function useUserTransactions() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["userTransactions", address],
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

      // Filter user's data
      const userMembers = membersData.memberss.items.filter(
        (m) => m.address.toLowerCase() === address.toLowerCase()
      );
      const userPoolIds = new Set(userMembers.map((m) => m.poolId.toLowerCase()));

      const poolsMap = new Map(
        poolsData.poolss.items
          .filter((p) => userPoolIds.has(p.id.toLowerCase()))
          .map((p) => [p.id.toLowerCase(), p])
      );

      const userContributions = contributionsData.cycleContributionss.items.filter(
        (cc) => cc.memberAddress.toLowerCase() === address.toLowerCase()
      );
      const userWins = cyclesData.cycless.items.filter(
        (c) => c.winner.toLowerCase() === address.toLowerCase()
      );

      const transactions: UserTransaction[] = [];

      // Add join transactions (send - initial collateral)
      userMembers.forEach((member) => {
        const pool = poolsMap.get(member.poolId.toLowerCase());
        if (pool) {
          const amount = (Number(member.contribution) / 1e6).toFixed(2);
          transactions.push({
            id: `join-${member.id}`,
            type: "send",
            circle: pool.name,
            amount: `$${amount}`,
            date: formatDistanceToNow(new Date(Number(member.joinedAtTimestamp) * 1000), {
              addSuffix: true,
            }),
            timestamp: new Date(Number(member.joinedAtTimestamp) * 1000),
            status: "completed",
            description: `Joined "${pool.name}"`,
          });
        }
      });

      // Add contribution transactions (send)
      userContributions.forEach((contrib) => {
        if (!contrib.isLiquidated) {
          const pool = poolsMap.get(contrib.poolId.toLowerCase());
          if (pool) {
            const amount = (Number(contrib.amount) / 1e6).toFixed(2);
            transactions.push({
              id: `contribute-${contrib.id}`,
              type: "send",
              circle: pool.name,
              amount: `$${amount}`,
              date: formatDistanceToNow(new Date(Number(contrib.createdAtTimestamp) * 1000), {
                addSuffix: true,
              }),
              timestamp: new Date(Number(contrib.createdAtTimestamp) * 1000),
              status: "completed",
              description: `Contributed to cycle ${contrib.cycleIndex + 1} in "${pool.name}"`,
            });
          }
        }
      });

      // Add payout transactions (receive)
      userWins.forEach((cycle) => {
        const pool = poolsMap.get(cycle.poolId.toLowerCase());
        if (pool) {
          const amount = (Number(cycle.prize) / 1e6).toFixed(2);
          transactions.push({
            id: `payout-${cycle.id}`,
            type: "receive",
            circle: pool.name,
            amount: `$${amount}`,
            date: formatDistanceToNow(new Date(Number(cycle.createdAtTimestamp) * 1000), {
              addSuffix: true,
            }),
            timestamp: new Date(Number(cycle.createdAtTimestamp) * 1000),
            status: "completed",
            description: `Won cycle ${cycle.index + 1} in "${pool.name}"`,
          });
        }
      });

      // Sort by timestamp (newest first)
      transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return transactions;
    },
    enabled: !!address,
    refetchInterval: 10000,
  });
}

