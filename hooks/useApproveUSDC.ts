"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";
import { parseUnits } from "viem";
import { erc20Abi } from "viem";

/**
 * Hook untuk approve USDC spending
 */
export function useApproveUSDC() {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (spender: `0x${string}`, amount: bigint) => {
    writeContract({
      address: CONTRACTS.USDC,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  const approveMax = async (spender: `0x${string}`) => {
    // Max uint256
    const maxAmount = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    approve(spender, maxAmount);
  };

  return {
    approve,
    approveMax,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

