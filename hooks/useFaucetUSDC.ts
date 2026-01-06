"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

// USDC ABI - faucet function
const USDC_ABI = [
  {
    name: "faucet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const;

/**
 * Hook untuk faucet USDC
 * Mints fixed 1,000 USDC per call (rate limited by contract)
 */
export function useFaucetUSDC() {
  const { address, isConnected } = useAccount();
  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const faucet = async () => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet");
    }

    // Call faucet() function - mints fixed 1,000 USDC
    writeContract({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: "faucet",
      args: [],
    });
  };

  return {
    faucet,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

