import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { SancaPoolAbi } from "@/lib/abis";
import { parseUnits } from "viem";

export function useContribute(poolAddress: `0x${string}` | undefined) {
  const { address } = useAccount();

  // Read pool's contributionPerPeriod
  const { data: poolConfig } = useReadContract({
    address: poolAddress,
    abi: SancaPoolAbi,
    functionName: "getPoolInfo",
    query: {
      enabled: !!poolAddress,
    },
  });

  const contributionPerPeriod = poolConfig ? poolConfig[3] : BigInt(0);

  const {
    writeContract,
    data: hash,
    isPending,
    error,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const contribute = async () => {
    if (!poolAddress) return;

    writeContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: "contribute",
      args: [],
    });
  };

  return {
    contribute,
    contributionPerPeriod,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

