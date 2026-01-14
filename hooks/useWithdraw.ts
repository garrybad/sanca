"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { SancaPoolAbi } from "@/lib/abis";

/**
 * Hook untuk withdraw funds setelah pool completed
 */
export function useWithdraw(poolAddress: `0x${string}` | undefined) {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const withdraw = async () => {
    if (!poolAddress) {
      throw new Error("Pool address is required");
    }

    writeContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: "withdraw",
    });
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

