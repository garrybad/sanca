"use client";

import { useQuery } from "@tanstack/react-query";
import {
  GET_POOLS_QUERY,
  GET_POOL_DETAIL_QUERY,
  GET_USER_POOLS_QUERY,
  queryPonder,
  type Pool,
  type Member,
  type Cycle,
  type CycleContribution,
} from "@/lib/ponder";
import { useAccount } from "wagmi";

/**
 * Hook untuk get semua pools dengan filter
 */
export function usePools(options?: {
  state?: "Open" | "Active" | "Completed";
  limit?: number;
}) {
  return useQuery({
    queryKey: ["pools", options],
    queryFn: async () => {
      const data = await queryPonder<{ poolss: { items: Pool[] } }>(GET_POOLS_QUERY);

      let pools = data.poolss.items;

      // Filter by state if provided
      if (options?.state) {
        pools = pools.filter((p) => p.state === options.state);
      }

      // Sort by createdAtTimestamp descending
      pools.sort((a, b) => {
        const aTime = Number(a.createdAtTimestamp);
        const bTime = Number(b.createdAtTimestamp);
        return bTime - aTime;
      });

      // Apply limit if provided
      if (options?.limit) {
        pools = pools.slice(0, options.limit);
      }

      return pools;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

/**
 * Hook untuk get pool detail dengan members & cycles
 */
export function usePoolDetail(poolId: string | null) {
  return useQuery({
    queryKey: ["pool", poolId],
    queryFn: async () => {
      if (!poolId) return null;

      const data = await queryPonder<{
        pools: Pool | null;
        memberss: { items: Member[] };
        cycless: { items: Cycle[] };
        cycleContributionss: { items: CycleContribution[] };
      }>(GET_POOL_DETAIL_QUERY, {
        id: poolId,
      });

      // Filter members, cycles, and contributions by poolId
      const members = data.memberss.items.filter((m) => m.poolId.toLowerCase() === poolId.toLowerCase());
      const cycles = data.cycless.items.filter((c) => c.poolId.toLowerCase() === poolId.toLowerCase());
      const cycleContributions = data.cycleContributionss.items.filter(
        (cc) => cc.poolId.toLowerCase() === poolId.toLowerCase()
      );

      // Sort cycles by index
      cycles.sort((a, b) => a.index - b.index);
      // Sort contributions by cycleIndex
      cycleContributions.sort((a, b) => a.cycleIndex - b.cycleIndex);

      return {
        pool: data.pools,
        members,
        cycles,
        cycleContributions,
      };
    },
    enabled: !!poolId,
    refetchInterval: 10000,
  });
}

/**
 * Hook untuk get pools milik user yang sedang connect
 */
export function useUserPools() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["userPools", address],
    queryFn: async () => {
      if (!address) return [];

      // Get all members
      const membersData = await queryPonder<{
        memberss: { items: Member[] };
      }>(GET_USER_POOLS_QUERY);

      // Filter by user address
      const userMembers = membersData.memberss.items.filter(
        (m) => m.address.toLowerCase() === address.toLowerCase()
      );

      // Get pool details for each pool
      const poolsData = await queryPonder<{ poolss: { items: Pool[] } }>(GET_POOLS_QUERY);
      const poolsMap = new Map(poolsData.poolss.items.map((p) => [p.id.toLowerCase(), p]));

      // Combine member data with pool data
      return userMembers
        .map((m) => {
          const pool = poolsMap.get(m.poolId.toLowerCase());
          if (!pool) return null;
          return {
            ...pool,
            userContribution: m.contribution,
            userJoinedAt: m.joinedAtTimestamp,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    },
    enabled: !!address,
    refetchInterval: 10000,
  });
}

