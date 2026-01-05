/**
 * Ponder API configuration
 * Default Ponder dev server runs on http://localhost:42069
 * Production: Set via NEXT_PUBLIC_PONDER_URL env var
 */
export const PONDER_URL =
  process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

export const PONDER_GRAPHQL_URL = `${PONDER_URL}/graphql`;

/**
 * GraphQL queries for Ponder
 */

// Query untuk get semua pools
export const GET_POOLS_QUERY = `
  query GetPools {
    poolss {
      items {
        id
        creator
        name
        maxMembers
        contributionPerPeriod
        periodDuration
        yieldBonusSplit
        state
        currentCycle
        totalCycles
        cycleStartTime
        createdAtTimestamp
      }
    }
  }
`;

// Query untuk get pool detail dengan members & cycles
export const GET_POOL_DETAIL_QUERY = `
  query GetPoolDetail($id: String!) {
    pools(id: $id) {
      id
      creator
      name
      description
      maxMembers
      contributionPerPeriod
      periodDuration
      yieldBonusSplit
      state
      currentCycle
      totalCycles
      cycleStartTime
      createdAtTimestamp
    }
    memberss {
      items {
        id
        poolId
        address
        contribution
        joinedAtTimestamp
      }
    }
    cycless {
      items {
        id
        poolId
        index
        winner
        prize
        yieldBonus
        compounded
        createdAtTimestamp
      }
    }
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
`;

// Query untuk get activity events (untuk Activity tab)
export const GET_POOL_ACTIVITY_QUERY = `
  query GetPoolActivity($poolId: String!) {
    cycleContributionss(where: { poolId: { equals: $poolId } }) {
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
`;

// Query untuk get pools milik user tertentu
export const GET_USER_POOLS_QUERY = `
  query GetUserPools {
    memberss {
      items {
        poolId
        address
        contribution
        joinedAtTimestamp
      }
    }
  }
`;

/**
 * Types untuk Ponder responses
 */
export interface Pool {
  id: string;
  creator: string;
  name: string;
  description: string;
  maxMembers: number;
  contributionPerPeriod: bigint;
  periodDuration: bigint;
  yieldBonusSplit: number;
  state: "Open" | "Active" | "Completed";
  currentCycle: number;
  totalCycles: number;
  cycleStartTime: bigint;
  createdAtTimestamp: bigint;
}

export interface Member {
  id: string;
  poolId: string;
  address: string;
  contribution: bigint;
  joinedAtTimestamp: bigint;
}

export interface Cycle {
  id: string;
  poolId: string;
  index: number;
  winner: string;
  prize: bigint;
  yieldBonus: bigint;
  compounded: bigint;
  createdAtTimestamp: bigint;
}

export interface CycleContribution {
  id: string;
  poolId: string;
  cycleIndex: number;
  memberAddress: string;
  amount: bigint;
  isLiquidated: boolean;
  createdAtTimestamp: bigint;
}

/**
 * Helper untuk execute GraphQL query ke Ponder
 */
export async function queryPonder<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const response = await fetch(PONDER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ponder query failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

