"use client";

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { SancaPoolAbi } from "@/lib/abis";
import { parseUnits } from "viem";
import { useMemo } from "react";

/**
 * Hook untuk join pool
 */
export function useJoinPool(poolAddress: `0x${string}` | undefined) {
  // Read pool info untuk calculate full collateral
  const { data: poolInfo } = useReadContract({
    address: poolAddress,
    abi: SancaPoolAbi,
    functionName: "getPoolInfo",
    query: {
      enabled: !!poolAddress,
    },
  });

  // Calculate full collateral needed
  const fullCollateral = useMemo(() => {
    if (!poolInfo) return undefined;
    // poolInfo structure: [state, maxMembers, currentMembers, contributionPerPeriod, ...]
    const maxMembers = poolInfo[1] as number;
    const contributionPerPeriod = poolInfo[3] as bigint;
    return contributionPerPeriod * BigInt(maxMembers);
  }, [poolInfo]);

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const join = async () => {
    if (!poolAddress) {
      throw new Error("Pool address is required");
    }

    // Note: User needs to approve USDC first before calling join()
    // We'll handle approval separately
    writeContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: "join",
    });
  };

  return {
    join,
    fullCollateral,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    poolInfo,
  };
}

